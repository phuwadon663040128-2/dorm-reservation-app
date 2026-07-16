# KKU Dormitory — Vue 3 Light/Dark UI

หน้าเว็บ Vue 3 + TypeScript แบบ responsive อ้างอิงจาก mockup ที่แนบมา พร้อม:

- Light / Dark mode และจำค่าด้วย `localStorage`
- เปลี่ยนภาพ Hero ตามธีม
- เมนู responsive สำหรับมือถือ
- ฟอร์มค้นหาหอพัก
- การ์ดหอพักและขั้นตอนการจอง
- ไม่ใช้ไลบรารี UI หรือไอคอนภายนอก

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดงใน Terminal

## ไฟล์หลัก

- `src/App.vue` — โครงสร้างหน้าเว็บและ logic theme
- `src/style.css` — theme tokens, desktop และ responsive styles
- `src/assets/` — ภาพ Hero และภาพการ์ดหอพัก

## นำไปใส่โปรเจกต์เดิม

คัดลอก `src/App.vue`, `src/style.css` และโฟลเดอร์ `src/assets` ไปยังโปรเจกต์ Vue 3 ของคุณ แล้วปรับ path ตามโครงสร้างโปรเจกต์
