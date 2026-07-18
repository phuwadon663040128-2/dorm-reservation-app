# EN813701-2026-wad-05 — Phase 1 Project Proposal Slide Content

เอกสารนี้เรียบเรียงจากข้อกำหนดรายวิชาและเอกสารโครงการฉบับล่าสุด สำหรับการนำเสนอ **5–7 นาที**

- **On-slide copy** คือข้อความภาษาอังกฤษพร้อมวางบนสไลด์
- **Speaker note (TH)** คือแนวทางพูดภาษาไทย ไม่ต้องวางทั้งหมดบนสไลด์
- ชื่อไฟล์/ลิงก์สไลด์: `EN813701-2026-wad-05`
- ใช้ตัวอักษรบนสไลด์ไม่น้อยกว่า 14 pt
- ใช้ภาษาอังกฤษบนสไลด์เพื่อให้สอดคล้องกับการนำเสนอครั้งต่อไปของรายวิชา

## Requirement decision ล่าสุด

**ระบบใหม่ไม่เชื่อมต่อ UniPay**

- กล่าวถึง UniPay ได้เฉพาะเมื่ออธิบายระบบเดิมหรือสภาพแวดล้อมเดิม (As-Is)
- ห้ามวาง UniPay เป็น component, API, dependency หรือ future scope ของระบบใหม่
- Payment flow ใหม่คือ **แสดงยอด/เงื่อนไข → ผู้สมัครชำระผ่านช่องทางที่ประกาศ → อัปโหลดสลิป → เจ้าหน้าที่ตรวจสอบ → ผู้จัดการอนุมัติหรือปฏิเสธ**
- การส่งใบสมัครหรืออัปโหลดสลิปยังไม่แปลว่าได้รับห้อง ต้องรอกติกาการยืนยันอย่างเป็นทางการ

---

## Slide 1 — Title (15 seconds)

### On-slide copy

**KKU Affiliated Dormitory Reservation Management System**

**Group:** WAD26-05  
**Course:** EN813701 Web Application Development  
**Academic Year:** 2026

- **Team Leader — 663040117-7** Mr. Thanawat Sombatkamrai
- **Member — 663040128-2** Mr. Phuwadon Thongrong

### Speaker note (TH)

“โครงงานของกลุ่ม WAD26-05 คือระบบบริหารการจองหอพักในกำกับมหาวิทยาลัยขอนแก่น จัดทำโดยนายธนวัฒน์ สมบัติกำไร และนายภูวดล ทองรอง เน้นกระบวนการรับสมัคร ตรวจสอบการชำระเงิน และอนุมัติการจองอย่างเป็นระบบครับ”

> ฉบับร่างกำหนด Member 1 เป็น Team Leader เพื่อให้ตรงข้อกำหนดรายวิชา โปรดยืนยันบทบาทและการสะกดชื่อภาษาอังกฤษตามทะเบียนนักศึกษา

---

## Slide 2 — Motivation: Problem & Users (40 seconds)

### On-slide copy

**One application may pass through many disconnected steps.**

- Applicants must compare dorms, room types, quotas, rules and payment conditions before applying.
- Application data, payment evidence, verification and approval require several staff handoffs.
- Applicants cannot easily see one clear, up-to-date reservation and payment status.
- Manual status and quota updates increase the risk of delay, duplicate evidence and inconsistent records.
- Managers need a searchable work queue, reports and an audit trail for every sensitive decision.

**Daily users**

- KKU student applicants — mobile-first, Thai-first
- Payment-verification staff — evidence and exception review
- Dorm managers/admins — campaign, quota, approval and reporting

**Why it matters:** errors affect money, deadlines and accommodation decisions—not only convenience.

**As-Is context:** UniPay belongs to the existing university payment environment. The proposed system does not connect to it.

### Speaker note (TH)

