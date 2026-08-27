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
    { id: 'custom', label: 'Custom' },
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
    {#if settingsStore.fontFamily === 'custom'}
      <input
        class="custom-font"
        type="text"
        placeholder="e.g. Georgia, serif"
        value={settingsStore.customFont}
        oninput={(e) => settingsStore.setCustomFont(e.currentTarget.value)}
      />
    {/if}
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
    <h3>Colors</h3>
    <div class="colors">
      <label>
        Background
        <input
          type="color"
          value={settingsStore.bgColor || '#ffffff'}
          oninput={(e) => settingsStore.setBgColor(e.currentTarget.value)}
        />
      </label>
      <label>
        Text
        <input
          type="color"
          value={settingsStore.fgColor || '#111111'}
          oninput={(e) => settingsStore.setFgColor(e.currentTarget.value)}
        />
      </label>
      <button type="button" onclick={() => settingsStore.clearColors()}>Reset</button>
    </div>
  </section>

  <section>
    <h3>Preview</h3>
    <p class="preview">Preview</p>
  </section>

  <section class="reset">
    <button type="button" class="reset-btn" onclick={() => settingsStore.resetAll()}>
      Restore all settings
    </button>
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
    border: 1px solid var(--fg);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--fg);
    cursor: pointer;
  }
  .choices button:hover {
    background: color-mix(in srgb, var(--fg) 12%, var(--bg));
  }
  .choices button.active {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
  }
  .custom-font {
    margin-top: 0.6rem;
    width: 100%;
    font: inherit;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--fg);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--fg);
  }
  .colors {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  .colors label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
  }
  .colors input[type='color'] {
    width: 2.4rem;
    height: 2.4rem;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: none;
    cursor: pointer;
  }
  .colors button {
    font: inherit;
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--fg);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--fg);
    cursor: pointer;
  }
  .colors button:hover {
    background: color-mix(in srgb, var(--fg) 12%, var(--bg));
  }
  .reset {
    border-top: 1px solid var(--border);
    padding-top: 1.25rem;
  }
  .reset-btn {
    font: inherit;
    padding: 0.5rem 1rem;
    border: 1px solid var(--fg);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--fg);
    cursor: pointer;
  }
  .reset-btn:hover {
    background: color-mix(in srgb, var(--fg) 12%, var(--bg));
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--fg);
    cursor: pointer;
  }
  .preview {
    margin: 0;
    height: 9rem;
    min-height: 9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-family: var(--reader-font-family);
    font-size: var(--reader-font-size);
    line-height: var(--reader-line-height);
    padding: 0 1.25rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--bg);
    color: var(--fg);
  }
</style>
