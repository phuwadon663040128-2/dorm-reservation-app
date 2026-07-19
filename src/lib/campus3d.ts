// ข้อมูลผังพื้นที่ 3D — ตำแหน่ง/ระยะห่างของตึก ถนน และสิ่งปลูกสร้าง อิงโมเดลใน docs/test.html
// (พิกัด BUILDINGS + site mesh ของไฟล์นั้น คูณสเกล 0.5 ให้เข้ากับหน่วยฉากเดิมของเรา)
// หอ 8 หลัง = 2 กลุ่ม กลุ่มละ 4 ตึกประกบเป็นกรอบสี่เหลี่ยม · วรอินเตอร์อยู่ฝั่งตะวันออกข้ามถนนภายใน
// ทิศ: เหนือจริง = −z เอียงไปทาง −x 7.09° — วัดจาก footprint จริงใน OSM (แกนยาวตึก bearing 97.09°)
//      และภาพดาวเทียม Esri (เครื่องหมายมุมใน docs/test.html กลับด้าน — ใช้ค่าที่วัดจริงแทน)
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

export type CampusExtraKind = 'clinic' | 'office' | 'court' | 'cafeteria' | 'market'

export interface CampusExtra {
  kind: CampusExtraKind
  label: string
  w: number
  d: number
  h: number
  x: number
  z: number
  /** สีตามแบบแผนผัง 3D ของผู้ใช้ (แยกโหมดสว่าง/มืด) */
  colorLight: number
  colorDark: number
  /** พื้นราบ (เช่น สนาม) — ไม่ยกเป็นอาคาร */
  flat?: boolean
}

export interface CampusDecorationPlacement {
  x: number
  z: number
  scale: number
  rotationY: number
}

export interface CampusParkingLot {
  x: number
  z: number
  w: number
  d: number
  spaces: number
  rotationY?: number
}

export interface CampusFenceSegment {
  x: number
  z: number
  length: number
  axis: 'x' | 'z'
}

export interface CampusInterOffice {
  x: number
  z: number
  w: number
  d: number
  floorHeight: number
  rotationY: number
}

/** กำแพงล้อมกลุ่มอาคารหอ 8 หลัง (กลุ่ม 1-4 และ 5-8) พร้อมช่องประตูรั้วที่มีป้อมยามกลางช่อง */
export interface DormClusterWall {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  /** ประตูรั้วอยู่ด้านตะวันออกหรือตะวันตกของกำแพง ตรงกลางช่องมีป้อมยาม */
  gate: { side: 'east' | 'west'; z: number; width: number }
}

/** ผังนี้มีถนนสองประเภท: ถนนมอดินแดง และถนนภายในหอพัก */
export type RoadKind = 'main' | 'internal'

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
  /** สีหลักของอาคารแต่ละกลุ่มหอ */
  dormColors: Record<string, { colorLight: number; colorDark: number }>
  buildings: Building3DConfig[]
  roads: CampusRoad[]
  extras: CampusExtra[]
  trees: { x: number; z: number; s: number }[]
  /** แนวต้นไม้บริบท ใช้โมเดลแบบ instanced เพื่อเพิ่มความหนาแน่นโดยไม่หนักฉาก */
  contextTrees: { x: number; z: number; s: number }[]
  lamps: CampusDecorationPlacement[]
  benches: CampusDecorationPlacement[]
  shrubs: CampusDecorationPlacement[]
  parkingLots: CampusParkingLot[]
  fences: CampusFenceSegment[]
  clusterWalls: DormClusterWall[]
  interOffice: CampusInterOffice
  /** จุดโฟกัสกล้องต่อหอ */
  focus: Record<string, { x: number; z: number; radius: number }>
  dormNames: Record<string, string>
}

const R8 = 'dorm-8-lang'
const INT = 'dorm-wor-inter'

