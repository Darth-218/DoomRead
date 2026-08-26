import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ePub from 'epubjs'

// PDF.js needs its worker wired up for the browser build (Vite resolves the
// ?url import to the actual worker file).
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

export interface ChapterMeta {
  title: string
  offset: number
}

export interface ImportResult {
  text: string
  chapters?: ChapterMeta[]
}

export interface ImportOptions {
  // Strip PDF running headers/footers, page numbers, and boilerplate so the
  // RSVP reader isn't interrupted by layout artifacts. Defaults to true.
  clean?: boolean
}

// Lines that are just a page number (optionally "Page N" / "N of M").
function isPageNumberLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  return /^((page\s*)?\d+(\s*(of|\/)\s*\d+)?\.?|-{1,3}\s*\d+\s*-{0,3}|\(\d+\)|\[\d+\])$/i.test(t)
}

// Obvious non-prose boilerplate that often lands at page or chapter ends.
const BOILERPLATE = /(all rights reserved|©|copyright|isbn|this page (intentionally )?left blank|printed (in|and)|published by|www\.[a-z]|https?:\/\/|^\s*figure\s+\d|^\s*table\s+\d|^\s*chapter\s+\d+\s*$)/i

// Heuristically drop content an RSVP reader has no use for. Operating on the
// already-extracted per-page text (same string the core later tokenizes), so
// word offsets stay aligned with the rendered source panel.
function cleanPdfPages(pages: string[]): string[] {
  const pageLines = pages.map((p) => p.split('\n'))

  // A short line repeated at the top (or bottom) of many pages is almost
  // certainly a running header (or footer), not body text.
  const headTally = new Map<string, number>()
  const footTally = new Map<string, number>()
  for (const lines of pageLines) {
    const nonEmpty = lines.map((l) => l.trim()).filter(Boolean)
    if (nonEmpty.length === 0) continue
    const head = nonEmpty[0]
    const foot = nonEmpty[nonEmpty.length - 1]
    headTally.set(head, (headTally.get(head) ?? 0) + 1)
    if (foot !== head) footTally.set(foot, (footTally.get(foot) ?? 0) + 1)
  }
  const needed = Math.max(3, Math.ceil(pages.length * 0.5))
  const headers = new Set(
    [...headTally.entries()].filter(([, c]) => c >= needed).map(([k]) => k),
  )
  const footers = new Set(
    [...footTally.entries()].filter(([, c]) => c >= needed).map(([k]) => k),
  )

  return pageLines.map((lines) => {
    let firstSeen = false
    let lastIdx = -1
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        lastIdx = i
        break
      }
    }
    const out: string[] = []
    lines.forEach((raw, idx) => {
      const line = raw.trim()
      if (!line) return
      if (!firstSeen) firstSeen = true
      const isFirst = idx === lines.findIndex((l) => l.trim())
      const isLast = idx === lastIdx
      if (isFirst && headers.has(line)) return
      if (isLast && footers.has(line)) return
      if (isPageNumberLine(line)) return
      if (BOILERPLATE.test(line)) return
      out.push(raw)
    })
    return out.join('\n')
  })
}

export async function extractPdf(
  file: File,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const clean = opts.clean ?? true
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

  const cleaned = clean ? cleanPdfPages(parts) : parts
  const text = cleaned.join('\n\n')
  return { text }
}

export async function extractEpub(file: File): Promise<ImportResult> {
  const data = await file.arrayBuffer()
  const book = ePub()
  await book.open(data)

  // Map each section's href (without fragment) to its TOC label so chapters
  // get readable titles instead of generic "Chapter N".
  const tocByHref = new Map<string, string>()
  const walk = (items: any[]) => {
    for (const it of items) {
      const base = (it.href || '').split('#')[0]
      if (base && !tocByHref.has(base)) tocByHref.set(base, it.label)
      if (it.subitems) walk(it.subitems)
    }
  }
  try {
    const nav = await book.loaded.navigation
    walk((nav?.toc ?? []) as any[])
  } catch {
    // No navigation document — chapters fall back to "Chapter N".
  }

  const items = (await book.loaded.spine) as any[]
  let text = ''
  const chapters: ChapterMeta[] = []
  for (const item of items) {
    if (!item.href || item.linear === 'no') continue
    const section = book.section(item.href)
    if (!section) continue
    const doc = await section.load(book.load.bind(book))
    const t = (doc?.body?.textContent ?? '').trim()
    section.unload()
    if (!t) continue
    const base = item.href.split('#')[0]
    const title = tocByHref.get(base) ?? `Chapter ${chapters.length + 1}`
    if (text) text += '\n\n'
    const offset = text.length
    text += t
    chapters.push({ title, offset })
  }
  return { text, chapters }
}

export async function importFor(
  file: File,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return extractPdf(file, opts)
  if (lower.endsWith('.epub')) return extractEpub(file)
  return { text: await file.text() }
}
