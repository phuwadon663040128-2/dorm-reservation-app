// ข้อมูลผังพื้นที่ 3D — อิงแผนที่ Google Maps จริงที่ผู้ใช้ระบุ:
// หอ 8 หลัง (แดง) = 2 กลุ่ม กลุ่มละ 4 ตึกเรียงสลับฟันปลา · วรอินเตอร์ (ส้ม) อยู่ฝั่งตะวันออกข้ามถนน
// ถนน (ม่วง): ถ.ประตูเขียว ด้านเหนือ+เลียบตะวันออก, ถนนภายในกลาง/ใต้ และซอยเชื่อม
// สัดส่วนตึกรูปตัว L อิงแบบแปลนจริง (ปีกหลัก ~47×18 ม. + ปีกตั้งฉาก ~15×23 ม.)
// ⚠️ การจับคู่ "เลขตึก ↔ ตำแหน่ง" ยังเป็นค่าชั่วคราว (Provisional) แก้ใน config นี้ได้เลย

export interface Building3DConfig {
  /** ตรงกับ Building.code ใน fixtures */
  code: string
  dormGroupId: string
  label: string
  floors: number
  x: number
  z: number
  /** หมุนรอบแกนตั้ง (องศา) */
  rotationY: number
  /** สลับปีกตั้งฉากไปอีกฝั่งของปีกหลัก (ตึกคู่กระจกเงา) */
  mirror?: boolean
}

export interface CampusExtra {
  label: string
  w: number
  d: number
  h: number
  x: number
  z: number
}

/** ประเภทถนนตามที่ผู้ใช้กำหนด: หลัก (ชมพู) / ภายในหอ 8 หลัง (ม่วง) / ภายในวรอินเตอร์ (ฟ้า) / เขตหวงห้ามในหอ (ดำ) */
export type RoadKind = 'main' | 'residence' | 'inter' | 'restricted'

/** ถนน: กล่องแบนวางบนพื้น (แนวนอน = ยาวตามแกน X, แนวตั้ง = ยาวตามแกน Z) */
export interface CampusRoad {
  x: number
  z: number
  /** ความยาว */
  length: number
  /** ทิศ: 'x' = ตะวันออก-ตะวันตก, 'z' = เหนือ-ใต้ */
  axis: 'x' | 'z'
  kind: RoadKind
  /** ป้ายชื่อถนน (วาดบนพื้นข้างถนน) */
  name?: string
}

export interface CampusArea {
  /** ขนาดตึก L ต่อกลุ่มหอ */
  lShape: Record<string, { main: { w: number; d: number }; wing: { w: number; d: number }; floorHeight: number }>
  buildings: Building3DConfig[]
  roads: CampusRoad[]
  extras: CampusExtra[]
  trees: { x: number; z: number; s: number }[]
  /** จุดโฟกัสกล้องต่อหอ */
  focus: Record<string, { x: number; z: number; radius: number }>
  dormNames: Record<string, string>
}

const R8 = 'dorm-8-lang'
const INT = 'dorm-wor-inter'

