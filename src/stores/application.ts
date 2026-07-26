import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { OccupancyMode, RoomConfig, User } from '@/types'
import { applicationRecordFixtures } from '@/fixtures/applications'

export interface ApplicationDraft {
  applicantId: string
  campaignId: string
  applicantType: string
  title: string
  firstName: string
  lastName: string
  nickname: string
  studentId: string
  dateOfBirth: string
  nationality: string
  idNumber: string
  degreeLevel: string
  studyYear: string
  faculty: string
  major: string
  gpa: string
  advisor: string
  phone: string
  email: string
  address: string
  emergencyName: string
  emergencyRelation: string
  emergencyPhone: string
  bloodGroup: string
  hasCongenitalDisease: string
  congenitalDiseaseDetails: string
  dormActivities: string
  universityActivities: string
  talents: string
  vehicleType: string
  vehicleBrand: string
  vehicleRegistration: string
  photoFileName: string
  medicalCertificateFileName: string
  acceptsRules: boolean
  confirmsAccuracy: boolean
}

export type ApplicationAssignmentStatus = 'payment_hold' | 'confirmed' | 'released'

/**
 * เก็บ snapshot ห้องเมื่อการจองเข้าสู่ payment hold เพื่อให้ใบสมัครยังอ่านย้อนหลังได้
 * แม้ชื่อที่ใช้แสดงใน room master จะถูกแก้ไขภายหลัง
 */
export interface ApplicationRoomAssignment {
  reservationId: string
  dormGroupId: string
  dormName: string
  dormCode: string
  buildingId: string
  buildingName: string
  buildingCode: string
  floor: number
  roomType: RoomConfig
  roomTypeLabel: string
  roomNumber: string
  occupancyMode: OccupancyMode
  assignedAt: string
  status: ApplicationAssignmentStatus
  releasedAt?: string
  releaseReason?: string
}

export type ApplicationRoomAssignmentInput = Omit<
  ApplicationRoomAssignment,
  'assignedAt' | 'status' | 'releasedAt' | 'releaseReason'
>

export interface ApplicationRecord {
  applicantId: string
  reference: string
  revision: number
  submittedAt: string
  updatedAt: string
  submittedData: ApplicationDraft
  activeAssignment: ApplicationRoomAssignment | null
  releasedAssignments: ApplicationRoomAssignment[]
}

export type AssignRoomForPaymentHoldResult =
  | { ok: true }
  | { ok: false, missingApplicantIds: string[] }
  | { ok: false, conflictingApplicantIds: string[] }

export function emptyApplicationDraft(): ApplicationDraft {
  return {
    applicantId: '',
    campaignId: 'camp-2569',
    applicantType: '',
    title: '',
    firstName: '',
    lastName: '',
    nickname: '',
    studentId: '',
    dateOfBirth: '',
    nationality: 'ไทย',
    idNumber: '',
    degreeLevel: 'bachelor',
    studyYear: '',
    faculty: '',
    major: '',
    gpa: '',
    advisor: '',
    phone: '',
    email: '',
    address: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    bloodGroup: '',
    hasCongenitalDisease: 'no',
    congenitalDiseaseDetails: '',
    dormActivities: '',
    universityActivities: '',
    talents: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleRegistration: '',
    photoFileName: '',
    medicalCertificateFileName: '',
    acceptsRules: false,
    confirmsAccuracy: false,
  }
}

function cloneDraft(source: ApplicationDraft): ApplicationDraft {
  return { ...source }
}

function cloneAssignment(source: ApplicationRoomAssignment): ApplicationRoomAssignment {
  return { ...source }
}

function cloneRecord(source: ApplicationRecord): ApplicationRecord {
  return {
    ...source,
    submittedData: cloneDraft(source.submittedData),
    activeAssignment: source.activeAssignment ? cloneAssignment(source.activeAssignment) : null,
    releasedAssignments: source.releasedAssignments.map(cloneAssignment),
  }
}

function freshFixtureRecords() {
  return Object.fromEntries(
    applicationRecordFixtures.map(record => [record.applicantId, cloneRecord(record)]),
  ) as Record<string, ApplicationRecord>
}

