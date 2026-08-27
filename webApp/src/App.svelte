<script lang="ts">
  import { onMount } from 'svelte'
  import Reader from './views/Reader.svelte'
  import Library from './views/Library.svelte'
  import Stats from './views/Stats.svelte'
  import Settings from './views/Settings.svelte'
  import SpaceTest from './views/SpaceTest.svelte'
  import SourcePanel from './views/SourcePanel.svelte'
  import ChapterList from './views/ChapterList.svelte'
  import { getActiveDoc, init, openDocument, appState } from './lib/stores.svelte'

  type View = 'reader' | 'library' | 'stats' | 'settings' | 'spacetest'

  const nav: { id: View; label: string }[] = [
    { id: 'reader', label: 'Reader' },
    { id: 'library', label: 'Library' },
    { id: 'stats', label: 'Stats' },
    { id: 'settings', label: 'Settings' },
    { id: 'spacetest', label: 'SpaceTest' },
  ]

  let view: View = $state('reader')

  const activeDoc = $derived(getActiveDoc())

  onMount(() => {
    void init()
  })

  function openFromLibrary(id: string) {
    void openDocument(id)
    view = 'reader'
  }
</script>

<header class="appbar">
  <span class="brand">DoomRead</span>
  <nav>
    {#each nav as item}
      <button class:active={view === item.id} onclick={() => (view = item.id)}>
        {item.label}
      </button>
    {/each}
  </nav>
</header>

<main class="view">
  {#if !appState.ready}
    <p class="meta">opening…</p>
  {:else if view === 'reader'}
    {#if activeDoc}
      {#if activeDoc.chapters?.length}
        <ChapterList chapters={activeDoc.chapters} />
      {/if}
      <div class="reading">
        {#key appState.activeDocumentId}
          <div class="pane"><Reader document={activeDoc} /></div>
          <SourcePanel text={activeDoc.text ?? ''} type={activeDoc.type} />
        {/key}
      </div>
    {:else}
      <p class="meta">No document open. Pick one in the Library.</p>
    {/if}
  {:else if view === 'library'}
    <Library documents={appState.documents} onOpen={openFromLibrary} />
  {:else if view === 'stats'}
    <Stats />
  {:else if view === 'spacetest'}
    <SpaceTest />
  {:else}
    <Settings />
  {/if}
</main>

<style>
  .appbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #ddd;
  }
  .brand {
    font-weight: 700;
    font-size: 1.1rem;
  }
  nav {
    display: flex;
    gap: 0.25rem;
  }
  nav button {
    border: none;
    background: none;
    padding: 0.4rem 0.75rem;
    border-radius: 0.4rem;
    cursor: pointer;
    color: #444;
  }
  nav button:hover {
    background: #eee;
  }
  nav button.active {
    background: #222;
    color: #fff;
  }
  .view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 1rem;
  }
  .reading {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    max-width: 1100px;
  }
  .pane {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
</style>
