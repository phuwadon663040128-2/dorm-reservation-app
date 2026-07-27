import { ref } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'dorm-theme'

function initialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(initialTheme())
const isThemeSwitching = ref(false)
let themeFeedbackFrame = 0
let themeFeedbackReleaseFrame = 0

function apply(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
}

apply(theme.value)

export function useTheme() {
  function toggle() {
    if (isThemeSwitching.value) return

    isThemeSwitching.value = true
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, theme.value)
    apply(theme.value)

    cancelAnimationFrame(themeFeedbackFrame)
    cancelAnimationFrame(themeFeedbackReleaseFrame)
    themeFeedbackFrame = requestAnimationFrame(() => {
      themeFeedbackReleaseFrame = requestAnimationFrame(() => {
        isThemeSwitching.value = false
      })
    })
  }
  return { theme, isThemeSwitching, toggle }
}
