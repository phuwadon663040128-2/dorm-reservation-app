import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  contractStatusLabel,
  holdStatusLabel,
  keyHandoverStatusLabel,
  occupancyModeLabel,
  resultStatusLabel,
  roommateGroupStatusLabel,
} from '@/lib/labels'
import { users } from '@/fixtures/users'
import { useApplicationStore } from '@/stores/application'
import { useContractsStore } from '@/stores/contracts'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

export type JourneyStatus =
  | 'completed'
  | 'current'
  | 'needs_action'
  | 'waiting'
  | 'blocked'
  | 'upcoming'
  | 'skipped'

export interface Milestone {
  id: string
  label: string
  description: string
  status: JourneyStatus
}

export interface NextAction {
  title: string
  description: string
  actorLabel: string
  to?: string
  ctaLabel?: string
  deadline?: string
  urgency: 'normal' | 'urgent' | 'waiting'
}

export interface StatusSection {
  id: string
  title: string
  summary: string
  description?: string
  status: JourneyStatus
  statusLabel: string
  detail?: string
  to?: string
  ctaLabel?: string
}

export interface Alert {
  id: string
  title: string
  description: string
  variant?: 'default' | 'destructive'
  to?: string
  ctaLabel?: string
}

export type JourneyAlert = Alert

const LOST_HOLD_STATUSES = new Set(['expired', 'released', 'cancelled'])
const ACTIONABLE_CONTRACT_STATUSES = new Set([
  'ready_to_print',
  'printed',
  'correction_required',
  'reprinted',
])

function isPast(deadline: string | undefined, currentTime: number) {
  return Boolean(deadline && new Date(deadline).getTime() <= currentTime)
}