export const campusArea: CampusArea = {
  lShape: {
    [R8]: { main: { w: 47, d: 18 }, wing: { w: 15.4, d: 23 }, floorHeight: 3.2 },
    [INT]: { main: { w: 44, d: 18 }, wing: { w: 15, d: 25 }, floorHeight: 3.2 },
  },
  // เรียงตามแผนที่: กลุ่มตะวันตก (1–4) · กลุ่มกลาง (5–8) · วรอินเตอร์ (A–D) ฝั่งตะวันออก
  // หอ 8 หลัง (ตาม feedback ผู้ใช้): ตึกบน = ตัว L หมุน -90° (┌ แท่งบน + ปีกห้อยฝั่งตะวันตก)
  // ตึกล่าง = ตัว L หมุน +90° (┘ แท่งล่าง + ปีกชี้ขึ้นฝั่งตะวันออก) ประกบกันเป็นกรอบสี่เหลี่ยม
  // โดย "ไม่ติดกัน" — เว้นช่อง ~4–5 ม. ทุกจุด (ตำแหน่งเยื้อง Δx=20, Δz=24 ให้ปีกสอดข้ามกันพอดี)
  buildings: [
    { code: '1', dormGroupId: R8, label: 'อาคาร 1', floors: 4, x: -92, z: -38, rotationY: 180 },
    { code: '2', dormGroupId: R8, label: 'อาคาร 2', floors: 4, x: -72, z: -14, rotationY: 0 },
    { code: '3', dormGroupId: R8, label: 'อาคาร 3', floors: 4, x: -106, z: 12, rotationY: 180 },
    { code: '4', dormGroupId: R8, label: 'อาคาร 4', floors: 4, x: -86, z: 36, rotationY: 0 },
    { code: '5', dormGroupId: R8, label: 'อาคาร 5', floors: 4, x: 14, z: -38, rotationY: 180 },
    { code: '6', dormGroupId: R8, label: 'อาคาร 6', floors: 4, x: 34, z: -14, rotationY: 0 },
    { code: '7', dormGroupId: R8, label: 'อาคาร 7', floors: 4, x: 12, z: 12, rotationY: 180 },
    { code: '8', dormGroupId: R8, label: 'อาคาร 8', floors: 4, x: 32, z: 36, rotationY: 0 },
    // วรอินเตอร์: รูปแบบเดิม (mirror) แต่ถ่างระยะ Δx=18 ให้ปีกกับแท่งตึกมีช่องว่าง ~3 ม. ไม่ซ้อนทับ
    { code: 'A', dormGroupId: INT, label: 'อาคาร A', floors: 7, x: 110, z: -34, rotationY: 180, mirror: true },
    { code: 'B', dormGroupId: INT, label: 'อาคาร B', floors: 7, x: 92, z: -10, rotationY: 0, mirror: true },
    { code: 'C', dormGroupId: INT, label: 'อาคาร C', floors: 7, x: 110, z: 14, rotationY: 180, mirror: true },
    { code: 'D', dormGroupId: INT, label: 'อาคาร D', floors: 7, x: 92, z: 38, rotationY: 0, mirror: true },
  ],
  roads: [
    // ── ถนนหลัก (สาธารณะ) ──
    { x: 6, z: -54, length: 280, axis: 'x', kind: 'main', name: 'ถ.ประตูเขียว' },
    { x: 138, z: -2, length: 108, axis: 'z', kind: 'main', name: 'ถ.ประตูเขียว' },
    { x: 6, z: 52, length: 280, axis: 'x', kind: 'main' },
    // ── ถนนภายในหอ 8 หลัง ──
    { x: 7, z: 0, length: 114, axis: 'x', kind: 'residence' }, // ถนนกลางฝั่งหอ 8 หลัง
    { x: -16, z: -27, length: 54, axis: 'z', kind: 'residence' }, // ซอยหน้าสำนักงาน
    { x: -48, z: 26, length: 52, axis: 'z', kind: 'residence' }, // ซอยข้างโรงอาหาร
    // ── ถนนภายในวรอินเตอร์ ──
    { x: 101, z: 0, length: 74, axis: 'x', kind: 'inter' }, // ถนนกลางช่วงเข้าวรอินเตอร์
    { x: 64, z: 26, length: 52, axis: 'z', kind: 'inter' }, // ซอยหน้าหอวรอินเตอร์
    // ── ทางภายในเขตหอ (ปกติไม่เปิดให้ผ่าน) — เลนในคอร์ทกลางของแต่ละคู่ตึก ──
    { x: -82, z: -26, length: 30, axis: 'x', kind: 'restricted' },
    { x: -96, z: 24, length: 30, axis: 'x', kind: 'restricted' },
    { x: 25, z: -26, length: 30, axis: 'x', kind: 'restricted' },
    { x: 27, z: 24, length: 24, axis: 'x', kind: 'restricted' },
    { x: 101, z: -22, length: 26, axis: 'x', kind: 'restricted' },
    { x: 101, z: 26, length: 26, axis: 'x', kind: 'restricted' },
  ],
  extras: [
    { label: 'สำนักงานหอพัก', w: 18, d: 10, h: 4.5, x: -32, z: -30 },
    { label: 'โรงอาหาร', w: 22, d: 13, h: 5.5, x: -28, z: 24 },
  ],
  trees: [
    { x: -84, z: -26, s: 1.2 }, { x: -96, z: 26, s: 1.1 }, { x: -60, z: 6, s: 1 },
    { x: 24, z: -26, s: 1.2 }, { x: 22, z: 26, s: 1.1 }, { x: 50, z: -48, s: 1 },
    { x: 98, z: -22, s: 1 }, { x: 98, z: 26, s: 1 },
    { x: -6, z: 16, s: 1.2 }, { x: 8, z: -16, s: 1 }, { x: -120, z: -46, s: 1 }, { x: 122, z: 46, s: 1 },
  ],
  focus: {
    [R8]: { x: -35, z: 0, radius: 172 },
    [INT]: { x: 101, z: 2, radius: 125 },
  },
  dormNames: {
    [R8]: 'วรเรสซิเดนซ์ (หอพัก 8 หลัง)',
    [INT]: 'หอพักวรอินเตอร์',
  },
}

