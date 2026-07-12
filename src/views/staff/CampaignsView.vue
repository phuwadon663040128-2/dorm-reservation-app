<script setup lang="ts">
import PlaceholderPage from '@/components/domain/PlaceholderPage.vue'
</script>

<template>
  <PlaceholderPage
    title="ตั้งค่ารอบรับสมัคร"
    phase="P2/P5"
    description="เจ้าหน้าที่กำหนดรอบรับสมัคร/ต่อสัญญา วันเปิด-ปิด เงื่อนไขรูมเมท และระยะ hold ต่าง ๆ (เอกสาร 05 §1)"
    :features="[
      'กำหนดกลุ่มหอ วันเปิด-ปิดรับสมัคร วันเปิดต่อสัญญา',
      'ตั้งค่า roommate_room_confirmation_required (ยืนยันห้องรอบสองภายใน 15 นาที)',
      'ตั้งระยะ payment hold (ค่าฐาน 72 ชม.) และอายุคำเชิญ (48 ชม.)',
      'เลือกแม่แบบสัญญา/เวอร์ชัน และข้อมูลติดต่อ',
      'ค่าที่ยังไม่ได้ข้อสรุปจาก stakeholder ต้องติดป้าย Provisional และแก้ได้โดยไม่ต้องแก้โค้ด',
    ]"
  />
</template>
