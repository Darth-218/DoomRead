<script lang="ts">
  import { addDocument, deleteDocument, type Document, type ChapterMeta } from '../lib/stores.svelte'
  import { importFor, type DocType } from '../lib/importers'
  import { settingsStore } from '../lib/settings.svelte'

  let { documents, onOpen }: { documents: Document[]; onOpen: (id: string) => void } = $props()

  let importText = $state('')
  let importTitle = $state('')
  let importChapters = $state<ChapterMeta[] | undefined>(undefined)
  let importType = $state<DocType | undefined>(undefined)
  let importError = $state('')
  let busy = $state(false)
  let cleanPdf = $state(true)
  let showImport = $state(false)
  let layout = $state<'list' | 'grid'>('list')
  let openMenu = $state<string | null>(null)

  function toggleMenu(id: string) {
    openMenu = openMenu === id ? null : id
  }
  function choose(fn: () => void) {
    fn()
    openMenu = null
  }

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
      const doc = await addDocument(importTitle, importText, importChapters, importType ?? 'txt')
      importText = ''
      importTitle = ''
      importChapters = undefined
      importType = undefined
      showImport = false
      onOpen(doc.id)
    } catch (err) {
      importError = `Could not save document: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    await deleteDocument(id)
    if (settingsStore.defaultDocId === id) settingsStore.clearDefaultDoc()
  }
</script>

<div class="library">
  <div class="head">
    <h2>Library</h2>
    <div class="head-actions">
      <button
        class:active={layout === 'grid'}
        onclick={() => (layout = layout === 'grid' ? 'list' : 'grid')}
        aria-label="Toggle list/grid layout">{layout === 'grid' ? 'List' : 'Grid'}</button>
      <button class="add" onclick={() => (showImport = !showImport)}>Add document</button>
    </div>
  </div>

  {#if showImport || documents.length === 0}
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
  {/if}

  {#if documents.length === 0}
    <p class="empty">No documents yet.</p>
  {:else}
    <ul class:grid={layout === 'grid'}>
      {#each documents as doc (doc.id)}
        <li
          class="card"
          title="Double-click to open"
          ondblclick={(e) => {
            if ((e.target as HTMLElement).closest('.menu-wrap')) return
            onOpen(doc.id)
          }}
        >
          {@render item(doc)}
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#if openMenu}
  <div class="menu-backdrop" role="presentation" onclick={() => (openMenu = null)}></div>
{/if}

{#snippet item(doc: Document)}
  <span class="title">{doc.title}</span>
  <span class="chips">
    {#if doc.type}<span class="chip">{doc.type.toUpperCase()}</span>{/if}
    {#if settingsStore.defaultDocId === doc.id}
      <span class="chip default">DEFAULT</span>
    {/if}
  </span>
  <span class="menu-wrap">
    <button
      class="more"
      type="button"
      aria-label="More options"
      aria-haspopup="true"
      aria-expanded={openMenu === doc.id}
      onclick={() => toggleMenu(doc.id)}>⋮</button>
    {#if openMenu === doc.id}
      <div class="menu" role="menu">
        <button role="menuitem" onclick={() => choose(() => onOpen(doc.id))}>Open</button>
        <button
          role="menuitem"
          class:active={settingsStore.defaultDocId === doc.id}
          onclick={() => choose(() => settingsStore.setDefaultDoc(doc.id))}>Default</button>
        <button role="menuitem" class="remove" onclick={() => choose(() => void remove(doc.id))}>Remove</button>
      </div>
    {/if}
  </span>
{/snippet}

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
  .library .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 0.75rem;
  }
  .head-actions {
    display: flex;
    gap: 0.5rem;
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
  .import .title {
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
  input[type='file'] {
    color: var(--muted-2);
    font: inherit;
  }
  input[type='file']::file-selector-button {
    cursor: pointer;
    border: 1px solid var(--fg);
    background: var(--bg);
    color: var(--fg);
    padding: 0.4rem 0.9rem;
    border-radius: 0.4rem;
    font: inherit;
    margin-right: 0.75rem;
  }
  input[type='file']::file-selector-button:hover {
    background: color-mix(in srgb, var(--fg) 12%, var(--bg));
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
  ul.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    cursor: pointer;
  }
  ul.grid li {
    position: relative;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  ul.grid .menu-wrap {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
  .library .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  li .title {
    flex: 1 1 auto;
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .chip {
    display: inline-block;
    padding: 0.1rem 0.5rem;
    border: 1px solid var(--fg);
    border-radius: 999px;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--fg);
    background: var(--bg);
  }
  .chip.default {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
  }
  .menu-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .more {
    border: none;
    background: none;
    color: var(--muted-2);
    font-size: 1.3rem;
    line-height: 1;
    padding: 0 0.3rem;
    cursor: pointer;
    border-radius: 0.3rem;
  }
  .more:hover {
    color: var(--fg);
    background: color-mix(in srgb, var(--fg) 12%, var(--bg));
  }
  .menu {
    position: absolute;
    right: 0;
    top: 100%;
    margin-top: 0.3rem;
    z-index: 20;
    display: flex;
    flex-direction: column;
    min-width: 8rem;
    padding: 0.25rem;
    gap: 0.15rem;
    background: var(--bg);
    border: 1px solid var(--fg);
    border-radius: 0.4rem;
  }
  .menu button {
    text-align: left;
    justify-content: flex-start;
    padding: 0.4rem 0.6rem;
    border: none;
  }
  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
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
  button.active {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
  }
  button.remove {
    background: var(--danger);
    color: #fff;
    border-color: var(--danger);
  }
</style>
