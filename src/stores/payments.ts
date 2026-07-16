import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ManualPaymentRecord,
  PaymentException,
  PaymentObligation,
  PaymentResultRow,
  ReservationGroup,
  ReturnedPdfPage,
  RoomConfig,
  ScbExportBatch,
} from '@/types'
import {
  CURRENT_ACADEMIC_YEAR,
  manualPayments as manualFixtures,
  obligations as obligationFixtures,
  paymentExceptions as exceptionFixtures,
  paymentResultRows as resultFixtures,
  priceLinesFor,
  returnedPdfPages as pdfFixtures,
  scbBatches as batchFixtures,
} from '@/fixtures'
import { useSessionStore } from './session'

const PAID_STATUSES = new Set(['paid', 'manual_recorded', 'confirmed'])

export const usePaymentsStore = defineStore('payments', () => {
  const obligations = ref<PaymentObligation[]>(obligationFixtures)
  const batches = ref<ScbExportBatch[]>(batchFixtures)
  const pdfPages = ref<ReturnedPdfPage[]>(pdfFixtures)
  const resultRows = ref<PaymentResultRow[]>(resultFixtures)
  const exceptions = ref<PaymentException[]>(exceptionFixtures)
  const manualRecords = ref<ManualPaymentRecord[]>(manualFixtures)

  const session = useSessionStore()

  const myObligations = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return []
    return obligations.value.filter(o => o.residentId === uid && !o.supersededById)
  })

  function obligationsForGroup(reservationGroupId: string) {
    return obligations.value.filter(o => o.reservationGroupId === reservationGroupId && !o.supersededById)
  }

  function isPaid(o: PaymentObligation) {
    return PAID_STATUSES.has(o.resultStatus)
  }

  /** กลุ่มจะยืนยันได้เมื่อทุก obligation ของสมาชิกทุกคนชำระครบ (RESV-001) */
  function groupPaymentComplete(reservationGroupId: string) {
    const list = obligationsForGroup(reservationGroupId)
    return list.length > 0 && list.every(isPaid)
  }

  /**
   * สร้าง obligations เมื่อกลุ่มเข้าสู่ payment hold (จำลอง PRICE-001..003)
   * 1 รายการ = ผู้พัก 1 คน × 1 action; ห้อง HL ได้ ROOM + HL แยกกัน; idempotent ต่อกลุ่ม
   */
  function generateObligationsForGroup(resv: ReservationGroup, roomConfig: RoomConfig, deadline: string) {
    if (obligations.value.some(o => o.reservationGroupId === resv.id)) return
    const today = new Date().toISOString().slice(0, 10)
    for (const memberId of resv.memberIds) {
      for (const line of priceLinesFor(roomConfig, resv.occupancyMode)) {
        obligations.value.push({
          id: `ob-${resv.id}-${memberId}-${line.action}`,
          residentId: memberId,
          reservationGroupId: resv.id,
          roomNumber: resv.roomNumber,
          action: line.action,
          ref2: line.ref2,
          title: line.title,
          amount: line.amount,
          billIssueDate: today,
          paymentDeadline: deadline,
          academicYear: CURRENT_ACADEMIC_YEAR,
          documentStatus: 'ready_for_export',
          resultStatus: 'awaiting_payment',
        })
      }
    }
  }

  const openExceptions = computed(() => exceptions.value.filter(e => e.status === 'open'))
  const unmatchedPdfPages = computed(() =>
    pdfPages.value.filter(p => p.matchStatus === 'ambiguous' || p.matchStatus === 'unmatched'),
  )
  const readyForExport = computed(() =>
    obligations.value.filter(o => o.documentStatus === 'ready_for_export'),
  )

  return {
    obligations,
    batches,
    pdfPages,
    resultRows,
    exceptions,
    manualRecords,
    myObligations,
    obligationsForGroup,
    isPaid,
    groupPaymentComplete,
    generateObligationsForGroup,
    openExceptions,
    unmatchedPdfPages,
    readyForExport,
  }
})
