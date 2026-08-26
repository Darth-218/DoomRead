<script lang="ts">
  import { readerBus, jumpTo } from '../lib/readerBus.svelte'
  import type { ChapterMeta } from '../lib/stores.svelte'

  let { chapters }: { chapters?: ChapterMeta[] } = $props()

  // Index of the chapter containing the currently read offset: the last
  // chapter whose start offset is <= currentOffset.
  const active = $derived.by(() => {
    if (!chapters || chapters.length === 0) return -1
    let idx = 0
    for (let i = 0; i < chapters.length; i++) {
      if (chapters[i].offset <= readerBus.currentOffset) idx = i
      else break
    }
    return idx
  })
</script>

{#if chapters && chapters.length > 0}
  <nav class="chapters" aria-label="Chapters">
    {#each chapters as ch, i (i)}
      <button
        class="chip"
        class:active={i === active}
        onclick={() => jumpTo(ch.offset)}
        title={ch.title}
      >{ch.title}</button>
    {/each}
  </nav>
{/if}

<style>
  .chapters {
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
    width: 100%;
    max-width: 1100px;
    padding-bottom: 0.25rem;
  }
  .chip {
    flex: 0 0 auto;
    white-space: nowrap;
    border: 1px solid #ddd;
    background: #fff;
    color: #444;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .chip:hover {
    background: #f0f0f0;
  }
  .chip.active {
    background: #222;
    color: #fff;
    border-color: #222;
  }
</style>
