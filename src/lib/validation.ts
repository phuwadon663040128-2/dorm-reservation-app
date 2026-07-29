import { z } from 'zod'

export const INPUT_LIMITS = {
  personName: 100,
  nickname: 50,
  nationality: 60,
  identityNumber: 20,
  studentId: 11,
  faculty: 120,
  major: 120,
  advisor: 150,
  phone: 20,
  email: 254,
  address: 500,
  emergencyName: 150,
  emergencyRelation: 60,
  healthDetails: 1_000,
  activity: 500,
  vehicle: 60,
  vehicleRegistration: 20,
  password: 128,
  contactName: 150,
  contactSubject: 150,
  contactMessage: 3_000,
  roommateSearch: 50,
  fileName: 255,
  cancellationReason: 500,
  reviewReason: 500,
  refundReference: 100,
  refundNotes: 1_000,
} as const

const thaiDigits = '๐๑๒๓๔๕๖๗๘๙'

export function toAsciiDigits(value: string) {
  return value.replace(/[๐-๙]/g, digit => String(thaiDigits.indexOf(digit)))
}

export function normalizePhone(value: string) {
  return toAsciiDigits(value).trim().replace(/[\s()-]/g, '')
}

export function isSupportedPhone(value: string) {
  const normalized = normalizePhone(value)
  return /^\+[1-9]\d{7,14}$/.test(normalized)
    || /^0[689]\d{8}$/.test(normalized)
    || /^0[2-7]\d{7}$/.test(normalized)
}

export function normalizeStudentId(value: string) {
  return toAsciiDigits(value).replace(/\D/g, '')
}

export function formatStudentId(value: string) {
  const digits = normalizeStudentId(value).slice(0, 10)
  return digits.length > 9 ? `${digits.slice(0, 9)}-${digits.slice(9)}` : digits
}

export function formatGpa(value: string) {
  const normalized = toAsciiDigits(value).trim().replace(',', '.')
  if (!/^(?:\d+(?:\.\d{1,2})?)$/.test(normalized)) return normalized
  const number = Number(normalized)
  return Number.isFinite(number) && number >= 0 && number <= 4 ? number.toFixed(2) : normalized
}

export function maskIdentityNumber(value: string) {
  const normalized = value.trim()
  if (!normalized) return 'ไม่ได้ระบุ'
  if (normalized.length <= 4) return normalized
  return `${'•'.repeat(Math.min(normalized.length - 4, 9))}${normalized.slice(-4)}`
}

const trimmedRequired = (label: string, max: number) => z.string()
  .trim()
  .min(1, `กรุณากรอก${label}`)
  .max(max, `${label}ต้องไม่เกิน ${max.toLocaleString('th-TH')} ตัวอักษร`)

const trimmedOptional = (label: string, max: number) => z.string()
  .trim()
  .max(max, `${label}ต้องไม่เกิน ${max.toLocaleString('th-TH')} ตัวอักษร`)

const phoneSchema = (label: string) => trimmedRequired(label, INPUT_LIMITS.phone)
  .refine(isSupportedPhone, `${label}ไม่ถูกต้อง ใช้เบอร์ไทยหรือรูปแบบ +country code`)

const emailSchema = (required = true) => {
  const base = z.string().trim().max(INPUT_LIMITS.email, `อีเมลต้องไม่เกิน ${INPUT_LIMITS.email} ตัวอักษร`)
  return required
    ? base.min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง')
    : base.refine(value => !value || z.string().email().safeParse(value).success, 'รูปแบบอีเมลไม่ถูกต้อง')
}

export const loginCredentialsSchema = z.object({
  email: emailSchema(),
  password: z.string()
    .min(1, 'กรุณากรอกรหัสผ่าน')
    .max(INPUT_LIMITS.password, `รหัสผ่านต้องไม่เกิน ${INPUT_LIMITS.password} ตัวอักษร`)
    .refine(value => value.trim().length > 0, 'รหัสผ่านต้องไม่เป็นช่องว่างทั้งหมด'),
})

