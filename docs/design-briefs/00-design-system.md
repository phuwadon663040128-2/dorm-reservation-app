# 00 — Design System & กติกาการออกแบบ (แนบไฟล์นี้ทุกครั้ง)

> อ่านไฟล์นี้ให้จบก่อนออกแบบจอใด ๆ ค่าทุกค่าในนี้คือของจริงจากโค้ด ไม่ใช่ข้อเสนอ

---

## 1. บริบทของระบบ

เว็บแอปจองหอพักนักศึกษาของมหาวิทยาลัยขอนแก่น (Pilot: วรเรสซิเดนซ์ / หอ 8 หลัง + หอพักวรอินเตอร์)
แบ่งเป็นฝั่งนักศึกษา (public) และ **ฝั่งเจ้าหน้าที่ (back-office)** — บรีฟชุดนี้ออกแบบเฉพาะฝั่งเจ้าหน้าที่

**ผู้ใช้:** เจ้าหน้าที่หอพักและผู้ดูแลระบบ ทำงานบนเดสก์ท็อป 1440px เป็นหลัก
งานคือ "จอปฏิบัติการ" — ดูรายการเยอะ ๆ กรอง ค้นหา ตรวจสอบสถานะ แล้วกดอนุมัติ/ปฏิเสธ/ส่งออกไฟล์
**ความหนาแน่นของข้อมูลและการอ่านตารางได้เร็ว สำคัญกว่าความสวยหรู**

**ภาษา UI เป็นภาษาไทยทั้งหมด** ยกเว้นศัพท์เทคนิคที่ทับศัพท์อยู่แล้ว: Dashboard, Audit log,
Export batch, SLIPS, hold, Ref.1/Ref.2, exception, override, checksum, idempotent

---

## 2. Tech stack (แบบที่ออกมาต้องอยู่ในกรอบนี้)

- Vue 3 `<script setup lang="ts">` + Vue Router + Pinia
- **Tailwind CSS v4** (`@theme inline`, token เป็น CSS variable)
- **shadcn-vue** — Button, Badge, Card, Table, Select, Input, Label, Switch, Dialog, Alert, Separator, Empty, Sidebar
- ไอคอน **`@lucide/vue`** เท่านั้น — import แบบ `import { TimerIcon } from '@lucide/vue'`
- toast ใช้ `vue-sonner` (`import { toast } from 'vue-sonner'`)
- **ห้ามใช้ asset ภายนอกเพิ่ม** (รูป / ฟอนต์ / CDN / ไลบรารีชาร์ต) — self-contained เท่านั้น

---

## 3. ฟอนต์

```
--font-sans: "Geist", "IBM Plex Sans Thai", ui-sans-serif, system-ui, sans-serif;
--font-heading: var(--font-sans);   /* หัวข้อใช้ฟอนต์เดียวกัน ต่างที่น้ำหนักเท่านั้น */
```

น้ำหนักที่โหลดไว้: **400 / 500 / 600 / 700**

| ใช้ที่ไหน | คลาส |
|---|---|
| หัวเพจ | `text-xl font-bold tracking-tight sm:text-2xl` |
| คำอธิบายใต้หัวเพจ | `text-sm leading-relaxed text-muted-foreground` |
| หัวข้อ section ในหน้า | `text-base font-semibold` |
| label กลุ่มตัวเลข | `text-sm font-semibold uppercase tracking-wide text-muted-foreground` |
| หัวตาราง | `text-[13px] font-semibold text-foreground` |
| ตัวเลขใหญ่ (StatCard) | `text-3xl font-bold leading-none tracking-tight tabular-nums` |
| รหัส / Ref / checksum / batch id | `font-mono` |

**ตัวเลขทุกที่ต้องใส่ `tabular-nums`** — ยอดเงิน จำนวนห้อง เลขห้อง เวลานับถอยหลัง เลขหน้า PDF
ตัวเลขที่จัดคอลัมน์ให้ใช้ `text-right` ด้วย (เช่น ยอดเงิน)

ตัวเลขนับให้ format ด้วย `.toLocaleString('th-TH')` เมื่ออาจเกิน 1,000

---

## 4. สี — ธีมสว่าง (โทนครีมอบอุ่น + ส้ม)

