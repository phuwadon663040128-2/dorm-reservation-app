import type { Building, Room, RoomConfig } from '@/types'
import { inHours, inMinutes } from './time'

export { dormGroups } from './dorm-groups'

// จำนวนชั้นตามผังจริง: วรอินเตอร์ตึกละ 7 ชั้น — หอ 8 หลังตึกละ 4 ชั้น
// วรอินเตอร์: อาคาร A–C หญิง · อาคาร D ชาย
// เพศอาคาร 1–2 ของหอ 8 หลังอ้างอิงหัวกระดาษผังจริง ("หอพักหญิง")
export const buildings: Building[] = [
  { id: 'bld-a', dormGroupId: 'dorm-wor-inter', code: 'A', name: 'อาคาร A (หญิง)', floors: [1, 2, 3, 4, 5, 6, 7], gender: 'female' },
  { id: 'bld-b', dormGroupId: 'dorm-wor-inter', code: 'B', name: 'อาคาร B (หญิง)', floors: [1, 2, 3, 4, 5, 6, 7], gender: 'female' },
  { id: 'bld-c', dormGroupId: 'dorm-wor-inter', code: 'C', name: 'อาคาร C (หญิง)', floors: [1, 2, 3, 4, 5, 6, 7], gender: 'female' },
  { id: 'bld-d', dormGroupId: 'dorm-wor-inter', code: 'D', name: 'อาคาร D (ชาย)', floors: [1, 2, 3, 4, 5, 6, 7], gender: 'male' },
  { id: 'bld-1', dormGroupId: 'dorm-8-lang', code: '1', name: 'อาคาร 1 (หญิง)', floors: [1, 2, 3, 4], gender: 'female' },
  { id: 'bld-2', dormGroupId: 'dorm-8-lang', code: '2', name: 'อาคาร 2 (หญิง)', floors: [1, 2, 3, 4], gender: 'female' },
  { id: 'bld-3', dormGroupId: 'dorm-8-lang', code: '3', name: 'อาคาร 3 (หญิง)', floors: [1, 2, 3, 4], gender: 'female' },
]

// ---------------------------------------------------------------------------
// ตัวช่วยสร้างห้องทั้งชั้นตามผังจริง (แปลนผัง 8 หลัง / ผังหออินเตอร์)
// ประเภทตามป้ายในผัง: ธรรมดา → normal, แอร์ → aircon, แอร์พิเศษ → special
// ยังไม่กำหนดห้องใดเป็น HL จนกว่าจะได้รับ room master ที่ยืนยันจากเจ้าหน้าที่
// ---------------------------------------------------------------------------

const FACILITIES: Record<RoomConfig, string[]> = {
  normal: ['เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า', 'พัดลม'],
  aircon: ['เครื่องปรับอากาศ', 'เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า'],
  hl: ['เครื่องปรับอากาศ', 'เตียงเดี่ยว 2 เตียง', 'โต๊ะอ่านหนังสือ', 'ตู้เสื้อผ้า'],
  special: ['เครื่องปรับอากาศ', 'พื้นที่กว้างกว่าห้องปกติ', 'เตียงเดี่ยว 2 เตียง', 'ตู้เสื้อผ้า'],
}

