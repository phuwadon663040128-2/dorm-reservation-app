import type { ReservationGroup, RoommateGroup, RoommateInvitation } from '@/types'
import { agoHours, inHours, inMinutes } from './time'

export const roommateInvitations: RoommateInvitation[] = [
  {
    id: 'inv-1',
    campaignId: 'camp-2569',
    leaderId: 'applicant-a',
    inviteeId: 'applicant-b',
    status: 'accepted',
    sentAt: agoHours(30),
    expiresAt: inHours(18),
  },
  {
    id: 'inv-2',
    campaignId: 'camp-2569',
    leaderId: 'applicant-d',
    inviteeId: 'applicant-h',
    status: 'accepted',
    sentAt: agoHours(5),
    expiresAt: inHours(43),
  },
  {
    id: 'inv-3',
    campaignId: 'camp-2569',
    leaderId: 'applicant-f',
    inviteeId: 'applicant-g',
    status: 'accepted',
    sentAt: agoHours(200),
    expiresAt: agoHours(152),
  },
]

export const roommateGroups: RoommateGroup[] = [
  // G1: ศุภกร + ธนพล — อยู่ระหว่าง payment hold บนห้อง A102
  {
    id: 'group-1',
    campaignId: 'camp-2569',
    leaderId: 'applicant-a',
    memberIds: ['applicant-a', 'applicant-b'],
    status: 'ready_for_payment',
  },
  // G2: ปริญญา + จิรายุ — รอรูมเมทยืนยันห้อง 2101 ภายใน 15 นาที
  {
    id: 'group-2',
    campaignId: 'camp-2569',
    leaderId: 'applicant-d',
    memberIds: ['applicant-d', 'applicant-h'],
    status: 'room_confirmation_pending',
  },
  // G3: ณัฐวุฒิ + พิมพ์ชนก — ยืนยันถาวรแล้วบนห้อง A201
  {
    id: 'group-3',
    campaignId: 'camp-2569',
    leaderId: 'applicant-f',
    memberIds: ['applicant-f', 'applicant-g'],
    status: 'confirmed',
  },
]

export const reservationGroups: ReservationGroup[] = [
  {
    id: 'resv-g1',
    campaignId: 'camp-2569',
    roommateGroupId: 'group-1',
    occupancyMode: 'shared',
    roomNumber: 'A102',
    memberIds: ['applicant-a', 'applicant-b'],
    leaderId: 'applicant-a',
    holdStatus: 'held_payment',
    paymentDeadline: inHours(50),
  },
  {
    id: 'resv-g2',
    campaignId: 'camp-2569',
    roommateGroupId: 'group-2',
    occupancyMode: 'shared',
    roomNumber: '2101',
    memberIds: ['applicant-d', 'applicant-h'],
    leaderId: 'applicant-d',
    holdStatus: 'held_roommate_confirmation',
    confirmationDeadline: inMinutes(9),
  },
  {
    id: 'resv-g3',
    campaignId: 'camp-2569',
    roommateGroupId: 'group-3',
    occupancyMode: 'shared',
    roomNumber: 'A201',
    memberIds: ['applicant-f', 'applicant-g'],
    leaderId: 'applicant-f',
    holdStatus: 'confirmed',
  },
  // วรัญญา เหมาห้อง 3105 — ยืนยันถาวรแล้ว (จองแบบ manual โดยเจ้าหน้าที่)
  {
    id: 'resv-e',
    campaignId: 'camp-2569',
    occupancyMode: 'whole_room',
    roomNumber: '3105',
    memberIds: ['applicant-e'],
    leaderId: 'applicant-e',
    holdStatus: 'confirmed',
    manual: true,
  },
]
