# Figma Handoff — KKU Affiliated Dorm (ยึดเว็บปัจจุบัน)

เอกสารนี้ใช้สร้างงานต่อใน Figma โดยยึด implementation ปัจจุบัน ไม่ใช่การเสนอ redesign ใหม่

Source of truth หลัก:

- `src/style.css`
- `src/layouts/PublicLayout.vue`
- `src/layouts/ApplicantLayout.vue`
- `src/layouts/StaffLayout.vue`
- `src/views/public/LandingView.vue`
- `src/views/public/LoginView.vue`
- `src/views/applicant/ApplicationView.vue`
- `src/views/staff/DashboardView.vue`
- `src/components/ui/*` และ `src/components/domain/*` ที่แต่ละหน้าเรียกใช้

ค่าทั้งหมดในเอกสารเป็น px เว้นแต่ระบุเป็นอย่างอื่น ค่า “คำนวณที่ Desktop 1440” คือผลจาก max-width, padding และ grid ในโค้ดจริง

---

## 1. โครงสร้างไฟล์ Figma แบบ Page เดียว

ใช้ Figma Page เดียวชื่อ:

`KKU Dorm — Current Web`

ภายใน Page ให้สร้าง top-level Frame/Section ดังนี้:

1. `00 — Foundations`
2. `01 — Components`
3. `10 — Homepage / Desktop / Light`
4. `10 — Homepage / Desktop / Dark`
5. `11 — Login / Desktop / Light`
6. `11 — Login / Desktop / Dark`
7. `12A — Application / Step 1`
8. `12B — Application / Step 2`
9. `12C — Application / Step 3`
10. `12D — Application / Step 4`
11. `13 — Staff Dashboard / Desktop / Light`
12. `13 — Staff Dashboard / Desktop / Dark`
13. Mobile frames กว้าง `390px` วางไว้ใต้ desktop frame ที่เกี่ยวข้อง

การจัดบน canvas:

- วาง Foundations และ Components ไว้แถวบน
- วาง screen frames เรียงซ้ายไปขวา
- ระยะระหว่าง top-level frames `160px`
- ระยะระหว่าง Light/Dark ของจอเดียวกัน `80px`
- ตั้งชื่อ layer ด้วยรูปแบบ `Section / Component / State` เช่น `Header / Nav Item / Active`
- Top-level screen ใช้ Clip content และ Auto Layout แนวตั้ง
- ความกว้าง desktop หลัก `1440px`; ความสูงใช้ Hug contents ไม่ต้องบังคับให้เท่ากันทุกจอ

หมายเหตุ: ระยะ `160px` และ `80px` ข้างต้นเป็นระยะจัด canvas เท่านั้น ไม่ใช่ spacing ภายใน UI

---

## 2. Breakpoints และหน่วยพื้นฐาน

| Breakpoint | ความกว้าง | พฤติกรรมหลัก |
|---|---:|---|
| Mobile reference | `390` | ทุก grid หลักเหลือ 1 คอลัมน์ |
| `sm` | `640` | padding แนวนอนเพิ่ม, grid บางชุดเป็น 2 คอลัมน์ |
| `md` | `768` | แสดง desktop stepper, search bar เป็นแนวนอน |
| `lg` | `1024` | Login เป็น 2 คอลัมน์, application มี sidebar |
| `xl` | `1280` | แสดง public/applicant desktop nav, Staff Dashboard มี right panel |
| Desktop reference | `1440` | ขนาดหลักสำหรับสร้าง Figma frames |

Spacing scale ที่ใช้บ่อย:

| Token | px | ใช้กับ |
|---|---:|---|
| `0.5` | `2` | ช่องว่างเล็ก, segment gap |
| `0.75` | `3` | Tabs padding |
| `1` | `4` | gap เล็ก, nav gap |
| `1.5` | `6` | button gap, right action gap |
| `2` | `8` | field gap, sidebar padding, control gap |
| `2.5` | `10` | compact card gap, vertical list gap |
| `3` | `12` | mobile gutter, card gap, nav padding |
| `3.5` | `14` | campaign chip horizontal padding |
| `4` | `16` | card padding, grid gap |
| `5` | `20` | section gap, desktop public gutter, staff vertical padding |
| `6` | `24` | main section gap, card grid gap |
| `8` | `32` | large spacing |
| `10` | `40` | section padding, logo/step size |
| `12` | `48` | homepage two-column gap |
| `14` | `56` | desktop search button height |
| `16` | `64` | public/applicant header height |

---

## 3. Foundations

### 3.1 Typography

Font stack:

`Geist`, `IBM Plex Sans Thai`, `ui-sans-serif`, `system-ui`, `sans-serif`

ใน Figma แนะนำให้ใช้:

- ข้อความภาษาไทย: `IBM Plex Sans Thai`
- ตัวเลข/อังกฤษ: `Geist`
- น้ำหนักที่ใช้: `400`, `500`, `600`, `700`

