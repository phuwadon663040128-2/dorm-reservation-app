<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRightIcon,
  BanknoteIcon,
  CheckIcon,
  ClockIcon,
  FileSignatureIcon,
  KeyRoundIcon,
  LayoutGridIcon,
  ShieldCheckIcon,
  UserRoundPlusIcon,
  UsersRoundIcon,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PageHeader from '@/components/domain/PageHeader.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()

const accountAction = computed(() => {
  if (!session.isLoggedIn) return { label: 'เข้าสู่ระบบ', to: { path: '/guide', query: { auth: 'login' } } }
  if (session.isStaff) return { label: 'ไปพื้นที่เจ้าหน้าที่', to: '/staff' }
  return { label: 'ไปที่การจองของฉัน', to: '/app' }
})

// คู่มือการจอง — เนื้อหายึดกติกาจริงของระบบ: คำเชิญ 48 ชม. / ยืนยันห้อง 15 นาที / ชำระใน 72 ชม.
const checklist = [
  'อีเมลส่วนตัวที่ยืนยันตัวตนได้ (ไม่จำเป็นต้องมีบัญชี KKU)',
  'ข้อมูลประจำตัวและช่องทางติดต่อสำหรับกรอกโปรไฟล์',
  'ชื่อหรืออีเมลของรูมเมท (กรณีต้องการพักคู่)',
  'เปรียบเทียบหอ ประเภทห้อง และค่าธรรมเนียมล่วงหน้า',
]

const steps = [
  { icon: UserRoundPlusIcon, title: 'สร้างบัญชีและกรอกโปรไฟล์', detail: 'สมัครด้วยอีเมลส่วนตัวที่ยืนยันแล้ว กรอกข้อมูลผู้สมัครให้ครบถ้วน — โปรไฟล์ต้องสมบูรณ์ก่อนจึงจะสร้างกลุ่มหรือเลือกห้องได้' },
  { icon: UsersRoundIcon, title: 'เลือกพักคู่หรือเหมาห้อง', detail: 'ส่งคำเชิญรูมเมท (คำเชิญมีอายุ 48 ชั่วโมง) หรือเลือกเหมาห้องเพื่อดำเนินการคนเดียวโดยไม่ต้องมีรูมเมท' },
  { icon: LayoutGridIcon, title: 'เลือกอาคาร ชั้น และห้องจริง', detail: 'ดูสถานะห้องบนแผนผังที่จัดวางตามแบบแปลนจริง กรองตามประเภทห้อง และเปิดผังต้นฉบับเพื่อเทียบตำแหน่งห้องได้' },
  { icon: ClockIcon, title: 'ยืนยันห้องร่วมกัน', detail: 'หัวหน้ากลุ่มกดจองแล้วห้องถูกล็อกทันที — รูมเมทตรวจสอบและยืนยันห้องเดียวกันภายใน 15 นาที (เมื่อรอบรับสมัครกำหนด)' },
  { icon: BanknoteIcon, title: 'ชำระรายการภายใน 72 ชั่วโมง', detail: 'ดาวน์โหลดแบบฟอร์มชำระเงินทางการของแต่ละรายการ — ระบบติดตามรายการ ROOM และ HL แยกต่อผู้พัก ทุกคนต้องชำระครบตามกำหนดเดียวกัน' },
  { icon: FileSignatureIcon, title: 'พิมพ์และลงนามสัญญา', detail: 'เมื่อรายการของกลุ่มครบและเจ้าหน้าที่ยืนยันห้องแล้ว ผู้พักแต่ละคนได้รับสัญญาของตนเอง พิมพ์และลงนามได้แยกกัน' },
  { icon: KeyRoundIcon, title: 'นัดรับกุญแจและเข้าพัก', detail: 'ตรวจเอกสาร ลงนามรับกุญแจ (เอกสารแยกจากสัญญา) และรอส่งต่อข้อมูลเข้าระบบมหาวิทยาลัย' },
]

const timings = [
  { value: '48', unit: 'ชั่วโมง', title: 'อายุคำเชิญรูมเมท', detail: 'รูมเมทต้องตอบรับคำเชิญก่อนหมดอายุ ไม่เช่นนั้นต้องส่งคำเชิญใหม่' },
  { value: '15', unit: 'นาที', title: 'ยืนยันห้องที่เลือก', detail: 'เมื่อรอบรับสมัครกำหนด รูมเมทต้องยืนยันห้องที่หัวหน้ากลุ่มเลือกภายในเวลา ไม่เช่นนั้นระบบปล่อยห้องคืนทันที' },
  { value: '72', unit: 'ชั่วโมง', title: 'ชำระเงินหลังล็อกห้อง', detail: 'ทุกคนในกลุ่มต้องชำระรายการที่จำเป็นครบภายในกำหนดเดียวกัน หากไม่ครบระบบจะปล่อยห้องคืน' },
]