export const campusArea: CampusArea = {
  // ขนาดฐานตึกจากโพลิกอนใน docs/test.html ×0.5 — 8 หลัง: ปีกหลัก 95×20 → 47.5×10, ปีกตั้งฉาก 19×20 → 9.5×10
  // อินเตอร์: ปีกหลัก 70×20 → 35×10, ปีกตั้งฉาก 20×40 → 10×20
  lShape: {
    [R8]: { main: { w: 47.5, d: 10 }, wing: { w: 9.5, d: 10 }, floorHeight: 3.2 },
    [INT]: { main: { w: 35, d: 10 }, wing: { w: 10, d: 20 }, floorHeight: 3.2 },
  },
  dormColors: {
    [R8]: { colorLight: 0xcecdbc, colorDark: 0x56564e },
    [INT]: { colorLight: 0xc7a289, colorDark: 0x54443a },
  },
  // ── ตำแหน่ง = จุดกึ่งกลางปีกหลักของโพลิกอนใน docs/test.html ×0.5 (ทิศเหนือ ≈ -z) ──
  // หอ 8 หลัง: คู่ตึกบน ┌ (rot180) + ล่าง ┘ (rot0) ประกบเป็นกรอบสี่เหลี่ยม เว้นช่องทุกจุด
  // ลำดับตามภาพอ้างอิง: ฝั่งตะวันตก 4→3→2→1 และฝั่งตะวันออก 8→7→6→5 จากเหนือไปใต้
  // (จับคู่กับ ID ชั่วคราวของ test.html: 4↔L 3↔I 2↔F 1↔C · 8↔K 7↔H 6↔E 5↔A · D↔J C↔G B↔D A↔B)
  buildings: [
    { code: '4', dormGroupId: R8, label: 'อาคาร 4', floors: 4, x: -106.25, z: -49.5, rotationY: 180 },
    { code: '3', dormGroupId: R8, label: 'อาคาร 3', floors: 4, x: -96.25, z: -24, rotationY: 0 },
    { code: '2', dormGroupId: R8, label: 'อาคาร 2', floors: 4, x: -106.25, z: 4.5, rotationY: 180 },
    { code: '1', dormGroupId: R8, label: 'อาคาร 1', floors: 4, x: -96.25, z: 30, rotationY: 0 },
    { code: '8', dormGroupId: R8, label: 'อาคาร 8', floors: 4, x: 24.25, z: -48.5, rotationY: 180 },
    { code: '7', dormGroupId: R8, label: 'อาคาร 7', floors: 4, x: 34.25, z: -23, rotationY: 0 },
    { code: '6', dormGroupId: R8, label: 'อาคาร 6', floors: 4, x: 24.25, z: 9.5, rotationY: 180 },
    { code: '5', dormGroupId: R8, label: 'อาคาร 5', floors: 4, x: 34.25, z: 36, rotationY: 0 },
    // วรอินเตอร์ตามพิมพ์เขียว: C ซ้ายบน, D ขวาบน, B ซ้ายล่าง, A ขวาล่าง
    // คู่บน (D,C) ใช้รูปเดิม (mirror) — คู่ล่าง (B,A) "พลิกด้าน" (กระจกแนวตั้ง = ไม่ mirror)
    { code: 'D', dormGroupId: INT, label: 'อาคาร D', floors: 7, x: 113.5, z: -48.5, rotationY: 180, mirror: true },
    { code: 'C', dormGroupId: INT, label: 'อาคาร C', floors: 7, x: 96, z: -18, rotationY: 0, mirror: true },
    { code: 'B', dormGroupId: INT, label: 'อาคาร B', floors: 7, x: 95.5, z: 5.5, rotationY: 180 },
    { code: 'A', dormGroupId: INT, label: 'อาคาร A', floors: 7, x: 113, z: 36, rotationY: 0 },
  ],
  // ถนนตามแถบถนนใน site mesh ของ docs/test.html ×0.5
  roads: [
    // ── ถนนหลักด้านใต้ (test.html: x −286..286, z 110..123) ──
    { x: 0, z: 58.25, length: 286, axis: 'x', kind: 'main', name: 'ถนนมอดินแดง' },
    // ── ถนนภายในหอ 8 หลัง ล้อมโซนสำนักงาน/ตลาด/สนาม/โรงอาหาร/พยาบาล ──
    { x: -63.75, z: 9.75, length: 91.5, axis: 'z', kind: 'internal' }, // ฝั่งตะวันตก (เลียบขอบตึก 2/4)
    { x: -3.75, z: 9, length: 92, axis: 'z', kind: 'internal' }, // ฝั่งตะวันออก (เลียบขอบตึก 6/8)
    { x: -34, z: -37.4, length: 62, axis: 'x', kind: 'internal' }, // ขอบบนของวง
    // คานกลาง คั่นสนามกับโรงอาหาร — ต่อความยาวให้ชนประตูรั้วของทั้งสองกลุ่มอาคาร (กำแพง x=-68 และ -0.5)
    { x: -33.5, z: -2, length: 70, axis: 'x', kind: 'internal' },
    // ── วงถนนวรอินเตอร์รอบตึกทั้งสี่ ──
    { x: 71.75, z: -3.5, length: 117, axis: 'z', kind: 'internal' },
    { x: 140.75, z: -2.5, length: 117, axis: 'z', kind: 'internal' },
    { x: 106.75, z: -61.6, length: 70.5, axis: 'x', kind: 'internal' },
    { x: 107, z: -6.2, length: 69, axis: 'x', kind: 'internal' },
  ],
  // สิ่งปลูกสร้าง: ตำแหน่ง/ขนาดจากมวลอาคารใน docs/test.html ×0.5
  // แถบด้านเหนือ (z=-50.5): หน่วยบริการปฐมภูมิฝั่งตะวันตก (มวล 14×10) · สำนักงานหอ 8 หลังฝั่งตะวันออก (มวล 19.5×10)
  extras: [
    { kind: 'clinic', label: 'หน่วยบริการปฐมภูมิ 123', w: 14, d: 10, h: 4, x: -52.5, z: -50.5, colorLight: 0xb8d8e8, colorDark: 0x38576a },
    { kind: 'office', label: 'สำนักงานหอ 8 หลัง', w: 19.5, d: 10, h: 4.5, x: -23.25, z: -50.5, colorLight: 0xa6a598, colorDark: 0x4a4942 },
    { kind: 'court', label: 'สนาม', w: 45, d: 21, h: 0.3, x: -35.5, z: -22, colorLight: 0xbbb9b1, colorDark: 0x54524e, flat: true },
    { kind: 'cafeteria', label: 'โรงอาหารหอ 8 หลัง', w: 35, d: 15, h: 5.5, x: -35.5, z: 16, colorLight: 0xa6a598, colorDark: 0x4a4942 },
    { kind: 'market', label: 'ตลาดหอพัก 8 หลัง', w: 29.5, d: 7, h: 3.5, x: -35.25, z: 32, colorLight: 0x4caa7e, colorDark: 0x2f6d52 },
  ],
  trees: [
    { x: -50, z: -34, s: 1.1 }, { x: -16, z: -34, s: 1 },
    { x: -52, z: 4, s: 1 }, { x: -16, z: 4, s: 1.1 },
    { x: -137, z: -46, s: 1 }, { x: 50, z: -48, s: 1 },
    { x: 148, z: 50, s: 1 }, { x: 58, z: 50, s: 1.1 },
  ],
  // แนวไม้ใหญ่ตามภาพดาวเทียมบริเวณขอบพื้นที่และแนวถนน
  contextTrees: [
    { x: -146, z: -48, s: 1.08 }, { x: -147, z: -28, s: 0.92 }, { x: -146, z: -8, s: 1.16 },
    { x: -147, z: 14, s: 1.02 }, { x: -146, z: 35, s: 1.2 }, { x: -145, z: 51, s: 0.9 },
    { x: 154, z: -52, s: 1.15 }, { x: 156, z: -34, s: 0.96 }, { x: 155, z: -16, s: 1.18 },
    { x: 157, z: 4, s: 1.05 }, { x: 155, z: 24, s: 1.22 }, { x: 156, z: 43, s: 0.94 },
    { x: -132, z: -64, s: 1.06 }, { x: -112, z: -65, s: 0.88 }, { x: -88, z: -64, s: 1.12 },
    { x: -62, z: -65, s: 0.94 }, { x: -34, z: -64, s: 1.08 }, { x: -5, z: -65, s: 0.9 },
    { x: 24, z: -65, s: 1.14 }, { x: 54, z: -64, s: 0.93 }, { x: 83, z: -65, s: 1.08 },
    { x: 111, z: -65, s: 0.9 }, { x: 139, z: -64, s: 1.16 },
    { x: -137, z: 71, s: 0.9 }, { x: -113, z: 72, s: 1.12 }, { x: -88, z: 71, s: 0.96 },
    { x: -63, z: 73, s: 1.18 }, { x: -38, z: 71, s: 0.92 },
    { x: 82, z: 72, s: 1.04 }, { x: 108, z: 71, s: 0.9 }, { x: 134, z: 73, s: 1.17 },
  ],
  parkingLots: [
    // ลานจอดรถหน้าอาคารสำนักงาน/หออินเตอร์ — ขยับตะวันออกให้พ้นตัวสำนักงานที่หันออกถนนใหญ่
    { x: 116, z: 50, w: 43, d: 5.4, spaces: 8 },
    // ลานจอดรถด้านเหนือ — ขยับพ้นถนนวงอินเตอร์เส้นบน (z=-61.6) ที่ย้ายตาม test.html
    { x: 105.5, z: -70, w: 68, d: 8, spaces: 12 },
  ],
  fences: [
    { x: -151, z: 0, length: 112, axis: 'z' },
    { x: 161, z: 0, length: 112, axis: 'z' },
    { x: 116, z: 68, length: 76, axis: 'x' },
  ],
  // กำแพงล้อมกลุ่มอาคาร 1-4 (ตะวันตก) และ 5-8 (ตะวันออก) — ประตูรั้ว+ป้อมยามหันเข้าโซนกลาง
  // ช่องประตูอยู่แนวถนนแกนกลาง z=-2 ระหว่างอาคาร 2↔3 และ 6↔7 (ตามภาพหน้างานจริง)
  clusterWalls: [
    { minX: -134, maxX: -68, minZ: -58, maxZ: 39, gate: { side: 'east', z: -2, width: 10 } },
    { minX: -0.5, maxX: 62, minZ: -57, maxZ: 45, gate: { side: 'west', z: -2, width: 10 } },
  ],
  // สำนักงาน KKU-WORA อยู่ชิดตึก B (ใต้ปีกตึก B ห่าง ~1.25 หน่วย ตามภาพจริง — ไม่ติดถนนใหญ่)
  // หันหน้า (ป้าย/กันสาด/ร้านซักผ้า Bubble) ออกถนนมอดินแดงทิศใต้ ป้ายอยู่ปลายฝั่งตะวันตกใกล้ทางเข้า
  interOffice: { x: 84.5, z: 34, w: 18, d: 4.5, floorHeight: 3.05, rotationY: 0 },
  // เสาไฟวางบนแนวทางเท้าด้านในของถนนหลักและถนนภายใน โดยหลบอาคาร/พื้นที่ใช้งานเดิม
  lamps: [
    { x: -135, z: 51, scale: 1, rotationY: 0 },
    { x: -105, z: 51, scale: 1, rotationY: 0 },
    { x: -75, z: 51, scale: 1, rotationY: 0 },
    { x: -45, z: 51, scale: 1, rotationY: 0 },
    { x: -15, z: 51, scale: 1, rotationY: 0 },
    { x: 15, z: 51, scale: 1, rotationY: 0 },
    { x: 45, z: 51, scale: 1, rotationY: 0 },
    { x: 85, z: 51, scale: 1, rotationY: 0 },
    { x: 115, z: 51, scale: 1, rotationY: 0 },
    { x: 135, z: 51, scale: 1, rotationY: 0 },
    { x: -48, z: 4, scale: 0.92, rotationY: 0 },
    { x: -33, z: 4, scale: 0.92, rotationY: 0 },
    { x: -18, z: 4, scale: 0.92, rotationY: 0 },
    { x: 80, z: -56, scale: 0.95, rotationY: 180 },
    { x: 105, z: -56, scale: 0.95, rotationY: 180 },
    { x: 130, z: -56, scale: 0.95, rotationY: 180 },
  ],
  benches: [
    { x: -43, z: -8, scale: 0.9, rotationY: 0 },
    { x: -22, z: -8, scale: 0.9, rotationY: 0 },
    { x: -57, z: 14, scale: 0.9, rotationY: 90 },
    { x: -13, z: 14, scale: 0.9, rotationY: 90 },
    { x: -54, z: 31, scale: 0.88, rotationY: 90 },
    { x: -17, z: 31, scale: 0.88, rotationY: 90 },
    { x: -32.5, z: 42, scale: 0.95, rotationY: 0 },
    { x: -32.5, z: 5, scale: 0.9, rotationY: 0 },
  ],
  shrubs: [
    { x: -42, z: -52, scale: 0.9, rotationY: 12 },
    { x: -44, z: -58, scale: 0.72, rotationY: -18 },
    { x: -36, z: -52, scale: 0.84, rotationY: 28 },
    { x: -38, z: -58, scale: 0.7, rotationY: -8 },
    { x: -10, z: -52, scale: 0.82, rotationY: 20 },
    { x: -11, z: -58, scale: 0.74, rotationY: -24 },
    { x: -50, z: -8, scale: 0.75, rotationY: 8 },
    { x: -34, z: -8, scale: 0.88, rotationY: -15 },
    { x: -15, z: -8, scale: 0.72, rotationY: 25 },
    { x: -48, z: 5, scale: 0.78, rotationY: -12 },
    { x: -20, z: 5, scale: 0.82, rotationY: 18 },
    { x: -48, z: 27, scale: 0.72, rotationY: 16 },
    { x: -48, z: 36, scale: 0.86, rotationY: -20 },
    { x: -17, z: 27, scale: 0.76, rotationY: -14 },
    { x: -17, z: 36, scale: 0.9, rotationY: 22 },
    { x: -48, z: 42, scale: 0.72, rotationY: -10 },
    { x: -40, z: 42, scale: 0.84, rotationY: 26 },
    { x: -25, z: 42, scale: 0.78, rotationY: -22 },
    { x: -17, z: 42, scale: 0.88, rotationY: 14 },
    { x: -135, z: -34, scale: 0.82, rotationY: 18 },
    { x: -135, z: 0, scale: 0.9, rotationY: -16 },
    { x: -135, z: 34, scale: 0.78, rotationY: 24 },
  ],
  focus: {
    [R8]: { x: -36, z: -7, radius: 195 },
    [INT]: { x: 104.5, z: -6, radius: 148 },
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
  roadMain: number
  roadShoulder: number
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
  facadeTrim: number
  facadeBase: number
  glassFrame: number
  metal: number
  pavement: number
  curb: number
  lampGlow: number
  shrub: number
  labelText: string
}

export const CAMPUS_PALETTES: Record<'light' | 'dark', CampusPalette> = {
  light: {
    background: 0xf7f2e9,
    fog: 0xf7f2e9,
    ground: 0xece4d4,
    grid: 0xd9cfba,
    road: 0x9a968c,
    roadMain: 0x77746d,
    roadShoulder: 0xc9c1b4,
    roadLine: 0xf7f3e9,
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
    facadeTrim: 0xe7e0d4,
    facadeBase: 0x8c8579,
    glassFrame: 0x465158,
    metal: 0x747a7b,
    pavement: 0xb8b1a5,
    curb: 0xe4ddd1,
    lampGlow: 0xffd59a,
    shrub: 0x5f7f4c,
    labelText: '#6b6252',
  },
  dark: {
    background: 0x0d1829,
    fog: 0x111d30,
    ground: 0x17243a,
    grid: 0x334664,
    road: 0x303a49,
    roadMain: 0x1f2937,
    roadShoulder: 0x182230,
    roadLine: 0x94a3b8,
    wall: 0x35445a,
    wallContext: 0x263348,
    glass: 0x1c2635,
    glassEmissive: 0xffc27a,
    glassEmissiveIntensity: 0.55,
    roof: 0x2b384d,
    extra: 0x31425b,
    tree: 0x2f5d43,
    trunk: 0x4a3b30,
    accent: 0xff7a2e,
    hemiSky: 0x64799e,
    hemiGround: 0x1a2940,
    sun: 0xcad9ff,
    sunIntensity: 1.02,
    facadeTrim: 0x68778e,
    facadeBase: 0x202d42,
    glassFrame: 0x0b121e,
    metal: 0x657084,
    pavement: 0x34445b,
    curb: 0x6b788e,
    lampGlow: 0xffc46f,
    shrub: 0x315c43,
    labelText: '#c1cee2',
  },
}