| Text style | Size / Line height | Weight | ใช้กับ |
|---|---|---:|---|
| Hero / Desktop | `48 / 60` | `700` | Hero homepage และ Login ฝั่งภาพ |
| Hero / Mobile | `25.6 / 36` | `700` | Hero homepage mobile |
| Display / 36 | `36 / 40` | `700` | Login ที่ breakpoint `sm` |
| Heading / 30 | `30 / 36` | `700` | Application title desktop |
| Heading / 24 | `24 / 32` | `700` | Page title, section title desktop |
| Heading / 20 | `20 / 28` | `700` | Section title mobile |
| Card title | `16 / 22` | `500–600` | Card headers |
| Body | `16 / 24` | `400` | Intro/hero description |
| Body small | `14 / 20` | `400` | UI body, form labels, nav |
| Label | `14 / 20` | `500` | Form labels, buttons |
| Caption | `12 / 16` | `400–500` | Hints, badge, metadata |
| Micro | `11 / 14` | `500–600` | Mobile section labels, scenario hints |
| Stat number | `30 / 30` | `700` | Staff stat cards;ใช้ tabular numbers |

กติกาตัวเลข:

- ยอดเงิน, จำนวนห้อง, room number, countdown, batch/page reference ใช้ `tabular-nums`
- Batch ID, checksum และ reference เชิงเทคนิคใช้ monospace

### 3.2 Color tokens — Light

| Token | ค่า | การใช้งาน |
|---|---|---|
| Background | `#F4EFE6` | พื้นหลังหลักโทนครีม |
| Foreground | `#211D18` | ตัวอักษรหลัก |
| Card | `#FFFFFF` | การ์ดและ surface |
| Card foreground | `#211D18` | ข้อความบนการ์ด |
| Popover | `#FFFFFF` | Dropdown/Popover/Dialog |
| Primary | `#EE6F1E` | ปุ่มหลัก, active nav, icon สำคัญ |
| Primary foreground | `#FFFFFF` | ข้อความบน Primary |
| Secondary / Muted | `#ECE4D4` | พื้นรอง, tabs, subtle block |
| Secondary foreground | `#3D3831` | ข้อความบน Secondary |
| Muted foreground | `#5D5546` | คำอธิบาย/metadata |
| Accent | `#FAF6EE` | Hover/subtle selected surface |
| Border / Input | `#E2D8C4` | เส้นขอบและ input border |
| Ring | `#EE6F1E` | Focus ring |
| KKU red | `#A73B24` | ชื่อมหาวิทยาลัย/brand accent รอง |
| Destructive | `oklch(0.577 0.245 27.325)` หรือประมาณ `#DC2626` | Error/destructive |

### 3.3 Color tokens — Dark

| Token | ค่า | การใช้งาน |
|---|---|---|
| Background | `#0A101D` | พื้นหลังหลักโทนน้ำเงินเข้ม |
| Foreground | `#EEF1F6` | ตัวอักษรหลัก |
| Card | `#101A2C` | การ์ด |
| Popover | `#12203A` | Dropdown/Popover/Dialog |
| Primary | `#F47A20` | ปุ่ม/active state |
| Primary foreground | `#FFFFFF` | ข้อความบน Primary |
| Secondary / Muted | `#1A2438` | พื้นรอง |
| Secondary foreground | `#DBE2EC` | ข้อความบน Secondary |
| Muted foreground | `#A0ADC2` | ข้อความรอง |
| Accent | `#16213A` | Hover/subtle selected surface |
| Border | `rgba(255,255,255,0.10)` | เส้นขอบทั่วไป |
| Input | `rgba(255,255,255,0.14)` | Input border/background |
| Ring | `#F47A20` | Focus ring |
| KKU red | `#D96A4A` | Brand accent รอง |
| Destructive | `oklch(0.704 0.191 22.216)` หรือประมาณ `#FB2C36` | Error/destructive |

### 3.4 Staff sidebar colors

| Token | Light app | Dark app |
|---|---|---|
| Sidebar background | `#1F2634` | `#0D1526` |
| Sidebar foreground | `#E8EBF1` | `#EEF1F6` |
| Active/Primary | `#EE6F1E` | `#F47A20` |
| Active foreground | `#FFFFFF` | `#FFFFFF` |
| Hover/Accent | `#2D3648` | `#1E2A44` |
| Border | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.10)` |

### 3.5 Status colors

| Status | Light surface / text | Dark surface / text |
|---|---|---|
| Success | `#059669 @ 10%` / `#047857` | `#34D399 @ 15%` / `#6EE7B7` |
| Warning | `#F59E0B @ 15%` / `#92400E` | `#FBBF24 @ 15%` / `#FCD34D` |
| Info | `#0EA5E9 @ 10%` / `#0369A1` | `#38BDF8 @ 15%` / `#7DD3FC` |
| Error | Destructive `@ 10%` / Destructive | Destructive `@ 20%` / Destructive |

Room Status Meter:

- ว่าง: `#059669` / dark `#34D399`
- ถูกจองชั่วคราว: `#F59E0B` / dark `#FBBF24`
- จองแล้ว: `#0284C7` / dark `#38BDF8`
- ไม่เปิดให้จอง: `#78716C` / dark `#6B7280`

ห้ามใช้สีเป็นตัวสื่อสถานะเพียงอย่างเดียว ต้องมี label หรือ icon ร่วมเสมอ

### 3.6 Radius

