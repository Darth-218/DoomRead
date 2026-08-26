// App state backed by IndexedDB (Phase 3 Step C). Runes-based store to match
// the $state style used in components; db.ts stays dependency-free.
// Svelte requires reassignable module state to live on a single exported
// object (properties are mutated, the object itself is never reassigned).
import * as db from './db'
import { LOREM_300 } from './lorem'

export interface PdfTextItem {
  str?: string
  transform?: number[]
  height?: number
  [key: string]: unknown
}

export interface PdfTextContent {
  items: PdfTextItem[]
  [key: string]: unknown
}

export interface PdfPageData {
  image: string
  width: number
  height: number
  content: PdfTextContent
  offsets: number[]
}

export interface PdfDocData {
  pages: PdfPageData[]
}

export interface Document {
  id: string
  title: string
  text: string
  createdAt: string
  pdf?: PdfDocData
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
  progress: null as ReadingProgress | null,
  ready: false,
})

export function getActiveDoc(): Document | null {
  return appState.documents.find((d) => d.id === appState.activeDocumentId) ?? null
}

export async function init(): Promise<void> {
  await db.open()
  await ensureSample()
  appState.documents = await db.getAll<Document>('documents')
  if (appState.activeDocumentId === null && appState.documents.length > 0) {
    appState.activeDocumentId = appState.documents[0].id
  }
  await refreshProgress()
  appState.ready = true
}

export async function openDocument(id: string): Promise<void> {
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
  pdf?: PdfDocData,
): Promise<Document> {
  const doc: Document = {
    id: crypto.randomUUID(),
    title: title.trim() || 'Untitled',
    text,
    createdAt: new Date().toISOString(),
    pdf,
  }
  await db.put('documents', doc)
  appState.documents = [...appState.documents, doc]
  return doc
}

export async function deleteDocument(id: string): Promise<void> {
  await db.del('documents', id)
  await db.del('progress', id)
  await db.del('bookmarks', id)
  appState.documents = appState.documents.filter((d) => d.id !== id)
  if (appState.activeDocumentId === id) {
    appState.activeDocumentId = null
    appState.progress = null
  }
}

async function ensureSample(): Promise<void> {
  if (await db.get<Document>('documents', 'lorem-300')) return
  await db.put('documents', {
    id: 'lorem-300',
    title: 'Lorem Ipsum (sample)',
    text: LOREM_300,
    createdAt: new Date().toISOString(),
  })
}
