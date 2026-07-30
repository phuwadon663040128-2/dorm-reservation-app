import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ManualPaymentRecord,
  PaymentException,
  PaymentObligation,
  PaymentRefundRecord,
  PaymentRefundStatus,
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
import { useContractsStore } from './contracts'
import { INPUT_LIMITS } from '@/lib/validation'

const PAID_STATUSES = new Set(['paid', 'manual_recorded', 'confirmed'])

export const usePaymentsStore = defineStore('payments', () => {
  const obligations = ref<PaymentObligation[]>(obligationFixtures)
  const batches = ref<ScbExportBatch[]>(batchFixtures)
  const pdfPages = ref<ReturnedPdfPage[]>(pdfFixtures)
  const resultRows = ref<PaymentResultRow[]>(resultFixtures)
  const exceptions = ref<PaymentException[]>(exceptionFixtures)
  const manualRecords = ref<ManualPaymentRecord[]>(manualFixtures)
  const refundRecords = ref<PaymentRefundRecord[]>([])

  const session = useSessionStore()
  const contractsStore = useContractsStore()

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

  function hasPaidObligationsForReservation(reservationGroupId: string) {
    return obligationsForGroup(reservationGroupId).some(isPaid)
  }

  function pausePaymentForCancellation(reservationGroupId: string, requestId: string) {
    const suspendedAt = new Date().toISOString()
    let changed = 0
    obligationsForGroup(reservationGroupId).forEach((obligation) => {
      if (isPaid(obligation) || obligation.documentStatus === 'cancelled') return
      if (!obligation.suspendedAt) changed += 1
      obligation.suspendedAt = suspendedAt
      obligation.suspensionReason = `รอตรวจคำขอยกเลิก ${requestId}`
    })
    return changed
  }

  function resumePaymentForCancellation(reservationGroupId: string, deadline?: string) {
    let changed = 0
    obligationsForGroup(reservationGroupId).forEach((obligation) => {
      if (!obligation.suspendedAt) return
      obligation.suspendedAt = undefined
      obligation.suspensionReason = undefined
      if (deadline && !isPaid(obligation)) obligation.paymentDeadline = deadline
      changed += 1
    })
    return changed
  }

  function createRefundRecordsForReservation(reservationGroupId: string, cancellationRequestId: string) {
    const now = new Date().toISOString()
    const created: PaymentRefundRecord[] = []
    obligationsForGroup(reservationGroupId).filter(isPaid).forEach((obligation) => {
      const existing = refundRecords.value.find(record => record.obligationId === obligation.id)
      if (existing) return
      const record: PaymentRefundRecord = {
        id: `refund-${obligation.id}`,
        cancellationRequestId,
        reservationGroupId,
        obligationId: obligation.id,
        residentId: obligation.residentId,
        action: obligation.action,
        paidAmount: obligation.amount,
        requestedAmount: obligation.amount,
        responsibleEntity: obligation.action === 'HL' ? 'หน่วยงานผู้รับเงิน HL' : 'หอพักผู้รับเงิน ROOM',
        status: 'pending_review',
        createdAt: now,
        updatedAt: now,
      }
      refundRecords.value.unshift(record)
      created.push(record)
    })
    return created
  }

  function updateRefundRecord(
    refundId: string,
    update: {
      status: PaymentRefundStatus
      approvedAmount?: number
      externalReference?: string
      notes?: string
    },
  ) {
    if (!session.can('payment.refund_status.manage')) return false
    const record = refundRecords.value.find(item => item.id === refundId)
    if (!record) return false
    const notes = update.notes?.trim() ?? ''
    const externalReference = update.externalReference?.trim() ?? ''
    if (notes.length > INPUT_LIMITS.refundNotes || externalReference.length > INPUT_LIMITS.refundReference) return false
    if (['approved', 'processing', 'completed'].includes(update.status)) {
      if (update.approvedAmount === undefined || update.approvedAmount < 0 || update.approvedAmount > record.paidAmount) return false
    }
    if (update.status === 'rejected' && !notes) return false
    if (update.status === 'completed' && !externalReference) return false

    record.status = update.status
    record.approvedAmount = update.approvedAmount
    record.externalReference = externalReference || undefined
    record.notes = notes || undefined
    record.completedAt = update.status === 'completed' ? new Date().toISOString() : undefined
    record.updatedAt = new Date().toISOString()
    record.updatedBy = session.currentUser?.id ?? 'staff-demo'
    contractsStore.addAudit({
      actor: record.updatedBy,
      action: 'payment.refund_status.update',
      relatedIds: [record.id, record.obligationId, record.reservationGroupId],
      detail: `อัปเดตสถานะคืนเงิน ${record.action} เป็น ${update.status}${record.externalReference ? ` อ้างอิง ${record.externalReference}` : ''}`,
    })
    return true
  }

  /** ปิดรายการของ hold ที่หมดอายุ เพื่อไม่ให้ QR เดิมถูกนำกลับมาชำระซ้ำ */
  function cancelObligationsForReservation(reservationGroupId: string) {
    let changed = 0
    obligationsForGroup(reservationGroupId).forEach((obligation) => {
      if (obligation.documentStatus === 'cancelled') return
      obligation.documentStatus = 'cancelled'
      obligation.resultStatus = isPaid(obligation) ? 'refund_status' : 'cancelled'
      obligation.suspendedAt = undefined
      obligation.suspensionReason = undefined
      changed += 1
    })
    return changed
  }

  /**
   * สร้าง obligations เมื่อกลุ่มเข้าสู่ payment hold (จำลอง PRICE-001..003)
   * 1 รายการ = ผู้พัก 1 คน × 1 action; ห้อง HL ได้ ROOM + HL แยกกัน; idempotent ต่อกลุ่ม
   */
  function generateObligationsForGroup(
    resv: ReservationGroup,
    dormGroupId: string,
    roomConfig: RoomConfig,
    deadline: string,
    options: { demoPaymentReady?: boolean } = {},
  ) {
    if (obligations.value.some(o => o.reservationGroupId === resv.id)) return
    const today = new Date().toISOString().slice(0, 10)
    for (const memberId of resv.memberIds) {
      for (const line of priceLinesFor(dormGroupId, roomConfig, resv.occupancyMode)) {
        const id = `ob-${resv.id}-${memberId}-${line.action}`
        obligations.value.push({
          id,
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
          documentStatus: options.demoPaymentReady ? 'payment_form_ready' : 'ready_for_export',
          resultStatus: 'awaiting_payment',
          pdfPageId: options.demoPaymentReady ? `pdf-demo-${id}` : undefined,
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
    if (!obligation || obligation.documentStatus !== 'payment_form_ready' || obligation.suspendedAt) return false
    if (PAID_STATUSES.has(obligation.resultStatus)) return true
    if (new Date(obligation.paymentDeadline).getTime() <= Date.now()) return false

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
        && obligation.resultStatus === 'awaiting_payment'
        && !obligation.suspendedAt,
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
    refundRecords,
    myObligations,
    obligationsForGroup,
    isPaid,
    groupPaymentComplete,
    hasPaidObligationsForReservation,
    pausePaymentForCancellation,
    resumePaymentForCancellation,
    createRefundRecordsForReservation,
    updateRefundRecord,
    cancelObligationsForReservation,
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