| ชื่อ | Radius | ใช้กับ |
|---|---:|---|
| Small | `8` | icon box, compact UI |
| Medium | `10` | compact control |
| Large / base | `12` | Button, Input, Alert, Tabs |
| XL | `16` | Card, image card |
| 2XL | `24` | Search panel mobile, booking-step cards |
| Full | `999` | Badge, avatar, pill button |

### 3.7 Border, focus และ shadow

- เส้นขอบมาตรฐาน `1px` สี Border token
- Card มาตรฐานใช้ ring `1px` สี Foreground `10%`
- Focus ใช้ Ring token ความหนา `3px` ที่ opacity `50%`
- Card shadow-sm: `0 1px 2px rgba(0,0,0,0.05)`
- Login card shadow-lg: `0 10px 15px -3px rgba(0,0,0,0.10)` และ `0 4px 6px -4px rgba(0,0,0,0.10)`
- Homepage search shadow-xl: `0 20px 25px -5px rgba(0,0,0,0.10)` และ `0 8px 10px -6px rgba(0,0,0,0.10)`
- Header ใช้ background opacity `95%` พร้อม backdrop blur

---

## 4. Shared components

### 4.1 Button

| Size | Height | Padding X | Gap | Radius | Icon |
|---|---:|---:|---:|---:|---:|
| Default | `32` | `10` | `6` | `12` | `16` |
| Small | `28` | `10` | `4` | `10–12` | `14` |
| Large | `36` | `10` | `6` | `12` | `16` |
| Icon | `32 × 32` | `0` | — | `12` | `16` |

Variants:

- Primary: Primary fill + Primary foreground
- Outline: transparent/Background fill + Border
- Secondary: Secondary fill + Secondary foreground
- Ghost: transparent; hover ใช้ Muted
- Destructive: Destructive surface แบบจาง + Destructive text
- Login/public CTA บางตัวใช้ radius Full

### 4.2 Form controls

| Control | Height | Padding | Radius | รายละเอียด |
|---|---:|---:|---:|---|
| Input default | `32` | X `10`, Y `4` | `12` | Login ใช้ขนาดนี้ |
| Input application | `40` | X `10` | `12` | ทุก input/select หลักในใบสมัคร |
| Native Select default | `32` | L `10`, R `32` | `12` | Chevron ทางขวา |
| Textarea | min `64` | X `10`, Y `8` | `12` | Auto grow |
| Checkbox | `16 × 16` | — | `4` | Checked ใช้ Primary |
| Radio | `16 × 16` | — | Full | จุดใน `8 × 8` |
| Field vertical gap | `8` | — | — | Label → control → description |
| Field group gap | `20` | — | — | ระหว่าง fields/rows |

### 4.3 Card

- Auto Layout แนวตั้ง
- Background: Card
- Radius: `16`
- Ring/border: `1px` Foreground `10%`
- Vertical padding: `16`
- Gap ภายในระดับ Card: `16`
- Card Header: padding X `16`, gap `4`
- Card Content: padding X `16`
- Card Footer: padding `16`, Muted `50%`, border top `1px`
- Card Title: `16/22`, Medium
- Card Description: `14/20`, Muted foreground
- Small card: vertical padding `12`, padding X `12`, gap `12`

### 4.4 Badge

- Height `20`
- Padding X `8`, Padding Y `2`
- Gap `4`
- Radius Full
- Text `12`, Medium
- Icon `12`

### 4.5 Alert

- Auto Layout/Grid ที่รองรับ icon ซ้าย
- Padding X `10`, Padding Y `8`
- Gap Y `2`, icon-to-content gap X `8`
- Radius `12`
- Border `1px`
- Text `14`
- Icon `16`

### 4.6 Tabs

- Tabs List height `32`
- Background: Muted
- Padding `3`
- Radius `12`
- 2 triggers แบ่งกว้างเท่ากันเมื่อใช้ `grid-cols-2`
- Trigger radius `10`, padding X `6`, padding Y `2`, gap `6`
- Active: Background + Foreground + shadow-sm

---

## 5. Shared public header และ footer

### 5.1 Public header — 3 กลุ่มหลัก

Header root:

- Height `64`
- Width Fill `1440`
- Position Sticky top `0`
- Background: Background `95%`
- Backdrop blur
- Border bottom `1px`
- Z index `40`

Inner container ที่ Desktop 1440:

- Outer width `1408`
- Margin ซ้าย/ขวาจาก viewport `16`
- Padding ซ้าย/ขวา `20`
- Content widthจริง `1368`
- Auto Layout horizontal, Align center, Space between
- Gap `16`

สามกลุ่ม:

1. Brand
   - Auto Layout horizontal, gap `10`
   - KKU emblem สูง `40`, width ตามสัดส่วน
   - ชื่อหลัก `15px`, Bold, KKU red
   - ชื่อรอง `12px`, Muted foreground
   - Text stack line-height tight
2. Main navigation
   - แสดงตั้งแต่ `xl` (`1280`) ขึ้นไป
   - 7 รายการ: หน้าหลัก, หอพัก, บริการออนไลน์, ประกาศ, ข้อมูลเกี่ยวกับหอพักนักศึกษา, โครงสร้างบุคลากร, ติดต่อ
   - Gap `2`
   - Item padding X `12`, Y `8`
   - Text `14`, Medium; inactive ใช้ Foreground `75%`
   - Active ใช้ Primary + Semibold
   - Active underline สูง `2`, อยู่ต่ำจาก baseline block `12`
   - Dropdown chevron `14`, gap `4`
