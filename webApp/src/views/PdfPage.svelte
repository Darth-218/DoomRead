<script lang="ts">
  import { readerBus, jumpTo } from '../lib/readerBus.svelte'
  import type { PdfPageData } from '../lib/stores.svelte'

  // Pages are rasterized at this scale in the importer; the text-layer
  // coordinates are in unscaled PDF space, so we scale them to match.
  const SCALE = 1.5

  let { page }: { page: PdfPageData } = $props()
</script>

<div class="pdf-page" style="width:{page.width}px;height:{page.height}px">
  <img src={page.image} alt="" />
  <div class="textLayer">
    {#each page.content.items as it, idx}
      {#if it.str}
        {@const offset = page.offsets[idx]}
        {@const t = it.transform ?? [0, 0, 0, 0, 0, 0]}
        {@const h = it.height ?? 0}
        <span
          class="tl"
          class:active={offset === readerBus.currentOffset}
          data-offset={offset}
          style="left:{t[4] * SCALE}px;top:{(page.height - t[5] * SCALE) - h * SCALE}px;font-size:{h * SCALE}px"
          role="button"
          tabindex="0"
          onclick={() => offset >= 0 && jumpTo(offset)}
          onkeydown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && offset >= 0) {
              e.preventDefault()
              jumpTo(offset)
            }
          }}>{it.str}</span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .pdf-page {
    position: relative;
    margin: 0 auto 1rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
  .pdf-page img {
    width: 100%;
    height: 100%;
    display: block;
  }
  .textLayer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .tl {
    position: absolute;
    color: transparent;
    background: transparent;
    pointer-events: auto;
    cursor: pointer;
    white-space: pre;
  }
  .tl:hover {
    background: rgba(0, 0, 0, 0.08);
  }
  .tl.active {
    background: rgba(255, 224, 138, 0.75);
  }
</style>
