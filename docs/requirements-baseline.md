# Requirements Baseline — KKU Affiliated Dorm Application & Reservation System

> สรุปรวบยอดจากเอกสาร Notion export ทั้งหมด (`reference/notion/` — หน้า Hub + เอกสาร 01–17 + ตาราง Feature Backlog / Open Questions / Payment Rule Matrix)
> ฉบับข้อมูลล่าสุด: 2026-07-10/11 · จัดทำสรุปนี้: 2026-07-14
> ใช้เป็นแหล่งอ้างอิงสำหรับ: จัดทำรายงาน, mock-up workflow, ออกแบบหน้าเว็บ (Figma/frontend), และวางแผนงานต่อ

---

## 1. ภาพรวมโครงการ

- **ชื่อ (EN):** KKU Affiliated Dorm Application & Reservation System
- **ชื่อ (TH):** ระบบรับสมัครและจองหอพักในกำกับ มข. พร้อมจัดการห้องจริง การชำระเงิน และสัญญา
- **Pilot ที่ยืนยันแล้ว:** วรเรสซิเดนซ์/หอ 8 หลัง + หอพักวรอินเตอร์ ส่งมอบร่วมกันเป็นโปรแกรมเดียว (configurable) — หอ 9 หลัง/หอกลางเป็นเพียงบริบทวิจัย
- **Thesis:** ระบบเดียวที่รู้ "ห้องจริง–ผู้พักจริง–กลุ่มรูมเมต–โหมดการเข้าพัก–ภาระชำระเงินรายคน–เอกสาร SCB–สัญญารายปี–การส่งต่อระบบมหาวิทยาลัย" โดยไม่ต้องคีย์ข้อมูลซ้ำข้ามกระดาษ/Excel/โปรแกรมธนาคาร
- **MVP หนึ่งประโยค:** ผู้สมัครหรือผู้พักเดิมจับกลุ่มรูมเมตหรือเลือกเหมาห้อง → จองห้องจริง → ชำระผ่านเอกสาร SCB → เจ้าหน้าที่ยืนยัน → เซ็นสัญญากระดาษ → ส่งมอบกุญแจ → เข้าคิวส่งต่อระบบมหาวิทยาลัยแบบตรวจสอบย้อนหลังได้

### Stakeholders
- ผอ. อ้อม — รักษาการแทนผู้อำนวยการกองบริการหอพักนักศึกษา
- อาจารย์กานดา — อาจารย์ที่ปรึกษาหลัก
- ผู้จัดการหอพักในกำกับ (พี่แพท/หอ 8 หลัง–วรอินเตอร์)
- เจ้าหน้าที่การเงิน/ธุรการที่ตรวจการชำระเงิน

### ประวัติการ pivot (เอกสาร 07)
1. แนวคิดแรก: fairness allocation / lottery / priority score → **ยกเลิก**
2. Pivot 1: online application + room-type quota + slip upload + shared static QR → **ถูกแทนที่**
3. ทิศทางปัจจุบัน (ยืนยันแล้ว): **exact-room inventory + roommate group + SCB bulk file exchange + สัญญากระดาษ + university handoff**

---

## 2. ขอบเขต MVP