3. Right actions
   - Auto Layout horizontal, gap `6`
   - Language pill: padding X `12`, Y `8`, radius Full, icon `16`
   - Theme button `32 × 32`
   - Login/Portal button สูง `32`, radius Full
   - Mobile menu button `32 × 32`; แสดงเมื่อกว้างต่ำกว่า `xl`

Mobile header:

- Heightยังเป็น `64`
- Inner padding X `12`
- ซ่อน desktop nav
- ต่ำกว่า `640` ซ่อน language และ login button เหลือ Brand + Theme + Menu
- Mobile menu เป็น right sheet กว้าง `320`, nav padding X `12`, bottom `24`

### 5.2 Public footer

- Border top `1px`
- Container max width `1408`
- Desktop marginจาก viewport `16`, padding X `20`
- Mobile padding X `12`
- Padding Y `20`
- Main row gap `8`; desktopจัดข้อความซ้าย/ขวาแบบ Space between
- Text `14`; secondary text ใช้ Muted foreground
- Prototype note อยู่แถวล่าง, padding bottom `16`, center, text `12`, Muted `70%`

---

## 6. Frame 10 — Homepage

### 6.1 Screen frame

- Name: `10 — Homepage / Desktop / Light`
- Width `1440`
- Height: Hug contents; ใช้ประมาณ `1500–1560` เป็นจุดเริ่มต้น
- Root Auto Layout vertical
- Background: Background token
- ลำดับ: Public Header → Hero → Recommended/Steps → Public Footer

### 6.2 Hero

- Heightขั้นต่ำ Desktop `620`; Mobile `540`
- Full-width image fill
- Light image: `src/assets/hero-day.png`
- Dark image: `src/assets/hero-night.png`
- Image fit: Cover, center
- Overlay desktop: horizontal gradient Background `100%` → Background `70%` → Transparent
- Overlay mobile: vertical gradient Background `100%` → Background `85%` → Background `55%`
- Bottom fade สูง `112`: Background `100%` → Transparent

Hero inner container Desktop 1440:

- Width `1408`, viewport margin X `16`
- Padding X `20`, content start X `36`
- Padding Y `80`
- Align vertical center
- Content max width `1024`
- Content gap `20`

องค์ประกอบ:

1. Campaign status pill
   - Height Hug ประมาณ `32`
   - Padding X `16`, Y `6`
   - Gap `8`, radius Full
   - Card `90%`, border `1px`, shadow-sm, blur
   - Status dot `8 × 8`, Emerald
   - Text `14`, Medium
2. Hero heading
   - Desktop `48/60`, Bold, tracking tight
   - Mobile `25.6/36`
   - บรรทัดแรก Foreground; ส่วนสำคัญ Primary
   - Desktop บังคับแบ่งประมาณ 3 บรรทัด
3. Description
   - Max width `576`
   - Desktop `16/26`; Mobile `14/22`
   - Muted foreground
4. Search panel
   - Margin top `24`
   - Max width `896`

### 6.3 Search panel

Desktop (`md` ขึ้นไป):

- Auto Layout horizontal
- Width `896`, heightโดยประมาณ `72`
- Background Card
- Border `1px`
- Radius Full
- Paddingทุกด้าน `8`
- Gap `0`
- Shadow XL, black `5–10%`
- 3 filter areas แบบ Fill container
- Divider 2 เส้น ขนาด `1 × 40`, สี Border

แต่ละ filter:

- Padding X `16`, Y `6`
- Label `12`, Muted foreground
- Value `14`, Semibold
- Select ไม่มี border/background เพิ่ม

Search button:

- Height `56`
- Padding X `32`
- Radius Full
- Primary fill
- Label + Arrow icon `16`, gap `6`

Mobile:

- Auto Layout vertical
- Padding `12`, gap `8`
- Radius `24`
- ไม่แสดง divider แนวตั้ง
- Filter และปุ่มกว้าง Fill

### 6.4 Recommended dorms + booking steps

Section container Desktop:

- Width `1408`, margin X `16`, padding X `20`
- Actual content width `1368`
- Padding Y `40`
- Grid 2 columns: `960 + 48 gap + 360`

Left column:

- Vertical gap `20`
- Header row: titleซ้าย + linkขวา
- Title `24/32`, Bold
- Link `14`, Medium, Muted; hover Foreground
- Dorm grid: 2 columns, gap `24`
- Card widthคำนวณ `468`
- Image aspect ratio `4:5`; heightคำนวณ `585`
- Radius `16`, border `1px`, shadow-sm, Clip content

Dorm image card overlay:

- Bottom gradient สูง `75%` ของภาพ
- Light: black `90%` → `45%` → transparent
- Dark: black `70%` → `20%` → transparent
- Bottom content padding `20`, gap `12`, text white
- Dorm title `24`, Bold
- Metadata `14`, white `85%`
- Description `12`, white `70%`, ไม่เกิน 2 บรรทัด
- Price row border top white `25%`, padding top `12`
- Arrow circle `40 × 40`, radius Full, border white `40%`

