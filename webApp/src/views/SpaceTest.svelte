<script lang="ts">
  import { onMount } from 'svelte'

  let spaceDown = $state(false)

  onMount(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      spaceDown = true
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      spaceDown = false
    }
    const release = () => {
      spaceDown = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', release)
    }
  })
</script>

<div class="box" class:active={spaceDown}></div>
<p class="meta">Hold Space — box turns green.</p>

<style>
  .box {
    width: 160px;
    height: 160px;
    border-radius: 12px;
    background: #e02424;
    transition: background 80ms ease;
  }
  .box.active {
    background: #22c55e;
  }
  .meta {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }
</style>
