import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CancellationRequest,
  CancellationRequestKind,
  OccupancyMode,
  ReservationGroup,
  RoommateGroup,
  RoommateInvitation,
} from '@/types'
import { reservationGroups as resvFixtures, roommateGroups as groupFixtures, roommateInvitations as invitationFixtures, users } from '@/fixtures'
import { roomConfigLabel } from '@/lib/labels'
import { INPUT_LIMITS, roommateSearchSchema } from '@/lib/validation'
import { useApplicationStore } from './application'
import { useContractsStore } from './contracts'
import { useDormStore } from './dorm'
import { usePaymentsStore } from './payments'
import { useSessionStore } from './session'

export interface ActionResult {
  ok: boolean
  message: string
}

export interface RoommateSearchCandidate {
  id: string
  displayName: string
  email: string
  studentId?: string
  available: boolean
  unavailableReason?: string
}

export interface RoommateCandidateSearchResult {
  items: RoommateSearchCandidate[]
  hasMore: boolean
}

export const ROOMMATE_SEARCH_MIN_STUDENT_DIGITS = 6
export const ROOMMATE_SEARCH_MIN_LENGTH = 6
export const ROOMMATE_SEARCH_RESULT_LIMIT = 5
export const ROOMMATE_SEARCH_MAX_LENGTH = INPUT_LIMITS.roommateSearch

const ACTIVE_GROUP_STATUSES = ['invitation_pending', 'accepted', 'room_confirmation_pending', 'ready_for_payment', 'confirmed']
type ActiveHoldStatus = Extract<ReservationGroup['holdStatus'], 'held_roommate_confirmation' | 'held_payment' | 'confirmed'>
const ACTIVE_HOLD_STATUSES: ActiveHoldStatus[] = ['held_roommate_confirmation', 'held_payment', 'confirmed']

function isActiveHoldStatus(status: ReservationGroup['holdStatus']): status is ActiveHoldStatus {
  return ACTIVE_HOLD_STATUSES.includes(status as ActiveHoldStatus)
}

function inMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

