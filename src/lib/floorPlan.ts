import type { Building, Room } from '@/types'

// จัดเรียงห้องเป็นผังอย่างง่ายตามโครงสร้างผังจริง (แปลนผัง 8 หลัง / ผังหออินเตอร์):
// ตึกเป็นรูปตัว L — ปีกหลักแนวนอน 2 แถวคั่นทางเดินกลาง + ปีกตั้งฉาก 2 คอลัมน์
// เป็นผังเชิงโครงสร้างเพื่อให้กดเลือกง่าย — ทิศทาง/มาตราส่วนจริงดูจากปุ่ม "ดูผังจริง"

/** คอลัมน์ของปีกหลัก: ห้องฝั่งบน/ฝั่งล่างของทางเดิน (null = ช่องว่าง เช่น โถงบันได) */
export interface FloorPlanColumn {
  top: Room | null
  bottom: Room | null
}

export interface FloorPlanLayout {
  /** ปีกหลักแนวนอน เรียงซ้าย → ขวา */
  main: FloorPlanColumn[]
  /** ปีกตั้งฉาก (โซนหลังตึก) เรียงบน → ล่าง — null เมื่อชั้นนี้ไม่มีห้องโซนนี้ */
  wing: { left: Room[]; right: Room[] } | null
}

/** เลขห้องท้าย 2 หลัก เช่น A101 → 1, 1325 → 25 */
function roomNo(room: Room): number {
  return Number(room.number.slice(-2))
}

function pairColumns(rooms: Room[], topPick: (nn: number) => boolean): FloorPlanColumn[] {
  // จับคู่บน/ล่างตามลำดับเลขห้อง ให้คอลัมน์ตรงกันแบบผังจริง
  const top = rooms.filter(r => topPick(roomNo(r))).sort((a, b) => roomNo(a) - roomNo(b))
  const bottom = rooms.filter(r => !topPick(roomNo(r))).sort((a, b) => roomNo(a) - roomNo(b))
  const columns: FloorPlanColumn[] = []
  for (let i = 0; i < Math.max(top.length, bottom.length); i++) {
    columns.push({ top: top[i] ?? null, bottom: bottom[i] ?? null })
  }
  return columns
}

/**
 * หอ 8 หลัง: ปีกหลัก = ห้อง 01–23 (เลขคู่ฝั่งบน เลขคี่ฝั่งล่าง ตามแปลนหอ 1)
 * ปีกตั้งฉาก = ห้อง 24 ขึ้นไป (สองคอลัมน์ เลขมากอยู่ด้านบนตามผัง)
 */
function buildEightLangLayout(rooms: Room[]): FloorPlanLayout {
  const main = rooms.filter(r => roomNo(r) <= 23)
  const wingRooms = rooms.filter(r => roomNo(r) >= 24)

  const left = wingRooms.filter(r => roomNo(r) % 2 === 0).sort((a, b) => roomNo(b) - roomNo(a))
  const right = wingRooms.filter(r => roomNo(r) % 2 === 1).sort((a, b) => roomNo(b) - roomNo(a))
  // ตามแปลนจริง เมื่อฝั่งเลขคู่ยาวกว่า ห้องเลขสูงสุดจะอยู่หัวคอลัมน์ขวาแทน (เช่น 1334 ชั้น 3)
  if (left.length > right.length) {
    const top = left.shift()
    if (top) right.unshift(top)
  }

  const columns = pairColumns(main, nn => nn % 2 === 0)
  // แทรกโถงบันไดกลางปีกตามแปลนจริง — คั่นระหว่างคู่ห้อง x11/x12 กับ x13/x14
  const gapIndex = columns.findIndex(c => (c.top && roomNo(c.top) >= 14) || (c.bottom && roomNo(c.bottom) >= 13))
  if (gapIndex > 0) columns.splice(gapIndex, 0, { top: null, bottom: null })

  return {
    main: columns,
    wing: wingRooms.length ? { left, right } : null,
  }
}

/**
 * วรอินเตอร์: เลขห้องแต่ละชั้นไม่เท่ากันตามผังจริง —
 * ชั้น 1: ปีกหลัก 01–14 (บน 01–04, 09–11), ปีกตั้งฉากเริ่ม 15
 * ชั้น 2: ปีกหลัก 01–19 (บน 01–04, 09–12), ปีกตั้งฉากเริ่ม 20
 * โครงปีกตั้งฉากเหมือนกัน: 7 ห้องแรกคอลัมน์ซ้าย (เลขมากอยู่บน) ที่เหลือคอลัมน์ขวาไล่ลง
 */
const INTER_FLOOR_RULES: Record<number, { wingStart: number; topEnd: number }> = {
  1: { wingStart: 15, topEnd: 11 },
  2: { wingStart: 20, topEnd: 12 },
}

function buildInterLayout(rooms: Room[]): FloorPlanLayout {
  const rule = INTER_FLOOR_RULES[rooms[0]?.floor ?? 1] ?? INTER_FLOOR_RULES[1]!
  const isTop = (nn: number) => (nn >= 1 && nn <= 4) || (nn >= 9 && nn <= rule.topEnd)
  const main = rooms.filter(r => roomNo(r) < rule.wingStart)
  const wingRooms = rooms.filter(r => roomNo(r) >= rule.wingStart)

  const leftEnd = rule.wingStart + 6
  const left = wingRooms.filter(r => roomNo(r) <= leftEnd).sort((a, b) => roomNo(b) - roomNo(a))
  const right = wingRooms.filter(r => roomNo(r) > leftEnd).sort((a, b) => roomNo(a) - roomNo(b))

  const columns = pairColumns(main, isTop)
  // แทรกช่องว่างกลางปีก (โถงบันได) ระหว่างห้อง 04/08 กับ 09/12 ตามผังจริง
  const gapIndex = columns.findIndex(c => (c.top && roomNo(c.top) >= 9) || (c.bottom && roomNo(c.bottom) >= 12))
  if (gapIndex > 0) columns.splice(gapIndex, 0, { top: null, bottom: null })

  return {
    main: columns,
    wing: wingRooms.length ? { left, right } : null,
  }
}

export function buildFloorLayout(dormGroupId: string, rooms: Room[]): FloorPlanLayout {
  return dormGroupId === 'dorm-wor-inter' ? buildInterLayout(rooms) : buildEightLangLayout(rooms)
}

/**
 * URL รูปผังจริงของ หอ/ชั้น ที่เลือก (แปลงจาก PDF ต้นฉบับไว้ที่ public/plans)
 * หอ 8 หลัง: /plans/8lang/<ตึก><ชั้น 2 หลัก>.png เช่น 101 — วรอินเตอร์: /plans/inter/<ตึก><ชั้น>.png เช่น A1
 */
export function realPlanUrl(building: Building, floor: number): string {
  if (building.dormGroupId === 'dorm-wor-inter') {
    return `/plans/inter/${building.code}${floor}.png`
  }
  return `/plans/8lang/${building.code}${String(floor).padStart(2, '0')}.png`
}
