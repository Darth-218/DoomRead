<script lang="ts">
  import { onMount } from 'svelte'
  import { core } from '../lib/core/api'
  import { refreshProgress, saveProgress, appState } from '../lib/stores.svelte'
  import type { Document } from '../lib/stores.svelte'

  let { document }: { document: Document } = $props()

  const TEXT = $derived(document.text)

  interface StepRow {
    display: string
    durationMs: number
  }

  let steps: StepRow[] = $state([])
  let word: string = $state('')
  let idx: number = $state(0)
  let finished: boolean = $state(false)
  let running: boolean = $state(false)
  let wpm: number = $state(300)
  let timeout: ReturnType<typeof setTimeout> | undefined
  let pressTimer: ReturnType<typeof setTimeout> | undefined
  let spaceDown = false
  let tapping = false

  const TAP_MS = 250

  function persist() {
    void saveProgress({
      documentId: document.id,
      wpm,
      stepIndex: idx,
      updatedAt: new Date().toISOString(),
    })
  }

  function toMs(d: number): number {
    return Number.isFinite(d) ? d : 200
  }

  function stepForward() {
    if (finished) {
      restart()
      return
    }
    if (idx >= steps.length - 1) {
      finished = true
      running = false
      persist()
      return
    }
    idx += 1
    word = steps[idx].display
  }

  function tick() {
    if (idx >= steps.length - 1) {
      finished = true
      running = false
      persist()
      return
    }
    idx += 1
    word = steps[idx].display
    timeout = setTimeout(tick, toMs(steps[idx].durationMs))
  }

  function start() {
    if (running || finished || steps.length === 0) return
    running = true
    timeout = setTimeout(tick, toMs(steps[idx]?.durationMs ?? 200))
  }

  function restart() {
    stop()
    finished = false
    idx = 0
    word = steps[0]?.display ?? ''
    start()
  }

  function setWpm(v: number) {
    const next = Number.isFinite(v) ? Math.min(1000, Math.max(100, Math.round(v))) : 300
    wpm = next
    rebuild()
  }

  function toggle() {
    if (running) {
      stop()
      persist()
    } else if (finished) {
      restart()
    } else {
      start()
    }
  }

  function stop() {
    running = false
    if (timeout !== undefined) clearTimeout(timeout)
    timeout = undefined
  }

  function rebuild(preferredIndex?: number) {
    const wasRunning = running
    const wasFinished = finished
    stop()
    steps = core.schedule(TEXT, wpm)
    let next = preferredIndex ?? idx
    if (preferredIndex === undefined && wasFinished) next = 0
    idx = Math.max(0, Math.min(next, steps.length - 1))
    finished = preferredIndex !== undefined && idx >= steps.length - 1 && steps.length > 1
    word = steps[idx]?.display ?? ''
    if (wasRunning) start()
    else if (preferredIndex === undefined) persist()
  }

  onMount(() => {
    void (async () => {
      await refreshProgress(document.id)
      const saved = appState.progress
      if (saved) wpm = saved.wpm
      rebuild(saved?.stepIndex)
    })()

    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (spaceDown) return
        spaceDown = true
        if (running) {
          stop()
          persist()
          return
        }
        tapping = true
        pressTimer = setTimeout(() => {
          tapping = false
          if (finished) {
            restart()
          } else {
            start()
          }
        }, TAP_MS)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        stop()
        stepForward()
        persist()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        stop()
        if (idx > 0) {
          idx -= 1
          word = steps[idx].display
        }
        persist()
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      spaceDown = false
      if (pressTimer !== undefined) {
        clearTimeout(pressTimer)
        pressTimer = undefined
      }
      if (tapping) {
        tapping = false
        stepForward()
      } else {
        stop()
      }
      persist()
    }
    const release = () => {
      spaceDown = false
      tapping = false
      if (pressTimer !== undefined) {
        clearTimeout(pressTimer)
        pressTimer = undefined
      }
      stop()
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', release)
    return () => {
      stop()
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', release)
    }
  })
</script>

<button type="button" class="word" aria-label="Play or pause" onclick={toggle}>{word}</button>
<div class="controls">
  <label for="wpm">WPM {wpm}</label>
  <div class="wpm-control">
    <button type="button" aria-label="Decrease speed" onclick={() => setWpm(wpm - 50)}>−50</button>
    <input
      id="wpm"
      type="number"
      min="100"
      max="1000"
      step="50"
      value={wpm}
      oninput={(e) => setWpm(+(e.currentTarget.value))}
    />
    <button type="button" aria-label="Increase speed" onclick={() => setWpm(wpm + 50)}>+50</button>
  </div>
  <button onclick={toggle}>{running ? 'Pause' : finished ? 'Re-read' : 'Read'}</button>
</div>
<p class="meta">
  {#if finished}
    done — {steps.length} steps
  {:else}
    word {idx + 1} of {steps.length}
  {/if}
  {' · '}{running ? 'reading' : 'paused'}
</p>
<p class="meta">space: tap to step · hold to read · release to pause · ←/→ step · click word to play/pause</p>

<style>
  .word {
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 3rem;
    min-height: 3.5rem;
    margin: 0;
    cursor: pointer;
    user-select: none;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .wpm-control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .wpm-control input {
    width: 5rem;
    font: inherit;
    padding: 0.2rem 0.4rem;
  }
  .wpm-control button {
    font: inherit;
    padding: 0.2rem 0.6rem;
    cursor: pointer;
  }
  .meta {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }
</style>