function room(number: string, buildingId: string, floor: number, config: RoomConfig, extra: Partial<Room> = {}): Room {
  const isInter = ['bld-a', 'bld-b', 'bld-c', 'bld-d'].includes(buildingId)
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

// ---------------------------------------------------------------------------
// แพตเทิร์นประเภทห้องรายชั้นตามแปลนจริง — ใช้ซ้ำกับอาคารที่โครงสร้างเดียวกัน
// หอ 8 หลัง: ชั้น 1 มี 29 ห้อง (เว้น 21–24 เป็นโถง/ส่วนกลาง) ชั้น 2–4 มี 34 ห้อง
// วรอินเตอร์: ชั้น 1 มี 30 ห้อง ชั้น 2–7 มี 35 ห้อง (ปีกหลัก + ปีกตั้งฉาก + แอร์พิเศษท้ายชั้น)
// ---------------------------------------------------------------------------

/** หอ 8 หลัง ชั้น 1 (แปลน x01) — 29 ห้อง */
const R8_FLOOR1: Record<number, RoomConfig> = {
  1: 'special', 2: 'special', 3: 'normal', 4: 'aircon', 5: 'normal',
  6: 'aircon', 7: 'aircon', 8: 'aircon', 9: 'normal', 10: 'aircon',
  11: 'special', 12: 'special', 13: 'special', 14: 'special',
  15: 'aircon', 16: 'aircon', 17: 'aircon', 18: 'aircon', 19: 'normal', 20: 'normal',
  25: 'aircon', 26: 'aircon', 27: 'aircon', 28: 'normal', 29: 'normal',
  30: 'aircon', 31: 'aircon', 32: 'special', 33: 'special',
}

/** หอ 8 หลัง ชั้น 2 (แปลน x02) — 34 ห้อง */
const R8_FLOOR2: Record<number, RoomConfig> = {
  1: 'special', 2: 'special', 3: 'normal', 4: 'aircon', 5: 'aircon',
  6: 'aircon', 7: 'aircon', 8: 'aircon', 9: 'normal', 10: 'aircon',
  11: 'special', 12: 'special', 13: 'special', 14: 'special',
  15: 'normal', 16: 'aircon', 17: 'normal', 18: 'normal', 19: 'normal', 20: 'normal',
  21: 'normal', 22: 'normal', 23: 'normal',
  24: 'normal', 25: 'special', 26: 'normal', 27: 'normal', 28: 'normal',
  29: 'normal', 30: 'normal', 31: 'normal', 32: 'special', 33: 'normal', 34: 'special',
}

/** หอ 8 หลัง ชั้น 3–4 (แปลน x03/x04) — 34 ห้อง */
const R8_FLOOR34: Record<number, RoomConfig> = {
  1: 'special', 2: 'special', 3: 'normal', 4: 'normal', 5: 'normal',
  6: 'normal', 7: 'normal', 8: 'normal', 9: 'normal', 10: 'normal',
  11: 'special', 12: 'special', 13: 'special', 14: 'special',
  15: 'normal', 16: 'normal', 17: 'normal', 18: 'normal', 19: 'normal', 20: 'normal',
  21: 'normal', 22: 'normal', 23: 'normal',
  24: 'normal', 25: 'special', 26: 'normal', 27: 'normal', 28: 'normal',
  29: 'normal', 30: 'normal', 31: 'normal', 32: 'special', 33: 'normal', 34: 'special',
}

/** หอ 8 หลัง อาคาร 2 ชั้น 1 (แปลน 201 — ประเภทห้องต่างจากอาคาร 1) — 29 ห้อง */
const R8_B2_FLOOR1: Record<number, RoomConfig> = {
  1: 'special', 2: 'special', 3: 'aircon', 4: 'normal', 5: 'aircon',
  6: 'aircon', 7: 'aircon', 8: 'normal', 9: 'aircon', 10: 'aircon',
  11: 'special', 12: 'special', 13: 'special', 14: 'special',
  15: 'aircon', 16: 'aircon', 17: 'aircon', 18: 'aircon', 19: 'aircon', 20: 'normal',
  25: 'aircon', 26: 'normal', 27: 'aircon', 28: 'normal', 29: 'aircon',
  30: 'aircon', 31: 'aircon', 32: 'special', 33: 'special',
}

/** หอ 8 หลัง อาคาร 2 ชั้น 2 (แปลน 202) — ต่างจากอาคาร 1 ที่ห้อง 03 (แอร์), 04/08 (ธรรมดา) */
const R8_B2_FLOOR2: Record<number, RoomConfig> = { ...R8_FLOOR2, 3: 'aircon', 4: 'normal', 8: 'normal' }

/** หอ 8 หลัง อาคาร 2 ชั้น 3–4 (แปลน 203/204) — ต่างจากอาคาร 1 ที่ห้อง 28 (แอร์) */
const R8_B2_FLOOR34: Record<number, RoomConfig> = { ...R8_FLOOR34, 28: 'aircon' }

/** วรอินเตอร์ ชั้น 1 (แปลน A1/B1) — 30 ห้อง */
const INT_FLOOR1: Record<number, RoomConfig> = {
  1: 'aircon', 2: 'aircon', 3: 'aircon', 4: 'aircon',
  5: 'normal', 6: 'normal', 7: 'normal', 8: 'normal',
  9: 'aircon', 10: 'aircon', 11: 'aircon',
  12: 'normal', 13: 'normal', 14: 'normal',
  15: 'aircon', 16: 'aircon', 17: 'aircon', 18: 'aircon', 19: 'aircon', 20: 'aircon', 21: 'aircon',
  22: 'aircon', 23: 'aircon', 24: 'aircon', 25: 'aircon', 26: 'aircon', 27: 'aircon', 28: 'aircon', 29: 'aircon',
  30: 'special',
}

/** วรอินเตอร์ ชั้น 2–7 (แปลน A2–A7/B2–B7) — 35 ห้อง: ปีกหลักธรรมดา + ปีกตั้งฉากแอร์ + แอร์พิเศษปิดท้าย */
const INT_FLOOR_UPPER: Record<number, RoomConfig> = {
  1: 'normal', 2: 'normal', 3: 'normal', 4: 'normal', 5: 'normal',
  6: 'normal', 7: 'normal', 8: 'normal', 9: 'normal', 10: 'normal',
  11: 'normal', 12: 'normal', 13: 'normal', 14: 'normal', 15: 'normal',
  16: 'normal', 17: 'normal', 18: 'normal', 19: 'normal',
  20: 'aircon', 21: 'aircon', 22: 'aircon', 23: 'aircon', 24: 'aircon', 25: 'aircon', 26: 'aircon',
  27: 'aircon', 28: 'aircon', 29: 'aircon', 30: 'aircon', 31: 'aircon', 32: 'aircon', 33: 'aircon', 34: 'aircon',
  35: 'special',
}

/** อาคารวรอินเตอร์ที่ยังไม่มีสถานะ mock เฉพาะห้อง ใช้โครงสร้างชั้นมาตรฐานเดียวกัน */
function standardInterBuildingRooms(code: 'C' | 'D', buildingId: 'bld-c' | 'bld-d'): Room[] {
  return [
    ...floorRooms(`${code}1`, buildingId, 1, INT_FLOOR1),
    ...[2, 3, 4, 5, 6, 7].flatMap(floor =>
      floorRooms(`${code}${floor}`, buildingId, floor, INT_FLOOR_UPPER),
    ),
  ]
}

// เลขห้อง unique ทั้งระบบ — ใช้เป็น Ref.1 โดยตรง
// อาคารโฟกัสสำหรับการนำเสนอ: หอ 8 หลัง อาคาร 1–2 · วรอินเตอร์มีข้อมูล A–D ครบทุกชั้น
export const rooms: Room[] = [
  // ================= วรอินเตอร์ อาคาร A (หญิง) — ครบ 7 ชั้น =================
  ...floorRooms('A1', 'bld-a', 1, INT_FLOOR1, {
    // กลุ่ม G1 อยู่ระหว่าง payment hold 72 ชม.
    2: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(50) },
    // ไม่มีข้อมูลขนาดห้องอย่างเป็นทางการ — UI ต้องแสดง "ยังไม่มีข้อมูล" (ROOM-011)
    4: { occupancyCapability: ['shared'], dimensions: undefined },
    9: { publicStatus: 'reserved' },
    18: { publicStatus: 'reserved' },
    26: { publicStatus: 'unavailable', blockedReason: 'รอซ่อมเครื่องปรับอากาศ (ก.ค. 2569)' },
  }),
  ...floorRooms('A2', 'bld-a', 2, INT_FLOOR_UPPER, {
    1: { publicStatus: 'reserved' }, // กลุ่ม G3 ยืนยันถาวรแล้ว
    14: { publicStatus: 'reserved' },
    30: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(44) },
  }),
  ...floorRooms('A3', 'bld-a', 3, INT_FLOOR_UPPER, {
    6: { publicStatus: 'reserved' },
    22: { publicStatus: 'reserved' },
    35: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(68) },
  }),
  ...floorRooms('A4', 'bld-a', 4, INT_FLOOR_UPPER, {
    11: { publicStatus: 'reserved' },
    27: { publicStatus: 'unavailable', blockedReason: 'รอเปลี่ยนชุดกลอนประตู (ก.ค. 2569)' },
  }),
  ...floorRooms('A5', 'bld-a', 5, INT_FLOOR_UPPER, {
    3: { publicStatus: 'reserved' },
    19: { publicStatus: 'reserved' },
    24: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(30) },
  }),
  ...floorRooms('A6', 'bld-a', 6, INT_FLOOR_UPPER, {
    16: { publicStatus: 'reserved' },
  }),
  ...floorRooms('A7', 'bld-a', 7, INT_FLOOR_UPPER, {
    8: { publicStatus: 'reserved' },
    31: { publicStatus: 'reserved' },
    12: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(12) },
  }),

  // ================= วรอินเตอร์ อาคาร B (หญิง) — ครบ 7 ชั้น =================
  ...floorRooms('B1', 'bld-b', 1, INT_FLOOR1, {
    2: { publicStatus: 'unavailable', blockedReason: 'ปิดปรับปรุงห้องน้ำ (ก.ค. 2569)' },
    9: { publicStatus: 'reserved' },
    22: { publicStatus: 'reserved' },
    15: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(48) },
  }),
  ...floorRooms('B2', 'bld-b', 2, INT_FLOOR_UPPER, {
    5: { publicStatus: 'reserved' },
    28: { publicStatus: 'reserved' },
    17: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(66) },
  }),
  ...floorRooms('B3', 'bld-b', 3, INT_FLOOR_UPPER, {
    21: { publicStatus: 'reserved' },
  }),
  ...floorRooms('B4', 'bld-b', 4, INT_FLOOR_UPPER, {
    7: { publicStatus: 'reserved' },
    33: { publicStatus: 'reserved' },
    13: { publicStatus: 'unavailable', blockedReason: 'เปลี่ยนบานหน้าต่าง (ก.ค. 2569)' },
  }),
  ...floorRooms('B5', 'bld-b', 5, INT_FLOOR_UPPER, {
    10: { publicStatus: 'reserved' },
    25: { publicStatus: 'reserved' },
    31: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(20) },
  }),
  ...floorRooms('B6', 'bld-b', 6, INT_FLOOR_UPPER, {
    19: { publicStatus: 'reserved' },
  }),
  ...floorRooms('B7', 'bld-b', 7, INT_FLOOR_UPPER, {
    4: { publicStatus: 'reserved' },
    29: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(71) },
  }),

  // ================= วรอินเตอร์ อาคาร C (หญิง) / D (ชาย) — ครบ 7 ชั้น =================
  ...standardInterBuildingRooms('C', 'bld-c'),
  ...standardInterBuildingRooms('D', 'bld-d'),

  // ================= หอ 8 หลัง อาคาร 1 (หญิง) — ครบ 4 ชั้น =================
  ...floorRooms('11', 'bld-1', 1, R8_FLOOR1, {
    3: { publicStatus: 'reserved' }, // ผู้พักเดิมต่อสัญญา
    10: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(60) },
    28: { publicStatus: 'unavailable', blockedReason: 'ปิดปรับปรุงพื้นห้อง (ก.ค. 2569)' },
  }),
  ...floorRooms('12', 'bld-1', 2, R8_FLOOR2, {
    7: { publicStatus: 'reserved' },
    21: { publicStatus: 'reserved' },
    33: { publicStatus: 'unavailable', blockedReason: 'ปิดปรับปรุงระบบไฟฟ้า (ก.ค. 2569)' },
  }),
  // หมายเหตุ: ผังพิมพ์ห้อง 1325 เป็น "แอร์" แต่ข้อมูลจริงจากเจ้าหน้าที่คือประเภทแอร์พิเศษ (คงตาม R8_FLOOR34)
  ...floorRooms('13', 'bld-1', 3, R8_FLOOR34, {
    5: { publicStatus: 'reserved' },
    13: { publicStatus: 'reserved' },
  }),
  ...floorRooms('14', 'bld-1', 4, R8_FLOOR34, {
    9: { publicStatus: 'reserved' },
    26: { publicStatus: 'reserved' },
    18: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(36) },
  }),

  // ================= หอ 8 หลัง อาคาร 2 (หญิง) — ครบ 4 ชั้น ตามแปลน 201–204 =================
  ...floorRooms('21', 'bld-2', 1, R8_B2_FLOOR1, {
    1: {
      occupancyCapability: ['shared'],
      publicStatus: 'temporarily_held',
      holdExpiresAt: inMinutes(9), // กลุ่ม G2 รอรูมเมทยืนยันห้องภายใน 15 นาที
    },
    2: { occupancyCapability: ['shared'] },
    15: { publicStatus: 'reserved' },
    27: { publicStatus: 'reserved' },
  }),
  ...floorRooms('22', 'bld-2', 2, R8_B2_FLOOR2, {
    4: { publicStatus: 'reserved' },
    19: { publicStatus: 'reserved' },
    25: { publicStatus: 'temporarily_held', holdExpiresAt: inHours(52) },
  }),
  ...floorRooms('23', 'bld-2', 3, R8_B2_FLOOR34, {
    11: { publicStatus: 'reserved' },
    30: { publicStatus: 'unavailable', blockedReason: 'ปิดปรับปรุงฝ้าเพดาน (ก.ค. 2569)' },
  }),
  ...floorRooms('24', 'bld-2', 4, R8_B2_FLOOR34, {
    2: { publicStatus: 'reserved' },
    22: { publicStatus: 'reserved' },
  }),

  // ---- หอ 8 หลัง อาคาร 3 (ข้อมูลบางส่วน — นอกโฟกัสการนำเสนอ) ----
  room('3105', 'bld-3', 1, 'aircon', { publicStatus: 'reserved' }), // วรัญญาเหมาห้อง ยืนยันถาวรแล้ว
  room('3106', 'bld-3', 1, 'aircon'),
]
