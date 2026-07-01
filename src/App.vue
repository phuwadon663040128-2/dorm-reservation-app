<script setup lang="ts">
import { ref, reactive } from 'vue'
import { toast } from 'vue-sonner'
import type { DormCampaign, DormRooms, Applicant, AuditLog } from './types'
import TopNavbar from './components/TopNavbar.vue'
import ApplicantView from './views/ApplicantView.vue'
import AdminView from './views/AdminView.vue'
import LoginView from './views/LoginView.vue'
import { Toaster } from '@/components/ui/sonner'

function showToast(msg: string) {
  toast(msg)
}

type UserRole = 'applicant' | 'admin'

interface SessionUser {
  role: UserRole
  username: string
  displayName: string
  identifier: string
  unit?: string
  activeAppId?: string
}

// Authentication States
const isLoggedIn = ref(false)
const currentUser = ref<SessionUser | null>(null)

function handleLogin(payload: {
  role: UserRole
  username: string
  displayName?: string
  identifier?: string
  unit?: string
  activeAppId?: string
}) {
  isLoggedIn.value = true
  currentRole.value = payload.role
  currentUser.value = {
    role: payload.role,
    username: payload.username,
    displayName: payload.displayName || (payload.role === 'admin' ? 'เจ้าหน้าที่หอพัก' : 'นักศึกษา มข.'),
    identifier: payload.identifier || payload.username,
    unit: payload.unit,
    activeAppId: payload.activeAppId,
  }
  if (payload.activeAppId) {
    const app = applicantsList.value.find(a => a.id === payload.activeAppId)
    activeApplicantApp.value = app || null
  } else {
    activeApplicantApp.value = null
  }
  addAuditLog(`ผู้ใช้เข้าสู่ระบบ: ${payload.username} (${payload.role === 'admin' ? 'เจ้าหน้าที่' : 'ผู้สมัคร'})`)
}

function handleLogout() {
  handleReset(false)
  isLoggedIn.value = false
  activeApplicantApp.value = null
  currentUser.value = null
  currentAdminTab.value = 'dashboard'
  showToast('ออกจากระบบและรีเซ็ตข้อมูลจำลองเรียบร้อยแล้ว')
  return
  showToast('ออกจากระบบเรียบร้อยแล้ว')
}

// System Roles
const currentRole = ref<UserRole>('applicant')
const currentAdminTab = ref('dashboard')

// Active Application State (for Applicant Tracking)
const activeApplicantApp = ref<Applicant | null>(null)

// Audit trail
const auditLogList = ref<AuditLog[]>([
  { timestamp: '2026-07-01 08:30:12', detail: 'ระบบเริ่มทำงานตามกำหนดเวลาแคมเปญ' },
  { timestamp: '2026-06-30 14:32:00', detail: 'ใบสมัคร APP-001095 อัปโหลดสลิปเข้าระบบ' },
  { timestamp: '2026-06-29 19:10:45', detail: 'ส่งกลับ APP-001103 อัปโหลดสลิปใหม่' },
  { timestamp: '2026-06-28 10:20:00', detail: 'UniPay APP-001042 ยืนยันสำเร็จ' }
])

function addAuditLog(detail: string) {
  const now = new Date()
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  auditLogList.value.unshift({ timestamp: ts, detail })
}