```
--kku-red: #A73B24        /* สีอัตลักษณ์ มข. — ใช้เป็น accent รอง ไม่ใช่สีหลัก */
--background: #f4efe6     --foreground: #211d18
--card: #ffffff           --card-foreground: #211d18
--popover: #ffffff        --popover-foreground: #211d18
--primary: #ee6f1e        --primary-foreground: #ffffff
--secondary: #ece4d4      --secondary-foreground: #3d3831
--muted: #ece4d4          --muted-foreground: #5d5546
--accent: #faf6ee         --accent-foreground: #3d3831
--destructive: oklch(0.577 0.245 27.325)   --destructive-foreground: #ffffff
--border: #e2d8c4         --input: #e2d8c4         --ring: #ee6f1e
--chart-1..5: #ee6f1e · #A73B24 · #6f675b · #3d3831 · #b8ad97
--radius: 0.75rem
```

## 5. สี — ธีมมืด (น้ำเงินเข้มเกือบดำ + ส้ม)

```
--kku-red: #d96a4a
--background: #0a101d     --foreground: #eef1f6
--card: #101a2c           --card-foreground: #eef1f6
--popover: #12203a        --popover-foreground: #eef1f6
--primary: #f47a20        --primary-foreground: #ffffff
--secondary: #1a2438      --secondary-foreground: #dbe2ec
--muted: #1a2438          --muted-foreground: #a0adc2
--accent: #16213a         --accent-foreground: #dbe2ec
--destructive: oklch(0.704 0.191 22.216)
--border: rgb(255 255 255 / 10%)   --input: rgb(255 255 255 / 14%)   --ring: #f47a20
--chart-1..5: #f47a20 · #d96a4a · #93a0b4 · #dbe2ec · #1a2438
```

ธีมมืดสลับด้วยคลาส `.dark` บน root (`@custom-variant dark (&:is(.dark *))`)

## 6. ความโค้ง

`--radius: 0.75rem` → `sm 0.5rem` / `md 0.625rem` / `lg 0.75rem` / `xl 1rem`

- การ์ด กรอบตาราง กรอบ toolbar → `rounded-xl`
- ปุ่ม ช่องกรอก select → `rounded-md`
- กล่องไอคอน → `rounded-lg`
- badge → แคปซูล (`rounded-4xl`)
- avatar → `rounded-full`

## 7. Sidebar — กฎพิเศษ (ห้ามเปลี่ยน)

Sidebar ฝั่งเจ้าหน้าที่ **ใช้โทนน้ำเงินเข้มทั้งสองธีม ไม่สลับตามธีม** เพื่อแยกเมนูออกจาก
พื้นที่เนื้อหาชัดเจน และให้ตัวหนังสือเมนูขาวคมบนพื้นเข้มเสมอ

```
light:  --sidebar #1f2634   --sidebar-foreground #e8ebf1   --sidebar-accent #2d3648
dark :  --sidebar #0d1526   --sidebar-foreground #eef1f6   --sidebar-accent #1e2a44
ทั้งคู่: --sidebar-primary #ee6f1e (dark: #f47a20)  --sidebar-border rgb(255 255 255 / 10%)
```

เมนูที่ active = **พื้นส้มทึบ + ตัวหนังสือขาว** ไม่ใช่แค่ขีดข้าง — ให้รู้ตำแหน่งแม้เหลือบมอง

## 8. สีสถานะ (badge variants ที่มีอยู่แล้ว — ใช้ตัวนี้ ห้ามคิดใหม่)

```
default     : bg-primary text-primary-foreground
secondary   : bg-secondary text-secondary-foreground
outline     : border-border text-foreground
ghost       : hover:bg-muted hover:text-muted-foreground
success     : bg-emerald-600/10 text-emerald-700  | dark: bg-emerald-400/15 text-emerald-300
warning     : bg-amber-500/15   text-amber-800    | dark: bg-amber-400/15   text-amber-300
info        : bg-sky-500/10     text-sky-700      | dark: bg-sky-400/15     text-sky-300
destructive : bg-destructive/10 text-destructive  | dark: bg-destructive/20
```

**หลักการ: พื้นจาง + ตัวหนังสือเข้มของสีเดียวกัน** อ่านชัดทั้งสองธีม ไม่ใช่พื้นทึบสีจัด

**ความหมายของสีในระบบนี้ (ใช้สม่ำเสมอทุกจอ):**

| สี | ความหมาย |
|---|---|
| เขียว (success) | จบขั้นตอนแล้ว / สำเร็จ / ครบถ้วน |
| เหลือง (warning) | รอการกระทำจากคน / ใกล้หมดเวลา |
| ฟ้า (info) | เดินหน้าต่อได้ / ส่งออกไปแล้ว รอฝั่งตรงข้าม |
| แดง (destructive) | ต้องแก้ไข / exception / จับคู่ไม่ได้ |
| เทา (outline) | ยังไม่เริ่ม / สิ้นสุด / ถูกแทนที่ |

