<script lang="ts">
  import { addDocument, deleteDocument, type Document } from '../lib/stores.svelte'
  import { importTextFor } from '../lib/importers'

  let { documents, onOpen }: { documents: Document[]; onOpen: (id: string) => void } = $props()

  let importText = $state('')
  let importTitle = $state('')
  let importError = $state('')
  let busy = $state(false)

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    importError = ''
    busy = true
    try {
      const { importTextFor } = await import('../lib/importers')
      importText = await importTextFor(file)
      if (!importTitle) importTitle = file.name.replace(/\.[^.]+$/, '')
    } catch (err) {
      importError = `Could not read file: ${err instanceof Error ? err.message : String(err)}`
    } finally {
      busy = false
    }
  }

  async function add() {
    if (!importText.trim()) {
      importError = 'Paste some text or choose a file first.'
      return
    }
    importError = ''
    const doc = await addDocument(importTitle, importText)
    importText = ''
    importTitle = ''
    onOpen(doc.id)
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
    border: 1px solid #ddd;
    border-radius: 0.5rem;
  }
  .import h3 {
    margin: 0;
  }
  .title {
    padding: 0.4rem 0.6rem;
    border: 1px solid #ccc;
    border-radius: 0.4rem;
    font: inherit;
  }
  textarea {
    width: 100%;
    min-height: 6rem;
    resize: vertical;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.4rem;
    font: inherit;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .error {
    color: #e02424;
    margin: 0;
    font-size: 0.85rem;
  }
  .empty {
    color: #666;
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
    border: 1px solid #ddd;
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
    border: none;
    background: #222;
    color: #fff;
    padding: 0.4rem 0.9rem;
    border-radius: 0.4rem;
    flex-shrink: 0;
  }
  button.remove {
    background: #e02424;
  }
</style>