“ปัญหาไม่ใช่เพียงการกรอกใบสมัคร แต่คือข้อมูลตั้งแต่รอบสมัคร ยอดชำระ สลิป สถานะตรวจสอบ ไปจนถึงการอนุมัติและโควตาไม่ได้อยู่ใน workflow เดียว ผู้สมัครจึงไม่รู้ว่าตอนนี้ต้องทำอะไร ส่วนเจ้าหน้าที่ต้องติดตามหลายขั้นตอนและตรวจย้อนหลังได้ยากครับ”

---

## Slide 3 — Related Work & Competitive Analysis (45 seconds)

### On-slide copy

| Existing solution | Similarities | Gap for this project |
|---|---|---|
| **KKU Central Dormitory Booking** | Online booking, SSO NEXT, booking/invoice printout and room information | The full affiliated-dorm campaign → evidence review → authorized decision → audit workflow is not publicly documented |
| **Suandok Dorm CMU** | University-affiliated dorm information and published reservation steps | KKU-specific applicant types, quotas, verification, decisions and audit are outside its context |
| **Horganice** | Private-rental room/tenant, billing, receipt, slip-confirmation and reporting workflows | Designed for rental operations, not KKU application campaigns and eligibility rules |

**Why our approach is different**

> A Thai-first workflow for KKU affiliated dorms: configurable campaign → application → payment summary → manual slip verification → authorized decision → quota update → report and audit log.

### Speaker note (TH)

“แต่ละระบบแก้คนละบริบท ระบบกลางของ มข. รองรับงานหอกลาง ระบบสวนดอกเป็นตัวอย่างมหาวิทยาลัยที่เผยแพร่ข้อมูลและขั้นตอนการจอง และ Horganice เด่นด้านบริหารผู้เช่าเชิงพาณิชย์ ช่องว่างของเราคือ workflow เฉพาะหอในกำกับของ มข. ที่รวมกติกาใบสมัคร การตรวจสลิป การอนุมัติ โควตา และ audit ไว้ด้วยกันครับ”

### Source footer

- KKU Central: `https://dorm-booking.kku.ac.th/account/login`
- Suandok Dorm CMU: `https://suandokdorm.cmu.ac.th/`
- Horganice: `https://docs.horganice.in.th/faq/`

---

## Slide 4 — Objectives, Scope & Target Users (35 seconds)

### On-slide copy

**Measurable objectives**

1. Deliver one responsive workflow from campaign discovery to an authorized reservation decision.
2. Show the required amount, payment conditions and deadline before every final application submission.
3. Prevent approval beyond the configured room-type quota and flag duplicate payment evidence in automated tests.
4. Record 100% of verification, approval, rejection and override actions with actor, time and reason.
5. Publish at least 5 documented JSON API endpoints, use them from the Vue client and call at least 1 external API.

**In scope (MVP)**

- KKU SSO mock login for applicant/admin UX testing
- Dorm and room-type information, rules and quota
- Campaign creation and applicant-type configuration
- Online application and payment summary
- Manual slip upload, staff verification and re-upload request
- Manager approval/rejection with quota update
- Status tracking, CSV export and audit log

**Out of scope**

- Real KKU SSO or payment-system integration
- Automatic slip verification or direct bank API
- Exact-room selection and roommate/group booking
- Maintenance, utility billing, refunds and native mobile app

**Target users:** KKU applicants/current students; dorm staff, payment-verification staff and managers.

### Speaker note (TH)

“MVP จะเลือกประเภทห้องและบริหารด้วยโควตา ไม่เลือกเลขห้องจริง และไม่ทำการจับคู่รูมเมต จุดวัดผลสำคัญคือไม่อนุมัติเกินโควตา ตรวจสลิปซ้ำได้ และทุกการตัดสินใจตรวจย้อนหลังได้ครับ”

---

## Slide 5 — Personas, Use Cases & User Journey (35 seconds)

### On-slide copy

**Personas**

| Persona | Main goal | Main concern |
|---|---|---|
| **Nicha — Student Applicant** | Find a suitable dorm/room type and apply on mobile | “What do I need to pay, and what is my current status?” |
| **May — Verification Staff** | Review slips and send unclear evidence back | Duplicate, unreadable, wrong-amount or late evidence |
| **Somchai — Dorm Manager** | Open campaigns and decide within quota | Over-quota approval and decisions without traceability |

