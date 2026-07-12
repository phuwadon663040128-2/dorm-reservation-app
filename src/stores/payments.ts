import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ManualPaymentRecord,
  PaymentException,
  PaymentObligation,
  PaymentResultRow,
  ReturnedPdfPage,
  ScbExportBatch,
} from '@/types'
import {
  manualPayments as manualFixtures,
  obligations as obligationFixtures,
  paymentExceptions as exceptionFixtures,
  paymentResultRows as resultFixtures,
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
    openExceptions,
    unmatchedPdfPages,
    readyForExport,
  }
})
