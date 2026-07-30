import type { OccupancyMode, PaymentAction, RoomConfig } from '@/types'
import { feeAcademicYear, feeGroups, type FeeRoomRow } from './fees'

// รอบจองของ mock-up กับปีของประกาศราคาเป็นคนละข้อมูลกัน
// ก่อนใช้งานจริง ต้องแทนด้วย versioned pricing rule ของรอบ 2569 จาก backend/เจ้าหน้าที่
export const CURRENT_ACADEMIC_YEAR = '2569'
export const PRICING_REFERENCE_ACADEMIC_YEAR = feeAcademicYear

const FEE_GROUP_ID_BY_DORM_GROUP_ID: Record<string, string> = {
  'dorm-8-lang': 'wora_residence_8',
  'dorm-wor-inter': 'wora_inter_4',
}

const OFFICIAL_ROOM_TYPE_BY_CONFIG: Record<Exclude<RoomConfig, 'hl'>, string> = {
  normal: 'ห้องพัดลม',
  aircon: 'ห้องปรับอากาศ',
  special: 'ห้องปรับอากาศภาคพิเศษ',
}

export interface PriceLine {
  action: PaymentAction
  ref2: string
  title: string
  /** ยอดของผู้ชำระตามรูปแบบพักที่เลือก: ต่อคนสำหรับพักคู่ หรือต่อห้องสำหรับเหมาห้อง */
  amount: number
}

function feeRowsForDorm(dormGroupId: string) {
  const feeGroupId = FEE_GROUP_ID_BY_DORM_GROUP_ID[dormGroupId]
  const group = feeGroups.find(item => item.id === feeGroupId)
  if (!group) throw new Error(`Missing fee group for dorm ${dormGroupId}`)
  return group.rooms
}

function findFeeRow(rows: FeeRoomRow[], config: Exclude<RoomConfig, 'hl'>) {
  const roomType = OFFICIAL_ROOM_TYPE_BY_CONFIG[config]
  const row = rows.find(item => item.roomType === roomType)
  if (!row) throw new Error(`Missing fee row for room config ${config}`)
  return row
}

function annualAmount(row: FeeRoomRow, occupancy: OccupancyMode) {
  const amount = occupancy === 'shared' ? row.twoPersonAnnual : row.singleAnnual
  if (typeof amount !== 'number') {
    throw new Error(`Missing annual fee for ${row.roomType} (${occupancy})`)
  }
  return amount
}

/**
 * รายการชำระต่อผู้ชำระ 1 คน โดยอ้างอิงอัตราประกาศล่าสุดที่ยืนยันได้ (ปี 2568)
 * - ห้องทั่วไป/แอร์/แอร์พิเศษเป็น ROOM รายการเดียว
 * - HL คงกติกาผลิตภัณฑ์ที่ต้องแยก ROOM + HL โดยให้ยอดรวมเท่ากับอัตราห้องปรับอากาศ
 *   การแบ่งสองรายการนี้เป็นกติกา mock-up และยังต้องยืนยันกับเจ้าหน้าที่ก่อนใช้งานจริง
 */
export function priceLinesFor(
  dormGroupId: string,
  config: RoomConfig,
  occupancy: OccupancyMode,
): PriceLine[] {
  const rows = feeRowsForDorm(dormGroupId)
  const suffix = occupancy === 'whole_room' ? ' (เหมาห้อง)' : ''

  if (config === 'hl') {
    const roomAmount = annualAmount(findFeeRow(rows, 'normal'), occupancy)
    const airconAmount = annualAmount(findFeeRow(rows, 'aircon'), occupancy)
    return [
      {
        action: 'ROOM',
        ref2: `ROOM${CURRENT_ACADEMIC_YEAR}`,
        title: `ค่าหอพักรอบปีการศึกษา ${CURRENT_ACADEMIC_YEAR}${suffix}`,
        amount: roomAmount,
      },
      {
        action: 'HL',
        ref2: `HL${CURRENT_ACADEMIC_YEAR}`,
        title: `ค่าบริการ HL รอบปีการศึกษา ${CURRENT_ACADEMIC_YEAR}${suffix}`,
        amount: airconAmount - roomAmount,
      },
    ]
  }

  return [
    {
      action: 'ROOM',
      ref2: `ROOM${CURRENT_ACADEMIC_YEAR}`,
      title: `ค่าหอพักรอบปีการศึกษา ${CURRENT_ACADEMIC_YEAR}${suffix}`,
      amount: annualAmount(findFeeRow(rows, config), occupancy),
    },
  ]
}

export function totalPriceFor(
  dormGroupId: string,
  config: RoomConfig,
  occupancy: OccupancyMode,
) {
  return priceLinesFor(dormGroupId, config, occupancy).reduce((sum, line) => sum + line.amount, 0)
}
