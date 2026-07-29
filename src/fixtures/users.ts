import type { Permission, StaffSection, User } from '@/types'

// ข้อมูลสมมติทั้งหมด — ห้ามใช้ข้อมูลนักศึกษา/ธนาคารจริง (PDPA, doc 14)
export const users: User[] = [
  {
    id: 'applicant-a',
    role: 'applicant',
    displayName: 'ศุภกร ใจดี',
    email: 'supakorn.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: true,
    studentId: '673010001-1',
    phone: '0810001001',
  },
  {
    id: 'applicant-b',
    role: 'applicant',
    displayName: 'ธนพล มั่นคง',
    email: 'thanapon.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    studentId: '673010002-2',
    phone: '0810001002',
  },
  {
    id: 'applicant-c',
    role: 'applicant',
    displayName: 'กมลชนก แสงทอง',
    email: 'kamonchanok.demo@example.test',
    emailVerified: true,
    profileComplete: false,
    kkuSsoLinked: false,
  },
  {
    id: 'applicant-d',
    role: 'applicant',
    displayName: 'ปริญญา สายชล',
    email: 'parinya.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    studentId: '663010044-3',
  },
  {
    id: 'applicant-h',
    role: 'applicant',
    displayName: 'จิรายุ วงศ์สุข',
    email: 'jirayu.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    studentId: '663010045-4',
  },
  {
    id: 'applicant-e',
    role: 'applicant',
    displayName: 'วรัญญา พูนสุข',
    email: 'waranya.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: true,
    studentId: '653010099-5',
  },
  {
    id: 'applicant-f',
    role: 'applicant',
    displayName: 'ณัฐวุฒิ ศรีสวัสดิ์',
    email: 'natthawut.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    studentId: '663010071-6',
  },
  {
    id: 'applicant-g',
    role: 'applicant',
    displayName: 'พิมพ์ชนก บุญมา',
    email: 'pimchanok.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    studentId: '663010072-7',
  },
  // สองบัญชีนี้ว่างจากทุกสถานการณ์ — ไว้เดินชม flow เชิญรูมเมท → จอง → ยืนยัน ตั้งแต่ต้น
  {
    id: 'applicant-i',
    role: 'applicant',
    displayName: 'ณิชา อุ่นเรือน',
    email: 'nicha.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    studentId: '673010120-8',
  },
  {
    id: 'applicant-j',
    role: 'applicant',
    displayName: 'ภูริ พัฒนกุล',
    email: 'phuri.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    studentId: '673010121-9',
  },
  // เจ้าหน้าที่มีบทบาทเดียว ทำได้ทุกอย่างในส่วนงานที่ได้รับ — ผู้ดูแลระบบกำหนดส่วนงานรายคน
  {
    id: 'staff-dorm',
    role: 'staff',
    displayName: 'สมศักดิ์ ประจำหอ',
    email: 'dorm-staff.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    dormGroupIds: ['dorm-8-lang', 'dorm-wor-inter'],
    // ไม่กำหนด allowedSections = เข้าถึงได้ทุกส่วน
  },
  {
    id: 'staff-finance',
    role: 'staff',
    displayName: 'รัตนา แก้วประเสริฐ',
    email: 'finance.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    dormGroupIds: ['dorm-8-lang', 'dorm-wor-inter'],
    // ตัวอย่างที่ผู้ดูแลระบบจำกัดให้เข้าเฉพาะงานการเงิน
    allowedSections: ['overview', 'payment'],
  },
  {
    id: 'staff-contract',
    role: 'staff',
    displayName: 'ประวิทย์ อินทรชัย',
    email: 'contract.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    dormGroupIds: ['dorm-8-lang', 'dorm-wor-inter'],
    // ตัวอย่างที่ผู้ดูแลระบบจำกัดให้เข้าเฉพาะงานสัญญา/ส่งต่อ
    allowedSections: ['overview', 'contract'],
  },
  {
    id: 'staff-admin',
    role: 'admin',
    displayName: 'กองบริการหอพัก (ผู้ดูแลระบบ)',
    email: 'admin.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    dormGroupIds: ['dorm-8-lang', 'dorm-wor-inter'],
  },
  {
    id: 'staff-unauthorized',
    role: 'staff',
    displayName: 'เจ้าหน้าที่ใหม่ (ยังไม่ได้รับสิทธิ์)',
    email: 'unauthorized.demo@example.test',
    emailVerified: true,
    profileComplete: true,
    kkuSsoLinked: false,
    dormGroupIds: [],
    allowedSections: [],
  },
]

// ---------------------------------------------------------------------------
// ส่วนงานฝั่งเจ้าหน้าที่ — ผู้ดูแลระบบเปิด/ปิดรายคนที่หน้า "จัดการสิทธิ์เจ้าหน้าที่"
// permission รายละเอียดยังคง deny-by-default และผูกกับส่วนงานที่ได้รับ (doc 11)
// ---------------------------------------------------------------------------

export const staffSectionMeta: { key: StaffSection; label: string; description: string }[] = [
  { key: 'overview', label: 'ภาพรวมและรอบรับสมัคร', description: 'Dashboard สรุปสถานะ และการตั้งค่ารอบรับสมัคร' },
  { key: 'reservation', label: 'ห้องพักและการจอง', description: 'จัดการห้อง ผู้สมัคร กลุ่มรูมเมท hold และจองแทน' },
  { key: 'payment', label: 'การเงิน SCB', description: 'รายการชำระเงิน export SLIPS นำเข้า PDF/ผลชำระ และ exception' },
  { key: 'contract', label: 'สัญญาและส่งต่อ', description: 'สัญญา ส่งมอบกุญแจ และส่งข้อมูลเข้าระบบมหาวิทยาลัย' },
  { key: 'system', label: 'รายงานและระบบ', description: 'รายงาน audit log และการตั้งค่า' },
]

const sectionPermissions: Record<StaffSection, Permission[]> = {
  overview: [],
  reservation: [
    'room.manage',
    'room.block',
    'reservation.manual_create',
    'reservation.assign_room',
    'reservation.confirm',
    'reservation.cancel.review',
  ],
  payment: [
    'pricing_rule.manage',
    'payment_obligation.override',
    'payment_export.create',
    'payment_export.download',
    'payment_document.import',
    'payment_document.match_review',
    'payment_result.import',
    'payment.manual_record',
    'payment.exception.resolve',
    'payment.confirm',
    'payment.cancel',
    'payment.refund_status.manage',
  ],
  contract: [
    'contract_template.manage',
    'contract.generate',
    'contract.print',
    'contract.receive',
    'key_handover.record',
    'university_export.create',
    'correction_export.create',
  ],
  system: ['audit.view'],
}

export const ALL_SECTIONS: StaffSection[] = staffSectionMeta.map(s => s.key)

/** permission ทั้งหมดของชุดส่วนงานที่ได้รับ */
export function permissionsForSections(sections: StaffSection[]): Permission[] {
  return sections.flatMap(s => sectionPermissions[s])
}

/** ส่วนงานตั้งต้นของผู้ใช้ตาม fixture — ผู้ดูแลระบบปรับได้ระหว่างใช้งาน (store staffAccess) */
export function defaultSectionsFor(user: User): StaffSection[] {
  if (user.role === 'admin') return ALL_SECTIONS
  if (user.role === 'applicant') return []
  return user.allowedSections ?? ALL_SECTIONS
}