### Must-have (ยืนยันแล้ว)
- บัญชีผู้สมัครยืนยันด้วยอีเมลส่วนตัว (ไม่ต้องมีบัญชี KKU ก่อน) + KKU SSO เป็น **optional** (ไม่ gate ขั้นตอนใด)
- คลังห้องจริง: หอ → อาคาร → ชั้น → ห้อง (เลขห้อง unique ทั้งระบบ; วรอินเตอร์ = ตัวอักษรอาคาร+ชั้น/ห้อง เช่น A101, หอ 8 หลัง = ตัวเลขที่เข้ารหัสอาคาร/ชั้น/ห้อง)
- ขนาดห้อง/แผนผังแสดงเมื่อมีข้อมูลที่เชื่อถือได้
- โหมดเข้าพัก: **Shared** (2 คน 2 สัญญา 2 ภาระชำระ) / **Whole Room / เหมาห้อง** (1 คน ราคาเต็มห้อง 1 สัญญา บล็อก slot ที่สอง) — ปกติสูงสุด 2 คน/ห้อง
- รูมเมต: leader เชิญ (อายุคำเชิญ **48 ชม.**), 1 กลุ่ม active/คน, ต้องรับคำเชิญก่อนเลือกห้อง, โปรไฟล์ครบทั้งคู่
- จอง: leader กด Reserve → hold ทันที; แคมเปญอาจบังคับรูมเมตยืนยันห้องใน **15 นาที** (หมดเวลา/ปฏิเสธ = ปล่อยห้องทันที)
- **Payment hold 72 ชม.** ต่อกลุ่ม (deadline เดียวร่วมกัน); คนอื่นเห็น Temporarily Held + เวลาหมดอายุ
- Staff manual reservation = final ไม่ต้องให้ผู้พักยืนยัน (ต้องมี reason + audit)
- ต่อสัญญารายปี (renewal): prefill ข้อมูลเดิม; ถ้ารูมเมตไม่ต่อ 1 คน → เชิญคนแทน / เหมาห้อง / ย้าย / คืนห้อง ภายใน deadline; เปลี่ยน leader ได้เมื่อทั้งคู่ยืนยัน
- Pricing ตามห้อง/รูปแบบห้อง/โหมดเข้าพัก/ประเภทผู้สมัคร/ปีการศึกษา/action + versioned pricing rules + override รายรายการ (สิทธิ์การเงิน + reason + audit)
- **HL (Happy Living/ห้องแอร์ดัดแปลง) สร้าง 2 ภาระเสมอ: ROOM + HL** (หน้าบ้านเรียก "ห้องแอร์" ได้ แต่บัญชีหลังบ้านแยก)
- SCB Excel export (.xlsx, sheet ชื่อ `SLIPS`), import PDF ตอบกลับ (QR forms), import รายงานผลชำระเงิน, บันทึกชำระ manual, คิว exception
- ยืนยันห้องถาวร (กติกาชั่วคราว): **ชำระครบทุกภาระที่จำเป็นของทุกคนในกลุ่ม + เจ้าหน้าที่ผู้มีสิทธิ์กดยืนยัน**
- สัญญากระดาษ: shared = 2 สัญญาใต้ 1 กลุ่มจอง / whole = 1 สัญญา (template เดียว เปลี่ยนค่า); เซ็นแยกกันได้ แต่กลุ่มไม่สมบูรณ์จนกว่าจะได้ครบ; สแกน/ถ่ายรูปฉบับเซ็นเก็บ private; reprint/แก้ไขต้องมี reason และเก็บประวัติ
- ส่งมอบกุญแจ = เอกสารเซ็นแยกต่างหาก ผูกกับสัญญา
- University handoff: เข้าคิวจนรอบทางการเปิด → export; การแก้ไขภายหลังสร้าง correction export ใหม่เสมอ (ไม่ทับ record เดิม)
- Reports, RBAC + dorm scope, private files, audit ครบ

### Non-goals / เลื่อนออก
- ลายเซ็นดิจิทัล, bank API แบบ real-time, คืนเงินอัตโนมัติ, ระบบพัสดุ, ระบบแจ้งซ่อม, บิลน้ำ/ไฟรายเดือน (ออกแบบ schema เผื่อไว้), lottery หอกลาง, เปิดทุกหอพร้อมกัน, native mobile app, GitHub Actions

---

## 3. บทบาทผู้ใช้ (Roles)

| Role | ความสามารถหลัก |
|---|---|
| Applicant / Resident | สมัครก่อนมีบัญชี KKU, ดูห้องจริง, เชิญ/รับรูมเมต, จอง (leader), เลือก shared/เหมาห้อง, ดูสถานะห้อง–เงิน–สัญญา–กุญแจ, โหลดใบชำระ QR, พิมพ์สัญญา, อัปโหลดสแกนสัญญา, ต่อสัญญา, ขอเปลี่ยนแปลง |
| Reservation Leader | สร้างคำเชิญ, เริ่มการจองห้องจริง (ทั้งสองโหมด), ไม่ได้เป็นเจ้าของภาระชำระ/สัญญาของรูมเมต |
| Dorm Staff | จัดการห้อง, block/unblock, จองแทน (manual), มอบห้อง/โหมด, ดูสถานะกลุ่ม, จัดการต่อสัญญา/คนแทน, ยืนยันห้องหลังชำระ (ตามสิทธิ์) |
| Finance/Payment Staff | ตรวจ pricing exception, override ยอด (มี reason), สร้าง SCB batch, โหลด XLSX, import PDF ตอบกลับ, ตรวจ page mapping, import รายงานผล, บันทึกชำระ manual, แก้ exception, ยืนยันการชำระ, ติดตามสถานะ refund |
| Contract Staff | จัดการ template, generate/preview/print/reprint (มี reason), บันทึกรับสัญญาเซ็น + สแกน private, แก้/ยกเลิกโดยเก็บประวัติ, บันทึกส่งมอบกุญแจ |
| Division Admin / Super Admin | จัดการ role/scope, รายงานข้ามหอ, config ระบบ, ดู audit, จัดการ university handoff/correction |

