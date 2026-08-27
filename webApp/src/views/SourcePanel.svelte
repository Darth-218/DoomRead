<script lang="ts">
  import { tick } from 'svelte'
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

  // Render a sliding window of words around the current reading position so the
  // DOM stays bounded. BUFFER_* is the base look-behind/ahead around the reader
  // (doubled from the old window); manual scrolling grows the range further via
  // CHUNK loads so the whole document can be browsed seamlessly.
  const BUFFER_BEFORE = 200
  const BUFFER_AFTER = 600
  const EDGE = 40
  const CHUNK = 120
  const SCROLL_TRIGGER = 240

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

  // Stateful slice of `nodes` we actually render. For PDF the whole page is
  // shown; for the unbounded whole-document (epub/txt) view this window slides
  // with the reader and grows on manual scroll.
  let renderStart = $state(0)
  let renderEnd = $state(0)

  function expandTo(i: number) {
    renderStart = Math.max(0, i - BUFFER_BEFORE)
    renderEnd = Math.min(nodes.length, i + BUFFER_AFTER + 1)
  }

  const visible = $derived(
    nodes.length === 0 ? [] : isPdf ? nodes : nodes.slice(renderStart, renderEnd),
  )

  // Reading completion (% through the source text) shown in the pager slot for
  // non-PDF docs so the pager reserves identical vertical space across types.
  const completionPct = $derived(
    text.length > 0
      ? Math.min(100, Math.round((readerBus.currentOffset / text.length) * 100))
      : 0,
  )

  // Word progress ("word X of Y") shown beneath the pager for non-PDF docs.
  // wordCountUpTo[i] is the number of word nodes among nodes[0..i], so the
  // current/total counts are O(1) lookups after one O(n) pass per document.
  const wordCountUpTo = $derived.by(() => {
    const counts: number[] = []
    let c = 0
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].type === 'word') c++
      counts.push(c)
    }
    return counts
  })
  const totalWords = $derived(wordCountUpTo.length ? wordCountUpTo[wordCountUpTo.length - 1] : 0)
  const currentWord = $derived(wordCountUpTo[activeIdx] ?? 0)

  let container: HTMLElement | null = $state(null)

  $effect(() => {
    const off = readerBus.currentOffset
    if (!container) return
    const el = container.querySelector(`[data-offset="${off}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })

  // When a new document (set of nodes) loads, (re)initialize the window around
  // the reader and reset scroll to the top. Guarded so it only fires on a nodes
  // change, not on every reader tick.
  let lastNodes: Node[] | null = null
  $effect(() => {
    const n = nodes
    if (n === lastNodes) return
    lastNodes = n
    if (n.length === 0) {
      renderStart = 0
      renderEnd = 0
      return
    }
    expandTo(activeIdx)
    if (container) container.scrollTop = 0
  })

  // Keep the reader's word inside the rendered window as RSVP advances or when a
  // seek/click lands near the edge; the fixed buffer also drops text behind you.
  $effect(() => {
    const i = activeIdx
    if (!isPdf || nodes.length === 0) return
    if (i < renderStart + EDGE || i >= renderEnd - EDGE) expandTo(i)
  })

  // Grow the rendered range as the user scrolls, so older/newer text appears
  // before the edge is reached. Inserting nodes above the viewport is kept
  // stable by the browser's native scroll anchoring, so we don't touch
  // scrollTop here (doing so would fight it and snap back to the reader).
  async function onScroll() {
    if (isPdf || !container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    if (scrollTop < SCROLL_TRIGGER && renderStart > 0) {
      renderStart = Math.max(0, renderStart - CHUNK)
      await tick()
    } else if (scrollHeight - (scrollTop + clientHeight) < SCROLL_TRIGGER && renderEnd < nodes.length) {
      renderEnd = Math.min(nodes.length, renderEnd + CHUNK)
      await tick()
    }
  }

  function goPage(delta: number, e: MouseEvent) {
    const i = currentPageIdx + delta
    if (i < 0 || i >= pages.length) return
    jumpTo(pages[i].start)
    ;(e.currentTarget as HTMLElement).blur()
  }

  // Click / tap the page indicator to type a page number and jump straight to
  // it. Entries are clamped to the valid range and escape/blur cancels.
  let editingPage = $state(false)
  let pageInput = $state('')
  let pageInputEl = $state<HTMLInputElement | null>(null)

  function startEditPage() {
    if (!isPdf || pages.length === 0) return
    pageInput = String(pages[currentPageIdx].number)
    editingPage = true
  }

  function commitPage() {
    if (!editingPage) return
    const v = parseInt(pageInput, 10)
    editingPage = false
    if (!Number.isFinite(v)) return
    const i = Math.min(pages.length, Math.max(1, v)) - 1
    jumpTo(pages[i].start)
  }

  $effect(() => {
    if (editingPage && pageInputEl) pageInputEl.focus()
  })
</script>

<div class="panel">
  <div class="source" bind:this={container} onscroll={onScroll}>
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
      {#if editingPage}
        <input
          class="pageinput"
          type="text"
          inputmode="numeric"
          bind:this={pageInputEl}
          bind:value={pageInput}
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              editingPage = false
            }
          }}
          onblur={commitPage}
          size="3"
        />
      {:else}
        <span
          class="pageinfo"
          role="button"
          tabindex="0"
          title="Click to jump to a page"
          onclick={startEditPage}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              startEditPage()
            }
          }}>Page {pages[currentPageIdx].number} / {pages.length}</span>
      {/if}
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
  {#if !isPdf}
    <p class="wordcount">word {currentWord} of {totalWords}</p>
  {/if}
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
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--fg);
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
    color: var(--muted-2);
    min-width: 7rem;
    text-align: center;
  }
  .pageinfo:hover {
    color: var(--fg);
    text-decoration: underline;
    cursor: text;
  }
  .pageinput {
    font: inherit;
    font-size: 0.9rem;
    color: var(--fg);
    min-width: 7rem;
    text-align: center;
    border: 1px solid var(--border);
    border-radius: 0.3rem;
    padding: 0.15rem 0.4rem;
  }
  .wordcount {
    margin: 0.75rem 0 0;
    font-size: 0.9rem;
    color: var(--muted);
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
    line-height: 1.9;
    font-size: 1.05rem;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: none;
    scrollbar-width: none;
  }
  .source::-webkit-scrollbar {
    display: none;
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
    background: var(--hover);
  }
  .word.active {
    background: var(--word-active-bg);
    color: var(--word-active-fg);
    font-weight: 600;
  }
</style>