Right column “ขั้นตอนการจอง”:

- Width `360`
- Title `24`, Bold
- Column gap `20`
- List 3 cards, gap `10`
- Card radius `24`
- Card content padding `20`; desktop padding X `24`
- Icon circle `40 × 40`, Primary `10%`, icon Primary `20`
- Title `14`, Bold, line-height relaxed
- Description `14`, Muted foreground
- ให้ 3 cards ยืดเท่า ๆ กันเพื่อให้ขอบล่างเสมอ dorm image cards

Responsive:

- ต่ำกว่า `1024`: Recommended และ Steps เรียงแนวตั้ง
- ต่ำกว่า `640`: Dorm gridเหลือ 1 คอลัมน์, section padding X `12`

---

## 7. Frame 11 — Login

### 7.1 Screen frame

- Name: `11 — Login / Desktop / Light`
- Width `1440`
- Root: Public Header → Login section → Public Footer
- Background: Background
- Login section min height `viewport height - 128`
- สำหรับ frame สูง `1024` ให้ section min height `896`

### 7.2 Two-column layout

แสดง 2 คอลัมน์ตั้งแต่ `lg`:

- CSS ratio: `1fr : 0.95fr`, คอลัมน์ขวาขั้นต่ำ `480`
- ที่ width `1440`: ซ้ายประมาณ `738`, ขวาประมาณ `702`
- Gap `0`

### 7.3 Left visual panel

- Minimum height `720` desktop; `256` mobile
- Image: hero-day / hero-night ตาม theme
- Image Cover, center
- Desktop overlay: black `80%` → `30%` → transparent จากซ้ายไปขวา
- Mobile overlay: black `85%` → `35%` → `10%` จากล่างขึ้นบน

Content:

- Align bottom
- Padding Desktop: `56`; `xl` ใช้ `72`
- Tablet `40`; Mobile `24`
- Text color white
- Badge margin bottom `20`, black `35%`, border white `20%`, blur
- Heading max width `672`, Desktop `48/54`, Bold
- Description margin top `16`, max width `576`, `16/24`, white `80%`
- Benefit row margin top `24`, horizontal wrap, gap X `24`, gap Y `8`
- Benefit icon `16`, text `14`, white `85%`

### 7.4 Right form panel

- Auto Layout, centerทั้งสองแกน
- Padding X: Mobile `16`, sm `32`, lg `48`, xl `64`
- Padding Y `32`

Login card:

- Max width `576`; ที่ Desktop 1440 ได้จริงประมาณ `574`
- Width Fill available
- Radius `16`, Card background
- Shadow-lg Foreground `5%`
- Card vertical padding `16`, gap `16`
- Header padding X `16`, bottom `12`, vertical gap `16`
- Content padding X `16`, vertical section gap `20`

Card Header:

1. Optional reset alert
2. Icon box `44 × 44`, radius `12`, Primary `10%`, icon `20`
3. Heading stack gap `6`
4. Title `24`, Medium/Bold
5. Description `14/20`, Muted

Email tab content:

- Tabs list `32`, 2 equal columns
- Tabs content margin top `16`, vertical gap `16`
- Info alert
- Email field: label → gap `6` → Inputสูง `32`
- Password fieldแบบเดียวกัน; hintขวา `12`
- Error text `14`, Destructive
- Submit buttonสูง `36`, Fill width; Arrow ชิดขวา
- Scenario label `12`, Medium, Muted
- Scenario cards grid 3 columnsที่ `sm`, gap `8`
- Scenario card padding X `12`, Y `8`, Auto height
- Scenario title `12`, hint `11`
- Register link center, `12`, Primary + underline

Footerภายในการ์ด:

- Separator `1px`
- Row wrap, Space between, gap `12`
- Prototype note `12`, Muted
- Reset button Small/Ghost สูง `28`

Mobile:

- Layoutเรียง Left visual → Right form
- Leftสูงขั้นต่ำ `256`
- Login card width Fill
- Scenario cardsเหลือ 1 column ต่ำกว่า `640`

---

## 8. Shared applicant header

Desktop header root:

- Height `64`
- Background `95%` + blur, border bottom `1px`, sticky top
- Inner width `1408`, margin X `16`, padding X `20`
- Gap `16` ที่ `xl`; ต่ำกว่าใช้ `12`

สามกลุ่ม:

1. Brand: Building icon `20` Primary + “หอพักในกำกับ มข.”, gap `8`, Bold
2. Applicant navigation: 10 เมนู, gap `4`, แสดงในแถวเดียวตั้งแต่ `xl`
3. Account actions: Theme button + profile button, gap `8`

Nav item:

- Padding X `12`, Y `8`
- Radius `10`
- Text `14`
- Active: Primary fill + Primary foreground
- Inactive: Muted foreground

Profile button:

- Height `40`, max width `240`
- Padding X `8`, gap `8`
- Avatar `32`
- Name `14`, Medium
- Student ID `12`, Muted
- Chevron `16`

Tablet/mobile:

