// Domain model ตามรายละเอียดงานล่าสุด (notion docs 01, 02, 08, 11, 15)
// สถานะทุกชุดใช้คำตรงตาม Status models ในเอกสาร 01 — ห้ามตั้งชื่อสถานะเอง

// ---------------------------------------------------------------------------
// Inventory: dorm group → building → floor → exact room
// ---------------------------------------------------------------------------

export type RoomConfig = 'normal' | 'aircon' | 'hl' | 'special'

export type OccupancyMode = 'shared' | 'whole_room'

/** สถานะห้องฝั่งสาธารณะ — จอ public ห้ามเปิดเผยตัวตนผู้จอง (ROOM-007) */
export type RoomPublicStatus = 'available' | 'temporarily_held' | 'reserved' | 'unavailable'

export interface DormGroup {
  id: string
  /** เช่น "วรเรสซิเดนซ์ / หอ 8 หลัง" */
  name: string
  /** ชื่อสั้นสำหรับการ์ดหน้า landing เช่น "วรเรสซิเดนซ์" */
  shortName: string
  description: string
  buildingCount: number
  contractLabel: string
  /** ราคาเริ่มต้นต่อภาคการศึกษา (ใช้แสดงการตลาดเท่านั้น — ราคาจริงคำนวณจาก pricing rule) */
  priceFromPerTerm: number
  photo?: string
}

export type BuildingGender = 'male' | 'female' | 'mixed'

export interface Building {
  id: string
  dormGroupId: string
  /** วรอินเตอร์ใช้ตัวอักษร (A, B) — หอ 8 หลังใช้ตัวเลข */
  code: string
  name: string
  floors: number[]
  gender: BuildingGender
}

export interface Room {
  /** เลขห้อง unique ทั้งระบบ เช่น A101 หรือ 1101 — ใช้เป็น Ref.1 */
  number: string
  buildingId: string
  floor: number
  config: RoomConfig
  occupancyCapability: OccupancyMode[]
  /** ขนาดห้อง เช่น "3.5 × 6 ม." — undefined = ยังไม่มีข้อมูลทางการ ให้แสดงตามจริง (ROOM-011) */
  dimensions?: string
  planAsset?: string
  facilities: string[]
  publicStatus: RoomPublicStatus
  /** เวลาหมด hold (ISO) เมื่อ publicStatus = temporarily_held */
  holdExpiresAt?: string
  /** เหตุผลที่ staff block ห้อง (เห็นเฉพาะฝั่ง staff) */
  blockedReason?: string
}

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

export type CampaignKind = 'new_application' | 'renewal'

export interface Campaign {
  id: string
  kind: CampaignKind
  name: string
  dormGroupIds: string[]
  status: 'open' | 'upcoming' | 'closed'
  openDate: string
  closeDate: string
  /** แคมเปญกำหนดให้รูมเมทต้องยืนยันห้องภายใน 15 นาทีหรือไม่ (doc 02) */
  roommateRoomConfirmationRequired: boolean
  roomConfirmationMinutes: number
  paymentHoldHours: number
  invitationHours: number
  contractPeriod: string
  policyNotes: string[]
  contact: string
}

// ---------------------------------------------------------------------------
// Users, roles, permissions (doc 11)
// ---------------------------------------------------------------------------

// บทบาทมี 3 แบบ: ผู้สมัคร / เจ้าหน้าที่ (บทบาทเดียว ทำได้ทุกอย่างตามส่วนงานที่ได้รับ)
// / ผู้ดูแลระบบ (กำหนดส่วนงานที่เจ้าหน้าที่แต่ละคนเข้าถึงได้)
export type Role = 'applicant' | 'staff' | 'admin'

/** ส่วนงานฝั่งเจ้าหน้าที่ — ผู้ดูแลระบบเปิด/ปิดการเข้าถึงรายคนได้ */
export type StaffSection =
  | 'overview'
  | 'reservation'
  | 'payment'
  | 'contract'
  | 'system'

