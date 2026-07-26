import type {
  ApplicationDraft,
  ApplicationRecord,
  ApplicationRoomAssignment,
} from '@/stores/application'
import type { ReservationGroup, User } from '@/types'
import { roomConfigLabel } from '@/lib/labels'
import { buildings, dormGroups, rooms } from './rooms'
import { reservationGroups } from './reservations'
import { users } from './users'

const SUBMITTED_AT = '2026-06-01T02:00:00.000Z'

function submittedDataFor(user: User): ApplicationDraft {
  const [firstName = '', ...lastNameParts] = user.displayName.trim().split(/\s+/)
  return {
    applicantId: user.id,
    campaignId: 'camp-2569',
    applicantType: 'new_first_year',
    title: 'นาย',
    firstName,
    lastName: lastNameParts.join(' '),
    nickname: '',
    studentId: user.studentId ?? '',
    dateOfBirth: '2006-01-01',
    nationality: 'ไทย',
    idNumber: '',
    degreeLevel: 'bachelor',
    studyYear: '1',
    faculty: 'คณะวิศวกรรมศาสตร์',
    major: 'วิศวกรรมคอมพิวเตอร์',
    gpa: '',
    advisor: '',
    phone: user.phone ?? '08x-xxx-xxxx',
    email: user.email,
    address: 'ข้อมูลที่อยู่จำลองสำหรับการสาธิตระบบ',
    emergencyName: 'ผู้ติดต่อฉุกเฉิน',
    emergencyRelation: 'ผู้ปกครอง',
    emergencyPhone: '08x-xxx-0000',
    bloodGroup: 'unknown',
    hasCongenitalDisease: 'no',
    congenitalDiseaseDetails: '',
    dormActivities: '',
    universityActivities: '',
    talents: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleRegistration: '',
    photoFileName: 'profile-demo.jpg',
    medicalCertificateFileName: 'medical-demo.pdf',
    acceptsRules: true,
    confirmsAccuracy: true,
  }
}

function assignmentFor(
  reservation: ReservationGroup,
  status: 'payment_hold' | 'confirmed',
): ApplicationRoomAssignment {
  const room = rooms.find(item => item.number === reservation.roomNumber)
  if (!room) throw new Error(`Missing room fixture for ${reservation.roomNumber}`)
  const building = buildings.find(item => item.id === room.buildingId)
  if (!building) throw new Error(`Missing building fixture for ${room.buildingId}`)
  const dormGroup = dormGroups.find(item => item.id === building.dormGroupId)
  if (!dormGroup) throw new Error(`Missing dorm fixture for ${building.dormGroupId}`)
  const assignedAt = reservation.paymentDeadline
    ? new Date(new Date(reservation.paymentDeadline).getTime() - 72 * 3_600_000).toISOString()
    : SUBMITTED_AT

  return {
    reservationId: reservation.id,
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
    occupancyMode: reservation.occupancyMode,
    assignedAt,
    status,
  }
}

const referenceSuffix: Record<string, string> = {
  'applicant-a': '000001',
  'applicant-b': '000002',
  'applicant-d': '000004',
  'applicant-e': '000005',
  'applicant-f': '000006',
  'applicant-g': '000007',
  'applicant-h': '000008',
}

const activeAssignments = new Map<string, ApplicationRoomAssignment>()

for (const reservation of reservationGroups) {
  if (reservation.holdStatus !== 'held_payment' && reservation.holdStatus !== 'confirmed') continue
  const assignment = assignmentFor(
    reservation,
    reservation.holdStatus === 'confirmed' ? 'confirmed' : 'payment_hold',
  )
  reservation.memberIds.forEach(applicantId => activeAssignments.set(applicantId, { ...assignment }))
}

const seededApplicantIds = [
  'applicant-a',
  'applicant-b',
  'applicant-d',
  'applicant-h',
  'applicant-e',
  'applicant-f',
  'applicant-g',
]

export const applicationRecordFixtures: ApplicationRecord[] = seededApplicantIds.map((applicantId) => {
  const user = users.find(item => item.id === applicantId)
  if (!user) throw new Error(`Missing applicant fixture for ${applicantId}`)
  const activeAssignment = activeAssignments.get(applicantId) ?? null

  return {
    applicantId,
    reference: `APP-2569-${referenceSuffix[applicantId]}`,
    revision: 1,
    submittedAt: SUBMITTED_AT,
    updatedAt: activeAssignment?.assignedAt ?? SUBMITTED_AT,
    submittedData: submittedDataFor(user),
    activeAssignment,
    releasedAssignments: [],
  }
})
