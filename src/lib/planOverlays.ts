// ผังห้องแบบวางทับแบบแปลนจริง (room overlay) — พิกัดห้องอ้างอิง viewBox ของแบบแปลนแต่ละชั้น
// ที่มา: ไฟล์ออกแบบ 101-room-overlay.html (reference/design/) — พื้นหลังเป็นแปลนฉบับลบตัวเลขห้อง
// เพิ่มชั้น/อาคารใหม่ = เพิ่มรายการในตารางนี้ (ไม่ต้องแก้ component)

export interface OverlayRoomRect {
  number: string
  x: number
  y: number
  w: number
  h: number
}

export interface PlanOverlay {
  /** ภาพพื้นหลังแปลน (ฉบับไม่มีเลขห้อง) ใน public/plans/overlay */
  image: string
  /** ขนาดธรรมชาติของภาพแปลน (ใช้วาง <image> ใน svg) */
  viewW: number
  viewH: number
  /** หน้าต่างแสดงผลครอบตัดเฉพาะส่วนที่มีแบบแปลน — ตัด margin ว่างออกให้ผังเต็มการ์ด */
  cropW: number
  cropH: number
  /** คำอธิบายทิศของแบบแปลน (แสดงคู่เข็มทิศ) */
  northNote: string
  rooms: OverlayRoomRect[]
}

/** key: `${dormGroupId}:${buildingCode}:${floor}` */
const overlays: Record<string, PlanOverlay> = {
  'dorm-8-lang:1:1': {
    image: '/plans/overlay/8lang-101.svg',
    viewW: 953,
    viewH: 593,
    cropW: 778,
    cropH: 522,
    northNote: 'ทิศเหนืออ้างอิงตามแบบแปลนต้นฉบับ — โซนปีกหลังตึกอยู่ด้านทิศเหนือ',
    // พิกัดปรับเทียบกับการเรนเดอร์จริงของเบราว์เซอร์ (ไฟล์ดีไซน์เดิมวัดจากเครื่องมือออกแบบซึ่ง crop ต่างกัน)
    rooms: [
      { number: '1102', x: 100, y: 306, w: 43, h: 83 },
      { number: '1104', x: 144, y: 306, w: 43, h: 83 },
      { number: '1106', x: 187, y: 306, w: 43, h: 83 },
      { number: '1108', x: 230, y: 306, w: 43, h: 83 },
      { number: '1110', x: 273, y: 306, w: 43, h: 83 },
      { number: '1112', x: 316, y: 306, w: 43, h: 83 },
      { number: '1114', x: 397, y: 306, w: 43, h: 83 },
      { number: '1116', x: 440, y: 306, w: 43, h: 83 },
      { number: '1118', x: 483, y: 306, w: 43, h: 83 },
      { number: '1120', x: 527, y: 306, w: 43, h: 83 },
      { number: '1101', x: 100, y: 402, w: 43, h: 85 },
      { number: '1103', x: 144, y: 402, w: 43, h: 85 },
      { number: '1105', x: 187, y: 402, w: 43, h: 85 },
      { number: '1107', x: 230, y: 402, w: 43, h: 85 },
      { number: '1109', x: 273, y: 402, w: 43, h: 85 },
      { number: '1111', x: 316, y: 402, w: 43, h: 85 },
      { number: '1113', x: 397, y: 402, w: 43, h: 85 },
      { number: '1115', x: 440, y: 402, w: 43, h: 85 },
      { number: '1117', x: 483, y: 402, w: 43, h: 85 },
      { number: '1119', x: 527, y: 402, w: 43, h: 85 },
      { number: '1132', x: 609, y: 102, w: 65, h: 53 },
      { number: '1133', x: 697, y: 102, w: 66, h: 53 },
      { number: '1130', x: 609, y: 155, w: 65, h: 43 },
      { number: '1131', x: 697, y: 155, w: 66, h: 43 },
      { number: '1128', x: 609, y: 199, w: 65, h: 43 },
      { number: '1129', x: 697, y: 199, w: 66, h: 43 },
      { number: '1126', x: 609, y: 242, w: 65, h: 43 },
      { number: '1127', x: 697, y: 242, w: 66, h: 43 },
      { number: '1125', x: 697, y: 286, w: 66, h: 43 },
    ],
  },
}

export function overlayFor(dormGroupId: string, buildingCode: string, floor: number): PlanOverlay | null {
  return overlays[`${dormGroupId}:${buildingCode}:${floor}`] ?? null
}
