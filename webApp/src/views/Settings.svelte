<script lang="ts">
  import { settingsStore } from '../lib/settings.svelte'
  import EditableNumber from './EditableNumber.svelte'

  const displayModes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'sepia', label: 'Sepia' },
  ] as const

  const fontFamilies = [
    { id: 'sans', label: 'Sans-serif' },
    { id: 'mono', label: 'Monospace' },
    { id: 'dyslexic', label: 'Dyslexia' },
  ] as const

  const presets = [
    { id: 'default', label: 'Default' },
    { id: 'monospace', label: 'Monospace' },
    { id: 'dyslexia', label: 'Dyslexia' },
    { id: 'focus-bold', label: 'Focus Bold' },
    { id: 'orp-reticle', label: 'ORP Reticle' },
  ] as const
</script>

<div class="settings">
  <h2>Settings</h2>

  <section>
    <h3>Display mode</h3>
    <div class="choices">
      {#each displayModes as m}
        <button
          class:active={settingsStore.displayMode === m.id}
          onclick={() => settingsStore.setDisplayMode(m.id)}>{m.label}</button>
      {/each}
    </div>
  </section>

  <section>
    <h3>Font family</h3>
    <div class="choices">
      {#each fontFamilies as f}
        <button
          class:active={settingsStore.fontFamily === f.id}
          onclick={() => settingsStore.setFontFamily(f.id)}>{f.label}</button>
      {/each}
    </div>
  </section>

  <section>
    <h3>Theme presets</h3>
    <div class="choices">
      {#each presets as p}
        <button
          class:active={settingsStore.preset === p.id}
          onclick={() => settingsStore.applyPreset(p.id)}>{p.label}</button>
      {/each}
    </div>
  </section>

  <section>
    <h3>Reading size
      <EditableNumber
        value={settingsStore.fontSize}
        min={1}
        max={8}
        step={0.1}
        decimals={1}
        suffix="rem"
        onCommit={(n) => settingsStore.setFontSize(n)}
      />
    </h3>
    <input
      type="range"
      min="1"
      max="8"
      step="0.1"
      value={settingsStore.fontSize}
      oninput={(e) => settingsStore.setFontSize(+(e.currentTarget.value))}
    />
  </section>

  <section>
    <h3>Line spacing
      <EditableNumber
        value={settingsStore.lineSpacing}
        min={1.2}
        max={3}
        step={0.1}
        decimals={2}
        onCommit={(n) => settingsStore.setLineSpacing(n)}
      />
    </h3>
    <input
      type="range"
      min="1.2"
      max="3"
      step="0.1"
      value={settingsStore.lineSpacing}
      oninput={(e) => settingsStore.setLineSpacing(+(e.currentTarget.value))}
    />
  </section>

  <section>
    <h3>Preview</h3>
    <p class="preview">
      The quick brown fox jumps over the lazy dog. Reading should feel calm and
      effortless at any speed.
    </p>
  </section>
</div>

<style>
  .settings {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
  }
  h2 {
    margin: 0;
    font-size: 1.6rem;
  }
  h3 {
    margin: 0 0 0.6rem;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .choices button {
    font: inherit;
    padding: 0.45rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--surface);
    color: var(--fg);
    cursor: pointer;
  }
  .choices button:hover {
    background: var(--hover-2);
  }
  .choices button.active {
    background: var(--nav-active-bg);
    color: var(--nav-active-fg);
    border-color: var(--nav-active-bg);
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--word-active-fg);
    cursor: pointer;
  }
  .preview {
    margin: 0;
    height: 9rem;
    min-height: 9rem;
    display: flex;
    align-items: center;
    overflow: hidden;
    font-family: var(--reader-font-family);
    font-size: var(--reader-font-size);
    line-height: var(--reader-line-height);
    padding: 0 1.25rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--surface);
  }
</style>