**Permissions (แยกอิสระ ไม่ inherit):** `room.manage, room.block, reservation.manual_create, reservation.assign_room, reservation.confirm, pricing_rule.manage, payment_obligation.override, payment_export.create/download, payment_document.import, payment_document.match_review, payment_result.import, payment.manual_record, payment.exception.resolve, payment.confirm, payment.cancel, payment.refund_status.manage, contract_template.manage, contract.generate/print/receive, key_handover.record, university_export.create, correction_export.create, audit.view`

---

## 4. Business Rules สำคัญ (ตัวเลขที่ตรึงแล้ว)

| กติกา | ค่า |
|---|---|
| อายุคำเชิญรูมเมต | 48 ชั่วโมง |
| รูมเมตยืนยันห้องที่เลือก (ถ้าแคมเปญบังคับ: `roommate_room_confirmation_required`) | 15 นาที |
| Payment hold ของกลุ่ม | 72 ชั่วโมง (baseline ชั่วคราว) |
| ขนาดกลุ่มสูงสุด | 2 คน |
| กลุ่ม/คำเชิญ active ต่อคน | 1 |
| ค่าธรรมเนียม SCB 5 บาท | หอ/บริษัทรับภาระ (สมมติฐานปัจจุบัน) |
| จ่ายแล้ว 1 คน อีกคนไม่จ่าย | คงกลุ่มถึง deadline ร่วม → ปล่อย/ยกเลิกตามกติกาชั่วคราว → เงินที่จ่ายเข้าสู่ manual/refund review |
| Shared → Whole conversion | ทำได้หลังมีคนจ่ายแล้ว; คำนวณใหม่ + supersede ของเดิม (ห้ามแก้ประวัติ) |
| การยืนยันห้องถาวร | ชำระครบทุกภาระ + staff ยืนยัน (provisional — รอ stakeholder ตอกย้ำ) |

### Concurrency / Integrity (บังคับทุก implementation)
- Hold ห้องต้อง atomic — สองคนจองพร้อมกันสำเร็จได้คนเดียว (conditional UPDATE / row lock)
- Expiry/release idempotent (ปล่อยครั้งเดียว), re-import ไฟล์ไม่ duplicate, ยืนยันสุดท้ายสำเร็จได้ครั้งเดียว
- Ref.1+Ref.2 **ไม่ใช่ unique key** (รูมเมตแชร์กันได้) — internal obligation ID คือ source of truth
- ห้ามพึ่งลำดับหน้า PDF หรือเรียงเลขห้องในการ match
- ทุกการ supersede (obligation/contract/export/correction) เก็บประวัติเดิม immutable

### Actions ที่บังคับ reason + audit event
manual reservation, manual payment, amount override, permanent pricing change, room block/release override, cancellation, roommate replacement, PDF rematch/replacement, payment exception decision, contract reprint/correction/cancellation, university correction export

---

## 5. Workflow หลัก (สำหรับ mock-up)

