import { onMounted, ref } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'dorm-theme'

function initialTheme(): Theme {
  if (import.meta.server) return 'light'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Keep the SSR and hydration value deterministic. The head bootstrap script
// applies the saved CSS class before paint; this ref catches up on mount.
const theme = ref<Theme>('light')
const isThemeSwitching = ref(false)
let themeFeedbackFrame = 0
let themeFeedbackReleaseFrame = 0
let initialized = false

function apply(t: Theme) {
  if (import.meta.server) return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

export function useTheme() {
  onMounted(() => {
    if (initialized) return
    initialized = true
    theme.value = initialTheme()
    apply(theme.value)
  })

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
