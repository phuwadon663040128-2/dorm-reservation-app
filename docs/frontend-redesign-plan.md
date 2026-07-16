# แผน Redesign Frontend — KKU Affiliated Dorm Application & Reservation System

> อ้างอิงรายละเอียดงานล่าสุดจากโฟลเดอร์ `reference/notion/` (เอกสาร 01–17, แก้ไขล่าสุด 2026-07-10/11)
> จัดทำ: 2026-07-12 · Branch: `redesign`
>
> **สถานะล่าสุด (2026-07-12):** P0 ✅ (โครง router/pinia/types/fixtures/layouts + 33 จอ) ·
> Visual redesign ตาม Figma ✅ (ธีมสว่าง–มืด, IBM Plex Sans Thai, ตรา มข., landing ใหม่) ·
> P3 core ✅ (เชิญรูมเมท → Reserve ล็อกห้อง → ยืนยัน 15 นาที → payment hold 72 ชม. → สร้าง obligations, hold expiry ฝั่ง client) ·
> ถัดไป: P4 (จอชำระเงินเชื่อม batch จริง) และ P5 (staff actions พร้อม ReasonDialog)

---

## 1. สรุปการเปลี่ยนแปลงของ Spec ล่าสุด (ทำไมต้อง Redesign)

Pilot ที่ได้รับการยืนยันคือ **วรเรสซิเดนซ์ / หอ 8 หลัง + หอพักวรอินเตอร์** ภายใต้ระบบเดียวที่ configure ได้ และทิศทางผลิตภัณฑ์เปลี่ยนจาก "จองตามโควตาประเภทห้อง + อัปโหลดสลิป" ไปเป็น **"จองห้องจริงรายห้อง (exact room) + workflow เอกสารการเงิน SCB"**

### สิ่งที่ถูกยกเลิก (Superseded) — ต้องเอาออกจาก UI

| Flow เดิมใน Prototype ปัจจุบัน | สถานะตามเอกสารล่าสุด |
|---|---|
| จองตามโควตา room type (`capacity/active`) | ยกเลิก — ใช้ exact-room inventory เป็น source of truth (doc 07, 11) |
| อัปโหลดสลิป / UniPay เป็นช่องทางชำระเงินหลัก | ยกเลิก — เปลี่ยนเป็น SCB bulk file exchange; slip เหลือเพียง "manual payment" ฝั่งเจ้าหน้าที่การเงิน (doc 08, 13, 15) |
| Static QR ที่แอปสร้างเอง | ยกเลิก — QR อย่างเป็นทางการมาจาก PDF ที่ระบบ SCB/ภายใน ส่งกลับมา (doc 12, 13) |
| Allocation / lottery / waitlist / priority score | Future — ไม่อยู่ใน MVP (doc 07, backlog) |
| KKU SSO เป็นเงื่อนไขบังคับ | ยกเลิก — SSO เป็น optional, บัญชีอีเมลส่วนตัวที่ verify แล้วใช้ได้ครบทุก workflow (doc 01, 03) |
| สถานะใบสมัครก้อนเดียว (Submitted → Verifying → Confirmed) | ยกเลิก — แยกเป็น 6 lifecycle อิสระ ห้ามรวมเป็นสถานะเดียว (doc 03 §6, RESV-010) |

### สิ่งที่เพิ่มเข้ามาเป็นแกนของ MVP