### 5.1 Shared room (ผู้สมัครใหม่)
```
โปรไฟล์ครบทั้งคู่ → leader เชิญรูมเมต → รับใน 48 ชม.
→ leader เลือก อาคาร/ชั้น/ห้องจริง → กด Reserve → ห้องถูก hold ทันที
→ (ถ้าบังคับ) รูมเมตยืนยันห้องใน 15 นาที → เข้าสู่ payment hold 72 ชม.
→ สร้างภาระชำระแยกรายคน (ROOM [+HL]) → การเงิน export SCB Excel
→ import PDF QR ตอบกลับ + match หน้าให้รายคน → ต่างคนต่างจ่าย
→ import รายงานผล SCB / บันทึก manual → ครบทุกภาระ
→ staff ยืนยันห้อง → generate 2 สัญญาใต้ 1 กลุ่ม → พิมพ์/เซ็น (แยกกันได้)
→ บันทึกสแกนสัญญา + ส่งมอบกุญแจ (เอกสารแยก) → เข้าคิว university handoff
```

### 5.2 Whole room / เหมาห้อง
```
เลือกโหมดเหมาห้อง → เลือกห้องจริง → hold ทันที → ภาระราคาเต็มห้องต่อ action
→ จ่าย QR → staff ยืนยัน → 1 สัญญา → เซ็น → กุญแจ
```

### 5.3 Renewal (ต่อสัญญารายปี)
```
เปิดแคมเปญ renewal (วันที่ config ได้) → ผู้พักเดิมเห็นข้อมูล prefill → ยืนยัน/แก้เฉพาะที่เปลี่ยน
→ คู่เดิมต่อด้วยกัน หรือ 1 คนไม่ต่อ → คนที่เหลือได้ deadline: เชิญคนแทน/เหมาห้อง/ย้าย/คืนห้อง
→ สร้างภาระ+สัญญารอบใหม่ (ปีเก่า immutable) → ห้องที่เหลือเปิดให้ผู้สมัครใหม่
```

### 5.4 SCB file exchange (การเงิน)
```
กลุ่มพร้อม → สร้าง obligations → การเงินตรวจเฉพาะ exception/override
→ export .xlsx (sheet SLIPS) → อัปโหลดเข้าโปรแกรม SCB เดิม (นอกระบบเรา)
→ SCB คืน PDF รวมหลายหน้า (QR form ทางการ) → import เข้าระบบ → match หน้า↔ภาระรายคน
   (match ด้วยข้อความเฉพาะบุคคลบนหน้า ไม่ใช่ Ref/ลำดับหน้า; หน้ากำกวมเข้าคิว review)
→ ผู้พักจ่าย → โหลดรายงานผลจาก SCB → import → match ผล↔ภาระ
→ exception (จ่ายขาด/เกิน/ซ้ำ/ช้า/หลังหมดเวลา/จับคู่ไม่ได้/ROOM จ่าย HL ไม่จ่าย/จ่าย 1 คน) → คิว review
→ ครบ → staff ยืนยันห้อง
```

### 5.5 SCB SLIPS export spec (ตรึงแล้ว)
- ไฟล์ `.xlsx`, worksheet ชื่อ `SLIPS` เป๊ะ ๆ, ลำดับคอลัมน์ตามธนาคาร
- 1 แถว = 1 ผู้พัก × 1 payment action | batch เดียวรวมทุกแถวได้ (configurable)

| คอลัมน์ | ค่า |
|---|---|
| ID | **เว้นว่าง** |
| Payer Name * | คำอธิบายรายการ (ไม่ใช่ชื่อผู้พักเสมอไป) |
| Ref.1 * | เลขห้องจริง (รูมเมตซ้ำกันได้) |
| Ref.2 | action + ปี พ.ศ. เช่น `ROOM2569`, `HL2569` |
| Amount * | ตัวเลข |
| Payment Date * | วันออกบิล |
| Email Address | ใส่เพราะโปรแกรมภายในบังคับ |
| Alert Message | `DEFAULT` |
| Remark | optional/config |

### 5.6 Status lifecycles (6 โมเดล — ใช้ออกแบบ UI status cards)
- **Room/Hold:** Available → Held for Roommate Confirmation → Held for Payment → Confirmed / Released / Expired / Cancelled (public แสดงแค่ Available / Temporarily Held / Reserved / Unavailable)
- **Roommate group:** Invitation Pending → Accepted → Room Confirmation Pending → Ready for Payment → Confirmed / Cancelled / Replaced
- **Payment document:** Not Generated → Ready for Export → Exported → Awaiting Returned PDF → Payment Form Ready → Superseded / Cancelled
- **Payment result:** Awaiting Payment → Result Imported / Manual Recorded → Paid / Unpaid / Exception → Confirmed / Refund Status / Cancelled
- **Contract:** Not Generated → Ready to Generate → Ready to Print → Printed → Signed and Received / Correction Required / Reprinted / Cancelled
- **Key handover:** Not Ready → Ready → Signed and Handed Over → Corrected / Cancelled