export type Permission =
  | 'room.manage'
  | 'room.block'
  | 'reservation.manual_create'
  | 'reservation.assign_room'
  | 'reservation.confirm'
  | 'pricing_rule.manage'
  | 'payment_obligation.override'
  | 'payment_export.create'
  | 'payment_export.download'
  | 'payment_document.import'
  | 'payment_document.match_review'
  | 'payment_result.import'
  | 'payment.manual_record'
  | 'payment.exception.resolve'
  | 'payment.confirm'
  | 'payment.cancel'
  | 'payment.refund_status.manage'
  | 'contract_template.manage'
  | 'contract.generate'
  | 'contract.print'
  | 'contract.receive'
  | 'key_handover.record'
  | 'university_export.create'
  | 'correction_export.create'
  | 'audit.view'

export interface User {
  id: string
  role: Role
  displayName: string
  email: string
  emailVerified: boolean
  /** กรอกและส่งข้อมูลใบสมัครครบแล้วหรือยัง — ไม่ใช่เงื่อนไขก่อนเชิญรูมเมทหรือจองห้อง */
  profileComplete: boolean
  /** ผูก KKU SSO แล้วหรือยัง — optional ไม่ gate ขั้นตอนใด (AUTH-004) */
  kkuSsoLinked: boolean
  studentId?: string
  phone?: string
  /** dorm scope ของเจ้าหน้าที่ */
  dormGroupIds?: string[]
  /** ส่วนงานที่เจ้าหน้าที่คนนี้เข้าถึงได้ (ผู้ดูแลระบบกำหนด) — undefined = เข้าถึงได้ทุกส่วน */
  allowedSections?: StaffSection[]
}

// ---------------------------------------------------------------------------
// Roommate group + reservation + holds (doc 02)
// ---------------------------------------------------------------------------

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface RoommateInvitation {
  id: string
  campaignId: string
  leaderId: string
  inviteeId: string
  status: InvitationStatus
  sentAt: string
  /** อายุ 48 ชม. */
  expiresAt: string
}

export type RoommateGroupStatus =
  | 'invitation_pending'
  | 'accepted'
  | 'room_confirmation_pending'
  | 'ready_for_payment'
  | 'confirmed'
  | 'cancelled'
  | 'replaced'

export interface RoommateGroup {
  id: string
  campaignId: string
  leaderId: string
  /** สูงสุด 2 คน */
  memberIds: string[]
  status: RoommateGroupStatus
}

export type ReservationHoldStatus =
  | 'held_roommate_confirmation'
  | 'held_payment'
  | 'confirmed'
  | 'released'
  | 'expired'
  | 'cancelled'

export interface ReservationGroup {
  id: string
  campaignId: string
  roommateGroupId?: string
  occupancyMode: OccupancyMode
  roomNumber: string
  memberIds: string[]
  leaderId: string
  holdStatus: ReservationHoldStatus
  /** deadline ยืนยันห้องของรูมเมท (15 นาที) */
  confirmationDeadline?: string
  /** deadline ชำระเงินร่วมของกลุ่ม (72 ชม.) */
  paymentDeadline?: string
  /** จองแบบ manual โดยเจ้าหน้าที่ (final ไม่ต้องให้ผู้พักยืนยัน) */
  manual?: boolean
}

// ---------------------------------------------------------------------------
// Payment obligations + SCB file exchange (doc 08, 12)
// ---------------------------------------------------------------------------

/** รองรับ action ใหม่ในอนาคตโดยไม่แก้ schema (doc 08) */
export type PaymentAction = 'ROOM' | 'HL' | (string & {})

export type PaymentDocumentStatus =
  | 'not_generated'
  | 'ready_for_export'
  | 'exported'
  | 'awaiting_returned_pdf'
  | 'payment_form_ready'
  | 'superseded'
  | 'cancelled'

export type PaymentResultStatus =
  | 'awaiting_payment'
  | 'result_imported'
  | 'manual_recorded'
  | 'paid'
  | 'unpaid'
  | 'exception'
  | 'confirmed'
  | 'refund_status'
  | 'cancelled'

export interface PaymentObligation {
  id: string
  residentId: string
  reservationGroupId: string
  /** Ref.1 = เลขห้อง — รูมเมทใช้ซ้ำกันได้ ไม่ใช่ unique key */
  roomNumber: string
  action: PaymentAction
  /** Ref.2 = action + ปีการศึกษา พ.ศ. เช่น ROOM2569 */
  ref2: string
  /** คำอธิบายรายการ (ใช้เป็น Payer Name ในไฟล์ SCB) */
  title: string
  amount: number
  billIssueDate: string
  paymentDeadline: string
  academicYear: string
  documentStatus: PaymentDocumentStatus
  resultStatus: PaymentResultStatus
  /** อ้างอิงหน้า PDF QR ทางการของผู้พักคนนี้ */
  pdfPageId?: string
  /** override ครั้งเดียวโดยการเงิน — ต้องมีเหตุผล (PRICE-005) */
  override?: { originalAmount: number; reason: string; actor: string }
  supersededById?: string
}