- Top rowสูง `64`
- Navย้ายเป็นแถวที่สองและ scroll แนวนอน
- Nav row padding X `12` mobile / `20` sm, bottom `8`
- Nav item padding X `12`, Y `6`
- Headerรวมสูงโดยประมาณ `98`

---

## 9. Frames 12A–12D — Application form

สร้าง 4 frames โดย duplicate shell เดียวกันแล้วเปลี่ยนเฉพาะ step content

### 9.1 Shared application screen geometry

- Desktop frame width `1440`
- Root: Applicant Header → Main
- Main outer max width `1408`, margin X `16`, padding X `20`, padding Y `20`
- Application content max width `1152`
- ที่ Desktop 1440 application content เริ่มที่ X `144`, marginซ้าย/ขวา `144`
- Content vertical gap `24`, padding bottom `40`

Intro header:

- Row desktop: title blockซ้าย + save statusขวา
- Gap `12`
- Badges row gap `8`
- Title marginจาก badge `4`; `30/36` desktop, `24/32` mobile, Bold
- Description max width `672`, `16` desktop / `14` mobile, Muted
- Save status `12`, icon `16`, gap `8`

Stepper card:

- Width `1152`
- Card radius `16`
- Content padding `24` desktop, `16` mobile
- Desktop stepperมี 4 equal columns
- Step indicator `40 × 40`, border `1px`
- Active: border Primary
- Completed: Primary fill + white icon
- Separatorสูง `1`, top `20`, เริ่มหลังวงกลม `28`
- Indicator-to-text gap `8`
- Step title `14`
- Step descriptionแสดงที่ `lg`, text `12`, Muted
- Mobileใช้ summary card + Progress barสูง `8`; ไม่แสดง 4-column stepper

Main form grid:

- Width `1152`
- Desktopตั้งแต่ `lg`: `844 main + 20 gap + 288 sidebar`
- Main form cards gap `20`
- Sidebar cards gap `16`
- Sidebar sticky top `160`
- Action row border top `1px`, padding top `20`, gap `12`
- Back button min width `112`; Next `144`; Submit `160`

### 9.2 Frame 12A — Step 1 “รอบและประเภท”

Card 1 — ประเภทผู้สมัคร:

- Header icon box `40 × 40`, radius `8`, Muted, icon Primary `20`
- Header horizontal gap `12`
- Radio card grid 2 columns, gap `12`
- แต่ละ option padding `16`, gap `12`, border `1px`, radius `12`
- Radioอยู่ top offset `2`
- Title `14`, Medium; detail margin top `4`, `12`, Muted

Card 2 — หอพักและประเภทห้อง:

- Dorm options grid 2 columns, gap `12`
- Room type field margin/gapตาม FieldGroup
- Native select height `40`, Fill width
- Info alertด้านล่าง
- Card Content vertical gap `20`

### 9.3 Frame 12B — Step 2 “ข้อมูลผู้สมัคร”

นี่คือ frame หลักสำหรับคำว่า “กรอกแบบฟอร์มสมัคร”

Card 1 — ข้อมูลส่วนตัว:

- FieldGroup gap `20`
- Row 1: `160 + 1fr + 1fr`, gap `16`
- Row 2: 3 equal columns, gap `16`
- Row 3: ID/Passport max width `448`
- Input/Select height `40`

Card 2 — ข้อมูลนักศึกษา:

- Row 1: 3 equal columns: รหัส, ระดับ, ชั้นปี
- Row 2: 2 columns: คณะ, สาขา
- Row 3: 2 columns: GPA, อาจารย์ที่ปรึกษา
- ทุก row gap `16`, row-to-rowตาม FieldGroup `20`

Card 3 — ช่องทางติดต่อและผู้ติดต่อฉุกเฉิน:

- Row 1: 2 columns โทรศัพท์/อีเมล, gap `16`
- Address textarea min height `64` และตั้งต้น 3 rows
- Separator `1px`
- Emergency row: 3 equal columns, gap `16`

Responsive:

- ต่ำกว่า `640` ทุก rowเหลือ 1 column
- ที่ `sm` personal rowแรกยังคง 3 columnsตาม `160 + 1fr + 1fr`
- Student rowแรกเป็น 2 columnsที่ `sm`, 3 columnsที่ `lg`

### 9.4 Frame 12C — Step 3 “สุขภาพและเอกสาร”

Card 1 — ข้อมูลสุขภาพ:

- Icon box `40 × 40`
- Blood group selectสูง `40`
- Disease radio optionsแนวนอนแบบ wrap, gap `12`
- แต่ละ radio option padding `12`
- Conditional textarea min height `64`
- Card Content gap `20`

Card 2 — กิจกรรมและความสามารถพิเศษ:

- 3 textareas เรียงแนวตั้ง
- FieldGroup gap `20`
- แต่ละ textareaตั้งต้น 3 rows

Card 3 — ยานพาหนะ:

- 3 equal columnsที่ `sm`, gap `16`
- Input height `40`

Card 4 — เอกสารประกอบ:

- 2 columnsที่ `sm`, gap `16`
- Upload box min height `112`
- Padding `16`, gap `8`, radius `12`
- Border dashed `1px`
- Background Muted `30%`; hover `50%`
- Icon `20`, title `14`, hint `12`

