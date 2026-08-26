<script lang="ts">
  import type { Document } from '../lib/stores.svelte'

  let { documents, onOpen }: { documents: Document[]; onOpen: (id: string) => void } = $props()
</script>

<div class="library">
  <h2>Library</h2>
  {#if documents.length === 0}
    <p class="empty">No documents yet. Import (paste or file) arrives in a later step.</p>
  {:else}
    <ul>
      {#each documents as doc (doc.id)}
        <li>
          <span class="title">{doc.title}</span>
          <button onclick={() => onOpen(doc.id)}>Open</button>
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
    gap: 0.5rem;
    padding: 1rem;
    width: 100%;
    max-width: 36rem;
  }
  .library h2 {
    margin: 0;
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
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
</style>