export const registrationSchema = z.object({
  email: emailSchema(),
  password: z.string()
    .min(8, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร')
    .max(INPUT_LIMITS.password, `รหัสผ่านต้องไม่เกิน ${INPUT_LIMITS.password} ตัวอักษร`)
    .refine(value => value.trim().length > 0, 'รหัสผ่านต้องไม่เป็นช่องว่างทั้งหมด'),
  acceptedNotice: z.literal(true, { errorMap: () => ({ message: 'กรุณาอ่านและรับทราบประกาศความเป็นส่วนตัวก่อนสมัคร' }) }),
})

export const contactFormSchema = z.object({
  name: trimmedRequired('ชื่อ–นามสกุล', INPUT_LIMITS.contactName),
  email: emailSchema(false),
  subject: trimmedRequired('หัวข้อเรื่อง', INPUT_LIMITS.contactSubject),
  message: trimmedOptional('รายละเอียด', INPUT_LIMITS.contactMessage),
})

export const roommateSearchSchema = z.string()
  .trim()
  .min(6, 'กรอกรหัสนักศึกษาหรืออีเมลอย่างน้อย 6 ตัวอักษร')
  .max(INPUT_LIMITS.roommateSearch, `คำค้นหาต้องไม่เกิน ${INPUT_LIMITS.roommateSearch} ตัวอักษร`)

const applicantTypeSchema = z.enum([
  'new_first_year',
  'current_resident',
  'other_dorm_senior',
  'international',
  'general',
], { errorMap: () => ({ message: 'กรุณาเลือกประเภทผู้สมัคร' }) })

const applicationStep1Schema = z.object({
  applicantType: applicantTypeSchema,
})

const applicationStep2Schema = z.object({
  applicantType: applicantTypeSchema,
  title: trimmedRequired('คำนำหน้า', 20),
  firstName: trimmedRequired('ชื่อ', INPUT_LIMITS.personName),
  lastName: trimmedRequired('นามสกุล', INPUT_LIMITS.personName),
  nickname: trimmedOptional('ชื่อเล่น', INPUT_LIMITS.nickname),
  studentId: trimmedRequired('รหัสนักศึกษา', INPUT_LIMITS.studentId)
    .refine(value => normalizeStudentId(value).length === 10, 'รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก'),
  dateOfBirth: trimmedRequired('วันเดือนปีเกิด', 10)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`)
      return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now()
    }, 'วันเดือนปีเกิดไม่ถูกต้องหรือตรงกับวันที่ในอนาคต'),
  nationality: trimmedOptional('สัญชาติ', INPUT_LIMITS.nationality),
  idNumber: trimmedOptional('เลขประจำตัวประชาชน / Passport', INPUT_LIMITS.identityNumber),
  degreeLevel: trimmedRequired('ระดับการศึกษา', 30),
  studyYear: trimmedRequired('ชั้นปี', 2),
  faculty: trimmedRequired('คณะ', INPUT_LIMITS.faculty),
  major: trimmedRequired('สาขาวิชา', INPUT_LIMITS.major),
  gpa: trimmedOptional('GPA', 4),
  advisor: trimmedOptional('ชื่ออาจารย์ที่ปรึกษา', INPUT_LIMITS.advisor),
  phone: phoneSchema('เบอร์โทรศัพท์'),
  email: emailSchema(),
  address: trimmedRequired('ที่อยู่ที่ติดต่อได้', INPUT_LIMITS.address),
  emergencyName: trimmedRequired('ชื่อผู้ติดต่อฉุกเฉิน', INPUT_LIMITS.emergencyName),
  emergencyRelation: trimmedOptional('ความสัมพันธ์', INPUT_LIMITS.emergencyRelation),
  emergencyPhone: phoneSchema('เบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน'),
}).superRefine((value, context) => {
  const gpaRequired = ['current_resident', 'other_dorm_senior'].includes(value.applicantType)
  if (gpaRequired && !value.gpa) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['gpa'], message: 'กรุณากรอก GPA สำหรับประเภทผู้สมัครนี้' })
    return
  }
  if (!value.gpa) return
  const normalized = toAsciiDigits(value.gpa).replace(',', '.')
  if (!/^(?:[0-3](?:\.\d{1,2})?|4(?:\.0{1,2})?)$/.test(normalized)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['gpa'], message: 'GPA ต้องอยู่ระหว่าง 0.00–4.00 และมีทศนิยมไม่เกิน 2 ตำแหน่ง' })
  }
})

const applicationStep3Schema = z.object({
  bloodGroup: trimmedRequired('หมู่เลือด', 10),
  hasCongenitalDisease: z.enum(['yes', 'no']),
  congenitalDiseaseDetails: trimmedOptional('รายละเอียดโรคประจำตัว', INPUT_LIMITS.healthDetails),
  dormActivities: trimmedOptional('กิจกรรมของหอพัก', INPUT_LIMITS.activity),
  universityActivities: trimmedOptional('กิจกรรมของคณะ / มหาวิทยาลัย', INPUT_LIMITS.activity),
  talents: trimmedOptional('ความสามารถพิเศษ', INPUT_LIMITS.activity),
  vehicleType: trimmedOptional('ประเภทยานพาหนะ', INPUT_LIMITS.vehicle),
  vehicleBrand: trimmedOptional('ยี่ห้อยานพาหนะ', INPUT_LIMITS.vehicle),
  vehicleRegistration: trimmedOptional('เลขทะเบียน', INPUT_LIMITS.vehicleRegistration),
  photoFileName: trimmedOptional('ชื่อไฟล์รูปถ่าย', INPUT_LIMITS.fileName),
  medicalCertificateFileName: trimmedOptional('ชื่อไฟล์ใบรับรองแพทย์', INPUT_LIMITS.fileName),
}).superRefine((value, context) => {
  if (value.hasCongenitalDisease === 'yes' && !value.congenitalDiseaseDetails) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['congenitalDiseaseDetails'], message: 'กรุณาระบุรายละเอียดโรคประจำตัว' })
  }
})

const applicationStep4Schema = z.object({
  acceptsRules: z.literal(true, { errorMap: () => ({ message: 'กรุณารับทราบกฎระเบียบหอพัก' }) }),
  confirmsAccuracy: z.literal(true, { errorMap: () => ({ message: 'กรุณายืนยันความถูกต้องของข้อมูล' }) }),
})

const applicationStepSchemas = {
  1: applicationStep1Schema,
  2: applicationStep2Schema,
  3: applicationStep3Schema,
  4: applicationStep4Schema,
} as const

export type ValidationErrors = Record<string, string>

export function errorsFromZod(error: z.ZodError): ValidationErrors {
  const errors: ValidationErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    errors[key] ??= issue.message
  }
  return errors
}

export function validateApplicationStepData(data: unknown, step: keyof typeof applicationStepSchemas) {
  const result = applicationStepSchemas[step].safeParse(data)
  return result.success
    ? { ok: true as const, errors: {} as ValidationErrors }
    : { ok: false as const, errors: errorsFromZod(result.error) }
}

export function validateApplicationData(data: unknown) {
  const errors: ValidationErrors = {}
  for (const step of [1, 2, 3, 4] as const) {
    const result = validateApplicationStepData(data, step)
    if (!result.ok) Object.assign(errors, result.errors)
  }
  return Object.keys(errors).length
    ? { ok: false as const, errors }
    : { ok: true as const, errors }
}

const applicationTextFields = [
  'applicantId', 'campaignId', 'applicantType', 'title', 'firstName', 'lastName', 'nickname',
  'studentId', 'dateOfBirth', 'nationality', 'idNumber', 'degreeLevel', 'studyYear', 'faculty',
  'major', 'gpa', 'advisor', 'phone', 'email', 'address', 'emergencyName', 'emergencyRelation',
  'emergencyPhone', 'bloodGroup', 'hasCongenitalDisease', 'congenitalDiseaseDetails',
  'dormActivities', 'universityActivities', 'talents', 'vehicleType', 'vehicleBrand',
  'vehicleRegistration', 'photoFileName', 'medicalCertificateFileName',
] as const

export function normalizeApplicationData<T extends object>(source: T): T {
  const normalized: Record<string, unknown> = { ...(source as Record<string, unknown>) }
  for (const field of applicationTextFields) {
    const value = normalized[field]
    if (typeof value === 'string') normalized[field] = value.trim()
  }
  if (typeof normalized.studentId === 'string') normalized.studentId = formatStudentId(normalized.studentId)
  if (typeof normalized.phone === 'string') normalized.phone = normalizePhone(normalized.phone)
  if (typeof normalized.emergencyPhone === 'string') normalized.emergencyPhone = normalizePhone(normalized.emergencyPhone)
  if (typeof normalized.gpa === 'string' && normalized.gpa) normalized.gpa = formatGpa(normalized.gpa)
  if (typeof normalized.email === 'string') normalized.email = normalized.email.toLowerCase()
  return normalized as unknown as T
}

export interface FileValidationOptions {
  maxSizeMb: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
}

export function validateUploadFile(file: File, options: FileValidationOptions) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!options.allowedMimeTypes.includes(file.type) || !options.allowedExtensions.includes(extension)) {
    return 'ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ตามรูปแบบที่กำหนด'
  }
  if (file.size > options.maxSizeMb * 1024 * 1024) {
    return `ไฟล์ต้องมีขนาดไม่เกิน ${options.maxSizeMb} MB`
  }
  if (file.name.length > INPUT_LIMITS.fileName) {
    return `ชื่อไฟล์ต้องไม่เกิน ${INPUT_LIMITS.fileName} ตัวอักษร`
  }
  return ''
}
