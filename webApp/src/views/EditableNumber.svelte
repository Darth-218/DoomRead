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

  function startEdit() {
    draft = String(value)
    editing = true
  }

  function commit() {
    const n = Number(draft)
    if (Number.isFinite(n)) {
      onCommit(Math.min(max, Math.max(min, n)))
    }
    editing = false
  }

  function cancel() {
    editing = false
  }

  function focusInput(node: HTMLInputElement) {
    node.focus()
    node.select()
  }
</script>

{#if editing}
  <input
    class="edit"
    type="number"
    {min}
    {max}
    {step}
    bind:value={draft}
    onblur={commit}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    }}
    use:focusInput
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