---

## 9. คอมโพเนนต์ที่มีอยู่แล้ว — ออกแบบต่อยอด อย่าสร้างซ้ำ

### `StaffPageHeader.vue`
หัวเพจมาตรฐานทุกจอ
```vue
<StaffPageHeader title="ชื่อจอ" description="คำอธิบาย" :icon="SomeIcon">
  <template #meta>  <!-- badge สรุปตัวเลข --> </template>
  <template #actions> <!-- ปุ่มหลักขวามือ --> </template>
</StaffPageHeader>
```
โครง: ไอคอนในกล่อง `size-10 rounded-lg bg-primary/10 text-primary` + `<h1>` + คำอธิบาย `max-w-3xl` + slot ปุ่มขวา

### `StatCard.vue`
การ์ดตัวเลข props: `label`, `value`, `icon`, `to?`, `tone?: 'default'|'warn'|'success'`, `hint?`
โครง: `rounded-xl border bg-card p-4 shadow-sm` · ไอคอนมุมซ้ายบนในกล่อง `size-9 rounded-lg`
· ถ้ามี `to` จะมี chevron ขวาบนที่ขยับตอน hover · tone `warn` ทำให้ border เป็นอำพัน
· **ตัวเลขสีเข้มเสมอ** โทนสีบอกสถานะผ่านแถบไอคอนเท่านั้น

### `.data-table-card` (คลาสใน style.css)
กรอบตารางมาตรฐาน — ครอบ `<Table>` ของ shadcn
```
กรอบ  : overflow-hidden rounded-xl border bg-card shadow-sm
thead : bg-muted/70
th    : h-11 px-3 text-[13px] font-semibold text-foreground
td    : px-3 py-2.5
tr สุดท้าย : border-b-0
```

### คอมโพเนนต์ domain อื่นที่เรียกใช้ได้
| ชื่อ | หน้าที่ |
|---|---|
| `HoldCountdown` | นับถอยหลัง props: `expires-at`, `label` |
| `RoomStatusMeter` | แถบสัดส่วนสถานะห้อง props: `summary` |
| `RoomStatusBadge` | badge สถานะห้อง props: `status` |
| `PermissionGate` | ครอบเนื้อหาที่ต้องมีสิทธิ์ props: `permission` |
| `PlaceholderPage` | หน้ายังไม่ทำ props: `title`, `phase`, `description`, `features[]` |
| `ThemeToggle` | สลับสว่าง/มืด |

### Layout ปัจจุบัน (`StaffLayout.vue`)
- Sidebar `collapsible="icon"` แบ่ง 6 กลุ่มเมนู
- Top bar สูง `h-14`, `sticky top-0 z-40`, `bg-background/95 backdrop-blur`, `border-b`
  ประกอบด้วย: SidebarTrigger · เส้นคั่น · breadcrumb "กลุ่มงาน / ชื่อจอ" · (ชิดขวา) badge บทบาท · ThemeToggle · ปุ่มออกจากระบบ
- พื้นที่เนื้อหา `<main class="min-w-0 flex-1 px-3 py-5 sm:px-4 lg:px-6">`
- ระยะห่างมาตรฐานในหน้า: `space-y-5` (จอทั่วไป) หรือ `space-y-6/7` (จอที่มีหลาย section)

### แม่แบบ toolbar filter (จาก RoomsView — ใช้ซ้ำได้)
```
กรอบ rounded-xl border bg-card p-3 shadow-sm sm:p-4
  └ grid gap-3 md:grid-cols-2 xl:grid-cols-12   (ช่องค้นหากิน 3-4 คอลัมน์ ที่เหลือ 1-2)
  └ แถวล่าง: border-t pt-3, ซ้าย = "พบ X จาก Y", ขวา = select เรียง + ปุ่ม "ล้างตัวกรอง" (โผล่เมื่อมี filter ทำงาน)
```
ตัวนับผลลัพธ์ต้องมี `aria-live="polite"` เสมอ

---

## 10. กฎธุรกิจที่มีผลกับ UI ทุกจอ