### 9.5 Frame 12D — Step 4 “ตรวจสอบและส่ง”

Card 1 — ตรวจสอบข้อมูลใบสมัคร:

- Summary grid 2 columns, gap `16`
- แต่ละ summary box border `1px`, radius `12`, padding `16`
- Section label margin bottom `12`, text `12`, Semibold, uppercase, tracking wide
- Definition rows gap `8`, text `14`
- Labelใช้ Muted; valueชิดขวาและ Medium

Card 2 — ค่าใช้จ่าย:

- Fee table border `1px`, radius `12`, Clip
- แต่ละ row padding X `16`, Y `12`
- Border bottomระหว่าง row
- Total row Background Muted `50%`
- Total amount `18`, Bold, Primary
- Note `12`, Muted
- Info alertแจ้งว่าการส่งใบสมัครยังไม่ยืนยันสิทธิ์

Card 3 — รับรองข้อมูล:

- 2 checkbox panels
- Panel padding `16`, gap `12`, border `1px`, radius `12`
- Checkbox top offset `2`
- Title `14`, Medium
- Detail margin top `4`, `12`, relaxed, Muted

### 9.6 Application right sidebar

Card “รอบรับสมัคร”:

- Title `16`
- Status row Space between
- Date blockมี top margin `4`
- Separator
- Applicant name `14`, Medium; ID `12`, Muted

Card “ความคืบหน้า”:

- Progress bar height `8`
- Content gap `12`
- Current step `14`, Medium
- Help text `12`, relaxed, Muted

Help alert:

- Standard Alert
- Info icon `16`
- Contact textจาก campaign

---

## 10. Frame 13 — Staff Dashboard

### 10.1 Staff shell

- Desktop frame width `1440`
- Root Auto Layout horizontal
- Sidebar `256` expanded / `48` collapsed
- Content areaเมื่อ expanded `1184`
- Mobile sidebarเป็น Sheet กว้าง `288`

### 10.2 Sidebar

- Backgroundใช้ Sidebar tokenทั้ง Light/Dark
- Foregroundใช้ Sidebar foreground
- Border right `1px`
- Header padding `8`, gap `8`
- Brand button height `48`, padding `8`, gap `8`
- Brand icon box `32 × 32`, radius `8`, Primary fill, white icon `18`
- Brand title `14`, Bold; subtitle `12`, Foreground `70%`

Navigation groups:

- Group padding `8`
- Group label height `32`, padding X `8`, text `12`, Medium, Foreground `70%`
- Menu gap `0`
- Menu item height `32`, padding `8`, gap `8`, radius `10`
- Icon `16`, text `14`
- Active: Sidebar Primary fill + white text/icon
- Hover: Sidebar Accent
- กลุ่มเมนู: ภาพรวม, ห้องพักและการจอง, การเงิน SCB, สัญญาและส่งต่อ, ระบบ, ผู้ดูแลระบบ

Sidebar footer:

- Padding `8`, gap `8`
- User rowสูง `48`
- Avatar `32`, radius Full, Sidebar Accent
- Reset/Logout rowสูง `32`

### 10.3 Staff top bar

- Height `56`
- Width Fill content area
- Sticky top, Background `95%`, blur
- Border bottom `1px`
- Padding X `16` desktop / `12` mobile
- Gap `8`

องค์ประกอบ:

1. Sidebar trigger `32 × 32`
2. Vertical separator `1 × 20`
3. Breadcrumb: group / page, gap `6`, text `14`; group Muted, page Semibold
4. Right actions: role badge, Theme button, Logout button; gap `8`

### 10.4 Dashboard main geometry ที่ Desktop 1440

- Staff content width `1184`
- Main padding X `24`, Y `20`
- Usable width `1136`
- Vertical section gap `24`
- Dashboard main grid: `756 + 20 gap + 360`
- Right panel sticky top `76`

Page header:

- Auto Layout horizontal wrap, align bottom, Space between, gap `12`
- Date `14`, Muted
- Greeting `24/32`, Bold
- Description `14`, Muted
- Campaign badge height `32`, padding X `12`, gap `6`, text `14`

### 10.5 Main column

Room status card:

- Standard Card
- Header bottom padding `12`
- Title `16`; totalจำนวนชิดขวา `14`
- Status meter height `12`, radius Full, segment gap `2`
- Legend margin top `12`
- Legend 4 columns, gap X `20`, gap Y `8`
- Color marker `10 × 10`, radius `3`
- Legend label `12`, value `14` Semibold

Stat sections 3 กลุ่ม:

1. ห้องพักและการจอง — 4 cards
2. การเงิน SCB — 4 cards
3. สัญญาและส่งต่อ — 3 cards

แต่ละ section:

- Section gap `12`
- Label `14`, Semibold, uppercase, tracking wide, Muted
- Grid 4 columnsที่ `xl`, 2 columnsก่อน `xl`
- Gap `12`
- ที่ Desktop 1440 card widthคำนวณประมาณ `180`

Stat card:

- Radius `16`, border `1px`, Card background, shadow-sm
- Padding `16`
- Vertical gap `12`
- Top row Space between
- Icon chip `36 × 36`, radius `8`, icon `18`
- Chevron `16`
- Number `30/30`, Bold, tabular
- Label margin top `4`, `14`, Medium, Foreground `80%`
- Warning cardใช้ Amber border `50%` light / `30%` dark

