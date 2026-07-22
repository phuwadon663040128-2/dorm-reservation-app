import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Room, User } from '@/types'

export interface ApplicationDraft {
  applicantId: string
  campaignId: string
  applicantType: string
  dormGroupId: string
  roomType: string
  /** ห้องที่สนใจจากผัง — ยังไม่ hold จนกว่าจะกดยืนยันจอง */
  preferredRoomNumber: string
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

function emptyDraft(): ApplicationDraft {
  return {
    applicantId: '',
    campaignId: 'camp-2569',
    applicantType: '',
    dormGroupId: '',
    roomType: '',
    preferredRoomNumber: '',
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

export const useApplicationStore = defineStore('application', () => {
  const draft = ref<ApplicationDraft>(emptyDraft())
  const submittedReference = ref<string | null>(null)
  const submittedDraft = ref<ApplicationDraft | null>(null)

  function hydrateIdentity(user: User | null) {
    if (!user || user.role !== 'applicant') return

    // draft เป็นของผู้สมัครคนเดียวเท่านั้น ป้องกันข้อมูลติดข้ามบัญชีระหว่าง demo
    if (draft.value.applicantId && draft.value.applicantId !== user.id) reset()
    draft.value.applicantId = user.id

    const [firstName = '', ...lastNameParts] = user.displayName.trim().split(/\s+/)
    if (!draft.value.firstName) draft.value.firstName = firstName
    if (!draft.value.lastName) draft.value.lastName = lastNameParts.join(' ')
    if (!draft.value.studentId) draft.value.studentId = user.studentId ?? ''
    if (!draft.value.phone) draft.value.phone = user.phone ?? ''
    if (!draft.value.email) draft.value.email = user.email
  }

  function setPreferenceFromRoom(room: Room, dormGroupId: string) {
    draft.value.dormGroupId = dormGroupId
    draft.value.roomType = room.config
    draft.value.preferredRoomNumber = room.number
  }

  function submittedRoomMatches(room: Room, dormGroupId: string, applicantId: string) {
    const application = submittedDraft.value
    if (!application || application.applicantId !== applicantId) return false
    if (application.dormGroupId !== dormGroupId || application.roomType !== room.config) return false
    return !application.preferredRoomNumber || application.preferredRoomNumber === room.number
  }

  function submit() {
    submittedReference.value = `APP-2569-${String(Date.now()).slice(-6)}`
    // ทุก field เป็น primitive จึงทำ snapshot แบบ shallow ได้ และหลีกเลี่ยงการ clone Vue reactive proxy
    submittedDraft.value = { ...draft.value }
    return submittedReference.value
  }

  function reopenForRevision() {
    submittedReference.value = null
    submittedDraft.value = null
  }

  function reviseForRoom(room: Room, dormGroupId: string) {
    reopenForRevision()
    setPreferenceFromRoom(room, dormGroupId)
  }

  function reset() {
    draft.value = emptyDraft()
    submittedReference.value = null
    submittedDraft.value = null
  }

  return {
    draft,
    submittedReference,
    submittedDraft,
    hydrateIdentity,
    setPreferenceFromRoom,
    submittedRoomMatches,
    submit,
    reopenForRevision,
    reviseForRoom,
    reset,
  }
})
