import type { Building, DormGroup, Room } from '@/types'
import { inHours, inMinutes } from './time'

export const dormGroups: DormGroup[] = [
  {
    id: 'dorm-8-lang',
    name: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
    description:
      'หอพักในเครือข่ายวรเรสซิเดนซ์ 8 อาคาร เลขห้องเป็นตัวเลขที่ระบุอาคาร/ชั้น/ห้อง มีทั้งห้องพัดลมและห้องแอร์ (HL)',
  },
  {
    id: 'dorm-wor-inter',
    name: 'หอพักวรอินเตอร์',
    description:
      'หอพักวรอินเตอร์ เลขห้องขึ้นต้นด้วยตัวอักษรอาคารตามด้วยชั้น/ห้อง เช่น A101 มีห้องปกติ ห้องแอร์ (HL) และห้องมุมพิเศษ',
  },
]

export const buildings: Building[] = [
  { id: 'bld-a', dormGroupId: 'dorm-wor-inter', code: 'A', name: 'อาคาร A', floors: [1, 2] },
  { id: 'bld-b', dormGroupId: 'dorm-wor-inter', code: 'B', name: 'อาคาร B', floors: [1] },
  { id: 'bld-1', dormGroupId: 'dorm-8-lang', code: '1', name: 'อาคาร 1 (ชาย)', floors: [1, 2] },
  { id: 'bld-2', dormGroupId: 'dorm-8-lang', code: '2', name: 'อาคาร 2 (หญิง)', floors: [1] },
  { id: 'bld-3', dormGroupId: 'dorm-8-lang', code: '3', name: 'อาคาร 3 (หญิง)', floors: [1] },
]

// เลขห้อง unique ทั้งระบบ — ใช้เป็น Ref.1 โดยตรง
export const rooms: Room[] = [
  // ---- วรอินเตอร์ อาคาร A ----
  {
    number: 'A101',
    buildingId: 'bld-a',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3.5 × 6 ม.',
    facilities: ['เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า', 'พัดลม'],
    publicStatus: 'available',
  },
  {
    number: 'A102',
    buildingId: 'bld-a',
    floor: 1,
    config: 'hl',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3.5 × 6 ม.',
    facilities: ['เครื่องปรับอากาศ (HL)', 'เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า'],
    publicStatus: 'temporarily_held',
    holdExpiresAt: inHours(50), // กลุ่ม G1 อยู่ระหว่าง payment hold 72 ชม.
  },
  {
    number: 'A103',
    buildingId: 'bld-a',
    floor: 1,
    config: 'aircon',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3.5 × 6 ม.',
    facilities: ['เครื่องปรับอากาศ', 'เตียงเดี่ยว 2 เตียง', 'ตู้เย็นเล็ก'],
    publicStatus: 'available',
  },
  {
    number: 'A104',
    buildingId: 'bld-a',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared'],
    // ไม่มีข้อมูลขนาดห้องอย่างเป็นทางการ — UI ต้องแสดง "ยังไม่มีข้อมูล" (ROOM-011)
    facilities: ['เตียงเดี่ยว 2 เตียง', 'พัดลม'],
    publicStatus: 'available',
  },
  {
    number: 'A105',
    buildingId: 'bld-a',
    floor: 1,
    config: 'special',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '4.2 × 6 ม.',
    facilities: ['ห้องมุม', 'เครื่องปรับอากาศ (HL)', 'หน้าต่าง 2 ด้าน'],
    publicStatus: 'available',
  },
  {
    number: 'A201',
    buildingId: 'bld-a',
    floor: 2,
    config: 'aircon',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3.5 × 6 ม.',
    facilities: ['เครื่องปรับอากาศ', 'เตียงเดี่ยว 2 เตียง'],
    publicStatus: 'reserved', // กลุ่ม G3 ยืนยันถาวรแล้ว
  },
  {
    number: 'A202',
    buildingId: 'bld-a',
    floor: 2,
    config: 'hl',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3.5 × 6 ม.',
    facilities: ['เครื่องปรับอากาศ (HL)', 'เตียงเดี่ยว 2 เตียง'],
    publicStatus: 'available',
  },
  // ---- วรอินเตอร์ อาคาร B ----
  {
    number: 'B101',
    buildingId: 'bld-b',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared'],
    facilities: ['เตียงเดี่ยว 2 เตียง', 'พัดลม'],
    publicStatus: 'available',
  },
  {
    number: 'B102',
    buildingId: 'bld-b',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared'],
    facilities: ['เตียงเดี่ยว 2 เตียง', 'พัดลม'],
    publicStatus: 'unavailable',
    blockedReason: 'ปิดปรับปรุงห้องน้ำ (ก.ค. 2569)',
  },
  // ---- หอ 8 หลัง อาคาร 1 ----
  {
    number: '1101',
    buildingId: 'bld-1',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3 × 5.5 ม.',
    facilities: ['เตียงเดี่ยว 2 เตียง', 'พัดลม', 'ระเบียง'],
    publicStatus: 'available',
  },
  {
    number: '1102',
    buildingId: 'bld-1',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared'],
    dimensions: '3 × 5.5 ม.',
    facilities: ['เตียงเดี่ยว 2 เตียง', 'พัดลม'],
    publicStatus: 'available',
  },
  {
    number: '1201',
    buildingId: 'bld-1',
    floor: 2,
    config: 'hl',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3 × 5.5 ม.',
    facilities: ['เครื่องปรับอากาศ (HL)', 'เตียงเดี่ยว 2 เตียง'],
    publicStatus: 'available',
  },
  // ---- หอ 8 หลัง อาคาร 2 ----
  {
    number: '2101',
    buildingId: 'bld-2',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared'],
    dimensions: '3 × 5.5 ม.',
    facilities: ['เตียงเดี่ยว 2 เตียง', 'พัดลม'],
    publicStatus: 'temporarily_held',
    holdExpiresAt: inMinutes(9), // กลุ่ม G2 รอรูมเมทยืนยันห้องภายใน 15 นาที
  },
  {
    number: '2102',
    buildingId: 'bld-2',
    floor: 1,
    config: 'normal',
    occupancyCapability: ['shared'],
    dimensions: '3 × 5.5 ม.',
    facilities: ['เตียงเดี่ยว 2 เตียง', 'พัดลม'],
    publicStatus: 'available',
  },
  // ---- หอ 8 หลัง อาคาร 3 ----
  {
    number: '3105',
    buildingId: 'bld-3',
    floor: 1,
    config: 'hl',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3 × 5.5 ม.',
    facilities: ['เครื่องปรับอากาศ (HL)', 'เตียงเดี่ยว 2 เตียง'],
    publicStatus: 'reserved', // วรัญญาเหมาห้อง ยืนยันถาวรแล้ว
  },
  {
    number: '3106',
    buildingId: 'bld-3',
    floor: 1,
    config: 'hl',
    occupancyCapability: ['shared', 'whole_room'],
    dimensions: '3 × 5.5 ม.',
    facilities: ['เครื่องปรับอากาศ (HL)', 'เตียงเดี่ยว 2 เตียง'],
    publicStatus: 'available',
  },
]
