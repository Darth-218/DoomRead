import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ePub from 'epubjs'
import type { PdfDocMeta, PdfPageMeta } from './stores.svelte'

// PDF.js needs its worker wired up for the browser build (Vite resolves the
// ?url import to the actual worker file).
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

export interface ImportResult {
  text: string
  pdf?: PdfDocMeta
  bytes?: Uint8Array
}

export async function extractPdf(file: File): Promise<ImportResult> {
  // Read the raw bytes once: used both for parsing and for persisting so the
  // source panel can re-render pages on demand (no per-page images stored).
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise

  const pages: PdfPageMeta[] = []
  let base = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    // Natural page size (scale 1) keeps stored metadata small; the viewer
    // scales up when rendering.
    const viewport = page.getViewport({ scale: 1 })

    const content = await page.getTextContent()
    const offsets: number[] = []
    let first = true
    for (const it of content.items) {
      if ('str' in it && it.str) {
        offsets.push(base.length)
        base += (first ? '' : ' ') + it.str
        first = false
      } else {
        offsets.push(-1)
      }
    }
    if (i < pdf.numPages) base += '\n\n'

    // Store only the minimal fields the text layer needs. pdf.js may wrap
    // values (e.g. `transform`) in Proxies, so copy into real primitives.
    const items = content.items.map((it) => ({
      str: 'str' in it ? String(it.str) : undefined,
      transform:
        'transform' in it && Array.isArray(it.transform)
          ? (it.transform as number[]).slice()
          : undefined,
      height: 'height' in it ? Number(it.height) : undefined,
    }))

    pages.push({
      width: viewport.width,
      height: viewport.height,
      items,
      offsets,
    })
  }

  return { text: base, pdf: { pages }, bytes }
}

export async function extractEpubText(file: File): Promise<string> {
  const data = await file.arrayBuffer()
  const book = ePub()
  await book.open(data)
  const items = await book.loaded.spine
  const parts: string[] = []
  for (const item of items) {
    if (!item.href) continue
    const section = book.section(item.href)
    const doc = await section.load(book.load.bind(book))
    const text = doc?.body?.textContent ?? ''
    if (text.trim()) parts.push(text)
    section.unload()
  }
  return parts.join('\n\n')
}

export async function importFor(file: File): Promise<ImportResult> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return extractPdf(file)
  if (lower.endsWith('.epub')) return { text: await extractEpubText(file) }
  return { text: await file.text() }
}
