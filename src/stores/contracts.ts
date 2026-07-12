import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppNotification, AuditEvent, Contract, HandoffBatch, KeyHandover } from '@/types'
import {
  auditEvents as auditFixtures,
  contracts as contractFixtures,
  handoffBatches as handoffFixtures,
  keyHandovers as handoverFixtures,
  notifications as notificationFixtures,
} from '@/fixtures'
import { useSessionStore } from './session'

export const useContractsStore = defineStore('contracts', () => {
  const contracts = ref<Contract[]>(contractFixtures)
  const keyHandovers = ref<KeyHandover[]>(handoverFixtures)
  const handoffBatches = ref<HandoffBatch[]>(handoffFixtures)
  const auditEvents = ref<AuditEvent[]>(auditFixtures)
  const notifications = ref<AppNotification[]>(notificationFixtures)

  const session = useSessionStore()

  const myContracts = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return []
    return contracts.value.filter(c => c.residentId === uid)
  })

  const myKeyHandovers = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return []
    return keyHandovers.value.filter(k => k.residentId === uid)
  })

  /** สถานะกลุ่ม เช่น "ลงนามแล้ว 1 จาก 2" — กลุ่ม shared ไม่สมบูรณ์จนกว่าจะรับครบทุกฉบับ */
  function groupContractProgress(reservationGroupId: string) {
    const list = contracts.value.filter(c => c.reservationGroupId === reservationGroupId)
    const signed = list.filter(c => c.status === 'signed_received').length
    return { total: list.length, signed, complete: list.length > 0 && signed === list.length }
  }

  function addAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    auditEvents.value.unshift({
      ...event,
      id: `au-${Date.now()}`,
      timestamp: new Date().toISOString(),
    })
  }

  return {
    contracts,
    keyHandovers,
    handoffBatches,
    auditEvents,
    notifications,
    myContracts,
    myKeyHandovers,
    groupContractProgress,
    addAudit,
  }
})
