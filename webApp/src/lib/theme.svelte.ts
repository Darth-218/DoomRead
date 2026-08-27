type Theme = 'light' | 'dark'

const STORAGE_KEY = 'doomread-theme'

let theme = $state<Theme>('light')

function apply(t: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = t
  }
}

export const themeStore = {
  get value(): Theme {
    return theme
  },
  init() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') {
        theme = saved
        apply(theme)
      }
    }
  },
  toggle() {
    theme = theme === 'dark' ? 'light' : 'dark'
    apply(theme)
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, theme)
  },
}