const occupancyModes = [
  {
    tag: 'SHARED ROOM',
    icon: UsersRoundIcon,
    title: 'พักคู่กับรูมเมท',
    points: ['ผู้พัก 2 คนในห้องเดียวกัน', 'ส่งคำเชิญรูมเมทก่อน — คำเชิญมีอายุ 48 ชั่วโมง', 'ยืนยันห้องร่วมกันภายใน 15 นาทีเมื่อรอบกำหนด', 'แยกรายการชำระเงินและสัญญาต่อคน'],
    ctaLabel: 'ค้นหาห้องแบบพักคู่',
  },
  {
    tag: 'WHOLE ROOM',
    icon: ShieldCheckIcon,
    title: 'พักคนเดียวแบบเหมาห้อง',
    points: ['ผู้พัก 1 คนใช้ห้องทั้งห้อง', 'ไม่ต้องรอคำเชิญหรือการยืนยันจากรูมเมท', 'ชำระราคาเต็มของห้อง', 'ได้รับสัญญาแบบเหมาห้องหนึ่งฉบับ'],
    ctaLabel: 'ค้นหาห้องแบบเหมาห้อง',
  },
]
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-10 px-3 py-8 sm:px-5">
    <PageHeader
      kicker="คู่มือการใช้งาน"
      title="คู่มือการจองหอพักออนไลน์"
      subtitle="ขั้นตอนทั้งหมดตั้งแต่สร้างบัญชีจนถึงวันรับกุญแจ พร้อมช่วงเวลาสำคัญที่ต้องรู้ก่อนเริ่มจอง"
    />

    <!-- เตรียมให้พร้อม + 7 ขั้นตอน -->
    <div class="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card class="self-start rounded-3xl lg:sticky lg:top-20">
        <CardContent class="space-y-4 p-6">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-primary">ก่อนเริ่มสมัคร</p>
            <h2 class="text-xl font-bold leading-snug">เตรียมให้พร้อม แล้วจองได้เร็วขึ้น</h2>
          </div>
          <ul class="space-y-2.5">
            <li v-for="item in checklist" :key="item" class="flex gap-2 text-sm leading-relaxed">
              <CheckIcon class="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              {{ item }}
            </li>
          </ul>
          <RouterLink to="/info/fees" class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            ดูค่าธรรมเนียม <ArrowRightIcon class="size-3.5" aria-hidden="true" />
          </RouterLink>
        </CardContent>
      </Card>

      <!-- timeline 7 ขั้นตอน -->
      <ol class="space-y-0">
        <li v-for="(s, i) in steps" :key="s.title" class="relative flex gap-4 pb-8 last:pb-0 sm:gap-6">
          <span
            v-if="i < steps.length - 1"
            class="absolute left-[3.15rem] top-12 h-[calc(100%-2.5rem)] w-px bg-border sm:left-[3.65rem]"
            aria-hidden="true"
          />
          <span class="w-6 pt-2.5 text-right text-xs font-semibold tabular-nums text-muted-foreground sm:w-8">
            {{ String(i + 1).padStart(2, '0') }}
          </span>
          <div class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <component :is="s.icon" class="size-5" aria-hidden="true" />
          </div>
          <div class="min-w-0 space-y-1 pt-1">
            <h3 class="font-bold leading-snug">{{ s.title }}</h3>
            <p class="text-sm leading-relaxed text-muted-foreground">{{ s.detail }}</p>
          </div>
        </li>
      </ol>
    </div>

    <!-- 3 ช่วงเวลาที่สำคัญ -->
    <section class="space-y-4">
      <div class="space-y-1">
        <p class="text-xs font-semibold uppercase tracking-wide text-primary">ช่วงเวลาสำคัญ</p>
        <h2 class="text-xl font-bold tracking-tight sm:text-2xl">3 ช่วงเวลาที่ต้องรู้</h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <Card v-for="t in timings" :key="t.title" class="rounded-3xl">
          <CardContent class="space-y-1.5 p-6">
            <p class="text-4xl font-bold tabular-nums text-primary">
              {{ t.value }}<span class="ml-1 text-base font-semibold text-muted-foreground">{{ t.unit }}</span>
            </p>
            <p class="font-bold">{{ t.title }}</p>
            <p class="text-sm leading-relaxed text-muted-foreground">{{ t.detail }}</p>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- เปรียบเทียบรูปแบบการพัก -->
    <section class="space-y-4">
      <div class="space-y-1">
        <p class="text-xs font-semibold uppercase tracking-wide text-primary">Occupancy Modes</p>
        <h2 class="text-xl font-bold tracking-tight sm:text-2xl">ความต่างที่ควรรู้ก่อนเลือกรูปแบบการพัก</h2>
        <p class="text-sm text-muted-foreground">เลือกรูปแบบการพักก่อนกดจอง — เปลี่ยนใจได้ตราบใดที่ยังไม่ได้ล็อกห้อง</p>
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <Card v-for="m in occupancyModes" :key="m.tag" class="rounded-3xl transition-colors hover:border-primary/40">
          <CardContent class="space-y-4 p-6 sm:p-7">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <component :is="m.icon" class="size-5" aria-hidden="true" />
            </div>
            <div class="space-y-1">
              <p class="text-xs font-semibold uppercase tracking-widest text-primary">{{ m.tag }}</p>
              <h3 class="text-xl font-bold">{{ m.title }}</h3>
            </div>
            <ul class="divide-y">
              <li v-for="p in m.points" :key="p" class="py-2.5 text-sm text-muted-foreground">{{ p }}</li>
            </ul>
            <RouterLink to="/rooms" class="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {{ m.ctaLabel }} <ArrowRightIcon class="size-3.5" aria-hidden="true" />
            </RouterLink>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- CTA -->
    <Card class="rounded-3xl border-primary/25 bg-primary/5">
      <CardContent class="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <div class="space-y-1">
          <h2 class="text-xl font-bold">พร้อมแล้ว? เริ่มจากดูห้องว่างวันนี้</h2>
          <p class="text-sm text-muted-foreground">สถานะห้องอัปเดตจากข้อมูลจริงรายห้อง — ยังไม่ต้องเข้าสู่ระบบก็ดูได้</p>
        </div>
        <div class="flex shrink-0 gap-2">
          <Button as-child class="rounded-full">
            <RouterLink to="/rooms">ดูแผนผังห้องพัก <ArrowRightIcon aria-hidden="true" /></RouterLink>
          </Button>
          <Button as-child variant="outline" class="rounded-full">
            <RouterLink :to="accountAction.to">{{ accountAction.label }}</RouterLink>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
