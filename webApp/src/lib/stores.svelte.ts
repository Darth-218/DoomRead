// App state backed by IndexedDB (Phase 3 Step C). Runes-based store to match
// the $state style used in components; db.ts stays dependency-free.
// Svelte requires reassignable module state to live on a single exported
// object (properties are mutated, the object itself is never reassigned).
import * as db from './db'
import { LOREM_300 } from './lorem'

export interface ChapterMeta {
  title: string
  offset: number
}

// Metadata only — the heavy `text`/`chapters` live in the `contents` store
// and are loaded lazily when a document is opened (see loadContent).
export interface Document {
  id: string
  title: string
  createdAt: string
  text?: string
  chapters?: ChapterMeta[]
}

// Full extracted content, kept out of the in-memory document list.
export interface Content {
  id: string
  text: string
  chapters?: ChapterMeta[]
}

export interface ReadingProgress {
  documentId: string
  wpm: number
  stepIndex: number
  updatedAt: string
}

export const appState = $state({
  documents: [] as Document[],
  activeDocumentId: null as string | null,
  activeContent: null as Content | null,
  progress: null as ReadingProgress | null,
  ready: false,
})

export function getActiveDoc(): Document | null {
  const meta = appState.documents.find((d) => d.id === appState.activeDocumentId)
  if (!meta) return null
  // Merge the lazily-loaded content so consumers see a full document.
  return {
    ...meta,
    text: appState.activeContent?.text ?? meta.text ?? '',
    chapters: appState.activeContent?.chapters ?? meta.chapters,
  }
}

// Load a document's full text/chapters. New documents store them in the
// `contents` store; older records may still carry `text` on the document
// itself, so fall back to that for backward compatibility.
export async function loadContent(id: string): Promise<Content> {
  const stored = await db.get<Content>('contents', id)
  if (stored) return { id, text: stored.text ?? '', chapters: stored.chapters }
  const doc = await db.get<Document>('documents', id)
  return { id, text: doc?.text ?? '', chapters: doc?.chapters }
}

export async function init(): Promise<void> {
  await db.open()
  await ensureSample()
  // Load metadata only; text stays in the `contents` store until opened.
  appState.documents = (await db.getAll<Document>('documents')).map((d) => ({
    ...d,
    text: undefined,
    chapters: undefined,
  }))
  if (appState.activeDocumentId === null && appState.documents.length > 0) {
    appState.activeDocumentId = appState.documents[0].id
  }
  if (appState.activeDocumentId) await openDocument(appState.activeDocumentId)
  appState.ready = true
}

export async function openDocument(id: string): Promise<void> {
  // Load content before switching the active id so the reader mounts with
  // text already available (avoids a blank first render).
  appState.activeContent = await loadContent(id)
  appState.activeDocumentId = id
  await refreshProgress()
}

export async function refreshProgress(documentId?: string): Promise<void> {
  const id = documentId ?? appState.activeDocumentId
  appState.progress =
    id === null ? null : (await db.get<ReadingProgress>('progress', id)) ?? null
}

export async function saveProgress(p: ReadingProgress): Promise<void> {
  await db.put('progress', p)
  if (p.documentId === appState.activeDocumentId) appState.progress = p
}

export async function addDocument(
  title: string,
  text: string,
  chapters?: ChapterMeta[],
): Promise<Document> {
  const id = crypto.randomUUID()
  const doc: Document = {
    id,
    title: title.trim() || 'Untitled',
    createdAt: new Date().toISOString(),
  }
  // Clone chapter metadata into plain objects: the values may arrive wrapped
  // in a Svelte $state Proxy, which IndexedDB's structured clone can't handle.
  const plainChapters = chapters
    ? chapters.map((c) => ({ title: String(c.title), offset: Number(c.offset) }))
    : undefined
  await db.put('documents', doc)
  // Keep the heavy text out of the document list.
  await db.put('contents', { id, text, chapters: plainChapters } satisfies Content)
  appState.documents = [...appState.documents, doc]
  return { ...doc, text, chapters: plainChapters }
}

export async function deleteDocument(id: string): Promise<void> {
  await db.del('documents', id)
  await db.del('contents', id)
  await db.del('progress', id)
  await db.del('bookmarks', id)
  appState.documents = appState.documents.filter((d) => d.id !== id)
  if (appState.activeDocumentId === id) {
    appState.activeDocumentId = null
    appState.activeContent = null
    appState.progress = null
  }
}

async function ensureSample(): Promise<void> {
  if (await db.get<Document>('documents', 'lorem-300')) return
  await db.put('documents', {
    id: 'lorem-300',
    title: 'Lorem Ipsum (sample)',
    createdAt: new Date().toISOString(),
  })
  await db.put('contents', {
    id: 'lorem-300',
    text: LOREM_300,
  } satisfies Content)
}