1. **Exact-room inventory** — เลขห้อง unique ทั้งระบบ, เลือกแบบ อาคาร → ชั้น → ห้อง (วรอินเตอร์ เช่น `A101`, หอ 8 หลัง เป็นตัวเลขที่เข้ารหัส อาคาร/ชั้น/ห้อง)
2. **Occupancy 2 โหมด** — Shared (2 คน 2 สัญญา) / Whole Room "เหมาห้อง" (1 คนจ่ายเต็ม บล็อกที่นอนที่ 2)
3. **Roommate group** — leader ส่งคำเชิญ (อายุ 48 ชม.) → รับคำเชิญก่อนเลือกห้อง → leader กด Reserve ห้องถูก hold ทันที → (ถ้าแคมเปญกำหนด) รูมเมทยืนยันห้องภายใน **15 นาที** → เข้าสู่ **payment hold 72 ชม.** ร่วมกัน 1 deadline
4. **Payment obligations รายคน รายรายการ** — ห้อง HL สร้าง 2 obligation แยก (ROOM + HL), Ref.1 = เลขห้อง, Ref.2 = action + ปีการศึกษา พ.ศ. (เช่น `ROOM2569`), รูมเมทใช้ Ref.1+Ref.2 ซ้ำกันได้
5. **SCB file exchange** — Export `.xlsx` sheet `SLIPS` → นำเข้า PDF รวมหลายหน้า (QR ทางการ) แล้ว match หน้าเข้ากับ obligation → นำเข้า result report / บันทึก manual payment → exception queue
6. **การยืนยันจอง** — ทุก obligation ที่ต้องจ่ายครบ + เจ้าหน้าที่ที่มีสิทธิ์กดยืนยัน → ห้อง Confirmed ถาวร
7. **สัญญากระดาษ + key handover** — shared = 2 สัญญาใต้ 1 reservation group ("ลงนามแล้ว 1 จาก 2"), whole-room = 1 สัญญา, อัปโหลดสแกน/รูปสัญญาที่ลงนาม (เก็บ private), บันทึกส่งมอบกุญแจแยกต่างหาก
8. **Renewal ประจำปี** — prefill ข้อมูลเดิม; ถ้ารูมเมทไม่ต่อ → เชิญคนใหม่ / เหมาห้อง / ย้ายห้อง / คืนห้อง ภายใน deadline
9. **University handoff** — คิวรอส่งข้อมูลเข้ารอบมหาวิทยาลัย + correction export (ไม่ overwrite ของเดิม)
10. **RBAC + Audit** — สิทธิ์แยกอิสระ (การเงิน ≠ ห้อง ≠ สัญญา), ทุก action สำคัญต้องมีเหตุผล + audit event

---

## 2. สถานะ Frontend ปัจจุบัน และ Gap Analysis

### โครงสร้างปัจจุบัน

- Vite + Vue 3 SPA (**ไม่มี** vue-router / pinia) — state และ mock data ทั้งหมดอยู่ใน [App.vue](../src/App.vue) (672 บรรทัด)
- [LoginView.vue](../src/views/LoginView.vue) (3,604 บรรทัด) — เป็นทั้ง landing site สองภาษา + หน้า login + แสดง workflow ต่าง ๆ ในไฟล์เดียว
- [ApplicantView.vue](../src/views/ApplicantView.vue) — flow เดิม: เลือกแคมเปญ → เลือก room type → กรอกฟอร์ม → tracking พร้อมแท็บ **UniPay / อัปโหลดสลิป** (superseded ทั้งคู่)
- [AdminView.vue](../src/views/AdminView.vue) — dashboard ตรวจสลิป/อนุมัติตามโมเดลเดิม
- [types/index.ts](../src/types/index.ts) — โมเดลเดิมทั้งหมด (`RoomType` แบบโควตา, `Applicant` มี `slipFile`, `paymentMethod`)
- มี shadcn-vue UI components ครบชุดแล้วใน `src/components/ui/` (~40 ชุด) — **ใช้ต่อได้ทันที**

### Gap หลัก

