import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ePub from 'epubjs'
import type { PdfDocData, PdfPageData } from './stores.svelte'

// PDF.js needs its worker wired up for the browser build (Vite resolves the
// ?url import to the actual worker file).
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

const PDF_RENDER_SCALE = 1.5

export interface ImportResult {
  text: string
  pdf?: PdfDocData
}

export async function extractPdf(file: File): Promise<ImportResult> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data }).promise

  const pages: PdfPageData[] = []
  let base = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE })

    // Rasterize the page once so the source panel can show the real PDF
    // without re-opening the document later.
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      try {
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
      } catch {
        // Page image is best-effort; text extraction still proceeds.
      }
    }
    const image = canvas.toDataURL('image/jpeg', 0.85)

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

    // Store only the minimal, structured-clone-safe fields the text layer
    // needs (raw pdfjs content also carries non-serializable metadata).
    const items = content.items.map((it) => ({
      str: 'str' in it ? it.str : undefined,
      transform: 'transform' in it ? it.transform : undefined,
      height: 'height' in it ? it.height : undefined,
    }))

    pages.push({
      image,
      width: viewport.width,
      height: viewport.height,
      content: { items },
      offsets,
    })
  }

  return { text: base, pdf: { pages } }
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
