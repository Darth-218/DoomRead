import '@fontsource-variable/lexend'

type DisplayMode = 'light' | 'dark' | 'sepia'
type FontFamily = 'sans' | 'mono' | 'dyslexic' | 'custom'
type ReaderEffect = 'none' | 'focus-bold' | 'orp-reticle'
type Preset = 'default' | 'monospace' | 'dyslexia' | 'focus-bold' | 'orp-reticle'

const STORAGE_KEY = 'doomread-settings'

const FONT_STACKS: Record<Exclude<FontFamily, 'custom'>, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
  dyslexic: '"Lexend Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
}

const DISPLAY_ORDER: DisplayMode[] = ['light', 'dark', 'sepia']

const PRESETS: Record<Preset, {
  displayMode: DisplayMode
  fontFamily: FontFamily
  fontSize: number
  lineSpacing: number
  readerEffect: ReaderEffect
}> = {
  default: { displayMode: 'light', fontFamily: 'sans', fontSize: 3, lineSpacing: 1.9, readerEffect: 'none' },
  monospace: { displayMode: 'light', fontFamily: 'mono', fontSize: 3, lineSpacing: 1.9, readerEffect: 'none' },
  dyslexia: { displayMode: 'light', fontFamily: 'dyslexic', fontSize: 3, lineSpacing: 1.9, readerEffect: 'none' },
  'focus-bold': { displayMode: 'light', fontFamily: 'sans', fontSize: 3, lineSpacing: 1.9, readerEffect: 'focus-bold' },
  'orp-reticle': { displayMode: 'light', fontFamily: 'sans', fontSize: 3, lineSpacing: 1.9, readerEffect: 'orp-reticle' },
}

const DEFAULTS = {
  displayMode: 'light' as DisplayMode,
  fontFamily: 'mono' as FontFamily,
  customFont: '',
  fontSize: 3,
  lineSpacing: 1.9,
  preset: 'default' as Preset,
  readerEffect: 'none' as ReaderEffect,
  bgColor: '',
  fgColor: '',
  defaultDocId: '',
}

let displayMode = $state<DisplayMode>(DEFAULTS.displayMode)
let fontFamily = $state<FontFamily>(DEFAULTS.fontFamily)
let customFont = $state<string>(DEFAULTS.customFont)
let fontSize = $state<number>(DEFAULTS.fontSize)
let lineSpacing = $state<number>(DEFAULTS.lineSpacing)
let preset = $state<Preset>(DEFAULTS.preset)
let readerEffect = $state<ReaderEffect>(DEFAULTS.readerEffect)
let bgColor = $state<string>(DEFAULTS.bgColor)
let fgColor = $state<string>(DEFAULTS.fgColor)
let defaultDocId = $state<string>(DEFAULTS.defaultDocId)

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function apply() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = displayMode
  root.style.setProperty(
    '--reader-font-family',
    fontFamily === 'custom' && customFont.trim()
      ? customFont
      : FONT_STACKS[fontFamily as Exclude<FontFamily, 'custom'>],
  )
  root.style.setProperty('--reader-font-size', `${fontSize}rem`)
  root.style.setProperty('--reader-line-height', String(lineSpacing))
  if (bgColor) root.style.setProperty('--bg', bgColor)
  else root.style.removeProperty('--bg')
  if (fgColor) root.style.setProperty('--fg', fgColor)
  else root.style.removeProperty('--fg')
}

function persist() {
  if (typeof localStorage === 'undefined') return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ displayMode, fontFamily, customFont, fontSize, lineSpacing, preset, readerEffect, bgColor, fgColor, defaultDocId }),
    )
}

export const settingsStore = {
  get displayMode() {
    return displayMode
  },
  get fontFamily() {
    return fontFamily
  },
  get customFont() {
    return customFont
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
  get readerEffect() {
    return readerEffect
  },
  get bgColor() {
    return bgColor
  },
  get fgColor() {
    return fgColor
  },
  get defaultDocId() {
    return defaultDocId
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
  setCustomFont(name: string) {
    customFont = name
    fontFamily = 'custom'
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
  applyPreset(p: Preset) {
    const c = PRESETS[p]
    displayMode = c.displayMode
    fontFamily = c.fontFamily
    fontSize = c.fontSize
    lineSpacing = c.lineSpacing
    readerEffect = c.readerEffect
    preset = p
    apply()
    persist()
  },
  setBgColor(c: string) {
    bgColor = c
    persist()
  },
  setFgColor(c: string) {
    fgColor = c
    persist()
  },
  clearColors() {
    bgColor = ''
    fgColor = ''
    apply()
    persist()
  },
  setDefaultDoc(id: string) {
    defaultDocId = id
    persist()
  },
  clearDefaultDoc() {
    defaultDocId = ''
    persist()
  },
  resetAll() {
    displayMode = DEFAULTS.displayMode
    fontFamily = DEFAULTS.fontFamily
    customFont = DEFAULTS.customFont
    fontSize = DEFAULTS.fontSize
    lineSpacing = DEFAULTS.lineSpacing
    preset = DEFAULTS.preset
    readerEffect = DEFAULTS.readerEffect
    bgColor = DEFAULTS.bgColor
    fgColor = DEFAULTS.fgColor
    defaultDocId = DEFAULTS.defaultDocId
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
          if (p.fontFamily === 'sans' || p.fontFamily === 'mono' || p.fontFamily === 'dyslexic' || p.fontFamily === 'custom')
            fontFamily = p.fontFamily
          if (typeof p.customFont === 'string') customFont = p.customFont
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
          if (p.readerEffect === 'none' || p.readerEffect === 'focus-bold' || p.readerEffect === 'orp-reticle')
            readerEffect = p.readerEffect
          if (typeof p.bgColor === 'string') bgColor = p.bgColor
          if (typeof p.fgColor === 'string') fgColor = p.fgColor
          if (typeof p.defaultDocId === 'string') defaultDocId = p.defaultDocId
        } catch {
          /* ignore corrupt storage */
        }
      }
    }
    apply()
  },
}