**Use cases by role**

- **Applicant:** sign in → browse dorms → select applicant type/room type → apply → view payment → upload slip → track status
- **Verification staff:** filter queue → inspect application/slip → verify or request re-upload → record reason
- **Manager:** create campaign → set quota/rules → approve or reject → export report → review audit log

**User journey**

`Campaign Open → Browse Dorms → Apply → Review Payment → Submit → Upload Slip → Verify → Manager Decision → Quota & Status Update`

**Diagram blueprint for the actual slide**

- Draw a system boundary labelled **Affiliated Dorm Reservation System**.
- Place the three actors outside the boundary: Applicant, Verification Staff and Dorm Manager.
- Connect each actor to the listed use cases; render the user journey as one horizontal arrow beneath the use-case diagram.
- **Production requirement:** replace the text lists with an actual three-role use-case/swimlane visual in the final deck.

### Speaker note (TH)

“ระบบแยกหน้าที่ชัดเจน ผู้ตรวจสลิปยังไม่ใช่ผู้อนุมัติห้องโดยอัตโนมัติ และผู้จัดการต้องเห็นทั้งใบสมัคร ผลตรวจ และโควตาก่อนตัดสินใจครับ”

---

## Slide 6 — Interface Prototype (50 seconds)

### On-slide copy

**Replace this list with four large, readable screenshots in the actual deck**

1. **KKU SSO Mock Login** — applicant/admin role comes from the mock session; no top-bar role switch
2. **Dorm & Room-Type Discovery** — dorm details, rules, quota and payment condition
3. **Application & Payment Evidence** — applicant type, payment summary, slip upload and clear deadline
4. **Staff Verification Dashboard** — filters, evidence preview, re-upload/verify action and decision history

**Production requirement:** embed four real prototype screenshots; do not submit this instruction as the finished slide.

**Applicant navigation:** `Login → Dorms → Application → Payment → My Status`

**Staff navigation:** `Dashboard → Campaigns → Applications → Payment Review → Reports & Audit`

**Visible statuses:**  
`Submitted · Waiting for Payment · Slip Uploaded · Verifying · Needs Re-upload · Reserved · Rejected · Expired`

### Speaker note (TH)

“ตอนเดโมให้เดินหนึ่งเรื่อง: นักศึกษาเลือกประเภทผู้สมัครและประเภทห้อง เห็นยอดก่อนส่ง อัปโหลดสลิป จากนั้นเข้าเจ้าหน้าที่ผ่านหน้า login เพื่อตรวจสลิป และเข้าผู้จัดการเพื่ออนุมัติหรือปฏิเสธ สถานะทุกขั้นต้องเห็นชัดครับ”

> หลีกเลี่ยงการใช้ exact-room picker หรือ roommate flow เป็นพระเอกของ Proposal เพราะอยู่นอก MVP ปัจจุบัน

---

## Slide 7 — Tools & Technology (25 seconds)

### On-slide copy

| Layer | Technology | Status / purpose |
|---|---|---|
| Frontend | **Vue 3 + TypeScript + Vite** | Current frontend prototype |
| UI | **Tailwind CSS 4, shadcn-vue, Reka UI, Lucide** | Responsive reusable components |
| State / Forms | **Pinia, Vue Router, VeeValidate + Zod** | Client state, navigation and validation |
| Backend API | **Go + chi** | Planned REST JSON API |
| Database | **PostgreSQL** | Campaigns, applications, quotas, statuses and audit events |
| File storage | **Private S3-compatible storage** | Payment slips; no public file URLs |
| Hosting | **Frontend target: Vercel**; **planned backend: Docker Compose + Nginx** | Reproducible deployment |
| Development | Git/GitHub and VS Code (current); Postman and Figma/draw.io (planned) | Collaboration, API and UX design |

**Prototype note:** KKU SSO is simulated for UX testing; it is not a real authentication integration.

