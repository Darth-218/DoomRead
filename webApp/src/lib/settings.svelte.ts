type DisplayMode = 'light' | 'dark' | 'sepia'
type FontFamily = 'sans' | 'mono' | 'dyslexic'
type Preset = 'default' | 'monospace' | 'dyslexia' | 'focus-bold' | 'orp-reticle'

const STORAGE_KEY = 'doomread-settings'

const FONT_STACKS: Record<FontFamily, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
  dyslexic: '"Lexend", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
}

const DISPLAY_ORDER: DisplayMode[] = ['light', 'dark', 'sepia']

const DEFAULTS = {
  displayMode: 'light' as DisplayMode,
  fontFamily: 'mono' as FontFamily,
  fontSize: 3,
  lineSpacing: 1.9,
  preset: 'default' as Preset,
}

let displayMode = $state<DisplayMode>(DEFAULTS.displayMode)
let fontFamily = $state<FontFamily>(DEFAULTS.fontFamily)
let fontSize = $state<number>(DEFAULTS.fontSize)
let lineSpacing = $state<number>(DEFAULTS.lineSpacing)
let preset = $state<Preset>(DEFAULTS.preset)

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function apply() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = displayMode
  root.style.setProperty('--reader-font-family', FONT_STACKS[fontFamily])
  root.style.setProperty('--reader-font-size', `${fontSize}rem`)
  root.style.setProperty('--reader-line-height', String(lineSpacing))
}

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ displayMode, fontFamily, fontSize, lineSpacing, preset }),
  )
}

export const settingsStore = {
  get displayMode() {
    return displayMode
  },
  get fontFamily() {
    return fontFamily
  },
  get fontSize() {
    return fontSize
  },
  get lineSpacing() {
    return lineSpacing
  },
  get preset() {
    return preset
  },
  setDisplayMode(m: DisplayMode) {
    displayMode = m
    preset = 'default'
    apply()
    persist()
  },
  setFontFamily(f: FontFamily) {
    fontFamily = f
    preset = 'default'
    apply()
    persist()
  },
  setFontSize(n: number) {
    fontSize = clamp(n, 1, 8)
    preset = 'default'
    apply()
    persist()
  },
  setLineSpacing(n: number) {
    lineSpacing = clamp(n, 1.2, 3)
    preset = 'default'
    apply()
    persist()
  },
  cycleDisplay() {
    const i = DISPLAY_ORDER.indexOf(displayMode)
    displayMode = DISPLAY_ORDER[(i + 1) % DISPLAY_ORDER.length]
    apply()
    persist()
  },
  init() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const p = JSON.parse(saved)
          if (p.displayMode === 'light' || p.displayMode === 'dark' || p.displayMode === 'sepia')
            displayMode = p.displayMode
          if (p.fontFamily === 'sans' || p.fontFamily === 'mono' || p.fontFamily === 'dyslexic')
            fontFamily = p.fontFamily
          if (typeof p.fontSize === 'number') fontSize = clamp(p.fontSize, 1, 8)
          if (typeof p.lineSpacing === 'number') lineSpacing = clamp(p.lineSpacing, 1.2, 3)
          if (
            p.preset === 'default' ||
            p.preset === 'monospace' ||
            p.preset === 'dyslexia' ||
            p.preset === 'focus-bold' ||
            p.preset === 'orp-reticle'
          )
            preset = p.preset
        } catch {
          /* ignore corrupt storage */
        }
      }
    }
    apply()
  },
}
