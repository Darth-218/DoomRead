<script lang="ts">
  import { onMount } from 'svelte'
  import { readerBus, jumpTo } from '../lib/readerBus.svelte'
  import type { PdfPageMeta } from '../lib/stores.svelte'

  // pdfDoc is a pdf.js PDFDocumentProxy (loaded once by the parent viewer).
  let { pdfDoc, index, meta, scale }: {
    pdfDoc: any
    index: number
    meta: PdfPageMeta
    scale: number
  } = $props()

  let slot: HTMLDivElement | null = $state(null)
  let canvas: HTMLCanvasElement | null = null
  let rendered = $state(false)
  let failed = $state(false)

  async function render() {
    if (rendered || failed || !canvas) return
    try {
      const page = await pdfDoc.getPage(index)
      const viewport = page.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (ctx) await page.render({ canvas, canvasContext: ctx, viewport }).promise
      rendered = true
    } catch {
      failed = true
    }
  }

  onMount(() => {
    if (!slot) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            void render()
            observer.disconnect()
          }
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(slot)
    return () => observer.disconnect()
  })
</script>

<div
  class="pdf-page"
  bind:this={slot}
  style="width:{meta.width * scale}px;height:{meta.height * scale}px"
>
  <canvas bind:this={canvas} class="page-canvas"></canvas>
  <div class="textLayer">
    {#each meta.items as it, idx}
      {#if it.str}
        {@const offset = meta.offsets[idx]}
        {@const t = it.transform ?? [0, 0, 0, 0, 0, 0]}
        {@const h = it.height ?? 0}
        <span
          class="tl"
          class:active={offset === readerBus.currentOffset}
          data-offset={offset}
          style="left:{t[4] * scale}px;top:{(meta.height * scale - t[5] * scale) - h * scale}px;font-size:{h * scale}px"
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
    background: #fff;
  }
  .page-canvas {
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