### Speaker note (TH)

“Frontend ที่มีอยู่ใช้ Vue 3, Vite และ TypeScript ส่วน API วางแผนใช้ Go กับ PostgreSQL สลิปจะเก็บเป็นไฟล์ private และเปิดผ่านสิทธิ์ของ backend เท่านั้นครับ”

---

## Slide 8 — API Integration Strategy & Architecture (45 seconds)

### On-slide copy

**External API we will call**

`GET https://nominatim.openstreetmap.org/search`

- **Input:** `q`, `format=jsonv2`, `limit=1`
- **Output:** `display_name`, `lat`, `lon`, `boundingbox`
- **User value:** locate each dorm on its detail page from a verified address
- **Implementation:** server-side proxy/cache; identifying User-Agent; visible © OpenStreetMap contributors attribution; no autocomplete; ≤1 request/second; configurable provider/static fallback

**Representative APIs developed by our team**

| Method | Endpoint | Input → Output |
|---|---|---|
| `GET` | `/api/v1/campaigns/open` | applicant type → campaigns, rules and deadlines |
| `POST` | `/api/v1/applications` | form + applicant/room type → id, status and payment summary |
| `PATCH` | `/api/v1/staff/payments/{id}` | decision + reason → verification status/audit id |

Full input/output contracts are in Appendix A.

**Architecture diagram**

`Applicant / Staff Browser → Vue Client → Our REST API → PostgreSQL`  
`                                           ↘ Private Slip Storage`  
`                                           ↘ Nominatim API (location only)`

Replace this text blueprint with a real architecture diagram in the final deck.

**Boundary:** payment evidence is uploaded and reviewed by authorized staff; there is no payment-platform connection in the proposed architecture.

**Data ownership:** applicants submit application/evidence data; authorized dorm staff maintain campaigns, rules, quotas and decisions; Nominatim supplies geocoding data. The student developers do not manually maintain operational records.

### Speaker note (TH)

“Client ต้องเรียก API ที่เราพัฒนา และระบบต้องเรียก external API อย่างน้อยหนึ่งตัว เราจึงใช้ Nominatim เพื่อแปลงที่อยู่หอเป็นพิกัด ส่วนการชำระเงินเป็นการอัปโหลดและตรวจสลิปโดยเจ้าหน้าที่ ไม่มี payment API ครับ”

### Source footer

- Nominatim API: `https://nominatim.org/release-docs/latest/api/Search/`
- Usage policy: `https://operations.osmfoundation.org/policies/nominatim/`

---

## Slide 9 — Methodology & Weekly Timeline (30 seconds)

### On-slide copy

**Method:** Agile, 1-week iterations, weekly review, vertical-slice delivery and risk-based testing.

**Tentative weekly plan — confirm W1 and final dates against the course calendar.**

| Week | Date | Deliverable | Week | Date | Deliverable |
|---|---|---|---|---|---|
| W1 | 13–19 Jul | Requirements & problem validation | W9 | 7–13 Sep | Staff payment-verification queue |
| W2 | 20–26 Jul | Proposal & MVP freeze | W10 | 14–20 Sep | Manager decision + quota update |
| W3 | 27 Jul–2 Aug | Personas, use cases, wireframes | W11 | 21–27 Sep | Applicant status tracking |
| W4 | 3–9 Aug | ERD, API contract, test plan | W12 | 28 Sep–4 Oct | Reports, CSV export, audit log |
| W5 | 10–16 Aug | Dorm catalogue & campaigns | W13 | 5–11 Oct | Public API + external geocoding API |
| W6 | 17–23 Aug | Application & applicant types | W14 | 12–18 Oct | Integration, security, responsive tests |
| W7 | 24–30 Aug | Payment rules & summary | W15 | 19–25 Oct | UAT, fixes, docs, demo video |
| W8 | 31 Aug–6 Sep | Private slip upload | W16 | 26 Oct–1 Nov | Deploy & final presentation |