---

## 6. UX Requirements (เอกสาร 03 — ใช้ทำ Figma/หน้าเว็บ)

### หลักการฝั่งผู้สมัคร
ผู้ใช้ต้องรู้เสมอ: ห้องไหน / shared หรือเหมา / รูมเมตคือใคร / hold ไหน active หมดเมื่อไร / ต้องจ่าย action อะไรแยกกี่รายการ / ใบ QR พร้อมหรือยัง / รูมเมตจ่ายครบหรือยัง / ห้อง held ชั่วคราวหรือ confirmed ถาวร / สัญญา–กุญแจเสร็จหรือยัง
**ห้ามรวมสถานะเป็นก้อนเดียวคลุมเครือ** — แสดงการ์ดแยก: Room & occupancy / Roommate / Hold / Payment actions (ROOM, HL แยก) / Reservation / Contracts ("1 of 2 Signed") / Key handover

### Navigation ผู้สมัคร
Open Campaigns · Buildings & Rooms · Roommate · My Reservation · Payment Forms · Contracts · Key Handover / Next Steps · Account

### Navigation เจ้าหน้าที่
Dashboard · Campaigns · Buildings/Floors/Rooms · Applicants · Roommate Groups · Reservation Holds · Payment Obligations · SCB Export Batches · Returned PDF Import · Payment Results/Exceptions · Contracts · Key Handover · University Handoff · Reports · Settings/Audit Log

### หน้าจอผู้สมัครที่ต้องมี (9)
1. Account entry (SSO optional + สมัครอีเมลส่วนตัว)
2. Campaign landing (กลุ่มหอ, สิทธิ์ renewal/ใหม่, วันที่, hold durations, กติการูมเมต, ช่วงสัญญา, ติดต่อ)
3. Room browser: หอ→อาคาร→ชั้น→ห้อง; การ์ดห้องแสดง เลขห้อง / รูปแบบ (ปกติ, แอร์, HL, พิเศษ/มุม) / ตัวเลือก shared–เหมา / ขนาด–ผัง / สิ่งอำนวยความสะดวก / ราคาโดยประมาณ+แยก action / สถานะ+เวลาหมด hold (MVP ใช้ list ได้ ไม่ต้อง floor-plan interactive)
4. Roommate screen (7 สถานะ)
5. Exact-room confirmation (countdown 15 นาที + แจ้งเตือนรูมเมต)
6. Reservation status (การ์ดแยกตามข้อ 6 ข้างบน)
7. Payment obligations (รายการละ: ชื่อ, Ref.1, Ref.2, ยอด, วันบิล, deadline, หน้า QR, ผล SCB, ประวัติ exception) — **ไม่มี slip upload ใน flow ปกติ**
8. Printed contract (preview/download, สถานะรายคน, สแกนที่เก็บ private)
9. Renewal (prefill + ตัวเลือกเมื่อรูมเมตไม่ต่อ)

### หน้าจอเจ้าหน้าที่ที่ต้องมี (10)
Dashboard (13 widgets: ห้องว่าง, holds, หมดเวลาเร็ว ๆ นี้, invitation ค้าง, obligations พร้อม export, batch รอ PDF, หน้า PDF จับคู่ไม่ได้, exceptions, สัญญา, กุญแจ, handoff) · Room inventory · Manual reservation · Pricing & obligations · SCB export batch · Returned PDF import (thumbnail + text + match review) · Payment result import · Group payment completion · Contract & key handover · University handoff

### ลำดับ Figma priority (12 flows)
1. Exact-room browser 2. Room details + occupancy selector 3. Roommate invitation/acceptance 4. Leader reservation + countdown 15 นาที 5. สถานะ payment hold 72 ชม. 6. รายการภาระชำระ + หน้า SCB PDF 7. Staff SCB batch export 8. Returned PDF import/matching 9. Payment-result import + exception review 10. Shared-group confirmation dashboard 11. Contract + key handover 12. Renewal + เปลี่ยนรูมเมต

