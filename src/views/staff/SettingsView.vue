<script setup lang="ts">
import PlaceholderPage from '@/components/domain/PlaceholderPage.vue'
</script>

<template>
  <PlaceholderPage
    title="ตั้งค่าระบบ"
    phase="P5/P6"
    description="การตั้งค่ากลางของระบบ — ค่าที่นโยบายยังไม่นิ่งต้องเป็น configuration ที่แก้ได้ ไม่ hard-code (เอกสาร 16)"
    :features="[
      'จัดการบทบาทและสิทธิ์ราย permission (deny-by-default)',
      'กำหนด dorm scope ของเจ้าหน้าที่แต่ละคน',
      'ตั้งค่า pricing rule แบบมีเวอร์ชัน (แยกจาก override รายรายการ)',
      'จัดการแม่แบบสัญญาและเวอร์ชัน',
      'ค่า Provisional ที่รอ stakeholder: นโยบายจ่ายคนเดียว, Ref.2 แบบผ่อนชำระ, ผู้พักยกเว้นค่าธรรมเนียม, วันต่อสัญญา',
    ]"
  />
</template>
