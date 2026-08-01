import { useSessionStore } from '@/stores/session'

export default defineNuxtPlugin(() => {
  // Server-rendered public pages start anonymous. Restore the mock browser
  // session after Nuxt has hydrated Pinia so an existing demo login is retained.
  useSessionStore().hydrateFromStorage()
})