### อื่น ๆ
- ฝั่งนักศึกษา mobile-first, ฝั่ง staff desktop-first
- Accessibility: countdown ประกาศผ่าน screen reader, สถานะไม่พึ่งสีอย่างเดียว, ไทย/อังกฤษไม่ตัดข้อความยอด/deadline
- คิวตรวจชำระเงินรู้จักวันทำการ (เจ้าหน้าที่ทำงาน 6 วัน/สัปดาห์ — วันหยุดยังไม่ยืนยันว่าวันไหน)

---

## 7. สถาปัตยกรรม & Tech Stack (ตัดสินใจแล้ว — เอกสาร 04, 11)

- **Frontend:** Nuxt + shadcn-vue + Tailwind CSS · **Backend:** Go + chi · **DB:** PostgreSQL (GORM = CRUD ทั่วไป, sqlc = query วิกฤติเรื่องเงิน/ล็อกห้อง) · **Storage:** SeaweedFS ผ่าน S3 gateway (ไฟล์ private ทั้งหมด, PostgreSQL เก็บ metadata) · **Proxy:** Nginx · **Deploy:** Docker Compose (nginx, frontend, api, postgres, seaweed-*, mock-kku-sso) · **CI/CD:** ไม่ใช้ GitHub Actions (make scripts) · **Migrations:** goose หรือ golang-migrate (ไม่ใช่ AutoMigrate)
- ขอบเขตระบบ: เราเป็นเจ้าของข้อมูลห้อง/กลุ่ม/ภาระ/สถานะ; โปรแกรม SCB เดิมเป็นเจ้าของ QR form + ผลชำระ; ระบบมหาวิทยาลัย (Payment Hub/ERP) เป็นเจ้าของบัญชีทางการ
- Backend modules (12): auth/role, room inventory, roommate/group, hold/assignment, pricing/obligation, SCB export, returned PDF, payment result/exception, contract/key handover, renewal, university handoff, audit
- ตาราง entity หลัก: dorm_groups, buildings, floors, rooms, room_config_versions, room_occupancy_slots, roommate_groups/invitations, reservation_groups/members, room_holds, room_assignments, payment_actions, pricing_rules(+versions), payment_obligations, payment_export_batches/rows/files, returned_payment_documents(+pages, matches), payment_result_imports/rows, payment_transactions, payment_exception_cases, refund_status_events, contract_templates(+versions), contracts, signed_contract_files, key_handover_records, university handoff/correction, audit

---

## 8. Non-functional Requirements

- **PDPA (เอกสาร 14):** ระบบประมวลผลข้อมูลส่วนบุคคลตาม พ.ร.บ. 2562 — privacy notice ก่อนเก็บ, data minimization (ห้ามเก็บบัตรประชาชน/ข้อมูลอ่อนไหวโดยไม่จำเป็น), ไฟล์ทุกชนิด private + เข้าถึงผ่าน backend authorization เท่านั้น (ห้ามเปิด raw S3 URL), จำกัดข้อมูลรูมเมตข้ามคน (เห็นสถานะกลุ่มแต่ไม่เห็นรายละเอียดธุรกรรมอีกฝ่าย), หน้า public ห้ามเผยชื่อผู้พัก, log การเข้าถึงไฟล์อ่อนไหว, retention policy ก่อน pilot จริง, breach response ภายใน 72 ชม., ต้องยืนยัน Data Controller (มข./กองหอพัก ไม่ใช่ทีมนักศึกษา), prototype ใช้ mock data เท่านั้น
- **Security:** deny-by-default RBAC + dorm scope, hash รหัสผ่าน, secure cookies + CSRF, rate limit, ตรวจ MIME/ขนาดไฟล์, ห้าม token/ข้อมูลธนาคารใน log
- **Performance baseline (วิศวกรรม ไม่ใช่นโยบาย):** browse ~2,000 ห้อง p95 < 500ms, hold endpoint p95 < 300ms, gen XLSX 2,000 แถว < 30s (background), import result 2,000 แถว < 60s, dashboard p95 < 1s, 100 concurrent จองห้องเดียว → hold สำเร็จ 1
- **Testing (เอกสาร 17):** test-first + manifest (`tests/manifest.yaml`), test ID: AUTH/ROOM/GROUP/HOLD/PRICE/XLSX/PDF/RESULT/RESV/RENEW/CONTRACT/KEY/HANDOFF/SEC/OPS/E2E/PERF, P0 = ความปลอดภัย/เงิน, concurrency ต้องใช้ PostgreSQL จริง + barrier, golden files สำหรับ XLSX/PDF/result/contract, E2E 12 journeys, coverage: P0 transitions 100%, backend ≥80%, critical domain ≥90%