**Milestones:** M1 Proposal (W2) · M2 UX/API freeze (W4) · M3 Applicant flow (W8) · M4 Staff flow (W12) · M5 UAT (W15) · M6 Release (W16)

### Speaker note (TH)

“เราแบ่งงานเป็น vertical slice ก่อน คือให้ใบสมัครหนึ่งรายการเดินได้ครบตั้งแต่ applicant ถึง staff decision แล้วค่อยเพิ่มรายงานและ hardening ช่วงท้ายครับ”

---

## Slide 10 — Risks & Mitigation (25 seconds)

### On-slide copy

| Risk | Mitigation |
|---|---|
| Official payment/confirmation rules are incomplete | Store rules per campaign/dorm/applicant type; label assumptions; obtain written confirmation before release |
| Duplicate, unreadable or incorrect slips | File hash/reference checks, exception queue, re-upload status and mandatory reviewer reason |
| Two approvals exceed the last quota | Database transaction/row lock and concurrent approval tests |
| Personal and payment data exposure | Mock demo data, RBAC, private file storage, short-lived access and audit logs |
| Two-person team and broad backlog | Freeze MVP; keep exact-room, roommate and non-reservation services out of scope |
| External map API unavailable/rate-limited | Cache verified coordinates and keep a static-location fallback |

### Speaker note (TH)

“ความเสี่ยงสูงสุดคือกติกาที่ยังไม่ยืนยัน สลิปผิดหรือซ้ำ และการอนุมัติเกินโควตา เราจึงทำกติกาให้ตั้งค่าได้ มี exception queue และใช้ transaction ที่ฐานข้อมูลครับ”

---

## Slide 11 — Conclusion, Success Metrics & Next Steps (20 seconds)

### On-slide copy

**Expected outcome**

A working applicant portal, staff workflow and JSON API that make affiliated-dorm applications, manual payment verification, decisions, quotas and audit history traceable in one system.

**Success metrics**

- 100% of applicants see payment amount and conditions before final submission
- 0 approvals beyond configured quota in automated concurrency tests
- 100% of sensitive status changes have actor, timestamp and reason
- ≥80% task-completion rate in UAT across applicant, staff and manager scenarios
- Real-user validation with at least 1 KKU student and 1 affiliated-dorm staff member; record feedback and resulting changes
- Deployed web client calls our API and demonstrates at least one external API call

**Next steps**

1. Confirm the provisional team-leader assignment and English spelling of member names.
2. Confirm pilot dorms, room types, quota, payment rules and the official “reservation confirmed” condition.
3. Obtain sample application forms, payment instructions/slips and export fields.
4. Freeze the API/ERD and implement one end-to-end vertical slice.

### Speaker note (TH)

“ผลลัพธ์คือระบบเดียวที่ทำให้ผู้สมัครเห็นสิ่งที่ต้องทำ และทำให้เจ้าหน้าที่ตรวจการชำระเงิน ตัดสินใจ อัปเดตโควตา และตรวจย้อนหลังได้ โดยยังไม่กล่าวว่าผู้สมัครได้ห้องจนกว่ากติกายืนยันอย่างเป็นทางการครับ”

---

## Appendix A — Developed API Draft

ภาคผนวกนี้ใช้ตอบคำถามเรื่อง input/output ของ Web API ไม่ต้องนำเสนอทั้งหมดใน 5–7 นาที

