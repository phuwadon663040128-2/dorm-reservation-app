import type { Building, DormGroup, Room, RoomConfig } from '@/types'
import { inHours, inMinutes } from './time'
import woraResidencePhoto from '@/assets/kku_dorm_images/wora_residence_8_buildings/01_wora_residence_entrance_road_assetkku.jpg'
import woraInterPhoto from '@/assets/kku_dorm_images/wora_international/wora.png'

export const dormGroups: DormGroup[] = [
  {
    id: 'dorm-8-lang',
    name: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
    shortName: 'วรเรสซิเดนซ์',
    description:
      'หอพักในเครือข่ายวรเรสซิเดนซ์ 8 อาคาร เลขห้องเป็นตัวเลขที่ระบุอาคาร/ชั้น/ห้อง มีห้องธรรมดา (พัดลม) ห้องแอร์ (HL) และห้องแอร์พิเศษ',
    buildingCount: 8,
    contractLabel: 'สัญญารายปี',
    priceFromPerTerm: 8100,
    photo: woraResidencePhoto,
  },
  {
    id: 'dorm-wor-inter',
    name: 'หอพักวรอินเตอร์',
    shortName: 'วรเรสอินเตอร์',
    description:
      'หอพักวรอินเตอร์ 4 อาคาร (A–D) เลขห้องขึ้นต้นด้วยตัวอักษรอาคารตามด้วยชั้น/ห้อง เช่น A101 มีห้องธรรมดา ห้องแอร์ (HL) และห้องแอร์พิเศษ',
    buildingCount: 4,
    contractLabel: 'สัญญารายปี',
    priceFromPerTerm: 9000,
    photo: woraInterPhoto,
  },
]

// จำนวนชั้นตามผังจริง: วรอินเตอร์ตึกละ 7 ชั้น — หอ 8 หลังตึกละ 4 ชั้น
// เพศอาคาร 1–2 อ้างอิงหัวกระดาษผังจริง ("หอพักหญิง")
export const buildings: Building[] = [
  { id: 'bld-a', dormGroupId: 'dorm-wor-inter', code: 'A', name: 'อาคาร A', floors: [1, 2, 3, 4, 5, 6, 7], gender: 'female' },
  { id: 'bld-b', dormGroupId: 'dorm-wor-inter', code: 'B', name: 'อาคาร B', floors: [1, 2, 3, 4, 5, 6, 7], gender: 'male' },
  { id: 'bld-1', dormGroupId: 'dorm-8-lang', code: '1', name: 'อาคาร 1 (หญิง)', floors: [1, 2, 3, 4], gender: 'female' },
  { id: 'bld-2', dormGroupId: 'dorm-8-lang', code: '2', name: 'อาคาร 2 (หญิง)', floors: [1, 2, 3, 4], gender: 'female' },
  { id: 'bld-3', dormGroupId: 'dorm-8-lang', code: '3', name: 'อาคาร 3 (หญิง)', floors: [1, 2, 3, 4], gender: 'female' },
]

// ---------------------------------------------------------------------------
// ตัวช่วยสร้างห้องทั้งชั้นตามผังจริง (แปลนผัง 8 หลัง / ผังหออินเตอร์)
// ประเภทตามป้ายในผัง: ธรรมดา → normal, แอร์ → hl, แอร์พิเศษ → special
// ---------------------------------------------------------------------------

const FACILITIES: Record<RoomConfig, string[]> = {
  normal: ['เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า', 'พัดลม'],
  aircon: ['เครื่องปรับอากาศ', 'เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า'],
  hl: ['เครื่องปรับอากาศ (HL)', 'เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า'],
  special: ['เครื่องปรับอากาศ (HL)', 'พื้นที่กว้างกว่าห้องปกติ', 'เตียงเดี่ยว 2 เตียง', 'ตู้เสื้อผ้า'],
}

function room(number: string, buildingId: string, floor: number, config: RoomConfig, extra: Partial<Room> = {}): Room {
  const isInter = buildingId === 'bld-a' || buildingId === 'bld-b'
  const dimensions = config === 'special'
    ? (isInter ? '4.2 × 6 ม.' : '4 × 5.5 ม.')
    : (isInter ? '3.5 × 6 ม.' : '3 × 5.5 ม.')
  return {
    number,
    buildingId,
    floor,
    config,
    occupancyCapability: ['shared', 'whole_room'],
    dimensions,
    facilities: FACILITIES[config],
    publicStatus: 'available',
    ...extra,
  }
}

