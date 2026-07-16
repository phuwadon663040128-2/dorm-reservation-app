import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Permission, StaffSection, User } from '@/types'
import { permissionsForSections, users } from '@/fixtures'
import { useStaffAccessStore } from './staffAccess'

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
    const user = users.find(u => u.id === userId) ?? null
    currentUser.value = user
    if (user) sessionStorage.setItem(STORAGE_KEY, user.id)
    return user
  }

  function logout() {
    currentUser.value = null
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return {
    currentUser,
    isLoggedIn,
    isStaff,
    isAdmin,
    allowedSections,
    permissions,
    can,
    canAccessSection,
    login,
    logout,
  }
})