---

## 9. แผนส่งมอบ 8 เดือน (เอกสาร 09, 16)

สมมติฐาน: M1 = ก.ค. 2026 → M8 = ก.พ. 2027 · Sprint ละ 2 สัปดาห์ 16 sprints (2026-07-13 → 2027-02-28)

| Phase | ช่วง | Milestone |
|---|---|---|
| 1 Requirement Baseline | M1 | MS1 Requirements Approved (31 ก.ค. 2026) |
| 2 Domain/UX/Test Design | M1–M2 | MS2 Design Freeze (31 ส.ค.) |
| 3 Platform Foundation | M2–M3 | MS3 Vertical Slice (30 ก.ย.) |
| 4 Reservation & Renewal | M3–M4 | MS4 Exact-Room Flow (31 ต.ค.) |
| 5 SCB Payment | M4–M5 | MS5 Payment Flow (30 พ.ย.) |
| 6 Operations/Contracts/Handoff | M5–M6 | MS6 Feature-Complete (31 ธ.ค.) |
| 7 Hardening/UAT | M6–M7 | MS7 UAT Accepted (31 ม.ค. 2027) |
| 8 Stabilization/Handover | M7–M8 | MS8 Final Handover (28 ก.พ.) |

ลำดับ sprint: S0 เก็บไฟล์ตัวอย่าง/ปิด format → S1 domain/ERD/RBAC/UX freeze → S2 platform+auth → S3 room master → S4 room browser → S5 roommate+atomic holds → S6 payment hold/renewal/manual → S7 pricing/obligations → S8 XLSX export → S9 returned PDF → S10 result+confirmation → S11 contracts/key → S12 handoff/reports/audit → S13 hardening → S14 UAT → S15 release

---

## 10. คำถามค้าง (Open Questions ที่ต้องได้คำตอบจาก stakeholder)

**สำคัญสูง (บล็อกดีไซน์/นโยบาย):**
1. ผู้ได้รับยกเว้นค่าธรรมเนียม (อาจารย์ที่ปรึกษาหอ) — ยกเว้นไม่ออกบิล / บิลศูนย์บาท / นอกระบบ?
2. Ref.2 กรณีผ่อนรายเทอม — `ROOM2569` ซ้ำ หรือ `ROOM2569T1/T2`?
3. ROOM กับ HL อยู่ batch SCB เดียวกันได้ทุกกรณีหรือไม่ (บัญชีปลายทางต่างกัน)?
4. Field เฉพาะบุคคลบนหน้า PDF ตอบกลับคืออะไร / ลำดับหน้า / มี manifest ไหม? (ต้องได้ตัวอย่างคู่รูมเมต Ref ซ้ำ)
5. คอลัมน์จริงของรายงานผลชำระ SCB?
6. นโยบายสุดท้าย จ่าย 1 คน อีกคนไม่จ่าย — ยกเลิกกลุ่ม / เปลี่ยนเหมาห้อง / หาคนใหม่ / staff ตัดสิน?
7. สถานะไหนถือว่า "ได้ห้องแน่นอน" อย่างเป็นทางการ (คำถามวิกฤติที่สุด — คุมกติกา lifecycle ทั้งหมด)?
8. ปฏิทิน renewal จริง (เปิด/ปิด/deadline คนแทน/แปลงเหมาห้อง/วันเปิดห้องเหลือ)
9. Template สัญญา + จำนวนสำเนา + เอกสารแนบ + retention
10. คอลัมน์ university handoff/correction export
11. ชื่อตำแหน่ง staff จริง + scope สิทธิ์แต่ละคน
12. แหล่งข้อมูลขนาดห้อง/floor plan ที่เชื่อถือได้
13. วันหยุดประจำสัปดาห์ของเจ้าหน้าที่ตรวจเงิน (คิววันทำการ)

