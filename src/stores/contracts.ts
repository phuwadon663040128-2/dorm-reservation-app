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
  const blockedReservationIds = ref<string[]>([])

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

  function addNotification(userId: string, title: string, detail: string) {
    notifications.value.unshift({
      id: `noti-${Date.now()}-${userId}`,
      userId,
      createdAt: new Date().toISOString(),
      title,
      detail,
      read: false,
    })
  }

  function hasSignedContractForReservation(reservationGroupId: string) {
    return contracts.value.some(
      contract => contract.reservationGroupId === reservationGroupId && contract.status === 'signed_received',
    )
  }

  function setReservationCancellationBlocked(reservationGroupId: string, blocked: boolean) {
    const ids = new Set(blockedReservationIds.value)
    blocked ? ids.add(reservationGroupId) : ids.delete(reservationGroupId)
    blockedReservationIds.value = [...ids]
  }

  function cancelUnsignedContractsForReservation(reservationGroupId: string) {
    let changed = 0
    contracts.value.forEach((contract) => {
      if (contract.reservationGroupId !== reservationGroupId || contract.status === 'signed_received' || contract.status === 'cancelled') return
      contract.status = 'cancelled'
      changed += 1
    })
    keyHandovers.value.forEach((handover) => {
      if (handover.reservationGroupId !== reservationGroupId || handover.status === 'signed_handed_over') return
      handover.status = 'cancelled'
    })
    setReservationCancellationBlocked(reservationGroupId, false)
    return changed
  }

  /** เก็บไฟล์สแกนแบบ private โดยยังรอเจ้าหน้าที่ตรวจรับสัญญาตาม workflow เดิม */
  function uploadSignedContractScan(contractId: string, fileName: string) {
    const contract = contracts.value.find(item => item.id === contractId)
    if (
      !contract
      || contract.signedScanUploaded
      || contract.status !== 'printed'
      || blockedReservationIds.value.includes(contract.reservationGroupId)
    ) return false

    contract.signedScanUploaded = true
    contract.signedScanFileName = fileName
    addAudit({
      actor: session.currentUser?.id ?? 'unknown-applicant',
      action: 'contract.signed_scan_upload',
      relatedIds: [contract.id, contract.reservationGroupId],
      detail: `อัปโหลดไฟล์สแกนสัญญาที่ลงนามแล้ว ${fileName} (private) และรอเจ้าหน้าที่ตรวจรับ`,
    })
    return true
  }

  return {
    contracts,
    keyHandovers,
    handoffBatches,
    auditEvents,
    notifications,
    blockedReservationIds,
    myContracts,
    myKeyHandovers,
    groupContractProgress,
    addAudit,
    addNotification,
    hasSignedContractForReservation,
    setReservationCancellationBlocked,
    cancelUnsignedContractsForReservation,
    uploadSignedContractScan,
  }
})