### 10.6 Right panel

- Width `360`
- Vertical gap `20`

Card “งานด่วนวันนี้”:

- Card padding `0`, internal gap `0`
- Header padding X `16`, Y `16`, border bottom
- Title icon `16` Primary, gap `8`, title `16`
- Task rowsแบ่งด้วย divider
- Row padding X `16`, Y `12`, gap `12`
- Icon chip `32 × 32`, radius `8`, icon `16`
- Label `14`, Medium, truncate
- Count badge
- Chevron `16`
- Hold rowใช้ layout 2 ชั้น; Countdown component margin/gapภายใน

Countdown pill:

- Padding X `12`, Y `6`, gap `8`
- Radius `10`, border `1px`
- Text `14`, icon `16`
- Active warningใช้ Amber surface; expiredใช้ Destructive surface

Card “กิจกรรมล่าสุด”:

- Headerเหมือน urgent card
- Event row padding X `16`, Y `12`
- Detail `14`, line-heightประมาณ `20`, สูงสุด 2 บรรทัด
- Metadata margin top `4`, `12`, Muted
- Bottom link padding X `16`, Y `12`, border top, Primary text

Responsive:

- ต่ำกว่า `1280`: right panelลงใต้ main column
- Stat gridยังเป็น 2 columnsจนถึง `xl`
- ต่ำกว่า `768`: sidebarปิดและเปิดเป็น Sheet `288`
- Top barซ่อน breadcrumb group และ role badgeตามพื้นที่
- Main padding X `12` mobile, `16` sm, `24` lg; Y `20` ทุกขนาด

---

## 11. Assets ที่ต้องวางใน Figma

| Asset | Path | ใช้กับ |
|---|---|---|
| KKU emblem | `src/assets/kku-emblem.png` | Public Header |
| Hero light | `src/assets/hero-day.png` | Homepage/Login Light |
| Hero dark | `src/assets/hero-night.png` | Homepage/Login Dark |
| 8 dorms light | `src/assets/dorm-home/dorm-8-light.png` | Homepage card Light |
| 8 dorms dark | `src/assets/dorm-home/dorm-8-dark.png` | Homepage card Dark |
| Wor Inter light | `src/assets/dorm-home/dorm-inter-light.png` | Homepage card Light |
| Wor Inter dark | `src/assets/dorm-home/dorm-inter-dark.png` | Homepage card Dark |

Icons ใช้ Lucide style:

- Stroke icon
- Default stroke width `2`
- ขนาดหลัก `16`, `18`, `20`
- ห้ามใช้ emoji แทน icon

---

## 12. Prototype states ที่ควรทำเป็น variants

สร้าง component/variant อย่างน้อย:

- Button: Primary / Outline / Secondary / Ghost / Destructive; Default / Hover / Focus / Disabled
- Input: Empty / Filled / Focus / Error / Disabled
- Nav item: Default / Hover / Active
- Badge: Default / Secondary / Outline / Success / Warning / Info / Error
- Card: Default / Hoverable / Selected
- Step: Upcoming / Active / Completed
- Checkbox/Radio: Unselected / Selected / Focus / Disabled
- Staff sidebar: Expanded / Collapsed
- Theme: Light / Dark แยก frame หรือใช้ variable modes หากบัญชีรองรับ

Interaction สำคัญ:

- Public header sticky
- Applicant header sticky
- Staff top bar sticky
- Application sidebar stickyที่ `160px`
- Staff right panel stickyที่ `76px`
- Homepage image card hover: image scale `105%` และ shadowเพิ่ม
- Primary CTA hover: ยกขึ้น `2px`, shadow Primary `40%`; activeกลับตำแหน่งเดิม

---

## 13. Final Figma checklist

- [ ] ทุก desktop frame กว้าง `1440`
- [ ] Public/Applicant max container `1408` พร้อม gutterจริง `20`
- [ ] Homepage heroสูง `620`; mobile `540`
- [ ] Public/Applicant headerสูง `64`
- [ ] Staff top barสูง `56`
- [ ] Staff sidebarกว้าง `256` และ collapsed `48`
- [ ] Application contentกว้าง `1152`, main `844`, gap `20`, sidebar `288`
- [ ] Staff usable contentกว้าง `1136`, main `756`, gap `20`, right panel `360`
- [ ] ใช้ Light cream/orange และ Dark navy/orange ตาม token
- [ ] KKU red เป็น accent รอง ไม่ใช้แทน Primary CTA
- [ ] Card radius `16`; controls radius `12`; step cards radius `24`
- [ ] Input ในใบสมัครสูง `40`; Login inputสูง `32`
- [ ] ทุกสถานะมี label/icon ไม่สื่อด้วยสีอย่างเดียว
- [ ] ตัวเลขปฏิบัติการใช้ tabular numbers
- [ ] ทุกกลุ่มหลักใช้ Auto Layout และตั้ง Fill/Hug ให้แก้ต่อได้
- [ ] Light/Dark ใช้โครงสร้าง layer และชื่อ component ตรงกัน

