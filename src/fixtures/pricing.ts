import type { OccupancyMode, PaymentAction, RoomConfig } from '@/types'

// Pricing fixture ต่อปีการศึกษา (Provisional — ราคาจริงต้องมาจาก versioned pricing rule ฝั่ง backend)
// ห้อง HL สร้าง 2 รายการเสมอ: ROOM (ค่าห้องมหาวิทยาลัย) + HL (ค่าบริการ Happy Living)
const PRICING: Record<
  RoomConfig,
  { ROOM: Record<OccupancyMode, number>; HL?: Record<OccupancyMode, number> }
> = {
  normal: { ROOM: { shared: 16200, whole_room: 32400 } },
  aircon: { ROOM: { shared: 20000, whole_room: 40000 } },
  hl: {
    ROOM: { shared: 18000, whole_room: 32000 },
    HL: { shared: 8400, whole_room: 15000 },
  },
  special: { ROOM: { shared: 22000, whole_room: 42000 } },
}

export const CURRENT_ACADEMIC_YEAR = '2569'

export interface PriceLine {
  action: PaymentAction
  ref2: string
  title: string
  /** ยอดต่อผู้พัก 1 คน สำหรับ occupancy ที่เลือก */
  amount: number
}

/** รายการชำระเงินต่อผู้พัก 1 คน ตามประเภทห้องและรูปแบบการพัก */
export function priceLinesFor(config: RoomConfig, occupancy: OccupancyMode): PriceLine[] {
  const rule = PRICING[config]
  const suffix = occupancy === 'whole_room' ? ' (เหมาห้อง)' : ''
  const lines: PriceLine[] = [
    {
      action: 'ROOM',
      ref2: `ROOM${CURRENT_ACADEMIC_YEAR}`,
      title: `ค่าหอพักปีการศึกษา ${CURRENT_ACADEMIC_YEAR}${suffix}`,
      amount: rule.ROOM[occupancy],
    },
  ]
  if (rule.HL) {
    lines.push({
      action: 'HL',
      ref2: `HL${CURRENT_ACADEMIC_YEAR}`,
      title: `ค่าบริการ HL ปีการศึกษา ${CURRENT_ACADEMIC_YEAR}${suffix}`,
      amount: rule.HL[occupancy],
    })
  }
  return lines
}
