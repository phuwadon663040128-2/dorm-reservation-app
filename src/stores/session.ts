import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Permission, StaffSection, User } from '@/types'
import { permissionsForSections, users } from '@/fixtures/users'
import { useStaffAccessStore } from './staffAccess'

const STORAGE_KEY = 'dorm-demo-session-user'
const CUSTOM_USER_KEY = 'dorm-demo-custom-user'
const PENDING_EMAIL_KEY = 'dorm-demo-pending-email'
const PENDING_PASSWORD_KEY = 'dorm-demo-pending-password'
const CUSTOM_PASSWORD_KEY = 'dorm-demo-custom-password'

function restoreCustomUser(): User | null {
  if (import.meta.server) return null
  try {
    const raw = sessionStorage.getItem(CUSTOM_USER_KEY)
    return raw ? JSON.parse(raw) as User : null
  } catch {
    return null
  }
}

export const useSessionStore = defineStore('session', () => {
  const customUser = ref<User | null>(restoreCustomUser())
  const currentUser = ref<User | null>(restore())

  function restore(): User | null {
    if (import.meta.server) return null
    const id = sessionStorage.getItem(STORAGE_KEY)
    if (!id) return null
    return users.find(u => u.id === id) ?? (customUser.value?.id === id ? customUser.value : null)
  }

  const availableUsers = computed(() => customUser.value ? [...users, customUser.value] : users)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isStaff = computed(() => currentUser.value !== null && currentUser.value.role !== 'applicant')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  /** ส่วนงานที่ผู้ใช้ปัจจุบันเข้าถึงได้ — ผู้ดูแลระบบปรับได้ระหว่างใช้งาน */
  const allowedSections = computed<StaffSection[]>(() => {
    if (!currentUser.value || currentUser.value.role === 'applicant') return []
    return useStaffAccessStore().sectionsFor(currentUser.value)
  })

  // permission รายละเอียดตามส่วนงานที่ได้รับ — deny by default
  const permissions = computed<Permission[]>(() => permissionsForSections(allowedSections.value))

  function can(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  function canAccessSection(section: StaffSection): boolean {
    return isAdmin.value || allowedSections.value.includes(section)
  }

  function login(userId: string): User | null {
    const user = availableUsers.value.find(u => u.id === userId) ?? null
    currentUser.value = user
    if (user && import.meta.client) sessionStorage.setItem(STORAGE_KEY, user.id)
    return user
  }

  /** Re-read browser state after Nuxt restores the server-rendered Pinia payload. */
  function hydrateFromStorage() {
    if (import.meta.server) return
    customUser.value = restoreCustomUser()
    currentUser.value = restore()
  }

  function userByEmail(email: string) {
    return availableUsers.value.find(user => user.email.toLowerCase() === email.trim().toLowerCase())
  }

  function authenticateApplicant(email: string, password: string): User | null {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) return null
    const fixtureApplicant = users.find(user =>
      user.role === 'applicant' && user.email.toLowerCase() === normalizedEmail,
    )
    if (fixtureApplicant && password === 'demo1234') return login(fixtureApplicant.id)

    if (
      customUser.value
      && customUser.value.email.toLowerCase() === normalizedEmail
      && import.meta.client
      && sessionStorage.getItem(CUSTOM_PASSWORD_KEY) === password
    ) {
      return login(customUser.value.id)
    }
    return null
  }

  function beginEmailRegistration(email: string, password: string) {
    if (import.meta.server) return false
    const normalizedEmail = email.trim().toLowerCase()
    const validEmail = normalizedEmail.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    if (!validEmail || password.length < 8 || password.length > 128) return false
    sessionStorage.setItem(PENDING_EMAIL_KEY, normalizedEmail)
    sessionStorage.setItem(PENDING_PASSWORD_KEY, password)
    return true
  }

  function pendingEmailRegistration() {
    if (import.meta.server) return ''
    return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? ''
  }

  function completeEmailRegistration(): User | null {
    if (import.meta.server) return null
    const email = pendingEmailRegistration()
    const password = sessionStorage.getItem(PENDING_PASSWORD_KEY)
    if (!email || !password) return null
    const name = (email.split('@')[0] ?? '')
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    const user: User = {
      id: `applicant-email-${Date.now()}`,
      role: 'applicant',
      displayName: name || 'ผู้สมัครใหม่',
      email,
      emailVerified: true,
      profileComplete: false,
      kkuSsoLinked: false,
    }
    customUser.value = user
    currentUser.value = user
    sessionStorage.setItem(CUSTOM_USER_KEY, JSON.stringify(user))
    sessionStorage.setItem(STORAGE_KEY, user.id)
    sessionStorage.setItem(CUSTOM_PASSWORD_KEY, password)
    sessionStorage.removeItem(PENDING_EMAIL_KEY)
    sessionStorage.removeItem(PENDING_PASSWORD_KEY)
    return user
  }

  function linkCurrentUserToKkuSso() {
    if (!currentUser.value) return false
    currentUser.value.kkuSsoLinked = true
    if (customUser.value?.id === currentUser.value.id) {
      customUser.value = currentUser.value
      if (import.meta.client) sessionStorage.setItem(CUSTOM_USER_KEY, JSON.stringify(customUser.value))
    }
    return true
  }

  function markCurrentApplicantProfileComplete() {
    if (!currentUser.value || currentUser.value.role !== 'applicant') return false
    currentUser.value.profileComplete = true
    if (customUser.value?.id === currentUser.value.id) {
      customUser.value = currentUser.value
      if (import.meta.client) sessionStorage.setItem(CUSTOM_USER_KEY, JSON.stringify(customUser.value))
    }
    return true
  }

  function logout() {
    currentUser.value = null
    if (import.meta.client) sessionStorage.removeItem(STORAGE_KEY)
  }

  return {
    currentUser,
    customUser,
    availableUsers,
    isLoggedIn,
    isStaff,
    isAdmin,
    allowedSections,
    permissions,
    can,
    canAccessSection,
    login,
    hydrateFromStorage,
    userByEmail,
    authenticateApplicant,
    beginEmailRegistration,
    pendingEmailRegistration,
    completeEmailRegistration,
    linkCurrentUserToKkuSso,
    markCurrentApplicantProfileComplete,
    logout,
  }
})