| ด้าน | ปัจจุบัน | Spec ล่าสุดต้องการ |
|---|---|---|
| โมเดลห้อง | โควตา room type | อาคาร → ชั้น → exact room + สถานะรายห้อง + hold expiry |
| Occupancy | ไม่มี | Shared / เหมาห้อง + แปลง shared→whole |
| Roommate | ไม่มี | คำเชิญ 48 ชม., group, leader, ยืนยันห้อง 15 นาที |
| Hold/Countdown | ไม่มี | 15 นาที + 72 ชม. countdown sync กับ server |
| Payment | สลิป/UniPay | Obligation รายคน ROOM/HL + หน้า PDF QR ทางการ + result/exception |
| ฝั่ง Staff | ตรวจสลิป | 15 เมนู: rooms, groups, holds, obligations, SCB export, PDF import, results/exceptions, contracts, key handover, handoff, reports, audit |
| สัญญา | ไม่มี | สัญญา grouped + สแกนลายเซ็น + reprint history |
| Renewal | ไม่มี | Flow ต่อสัญญา + เปลี่ยนรูมเมท |
| Permission-aware UI | role 2 ค่า (applicant/admin) | 7 role categories + permission แยกรายการ (deny-by-default) |
| Stack | Vite SPA | เอกสาร 11/16 กำหนด **Nuxt + shadcn-vue + Tailwind** ใน `apps/frontend` |

---

## 3. ข้อเสนอเชิงกลยุทธ์: 2 Track

ตามไทม์ไลน์เอกสาร 16 — Sprint 0 (รวบรวมไฟล์ตัวอย่าง) เริ่ม **13 ก.ค. 2026 (พรุ่งนี้)**, Sprint 1 (UX freeze + wireframe 12 flows) เริ่ม 27 ก.ค., Sprint 2 (Nuxt shell) เริ่ม 10 ส.ค.

- **Track 1 — Redesign repo นี้เป็น Interactive Prototype (ทำทันที)**
  ปรับ prototype นี้ให้ตรงกับโมเดลใหม่ทั้งหมดโดยใช้ mock fixtures ตามเอกสาร 15 เพื่อใช้เป็น "wireframe มีชีวิต" ประกอบ stakeholder walkthrough ใน Sprint 1 (hold countdown, ROOM/HL split, payment form, grouped contracts ตามที่เอกสาร 16 ระบุให้ walkthrough) — เร็วกว่าเพราะโครง Vite + shadcn-vue พร้อมอยู่แล้ว
- **Track 2 — Production Frontend เป็น Nuxt (Sprint 2 เป็นต้นไป)**
  สร้าง Nuxt app ใน `apps/frontend/` ตาม repo baseline ของเอกสาร 16 แล้ว **ย้าย component/design tokens จาก Track 1 ไปใช้ได้เกือบตรง** เพราะ shadcn-vue + Tailwind ใช้ร่วมกันได้ระหว่าง Vite และ Nuxt (เปลี่ยนหลัก ๆ คือ routing แบบ file-based, layouts, และ data fetching)

แผนที่เหลือในเอกสารนี้คือรายละเอียดของ **Track 1** ซึ่งออกแบบโครงให้ port ไป Nuxt ได้ตรงที่สุด (feature-module folders ↔ Nuxt pages, pinia stores ใช้ได้ทั้งคู่)

---

## 4. Information Architecture ใหม่

### 4.1 Public (ก่อน login)

```
/                       Landing + แคมเปญที่เปิดรับ (คงส่วน landing เดิมจาก LoginView ได้)
/campaigns/:id          Campaign landing: กลุ่มหอ, สิทธิ์ renewal/ผู้สมัครใหม่, วันรับสมัคร,
                        ระยะ hold, กติการูมเมท, ระยะสัญญา, ประกาศ privacy notice (PDPA §23)
/rooms                  Room browser (read-only): อาคาร → ชั้น → ห้อง + สถานะสาธารณะ
                        (Available / Temporarily Held + เวลาหมด hold / Reserved / Unavailable)
                        *ห้ามแสดงชื่อผู้พัก (PDPA + ROOM-007)*
/login /register /verify-email   บัญชีอีเมลส่วนตัว + ปุ่ม "เข้าสู่ระบบด้วย KKU SSO (ไม่บังคับ)"
```

### 4.2 Applicant Portal (ตาม doc 03 §Applicant navigation)

