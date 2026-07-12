import type { AppNotification, AuditEvent, Contract, HandoffBatch, KeyHandover } from '@/types'
import { agoHours } from './time'

export const contracts: Contract[] = [
  // กลุ่ม G3 (ห้อง A201) — สัญญา 2 ฉบับใต้ 1 reservation group: ลงนามแล้ว 1 จาก 2
  {
    id: 'ct-f',
    reservationGroupId: 'resv-g3',
    residentId: 'applicant-f',
    roomNumber: 'A201',
    occupancyMode: 'shared',
    templateVersion: 'v1-2569',
    contractPeriod: 'ปีการศึกษา 2569 (ส.ค. 2569 – พ.ค. 2570)',
    status: 'signed_received',
    signedScanUploaded: true,
    printHistory: [{ at: agoHours(240), by: 'applicant-f' }],
  },
  {
    id: 'ct-g',
    reservationGroupId: 'resv-g3',
    residentId: 'applicant-g',
    roomNumber: 'A201',
    occupancyMode: 'shared',
    templateVersion: 'v1-2569',
    contractPeriod: 'ปีการศึกษา 2569 (ส.ค. 2569 – พ.ค. 2570)',
    status: 'printed',
    signedScanUploaded: false,
    printHistory: [{ at: agoHours(230), by: 'staff-contract' }],
  },
  // วรัญญา เหมาห้อง 3105 — template เดียวกัน เปลี่ยนค่า occupancy/ราคา
  {
    id: 'ct-e',
    reservationGroupId: 'resv-e',
    residentId: 'applicant-e',
    roomNumber: '3105',
    occupancyMode: 'whole_room',
    templateVersion: 'v1-2569',
    contractPeriod: 'ปีการศึกษา 2569 (ส.ค. 2569 – พ.ค. 2570)',
    status: 'signed_received',
    signedScanUploaded: true,
    printHistory: [
      { at: agoHours(290), by: 'applicant-e' },
      { at: agoHours(270), by: 'staff-contract', reason: 'พิมพ์ซ้ำ — ฉบับแรกข้อมูลเบอร์ติดต่อผิด' },
    ],
  },
]

export const keyHandovers: KeyHandover[] = [
  {
    id: 'kh-e',
    reservationGroupId: 'resv-e',
    residentId: 'applicant-e',
    roomNumber: '3105',
    status: 'ready', // สัญญาลงนามครบแล้ว รอวันนัดรับกุญแจ
  },
  {
    id: 'kh-f',
    reservationGroupId: 'resv-g3',
    residentId: 'applicant-f',
    roomNumber: 'A201',
    status: 'not_ready', // กลุ่มยังลงนามไม่ครบ 2 ฉบับ
  },
  {
    id: 'kh-g',
    reservationGroupId: 'resv-g3',
    residentId: 'applicant-g',
    roomNumber: 'A201',
    status: 'not_ready',
  },
]

export const handoffBatches: HandoffBatch[] = [
  {
    id: 'hb-2569-001',
    kind: 'original',
    createdAt: agoHours(100),
    createdBy: 'staff-admin',
    status: 'queued', // รอรอบทางการของมหาวิทยาลัยเปิด
    residentIds: ['applicant-e'],
  },
]

export const auditEvents: AuditEvent[] = [
  {
    id: 'au-1',
    timestamp: agoHours(1),
    actor: 'applicant-d',
    action: 'reservation.reserve',
    relatedIds: ['resv-g2', '2101'],
    detail: 'หัวหน้ากลุ่มจองห้อง 2101 — ล็อกห้องทันที รอรูมเมทยืนยันภายใน 15 นาที',
  },
  {
    id: 'au-2',
    timestamp: agoHours(6),
    actor: 'staff-finance',
    action: 'payment_result.import',
    relatedIds: ['imp-2569-001'],
    detail: 'นำเข้ารายงานผลชำระเงิน SCB (5 รายการ: สำเร็จ 3, ซ้ำ 1, ไม่พบคู่ 1)',
  },
  {
    id: 'au-3',
    timestamp: agoHours(20),
    actor: 'staff-finance',
    action: 'payment_export.create',
    relatedIds: ['batch-2569-001'],
    detail: 'สร้าง SCB export batch (SLIPS, 4 แถว) สำหรับกลุ่ม resv-g1',
  },
  {
    id: 'au-4',
    timestamp: agoHours(30),
    actor: 'applicant-a',
    action: 'roommate.invite',
    relatedIds: ['inv-1'],
    detail: 'ส่งคำเชิญรูมเมทถึง ธนพล มั่นคง (อายุ 48 ชั่วโมง)',
  },
  {
    id: 'au-5',
    timestamp: agoHours(260),
    actor: 'staff-finance',
    action: 'payment.manual_record',
    reason: 'ผู้ปกครองโอนตรงที่เคาน์เตอร์ธนาคาร ตรวจกับ statement แล้ว',
    relatedIds: ['ob-g-room', 'mp-001'],
    detail: 'บันทึกการชำระเงินแบบ manual (SCB-DEMO-2569-0042) ให้ พิมพ์ชนก บุญมา',
  },
  {
    id: 'au-6',
    timestamp: agoHours(270),
    actor: 'staff-contract',
    action: 'contract.reprint',
    reason: 'ฉบับแรกข้อมูลเบอร์ติดต่อผิด',
    relatedIds: ['ct-e'],
    detail: 'พิมพ์สัญญาซ้ำของ วรัญญา พูนสุข (เก็บประวัติฉบับเดิมไว้)',
  },
  {
    id: 'au-7',
    timestamp: agoHours(300),
    actor: 'staff-dorm',
    action: 'reservation.manual_create',
    reason: 'ผู้พักติดต่อจองเหมาห้องที่สำนักงานหอพักโดยตรง',
    relatedIds: ['resv-e', '3105'],
    detail: 'สร้างการจองแบบ manual (เหมาห้อง 3105) — final ไม่ต้องให้ผู้พักยืนยัน',
  },
  {
    id: 'au-8',
    timestamp: agoHours(320),
    actor: 'staff-dorm',
    action: 'room.block',
    reason: 'ปิดปรับปรุงห้องน้ำ (ก.ค. 2569)',
    relatedIds: ['B102'],
    detail: 'บล็อกห้อง B102 ชั่วคราว',
  },
]

export const notifications: AppNotification[] = [
  {
    id: 'nt-1',
    userId: 'applicant-b',
    createdAt: agoHours(6),
    title: 'ยังขาดค่าบริการ HL2569',
    detail: 'ระบบบันทึกยอด ROOM2569 ของคุณแล้ว เหลือ HL2569 อีก 8,400 บาท ภายใน deadline ร่วมของกลุ่ม',
    read: false,
  },
  {
    id: 'nt-2',
    userId: 'applicant-a',
    createdAt: agoHours(8),
    title: 'บันทึกการชำระเงินครบแล้ว',
    detail: 'ROOM2569 และ HL2569 ของคุณชำระครบ — รอรูมเมทชำระให้ครบเพื่อยืนยันห้อง',
    read: true,
  },
]
