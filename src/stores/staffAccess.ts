import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffSection, User } from '@/types'
import { defaultSectionsFor, users } from '@/fixtures/users'

const STORAGE_KEY = 'dorm-demo-staff-sections'

// สิทธิ์การเข้าถึงส่วนงานของเจ้าหน้าที่รายคน — ผู้ดูแลระบบปรับจากหน้า "จัดการสิทธิ์เจ้าหน้าที่"
// prototype เก็บใน sessionStorage แทน backend; การแก้ไขจริงต้องมี audit event
export const useStaffAccessStore = defineStore('staffAccess', () => {
  const sectionsByUser = ref<Record<string, StaffSection[]>>(restore())

  function restore(): Record<string, StaffSection[]> {
    if (import.meta.server) {
      return Object.fromEntries(
        users.filter(u => u.role !== 'applicant').map(u => [u.id, defaultSectionsFor(u)]),
      )
    }
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ค่าเสียหาย — ใช้ค่าตั้งต้นจาก fixture */ }
    return Object.fromEntries(
      users.filter(u => u.role !== 'applicant').map(u => [u.id, defaultSectionsFor(u)]),
    )
  }

  function persist() {
    if (import.meta.client) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sectionsByUser.value))
  }

  function sectionsFor(user: User): StaffSection[] {
    return sectionsByUser.value[user.id] ?? defaultSectionsFor(user)
  }

  function setSections(userId: string, sections: StaffSection[]) {
    sectionsByUser.value = { ...sectionsByUser.value, [userId]: sections }
    persist()
  }

  function toggleSection(userId: string, section: StaffSection) {
    const current = sectionsByUser.value[userId] ?? []
    const next = current.includes(section)
      ? current.filter(s => s !== section)
      : [...current, section]
    setSections(userId, next)
  }

  return { sectionsByUser, sectionsFor, setSections, toggleSection }
})