/** สร้างห้องทั้งชั้นจาก mapping เลขห้องท้าย 2 หลัก → ประเภทห้องตามผังจริง */
function floorRooms(
  prefix: string,
  buildingId: string,
  floor: number,
  configs: Record<number, RoomConfig>,
  overrides: Record<number, Partial<Room>> = {},
): Room[] {
  return Object.entries(configs).map(([no, config]) => {
    const nn = Number(no)
    return room(`${prefix}${String(nn).padStart(2, '0')}`, buildingId, floor, config, overrides[nn] ?? {})
  })
}

// เลขห้อง unique ทั้งระบบ — ใช้เป็น Ref.1 โดยตรง
export const rooms: Room[] = [
  // ---- วรอินเตอร์ อาคาร A ชั้น 1 — 30 ห้องตามผังจริง (A1) ----
  ...floorRooms(
    'A1',
    'bld-a',
    1,
    {
      1: 'hl', 2: 'hl', 3: 'hl', 4: 'hl',
      5: 'normal', 6: 'normal', 7: 'normal', 8: 'normal',
      9: 'hl', 10: 'hl', 11: 'hl',
      12: 'normal', 13: 'normal', 14: 'normal',
      15: 'hl', 16: 'hl', 17: 'hl', 18: 'hl', 19: 'hl', 20: 'hl', 21: 'hl',
      22: 'hl', 23: 'hl', 24: 'hl', 25: 'hl', 26: 'hl', 27: 'hl', 28: 'hl', 29: 'hl',
      30: 'special',
    },
    {
      // กลุ่ม G1 อยู่ระหว่าง payment hold 72 ชม.
      2: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(50) },
      // ไม่มีข้อมูลขนาดห้องอย่างเป็นทางการ — UI ต้องแสดง "ยังไม่มีข้อมูล" (ROOM-011)
      4: { occupancyCapability: ['shared'], dimensions: undefined },
      9: { publicStatus: 'reserved' },
      18: { publicStatus: 'reserved' },
      26: { publicStatus: 'unavailable', blockedReason: 'รอซ่อมเครื่องปรับอากาศ (ก.ค. 2569)' },
    },
  ),
  // ---- วรอินเตอร์ อาคาร A ชั้น 2 — 35 ห้องตามผังจริง (A2) ----
  // ปีกหลัก A201–A219 ธรรมดา · ปีกตั้งฉาก A220–A234 แอร์ (HL) · A235 แอร์พิเศษ
  ...floorRooms(
    'A2',
    'bld-a',
    2,
    {
      1: 'normal', 2: 'normal', 3: 'normal', 4: 'normal', 5: 'normal',
      6: 'normal', 7: 'normal', 8: 'normal', 9: 'normal', 10: 'normal',
      11: 'normal', 12: 'normal', 13: 'normal', 14: 'normal', 15: 'normal',
      16: 'normal', 17: 'normal', 18: 'normal', 19: 'normal',
      20: 'hl', 21: 'hl', 22: 'hl', 23: 'hl', 24: 'hl', 25: 'hl', 26: 'hl',
      27: 'hl', 28: 'hl', 29: 'hl', 30: 'hl', 31: 'hl', 32: 'hl', 33: 'hl', 34: 'hl',
      35: 'special',
    },
    {
      1: { publicStatus: 'reserved' }, // กลุ่ม G3 ยืนยันถาวรแล้ว
      14: { publicStatus: 'reserved' },
      30: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(44) },
    },
  ),
  // ---- วรอินเตอร์ อาคาร B (ข้อมูลบางส่วน) ----
  room('B101', 'bld-b', 1, 'normal', { occupancyCapability: ['shared'] }),
  room('B102', 'bld-b', 1, 'normal', {
    occupancyCapability: ['shared'],
    publicStatus: 'unavailable',
    blockedReason: 'ปิดปรับปรุงห้องน้ำ (ก.ค. 2569)',
  }),

  // ---- หอ 8 หลัง อาคาร 1 ชั้น 1 — 29 ห้องตามผังจริง (แปลน 101) ----
  ...floorRooms(
    '11',
    'bld-1',
    1,
    {
      1: 'special', 2: 'special', 3: 'normal', 4: 'hl', 5: 'normal',
      6: 'hl', 7: 'hl', 8: 'hl', 9: 'normal', 10: 'hl',
      11: 'special', 12: 'special', 13: 'special', 14: 'special',
      15: 'hl', 16: 'hl', 17: 'hl', 18: 'hl', 19: 'normal', 20: 'normal',
      25: 'hl', 26: 'hl', 27: 'hl', 28: 'normal', 29: 'normal',
      30: 'hl', 31: 'hl', 32: 'special', 33: 'special',
    },
    {
      3: { publicStatus: 'reserved' }, // ผู้พักเดิมต่อสัญญา
      10: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(60) },
      28: { publicStatus: 'unavailable', blockedReason: 'ปิดปรับปรุงพื้นห้อง (ก.ค. 2569)' },
    },
  ),
  // ---- หอ 8 หลัง อาคาร 1 ชั้น 2 — 34 ห้องตามผังจริง (แปลน 102) ----
  ...floorRooms(
    '12',
    'bld-1',
    2,
    {
      1: 'special', 2: 'special', 3: 'normal', 4: 'hl', 5: 'hl',
      6: 'hl', 7: 'hl', 8: 'hl', 9: 'normal', 10: 'hl',
      11: 'special', 12: 'special', 13: 'special', 14: 'special',
      15: 'normal', 16: 'hl', 17: 'normal', 18: 'normal', 19: 'normal', 20: 'normal',
      21: 'normal', 22: 'normal', 23: 'normal',
      24: 'normal', 25: 'special', 26: 'normal', 27: 'normal', 28: 'normal',
      29: 'normal', 30: 'normal', 31: 'normal', 32: 'special', 33: 'normal', 34: 'special',
    },
    {
      7: { publicStatus: 'reserved' },
      21: { publicStatus: 'reserved' },
      33: { publicStatus: 'unavailable', blockedReason: 'ปิดปรับปรุงระบบไฟฟ้า (ก.ค. 2569)' },
    },
  ),
  // ---- หอ 8 หลัง อาคาร 1 ชั้น 3 — 34 ห้องตามผังจริง (แปลน 103) ----
  // หมายเหตุ: ผังพิมพ์ห้อง 1325 เป็น "แอร์" แต่ข้อมูลจริงจากเจ้าหน้าที่คือประเภทแอร์พิเศษ
  ...floorRooms(
    '13',
    'bld-1',
    3,
    {
      1: 'special', 2: 'special', 3: 'normal', 4: 'normal', 5: 'normal',
      6: 'normal', 7: 'normal', 8: 'normal', 9: 'normal', 10: 'normal',
      11: 'special', 12: 'special', 13: 'special', 14: 'special',
      15: 'normal', 16: 'normal', 17: 'normal', 18: 'normal', 19: 'normal', 20: 'normal',
      21: 'normal', 22: 'normal', 23: 'normal',
      24: 'normal', 25: 'special', 26: 'normal', 27: 'normal', 28: 'normal',
      29: 'normal', 30: 'normal', 31: 'normal', 32: 'special', 33: 'normal', 34: 'special',
    },
    {
      5: { publicStatus: 'reserved' },
      13: { publicStatus: 'reserved' },
    },
  ),

  // ---- หอ 8 หลัง อาคาร 2 (ข้อมูลบางส่วน — 2101/2102 เป็นแอร์พิเศษตามแปลน 201) ----
  room('2101', 'bld-2', 1, 'special', {
    occupancyCapability: ['shared'],
    publicStatus: 'temporarily_held',
    holdExpiresAt: inMinutes(9), // กลุ่ม G2 รอรูมเมทยืนยันห้องภายใน 15 นาที
  }),
  room('2102', 'bld-2', 1, 'special', { occupancyCapability: ['shared'] }),
  // ---- หอ 8 หลัง อาคาร 3 (ข้อมูลบางส่วน) ----
  room('3105', 'bld-3', 1, 'hl', { publicStatus: 'reserved' }), // วรัญญาเหมาห้อง ยืนยันถาวรแล้ว
  room('3106', 'bld-3', 1, 'hl'),
]
