<script setup lang="ts">
import PermissionGate from '@/components/domain/PermissionGate.vue'
import PlaceholderPage from '@/components/domain/PlaceholderPage.vue'
</script>

<template>
  <PermissionGate permission="reservation.manual_create">
    <PlaceholderPage
      title="จองแทนผู้พัก (Manual Reservation)"
      phase="P5"
      description="เจ้าหน้าที่ที่มีสิทธิ์สร้างการจองแทนผู้พักได้ทันที เป็นการจองแบบ final ไม่ต้องรอผู้พักยืนยัน (เอกสาร 02 §Manual staff reservation)"
      :features="[
        'เลือกห้องจริง + รูปแบบการพัก (พักคู่/เหมาห้อง)',
        'ผูกผู้พัก 1–2 คน (โปรไฟล์ต้องครบ)',
        'เหตุผลบังคับ + บันทึก audit ทุกครั้ง',
        'ใช้ transactional service เดียวกับการจองปกติ — กันจองซ้อนเหมือนกัน (HOLD-011)',
        'ยังเข้าสู่ workflow ชำระเงิน/สัญญาตามปกติ เว้นแต่มีสิทธิ์ override เพิ่มเติม',
      ]"
    />
  </PermissionGate>
</template>
