import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Permission, User } from '@/types'
import { permissionsForUser, users } from '@/fixtures'

const STORAGE_KEY = 'dorm-demo-session-user'

export const useSessionStore = defineStore('session', () => {
  const currentUser = ref<User | null>(restore())

  function restore(): User | null {
    const id = sessionStorage.getItem(STORAGE_KEY)
    if (!id) return null
    return users.find(u => u.id === id) ?? null
  }

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isStaff = computed(() => currentUser.value !== null && currentUser.value.role !== 'applicant')
  const permissions = computed<Permission[]>(() =>
    currentUser.value ? permissionsForUser(currentUser.value) : [],
  )

  function can(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  function login(userId: string): User | null {
    const user = users.find(u => u.id === userId) ?? null
    currentUser.value = user
    if (user) sessionStorage.setItem(STORAGE_KEY, user.id)
    return user
  }

  function logout() {
    currentUser.value = null
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { currentUser, isLoggedIn, isStaff, permissions, can, login, logout }
})