// Mock Database: Campaigns
const campaignList = ref<DormCampaign[]>([
  {
    id: 'dorm-8',
    name: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
    type: 'หอพักในเครือข่าย',
    status: 'open',
    description: 'หอพักหญิงวรเรสซิเดนซ์ (หอ 8 หลังเก่า) ห้องพัดลมและห้องแอร์ พร้อมสิ่งอำนวยความสะดวกครบครัน',
    openDate: '2026-06-01',
    closeDate: '2026-07-15',
    requiredAmount: 3000,
    rules: 'มัดจำโอนจองสิทธิ์ 3,000 บาท (หักคืนวันย้ายออก)',
    paymentRequirement: 'ค่าประกันความเสียหาย',
    facilities: ['WiFi', 'เครื่องซักผ้าหยอดเหรียญ', 'กล้องวงจรปิด', 'ที่จอดรถ'],
    roomTypes: [
      { name: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)', price: 9000, capacity: 40, active: 40 },
      { name: 'ห้องเตียงคู่ (พัดลม)', price: 4000, capacity: 38, active: 38 }
    ]
  },
  {
    id: 'dorm-9',
    name: 'หอพักนพรัตน์ / หอ 9 หลัง',
    type: 'หอพักหญิง มข.',
    status: 'open',
    description: 'หอพักหญิงนพรัตน์ มหาวิทยาลัยขอนแก่น ให้สิทธิ์ทั้งนักศึกษาปี 1 และนักศึกษาเก่าต่อสัญญาเดิม',
    openDate: '2026-06-05',
    closeDate: '2026-07-20',
    requiredAmount: 8000,
    rules: 'ชำระค่าหอพักเต็มจำนวนตามประเภทห้อง (นักศึกษาปี 1 ชำระ 2 เทอม)',
    paymentRequirement: 'ค่าหอพักเต็มจำนวน',
    facilities: ['ห้องอ่านหนังสือ', 'ตู้กดน้ำ', 'แม่บ้านดูแลความสะอาด', 'คีย์การ์ด'],
    roomTypes: [
      { name: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)', price: 8000, capacity: 25, active: 24 },
      { name: 'ห้องเตียงเดี่ยว (เครื่องปรับอากาศ)', price: 16000, capacity: 15, active: 15 }
    ]
  },
  {
    id: 'dorm-inter',
    name: 'หอพักวรอินเตอร์',
    type: 'หอพักนานาชาติ',
    status: 'open',
    description: 'หอพักนานาชาติวรอินเตอร์ ยินดีต้อนรับนักศึกษาไทยและนักศึกษาต่างชาติ ห้องพักระดับพรีเมียม',
    openDate: '2026-06-10',
    closeDate: '2026-07-30',
    requiredAmount: 4000,
    rules: 'มัดจำล่วงหน้า 4,000 บาท (นักศึกษาต่างชาติชำระเต็มจํานวน 19,000 บาท)',
    paymentRequirement: 'ค่ามัดจำสัญญาจอง',
    facilities: ['สระว่ายน้ำ', 'ฟิตเนส', 'WiFi ความเร็วสูง', 'ระบบรักษาความปลอดภัย 24 ชม.'],
    roomTypes: [
      { name: 'ห้องเตียงเดี่ยวพรีเมียม (เครื่องปรับอากาศ)', price: 19000, capacity: 15, active: 14 }
    ]
  }
])

