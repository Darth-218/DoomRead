<script lang="ts">
  import { readerBus, jumpTo } from '../lib/readerBus.svelte'

  let { text }: { text: string } = $props()

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

  const nodes = $derived(build(text))
  const activeIdx = $derived(indexForOffset(nodes, readerBus.currentOffset))
  const visible = $derived(
    nodes.length === 0
      ? []
      : nodes.slice(
          Math.max(0, activeIdx - WINDOW_BEFORE),
          Math.min(nodes.length, activeIdx + WINDOW_AFTER + 1),
        ),
  )

  let container: HTMLElement | null = $state(null)

  $effect(() => {
    const off = readerBus.currentOffset
    if (!container) return
    const el = container.querySelector(`[data-offset="${off}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
</script>

<div class="source" bind:this={container}>
  {#each visible as node (node.offset)}
      {#if node.type === 'word'}
        <span
          class="word"
          class:active={node.offset === readerBus.currentOffset}
          data-offset={node.offset}
          role="button"
          tabindex="0"
          onclick={() => jumpTo(node.offset)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              jumpTo(node.offset)
            }
          }}>{node.text}</span>
      {:else}
        <span class="text">{node.text}</span>
      {/if}
    {/each}
</div>

<style>
  .source {
    flex: 1 1 0;
    min-width: 0;
    max-height: 70vh;
    overflow: auto;
    padding: 1rem 1.25rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    line-height: 1.9;
    font-size: 1.05rem;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: none;
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
