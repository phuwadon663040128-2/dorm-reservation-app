<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRightIcon, CalendarIcon, KeyRoundIcon, UsersIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDormStore } from '@/stores/dorm'
import heroImage from '@/assets/hero.png'

const dorm = useDormStore()

const steps = [
  { icon: UsersIcon, title: 'จับคู่รูมเมทหรือเลือกเหมาห้อง', detail: 'ส่งคำเชิญรูมเมท (มีอายุ 48 ชม.) หรือเลือกพักคนเดียวแบบเหมาห้อง' },
  { icon: KeyRoundIcon, title: 'เลือกห้องจริงรายห้อง', detail: 'เลือกจากอาคาร → ชั้น → ห้องจริง เห็นสถานะว่าง/ถูกจองชั่วคราวแบบเรียลไทม์' },
  { icon: CalendarIcon, title: 'ชำระเงินและลงนามสัญญา', detail: 'ชำระผ่านแบบฟอร์ม QR ทางการของธนาคารภายใน 72 ชม. แล้วลงนามสัญญาประจำปี' },
]
</script>

<template>
  <div class="space-y-10">
    <!-- Hero -->
    <section class="grid items-center gap-8 lg:grid-cols-2">
      <div class="space-y-4">
        <Badge variant="outline">ปีการศึกษา 2569 · วรเรสซิเดนซ์ หอ 8 หลัง + หอพักวรอินเตอร์</Badge>
        <h1 class="text-3xl font-bold leading-tight sm:text-4xl">
          จองห้องพักหอในกำกับ มข.<br />เลือกห้องจริง รู้สถานะจริง
        </h1>
        <p class="max-w-xl text-muted-foreground">
          ระบบรับสมัครและจองหอพักในกำกับมหาวิทยาลัยขอนแก่น รองรับการเลือกห้องเป็นรายห้อง
          จับคู่รูมเมท เหมาห้อง ชำระเงินผ่านแบบฟอร์มธนาคารอย่างเป็นทางการ และติดตามสัญญาจนถึงวันรับกุญแจ
        </p>
        <div class="flex flex-wrap gap-3">
          <Button as-child size="lg">
            <RouterLink to="/rooms">ดูห้องว่างตอนนี้ <ArrowRightIcon aria-hidden="true" /></RouterLink>
          </Button>
          <Button as-child size="lg" variant="outline">
            <RouterLink to="/register">สมัครสมาชิกด้วยอีเมล</RouterLink>
          </Button>
        </div>
        <p class="text-xs text-muted-foreground">
          ไม่ต้องมีบัญชี KKU ก็เริ่มจองได้ — นักศึกษาใหม่ใช้อีเมลส่วนตัวที่ยืนยันแล้ว และผูกบัญชี KKU ภายหลังได้
        </p>
      </div>
      <img
        :src="heroImage"
        alt="ภาพหอพักนักศึกษา"
        class="hidden w-full rounded-xl object-cover shadow-md lg:block"
      />
    </section>

    <!-- รอบรับสมัครที่เปิดอยู่ -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold">รอบรับสมัครที่เปิดอยู่</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <Card v-for="c in dorm.openCampaigns" :key="c.id">
          <CardHeader>
            <div class="flex items-center justify-between gap-2">
              <CardTitle class="text-base">{{ c.name }}</CardTitle>
              <Badge>เปิดรับสมัคร</Badge>
            </div>
            <CardDescription>
              {{ c.openDate }} – {{ c.closeDate }} · สัญญา{{ c.contractPeriod }}
            </CardDescription>
          </CardHeader>
          <CardContent class="flex items-center justify-between gap-3">
            <p class="text-sm text-muted-foreground">
              hold ยืนยันห้อง {{ c.roomConfirmationMinutes }} นาที · ชำระเงินภายใน {{ c.paymentHoldHours }} ชม.
            </p>
            <Button as-child variant="outline" size="sm">
              <RouterLink :to="`/campaigns/${c.id}`">รายละเอียด</RouterLink>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- ขั้นตอน -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold">ขั้นตอนการจอง</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <Card v-for="(s, i) in steps" :key="s.title">
          <CardContent class="space-y-2 p-5">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <component :is="s.icon" class="size-5" aria-hidden="true" />
            </div>
            <p class="font-semibold">{{ i + 1 }}. {{ s.title }}</p>
            <p class="text-sm text-muted-foreground">{{ s.detail }}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
