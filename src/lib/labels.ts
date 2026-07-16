// Label ภาษาไทยของทุกสถานะ — enum ตรงตาม Status models ในเอกสาร 01
// รวมไว้ที่เดียวเพื่อให้ทุกจอใช้คำเดียวกัน ("Held" / "Paid" / "Confirmed" / "Signed" ความหมายเดียว)
import type {
  ContractStatus,
  InvitationStatus,
  KeyHandoverStatus,
  OccupancyMode,
  PaymentDocumentStatus,
  PaymentExceptionType,
  PaymentResultStatus,
  ReservationHoldStatus,
  RoomConfig,
  RoomPublicStatus,
  RoommateGroupStatus,
} from '@/types'

export const roomPublicStatusLabel: Record<RoomPublicStatus, string> = {
  available: 'ว่าง',
  temporarily_held: 'ถูกจองชั่วคราว',
  reserved: 'จองแล้ว',
  unavailable: 'ไม่เปิดให้จอง',
}

export const roomConfigLabel: Record<RoomConfig, string> = {
  normal: 'ห้องปกติ (พัดลม)',
  aircon: 'ห้องแอร์',
  hl: 'ห้องแอร์ (HL)',
  special: 'ห้องแอร์พิเศษ',
}

export const occupancyModeLabel: Record<OccupancyMode, string> = {
  shared: 'พักคู่ (2 คน)',
  whole_room: 'เหมาห้อง (1 คน)',
}

export const invitationStatusLabel: Record<InvitationStatus, string> = {
  pending: 'รอตอบรับ',
  accepted: 'ตอบรับแล้ว',
  declined: 'ปฏิเสธ',
  expired: 'หมดอายุ',
}

export const roommateGroupStatusLabel: Record<RoommateGroupStatus, string> = {
  invitation_pending: 'รอตอบรับคำเชิญ',
  accepted: 'จับคู่แล้ว (ยังไม่เลือกห้อง)',
  room_confirmation_pending: 'รอรูมเมทยืนยันห้อง',
  ready_for_payment: 'พร้อมชำระเงิน',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
  replaced: 'เปลี่ยนสมาชิกแล้ว',
}

export const holdStatusLabel: Record<ReservationHoldStatus, string> = {
  held_roommate_confirmation: 'ล็อกห้องรอรูมเมทยืนยัน (15 นาที)',
  held_payment: 'ล็อกห้องรอชำระเงิน (72 ชม.)',
  confirmed: 'ยืนยันถาวรแล้ว',
  released: 'ปล่อยห้องคืนแล้ว',
  expired: 'หมดเวลา',
  cancelled: 'ยกเลิก',
}

export const documentStatusLabel: Record<PaymentDocumentStatus, string> = {
  not_generated: 'ยังไม่สร้างรายการ',
  ready_for_export: 'พร้อม export เข้า batch',
  exported: 'ส่งออกเข้า batch ธนาคารแล้ว',
  awaiting_returned_pdf: 'รอแบบฟอร์ม QR จากธนาคาร',
  payment_form_ready: 'แบบฟอร์มชำระเงินพร้อมแล้ว',
  superseded: 'ถูกแทนที่ด้วยฉบับใหม่',
  cancelled: 'ยกเลิก',
}

export const resultStatusLabel: Record<PaymentResultStatus, string> = {
  awaiting_payment: 'รอชำระเงิน',
  result_imported: 'นำเข้าผลชำระแล้ว',
  manual_recorded: 'บันทึกชำระแบบ manual',
  paid: 'ชำระแล้ว',
  unpaid: 'ยังไม่ชำระ',
  exception: 'รอตรวจสอบ (exception)',
  confirmed: 'ยืนยันการชำระแล้ว',
  refund_status: 'อยู่ระหว่างติดตามการคืนเงิน',
  cancelled: 'ยกเลิก',
}

export const exceptionTypeLabel: Record<PaymentExceptionType, string> = {
  underpaid: 'ชำระไม่ครบ',
  overpaid: 'ชำระเกิน',
  duplicate: 'รายการซ้ำ',
  late: 'ชำระล่าช้า',
  post_expiry: 'ชำระหลังหมดเวลา hold',
  unmatched: 'จับคู่รายการไม่ได้',
  room_paid_hl_unpaid: 'จ่าย ROOM แล้วแต่ HL ยังไม่จ่าย',
  one_roommate_unpaid: 'รูมเมทจ่ายแล้วคนเดียว',
}

export const contractStatusLabel: Record<ContractStatus, string> = {
  not_generated: 'ยังไม่สร้างสัญญา',
  ready_to_generate: 'พร้อมสร้างสัญญา',
  ready_to_print: 'พร้อมพิมพ์',
  printed: 'พิมพ์แล้ว (รอลงนาม)',
  signed_received: 'ลงนามและรับคืนแล้ว',
  correction_required: 'ต้องแก้ไข',
  reprinted: 'พิมพ์ซ้ำ',
  cancelled: 'ยกเลิก',
}

export const keyHandoverStatusLabel: Record<KeyHandoverStatus, string> = {
  not_ready: 'ยังไม่พร้อมรับกุญแจ',
  ready: 'พร้อมรับกุญแจ',
  signed_handed_over: 'ส่งมอบและลงนามแล้ว',
  corrected: 'มีการแก้ไขบันทึก',
  cancelled: 'ยกเลิก',
}

export function formatBaht(amount: number): string {
  return `${amount.toLocaleString('th-TH')} บาท`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}