| Method | Endpoint | Main input | Success output | Important errors |
|---|---|---|---|---|
| `GET` | `/api/v1/dorms` | `lang?` | `[{id,name,location,facilities}]` | `500` |
| `GET` | `/api/v1/campaigns/open` | `applicant_type?` | `[{id,dorm,opens_at,closes_at,rules}]` | `400` |
| `GET` | `/api/v1/dorms/{id}/room-types` | `id`, `campaign_id` | `[{id,name,quota_total,quota_available,payment_condition}]` | `404` |
| `POST` | `/api/v1/applications` | campaign/applicant/room type/form/consent | `{application_id,status,payment_summary}` | `400`, `409`, `422` |
| `GET` | `/api/v1/applications/{id}` | `id` + session | `{application,status,timeline,payment}` | `401`, `403`, `404` |
| `POST` | `/api/v1/applications/{id}/slips` | file + `paid_at`, `amount`, `reference?` | `{slip_id,status:"SLIP_UPLOADED"}` | `400`, `409`, `413`, `415` |
| `PATCH` | `/api/v1/staff/payments/{id}` | `{decision:"VERIFY"|"REUPLOAD",reason}` | `{payment_status,audit_id}` | `401`, `403`, `409`, `422` |
| `PATCH` | `/api/v1/manager/applications/{id}` | `{decision:"APPROVE"|"REJECT",reason}` | `{reservation_status,quota_available,audit_id}` | `401`, `403`, `409` |
| `GET` | `/api/v1/admin/reports/applications.csv` | campaign/dorm/status filters | CSV file | `401`, `403` |

### Example JSON

```json
{
  "campaign_id": "CAM-2026-01",
  "applicant_type": "NEW_STUDENT",
  "room_type_id": "RT-FAN-DOUBLE",
  "consent": true
}
```

```json
{
  "application_id": "APP-000125",
  "status": "WAITING_FOR_PAYMENT",
  "payment_summary": {
    "amount": 0,
    "currency": "THB",
    "due_at": "<configured deadline>",
    "condition_label": "<configured by campaign>"
  }
}
```

> ใช้ `0` และ placeholder จนกว่าจะยืนยันจำนวนเงินและกำหนดเวลา ห้ามเดาตัวเลขจริง

---

## Appendix B — Scoring Checklist (10 points)

| Criterion | Points | Covered in |
|---|---:|---|
| Motivation | 2 | Slide 2: problem, value and daily users |
| Related Work Analysis | 2 | Slide 3: 3 systems, comparison and differentiation |
| Interface Prototype | 2 | Slides 5–6: personas, use cases, journey, screens and navigation |
| Methodology & Timeline | 1 | Slides 9–10: W1–W16, dates, milestones and risks |
| API Integration Strategy | 1 | Slide 8 + Appendix A: external URL/value, developed API input/output and architecture |
| Slide Quality & Presentation | 2 | 11-slide flow, readable screenshots, ≥14 pt and rehearsed 5–7 minutes |

---

## Appendix C — Presenter Guardrails

| Avoid saying | Say instead |
|---|---|
| “Submitting means the student gets a room.” | “Submission creates an application; confirmation depends on verified payment and an authorized decision under the official rule.” |
| “The system verifies slips automatically.” | “Authorized staff verify the uploaded evidence; the system records the result and exceptions.” |
| “Students select an exact room and roommate.” | “The MVP selects a room type under a configured quota.” |
| “The KKU SSO mock is real authentication.” | “It is a role-based UX simulation for the prototype.” |
| “The new system connects to the university payment platform.” | “Existing payment tools are As-Is context only; the proposed system uses manual evidence upload and staff verification.” |

Do not show scoped-out Roommate, Groups, SCB Export or exact-room screens in proposal screenshots/navigation.

## Appendix D — Evidence Sources

Local sources:

- `EN813701 Web Application Development Project Instructions.docx`
- Project documents 03, 07 and 08 listed in `AGENTS.md`
- Feature Backlog, Open Questions & Assumptions and Payment Rule Matrix CSV files
- Current Vue prototype under `src/`

Official external references:

- `https://dorm-booking.kku.ac.th/account/login`
- `https://suandokdorm.cmu.ac.th/`
- `https://docs.horganice.in.th/faq/`
- `https://nominatim.org/release-docs/latest/api/Search/`
- `https://operations.osmfoundation.org/policies/nominatim/`

---

## Recommended 6:05 Timing

Title 0:15 · Motivation 0:40 · Related Work 0:45 · Objectives/Scope 0:35 · Personas/Journey 0:35 · Prototype 0:50 · Technology 0:25 · API 0:45 · Timeline 0:30 · Risks 0:25 · Conclusion 0:20