```
/app                    หน้ารวมสถานะ (การ์ดแยก 7 ใบ — ห้าม collapse เป็นสถานะเดียว)
/app/campaigns          Open Campaigns
/app/rooms              Buildings & Rooms (เลือกห้องได้เมื่อมี group/เลือกเหมาห้อง)
/app/roommate           Roommate: เชิญ/รับคำเชิญ/สถานะ group
/app/reservation        My Reservation: hold countdown, สถานะ group, การยืนยันห้อง
/app/payments           Payment Forms: obligations ROOM/HL + ดาวน์โหลดหน้า PDF QR ของตนเอง
/app/contracts          Contracts: ดูตัวอย่าง/พิมพ์/อัปโหลดสแกนลายเซ็น/สถานะ "1 จาก 2"
/app/next-steps         Key Handover / Next Steps
/app/renewal            Renewal (เมื่อแคมเปญ renewal เปิด)
/app/account            Account + ลิงก์ KKU SSO (optional)
```

### 4.3 Staff Portal (ตาม doc 03 §Staff navigation — sidebar layout)

```
/staff                        Dashboard (widget ตาม doc 03 §Staff 1 + doc 05 §Daily dashboard)
/staff/campaigns              ตั้งค่าแคมเปญ/renewal dates/roommate confirmation rule
/staff/rooms                  Buildings / Floors / Rooms + import room master + block/unblock
/staff/applicants             Applicants + profile
/staff/groups                 Roommate Groups
/staff/holds                  Reservation Holds (expiring soon)
/staff/reservations/manual    Manual reservation (เหตุผลบังคับ + audit)
/staff/obligations            Payment Obligations + pricing + override (การเงินเท่านั้น)
/staff/scb/export             SCB Export Batches (filter → validate → preview → download)
/staff/scb/pdf-import         Returned PDF Import + page matching + คิว ambiguous/unmatched
/staff/scb/results            Payment Results / Exceptions + manual payment + group completion
/staff/contracts              Contracts (generate/print/receive scan)
/staff/key-handover           Key Handover
/staff/handoff                University Handoff + correction exports
/staff/reports                Reports
/staff/settings               Settings · /staff/audit  Audit Log
```

---

## 5. Screen Inventory จัดตามลำดับความสำคัญ

อิง **Figma priority 12 flows** จาก doc 03 + Frontend test IDs จาก doc 17:

| # | Flow / จอ | ฝั่ง | Test ID | หมายเหตุ |
|---|---|---|---|---|
| 1 | Exact-room browser (อาคาร→ชั้น→ห้อง) | Applicant | UI-ROOM-001 | ใช้ list แบบมีโครงสร้างพอ (ไม่ต้องเป็น floor-plan interactive) |
| 2 | Room detail + เลือก occupancy (shared/เหมาห้อง) | Applicant | UI-ROOM-001 | แสดงขนาด/ผังห้องเมื่อมีข้อมูลจริงเท่านั้น — ไม่มีให้บอกตรง ๆ ว่าไม่มี (ROOM-011) |
| 3 | Roommate invitation/acceptance | Applicant | UI-GROUP-001 | states: none / sent(48h) / received / accepted / declined / expired |
| 4 | Reserve + countdown ยืนยันห้อง 15 นาที | Applicant | UI-HOLD-001 | countdown sync server, แจ้งเตือนรูมเมท, release ทันทีเมื่อปฏิเสธ/หมดเวลา |
| 5 | สถานะ payment hold 72 ชม. | Applicant | UI-HOLD-002 | 1 deadline ต่อ group; คนอื่นเห็น Temporarily Held + เวลาหมด |
| 6 | Obligations + หน้า SCB PDF | Applicant | UI-PAY-001, UI-PDF-001 | แสดง ROOM/HL แยกเสมอ; เห็นเฉพาะหน้า PDF ของตนเอง (PDF-012) |
| 7 | Staff SCB batch export | Finance | UI-STAFF-001 | filter → validation error → row preview → generate/download → history |
| 8 | Returned PDF import/matching | Finance | UI-PDF-001 | thumbnail + extracted text + match review + manual rematch พร้อมเหตุผล |
| 9 | Result import + exception queue | Finance | UI-RESULT-001 | under/over/duplicate/late/unmatched/ROOM-paid-HL-unpaid/one-roommate-paid |
| 10 | Group completion + final confirm dashboard | Staff | UI-STAFF-001 | ยืนยันได้เมื่อครบทุก obligation; แสดง conflict feedback |
| 11 | Contract + key handover | ทั้งคู่ | UI-CONTRACT-001 | "ลงนามแล้ว 1 จาก 2", สแกน private, handover แยก |
| 12 | Renewal + เปลี่ยนรูมเมท | Applicant | UI-RENEW-001 | ทางเลือก: เชิญแทน / เหมาห้อง / ย้าย / คืนห้อง |

