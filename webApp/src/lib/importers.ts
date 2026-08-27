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

export type DocType = 'pdf' | 'epub' | 'txt'

export interface ImportResult {
  text: string
  chapters?: ChapterMeta[]
  type?: DocType
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
  return { text, type: 'pdf' }
}

export async function extractEpub(file: File): Promise<ImportResult> {
  const data = await file.arrayBuffer()
  const book = ePub()
  await book.open(data)

  // Map each section's href (without fragment) to its TOC label so chapters
  // get readable titles instead of generic "Chapter N". `book.navigation`
  // starts undefined and is only populated after navigation loads, so read the
  // resolved `loaded.navigation` promise and never touch `book.navigation`
  // directly. Guard everything so a missing/absent TOC just yields fallback
  // titles rather than throwing.
  // Normalize an href to a comparable key: strip any fragment, decode, and
  // keep only the basename. EPUB nav and spine hrefs frequently disagree on
  // path prefixes/encoding, so matching on the basename is far more robust.
  const normHref = (h: string): string => {
    try {
      return decodeURIComponent(h).split('#')[0].split('/').pop()?.toLowerCase() ?? ''
    } catch {
      return h.split('#')[0].split('/').pop()?.toLowerCase() ?? ''
    }
  }

  const tocByHref = new Map<string, string>()
  const walk = (items: any[]) => {
    for (const it of items) {
      const base = normHref(it.href || '')
      const label = (it.label ?? '').trim()
      if (base && label && !tocByHref.has(base)) tocByHref.set(base, label)
      if (it.subitems) walk(it.subitems)
    }
  }
  try {
    const loaded = (book as any).loaded
    const nav = loaded?.navigation ? await loaded.navigation : (book as any).navigation
    if (nav && Array.isArray(nav.toc)) walk(nav.toc as any[])
  } catch {
    // No navigation document — chapters fall back to "Chapter N".
  }

  // book.loaded.spine resolves to a Spine *instance* (not an array); the
  // iterable list of sections is spine.spineItems.
  let text = ''
  const chapters: ChapterMeta[] = []
  try {
    const spine = (await book.loaded.spine) as any
    const sections = (spine?.spineItems ?? []) as any[]
    for (const section of sections) {
      if (!section.href || section.linear === false || section.linear === 'no') continue
      // Fetch the section content via book.load (routes through the archive)
      // and parse it ourselves. Passing the section's Url object to a request
      // breaks archived books, so we use the string href explicitly.
      let doc: any
      try {
        const loaded = await book.load(section.href)
        doc =
          typeof loaded === 'string'
            ? new DOMParser().parseFromString(loaded, 'application/xhtml+xml')
            : loaded
      } catch {
        continue
      }
      const t = (doc?.body?.textContent ?? '').trim()
      if (!t) continue
      const base = normHref(section.href)
      const title = tocByHref.get(base) ?? `Chapter ${chapters.length + 1}`
      if (text) text += '\n\n'
      const offset = text.length
      text += t
      chapters.push({ title, offset })
    }
  } catch {
    // Spine unavailable — fall back to whatever text we extracted.
  }

  if (!text.trim()) throw new Error('EPUB contained no extractable text')
  return { text, chapters, type: 'epub' }
}

export async function importFor(
  file: File,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return extractPdf(file, opts)
  if (lower.endsWith('.epub')) return extractEpub(file)
  return { text: await file.text(), type: 'txt' }
}