- **จำนวนรอบเวลาสำคัญ:** คำเชิญรูมเมทอายุ **48 ชม.** · ยืนยันห้องรอบสอง **15 นาที** · ชำระเงิน **72 ชม.**
- **การจองเป็นกลุ่ม:** กลุ่มละไม่เกิน 2 คน · deadline เดียวร่วมกันทั้งกลุ่ม · ทุกคนต้องชำระครบจึงยืนยันห้องถาวรได้
- **ห้อง HL (เหมาห้อง)** สร้าง obligation แยก 2 รายการ: ROOM + HL
- **Ref.1 + Ref.2 ซ้ำกันได้ระหว่างรูมเมทโดยตั้งใจ** — ห้ามใช้เป็นตัวระบุผู้พักใน UI
- **ทุกการกระทำที่เปลี่ยนสถานะต้องมีเหตุผลบังคับ + บันทึก audit** → ในดีไซน์ต้องมีช่องกรอกเหตุผลใน dialog ยืนยันเสมอ
- **การกระทำสำคัญเป็น idempotent ทำได้ครั้งเดียว** (ยืนยันห้องถาวร, ปล่อย hold, นำเข้าซ้ำ) → ปุ่มต้องสื่อว่า "ทำแล้วทำอีกไม่ได้"
- **สิทธิ์แยกรายส่วนงาน** — เจ้าหน้าที่บางคนเห็นแค่บางกลุ่มเมนู ทุกจอต้องมีสภาพ "ไม่มีสิทธิ์"
- **PDPA** — ไฟล์ export ต้อง minimize ข้อมูลส่วนบุคคล ไฟล์สแกนลายเซ็นเป็น private เสมอ

---

## 11. สามแนวทางที่ต้องทำ (เหมือนกันทุกจอ — ห้ามคิดแนวทางใหม่)

ทั้งสามแนวทางใช้ design token ชุดเดียวกันทั้งหมด ต่างกันที่ **โครงสร้างการจัดวางและลำดับข้อมูล**
ไม่ใช่ต่างที่สีหรือระยะห่าง

### แบบ A — "Console"
> สำหรับเจ้าหน้าที่ที่ใช้จอนี้ทุกวันจนจำได้

- หนาแน่นสูงสุด — จอ 1440px ต้องเห็น **อย่างน้อย 18–20 แถว** โดยไม่เลื่อน
- ตารางเป็นพระเอก ตัดการ์ดสรุปทิ้งหรือยุบเป็นแถบสถิติบรรทัดเดียวใต้หัวเพจ
- Toolbar filter เป็น **แถวเดียวแนวนอน** ไม่ใช่ grid หลายบรรทัด — filter รองซ่อนใน popover "ตัวกรองเพิ่มเติม"
- filter ที่ทำงานอยู่แสดงเป็น **chip ถอดได้** ใต้ toolbar
- คลิกแถว → เปิด **drawer ขวา** กว้าง ~480px ไม่เปลี่ยนหน้า ไม่เสียตำแหน่ง scroll
- รองรับ **เลือกหลายแถว** (checkbox) แล้วมีแถบ bulk action ลอยขึ้นมาด้านล่าง
- คีย์บอร์ด: `/` โฟกัสช่องค้นหา, `j/k` เลื่อนแถว, `Enter` เปิด drawer, `Esc` ปิด

### แบบ B — "Workflow"
> สำหรับเจ้าหน้าที่ใหม่ หรืองานที่มีลำดับขั้นและพลาดไม่ได้

- บนสุดคือ **"ต้องทำอะไรต่อ"** — คิวงานที่รอการตัดสินใจ แยกออกจากข้อมูลดิบชัดเจน
- ถ้าจอนั้นเป็นกระบวนการหลายขั้น ให้มี **stepper แนวนอน** บอกว่าตอนนี้อยู่ขั้นไหน ขั้นไหนผ่านแล้ว ขั้นไหนติด
- ข้อมูลจัดกลุ่มตาม **สถานะ** (แท็บหรือ section) ไม่ใช่ตารางรวมแล้วให้กรองเอง
- แต่ละงานที่ต้องตัดสินใจมี **การ์ดพร้อมบริบทครบ** — เห็นแล้วกดได้เลยโดยไม่ต้องเปิดอะไรเพิ่ม
- มีข้อความอธิบายกฎกำกับตรงจุดที่ใช้กฎนั้น (inline hint) ไม่ใช่รวมไว้บนหัวเพจอย่างเดียว
- ยอมให้หนาแน่นน้อยลงเพื่อแลกกับความชัด

### แบบ C — "Focus + Split"
> สำหรับงานตรวจสอบทีละเคสที่ต้องดูรายละเอียดลึก