จอรองที่ตามมา: staff dashboard widgets, applicants list, manual reservation, pricing admin + override modal, room-master import, handoff/correction, reports, audit viewer, notification status

---

## 6. Domain Types และ Mock Fixtures ใหม่

### 6.1 เขียน `src/types/` ใหม่ (แทนโมเดลเดิมทั้งไฟล์)

```ts
// inventory
DormGroup, Building, Floor
Room { number: string /* unique */, buildingId, floor, config: 'normal'|'aircon'|'hl'|'special',
       occupancyCapability: ('shared'|'whole')[], dimensions?, planAsset?, facilities[],
       publicStatus: 'available'|'temporarily_held'|'reserved'|'unavailable', holdExpiresAt? }

// roommate & reservation
RoommateInvitation { status: 'pending'|'accepted'|'declined'|'expired', expiresAt /* 48h */ }
RoommateGroup { leaderId, memberIds /* max 2 */, status: 'invitation_pending'|'accepted'|
                'room_confirmation_pending'|'ready_for_payment'|'confirmed'|'cancelled'|'replaced' }
ReservationGroup { occupancyMode: 'shared'|'whole_room', roomNumber, holdStatus:
                   'held_roommate_confirmation'|'held_payment'|'confirmed'|'released'|'expired'|'cancelled',
                   confirmationDeadline? /* 15m */, paymentDeadline? /* 72h */ }

// payment
PaymentObligation { residentId, reservationGroupId, roomNumber /* Ref.1 */,
                    action: 'ROOM'|'HL'|string, ref2: string /* ROOM2569 */, amount,
                    documentStatus: 'not_generated'|'ready_for_export'|'exported'|
                                    'awaiting_returned_pdf'|'payment_form_ready'|'superseded'|'cancelled',
                    resultStatus: 'awaiting_payment'|'result_imported'|'manual_recorded'|
                                  'paid'|'unpaid'|'exception'|'confirmed'|'refund_status'|'cancelled' }
ScbExportBatch, ScbExportRow /* ID(blank), PayerName, Ref1, Ref2, Amount, PaymentDate, Email, Alert, Remark */
ReturnedPdfPage { pageNo, extractedText, matchStatus: 'matched'|'ambiguous'|'unmatched'|'superseded' }
PaymentException { type: 'underpaid'|'overpaid'|'duplicate'|'late'|'post_expiry'|'unmatched'|
                         'room_paid_hl_unpaid'|'one_roommate_unpaid' }

// contract & handover & handoff
Contract { status: 'not_generated'|'ready_to_generate'|'ready_to_print'|'printed'|
                   'signed_received'|'correction_required'|'reprinted'|'cancelled', templateVersion }
KeyHandover { status: 'not_ready'|'ready'|'signed_handed_over'|'corrected'|'cancelled' }
HandoffBatch { kind: 'original'|'correction' }

// auth
Role: 'applicant'|'dorm_staff'|'dorm_manager'|'finance'|'contract_staff'|'division_admin'|'super_admin'
Permission: 'room.manage'|'reservation.manual_create'|'payment_export.create'|... (รายการเต็มตาม doc 11)
AuditEvent { actor, action, reason?, before?, after?, relatedIds[], timestamp }
```