export const useApplicationStore = defineStore('application', () => {
  const draft = ref<ApplicationDraft>(emptyApplicationDraft())
  const recordsByApplicantId = ref<Record<string, ApplicationRecord>>(freshFixtureRecords())
  const isRevising = ref(false)
  let nextReferenceNumber = 100001

  const currentRecord = computed<ApplicationRecord | null>(
    () => recordsByApplicantId.value[draft.value.applicantId] ?? null,
  )

  // ให้หน้าฟอร์มอ่านเลขอ้างอิงปัจจุบันโดยไม่ต้องรู้โครงสร้าง map ภายใน
  const submittedReference = computed(() => currentRecord.value?.reference ?? null)

  function recordForApplicant(applicantId: string) {
    return recordsByApplicantId.value[applicantId] ?? null
  }

  function hasSubmittedApplication(applicantId: string) {
    return Boolean(recordForApplicant(applicantId))
  }

  function hydrateIdentity(user: User | null) {
    if (!user || user.role !== 'applicant') return

    const applicantChanged = draft.value.applicantId !== user.id
    if (applicantChanged) {
      const record = recordForApplicant(user.id)
      draft.value = record
        ? cloneDraft(record.submittedData)
        : { ...emptyApplicationDraft(), applicantId: user.id }
      isRevising.value = false
    }

    draft.value.applicantId = user.id
    const [firstName = '', ...lastNameParts] = user.displayName.trim().split(/\s+/)
    if (!draft.value.firstName) draft.value.firstName = firstName
    if (!draft.value.lastName) draft.value.lastName = lastNameParts.join(' ')
    if (!draft.value.studentId) draft.value.studentId = user.studentId ?? ''
    if (!draft.value.phone) draft.value.phone = user.phone ?? ''
    if (!draft.value.email) draft.value.email = user.email
  }

  function createReference() {
    const reference = `APP-2569-${String(nextReferenceNumber).padStart(6, '0')}`
    nextReferenceNumber += 1
    return reference
  }

  function saveRevision() {
    const applicantId = draft.value.applicantId
    if (!applicantId) return null

    const existing = recordForApplicant(applicantId)
    const now = new Date().toISOString()
    const submittedData = cloneDraft(draft.value)

    // รอบและประเภทผู้สมัครมีผลต่อสิทธิ์/ราคา จึงล็อกไว้เมื่อบันทึก revision
    if (existing) {
      submittedData.campaignId = existing.submittedData.campaignId
      submittedData.applicantType = existing.submittedData.applicantType
      draft.value.campaignId = submittedData.campaignId
      draft.value.applicantType = submittedData.applicantType
    }

    const record: ApplicationRecord = existing
      ? {
          ...existing,
          revision: existing.revision + 1,
          updatedAt: now,
          submittedData,
        }
      : {
          applicantId,
          reference: createReference(),
          revision: 1,
          submittedAt: now,
          updatedAt: now,
          submittedData,
          activeAssignment: null,
          releasedAssignments: [],
        }

    recordsByApplicantId.value[applicantId] = record
    isRevising.value = false
    draft.value = cloneDraft(submittedData)
    return record.reference
  }

  function submit() {
    const existing = currentRecord.value
    if (existing && !isRevising.value) return existing.reference
    return saveRevision()
  }

  function beginRevision() {
    const record = currentRecord.value
    if (!record) return false

    draft.value = {
      ...cloneDraft(record.submittedData),
      // ผู้สมัครต้องยืนยันความถูกต้องใหม่ทุกครั้งที่แก้ไขข้อมูล
      confirmsAccuracy: false,
    }
    isRevising.value = true
    return true
  }

  function assignRoomForPaymentHold(
    applicantIds: string[],
    assignment: ApplicationRoomAssignmentInput,
  ): AssignRoomForPaymentHoldResult {
    const uniqueApplicantIds = [...new Set(applicantIds)]
    const missingApplicantIds = uniqueApplicantIds.filter(id => !hasSubmittedApplication(id))
    if (missingApplicantIds.length) return { ok: false, missingApplicantIds }

    const conflictingApplicantIds = uniqueApplicantIds.filter((applicantId) => {
      const activeAssignment = recordForApplicant(applicantId)?.activeAssignment
      return Boolean(
        activeAssignment
        && activeAssignment.reservationId !== assignment.reservationId,
      )
    })
    if (conflictingApplicantIds.length) return { ok: false, conflictingApplicantIds }

    const assignedAt = new Date().toISOString()
    uniqueApplicantIds.forEach((applicantId) => {
      const record = recordsByApplicantId.value[applicantId]!
      const current = record.activeAssignment

      if (current?.reservationId === assignment.reservationId) {
        record.activeAssignment = {
          ...current,
          ...assignment,
          status: 'payment_hold',
          releasedAt: undefined,
          releaseReason: undefined,
        }
      }
      else {
        record.activeAssignment = {
          ...assignment,
          assignedAt,
          status: 'payment_hold',
        }
      }
      record.updatedAt = assignedAt
    })

    return { ok: true }
  }

  function releaseRoomAssignmentForReservation(reservationId: string, reason: string) {
    const releasedAt = new Date().toISOString()
    let changed = false

    Object.values(recordsByApplicantId.value).forEach((record) => {
      if (record.activeAssignment?.reservationId !== reservationId) return

      record.releasedAssignments.push({
        ...record.activeAssignment,
        status: 'released',
        releasedAt,
        releaseReason: reason,
      })
      record.activeAssignment = null
      record.updatedAt = releasedAt
      changed = true
    })

    return changed
  }

  function confirmRoomAssignmentForReservation(
    reservationId: string,
    applicantIds: string[],
  ) {
    const uniqueApplicantIds = [...new Set(applicantIds)]
    if (!uniqueApplicantIds.length) return false
    const records = uniqueApplicantIds
      .map(applicantId => recordForApplicant(applicantId))

    if (
      records.some(record => !record)
      || records.some(record => record?.activeAssignment?.reservationId !== reservationId)
    ) {
      return false
    }

    const confirmedAt = new Date().toISOString()
    records.forEach((record) => {
      record!.activeAssignment!.status = 'confirmed'
      record.updatedAt = confirmedAt
    })

    return true
  }

  function reset() {
    draft.value = emptyApplicationDraft()
    recordsByApplicantId.value = freshFixtureRecords()
    isRevising.value = false
    nextReferenceNumber = 100001
  }

  return {
    draft,
    recordsByApplicantId,
    currentRecord,
    submittedReference,
    isRevising,
    recordForApplicant,
    hasSubmittedApplication,
    hydrateIdentity,
    submit,
    beginRevision,
    saveRevision,
    assignRoomForPaymentHold,
    releaseRoomAssignmentForReservation,
    confirmRoomAssignmentForReservation,
    reset,
  }
})
