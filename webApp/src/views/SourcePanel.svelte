<script lang="ts">
  import { readerBus, jumpTo } from '../lib/readerBus.svelte'
  import type { DocType } from '../lib/importers'

  let { text, type }: { text: string; type?: DocType } = $props()

  interface Node {
    type: 'word' | 'text'
    text: string
    offset: number
  }

  // Mirror the core tokenizer's notion of a "word char" so the offsets we
  // compute here line up with the offsets the pacing engine reports per step.
  const intra = ["'", '’', '-', '‐']
  function isWordChar(ch: string): boolean {
    return /\p{L}|\p{N}/u.test(ch) || intra.includes(ch)
  }

  // Build lightweight word/text chunks. Every node carries its start offset so
  // the list stays monotonic and can be binary-searched for the active word.
  function build(source: string): Node[] {
    const nodes: Node[] = []
    let i = 0
    const n = source.length
    while (i < n) {
      const start = i
      const word = isWordChar(source[i])
      let buf = ''
      while (i < n && isWordChar(source[i]) === word) {
        buf += source[i]
        i++
      }
      nodes.push({ type: word ? 'word' : 'text', text: buf, offset: start })
    }
    return nodes
  }

  // Only render a window of words around the current reading position so the
  // DOM stays bounded no matter how long the document is.
  const WINDOW_BEFORE = 100
  const WINDOW_AFTER = 300

  // Largest index whose node starts at or before `offset` (nodes are sorted).
  function indexForOffset(nodes: Node[], offset: number): number {
    let lo = 0
    let hi = nodes.length - 1
    let res = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (nodes[mid].offset <= offset) {
        res = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return res
  }

  // --- PDF paging -----------------------------------------------------------
  // PDFs import as one block of text with pages separated by blank lines, so a
  // "page" is a maximal run delimited by /\n\n+/. Each page keeps its absolute
  // [start,end] in the original string so word offsets stay aligned. Pages
  // whose text is empty (e.g. fully stripped boilerplate) are dropped.
  interface Page {
    start: number
    end: number
    text: string
    number: number
  }

  function pagesOf(source: string): Page[] {
    const pages: Page[] = []
    const re = /\n\n+/g
    let last = 0
    let n = 0
    let m: RegExpExecArray | null
    const push = (start: number, end: number) => {
      const t = source.slice(start, end)
      if (!t.trim()) return
      n++
      pages.push({ start, end, text: t, number: n })
    }
    while ((m = re.exec(source))) {
      push(last, m.index)
      last = m.index + m[0].length
    }
    push(last, source.length)
    return pages
  }

  function pageIndexForOffset(pages: Page[], offset: number): number {
    if (pages.length === 0) return -1
    let res = 0
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].start <= offset) res = i
      else break
    }
    return res
  }

  const isPdf = $derived(type === 'pdf')
  const pages = $derived(isPdf ? pagesOf(text) : [])
  const currentPageIdx = $derived(
    pages.length ? pageIndexForOffset(pages, readerBus.currentOffset) : -1,
  )

  // The slice of text we render: the whole document for non-PDF, or the
  // current PDF page. Word nodes carry offsets absolute to the full text.
  const sourceText = $derived(
    isPdf && currentPageIdx >= 0 ? pages[currentPageIdx].text : text,
  )
  const baseOffset = $derived(
    isPdf && currentPageIdx >= 0 ? pages[currentPageIdx].start : 0,
  )

  const nodes = $derived(
    build(sourceText).map((node) => ({ ...node, offset: node.offset + baseOffset })),
  )
  const activeIdx = $derived(indexForOffset(nodes, readerBus.currentOffset))
  // In paginated (PDF) mode a page is shown whole and swaps to the next page
  // when the RSVP cursor crosses the boundary; windowing is only needed for the
  // unbounded whole-document (epub/txt) view.
  const visible = $derived(
    nodes.length === 0
      ? []
      : isPdf
        ? nodes
        : nodes.slice(
            Math.max(0, activeIdx - WINDOW_BEFORE),
            Math.min(nodes.length, activeIdx + WINDOW_AFTER + 1),
          ),
  )

  // Reading completion (% through the source text) shown in the pager slot for
  // non-PDF docs so the pager reserves identical vertical space across types.
  const completionPct = $derived(
    text.length > 0
      ? Math.min(100, Math.round((readerBus.currentOffset / text.length) * 100))
      : 0,
  )

  let container: HTMLElement | null = $state(null)

  $effect(() => {
    const off = readerBus.currentOffset
    if (!container) return
    const el = container.querySelector(`[data-offset="${off}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })

  function goPage(delta: number, e: MouseEvent) {
    const i = currentPageIdx + delta
    if (i < 0 || i >= pages.length) return
    jumpTo(pages[i].start)
    ;(e.currentTarget as HTMLElement).blur()
  }
</script>

<div class="panel">
  <div class="source" class:windowed={!isPdf} bind:this={container}>
    {#each visible as node (node.offset)}
      {#if node.type === 'word'}
        <span
          class="word"
          class:active={node.offset === readerBus.currentOffset}
          data-offset={node.offset}
          role="button"
          tabindex="0"
          onclick={(e) => {
            jumpTo(node.offset)
            e.currentTarget.blur()
          }}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              jumpTo(node.offset)
              e.currentTarget.blur()
            }
          }}>{node.text}</span>
      {:else}
        <span class="text">{node.text}</span>
      {/if}
    {/each}
  </div>

  <div class="pager">
    {#if isPdf && pages.length > 0}
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPageIdx <= 0}
        onclick={(e) => goPage(-1, e)}>←</button>
      <span class="pageinfo">Page {pages[currentPageIdx].number} / {pages.length}</span>
      <button
        type="button"
        aria-label="Next page"
        disabled={currentPageIdx >= pages.length - 1}
        onclick={(e) => goPage(1, e)}>→</button>
    {:else}
      <!-- Phantom controls: invisible but space-identical to the PDF pager,
           with a completion percentage in the middle so the page height
           stays the same across document types. -->
      <button type="button" class="phantom" aria-hidden="true" tabindex="-1">←</button>
      <span class="pageinfo">{completionPct}% read</span>
      <button type="button" class="phantom" aria-hidden="true" tabindex="-1">→</button>
    {/if}
  </div>
</div>

<style>
  .pager {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  .pager button {
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 0.4rem;
    padding: 0.2rem 0.7rem;
    cursor: pointer;
    font: inherit;
  }
  .pager button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .pager button.phantom {
    visibility: hidden;
  }
  .pageinfo {
    font-size: 0.9rem;
    color: #555;
    min-width: 7rem;
    text-align: center;
  }
  .panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .source {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    max-height: 80vh;
    overflow: auto;
    padding: 1.5rem 1.75rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    line-height: 1.9;
    font-size: 1.05rem;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: none;
  }
  /* Ease text in/out at the top and bottom of the windowed view so words don't
     hard-clip as the reading window scrolls. The centered active word (kept in
     the middle via scrollIntoView) stays fully opaque. PDF pages are shown
     whole, so the mask is only applied to the windowed (non-PDF) view. */
  .source.windowed {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 9%, #000 91%, transparent 100%);
            mask-image: linear-gradient(to bottom, transparent 0, #000 9%, #000 91%, transparent 100%);
  }
  .text {
    white-space: pre-wrap;
  }
  .word {
    cursor: pointer;
    border-radius: 0.2rem;
    padding: 0 1px;
  }
  .word:hover {
    background: #f0f0f0;
  }
  .word.active {
    background: #ffe08a;
    color: #111;
    font-weight: 600;
  }
</style>