export function useApplicantJourney() {
  const session = useSessionStore()
  const application = useApplicationStore()
  const reservation = useReservationStore()
  const payments = usePaymentsStore()
  const contractsStore = useContractsStore()

  const now = ref(Date.now())
  let deadlineTimer: number | undefined
  onMounted(() => {
    deadlineTimer = window.setInterval(() => {
      now.value = Date.now()
    }, 1_000)
  })
  onBeforeUnmount(() => {
    if (deadlineTimer !== undefined) window.clearInterval(deadlineTimer)
  })

  const userId = computed(() => session.currentUser?.id)
  const activeReservation = computed(() => reservation.myReservation)
  const latestReservation = computed(() => reservation.myLatestReservation)
  const roommateGroup = computed(() => reservation.myRoommateGroup)
  const missingGroupApplicationMemberIds = computed(() =>
    (roommateGroup.value?.memberIds ?? [])
      .filter(applicantId => !application.hasSubmittedApplication(applicantId)),
  )
  const missingGroupApplicationNames = computed(() =>
    missingGroupApplicationMemberIds.value
      .map(applicantId => users.find(user => user.id === applicantId)?.displayName ?? applicantId),
  )

  const hasSubmittedApplication = computed(() => {
    if (!userId.value) return false
    return application.hasSubmittedApplication(userId.value)
  })
  const applicationComplete = computed(() =>
    Boolean(session.currentUser?.profileComplete && hasSubmittedApplication.value),
  )

  const pendingInvitation = computed(() =>
    reservation.myInvitations.find(item => item.status === 'pending' && !isPast(item.expiresAt, now.value)),
  )
  const expiredPendingInvitation = computed(() =>
    reservation.myInvitations.find(item => item.status === 'pending' && isPast(item.expiresAt, now.value)),
  )

  const currentContract = computed(() => {
    const reservationId = latestReservation.value?.id
    return contractsStore.myContracts.find(
      item => !reservationId || item.reservationGroupId === reservationId,
    )
  })
  const currentHandover = computed(() => {
    const reservationId = latestReservation.value?.id
    return contractsStore.myKeyHandovers.find(
      item => !reservationId || item.reservationGroupId === reservationId,
    )
  })
  const contractProgress = computed(() => {
    const item = latestReservation.value
    return item ? contractsStore.groupContractProgress(item.id) : null
  })

  const groupObligations = computed(() => {
    const item = activeReservation.value
    return item ? payments.obligationsForGroup(item.id) : []
  })
  const ownObligations = computed(() =>
    groupObligations.value.filter(item => item.residentId === userId.value),
  )
  const unpaidOwnObligations = computed(() =>
    ownObligations.value.filter(item => !payments.isPaid(item)),
  )
  const groupPaymentComplete = computed(() => {
    const item = activeReservation.value
    return Boolean(item && payments.groupPaymentComplete(item.id))
  })
  const pendingCancellation = computed(() => {
    const item = activeReservation.value
    return item ? reservation.pendingCancellationForReservation(item.id) : undefined
  })
  const ownRefunds = computed(() =>
    payments.refundRecords.filter(item => item.residentId === userId.value),
  )

  const nextAction = computed<NextAction>(() => {
    const user = session.currentUser
    const active = activeReservation.value
    const latest = latestReservation.value
    const group = roommateGroup.value

    if (!user || user.role !== 'applicant') {
      return {
        title: 'เข้าสู่ระบบเพื่อดูสถานะ',
        description: 'สถานะการสมัครและการจองจะแสดงตามบัญชีผู้สมัคร',
        actorLabel: 'คุณต้องทำ',
        to: '/',
        ctaLabel: 'กลับหน้าหลัก',
        urgency: 'normal',
      }
    }

    if (pendingCancellation.value) {
      return {
        title: 'กำลังพิจารณาคำขอยกเลิก',
        description: 'ห้องยังไม่ถูกปล่อย ระบบพักเวลาชำระเงินและปิดการดำเนินการสัญญาระหว่างรอเจ้าหน้าที่ตรวจคำขอ',
        actorLabel: 'รอเจ้าหน้าที่',
        to: '/app/reservation',
        ctaLabel: 'ดูคำขอยกเลิก',
        urgency: 'waiting',
      }
    }

    // Live 15-minute room-confirmation hold has the highest priority.
    if (active?.holdStatus === 'held_roommate_confirmation') {
      if (isPast(active.confirmationDeadline, now.value)) {
        return {
          title: 'หมดเวลายืนยันห้องแล้ว',
          description: 'โปรดตรวจสถานะการจอง ห้องอาจถูกปล่อยคืนและต้องเลือกใหม่',
          actorLabel: 'คุณต้องตรวจสอบ',
          to: '/app/reservation',
          ctaLabel: 'ตรวจสถานะการจอง',
          urgency: 'normal',
        }
      }
      const isLeader = active.leaderId === user.id
      return {
        title: isLeader ? 'รอรูมเมทยืนยันห้อง' : 'ยืนยันห้องที่หัวหน้ากลุ่มเลือก',
        description: isLeader
          ? 'ห้อง ' + active.roomNumber + ' ถูกล็อกชั่วคราวจนกว่ารูมเมทจะตอบรับ'
          : 'ตรวจสอบห้อง ' + active.roomNumber + ' และตอบรับก่อนหมดเวลา',
        actorLabel: isLeader ? 'รอรูมเมท' : 'คุณต้องทำ',
        to: isLeader ? '/app/reservation' : '/app/roommate',
        ctaLabel: isLeader ? 'ดูสถานะการจอง' : 'ตรวจสอบและยืนยันห้อง',
        deadline: active.confirmationDeadline,
        urgency: isLeader ? 'waiting' : 'urgent',
      }
    }

    // Live 72-hour payment hold comes before all non-deadline work.
    if (active?.holdStatus === 'held_payment') {
      if (isPast(active.paymentDeadline, now.value)) {
        return {
          title: 'เลยกำหนดเวลาชำระเงินแล้ว',
          description: 'โปรดตรวจสถานะการจองและรายการชำระเงินก่อนดำเนินการต่อ',
          actorLabel: 'คุณต้องตรวจสอบ',
          to: '/app/reservation',
          ctaLabel: 'ตรวจสถานะการจอง',
          urgency: 'normal',
        }
      }
      if (groupPaymentComplete.value) {
        return {
          title: 'รอเจ้าหน้าที่ยืนยันการจอง',
          description: 'ระบบบันทึกรายการชำระเงินของสมาชิกครบแล้ว เจ้าหน้าที่กำลังตรวจสอบผล',
          actorLabel: 'รอเจ้าหน้าที่',
          to: '/app/payments',
          ctaLabel: 'ดูรายการชำระเงิน',
          deadline: active.paymentDeadline,
          urgency: 'waiting',
        }
      }
      if (unpaidOwnObligations.value.length) {
        return {
          title: 'ชำระรายการของคุณให้ครบ',
          description: 'เหลือ ' + unpaidOwnObligations.value.length + ' รายการภายในกำหนดเวลาร่วมของกลุ่ม',
          actorLabel: 'คุณต้องทำ',
          to: '/app/payments',
          ctaLabel: 'ไปหน้าชำระเงิน',
          deadline: active.paymentDeadline,
          urgency: 'urgent',
        }
      }
      if (ownObligations.value.length) {
        return {
          title: 'รอสมาชิกในกลุ่มชำระเงิน',
          description: 'รายการของคุณครบแล้ว การจองจะไปต่อเมื่อสมาชิกทุกคนชำระครบ',
          actorLabel: 'รอรูมเมท',
          to: '/app/payments',
          ctaLabel: 'ดูสถานะกลุ่ม',
          deadline: active.paymentDeadline,
          urgency: 'waiting',
        }
      }
      return {
        title: 'รอเอกสารชำระเงิน',
        description: 'เจ้าหน้าที่กำลังจัดเตรียมเอกสารชำระเงินของกลุ่ม',
        actorLabel: 'รอเจ้าหน้าที่',
        to: '/app/payments',
        ctaLabel: 'ดูสถานะเอกสาร',
        deadline: active.paymentDeadline,
        urgency: 'waiting',
      }
    }

    const invitation = pendingInvitation.value
    if (invitation) {
      const received = invitation.inviteeId === user.id
      return {
        title: received ? 'ตอบรับคำเชิญรูมเมท' : 'รอรูมเมทตอบรับคำเชิญ',
        description: received
          ? 'ตรวจสอบผู้เชิญและตอบรับหรือปฏิเสธภายใน 48 ชั่วโมง'
          : 'ผู้รับคำเชิญต้องตอบกลับก่อนจึงจะตั้งกลุ่มสำหรับเลือกห้องได้',
        actorLabel: received ? 'คุณต้องทำ' : 'รอรูมเมท',
        to: '/app/roommate',
        ctaLabel: received ? 'ตรวจสอบคำเชิญ' : 'ดูสถานะคำเชิญ',
        deadline: invitation.expiresAt,
        urgency: received ? 'normal' : 'waiting',
      }
    }

    if (!user.profileComplete) {
      return {
        title: 'กรอกข้อมูลผู้สมัครให้ครบ',
        description: 'ข้อมูลที่จำเป็นต้องครบก่อนเชิญรูมเมทหรือยืนยันจองห้อง',
        actorLabel: 'คุณต้องทำ',
        to: '/app/application',
        ctaLabel: 'กรอกข้อมูลใบสมัคร',
        urgency: 'normal',
      }
    }
    if (!hasSubmittedApplication.value) {
      return {
        title: 'ตรวจสอบและส่งใบสมัคร',
        description: 'กรอกข้อมูลผู้สมัครและตรวจสอบความถูกต้องให้ครบก่อนยืนยันจองห้องจริง',
        actorLabel: 'คุณต้องทำ',
        to: '/app/application',
        ctaLabel: 'ไปที่ใบสมัคร',
        urgency: 'normal',
      }
    }

    if (
      !active
      && group?.status === 'accepted'
      && missingGroupApplicationNames.value.length
    ) {
      return {
        title: 'รอสมาชิกส่งใบสมัครให้ครบ',
        description: missingGroupApplicationNames.value.join(', ') + ' ยังไม่ได้ส่งใบสมัคร จึงยังเลือกห้องแบบพักคู่ไม่ได้',
        actorLabel: 'รอสมาชิกในกลุ่ม',
        to: '/app/roommate',
        ctaLabel: 'ดูสถานะกลุ่ม',
        urgency: 'waiting',
      }
    }

    if (latest && LOST_HOLD_STATUSES.has(latest.holdStatus)) {
      return {
        title: 'เลือกห้องใหม่',
        description: 'ห้อง ' + latest.roomNumber + ' ถูกปล่อยคืนแล้ว การจองเดิมไม่ได้ล็อกห้องต่อ',
        actorLabel: 'คุณต้องทำ',
        to: '/app/rooms',
        ctaLabel: 'เลือกห้องที่ว่าง',
        urgency: 'normal',
      }
    }

    if (!active) {
      if (group?.status === 'accepted' && group.leaderId !== user.id) {
        return {
          title: 'รอหัวหน้ากลุ่มเลือกห้อง',
          description: 'กลุ่มรูมเมทพร้อมแล้ว หัวหน้ากลุ่มเป็นผู้เลือกและยืนยันจองห้อง',
          actorLabel: 'รอรูมเมท',
          to: '/app/roommate',
          ctaLabel: 'ดูสถานะกลุ่ม',
          urgency: 'waiting',
        }
      }
      return {
        title: group?.status === 'accepted' ? 'เลือกห้องสำหรับกลุ่ม' : 'เลือกรูปแบบการพักและห้อง',
        description: group?.status === 'accepted'
          ? 'เลือกห้องว่างสำหรับกลุ่มเพื่อเริ่มการล็อกห้อง'
          : 'คุณเลือกเหมาห้องได้ หรือจัดการรูมเมทก่อนหากต้องการพักคู่',
        actorLabel: 'คุณต้องทำ',
        to: '/app/rooms',
        ctaLabel: 'ดูห้องที่ว่าง',
        urgency: 'normal',
      }
    }

    if (active.holdStatus === 'confirmed') {
      const contract = currentContract.value
      const progress = contractProgress.value
      const handover = currentHandover.value

      if (!contract) {
        return {
          title: 'รอเจ้าหน้าที่จัดเตรียมสัญญา',
          description: 'เจ้าหน้าที่ตรวจสอบและยืนยันการจองแล้ว ขั้นถัดไปคือการจัดเตรียมสัญญา',
          actorLabel: 'รอเจ้าหน้าที่',
          to: '/app/contracts',
          ctaLabel: 'ดูสถานะสัญญา',
          urgency: 'waiting',
        }
      }
      if (ACTIONABLE_CONTRACT_STATUSES.has(contract.status)) {
        return {
          title: contract.status === 'correction_required' ? 'แก้ไขเอกสารสัญญา' : 'ดำเนินการสัญญาของคุณ',
          description: 'ตรวจสอบ พิมพ์ และส่งสัญญาตามสถานะเอกสารปัจจุบัน',
          actorLabel: 'คุณต้องทำ',
          to: '/app/contracts',
          ctaLabel: 'ไปหน้าสัญญา',
          urgency: 'normal',
        }
      }
      if (!progress?.complete) {
        return {
          title: 'รอสัญญาของสมาชิกในกลุ่มให้ครบ',
          description: 'เจ้าหน้าที่รับสัญญาแล้ว ' + (progress?.signed ?? 0) + ' จาก ' + (progress?.total ?? 0) + ' ฉบับ',
          actorLabel: contract.status === 'signed_received' ? 'รอรูมเมท' : 'รอเจ้าหน้าที่',
          to: '/app/contracts',
          ctaLabel: 'ดูสถานะสัญญา',
          urgency: 'waiting',
        }
      }
      if (handover?.status === 'ready') {
        return {
          title: 'ตรวจสอบนัดหมายรับกุญแจ',
          description: 'สัญญาครบแล้ว โปรดตรวจรายละเอียดก่อนรับกุญแจและลงนามรับมอบ',
          actorLabel: 'คุณต้องทำ',
          to: '/app/next-steps',
          ctaLabel: 'ดูขั้นตอนรับกุญแจ',
          urgency: 'normal',
        }
      }
      if (handover?.status === 'signed_handed_over') {
        return {
          title: 'ขั้นตอนสำคัญครบแล้ว',
          description: 'ติดตามประกาศและข้อมูลการเข้าพักจากหอพักได้ในบัญชีนี้',
          actorLabel: 'ติดตามสถานะ',
          to: '/app/next-steps',
          ctaLabel: 'ดูข้อมูลการเข้าพัก',
          urgency: 'waiting',
        }
      }
      return {
        title: 'รอเจ้าหน้าที่แจ้งความพร้อมรับกุญแจ',
        description: 'สัญญาครบแล้ว เจ้าหน้าที่กำลังเตรียมขั้นตอนและนัดหมายรับกุญแจ',
        actorLabel: 'รอเจ้าหน้าที่',
        to: '/app/next-steps',
        ctaLabel: 'ดูสถานะรับกุญแจ',
        urgency: 'waiting',
      }
    }

    return {
      title: 'ตรวจสอบสถานะการจอง',
      description: 'ดูรายละเอียดล่าสุดของห้อง กลุ่ม และขั้นตอนที่เกี่ยวข้อง',
      actorLabel: 'ติดตามสถานะ',
      to: '/app/reservation',
      ctaLabel: 'ดูสถานะการจอง',
      urgency: 'normal',
    }
  })

  const milestones = computed<Milestone[]>(() => {
    const active = activeReservation.value
    const latest = latestReservation.value
    const group = roommateGroup.value
    const invitation = pendingInvitation.value
    const contract = currentContract.value
    const progress = contractProgress.value
    const handover = currentHandover.value
    const lostHold = Boolean(latest && LOST_HOLD_STATUSES.has(latest.holdStatus))
    const wholeRoom = latest?.occupancyMode === 'whole_room'
    const waitingForGroupApplications = Boolean(
      group
      && ['accepted', 'room_confirmation_pending'].includes(group.status)
      && missingGroupApplicationMemberIds.value.length,
    )
    const currentApplicantHasMissingApplication = Boolean(
      userId.value && missingGroupApplicationMemberIds.value.includes(userId.value),
    )

    const roommateStatus: JourneyStatus = wholeRoom
      ? 'skipped'
      : waitingForGroupApplications
        ? currentApplicantHasMissingApplication ? 'needs_action' : 'waiting'
        : active?.occupancyMode === 'shared' || group?.status === 'accepted' || group?.status === 'confirmed'
        ? 'completed'
        : invitation?.inviteeId === userId.value
          ? 'needs_action'
          : invitation ? 'waiting' : applicationComplete.value ? 'current' : 'upcoming'

    const roomStatus: JourneyStatus = pendingCancellation.value
      ? 'waiting'
      : active?.holdStatus === 'confirmed' || active?.holdStatus === 'held_payment'
      ? 'completed'
      : active?.holdStatus === 'held_roommate_confirmation'
        ? active.leaderId === userId.value ? 'waiting' : 'needs_action'
        : lostHold
          ? 'needs_action'
          : waitingForGroupApplications
            ? 'blocked'
            : applicationComplete.value ? 'current' : 'blocked'

    const paymentStatus: JourneyStatus = pendingCancellation.value
      ? 'waiting'
      : active?.holdStatus === 'confirmed'
      ? 'completed'
      : active?.holdStatus === 'held_payment'
        ? groupPaymentComplete.value ? 'waiting' : unpaidOwnObligations.value.length ? 'needs_action' : 'waiting'
        : lostHold ? 'blocked' : 'upcoming'

    const applicantContractStatus: JourneyStatus = pendingCancellation.value
      ? 'blocked'
      : contract?.status === 'signed_received' && progress?.complete
        ? 'completed'
        : contract && ACTIONABLE_CONTRACT_STATUSES.has(contract.status)
          ? 'needs_action'
          : active?.holdStatus === 'confirmed' ? 'waiting' : 'upcoming'

    const handoverStatus: JourneyStatus = handover?.status === 'signed_handed_over'
      ? 'completed'
      : handover?.status === 'ready' ? 'needs_action' : progress?.complete ? 'waiting' : 'upcoming'

    return [
      {
        id: 'profile_application',
        label: 'ข้อมูลและใบสมัคร',
        description: applicationComplete.value
          ? 'ส่งข้อมูลผู้สมัครแล้ว'
          : session.currentUser?.profileComplete ? 'รอตรวจสอบและส่งใบสมัคร' : 'ข้อมูลผู้สมัครยังไม่ครบ',
        status: applicationComplete.value ? 'completed' : 'needs_action',
      },
      {
        id: 'roommate',
        label: 'รูมเมท',
        description: wholeRoom
          ? 'ข้ามขั้นตอนนี้สำหรับการเหมาห้อง'
          : waitingForGroupApplications
            ? 'รอ ' + missingGroupApplicationNames.value.join(', ') + ' ส่งใบสมัคร'
          : group ? roommateGroupStatusLabel[group.status] : 'ใช้เฉพาะการสมัครแบบพักคู่',
        status: roommateStatus,
      },
      {
        id: 'room_confirmation',
        label: 'เลือกและยืนยันห้อง',
        description: latest
          ? lostHold ? 'ห้อง ' + latest.roomNumber + ' ถูกปล่อยคืนแล้ว' : 'ห้อง ' + latest.roomNumber
          : 'ยังไม่มีห้องที่ถูกล็อก',
        status: roomStatus,
      },
      {
        id: 'payment',
        label: 'ชำระเงิน',
        description: groupPaymentComplete.value
          ? 'สมาชิกชำระครบทุกรายการแล้ว รอเจ้าหน้าที่ตรวจสอบ'
          : active?.holdStatus === 'held_payment' ? 'อยู่ภายในกำหนดเวลาร่วมของกลุ่ม' : 'เริ่มเมื่อกลุ่มยืนยันห้องแล้ว',
        status: paymentStatus,
      },
      {
        id: 'contract',
        label: 'สัญญา',
        description: contract
          ? contractStatusLabel[contract.status] + (progress ? ' · ' + progress.signed + '/' + progress.total + ' ฉบับ' : '')
          : 'จัดเตรียมหลังเจ้าหน้าที่ยืนยันการจอง',
        status: applicantContractStatus,
      },
      {
        id: 'key_handover',
        label: 'รับกุญแจ',
        description: handover ? keyHandoverStatusLabel[handover.status] : 'ดำเนินการหลังสัญญาครบถ้วน',
        status: handoverStatus,
      },
    ]
  })

  const alerts = computed<Alert[]>(() => {
    const items: Alert[] = []
    const active = activeReservation.value
    const latest = latestReservation.value
    const contract = currentContract.value

    if (pendingCancellation.value) {
      items.push({
        id: 'cancellation_pending',
        title: 'กำลังพิจารณาคำขอยกเลิก',
        description: 'ห้องยังไม่ถูกปล่อย การชำระเงินและขั้นตอนสัญญาถูกพักไว้จนกว่าเจ้าหน้าที่จะแจ้งผล',
        to: '/app/reservation',
        ctaLabel: 'ดูรายละเอียด',
      })
    }
    if (ownRefunds.value.some(item => item.status !== 'completed')) {
      items.push({
        id: 'refund_pending',
        title: 'มีรายการคืนเงินที่กำลังดำเนินการ',
        description: 'ติดตามสถานะแยกตามบิล ROOM/HL ได้จากหน้าชำระเงิน',
        to: '/app/payments',
        ctaLabel: 'ติดตามการคืนเงิน',
      })
    }

    if (session.currentUser?.role === 'applicant' && !session.currentUser.profileComplete) {
      items.push({
        id: 'profile_incomplete',
        title: 'ข้อมูลผู้สมัครยังไม่ครบ',
        description: 'กรอกข้อมูลที่จำเป็นให้ครบก่อนเชิญรูมเมทหรือยืนยันจองห้อง',
        variant: 'destructive',
        to: '/app/application',
        ctaLabel: 'กรอกข้อมูล',
      })
    }
    if (latest && LOST_HOLD_STATUSES.has(latest.holdStatus)) {
      items.push({
        id: 'reservation_released',
        title: 'ห้องจากการจองล่าสุดถูกปล่อยคืนแล้ว',
        description: 'การจองห้อง ' + latest.roomNumber + ' สิ้นสุดลงและไม่ได้ล็อกห้องไว้ คุณสามารถเลือกห้องที่ยังว่างได้',
        variant: 'destructive',
        to: '/app/rooms',
        ctaLabel: 'เลือกห้องใหม่',
      })
    } else if (active?.holdStatus === 'held_roommate_confirmation' && isPast(active.confirmationDeadline, now.value)) {
      items.push({
        id: 'confirmation_deadline_passed',
        title: 'เลยกำหนดยืนยันห้องแล้ว',
        description: 'โปรดตรวจสถานะการจอง ห้องอาจถูกปล่อยคืนโดยระบบ',
        variant: 'destructive',
        to: '/app/reservation',
        ctaLabel: 'ตรวจสถานะ',
      })
    } else if (active?.holdStatus === 'held_payment' && isPast(active.paymentDeadline, now.value)) {
      items.push({
        id: 'payment_deadline_passed',
        title: 'เลยกำหนดชำระเงินแล้ว',
        description: 'โปรดตรวจสถานะการจองก่อนชำระเงินหรือดำเนินการต่อ',
        variant: 'destructive',
        to: '/app/reservation',
        ctaLabel: 'ตรวจสถานะ',
      })
    }
    if (expiredPendingInvitation.value) {
      items.push({
        id: 'invitation_expired',
        title: 'คำเชิญรูมเมทหมดเวลาแล้ว',
        description: 'คำเชิญเดิมใช้ต่อไม่ได้ คุณและอีกฝ่ายสามารถเริ่มคำเชิญใหม่ได้',
        to: '/app/roommate',
        ctaLabel: 'จัดการรูมเมท',
      })
    }
    if (contract?.status === 'correction_required') {
      items.push({
        id: 'contract_correction',
        title: 'สัญญาต้องแก้ไข',
        description: 'ตรวจรายละเอียดที่เจ้าหน้าที่แจ้งและดำเนินการสัญญาฉบับแก้ไข',
        variant: 'destructive',
        to: '/app/contracts',
        ctaLabel: 'ดูสัญญา',
      })
    }
    return items
  })

  const statusSections = computed<StatusSection[]>(() => {
    const active = activeReservation.value
    const latest = latestReservation.value
    const group = roommateGroup.value
    const contract = currentContract.value
    const handover = currentHandover.value
    const progress = contractProgress.value
    const lostHold = Boolean(latest && LOST_HOLD_STATUSES.has(latest.holdStatus))
    const paidOwn = ownObligations.value.filter(item => payments.isPaid(item)).length
    const invitation = pendingInvitation.value
    const roommatePending = group?.status === 'invitation_pending' || Boolean(invitation)
    const roommateApplicationPending = Boolean(group && missingGroupApplicationMemberIds.value.length)
    const currentApplicantHasMissingApplication = Boolean(
      userId.value && missingGroupApplicationMemberIds.value.includes(userId.value),
    )
    const currentUserIsInvitee = invitation
      ? invitation.inviteeId === userId.value
      : Boolean(group && group.leaderId !== userId.value)
    const roommateReady = Boolean(group && [
      'accepted',
      'room_confirmation_pending',
      'ready_for_payment',
      'confirmed',
    ].includes(group.status))
    const roommateSectionStatus: JourneyStatus = latest?.occupancyMode === 'whole_room'
      ? 'skipped'
      : roommateApplicationPending
        ? currentApplicantHasMissingApplication ? 'needs_action' : 'waiting'
        : roommatePending
        ? currentUserIsInvitee ? 'needs_action' : 'waiting'
        : roommateReady ? 'completed' : 'current'
    const roomConfirmationComplete = Boolean(
      active && ['held_payment', 'confirmed'].includes(active.holdStatus),
    )
    const roomConfirmationPending = active?.holdStatus === 'held_roommate_confirmation'
    const roomSectionStatus: JourneyStatus = pendingCancellation.value
      ? 'waiting'
      : lostHold
      ? 'needs_action'
      : roomConfirmationComplete
        ? 'completed'
        : roomConfirmationPending
          ? active?.leaderId === userId.value ? 'waiting' : 'needs_action'
          : roommateApplicationPending
            ? 'blocked'
            : applicationComplete.value ? 'current' : 'blocked'

    return [
      {
        id: 'room',
        title: 'ห้องและรูปแบบการพัก',
        summary: latest
          ? 'ห้อง ' + latest.roomNumber + ' · ' + occupancyModeLabel[latest.occupancyMode]
          : 'ยังไม่ได้เลือกห้อง',
        description: pendingCancellation.value
          ? 'ห้องยังคงถูกล็อกไว้ระหว่างเจ้าหน้าที่พิจารณาคำขอยกเลิก'
          : lostHold
          ? 'ข้อมูลการจองล่าสุด — ห้องไม่ได้ถูกล็อกอยู่ในขณะนี้'
          : roomConfirmationPending
            ? active?.leaderId === userId.value
              ? 'ห้องถูกล็อกชั่วคราวและกำลังรอรูมเมทยืนยัน'
              : 'ตรวจสอบและยืนยันห้องภายในเวลาที่กำหนด'
            : roommateApplicationPending
              ? 'ต้องรอสมาชิกในกลุ่มส่งใบสมัครให้ครบก่อนจึงจะเลือกห้องพักคู่ได้'
            : undefined,
        status: roomSectionStatus,
        statusLabel: pendingCancellation.value
          ? 'กำลังพิจารณายกเลิก'
          : lostHold
          ? 'ห้องถูกปล่อยคืน'
          : roomConfirmationComplete
            ? 'ยืนยันห้องครบแล้ว'
            : roomConfirmationPending
              ? active?.leaderId === userId.value ? 'รอรูมเมทยืนยัน' : 'ต้องยืนยันห้อง'
              : roommateApplicationPending
                ? 'รอใบสมัครสมาชิก'
              : 'ยังไม่มีห้อง',
        to: roommateApplicationPending
          ? '/app/roommate'
          : latest && !lostHold ? '/app/reservation' : '/app/rooms',
        ctaLabel: roommateApplicationPending
          ? 'ดูสถานะกลุ่ม'
          : latest && !lostHold ? 'ดูการจอง' : 'เลือกห้อง',
      },
      {
        id: 'roommate',
        title: 'รูมเมท',
        summary: latest?.occupancyMode === 'whole_room'
          ? 'ไม่ใช้รูมเมทสำหรับการเหมาห้อง'
          : group
            ? roommateGroupStatusLabel[group.status] + ' · ' + group.memberIds.length + '/2 คน'
            : 'ยังไม่มีกลุ่มรูมเมท',
        status: roommateSectionStatus,
        statusLabel: latest?.occupancyMode === 'whole_room'
          ? 'ข้ามขั้นตอน'
          : roommateApplicationPending
            ? currentApplicantHasMissingApplication
              ? 'คุณยังไม่ได้ส่งใบสมัคร'
              : 'รอสมาชิกส่งใบสมัคร'
          : roommatePending
            ? currentUserIsInvitee ? 'มีคำเชิญรอตอบรับ' : 'รอรูมเมทตอบรับ'
            : group ? roommateGroupStatusLabel[group.status] : 'ใช้เฉพาะพักคู่',
        description: roommateApplicationPending
          ? 'รอ ' + missingGroupApplicationNames.value.join(', ') + ' ส่งใบสมัครให้เรียบร้อยก่อนเลือกห้องพักคู่'
          : undefined,
        to: '/app/roommate',
        ctaLabel: 'จัดการรูมเมท',
      },
      {
        id: 'hold',
        title: 'การล็อกห้อง',
        summary: latest
          ? latest.holdStatus === 'confirmed'
            ? 'เจ้าหน้าที่ตรวจสอบและยืนยันการจองแล้ว'
            : holdStatusLabel[latest.holdStatus]
          : 'ยังไม่มีห้องที่ถูกล็อก',
        description: active?.confirmationDeadline
          ? 'รูมเมทต้องยืนยันภายในเวลาที่กำหนด'
          : active?.paymentDeadline ? 'ใช้กำหนดเวลาชำระร่วมกันทั้งกลุ่ม' : undefined,
        status: lostHold
          ? 'needs_action'
          : active ? active.holdStatus === 'confirmed' ? 'completed' : 'current' : 'upcoming',
        statusLabel: latest
          ? latest.holdStatus === 'confirmed'
            ? 'เจ้าหน้าที่ตรวจสอบและยืนยันการจองแล้ว'
            : holdStatusLabel[latest.holdStatus]
          : 'ยังไม่เริ่ม',
        detail: active?.confirmationDeadline ?? active?.paymentDeadline,
        to: '/app/reservation',
        ctaLabel: 'ดูสถานะการจอง',
      },
      {
        id: 'payment',
        title: 'การชำระเงิน',
        summary: ownObligations.value.length
          ? 'ชำระแล้ว ' + paidOwn + '/' + ownObligations.value.length + ' รายการของคุณ'
          : active?.holdStatus === 'confirmed' ? 'ผ่านขั้นตอนการชำระเงินแล้ว' : 'ยังไม่มีรายการชำระเงิน',
        description: active?.holdStatus === 'held_payment'
          ? groupPaymentComplete.value ? 'สมาชิกทุกคนชำระครบ รอเจ้าหน้าที่ตรวจสอบ' : 'ต้องครบทุกคนและทุกรายการในกลุ่ม'
          : undefined,
        status: active?.holdStatus === 'confirmed'
          ? 'completed'
          : active?.holdStatus === 'held_payment'
            ? unpaidOwnObligations.value.length ? 'needs_action' : 'waiting'
            : 'upcoming',
        statusLabel: unpaidOwnObligations.value.length
          ? 'มีรายการที่ต้องชำระ'
          : groupPaymentComplete.value
            ? 'รอเจ้าหน้าที่ยืนยัน'
            : active?.holdStatus === 'held_payment' && ownObligations.value.length
              ? 'รายการของคุณครบแล้ว · รอสมาชิกในกลุ่ม'
              : 'ยังไม่เริ่ม',
        detail: ownObligations.value
          .map(item => item.title + ': ' + resultStatusLabel[item.resultStatus])
          .join(' · ') || undefined,
        to: '/app/payments',
        ctaLabel: 'ดูรายการชำระเงิน',
      },
      {
        id: 'reservation',
        title: 'สถานะการจอง',
        summary: active?.holdStatus === 'confirmed'
          ? 'เจ้าหน้าที่ตรวจสอบและยืนยันการจองแล้ว'
          : lostHold
            ? 'การจองล่าสุดสิ้นสุดและห้องถูกปล่อยคืนแล้ว'
            : active ? holdStatusLabel[active.holdStatus] : 'ยังไม่มีการจองที่ใช้งานอยู่',
        status: active?.holdStatus === 'confirmed'
          ? 'completed'
          : lostHold ? 'needs_action' : active ? 'current' : 'upcoming',
        statusLabel: active?.holdStatus === 'confirmed'
          ? 'ยืนยันการจองแล้ว'
          : lostHold ? 'ห้องถูกปล่อยคืน' : active ? 'กำลังดำเนินการ' : 'ยังไม่เริ่ม',
        to: '/app/reservation',
        ctaLabel: 'ดูรายละเอียดการจอง',
      },
      {
        id: 'contract',
        title: 'สัญญา',
        summary: contract ? contractStatusLabel[contract.status] : 'ยังไม่มีสัญญา',
        description: progress ? 'เจ้าหน้าที่รับแล้ว ' + progress.signed + '/' + progress.total + ' ฉบับในกลุ่ม' : undefined,
        status: contract?.status === 'signed_received' && progress?.complete
          ? 'completed'
          : contract && ACTIONABLE_CONTRACT_STATUSES.has(contract.status)
            ? 'needs_action'
            : active?.holdStatus === 'confirmed' ? 'waiting' : 'upcoming',
        statusLabel: contract
          ? contractStatusLabel[contract.status]
          : active?.holdStatus === 'confirmed' ? 'รอเจ้าหน้าที่จัดเตรียม' : 'ยังไม่เริ่ม',
        to: '/app/contracts',
        ctaLabel: 'ดูสัญญา',
      },
      {
        id: 'key_handover',
        title: 'การรับกุญแจ',
        summary: handover ? keyHandoverStatusLabel[handover.status] : 'ยังไม่มีรายการรับกุญแจ',
        status: handover?.status === 'signed_handed_over'
          ? 'completed'
          : handover?.status === 'ready' ? 'needs_action' : progress?.complete ? 'waiting' : 'upcoming',
        statusLabel: handover
          ? keyHandoverStatusLabel[handover.status]
          : progress?.complete ? 'รอเจ้าหน้าที่แจ้งความพร้อม' : 'ยังไม่เริ่ม',
        to: '/app/next-steps',
        ctaLabel: 'ดูขั้นตอนรับกุญแจ',
      },
    ]
  })

  const hasUrgentAction = computed(() => nextAction.value.urgency === 'urgent')

  return {
    nextAction,
    milestones,
    alerts,
    statusSections,
    hasUrgentAction,
  }
}