- แบ่งสองคอลัมน์ถาวร: ซ้าย ~360–420px = **รายการย่อ** (เลื่อนได้เอง) · ขวา = **รายละเอียดเต็มของเคสที่เลือก**
- รายการซ้ายเป็นแถวกระชับ 2 บรรทัด: บรรทัดบน = ตัวระบุ + badge สถานะ, บรรทัดล่าง = ข้อมูลรอง
- ขวามีปุ่มการกระทำทั้งหมดของเคสนั้น + ประวัติ/audit ของเคสนั้นโดยเฉพาะ
- มีปุ่ม **"เคสถัดไป"** เพื่อไล่ตรวจต่อเนื่องโดยไม่ต้องกลับไปคลิกในรายการ
- จำเคสที่เลือกไว้ใน URL (`?id=...`) เพื่อ refresh แล้วไม่หลุด
- ต่ำกว่า `lg` ยุบเป็นหน้าเดียว: แสดงรายการก่อน เลือกแล้วค่อยสไลด์ไปหน้ารายละเอียด

---

## 12. ข้อบังคับ — ใช้กับทุกแนวทาง ทุกจอ

- ต้องดูดี **ทั้งธีมสว่างและธีมมืด** เขียนคลาส `dark:` ให้ครบตั้งแต่แรก ห้ามออกแบบธีมเดียวแล้วค่อยเติม
- ใช้เฉพาะ token ในไฟล์นี้ (`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary/10` …)
  **ห้าม hardcode ค่าสี hex ลงในคลาส** ยกเว้นสีสถานะ emerald/amber/sky ที่ระบุไว้แล้วในข้อ 8
- **ห้ามสื่อสถานะด้วยสีอย่างเดียว** ต้องมีข้อความหรือไอคอนกำกับเสมอ
- เข้าถึงได้: contrast ผ่าน WCAG AA · focus ring เห็นชัด (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`)
  · ปุ่มไอคอนล้วนต้องมี `aria-label` · ตารางใช้ `<TableHead>` ถูกต้อง · ตัวนับผลลัพธ์ `aria-live="polite"`
- ปุ่มที่ทำลายข้อมูลหรือทำได้ครั้งเดียว ต้องผ่าน dialog ยืนยันที่มี **ช่องกรอกเหตุผลบังคับ**
- **คอมเมนต์ในโค้ดเป็นภาษาไทย อธิบาย "ทำไม" ไม่ใช่ "ทำอะไร"** ตามสไตล์เดิมของโปรเจกต์
  ตัวอย่างจากโค้ดจริง: `<!-- จอที่เปิดอยู่ใช้พื้นสีส้มทึบ+ตัวหนังสือขาว ให้รู้ตำแหน่งได้แม้เหลือบมอง -->`
- การกระทำที่ยังไม่ได้ทำจริง ให้ต่อกับ `toast('ต้นแบบ: ... (เฟส P5)')` ตามแบบเดิม

---

## 13. สิ่งที่ต้องส่งกลับทุกจอ

1. **สรุปแนวทางละ 3–4 บรรทัด** — ออกแบบแบบนี้แก้ปัญหาอะไรของเจ้าหน้าที่ และแลกอะไรไป
2. **ไฟล์ `.vue` ที่รันได้จริงของทั้ง 3 แนวทาง** ตั้งชื่อ `<ชื่อจอ>ViewA.vue` / `B` / `C`
   ใช้ import path จริงของโปรเจกต์ (`@/components/ui/...`, `@/stores/...`, `@/lib/labels`)
3. **ไฟล์ HTML หน้าเดียวที่เทียบทั้ง 3 แบบข้าง ๆ กันได้** พร้อมปุ่มสลับสว่าง/มืด
   (ใช้ Tailwind ผ่าน inline style หรือ CSS ที่เขียนเองก็ได้ — ขอแค่เห็นภาพและสลับธีมได้)
4. **ทุกสเตต** ของแต่ละแนวทาง: กำลังโหลด (skeleton) · ไม่มีข้อมูล · ค้นหาไม่พบ · เกิดข้อผิดพลาด
   · ไม่มีสิทธิ์เข้าถึง · ข้อมูลเยอะมาก (pagination หรือ virtual scroll)
5. **ตารางเปรียบเทียบสั้น ๆ** ว่าแต่ละแบบเหมาะกับใคร แล้ว**แนะนำมา 1 แบบพร้อมเหตุผล**
