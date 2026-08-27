<script lang="ts">
  let {
    value,
    min,
    max,
    step = 0.1,
    decimals = 1,
    suffix = '',
    onCommit,
  }: {
    value: number
    min: number
    max: number
    step?: number
    decimals?: number
    suffix?: string
    onCommit: (n: number) => void
  } = $props()

  let editing = $state(false)
  let draft = $state('')
  let inputEl = $state<HTMLInputElement | null>(null)

  function startEdit() {
    draft = String(value)
    editing = true
  }

  function commit() {
    if (!editing) return
    const n = Number(draft)
    if (Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, n)))
    editing = false
  }

  function cancel() {
    editing = false
  }

  $effect(() => {
    if (editing && inputEl) {
      inputEl.focus()
      inputEl.select()
    }
  })
</script>

{#if editing}
  <input
    class="edit"
    type="text"
    inputmode="decimal"
    bind:this={inputEl}
    bind:value={draft}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.currentTarget.blur()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    }}
    onblur={commit}
  />
{:else}
  <button type="button" class="value" onclick={startEdit}>{value.toFixed(decimals)}{suffix}</button>
{/if}

<style>
  .value {
    font: inherit;
    font-weight: 400;
    color: var(--muted);
    font-size: 0.9rem;
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    cursor: text;
  }
  .edit {
    font: inherit;
    font-size: 0.9rem;
    width: 4.5rem;
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--border);
    border-radius: 0.3rem;
    background: var(--surface);
    color: var(--fg);
  }
</style>