export const useReservationStore = defineStore('reservation', () => {
  const invitations = ref<RoommateInvitation[]>(invitationFixtures)
  const roommateGroups = ref<RoommateGroup[]>(groupFixtures)
  const reservationGroups = ref<ReservationGroup[]>(resvFixtures)
  const cancellationRequests = ref<CancellationRequest[]>([])

  const session = useSessionStore()
  const application = useApplicationStore()
  const dorm = useDormStore()
  const payments = usePaymentsStore()
  const contractsStore = useContractsStore()

  // ---------- getters ----------

  function activeGroupOf(userId: string) {
    return roommateGroups.value.find(
      g => g.memberIds.includes(userId) && ACTIVE_GROUP_STATUSES.includes(g.status),
    )
  }

  function pendingInvitationOf(userId: string) {
    return invitations.value.find(
      i => (i.leaderId === userId || i.inviteeId === userId) && i.status === 'pending',
    )
  }

  function activeReservationOf(userId: string) {
    return reservationGroups.value.find(
      r => r.memberIds.includes(userId) && isActiveHoldStatus(r.holdStatus),
    )
  }

  const myRoommateGroup = computed(() => {
    const uid = session.currentUser?.id
    return uid ? activeGroupOf(uid) : undefined
  })

  const myReservation = computed(() => {
    const uid = session.currentUser?.id
    return uid ? activeReservationOf(uid) : undefined
  })

  /** รายการล่าสุด รวม hold ที่หมดอายุหรือถูกปล่อยคืน โดยรายการใหม่ถูกเพิ่มไว้ด้านหน้า */
  const myLatestReservation = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return undefined
    return reservationGroups.value.find(r => r.memberIds.includes(uid))
  })

  const myInvitations = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return []
    return invitations.value.filter(i => i.leaderId === uid || i.inviteeId === uid)
  })

  const myReceivedPendingInvitations = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return []
    return invitations.value.filter(i => i.inviteeId === uid && i.status === 'pending')
  })

  function reservationById(id: string) {
    return reservationGroups.value.find(r => r.id === id)
  }

  function cancellationRequestForReservation(reservationGroupId: string) {
    return cancellationRequests.value.find(request => request.reservationGroupId === reservationGroupId)
  }

  function pendingCancellationForReservation(reservationGroupId: string) {
    return cancellationRequests.value.find(
      request => request.reservationGroupId === reservationGroupId && request.status === 'pending',
    )
  }

  const pendingCancellationRequests = computed(() =>
    cancellationRequests.value.filter(request => request.status === 'pending'),
  )

  const myLatestCancellationRequest = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return undefined
    return cancellationRequests.value.find((request) => {
      const resv = reservationById(request.reservationGroupId)
      return resv?.memberIds.includes(uid)
    })
  })

  // คิวฝั่ง staff
  const activeHolds = computed(() =>
    reservationGroups.value.filter(r =>
      ['held_roommate_confirmation', 'held_payment'].includes(r.holdStatus),
    ),
  )

  const confirmedReservations = computed(() =>
    reservationGroups.value.filter(r => r.holdStatus === 'confirmed'),
  )

  function notifyReservationMembers(resv: ReservationGroup, title: string, detail: string) {
    resv.memberIds.forEach(memberId => contractsStore.addNotification(memberId, title, detail))
  }

  function completeCancellation(resv: ReservationGroup, request: CancellationRequest, actor: string) {
    if (resv.holdStatus === 'cancelled') return false
    payments.createRefundRecordsForReservation(resv.id, request.id)
    resv.holdStatus = 'cancelled'
    resv.confirmationDeadline = undefined
    resv.paymentDeadline = undefined
    dorm.setRoomStatus(resv.roomNumber, 'available')
    application.releaseRoomAssignmentForReservation(resv.id, `ยกเลิกการจอง: ${request.reason}`)
    payments.cancelObligationsForReservation(resv.id)
    contractsStore.cancelUnsignedContractsForReservation(resv.id)
    const group = roommateGroups.value.find(item => item.id === resv.roommateGroupId)
    if (group) group.status = 'accepted'
    notifyReservationMembers(
      resv,
      'การจองถูกยกเลิกแล้ว',
      `ห้อง ${resv.roomNumber} ถูกปล่อยคืนแล้ว${payments.refundRecords.some(item => item.cancellationRequestId === request.id) ? ' ยอดที่ชำระแล้วอยู่ระหว่างการตรวจสอบคืนเงินแยกรายการ' : ''}`,
    )
    contractsStore.addAudit({
      actor,
      action: 'reservation.cancel',
      reason: request.reason,
      relatedIds: [resv.id, request.id, resv.roomNumber],
      detail: `ยกเลิกการจองห้อง ${resv.roomNumber} และปล่อยห้องคืน โดยเก็บประวัติการชำระและ room assignment เดิมไว้`,
    })
    return true
  }

  function cancelUnpaidReservation(resvId: string, reason: string): ActionResult {
    const me = session.currentUser
    const resv = reservationById(resvId)
    const normalizedReason = reason.trim()
    if (!me || !resv || !isActiveHoldStatus(resv.holdStatus)) {
      return { ok: false, message: 'ไม่พบการจองที่สามารถยกเลิกได้' }
    }
    if (!normalizedReason || normalizedReason.length > INPUT_LIMITS.cancellationReason) {
      return { ok: false, message: `กรุณาระบุเหตุผลไม่เกิน ${INPUT_LIMITS.cancellationReason} ตัวอักษร` }
    }
    if (pendingCancellationForReservation(resv.id)) {
      return { ok: true, message: 'คำขอยกเลิกนี้อยู่ระหว่างการตรวจสอบแล้ว' }
    }
    if (resv.occupancyMode === 'shared' && resv.leaderId !== me.id) {
      return { ok: false, message: 'เฉพาะหัวหน้ากลุ่มเท่านั้นที่ยกเลิกการจองทั้งกลุ่มได้' }
    }
    if (!resv.memberIds.includes(me.id)) return { ok: false, message: 'คุณไม่ใช่สมาชิกของการจองนี้' }
    if (contractsStore.hasSignedContractForReservation(resv.id)) {
      return { ok: false, message: 'การจองนี้มีสัญญาที่ลงนามแล้ว กรุณาติดต่อเจ้าหน้าที่หอพัก' }
    }
    if (payments.hasPaidObligationsForReservation(resv.id) || resv.holdStatus === 'confirmed') {
      return { ok: false, message: 'การจองนี้มีรายการชำระแล้ว กรุณาส่งคำขอยกเลิกให้เจ้าหน้าที่ตรวจสอบ' }
    }

    const now = new Date().toISOString()
    const request: CancellationRequest = {
      id: `cancel-${Date.now()}`,
      reservationGroupId: resv.id,
      kind: 'group_cancellation',
      status: 'approved',
      requestedBy: me.id,
      reason: normalizedReason,
      requestedAt: now,
      previousHoldStatus: resv.holdStatus,
      reviewedBy: 'system',
      reviewedAt: now,
      reviewReason: 'ยังไม่มีรายการชำระเงิน จึงยกเลิกและปล่อยห้องทันทีตามกติกา',
    }
    cancellationRequests.value.unshift(request)
    completeCancellation(resv, request, me.id)
    return { ok: true, message: `ยกเลิกการจองห้อง ${resv.roomNumber} และปล่อยห้องคืนแล้ว` }
  }

  function requestPaidCancellation(
    resvId: string,
    reason: string,
    kind: CancellationRequestKind = 'group_cancellation',
  ): ActionResult {
    const me = session.currentUser
    const resv = reservationById(resvId)
    const normalizedReason = reason.trim()
    if (!me || !resv || !isActiveHoldStatus(resv.holdStatus)) {
      return { ok: false, message: 'ไม่พบการจองที่สามารถส่งคำขอยกเลิกได้' }
    }
    if (!normalizedReason || normalizedReason.length > INPUT_LIMITS.cancellationReason) {
      return { ok: false, message: `กรุณาระบุเหตุผลไม่เกิน ${INPUT_LIMITS.cancellationReason} ตัวอักษร` }
    }
    const existing = pendingCancellationForReservation(resv.id)
    if (existing) return { ok: true, message: 'คำขอยกเลิกนี้อยู่ระหว่างการตรวจสอบแล้ว' }
    if (!resv.memberIds.includes(me.id)) return { ok: false, message: 'คุณไม่ใช่สมาชิกของการจองนี้' }
    if (kind === 'group_cancellation' && resv.occupancyMode === 'shared' && resv.leaderId !== me.id) {
      return { ok: false, message: 'เฉพาะหัวหน้ากลุ่มเท่านั้นที่ส่งคำขอยกเลิกทั้งกลุ่มได้' }
    }
    if (kind === 'member_withdrawal' && resv.leaderId === me.id) {
      return { ok: false, message: 'หัวหน้ากลุ่มต้องใช้คำขอยกเลิกทั้งการจอง' }
    }
    if (contractsStore.hasSignedContractForReservation(resv.id)) {
      return { ok: false, message: 'การจองนี้มีสัญญาที่ลงนามแล้ว กรุณาติดต่อเจ้าหน้าที่หอพัก' }
    }

    const nowMs = Date.now()
    const request: CancellationRequest = {
      id: `cancel-${nowMs}`,
      reservationGroupId: resv.id,
      kind,
      status: 'pending',
      requestedBy: me.id,
      reason: normalizedReason,
      requestedAt: new Date(nowMs).toISOString(),
      previousHoldStatus: resv.holdStatus,
      remainingConfirmationMs: resv.confirmationDeadline
        ? Math.max(0, new Date(resv.confirmationDeadline).getTime() - nowMs)
        : undefined,
      remainingPaymentMs: resv.paymentDeadline
        ? Math.max(0, new Date(resv.paymentDeadline).getTime() - nowMs)
        : undefined,
    }
    cancellationRequests.value.unshift(request)
    resv.confirmationDeadline = undefined
    resv.paymentDeadline = undefined
    if (resv.holdStatus !== 'confirmed') dorm.setRoomStatus(resv.roomNumber, 'temporarily_held')
    payments.pausePaymentForCancellation(resv.id, request.id)
    contractsStore.setReservationCancellationBlocked(resv.id, true)
    notifyReservationMembers(
      resv,
      kind === 'member_withdrawal' ? 'สมาชิกส่งคำขอถอนตัว' : 'ส่งคำขอยกเลิกการจองแล้ว',
      `คำขอสำหรับห้อง ${resv.roomNumber} อยู่ระหว่างการตรวจสอบ ห้องและรายการชำระเงินที่เหลือถูกพักไว้ชั่วคราว`,
    )
    contractsStore.addAudit({
      actor: me.id,
      action: kind === 'member_withdrawal' ? 'reservation.member_withdrawal.request' : 'reservation.cancel.request',
      reason: normalizedReason,
      relatedIds: [resv.id, request.id],
      detail: `ส่งคำขอสำหรับห้อง ${resv.roomNumber} และพัก deadline/รายการชำระเงินระหว่างรอเจ้าหน้าที่`,
    })
    return { ok: true, message: 'ส่งคำขอเรียบร้อยแล้ว เจ้าหน้าที่จะตรวจสอบก่อนปล่อยห้องและพิจารณายอดที่ชำระ' }
  }

  function reviewCancellationRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewReason: string,
  ): ActionResult {
    const reviewer = session.currentUser
    const request = cancellationRequests.value.find(item => item.id === requestId)
    const normalizedReason = reviewReason.trim()
    if (!reviewer || !session.can('reservation.cancel.review')) return { ok: false, message: 'คุณไม่มีสิทธิ์ตรวจคำขอยกเลิก' }
    if (!request) return { ok: false, message: 'ไม่พบคำขอยกเลิก' }
    if (request.status !== 'pending') return { ok: true, message: 'คำขอนี้ถูกตรวจสอบแล้ว' }
    if (!normalizedReason || normalizedReason.length > INPUT_LIMITS.reviewReason) {
      return { ok: false, message: `กรุณาระบุผลการตรวจไม่เกิน ${INPUT_LIMITS.reviewReason} ตัวอักษร` }
    }
    const resv = reservationById(request.reservationGroupId)
    if (!resv) return { ok: false, message: 'ไม่พบการจองที่เชื่อมกับคำขอ' }

    request.status = decision
    request.reviewedBy = reviewer.id
    request.reviewedAt = new Date().toISOString()
    request.reviewReason = normalizedReason

    if (decision === 'approved') {
      completeCancellation(resv, request, reviewer.id)
    }
    else {
      let restoredDeadline: string | undefined
      if (request.previousHoldStatus === 'held_roommate_confirmation') {
        restoredDeadline = inMs(request.remainingConfirmationMs ?? 0)
        resv.confirmationDeadline = restoredDeadline
        dorm.setRoomStatus(resv.roomNumber, 'temporarily_held', restoredDeadline)
      }
      else if (request.previousHoldStatus === 'held_payment') {
        restoredDeadline = inMs(request.remainingPaymentMs ?? 0)
        resv.paymentDeadline = restoredDeadline
        dorm.setRoomStatus(resv.roomNumber, 'temporarily_held', restoredDeadline)
        payments.resumePaymentForCancellation(resv.id, restoredDeadline)
      }
      else {
        dorm.setRoomStatus(resv.roomNumber, 'reserved')
        payments.resumePaymentForCancellation(resv.id)
      }
      contractsStore.setReservationCancellationBlocked(resv.id, false)
      notifyReservationMembers(resv, 'คำขอยกเลิกไม่ได้รับอนุมัติ', `การจองห้อง ${resv.roomNumber} กลับสู่สถานะเดิม เหตุผล: ${normalizedReason}`)
      contractsStore.addAudit({
        actor: reviewer.id,
        action: 'reservation.cancel.reject',
        reason: normalizedReason,
        relatedIds: [resv.id, request.id],
        detail: `ปฏิเสธคำขอยกเลิกห้อง ${resv.roomNumber} และคืน deadline/รายการชำระเงินตามเวลาที่เหลือ`,
      })
    }
    return { ok: true, message: decision === 'approved' ? 'อนุมัติคำขอและปล่อยห้องเรียบร้อยแล้ว' : 'ปฏิเสธคำขอและคืนสถานะการจองแล้ว' }
  }

  // ---------- P3 actions (จำลอง domain service ฝั่ง server) ----------

  function roommateInviteEligibility(inviteeId: string): ActionResult {
    const invitee = users.find(u => u.id === inviteeId)
    if (!invitee || invitee.role !== 'applicant' || !invitee.emailVerified) {
      return { ok: false, message: 'ไม่พบบัญชีผู้สมัครที่พร้อมรับคำเชิญ' }
    }
    if (activeGroupOf(inviteeId) || pendingInvitationOf(inviteeId)) {
      return { ok: false, message: `${invitee.displayName} มีกลุ่มหรือคำเชิญที่ใช้งานอยู่แล้ว` }
    }
    return { ok: true, message: 'พร้อมรับคำเชิญ' }
  }

  /**
   * Mock ของ server-side candidate search: ไม่ค้นหาคำสั้น ไม่คืนข้อมูลทั้งหมด และหยุดทันทีเมื่อเกิน limit
   * ระบบจริงเปลี่ยน implementation นี้เป็น indexed API ได้โดยไม่ต้องเปลี่ยน UI
   */
  function searchRoommateCandidates(
    query: string,
    limit = ROOMMATE_SEARCH_RESULT_LIMIT,
  ): RoommateCandidateSearchResult {
    const validation = roommateSearchSchema.safeParse(query)
    if (!validation.success) {
      return { items: [], hasMore: false }
    }
    const normalized = validation.data.toLocaleLowerCase('th-TH')
    const studentDigits = normalized.replace(/\D/g, '')
    const isStudentIdSearch = /^[\d\s-]+$/.test(normalized)
      && studentDigits.length >= ROOMMATE_SEARCH_MIN_STUDENT_DIGITS
    const isExactEmailSearch = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)

    if (!isStudentIdSearch && !isExactEmailSearch) return { items: [], hasMore: false }

    const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)))
    const items: RoommateSearchCandidate[] = []
    let hasMore = false

    for (const user of users) {
      if (user.role !== 'applicant' || !user.emailVerified || user.id === session.currentUser?.id) continue

      const matches = isExactEmailSearch
        ? user.email.toLocaleLowerCase('th-TH') === normalized
        : (user.studentId ?? '').replace(/\D/g, '').startsWith(studentDigits)
      if (!matches) continue

      if (items.length >= safeLimit) {
        hasMore = true
        break
      }

      const eligibility = roommateInviteEligibility(user.id)
      items.push({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        studentId: user.studentId,
        available: eligibility.ok,
        unavailableReason: eligibility.ok ? undefined : eligibility.message,
      })
    }

    return { items, hasMore }
  }

  /** ส่งคำเชิญรูมเมท — อายุ 48 ชม. และ 1 คนมีได้ 1 คำเชิญ/กลุ่มที่ใช้งานอยู่ (GROUP-001/002) */
  function sendInvitation(inviteeId: string): ActionResult {
    const me = session.currentUser
    if (!me) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
    if (me.role !== 'applicant') return { ok: false, message: 'เฉพาะผู้สมัครเท่านั้นที่ส่งคำเชิญรูมเมทได้' }
    if (inviteeId === me.id) return { ok: false, message: 'ไม่สามารถส่งคำเชิญให้บัญชีของตนเองได้' }
    const invitee = users.find(u => u.id === inviteeId)
    if (!invitee || invitee.role !== 'applicant' || !invitee.emailVerified)
      return { ok: false, message: 'ไม่พบผู้ใช้ที่ต้องการเชิญ' }
    if (activeGroupOf(me.id) || pendingInvitationOf(me.id))
      return { ok: false, message: 'คุณมีกลุ่มหรือคำเชิญที่ใช้งานอยู่แล้ว (1 คนมีได้ 1 รายการ)' }
    const inviteeEligibility = roommateInviteEligibility(inviteeId)
    if (!inviteeEligibility.ok) return inviteeEligibility

    const campaignId = dorm.openCampaigns[0]?.id ?? 'camp-2569'
    invitations.value.unshift({
      id: `inv-${Date.now()}`,
      campaignId,
      leaderId: me.id,
      inviteeId,
      status: 'pending',
      sentAt: new Date().toISOString(),
      expiresAt: inMs(48 * 3_600_000),
    })
    contractsStore.addAudit({
      actor: me.id,
      action: 'roommate.invite',
      detail: `ส่งคำเชิญรูมเมทถึง ${invitee.displayName} (อายุ 48 ชั่วโมง)`,
    })
    return { ok: true, message: `ส่งคำเชิญถึง ${invitee.displayName} แล้ว — มีอายุ 48 ชั่วโมง` }
  }

  /** ตอบรับคำเชิญ → เกิดกลุ่มสถานะ accepted แล้วหัวหน้ากลุ่มจึงเลือกห้องได้ (GROUP-005/007) */
  function acceptInvitation(invitationId: string): ActionResult {
    const inv = invitations.value.find(i => i.id === invitationId)
    if (!inv || inv.status !== 'pending') return { ok: false, message: 'คำเชิญนี้ไม่อยู่ในสถานะรอตอบรับแล้ว' }
    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      inv.status = 'expired'
      return { ok: false, message: 'คำเชิญหมดอายุแล้ว (INVITATION_EXPIRED)' }
    }
    inv.status = 'accepted'
    roommateGroups.value.unshift({
      id: `group-${Date.now()}`,
      campaignId: inv.campaignId,
      leaderId: inv.leaderId,
      memberIds: [inv.leaderId, inv.inviteeId],
      status: 'accepted',
    })
    contractsStore.addAudit({
      actor: inv.inviteeId,
      action: 'roommate.accept',
      relatedIds: [inv.id],
      detail: 'ตอบรับคำเชิญรูมเมท — กลุ่มพร้อมให้หัวหน้ากลุ่มเลือกห้อง',
    })
    return { ok: true, message: 'ตอบรับคำเชิญแล้ว — หัวหน้ากลุ่มสามารถเลือกห้องได้' }
  }

  function declineInvitation(invitationId: string): ActionResult {
    const inv = invitations.value.find(i => i.id === invitationId)
    if (!inv || inv.status !== 'pending') return { ok: false, message: 'คำเชิญนี้ไม่อยู่ในสถานะรอตอบรับแล้ว' }
    inv.status = 'declined'
    return { ok: true, message: 'ปฏิเสธคำเชิญแล้ว — ทั้งสองฝ่ายเชิญ/รับคำเชิญใหม่ได้' }
  }

  /** เข้าสู่ payment hold หลังสมาชิกยืนยันห้องครบ และเก็บ assignment ไว้เชื่อมกับใบสมัครของทุกคน */
  function enterPaymentHold(resv: ReservationGroup): ActionResult {
    const campaign = dorm.campaignById(resv.campaignId)
    const room = dorm.roomByNumber(resv.roomNumber)
    if (!room) return { ok: false, message: 'ไม่พบข้อมูลห้องสำหรับสร้าง payment hold' }
    const building = dorm.buildings.find(item => item.id === room.buildingId)
    if (!building) return { ok: false, message: 'ไม่พบข้อมูลอาคารสำหรับบันทึกรายการจอง' }
    const dormGroup = dorm.dormGroups.find(item => item.id === building.dormGroupId)
    if (!dormGroup) return { ok: false, message: 'ไม่พบข้อมูลหอพักสำหรับบันทึกรายการจอง' }

    const assignmentResult = application.assignRoomForPaymentHold(resv.memberIds, {
      reservationId: resv.id,
      dormGroupId: dormGroup.id,
      dormName: dormGroup.name,
      dormCode: dormGroup.shortName,
      buildingId: building.id,
      buildingName: building.name,
      buildingCode: building.code,
      floor: room.floor,
      roomType: room.config,
      roomTypeLabel: roomConfigLabel[room.config],
      roomNumber: room.number,
      occupancyMode: resv.occupancyMode,
    })
    if (!assignmentResult.ok) {
      const affectedNames = assignmentResult.conflictingApplicantIds
        .map(id => users.find(user => user.id === id)?.displayName ?? id)
      return {
        ok: false,
        message: `ยังเก็บข้อมูลห้องไม่ได้ — ${affectedNames.join(', ')} มีการจองห้องที่ใช้งานอยู่แล้ว`,
      }
    }

    const deadline = inMs((campaign?.paymentHoldHours ?? 72) * 3_600_000)
    resv.holdStatus = 'held_payment'
    resv.confirmationDeadline = undefined
    resv.paymentDeadline = deadline
    dorm.setRoomStatus(resv.roomNumber, 'temporarily_held', deadline)
    const group = roommateGroups.value.find(g => g.id === resv.roommateGroupId)
    if (group) group.status = 'ready_for_payment'
    payments.generateObligationsForGroup(
      resv,
      dormGroup.id,
      room.config,
      deadline,
      { demoPaymentReady: true },
    )
    contractsStore.addAudit({
      actor: session.currentUser?.id ?? 'system',
      action: 'application.room_assignment',
      relatedIds: [resv.id, resv.roomNumber, ...resv.memberIds],
      detail: `เก็บข้อมูล ${dormGroup.shortName} ${building.name} ชั้น ${room.floor} ห้อง ${room.number} สำหรับเติมในใบสมัครของสมาชิก ${resv.memberIds.length} คน`,
    })
    return { ok: true, message: 'เข้าสู่ขั้นชำระเงินและเก็บข้อมูลห้องสำหรับใบสมัครแล้ว' }
  }

  /**
   * หัวหน้ากลุ่มกดจองห้อง — ล็อกห้องทันที (จำลอง HOLD-001 ฝั่ง client)
   * shared: ต้องมีกลุ่ม accepted และเป็นหัวหน้ากลุ่ม; แคมเปญกำหนดได้ว่าต้องมีรูมเมทยืนยันภายใน 15 นาที
   */
  function reserveRoom(roomNumber: string, occupancyMode: OccupancyMode): ActionResult {
    const me = session.currentUser
    if (!me) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
    if (myReservation.value) return { ok: false, message: 'คุณมีการจองที่ใช้งานอยู่แล้ว (1 คน 1 การจอง)' }

    const room = dorm.roomByNumber(roomNumber)
    if (!room) return { ok: false, message: 'ไม่พบห้องนี้' }
    const building = dorm.buildings.find(item => item.id === room.buildingId)
    if (!building) return { ok: false, message: 'ไม่พบข้อมูลอาคารของห้องนี้' }
    if (room.publicStatus !== 'available')
      return { ok: false, message: `ห้อง ${roomNumber} ไม่ว่างแล้ว (ROOM_NOT_AVAILABLE) — เลือกห้องอื่น` }
    if (!room.occupancyCapability.includes(occupancyMode))
      return { ok: false, message: 'ห้องนี้ไม่รองรับรูปแบบการพักที่เลือก' }

    const group = activeGroupOf(me.id)
    if (occupancyMode === 'shared') {
      if (!group || group.status !== 'accepted')
        return { ok: false, message: 'พักคู่ต้องมีกลุ่มรูมเมทที่ตอบรับแล้วก่อนเลือกห้อง (GROUP-007)' }
      if (group.leaderId !== me.id)
        return { ok: false, message: 'เฉพาะหัวหน้ากลุ่มเท่านั้นที่กดจองห้องได้ (GROUP-008)' }
      const membersWithActiveReservations = group.memberIds.filter(
        applicantId => Boolean(activeReservationOf(applicantId)),
      )
      if (membersWithActiveReservations.length) {
        const memberNames = membersWithActiveReservations
          .map(id => users.find(user => user.id === id)?.displayName ?? id)
        return {
          ok: false,
          message: `พักคู่ไม่ได้ — ${memberNames.join(', ')} มีการจองที่ใช้งานอยู่แล้ว (1 คน 1 การจอง)`,
        }
      }
    } else if (group) {
      return { ok: false, message: 'คุณอยู่ในกลุ่มรูมเมท — ยกเลิกกลุ่มก่อนจึงจะเหมาห้องคนเดียวได้' }
    }

    const campaign = dorm.openCampaigns[0]
    if (!campaign) return { ok: false, message: 'ไม่มีรอบรับสมัครที่เปิดอยู่' }

    const resv: ReservationGroup = {
      id: `resv-${Date.now()}`,
      campaignId: campaign.id,
      roommateGroupId: occupancyMode === 'shared' ? group!.id : undefined,
      occupancyMode,
      roomNumber,
      memberIds: occupancyMode === 'shared' ? [...group!.memberIds] : [me.id],
      leaderId: me.id,
      holdStatus: 'held_roommate_confirmation',
    }
    reservationGroups.value.unshift(resv)

    if (occupancyMode === 'shared' && campaign.roommateRoomConfirmationRequired) {
      const deadline = inMs(campaign.roomConfirmationMinutes * 60_000)
      resv.confirmationDeadline = deadline
      dorm.setRoomStatus(roomNumber, 'temporarily_held', deadline)
      if (group) group.status = 'room_confirmation_pending'
      contractsStore.addAudit({
        actor: me.id,
        action: 'reservation.reserve',
        relatedIds: [resv.id, roomNumber],
        detail: `หัวหน้ากลุ่มจองห้อง ${roomNumber} (พักคู่) — ล็อกห้องทันทีและรอรูมเมทยืนยัน`,
      })
      return {
        ok: true,
        message: `ล็อกห้อง ${roomNumber} แล้ว — รูมเมทต้องยืนยันห้องภายใน ${campaign.roomConfirmationMinutes} นาที`,
      }
    }

    const paymentHoldResult = enterPaymentHold(resv)
    if (!paymentHoldResult.ok) {
      reservationGroups.value = reservationGroups.value.filter(item => item.id !== resv.id)
      return paymentHoldResult
    }
    contractsStore.addAudit({
      actor: me.id,
      action: 'reservation.reserve',
      relatedIds: [resv.id, roomNumber],
      detail: `จองห้อง ${roomNumber} (${occupancyMode === 'shared' ? 'พักคู่' : 'เหมาห้อง'}) — ล็อกห้องและเข้าสู่ payment hold`,
    })
    return {
      ok: true,
      message: `ล็อกห้อง ${roomNumber} แล้ว — ชำระเงินภายใน ${campaign.paymentHoldHours} ชั่วโมง`,
    }
  }

  /** รูมเมทยืนยันห้องที่หัวหน้ากลุ่มเลือก → เข้าสู่ payment hold (HOLD-003) */
  function confirmRoomSelection(resvId: string): ActionResult {
    const me = session.currentUser
    if (!me) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
    const resv = reservationById(resvId)
    if (resv && pendingCancellationForReservation(resv.id)) {
      return { ok: false, message: 'การจองนี้มีคำขอยกเลิกที่กำลังรอตรวจสอบ' }
    }
    if (!resv || resv.holdStatus !== 'held_roommate_confirmation')
      return { ok: false, message: 'การจองนี้ไม่อยู่ในขั้นรอยืนยันห้องแล้ว' }
    if (!resv.memberIds.includes(me.id))
      return { ok: false, message: 'คุณไม่ใช่สมาชิกของการจองนี้' }
    if (resv.leaderId === me.id)
      return { ok: false, message: 'หัวหน้ากลุ่มไม่สามารถยืนยันแทนรูมเมทได้' }
    if (resv.confirmationDeadline && new Date(resv.confirmationDeadline).getTime() < Date.now()) {
      expireHold(resvId)
      return { ok: false, message: 'หมดเวลายืนยัน — ห้องถูกปล่อยคืนแล้ว' }
    }
    const paymentHoldResult = enterPaymentHold(resv)
    if (!paymentHoldResult.ok) return paymentHoldResult
    contractsStore.addAudit({
      actor: session.currentUser?.id ?? 'unknown',
      action: 'reservation.confirm_room',
      relatedIds: [resv.id, resv.roomNumber],
      detail: `รูมเมทยืนยันห้อง ${resv.roomNumber} — เข้าสู่ payment hold 72 ชั่วโมง`,
    })
    return { ok: true, message: `ยืนยันห้อง ${resv.roomNumber} แล้ว — กลุ่มมีเวลาชำระเงิน 72 ชั่วโมง` }
  }

  /** รูมเมทปฏิเสธห้อง → ปล่อยห้องทันที กลุ่มกลับสถานะ accepted (HOLD-005) */
  function declineRoomSelection(resvId: string): ActionResult {
    const me = session.currentUser
    if (!me) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
    const resv = reservationById(resvId)
    if (resv && pendingCancellationForReservation(resv.id)) {
      return { ok: false, message: 'การจองนี้มีคำขอยกเลิกที่กำลังรอตรวจสอบ' }
    }
    if (!resv || resv.holdStatus !== 'held_roommate_confirmation')
      return { ok: false, message: 'การจองนี้ไม่อยู่ในขั้นรอยืนยันห้องแล้ว' }
    if (!resv.memberIds.includes(me.id))
      return { ok: false, message: 'คุณไม่ใช่สมาชิกของการจองนี้' }
    if (resv.leaderId === me.id)
      return { ok: false, message: 'หัวหน้ากลุ่มไม่สามารถปฏิเสธแทนรูมเมทได้' }
    resv.holdStatus = 'released'
    dorm.setRoomStatus(resv.roomNumber, 'available')
    const group = roommateGroups.value.find(g => g.id === resv.roommateGroupId)
    if (group) group.status = 'accepted'
    contractsStore.addAudit({
      actor: session.currentUser?.id ?? 'unknown',
      action: 'reservation.release',
      relatedIds: [resv.id, resv.roomNumber],
      detail: `รูมเมทปฏิเสธห้อง ${resv.roomNumber} — ปล่อยห้องคืนทันที`,
    })
    return { ok: true, message: `ปฏิเสธแล้ว — ห้อง ${resv.roomNumber} ถูกปล่อยคืน หัวหน้ากลุ่มเลือกห้องใหม่ได้` }
  }

  /** hold หมดเวลา — ปล่อยห้องครั้งเดียวเท่านั้น (idempotent, HOLD-004/007) */
  function expireHold(resvId: string): ActionResult {
    const resv = reservationById(resvId)
    if (resv && pendingCancellationForReservation(resv.id)) {
      return { ok: false, message: 'พักการนับเวลาไว้ระหว่างรอตรวจคำขอยกเลิก' }
    }
    if (!resv || !['held_roommate_confirmation', 'held_payment'].includes(resv.holdStatus))
      return { ok: false, message: 'ไม่มี hold ที่ต้องปล่อยแล้ว' }
    const wasConfirmationStage = resv.holdStatus === 'held_roommate_confirmation'
    resv.holdStatus = 'expired'
    dorm.setRoomStatus(resv.roomNumber, 'available')
    if (!wasConfirmationStage) {
      application.releaseRoomAssignmentForReservation(
        resv.id,
        'หมดเวลา payment hold 72 ชั่วโมงและห้องถูกปล่อยคืน',
      )
      payments.cancelObligationsForReservation(resv.id)
    }
    const group = roommateGroups.value.find(g => g.id === resv.roommateGroupId)
    if (group) group.status = wasConfirmationStage ? 'accepted' : 'cancelled'
    contractsStore.addAudit({
      actor: 'system',
      action: 'reservation.expire',
      relatedIds: [resv.id, resv.roomNumber],
      detail: wasConfirmationStage
        ? `หมดเวลายืนยันห้อง ${resv.roomNumber} (15 นาที) — ปล่อยห้องคืนอัตโนมัติ`
        : `หมดเวลาชำระเงินห้อง ${resv.roomNumber} (72 ชม.) — ปล่อยห้องคืน ยอดที่ชำระแล้วเข้าสู่การตรวจสอบ/คืนเงิน (กติกา Provisional)`,
    })
    return { ok: true, message: `ห้อง ${resv.roomNumber} ถูกปล่อยคืนแล้ว` }
  }

  /** เจ้าหน้าที่ยืนยันการจองเมื่อ obligation ของสมาชิกทุกคนชำระครบ */
  function confirmPaidReservation(resvId: string): ActionResult {
    const resv = reservationById(resvId)
    if (resv && pendingCancellationForReservation(resv.id)) {
      return { ok: false, message: 'ยืนยันการจองไม่ได้ระหว่างรอตรวจคำขอยกเลิก' }
    }
    if (!resv || resv.holdStatus !== 'held_payment') {
      return { ok: false, message: 'การจองนี้ไม่อยู่ในขั้นรอยืนยันการชำระเงิน' }
    }
    if (!payments.groupPaymentComplete(resv.id)) {
      return { ok: false, message: `ยืนยันห้อง ${resv.roomNumber} ไม่ได้ — สมาชิกทุกคนต้องชำระครบทุกรายการ` }
    }
    if (!application.confirmRoomAssignmentForReservation(resv.id, resv.memberIds)) {
      return { ok: false, message: 'ไม่พบข้อมูลห้องที่เชื่อมกับการจอง กรุณาตรวจสอบก่อนยืนยัน' }
    }
    resv.holdStatus = 'confirmed'
    resv.paymentDeadline = undefined
    dorm.setRoomStatus(resv.roomNumber, 'reserved')
    const group = roommateGroups.value.find(item => item.id === resv.roommateGroupId)
    if (group) group.status = 'confirmed'
    contractsStore.addAudit({
      actor: session.currentUser?.id ?? 'staff-demo',
      action: 'reservation.confirm',
      relatedIds: [resv.id, resv.roomNumber],
      detail: `ตรวจผลชำระครบและยืนยันห้อง ${resv.roomNumber} ถาวร`,
    })
    return { ok: true, message: `ยืนยันห้อง ${resv.roomNumber} ถาวรแล้ว` }
  }

  return {
    invitations,
    roommateGroups,
    reservationGroups,
    cancellationRequests,
    myRoommateGroup,
    myReservation,
    myLatestReservation,
    myInvitations,
    myReceivedPendingInvitations,
    reservationById,
    cancellationRequestForReservation,
    pendingCancellationForReservation,
    pendingCancellationRequests,
    myLatestCancellationRequest,
    activeHolds,
    confirmedReservations,
    searchRoommateCandidates,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    reserveRoom,
    confirmRoomSelection,
    declineRoomSelection,
    expireHold,
    confirmPaidReservation,
    cancelUnpaidReservation,
    requestPaidCancellation,
    reviewCancellationRequest,
  }
})
