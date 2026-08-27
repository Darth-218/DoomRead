<script lang="ts">
  import { onMount } from 'svelte'
  import { core } from '../lib/core/api'
  import { refreshProgress, saveProgress, appState } from '../lib/stores.svelte'
  import type { Document } from '../lib/stores.svelte'
  import { setCurrentOffset, setJumpHandler } from '../lib/readerBus.svelte'

  let { document }: { document: Document } = $props()

  const TEXT = $derived(document.text ?? '')

  interface StepRow {
    display: string
    durationMs: number
    offset: number
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
    steps = core.schedule(TEXT, wpm).map((s) => ({
      display: s.display,
      durationMs: toMs(s.durationMs),
      offset: s.offset,
    }))
    let next = preferredIndex ?? idx
    if (preferredIndex === undefined && wasFinished) next = 0
    idx = Math.max(0, Math.min(next, steps.length - 1))
    finished = preferredIndex !== undefined && idx >= steps.length - 1 && steps.length > 1
    word = steps[idx]?.display ?? ''
    if (wasRunning) start()
    else if (preferredIndex === undefined) persist()
  }

  // Publish the source char offset of the word currently shown so the
  // SourcePanel can highlight and scroll to it.
  $effect(() => {
    setCurrentOffset(steps[idx]?.offset ?? 0)
  })

  onMount(() => {
    setJumpHandler((offset: number) => {
      // Seek to the first step at or after the target offset (chapter starts
      // may land on whitespace, so an exact match isn't guaranteed).
      const i = steps.findIndex((s) => s.offset >= offset)
      if (i < 0) return
      const wasRunning = running
      stop()
      idx = i
      word = steps[i].display
      finished = false
      if (wasRunning) start()
      persist()
    })

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
      setJumpHandler(null)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', release)
    }
  })
</script>

<button type="button" class="word" aria-label="Play or pause" onclick={toggle}>{word}</button>
<div class="controls">
  <div class="wpm-row">
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
    <span class="wpm-ghost" aria-hidden="true">WPM {wpm}</span>
  </div>
  <div class="play-row">
    <span class="play-spacer" aria-hidden="true"></span>
    <button
      class="playpause"
      aria-label={running ? 'Pause' : finished ? 'Re-read' : 'Read'}
      title={running ? 'Pause' : finished ? 'Re-read' : 'Read'}
      onclick={toggle}>{running ? '⏸' : finished ? '↻' : '▶'}</button>
    <button class="help" type="button" aria-label="Reading controls help">
      ?
      <span class="tooltip">space: tap to step · hold to read · release to pause · ←/→ step · click word to play/pause</span>
    </button>
  </div>
</div>

<style>
  .word {
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-family: var(--reader-font-family);
    font-size: var(--reader-font-size);
    min-height: 3.5rem;
    margin: 0;
    cursor: pointer;
    user-select: none;
    width: 100%;
    text-align: center;
  }
  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }
  .wpm-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .wpm-ghost {
    color: transparent;
    min-width: 4.5rem;
    text-align: right;
  }
  .play-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .play-spacer {
    width: 1.4rem;
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
    appearance: textfield;
    -moz-appearance: textfield;
    border: 1px solid var(--border);
    border-radius: 0.3rem;
    background: var(--surface);
    color: var(--fg);
  }
  .wpm-control input::-webkit-outer-spin-button,
  .wpm-control input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .wpm-control button {
    font: inherit;
    padding: 0.2rem 0.6rem;
    cursor: pointer;
  }
  .playpause {
    font: inherit;
    font-size: 1.1rem;
    line-height: 1;
    width: 2.4rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--surface);
    color: var(--fg);
    cursor: pointer;
  }
  .playpause:hover {
    background: var(--hover-2);
  }
  .help {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    padding: 0;
    appearance: none;
    font: inherit;
    font-size: 0.9rem;
    line-height: 1;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--fg);
    cursor: help;
  }
  .tooltip {
    position: absolute;
    bottom: 150%;
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: 22rem;
    padding: 0.5rem 0.7rem;
    border-radius: 0.4rem;
    background: var(--nav-active-bg);
    color: var(--nav-active-fg);
    font-size: 0.85rem;
    line-height: 1.4;
    text-align: center;
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.12s ease;
    pointer-events: none;
    z-index: 10;
  }
  .help:hover .tooltip,
  .help:focus .tooltip {
    opacity: 1;
    visibility: visible;
  }
</style>
