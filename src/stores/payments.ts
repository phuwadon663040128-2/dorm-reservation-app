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
  users,
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

  function createExportBatch(obligationIds: string[]): ScbExportBatch | undefined {
    const selected = obligations.value.filter(
      obligation => obligationIds.includes(obligation.id) && obligation.documentStatus === 'ready_for_export',
    )
    if (selected.length === 0) return undefined

    const nextNumber = batches.value.reduce((highest, batch) => {
      const match = batch.id.match(/(\d+)$/)
      return Math.max(highest, match ? Number(match[1]) : 0)
    }, 0) + 1
    const id = `batch-${CURRENT_ACADEMIC_YEAR}-${String(nextNumber).padStart(3, '0')}`
    const batch: ScbExportBatch = {
      id,
      createdAt: new Date().toISOString(),
      createdBy: session.currentUser?.id ?? 'staff-demo',
      status: 'draft',
      fileChecksum: `sha256:demo-${Math.abs(id.split('').reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) | 0, 7)).toString(16)}`,
      rows: selected.map(obligation => {
        const resident = users.find(user => user.id === obligation.residentId)
        return {
          obligationId: obligation.id,
          payerName: obligation.title,
          ref1: obligation.roomNumber,
          ref2: obligation.ref2,
          amount: obligation.amount,
          paymentDate: obligation.billIssueDate,
          email: resident?.email ?? '',
          alertMessage: 'DEFAULT' as const,
          remark: obligation.action === 'HL' ? 'ค่าบริการ HL' : 'ค่าห้องพัก',
        }
      }),
    }

    batches.value.unshift(batch)
    selected.forEach(obligation => { obligation.documentStatus = 'exported' })
    return batch
  }

  /** บันทึกว่าดาวน์โหลดไฟล์ส่ง SCB แล้ว และรอ combined PDF กลับมา */
  function markBatchExported(batchId: string) {
    const batch = batches.value.find(item => item.id === batchId)
    if (!batch) return false
    if (batch.status === 'draft' || batch.status === 'exported') {
      batch.status = 'awaiting_returned_pdf'
      for (const row of batch.rows) {
        const obligation = obligations.value.find(item => item.id === row.obligationId)
        if (obligation) obligation.documentStatus = 'awaiting_returned_pdf'
      }
    }
    return true
  }

  /** จำลองการแยกหน้าและ match returned PDF ที่มาจาก SCB/internal app */
  function importReturnedPdf(batchId: string) {
    const batch = batches.value.find(item => item.id === batchId)
    if (!batch || !['exported', 'awaiting_returned_pdf'].includes(batch.status)) return 0

    let imported = 0
    batch.rows.forEach((row, index) => {
      const obligation = obligations.value.find(item => item.id === row.obligationId)
      if (!obligation) return
      let page = pdfPages.value.find(item => item.matchedObligationId === obligation.id)
      if (!page) {
        page = {
          id: `pdf-${batch.id}-${index + 1}`,
          batchId: batch.id,
          pageNo: index + 1,
          extractedText: `${row.payerName} | ${row.ref1} | ${row.ref2} | ${row.amount.toFixed(2)}`,
          matchStatus: 'matched',
          matchedObligationId: obligation.id,
          matchNote: 'จับคู่อัตโนมัติใน interactive prototype',
        }
        pdfPages.value.push(page)
      }
      obligation.pdfPageId = page.id
      obligation.documentStatus = 'payment_form_ready'
      imported += 1
    })
    batch.status = 'pdf_imported'
    return imported
  }

  /** ปุ่มนี้แทนเหตุการณ์ภายนอก: ผู้สมัครจ่ายแล้วและ SCB ส่งผลกลับเข้าระบบ */
  function simulateBankPayment(obligationId: string) {
    const obligation = obligations.value.find(item => item.id === obligationId)
    if (!obligation || obligation.documentStatus !== 'payment_form_ready') return false
    if (PAID_STATUSES.has(obligation.resultStatus)) return true

    const now = new Date().toISOString()
    obligation.resultStatus = 'paid'
    resultRows.value.unshift({
      id: `res-demo-${Date.now()}`,
      importId: `imp-demo-${now.slice(0, 10)}`,
      transactionRef: `SCB-DEMO-${Date.now().toString().slice(-8)}`,
      ref1: obligation.roomNumber,
      ref2: obligation.ref2,
      amount: obligation.amount,
      paidAt: now,
      matchedObligationId: obligation.id,
      outcome: 'paid',
    })
    return true
  }

  function importDemoPaymentResults() {
    const payable = obligations.value.filter(
      obligation => obligation.documentStatus === 'payment_form_ready'
        && obligation.resultStatus === 'awaiting_payment',
    )
    let imported = 0
    for (const obligation of payable) {
      if (simulateBankPayment(obligation.id)) imported += 1
    }
    return imported
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
    createExportBatch,
    markBatchExported,
    importReturnedPdf,
    simulateBankPayment,
    importDemoPaymentResults,
    openExceptions,
    unmatchedPdfPages,
    readyForExport,
  }
})