export interface ScbExportRow {
  obligationId: string
  /** คอลัมน์ตาม template ธนาคาร — ID เว้นว่างเสมอ */
  payerName: string
  ref1: string
  ref2: string
  amount: number
  paymentDate: string
  email: string
  alertMessage: 'DEFAULT'
  remark?: string
}

export type ScbBatchStatus = 'draft' | 'exported' | 'awaiting_returned_pdf' | 'pdf_imported' | 'completed'

export interface ScbExportBatch {
  id: string
  createdAt: string
  createdBy: string
  status: ScbBatchStatus
  rows: ScbExportRow[]
  fileChecksum?: string
}

export type PdfPageMatchStatus = 'matched' | 'ambiguous' | 'unmatched' | 'superseded'

export interface ReturnedPdfPage {
  id: string
  batchId: string
  pageNo: number
  extractedText: string
  matchStatus: PdfPageMatchStatus
  matchedObligationId?: string
  matchNote?: string
}

export type PaymentExceptionType =
  | 'underpaid'
  | 'overpaid'
  | 'duplicate'
  | 'late'
  | 'post_expiry'
  | 'unmatched'
  | 'room_paid_hl_unpaid'
  | 'one_roommate_unpaid'

export interface PaymentException {
  id: string
  type: PaymentExceptionType
  obligationId?: string
  reservationGroupId?: string
  detail: string
  status: 'open' | 'resolved'
  resolvedBy?: string
  resolvedReason?: string
}

export interface PaymentResultRow {
  id: string
  importId: string
  transactionRef: string
  ref1: string
  ref2: string
  amount: number
  paidAt: string
  matchedObligationId?: string
  outcome: 'paid' | 'exception' | 'unmatched'
  exceptionType?: PaymentExceptionType
}

export interface ManualPaymentRecord {
  id: string
  obligationId: string
  bankReference: string
  note: string
  actor: string
  recordedAt: string
}

// ---------------------------------------------------------------------------
// Contract + key handover (doc 01, 05)
// ---------------------------------------------------------------------------

export type ContractStatus =
  | 'not_generated'
  | 'ready_to_generate'
  | 'ready_to_print'
  | 'printed'
  | 'signed_received'
  | 'correction_required'
  | 'reprinted'
  | 'cancelled'

export interface Contract {
  id: string
  reservationGroupId: string
  residentId: string
  roomNumber: string
  occupancyMode: OccupancyMode
  templateVersion: string
  contractPeriod: string
  status: ContractStatus
  signedScanUploaded: boolean
  signedScanFileName?: string
  printHistory: { at: string; by: string; reason?: string }[]
}

export type KeyHandoverStatus = 'not_ready' | 'ready' | 'signed_handed_over' | 'corrected' | 'cancelled'

export interface KeyHandover {
  id: string
  reservationGroupId: string
  residentId: string
  roomNumber: string
  status: KeyHandoverStatus
  handedOverAt?: string
  recordedBy?: string
}

// ---------------------------------------------------------------------------
// University handoff (doc 01)
// ---------------------------------------------------------------------------

export interface HandoffBatch {
  id: string
  kind: 'original' | 'correction'
  /** correction ต้องอ้าง original — ห้าม overwrite (HANDOFF-004) */
  correctsBatchId?: string
  createdAt: string
  createdBy: string
  status: 'queued' | 'exported' | 'submitted'
  residentIds: string[]
}

// ---------------------------------------------------------------------------
// Audit + notification
// ---------------------------------------------------------------------------

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  /** เหตุผลบังคับสำหรับ action สำคัญ (manual/override/rematch/reprint/cancel) */
  reason?: string
  relatedIds?: string[]
  detail: string
}

export interface AppNotification {
  id: string
  userId: string
  createdAt: string
  title: string
  detail: string
  read: boolean
}
