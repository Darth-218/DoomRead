import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ePub from 'epubjs'

// PDF.js needs its worker wired up for the browser build (Vite resolves the
// ?url import to the actual worker file).
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

export async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const line = content.items.map((it) => ('str' in it ? it.str : '')).join(' ')
    if (line.trim()) pages.push(line)
  }
  return pages.join('\n\n')
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

export function importTextFor(file: File): Promise<string> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return extractPdfText(file)
  if (lower.endsWith('.epub')) return extractEpubText(file)
  return file.text()
}