// Mock Database: Applicants
const applicantsList = ref<Applicant[]>([
  {
    id: 'APP-001042',
    name: 'นายสมชาย รักดี',
    studentId: '643020111-2',
    phone: '0812345678',
    email: 'somchai@kku.ac.th',
    faculty: 'วิศวกรรมศาสตร์',
    gender: 'ชาย',
    dormId: 'dorm-8',
    dormName: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
    roomType: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)',
    roomNumber: '206',
    applicantType: 'General Student',
    status: 'Confirmed',
    amountPaid: 3000,
    paymentDate: '2026-06-28',
    paymentTime: '10:15',
    slipFile: 'unipay_receipt_3000.pdf',
    docFile: 'student_card.pdf',
    paymentMethod: 'UniPay',
    rejectReason: ''
  },
  {
    id: 'APP-001095',
    name: 'นางสาวสมศรี ดีเลิศ',
    studentId: '653020222-3',
    phone: '0898765432',
    email: 'somsri@kku.ac.th',
    faculty: 'แพทยศาสตร์',
    gender: 'หญิง',
    dormId: 'dorm-9',
    dormName: 'หอพักนพรัตน์ / หอ 9 หลัง',
    roomType: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)',
    roomNumber: '201',
    applicantType: 'New First-Year',
    status: 'Staff Verifying',
    amountPaid: 16000,
    paymentDate: '2026-06-30',
    paymentTime: '14:30',
    slipFile: 'slip_receipt_16000.png',
    docFile: 'student_card.pdf',
    paymentMethod: 'Manual',
    rejectReason: ''
  },
  {
    id: 'APP-001103',
    name: 'Mr. John Doe',
    studentId: '663020999-0',
    phone: '0823334444',
    email: 'john.d@kku.ac.th',
    faculty: 'วิทยาลัยนานาชาติ',
    gender: 'ชาย',
    dormId: 'dorm-inter',
    dormName: 'หอพักวรอินเตอร์',
    roomType: 'ห้องเตียงเดี่ยวพรีเมียม (เครื่องปรับอากาศ)',
    roomNumber: '201',
    applicantType: 'International Student',
    status: 'Need Re-upload',
    amountPaid: 19000,
    paymentDate: '2026-06-29',
    paymentTime: '18:40',
    slipFile: 'blurry_receipt.png',
    docFile: 'student_card.pdf',
    paymentMethod: 'Manual',
    rejectReason: 'ภาพสลิปไม่ชัดเจน กรุณาอัปโหลดใหม่'
  },
  {
    id: 'APP-001150',
    name: 'นางสาวกัญญา พรหมดี',
    studentId: '643020444-1',
    phone: '0855556666',
    email: 'kanya.p@kku.ac.th',
    faculty: 'มนุษยศาสตร์ฯ',
    gender: 'หญิง',
    dormId: 'dorm-8',
    dormName: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
    roomType: 'ห้องเตียงคู่ (พัดลม)',
    roomNumber: '',
    applicantType: 'Current Resident',
    status: 'Submitted',
    amountPaid: 0,
    paymentDate: '',
    paymentTime: '',
    slipFile: '',
    docFile: 'student_card.pdf',
    paymentMethod: '',
    rejectReason: ''
  },
  {
    id: 'APP-001221',
    name: 'นายณัฐพล เพชรแท้',
    studentId: '653020777-8',
    phone: '0861112222',
    email: 'nattapol.p@kku.ac.th',
    faculty: 'วิทยาศาสตร์',
    gender: 'ชาย',
    dormId: 'dorm-9',
    dormName: 'หอพักนพรัตน์ / หอ 9 หลัง',
    roomType: 'ห้องเตียงเดี่ยว (เครื่องปรับอากาศ)',
    roomNumber: '',
    applicantType: 'General Student',
    status: 'Submitted',
    amountPaid: 0,
    paymentDate: '',
    paymentTime: '',
    slipFile: '',
    docFile: 'student_card.pdf',
    paymentMethod: '',
    rejectReason: ''
  }
])

