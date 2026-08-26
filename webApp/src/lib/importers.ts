import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ePub from 'epubjs'

// PDF.js needs its worker wired up for the browser build (Vite resolves the
// ?url import to the actual worker file).
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

export interface ImportResult {
  text: string
}

export async function extractPdf(file: File): Promise<ImportResult> {
  // Read the raw bytes for parsing (pdf.js may transfer/neuter the buffer).
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise

  // Build a plain-text view of the document. We normalize spacing (trim each
  // item, single space between words) so the rendered text reads cleanly;
  // page boundaries are preserved with blank lines. The same string is later
  // tokenized by the core engine, so word offsets stay aligned.
  const parts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const words: string[] = []
    for (const it of content.items) {
      if ('str' in it && it.str && it.str.trim()) words.push(it.str.trim())
    }
    parts.push(words.join(' '))
  }

  const text = parts.join('\n\n')
  return { text }
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
