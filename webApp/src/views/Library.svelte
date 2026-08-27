<script lang="ts">
  import { addDocument, deleteDocument, type Document, type ChapterMeta } from '../lib/stores.svelte'
  import { importFor, type DocType } from '../lib/importers'

  let { documents, onOpen }: { documents: Document[]; onOpen: (id: string) => void } = $props()

  let importText = $state('')
  let importTitle = $state('')
  let importChapters = $state<ChapterMeta[] | undefined>(undefined)
  let importType = $state<DocType | undefined>(undefined)
  let importError = $state('')
  let busy = $state(false)
  let cleanPdf = $state(true)

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    importError = ''
    busy = true
    try {
      const res = await importFor(file, { clean: cleanPdf })
      importText = res.text
      importChapters = res.chapters
      importType = res.type
      if (!importTitle) importTitle = file.name.replace(/\.[^.]+$/, '')
    } catch (err) {
      importError = `Could not read file: ${err instanceof Error ? err.message : String(err)}`
    } finally {
      busy = false
    }
  }

  async function add() {
    if (!importText.trim()) {
      // Don't mask a prior file-read failure with a misleading prompt.
      if (!importError) importError = 'Paste some text or choose a file first.'
      return
    }
    importError = ''
    try {
      const doc = await addDocument(importTitle, importText, importChapters, importType)
      importText = ''
      importTitle = ''
      importChapters = undefined
      importType = undefined
      onOpen(doc.id)
    } catch (err) {
      importError = `Could not save document: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    await deleteDocument(id)
  }
</script>

<div class="library">
  <h2>Library</h2>

  <section class="import">
    <h3>Import</h3>
    <input
      class="title"
      type="text"
      placeholder="Title (optional)"
      bind:value={importTitle}
    />
    <textarea
      placeholder="Paste text here, or choose a .txt/.md file below"
      bind:value={importText}
    ></textarea>
    <div class="row">
      <input type="file" accept=".txt,.md,.pdf,.epub,text/plain" onchange={onFile} />
      <button class="add" onclick={add} disabled={busy}>
        {busy ? 'Reading…' : 'Add document'}
      </button>
    </div>
    <label class="opt">
      <input type="checkbox" bind:checked={cleanPdf} />
      Clean PDF (remove headers, page numbers, boilerplate)
    </label>
    {#if importError}
      <p class="error">{importError}</p>
    {/if}
  </section>

  {#if documents.length === 0}
    <p class="empty">No documents yet.</p>
  {:else}
    <ul>
      {#each documents as doc (doc.id)}
        <li>
          <span class="title">{doc.title}</span>
          <span class="actions">
            <button onclick={() => onOpen(doc.id)}>Open</button>
            <button class="remove" onclick={() => remove(doc.id)}>Remove</button>
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .library {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    width: 100%;
    max-width: 36rem;
  }
  .library h2 {
    margin: 0;
  }
  .import {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }
  .import h3 {
    margin: 0;
  }
  .title {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--fg);
    border-radius: 0.4rem;
    font: inherit;
    background: var(--bg);
    color: var(--fg);
  }
  textarea {
    width: 100%;
    min-height: 6rem;
    resize: vertical;
    padding: 0.5rem;
    border: 1px solid var(--fg);
    border-radius: 0.4rem;
    font: inherit;
    background: var(--bg);
    color: var(--fg);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--muted-2);
  }
  .opt input[type='checkbox'] {
    accent-color: var(--fg);
  }
  .error {
    color: var(--danger);
    margin: 0;
    font-size: 0.85rem;
  }
  .empty {
    color: var(--muted);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  li .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: none;
    padding: 0;
  }
  button {
    cursor: pointer;
    border: 1px solid var(--fg);
    background: var(--bg);
    color: var(--fg);
    padding: 0.4rem 0.9rem;
    border-radius: 0.4rem;
    flex-shrink: 0;
    font: inherit;
  }
  button:hover {
    background: color-mix(in srgb, var(--fg) 12%, var(--bg));
  }
  button.remove {
    background: var(--danger);
    color: #fff;
    border-color: var(--danger);
  }
</style>
