<script setup lang="ts">
import PlaceholderPage from '@/components/domain/PlaceholderPage.vue'
</script>

<template>
  <PlaceholderPage
    title="รายงาน"
    phase="P6"
    description="รายงานปฏิบัติการตามเอกสาร 05 §Reports — ทุกไฟล์ export ต้อง minimize ข้อมูลส่วนบุคคลตามประเภทรายงาน (PDPA)"
    :features="[
      'สถานะห้องจริงรายห้อง / กลุ่มรูมเมทและหัวหน้ากลุ่ม / hold ที่กำลังจะหมดเวลา',
      'รายการชำระเงินตาม action (ROOM/HL) และความครบของกลุ่ม',
      'สถานะ SCB batch, หน้า PDF ที่ยัง match ไม่ได้, exception และการคืนเงิน',
      'สัญญาและการส่งมอบกุญแจ',
      'การส่งข้อมูลมหาวิทยาลัยและ correction',
      'export CSV/Excel สำหรับ workflow เดิมของหน่วยงาน',
    ]"
  />
</template>