**ไฟล์ตัวอย่างที่ต้องขอ (Sprint 0):** SCB blank template, PDF ตอบกลับจริง (มีคู่รูมเมต), รายงานผล SCB, room master + ผัง, ราคา shared/whole/HL, template สัญญา + ฟอร์มกุญแจ, ไฟล์ handoff + ตัวอย่าง correction, รายชื่อ role

---

## 11. สิ่งที่ห้ามพูด/ห้ามทำ (สำหรับรายงานและพรีเซนต์ — เอกสาร 06, 10)

ห้ามพูด: "ระบบสร้าง QR เอง" / "Ref.1+Ref.2 ไม่ซ้ำต่อคน" / "กดจองแล้วได้ห้องทันที" / "เราจะแทน SCB หรือ ERP" / "ทุกหอใช้ flow เดียวกัน"
ใช้แทน: "ระบบเตรียมข้อมูลและเชื่อมขั้นตอนกับโปรแกรม SCB เดิมผ่านไฟล์" / "ระบบดูแลห้องจริง กลุ่มผู้พัก และสถานะก่อนส่งต่อระบบทางการ" / "ข้อมูลเดิมและรายการแก้ไขเก็บประวัติครบ"
ทุกค่าใน slide ต้องติดป้าย: Confirmed by stakeholder / Current product decision / Provisional design assumption / Need verification

**Demo story แนะนำ:** ห้อง A101 (HL shared) — 2 คนจับกลุ่ม → leader จอง → ยืนยัน 15 นาที → 4 obligations (ROOM+HL ×2) → export Excel → match PDF ที่ Ref ซ้ำกัน → จ่ายครบ → ยืนยัน → 2 สัญญา → สแกน + กุญแจ · แถม: whole-room conversion + payment exception

---

## 12. แผนที่แหล่งข้อมูล (ไฟล์ต้นทางใน `reference/notion/`)

| เอกสาร | เนื้อหา |
|---|---|
| Hub | ทิศทางปัจจุบัน, stack, สรุปการตัดสินใจ, checklist ประชุม |
| 01 PRD | requirements baseline ฉบับเต็ม (source of truth) |
| 02 | โมเดลจอง/รูมเมต/holds + entities |
| 03 | UX ผู้สมัคร + staff (หน้าจอครบ + Figma priority) |
| 04 | สถาปัตยกรรม + modules + API + permissions |
| 05 | Workflow ปฏิบัติการ + edge cases + dashboard/รายงาน |
| 06 | Research + slide outline 12 หน้า + demo story |
| 07 | ประวัติ pivot + validated facts |
| 08 | กติกาการเงิน + lifecycle เอกสาร/ผลชำระ |
| 09 | แผน 8 เดือน + milestones + high-risk tests |
| 10 | Agenda ประชุม stakeholder + คำถาม 12 ข้อ + สคริปต์ |
| 11 | Tech stack ตัดสินใจสุดท้าย + DB constraints + package layout |
| 12 | สเปก SCB export/PDF (canonical) |
| 13 | ขอบเขต integration ระบบภายนอก |
| 14 | PDPA ฉบับเต็ม (มาตรา → ผลต่อระบบ) |
| 15 | Fixtures ทุกโดเมนสำหรับ dev/test |
| 16 | แผน sprint 16 รอบ + migrations 16 ชุด + jobs + release gates |
| 17 | Test-first plan (test catalogue ~140 IDs + E2E 12 + AI task packets) |
| Feature Backlog (CSV) | 83 features + priority/status/module |
| Open Questions (CSV) | 61 ข้อ (Decided/Assumption/Need Verify/Rejected) |
| Payment Rule Matrix (CSV) | 15 กฎชำระเงินรายหอ/ประเภทผู้สมัคร |

> ไฟล์ต้นทางเป็น Notion HTML export — หากต้องการอ่านเป็น plain text สามารถแปลงใหม่ได้ด้วยสคริปต์ strip-HTML ง่าย ๆ (ลบแท็ก/แปลง entity) จากโฟลเดอร์ `reference/notion/`
