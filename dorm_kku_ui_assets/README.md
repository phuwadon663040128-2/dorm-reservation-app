# Dorm KKU UI Assets

ไฟล์ชุดนี้รวบรวมข้อมูลและรูปภาพจากหน้าเว็บของกองบริการหอพักนักศึกษา มหาวิทยาลัยขอนแก่น เพื่อใช้เป็นวัตถุดิบสำหรับออกแบบ UI เว็บจองหอพัก

## โครงสร้างไฟล์

```text
dorm_kku_ui_assets/
├── data/
│   ├── structure.json                  # โครงสร้างหน่วยงานแบบ JSON
│   ├── structure_edges.csv             # โครงสร้างหน่วยงานแบบ parent-child สำหรับทำ org chart
│   ├── personnel_cards.json            # ข้อมูลบุคลากรตาม profile card บนหน้าเว็บ
│   ├── personnel_cards.csv             # ข้อมูลบุคลากรแบบ CSV
│   ├── personnel_unique_people.json    # ข้อมูลบุคลากรแบบรวมคนซ้ำ
│   ├── images_manifest.json            # รายละเอียดรูปทั้งหมด + ขนาด + source URL
│   ├── images_manifest.csv             # รายละเอียดรูปทั้งหมดแบบ CSV
│   └── source_summary.md               # สรุปแหล่งข้อมูล
├── images/
│   ├── branding/                       # โลโก้
│   ├── structure/                      # รูปผังโครงสร้าง
│   └── personnel/                      # รูปบุคลากร แบนเนอร์ และรูปกลุ่ม
└── preview-personnel.html              # HTML preview สำหรับเปิดดูการ์ดบุคลากรแบบ local
```

## หมายเหตุข้อมูล

- `personnel_cards.*` เก็บข้อมูลตามการ์ดบนหน้าเว็บต้นฉบับ ดังนั้นคนที่มีหลายตำแหน่งจะปรากฏหลายรายการ
- `personnel_unique_people.json` รวมคนซ้ำตามชื่อและอีเมล พร้อมเก็บหลายบทบาทไว้ใน `roles`
- อีเมลของ “ณัฐวุฒิ อิ่มนาง” ปรากฏบนหน้าเว็บต้นฉบับเป็น `..@kku.ac.th` จึงบันทึกตามต้นฉบับ
- รูปภาพทุกไฟล์มี source URL ใน `images_manifest.*`

## แหล่งข้อมูล

- โครงสร้างหน่วยงาน: https://dorm.kku.ac.th/stru-dorm/
- บุคลากร: https://dorm.kku.ac.th/personal-dorm/