### 6.2 Mock fixtures (`src/fixtures/`) ตามเอกสาร 15

- ห้อง: `A101` (วรอินเตอร์ shared ปกติ), `A102` (HL shared), `A103` (เหมาห้องได้), ห้องหอ 8 หลังเลขตัวเลข, ห้อง blocked, ห้องกำลัง hold 15 นาที, ห้องกำลัง hold 72 ชม., ห้อง confirmed
- ผู้ใช้: applicant-a/b (ครบโปรไฟล์), applicant-c (โปรไฟล์ไม่ครบ), applicant-d (ติด group อื่น), staff-dorm, staff-finance, staff-contract, staff-unauthorized
- Obligations ตัวอย่าง 4 แถวรูมเมท HL ที่ **Ref.1+Ref.2 ซ้ำกัน** (ROOM2569 18,000 / HL2569 8,400 ต่อคน)
- Exception ครบทุกประเภท + PDF pages ที่สลับลำดับ + หน้า unmatched/duplicate
- สถานการณ์ renewal: ต่อทั้งคู่ / ต่อคนเดียว / แปลงเหมาห้อง
- **ห้ามใช้ข้อมูลจริง** (ชื่อ นศ., เลขบัญชี, สัญญาจริง) — PDPA doc 14

---

## 7. โครงสร้างโค้ดใหม่

```
src/
  main.ts, App.vue            (บางลง: router-view + Toaster + providers)
  router/index.ts             vue-router + guards (auth, role, permission)
  stores/                     pinia: session, campaigns, rooms, roommate, reservation,
                              payments, contracts, staffQueues, audit, notifications
  fixtures/                   mock data ตามข้อ 6.2 + mock api layer (delay/error จำลอง)
  composables/
    useCountdown.ts           countdown sync กับเวลา server + refresh เมื่อ stale (doc 17)
    usePermissions.ts         can('payment_export.create') — deny by default
    useLocale.ts              th/en (โครงสองภาษามีแล้วใน LoginView เดิม — แยกออกมาเป็น i18n dict)
  components/
    ui/                       shadcn-vue (คงเดิม)
    domain/
      RoomStatusBadge.vue     สถานะห้อง — ข้อความ+ไอคอน ไม่ใช้สีอย่างเดียว (a11y)
      RoomCard.vue / FloorRoomList.vue / RoomFilterBar.vue
      HoldCountdown.vue       ใช้ทั้ง 15 นาที และ 72 ชม.
      OccupancyPicker.vue     shared / เหมาห้อง + อธิบายผลด้านราคา/สัญญา
      ObligationCard.vue      ROOM/HL แยกบรรทัด + Ref.1/Ref.2 + deadline + สถานะเอกสาร/ผลชำระ
      StatusCardGrid.vue      การ์ดสถานะ 7 ใบของ applicant (RESV-010)
      LifecycleTimeline.vue   generic timeline ต่อ 1 lifecycle
      ReasonDialog.vue        modal เหตุผลบังคับ (override/manual/rematch/reprint/cancel)
      PdfPageViewer.vue / MatchReviewTable.vue / ExceptionQueueTable.vue
      ContractStatusCard.vue  "ลงนามแล้ว 1 จาก 2"
      PermissionGate.vue      ซ่อน/disable ตาม permission + สถานะ permission-denied
      AuditTrail.vue
  layouts/
    PublicLayout.vue / ApplicantLayout.vue (mobile-first) / StaffLayout.vue (sidebar, desktop-first)
  views/
    public/ applicant/ staff/  แยกไฟล์ต่อจอ (เลิก monolith 3 ไฟล์เดิม)
```

