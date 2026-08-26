<script lang="ts">
  import { readerBus, jumpTo } from '../lib/readerBus.svelte'

  let { text }: { text: string } = $props()

  interface Node {
    type: 'word' | 'text'
    text: string
    offset?: number
  }

  // Mirror the core tokenizer's notion of a "word char" so the offsets we
  // compute here line up with the offsets the pacing engine reports per step.
  const intra = ["'", '’', '-', '‐']
  function isWordChar(ch: string): boolean {
    return /\p{L}|\p{N}/u.test(ch) || intra.includes(ch)
  }

  function build(source: string): Node[] {
    const nodes: Node[] = []
    let i = 0
    const n = source.length
    while (i < n) {
      if (isWordChar(source[i])) {
        const start = i
        let buf = ''
        while (i < n && isWordChar(source[i])) {
          buf += source[i]
          i++
        }
        nodes.push({ type: 'word', text: buf, offset: start })
      } else {
        let buf = ''
        while (i < n && !isWordChar(source[i])) {
          buf += source[i]
          i++
        }
        nodes.push({ type: 'text', text: buf })
      }
    }
    return nodes
  }

  const nodes = $derived(build(text))

  let container: HTMLElement | null = $state(null)

  $effect(() => {
    const off = readerBus.currentOffset
    if (!container) return
    const el = container.querySelector(`[data-offset="${off}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
</script>

<div class="source" bind:this={container}>
  {#each nodes as node, i (i)}
      {#if node.type === 'word'}
        <span
          class="word"
          class:active={node.offset === readerBus.currentOffset}
          data-offset={node.offset}
          role="button"
          tabindex="0"
          onclick={() => node.offset !== undefined && jumpTo(node.offset)}
          onkeydown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && node.offset !== undefined) {
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