export function campusFor(dormGroupId: string) {
  return campusArea.focus[dormGroupId] ? campusArea : null
}

// พาเลตต์สีของฉากตามธีมเว็บ (โหมดมืด = หน้าต่างเรืองแสงอุ่น)
export interface CampusPalette {
  background: number
  fog: number
  ground: number
  grid: number
  road: number
  roadLine: number
  wall: number
  wallContext: number
  glass: number
  glassEmissive: number
  glassEmissiveIntensity: number
  roof: number
  extra: number
  tree: number
  trunk: number
  accent: number
  hemiSky: number
  hemiGround: number
  sun: number
  sunIntensity: number
  labelText: string
}

export const CAMPUS_PALETTES: Record<'light' | 'dark', CampusPalette> = {
  light: {
    background: 0xf7f2e9,
    fog: 0xf7f2e9,
    ground: 0xece4d4,
    grid: 0xd9cfba,
    road: 0xb9b0a0,
    roadLine: 0xfdfaf3,
    wall: 0xfdfaf3,
    wallContext: 0xd8d0c2,
    glass: 0x8fa3b0,
    glassEmissive: 0x000000,
    glassEmissiveIntensity: 0,
    roof: 0xddd2bd,
    extra: 0xf0e9da,
    tree: 0x7ba05b,
    trunk: 0x8a6a4f,
    accent: 0xec5a0a,
    hemiSky: 0xfff6e8,
    hemiGround: 0xcfc4ac,
    sun: 0xffffff,
    sunIntensity: 1.7,
    labelText: '#6b6252',
  },
  dark: {
    background: 0x0a1322,
    fog: 0x0a1322,
    ground: 0x111c2e,
    grid: 0x22304a,
    road: 0x1a2436,
    roadLine: 0x3d4d68,
    wall: 0x2a3648,
    wallContext: 0x1c2634,
    glass: 0x1c2635,
    glassEmissive: 0xffc27a,
    glassEmissiveIntensity: 0.55,
    roof: 0x1e293b,
    extra: 0x223047,
    tree: 0x2f5d43,
    trunk: 0x4a3b30,
    accent: 0xff7a2e,
    hemiSky: 0x30405e,
    hemiGround: 0x0c1524,
    sun: 0xbcd0ff,
    sunIntensity: 0.7,
    labelText: '#94a6c4',
  },
}