**หลักการแตกไฟล์เดิม:** ส่วน landing/ข่าว/ติดต่อใน LoginView เดิม → `views/public/`; flow สมัครใน ApplicantView → เขียนใหม่ตามข้อ 5; AdminView → กระจายเข้า `views/staff/`

---

## 8. UI ต้องสะท้อน 6 Lifecycle โดยไม่รวบเป็นสถานะเดียว

ตัวอย่างหน้ารวมสถานะของ applicant (ตาม doc 03 §6):

```
ห้อง:        A101 — Temporarily Held ถึง 18:00
รูมเมท:      ยืนยันแล้ว
ค่าหอ ROOM2569:  Payment Form Ready / Paid / Exception
ค่าบริการ HL2569: Payment Form Ready / Paid / Exception
การจอง:      รอชำระครบทุกรายการ / Confirmed
สัญญา:       ลงนามแล้ว 1 จาก 2
กุญแจ:       ยังไม่พร้อม
```

Lifecycle ทั้ง 6 ชุด (Room hold / Roommate group / Payment document / Payment result / Contract / Key handover) ใช้ enum ตรงตามเอกสาร 01 §Status models — ห้ามตั้งชื่อสถานะเอง เพื่อให้ทีม backend/QA ใช้คำเดียวกัน ("Held", "Paid", "Confirmed", "Signed" ต้องมีความหมายเดียว — เงื่อนไข exit ของ Sprint 1)

---

## 9. มาตรฐานคุณภาพต่อจอ (จาก doc 16 DoD + doc 17 State Matrix)

ทุกจอสำคัญต้องมีสถานะครบ: **loading / empty / loaded / validation error / server conflict / expired / permission denied / retryable failure / non-retryable failure / stale countdown (refresh จาก server) / responsive mobile+desktop**

Accessibility baseline (doc 17):
- ทุก form control มี label + ผูก error
- สถานะห้องไม่พึ่งสีอย่างเดียว
- Countdown ประกาศผ่าน screen reader แบบไม่รัว (aria-live polite, ประกาศเป็นช่วง)
- คีย์บอร์ดใช้เลือก/กรองห้อง, รับคำเชิญ, ทำ staff review dialog ได้
- Modal trap/restore focus
- ข้อความไทย/อังกฤษต้องไม่ตัดจำนวนเงิน, deadline, เลขอ้างอิง

PDPA ที่กระทบ UI (doc 14):
- Privacy notice ภาษาไทยชัดเจน **ก่อน submit ใบสมัคร** + เข้าถึงได้ทาง URL/QR
- ไม่ใช้ checkbox consent ก้อนเดียวครอบทุกอย่าง — แยก consent เฉพาะรายการ optional
- จอสาธารณะไม่เปิดเผยชื่อผู้พัก / ข้อมูลการเงิน
- Demo/screenshot ใช้ข้อมูลสมมติเท่านั้น

---

## 10. แผนดำเนินการเป็นเฟส (Track 1)

| เฟส | งาน | สอดคล้อง Sprint (doc 16) |
|---|---|---|
| **P0 — วางโครง** | เพิ่ม vue-router + pinia, layouts 3 ชุด, แตก monolith, types+fixtures ใหม่ (ข้อ 6), composables (countdown/permissions/locale), ลบ flow UniPay/สลิป/โควตา | ก่อน Sprint 1 |
| **P1 — Auth + Shell** | register/verify email/login, ปุ่ม SSO optional, profile completeness checklist, สถานะ base (loading/error/empty/denied) | Sprint 2 |
| **P2 — Campaign + Room browser** | campaign landing, อาคาร→ชั้น→ห้อง, room detail + occupancy picker, สถานะสาธารณะ + hold expiry, mobile responsive | Sprint 4 |
| **P3 — Roommate + Holds** | invitation flow ครบ state, reserve + countdown 15 นาที, payment hold 72 ชม., เหมาห้อง, conflict/expired recovery | Sprint 5–6 |
| **P4 — Payments (applicant)** | obligation list ROOM/HL, หน้า PDF viewer ของตนเอง, สถานะ result/exception, shared deadline | Sprint 7–9 |
| **P5 — Staff operations** | dashboard widgets, rooms admin + import, manual reservation + ReasonDialog, pricing/override, SCB export (filter→validate→preview→download→history), PDF import/match review, result import + exception queue, group completion + final confirm | Sprint 8–10 |
| **P6 — Contracts → Handoff** | contracts (2 ใบ/1 ใบ, พิมพ์, สแกน, 1 จาก 2), key handover, renewal + ทางเลือก 4 ทาง, handoff queue + correction, reports, audit viewer | Sprint 11–12 |