// Mock Database: Dorm Floor & Rooms availability
const dormRoomsDb = reactive<DormRooms>({
  'dorm-8': {
    floors: [
      {
        floor: 2,
        rooms: [
          { number: '201', capacity: 2, occupied: 0, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' },
          { number: '202', capacity: 2, occupied: 1, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' },
          { number: '203', capacity: 2, occupied: 2, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' },
          { number: '204', capacity: 2, occupied: 0, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' },
          { number: '205', capacity: 2, occupied: 1, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' },
          { number: '206', capacity: 2, occupied: 2, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' }
        ]
      },
      {
        floor: 3,
        rooms: [
          { number: '301', capacity: 2, occupied: 0, type: 'ห้องเตียงคู่ (พัดลม)' },
          { number: '302', capacity: 2, occupied: 2, type: 'ห้องเตียงคู่ (พัดลม)' },
          { number: '303', capacity: 2, occupied: 0, type: 'ห้องเตียงคู่ (พัดลม)' },
          { number: '304', capacity: 2, occupied: 1, type: 'ห้องเตียงคู่ (พัดลม)' }
        ]
      }
    ]
  },
  'dorm-9': {
    floors: [
      {
        floor: 2,
        rooms: [
          { number: '201', capacity: 2, occupied: 1, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' },
          { number: '202', capacity: 2, occupied: 2, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' },
          { number: '203', capacity: 2, occupied: 0, type: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)' }
        ]
      },
      {
        floor: 3,
        rooms: [
          { number: '301', capacity: 1, occupied: 0, type: 'ห้องเตียงเดี่ยว (เครื่องปรับอากาศ)' },
          { number: '302', capacity: 1, occupied: 1, type: 'ห้องเตียงเดี่ยว (เครื่องปรับอากาศ)' }
        ]
      }
    ]
  },
  'dorm-inter': {
    floors: [
      {
        floor: 2,
        rooms: [
          { number: '201', capacity: 1, occupied: 0, type: 'ห้องเตียงเดี่ยวพรีเมียม (เครื่องปรับอากาศ)' },
          { number: '202', capacity: 1, occupied: 1, type: 'ห้องเตียงเดี่ยวพรีเมียม (เครื่องปรับอากาศ)' },
          { number: '203', capacity: 1, occupied: 0, type: 'ห้องเตียงเดี่ยวพรีเมียม (เครื่องปรับอากาศ)' }
        ]
      }
    ]
  }
})

// ==========================================
// BUSINESS ACTIONS & WORKFLOW
// ==========================================

function handleAppSubmit(appData: any) {
  const newId = `APP-${Math.floor(100000 + Math.random() * 900000)}`
  const newApp: Applicant = {
    id: newId,
    name: appData.name,
    studentId: appData.studentId,
    phone: appData.phone,
    email: appData.email,
    faculty: appData.faculty,
    gender: appData.gender,
    dormId: appData.dormId,
    dormName: appData.dormName,
    roomType: appData.roomType,
    roomNumber: appData.roomNumber,
    applicantType: appData.applicantType,
    status: 'Submitted',
    amountPaid: 0,
    paymentDate: '',
    paymentTime: '',
    slipFile: '',
    docFile: appData.docFile,
    paymentMethod: '',
    rejectReason: ''
  }

  // Update room DB mock occupancy temporarily (pre-booked state)
  const dormId = appData.dormId
  const roomNum = appData.roomNumber
  if (dormId && roomNum && dormRoomsDb[dormId]) {
    dormRoomsDb[dormId].floors.forEach(f => {
      const rm = f.rooms.find(r => r.number === roomNum)
      if (rm && rm.occupied < rm.capacity) {
        rm.occupied++
      }
    })
  }

  applicantsList.value.push(newApp)
  activeApplicantApp.value = newApp
  addAuditLog(`ยื่นใบสมัครใหม่: ${newId} (${newApp.name}) หอพัก: ${newApp.dormName} ${newApp.roomNumber ? 'ห้อง ' + newApp.roomNumber : ''}`)
  showToast('ยื่นใบสมัครเรียบร้อยแล้ว กรุณาดำเนินการชำระเงิน')
}

function handleSimulateUniPay() {
  if (!activeApplicantApp.value) return
  const app = applicantsList.value.find(a => a.id === activeApplicantApp.value?.id)
  if (app) {
    app.status = 'Confirmed'
    app.paymentMethod = 'UniPay'
    const camp = campaignList.value.find(c => c.id === app.dormId)
    app.amountPaid = camp ? camp.requiredAmount : 3000
    app.paymentDate = new Date().toISOString().split('T')[0]
    app.paymentTime = new Date().toTimeString().substring(0, 5)

    // Deduct quota count from campaign lists
    if (camp) {
      const rt = camp.roomTypes.find(r => r.name === app.roomType)
      if (rt && rt.active > 0) rt.active--
    }

    activeApplicantApp.value = { ...app }
    addAuditLog(`จำลอง UniPay ชำระเงินสำเร็จ: ${app.id}`)
    showToast('ชำระเงินผ่าน UniPay สำเร็จและยืนยันสิทธิ์แล้ว!')
  }
}

function handleManualSlipSubmit(slip: { amount: number; date: string; time: string; fileName: string }) {
  if (!activeApplicantApp.value) return
  const app = applicantsList.value.find(a => a.id === activeApplicantApp.value?.id)
  if (app) {
    app.status = 'Staff Verifying'
    app.paymentMethod = 'Manual'
    app.amountPaid = slip.amount
    app.paymentDate = slip.date
    app.paymentTime = slip.time
    app.slipFile = slip.fileName
    app.rejectReason = ''

    activeApplicantApp.value = { ...app }
    addAuditLog(`ผู้สมัครยื่นสลิปโอนเงิน: ${app.id} ยอด ${slip.amount} บาท`)
    showToast('ส่งหลักฐานโอนเงินสำเร็จ รอเจ้าหน้าที่ตรวจสอบ')
  }
}

function handleApproveApp(appId: string) {
  const app = applicantsList.value.find(a => a.id === appId)
  if (app) {
    app.status = 'Confirmed'
    app.rejectReason = ''
    const camp = campaignList.value.find(c => c.id === app.dormId)
    if (camp) {
      const rt = camp.roomTypes.find(r => r.name === app.roomType)
      if (rt && rt.active > 0) rt.active--
    }
    addAuditLog(`เจ้าหน้าที่อนุมัติยืนยันสิทธิ์: ${app.id} (${app.name})`)
  }
}

function handleReuploadApp({ appId, reason }: { appId: string; reason: string }) {
  const app = applicantsList.value.find(a => a.id === appId)
  if (app) {
    app.status = 'Need Re-upload'
    app.rejectReason = reason
    addAuditLog(`เจ้าหน้าที่ปฏิเสธสลิป ให้ส่งใหม่: ${app.id} — ${reason}`)
  }
}

function handleRejectApp({ appId, reason }: { appId: string; reason: string }) {
  const app = applicantsList.value.find(a => a.id === appId)
  if (app) {
    app.status = 'Rejected'
    app.rejectReason = reason
    addAuditLog(`เจ้าหน้าที่ปฏิเสธคำขอสิทธิ์: ${app.id} — ${reason}`)
  }
}

function handleCreateCampaign(camp: DormCampaign) {
  campaignList.value.unshift(camp)
  addAuditLog(`สร้างแคมเปญรับสมัครใหม่: ${camp.name}`)
  showToast('สร้างแคมเปญสำเร็จแล้ว')
}

function handleExportData(type: 'residents' | 'payments') {
  showToast('กำลังดาวน์โหลดข้อมูลรายงาน...')
  setTimeout(() => {
    let headers: string[] = []
    let rows: string[][] = []
    let filename = ''

    if (type === 'residents') {
      headers = ['รหัส', 'ชื่อ', 'รหัสนศ.', 'คณะ', 'หอพัก', 'ห้อง', 'สถานะ']
      applicantsList.value
        .filter(a => a.status === 'Confirmed')
        .forEach(a => {
          rows.push([a.id, a.name, a.studentId, a.faculty, a.dormName, a.roomType + (a.roomNumber ? ' ห้อง ' + a.roomNumber : ''), a.status])
        })
      filename = 'confirmed_residents.csv'
    } else {
      headers = ['รหัสชำระ', 'รหัสสมัคร', 'รหัสนศ.', 'ชื่อ', 'ยอดเงิน', 'วันที่ชำระ', 'ช่องทาง']
      applicantsList.value
        .filter(a => a.amountPaid > 0)
        .forEach(a => {
          rows.push([`PAY-${a.id.substring(4)}`, a.id, a.studentId, a.name, String(a.amountPaid), `${a.paymentDate} ${a.paymentTime}`, a.paymentMethod])
        })
      filename = 'payment_export.csv'
    }

    let csvContent = '\ufeff' + headers.join(',') + '\n'
    rows.forEach(r => {
      csvContent += r.map(v => `"${v}"`).join(',') + '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addAuditLog(`ส่งออกข้อมูลรายงาน: ${filename}`)
    showToast('ดาวน์โหลดรายงานสำเร็จ')
  }, 1000)
}

function handleReset(showMessage = true) {
  applicantsList.value = [
    {
      id: 'APP-001042',
      name: 'นายสมชาย รักดี',
      studentId: '643020111-2',
      phone: '0812345678',
      email: 'somchai@kku.ac.th',
      faculty: 'วิศวกรรมศาสตร์',
      gender: 'ชาย',
      dormId: 'dorm-8',
      dormName: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
      roomType: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)',
      roomNumber: '206',
      applicantType: 'General Student',
      status: 'Confirmed',
      amountPaid: 3000,
      paymentDate: '2026-06-28',
      paymentTime: '10:15',
      slipFile: 'unipay_receipt_3000.pdf',
      docFile: 'student_card.pdf',
      paymentMethod: 'UniPay',
      rejectReason: ''
    },
    {
      id: 'APP-001095',
      name: 'นางสาวสมศรี ดีเลิศ',
      studentId: '653020222-3',
      phone: '0898765432',
      email: 'somsri@kku.ac.th',
      faculty: 'แพทยศาสตร์',
      gender: 'หญิง',
      dormId: 'dorm-9',
      dormName: 'หอพักนพรัตน์ / หอ 9 หลัง',
      roomType: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)',
      roomNumber: '201',
      applicantType: 'New First-Year',
      status: 'Staff Verifying',
      amountPaid: 16000,
      paymentDate: '2026-06-30',
      paymentTime: '14:30',
      slipFile: 'slip_receipt_16000.png',
      docFile: 'student_card.pdf',
      paymentMethod: 'Manual',
      rejectReason: ''
    },
    {
      id: 'APP-001103',
      name: 'Mr. John Doe',
      studentId: '663020999-0',
      phone: '0823334444',
      email: 'john.d@kku.ac.th',
      faculty: 'วิทยาลัยนานาชาติ',
      gender: 'ชาย',
      dormId: 'dorm-inter',
      dormName: 'หอพักวรอินเตอร์',
      roomType: 'ห้องเตียงเดี่ยวพรีเมียม (เครื่องปรับอากาศ)',
      roomNumber: '201',
      applicantType: 'International Student',
      status: 'Need Re-upload',
      amountPaid: 19000,
      paymentDate: '2026-06-29',
      paymentTime: '18:40',
      slipFile: 'blurry_receipt.png',
      docFile: 'student_card.pdf',
      paymentMethod: 'Manual',
      rejectReason: 'ภาพสลิปไม่ชัดเจน กรุณาอัปโหลดใหม่'
    },
    {
      id: 'APP-001150',
      name: 'นางสาวกัญญา พรหมดี',
      studentId: '643020444-1',
      phone: '0855556666',
      email: 'kanya.p@kku.ac.th',
      faculty: 'มนุษยศาสตร์ฯ',
      gender: 'หญิง',
      dormId: 'dorm-8',
      dormName: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
      roomType: 'ห้องเตียงคู่ (พัดลม)',
      roomNumber: '',
      applicantType: 'Current Resident',
      status: 'Submitted',
      amountPaid: 0,
      paymentDate: '',
      paymentTime: '',
      slipFile: '',
      docFile: 'student_card.pdf',
      paymentMethod: '',
      rejectReason: ''
    },
    {
      id: 'APP-001221',
      name: 'นายณัฐพล เพชรแท้',
      studentId: '653020777-8',
      phone: '0861112222',
      email: 'nattapol.p@kku.ac.th',
      faculty: 'วิทยาศาสตร์',
      gender: 'ชาย',
      dormId: 'dorm-9',
      dormName: 'หอพักนพรัตน์ / หอ 9 หลัง',
      roomType: 'ห้องเตียงเดี่ยว (เครื่องปรับอากาศ)',
      roomNumber: '',
      applicantType: 'General Student',
      status: 'Submitted',
      amountPaid: 0,
      paymentDate: '',
      paymentTime: '',
      slipFile: '',
      docFile: 'student_card.pdf',
      paymentMethod: '',
      rejectReason: ''
    }
  ]
  
  auditLogList.value = [
    { timestamp: '2026-07-01 08:30:12', detail: 'ระบบเริ่มทำงานตามกำหนดเวลาแคมเปญ' },
    { timestamp: '2026-06-30 14:32:00', detail: 'ใบสมัคร APP-001095 อัปโหลดสลิปเข้าระบบ' },
    { timestamp: '2026-06-29 19:10:45', detail: 'ส่งกลับ APP-001103 อัปโหลดสลิปใหม่' },
    { timestamp: '2026-06-28 10:20:00', detail: 'UniPay APP-001042 ยืนยันสำเร็จ' }
  ]

  campaignList.value[0].roomTypes[0].active = 40
  campaignList.value[0].roomTypes[1].active = 38
  campaignList.value[1].roomTypes[0].active = 24
  campaignList.value[1].roomTypes[1].active = 15
  campaignList.value[2].roomTypes[0].active = 14

  // Reset room occupied database counters
  dormRoomsDb['dorm-8'].floors[0].rooms[0].occupied = 0
  dormRoomsDb['dorm-8'].floors[0].rooms[1].occupied = 1
  dormRoomsDb['dorm-8'].floors[0].rooms[2].occupied = 2
  dormRoomsDb['dorm-8'].floors[0].rooms[3].occupied = 0
  dormRoomsDb['dorm-8'].floors[0].rooms[4].occupied = 1
  dormRoomsDb['dorm-8'].floors[0].rooms[5].occupied = 2

  activeApplicantApp.value = null
  currentRole.value = 'applicant'
  if (showMessage) {
  showToast('รีเซ็ตฐานข้อมูลสำเร็จ')
}

}

function handleShowMyStatus() {
  if (activeApplicantApp.value) {
    const latest = applicantsList.value.find(a => a.id === activeApplicantApp.value?.id)
    if (latest) {
      activeApplicantApp.value = latest
      showToast('นำทางไปยังหน้าติดตามสถานะ')
    }
  } else {
    showToast('ยังไม่มีการยื่นใบสมัครที่แอคทีฟในระบบ')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-sans">
    
    <!-- Top Nav Bar Component -->
    <TopNavbar
      v-if="isLoggedIn"
      :role="currentRole"
      v-model:currentAdminTab="currentAdminTab"
      :user="currentUser"
      @showMyStatus="handleShowMyStatus"
      @backToCampaigns="activeApplicantApp = null"
      @logout="handleLogout"
    />

    <!-- Main Container -->
    <main :class="isLoggedIn ? 'mx-auto max-w-screen-2xl px-5 py-6 sm:px-8 lg:px-10' : 'min-h-screen'">
      
      <!-- LOGIN VIEW -->
      <LoginView
        v-if="!isLoggedIn"
        @login="handleLogin"
        @showToast="showToast"
      />

      <template v-else>
        <!-- APPLICANT VIEW -->
        <ApplicantView
          v-if="currentRole === 'applicant'"
          :campaigns="campaignList"
          :dorm-rooms="dormRoomsDb"
          :active-app="activeApplicantApp"
          @submitApp="handleAppSubmit"
          @simulateUniPay="handleSimulateUniPay"
          @submitManualSlip="handleManualSlipSubmit"
          @printTicket="showToast('จำลองการพิมพ์ใบเสร็จและใบแจ้งเข้าหอพัก')"
          @showToast="showToast"
        />

        <!-- ADMIN VIEW -->
        <AdminView
          v-else
          v-model:currentAdminTab="currentAdminTab"
          :campaigns="campaignList"
          :applicants="applicantsList"
          :dorm-rooms="dormRoomsDb"
          :audit-logs="auditLogList"
          @createCampaign="handleCreateCampaign"
          @approveApp="handleApproveApp"
          @reuploadApp="handleReuploadApp"
          @rejectApp="handleRejectApp"
          @exportData="handleExportData"
          @showToast="showToast"
        />
      </template>

    </main>

    <Toaster position="bottom-right" />
  </div>
</template>

<style>
/* CSS spin animation utility */
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
