import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { OccupancyMode, ReservationGroup, RoommateGroup, RoommateInvitation } from '@/types'
import { reservationGroups as resvFixtures, roommateGroups as groupFixtures, roommateInvitations as invitationFixtures, users } from '@/fixtures'
import { useContractsStore } from './contracts'
import { useDormStore } from './dorm'
import { usePaymentsStore } from './payments'
import { useSessionStore } from './session'

export interface ActionResult {
  ok: boolean
  message: string
}

const ACTIVE_GROUP_STATUSES = ['invitation_pending', 'accepted', 'room_confirmation_pending', 'ready_for_payment', 'confirmed']
const ACTIVE_HOLD_STATUSES = ['held_roommate_confirmation', 'held_payment', 'confirmed']

function inMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

export const useReservationStore = defineStore('reservation', () => {
  const invitations = ref<RoommateInvitation[]>(invitationFixtures)
  const roommateGroups = ref<RoommateGroup[]>(groupFixtures)
  const reservationGroups = ref<ReservationGroup[]>(resvFixtures)

  const session = useSessionStore()
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

  const myRoommateGroup = computed(() => {
    const uid = session.currentUser?.id
    return uid ? activeGroupOf(uid) : undefined
  })

  const myReservation = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return undefined
    return reservationGroups.value.find(
      r => r.memberIds.includes(uid) && ACTIVE_HOLD_STATUSES.includes(r.holdStatus),
    )
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

  // คิวฝั่ง staff
  const activeHolds = computed(() =>
    reservationGroups.value.filter(r =>
      ['held_roommate_confirmation', 'held_payment'].includes(r.holdStatus),
    ),
  )

  const confirmedReservations = computed(() =>
    reservationGroups.value.filter(r => r.holdStatus === 'confirmed'),
  )

  // ---------- P3 actions (จำลอง domain service ฝั่ง server) ----------

  /** ส่งคำเชิญรูมเมท — อายุ 48 ชม. และ 1 คนมีได้ 1 คำเชิญ/กลุ่มที่ใช้งานอยู่ (GROUP-001/002) */
  function sendInvitation(inviteeId: string): ActionResult {
    const me = session.currentUser
    if (!me) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
    if (!me.profileComplete) return { ok: false, message: 'โปรไฟล์ของคุณยังไม่ครบถ้วน — กรอกให้ครบก่อนส่งคำเชิญ' }
    const invitee = users.find(u => u.id === inviteeId)
    if (!invitee) return { ok: false, message: 'ไม่พบผู้ใช้ที่ต้องการเชิญ' }
    if (!invitee.profileComplete) return { ok: false, message: `${invitee.displayName} ยังกรอกโปรไฟล์ไม่ครบ จึงรับคำเชิญไม่ได้` }
    if (activeGroupOf(me.id) || pendingInvitationOf(me.id))
      return { ok: false, message: 'คุณมีกลุ่มหรือคำเชิญที่ใช้งานอยู่แล้ว (1 คนมีได้ 1 รายการ)' }
    if (activeGroupOf(inviteeId) || pendingInvitationOf(inviteeId))
      return { ok: false, message: `${invitee.displayName} มีกลุ่มหรือคำเชิญที่ใช้งานอยู่แล้ว` }

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

  /** เข้าสู่ payment hold 72 ชม. + สร้าง obligations (ใช้ร่วมทั้ง flow ยืนยันและไม่ต้องยืนยัน) */
  function enterPaymentHold(resv: ReservationGroup) {
    const campaign = dorm.campaignById(resv.campaignId)
    const deadline = inMs((campaign?.paymentHoldHours ?? 72) * 3_600_000)
    resv.holdStatus = 'held_payment'
    resv.confirmationDeadline = undefined
    resv.paymentDeadline = deadline
    dorm.setRoomStatus(resv.roomNumber, 'temporarily_held', deadline)
    const group = roommateGroups.value.find(g => g.id === resv.roommateGroupId)
    if (group) group.status = 'ready_for_payment'
    const room = dorm.roomByNumber(resv.roomNumber)
    if (room) payments.generateObligationsForGroup(resv, room.config, deadline)
  }

  /**
   * หัวหน้ากลุ่มกดจองห้อง — ล็อกห้องทันที (จำลอง HOLD-001 ฝั่ง client)
   * shared: ต้องมีกลุ่ม accepted และเป็นหัวหน้ากลุ่ม; แคมเปญกำหนดได้ว่าต้องมีรูมเมทยืนยันภายใน 15 นาที
   */
  function reserveRoom(roomNumber: string, occupancyMode: OccupancyMode): ActionResult {
    const me = session.currentUser
    if (!me) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
    if (!me.profileComplete) return { ok: false, message: 'โปรไฟล์ยังไม่ครบถ้วน — กรอกให้ครบก่อนจอง' }
    if (myReservation.value) return { ok: false, message: 'คุณมีการจองที่ใช้งานอยู่แล้ว (1 คน 1 การจอง)' }

    const room = dorm.roomByNumber(roomNumber)
    if (!room) return { ok: false, message: 'ไม่พบห้องนี้' }
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

    contractsStore.addAudit({
      actor: me.id,
      action: 'reservation.reserve',
      relatedIds: [resv.id, roomNumber],
      detail: `หัวหน้ากลุ่มจองห้อง ${roomNumber} (${occupancyMode === 'shared' ? 'พักคู่' : 'เหมาห้อง'}) — ล็อกห้องทันที`,
    })

    if (occupancyMode === 'shared' && campaign.roommateRoomConfirmationRequired) {
      const deadline = inMs(campaign.roomConfirmationMinutes * 60_000)
      resv.confirmationDeadline = deadline
      dorm.setRoomStatus(roomNumber, 'temporarily_held', deadline)
      if (group) group.status = 'room_confirmation_pending'
      return {
        ok: true,
        message: `ล็อกห้อง ${roomNumber} แล้ว — รูมเมทต้องยืนยันห้องภายใน ${campaign.roomConfirmationMinutes} นาที`,
      }
    }

    enterPaymentHold(resv)
    return {
      ok: true,
      message: `ล็อกห้อง ${roomNumber} แล้ว — ชำระเงินภายใน ${campaign.paymentHoldHours} ชั่วโมง`,
    }
  }

  /** รูมเมทยืนยันห้องที่หัวหน้ากลุ่มเลือก → เข้าสู่ payment hold (HOLD-003) */
  function confirmRoomSelection(resvId: string): ActionResult {
    const resv = reservationById(resvId)
    if (!resv || resv.holdStatus !== 'held_roommate_confirmation')
      return { ok: false, message: 'การจองนี้ไม่อยู่ในขั้นรอยืนยันห้องแล้ว' }
    if (resv.confirmationDeadline && new Date(resv.confirmationDeadline).getTime() < Date.now()) {
      expireHold(resvId)
      return { ok: false, message: 'หมดเวลายืนยัน — ห้องถูกปล่อยคืนแล้ว' }
    }
    enterPaymentHold(resv)
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
    const resv = reservationById(resvId)
    if (!resv || resv.holdStatus !== 'held_roommate_confirmation')
      return { ok: false, message: 'การจองนี้ไม่อยู่ในขั้นรอยืนยันห้องแล้ว' }
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
    if (!resv || !['held_roommate_confirmation', 'held_payment'].includes(resv.holdStatus))
      return { ok: false, message: 'ไม่มี hold ที่ต้องปล่อยแล้ว' }
    const wasConfirmationStage = resv.holdStatus === 'held_roommate_confirmation'
    resv.holdStatus = 'expired'
    dorm.setRoomStatus(resv.roomNumber, 'available')
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

  return {
    invitations,
    roommateGroups,
    reservationGroups,
    myRoommateGroup,
    myReservation,
    myInvitations,
    myReceivedPendingInvitations,
    reservationById,
    activeHolds,
    confirmedReservations,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    reserveRoom,
    confirmRoomSelection,
    declineRoomSelection,
    expireHold,
  }
})