แต่ละเฟสจบด้วย: state matrix ครบ (ข้อ 9), เดินได้ end-to-end ด้วย mock fixtures, และคำสถานะตรง enum เอกสาร

> เมื่อเริ่ม Track 2 (Nuxt, Sprint 2+): ย้าย `components/domain`, `stores`, `composables`, dictionary สองภาษาไปแทบตรง; `views/*` แปลงเป็น `pages/*` + `layouts/*` ของ Nuxt; mock api layer แทนด้วย API จริงของ Go ทีละ module

---

## 11. คำถามค้าง (Provisional) ที่กระทบ UI — ต้องติดป้ายในจอ ห้าม hard-code

จากเอกสาร 01/07/09 — ค่าเหล่านี้ยังรอ stakeholder ยืนยัน UI ต้องแสดงเป็น config/label "Provisional":

1. นโยบายสุดท้ายกรณี **รูมเมทจ่ายคนเดียว** (ปัจจุบัน: ค้างถึง deadline แล้ว release + ส่งเงินเข้า refund/manual review)
2. รูปแบบ **Ref.2 แบบผ่อนชำระรายเทอม**
3. ผู้พัก **ยกเว้นค่าธรรมเนียม** (ที่ปรึกษาหอ) — ห้าม improvise บิลศูนย์บาท
4. แหล่งข้อมูล **ขนาด/ผังห้อง** อย่างเป็นทางการ — ระหว่างนี้แสดง "ยังไม่มีข้อมูล" ตามจริง
5. วันเปิด-ปิด **renewal**, จำนวนสำเนา/เอกสารแนบ/การเก็บรักษาสัญญา, checklist ส่งมอบกุญแจ
6. ถ้อยคำทางการของเหตุการณ์ "**ได้ห้องแล้ว**" (การยืนยันถาวร)
7. ชื่อตำแหน่ง/ขอบเขตสิทธิ์เจ้าหน้าที่จริง

---

## 12. สรุปสิ่งที่จะถูกลบ/แทนที่ใน Prototype เดิม

- แท็บ **UniPay** และ **อัปโหลดสลิป** ใน ApplicantView → แทนด้วย obligation + PDF QR viewer; slip เหลือเป็นไฟล์หลักฐานแนบใน manual payment ฝั่ง finance เท่านั้น
- `RoomType.capacity/active` (โควตา) → summary ที่คำนวณจาก exact rooms (backlog: "Room-category and availability summary")
- สถานะ `Submitted / Staff Verifying / Confirmed / Need Re-upload / Rejected` → 6 lifecycle ใหม่
- Campaign `dorm-9 หอ 9 หลัง` ใน mock → เอาออกจาก pilot (เหลือ หอ 8 หลัง + วรอินเตอร์) — หอ 9 หลังเป็นเพียงข้อมูลวิจัย
- โครง role 2 ค่า → 7 role + permission matrix

---

*เอกสารอ้างอิงหลัก: notion docs 01 (PRD), 02 (Reservation/Holds), 03 (UX), 05 (Operations), 07 (Pivot), 08 (Payments), 09 (Roadmap), 11 (Tech Stack), 12–13 (SCB/Integration), 14 (PDPA), 15 (Fixtures), 16 (Sprint Plan), 17 (Test-First Plan + Frontend State Matrix)*
