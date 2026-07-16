<script setup lang="ts">
import { Users2Icon } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'

// โครงสร้างบุคลากร (ข้อมูลสมมติสำหรับต้นแบบ — ตำแหน่ง/ขอบเขตจริงรอ stakeholder ยืนยัน)
const groups = [
  {
    title: 'กองบริการหอพักนักศึกษา',
    members: ['ผู้อำนวยการกองบริการหอพักนักศึกษา', 'ผู้ดูแลระบบและข้อมูล (Division Admin)'],
  },
  {
    title: 'เจ้าหน้าที่ประจำหอพัก',
    members: ['ผู้จัดการหอพัก วรเรสซิเดนซ์ / หอ 8 หลัง', 'ผู้จัดการหอพัก วรอินเตอร์', 'เจ้าหน้าที่ดูแลห้องพักและการจอง'],
  },
  {
    title: 'ฝ่ายการเงิน',
    members: ['เจ้าหน้าที่การเงิน (SCB export / ตรวจผลชำระ)', 'เจ้าหน้าที่ตรวจสอบ exception และการคืนเงิน'],
  },
  {
    title: 'ฝ่ายสัญญาและเอกสาร',
    members: ['เจ้าหน้าที่สัญญา (พิมพ์/รับสัญญา/สแกน)', 'เจ้าหน้าที่ส่งมอบกุญแจ'],
  },
]
</script>

<template>
  <div class="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
    <div class="space-y-1">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Users2Icon class="size-6 text-primary" aria-hidden="true" /> โครงสร้างบุคลากร
      </h1>
      <p class="text-sm text-muted-foreground">
        กองบริการหอพักนักศึกษา มหาวิทยาลัยขอนแก่น — ชื่อตำแหน่งและขอบเขตสิทธิ์จริงอยู่ระหว่างยืนยันกับ stakeholder (Provisional)
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card v-for="g in groups" :key="g.title">
        <CardContent class="space-y-2 p-5">
          <p class="font-semibold">{{ g.title }}</p>
          <ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li v-for="m in g.members" :key="m">{{ m }}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
