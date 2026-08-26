<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as pdfjsLib from 'pdfjs-dist'
  import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
  import { getPdfBytes } from '../lib/stores.svelte'
  import type { PdfDocMeta } from '../lib/stores.svelte'
  import PdfPageView from './PdfPageView.svelte'

  pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

  let { pdf, documentId }: { pdf: PdfDocMeta; documentId: string } = $props()

  let pdfDoc: any = $state(null)
  let error = $state('')
  let pane = $state<HTMLDivElement | null>(null)
  let paneWidth = $state(0)

  const baseWidth = $derived(Math.max(...pdf.pages.map((p) => p.width), 1))
  let scale = $derived(paneWidth > 0 ? Math.max(0.4, Math.min(2, paneWidth / baseWidth)) : 1)

  let ro: ResizeObserver | null = null

  onMount(async () => {
    if (pane) {
      paneWidth = pane.clientWidth
      ro = new ResizeObserver(() => {
        if (pane) paneWidth = pane.clientWidth
      })
      ro.observe(pane)
    }
    try {
      const bytes = await getPdfBytes(documentId)
      if (!bytes) {
        error = 'PDF data could not be loaded.'
        return
      }
      pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
    } catch (e) {
      error = `Could not open PDF: ${e instanceof Error ? e.message : String(e)}`
    }
  })

  onDestroy(() => ro?.disconnect())
</script>

{#if error}
  <p class="meta">{error}</p>
{:else if !pdfDoc}
  <p class="meta">Loading PDF…</p>
{:else}
  <div class="viewer" bind:this={pane}>
    {#each pdf.pages as page, i (i)}
      <PdfPageView {pdfDoc} index={i + 1} meta={page} {scale} />
    {/each}
  </div>
{/if}

<style>
  .viewer {
    width: 100%;
  }
  .meta {
    color: #666;
    padding: 1rem;
  }
</style>
