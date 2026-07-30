<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  FilePenLineIcon,
  UsersIcon,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate, roomConfigOptions } from '@/lib/labels'
import { feeAcademicYear } from '@/fixtures/fees'
import { useTheme } from '@/composables/useTheme'
import { useDormStore } from '@/stores/dorm'
import heroDay from '@/assets/hero-day.png'
import heroNight from '@/assets/hero-night.png'
import dorm8Light from '@/assets/dorm-home/dorm-8-light.png'
import dorm8Dark from '@/assets/dorm-home/dorm-8-dark.png'
import dormInterLight from '@/assets/dorm-home/dorm-inter-light.png'
import dormInterDark from '@/assets/dorm-home/dorm-inter-dark.png'

const dorm = useDormStore()
const router = useRouter()
const { theme } = useTheme()

// โหลดเฉพาะรูปของธีมที่ใช้อยู่ (กลางวัน/กลางคืน) — สลับทันทีเมื่อเปลี่ยนธีม
const heroPhoto = computed(() => (theme.value === 'dark' ? heroNight : heroDay))
const homeDormPhotos = computed<Record<string, string>>(() => ({
  'dorm-8-lang': theme.value === 'dark' ? dorm8Dark : dorm8Light,
  'dorm-wor-inter': theme.value === 'dark' ? dormInterDark : dormInterLight,
}))

const openCampaign = computed(() => dorm.openCampaigns[0])

// ตัวกรองใน search bar — ส่งต่อไปหน้า /rooms เป็น query
const searchDorm = ref('all')
const searchConfig = ref('all')
const searchGender = ref('all')

function search() {
  const query: Record<string, string> = {}
  if (searchDorm.value !== 'all') query.dorm = searchDorm.value
  if (searchConfig.value !== 'all') query.config = searchConfig.value
  if (searchGender.value !== 'all') query.gender = searchGender.value
  router.push({ path: '/rooms', query })
}

const steps = [
  {
    icon: UsersIcon,
    title: 'จับคู่รูมเมทหรือเลือกเหมาห้อง',
    detail: 'ส่งคำเชิญรูมเมท (มีอายุ 48 ชม.) หรือเลือกพักคนเดียวแบบเหมาห้อง',
  },
  {
    icon: CalendarDaysIcon,
    title: 'เลือกห้องจริงรายห้อง',
    detail: 'เลือกหอพัก ชั้น ห้อง เห็นสถานะว่าง/ถูกจองชั่วคราวแบบเรียลไทม์',
  },
  {
    icon: FilePenLineIcon,
    title: 'ชำระเงินแล้วกรอกใบสมัคร',
    detail: 'ชำระผ่านแบบฟอร์ม QR ภายใน 72 ชม. จากนั้นระบบเติมข้อมูลห้องให้ในใบสมัคร ก่อนดำเนินการยืนยันและสัญญา',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <img
        :src="heroPhoto"
        alt="อาคารหอพัก KKU-WORA International Dormitory"
        class="absolute inset-0 h-full w-full object-cover object-center"
      />
      <!-- overlay ไล่เฉดตามธีมอัตโนมัติผ่านตัวแปร background
           มือถือ (จอแคบ ข้อความซ้อนบนรูปเต็มจอ) ใช้ไล่เฉดแนวตั้งเข้มกว่าเพื่อ contrast — จอใหญ่ไล่ซ้าย→ขวาแบบเดิม -->
      <div
        class="absolute inset-0 bg-linear-to-b from-background via-background/85 to-background/55 sm:bg-linear-to-r sm:from-background sm:via-background/70 sm:to-transparent"
        aria-hidden="true"
      />
      <div class="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent" aria-hidden="true" />

      <div class="relative mx-auto flex min-h-135 w-full max-w-352 flex-col justify-center px-3 py-14 sm:px-5 lg:min-h-155 lg:py-20">
        <div class="max-w-5xl space-y-5">
          <p
            v-if="openCampaign"
            class="inline-flex items-center gap-2 rounded-full border bg-card/90 px-3.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur sm:px-4 sm:text-sm"
          >
            <span class="relative flex size-2" aria-hidden="true">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            เปิดให้จอง · {{ formatDate(openCampaign.openDate) }} – {{ formatDate(openCampaign.closeDate) }}
          </p>

          <!-- มือถือลดขนาดลงและปล่อยตัดบรรทัดตามธรรมชาติ (ซ่อน <br> บังคับ) — จอใหญ่คง 3 บรรทัดตามดีไซน์ -->
          <h1 class="text-balance text-[1.6rem] font-bold leading-snug tracking-tight sm:text-5xl sm:leading-tight">
            บริการของหอพักออนไลน์<br class="hidden sm:block" />
            <span class="text-primary">เลือกห้องพัก ชำระเงิน และทำสัญญา<br class="hidden sm:block" />ครบในระบบเดียว</span>
          </h1>

          <p class="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            ระบบรับสมัครและจองหอพักในกำกับมหาวิทยาลัยขอนแก่น รองรับการเลือกห้องเป็นรายห้อง จับคู่รูมเมท
            เหมาห้อง ชำระเงินผ่านแบบฟอร์มธนาคารอย่างเป็นทางการ และติดตามสัญญาจนถึงวันรับกุญแจ
          </p>
        </div>

        <!-- Search bar -->
        <form
          class="mt-6 flex w-full max-w-4xl flex-col gap-2 rounded-3xl border bg-card p-3 shadow-xl shadow-black/5 transition-[border-color,box-shadow] duration-300 dark:border-primary/20 dark:shadow-[0_0_16px_-11px_var(--primary)] dark:ring-1 dark:ring-primary/5 dark:focus-within:border-primary/30 dark:focus-within:shadow-[0_0_20px_-11px_var(--primary)] dark:focus-within:ring-primary/10 md:flex-row md:items-center md:gap-0 md:rounded-full md:py-2 md:pl-2 md:pr-2"
          @submit.prevent="search"
        >
          <div class="min-w-0 flex-1 px-4 py  -1.5">
            <span class="block text-xs text-muted-foreground" aria-hidden="true">หอพัก</span>
            <Select v-model="searchDorm">
              <SelectTrigger aria-label="เลือกหอพัก" class="h-auto w-full border-0 bg-transparent p-0 font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" :side-offset="6" :avoid-collisions="false">
                <SelectItem value="all">หอพักทั้งหมด</SelectItem>
                <SelectItem v-for="g in dorm.dormGroups" :key="g.id" :value="g.id">{{ g.shortName }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="hidden h-10 w-px bg-border md:block" aria-hidden="true" />
          <div class="min-w-0 flex-1 px-4 py-1.5">
            <span class="block text-xs text-muted-foreground" aria-hidden="true">ประเภทห้อง</span>
            <Select v-model="searchConfig">
              <SelectTrigger aria-label="เลือกประเภทห้อง" class="h-auto w-full border-0 bg-transparent p-0 font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" :side-offset="6" :avoid-collisions="false">
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem v-for="option in roomConfigOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="hidden h-10 w-px bg-border md:block" aria-hidden="true" />
          <div class="min-w-0 flex-1 px-4 py-1.5">
            <span class="block text-xs text-muted-foreground" aria-hidden="true">เพศ</span>
            <Select v-model="searchGender">
              <SelectTrigger aria-label="เลือกเพศ" class="h-auto w-full border-0 bg-transparent p-0 font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" :side-offset="6" :avoid-collisions="false">
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="male">ชาย</SelectItem>
                <SelectItem value="female">หญิง</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <!-- hover = ปุ่มยกตัว + เงาอุ่นด้านล่าง + ลูกศรเลื่อนนำสายตา · active = กดจมกลับ เงาหุบ -->
          <Button
            type="submit"
            size="lg"
            class="rounded-full duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:brightness-105 active:translate-y-0 active:bg-primary active:shadow-sm active:shadow-primary/25 active:brightness-95 md:h-14 md:px-8"
          >
            ค้นหาห้อง
            <ArrowRightIcon class="transition-transform duration-200 group-hover/button:translate-x-1" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </section>

    <!-- หอพัก + ขั้นตอนการจอง -->
    <section class="mx-auto w-full max-w-352 px-3 py-10 sm:px-5">
      <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-5">
          <div class="flex items-end justify-between gap-3">
            <h2 class="text-xl font-bold tracking-tight sm:text-2xl">หอพัก</h2>
            <RouterLink to="/rooms" class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              ดูตึกทั้งหมด →
            </RouterLink>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <RouterLink
              v-for="g in dorm.dormGroups"
              :key="g.id"
              :to="{ path: '/rooms', query: { dorm: g.id } }"
              class="group relative block overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-lg"
            >
              <img
                :src="homeDormPhotos[g.id] ?? g.photo"
                :alt="`ภาพ${g.name}`"
                class="aspect-4/5 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <!-- โหมดมืดใช้ภาพกลางคืน (เข้มอยู่แล้ว) จึงลดความเข้มของ gradient ลงให้ภาพสว่างขึ้น -->
              <div class="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/90 via-black/45 to-transparent dark:from-black/70 dark:via-black/20" aria-hidden="true" />
              <div class="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white">
                <div class="space-y-1">
                  <p class="text-xl font-bold tracking-tight sm:text-2xl">{{ g.shortName }}</p>
                  <p class="text-sm text-white/85">{{ g.buildingCount }} ตึก · {{ g.contractLabel }}</p>
                  <p class="line-clamp-2 text-xs leading-relaxed text-white/70">{{ g.description }}</p>
                </div>
                <div class="flex items-center justify-between gap-2 border-t border-white/25 pt-3">
                  <div>
                    <p class="text-sm font-semibold">
                      เริ่มต้น ฿{{ g.priceFromPerTerm.toLocaleString('th-TH') }} / คน / ภาค (พักคู่)
                    </p>
                    <p class="text-[11px] text-white/65">อ้างอิงประกาศปีการศึกษา {{ feeAcademicYear }}</p>
                  </div>
                  <span
                    class="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/40 transition-all group-hover:translate-x-0.5 group-hover:bg-white group-hover:text-black"
                    aria-hidden="true"
                  >
                    <ArrowRightIcon class="size-4" />
                  </span>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- ขั้นตอนการจอง — การ์ดซ้อนแนวตั้งตามดีไซน์ Figma: ไอคอนวงกลม + หัวข้อมีเลขนำหน้า
             การ์ดยืดเฉลี่ยเต็มความสูงคอลัมน์ (flex-1) ให้ขอบล่างเสมอกับการ์ดหอพักฝั่งซ้าย -->
        <div class="flex flex-col gap-5">
          <h2 class="text-xl font-bold tracking-tight sm:text-2xl">ขั้นตอนการจอง</h2>
          <ol class="flex flex-1 flex-col gap-2.5">
            <li v-for="(s, i) in steps" :key="s.title" class="flex flex-1">
              <!-- py-0 ตัด padding ในตัว Card ออก — ใช้ padding จาก CardContent ที่เดียว ให้สามใบรวมแล้วสูงไม่เกินคอลัมน์ซ้าย -->
              <Card class="w-full rounded-3xl py-0 transition-colors hover:border-primary/40">
                <CardContent class="flex h-full flex-col justify-center gap-2 p-5 sm:px-6">
                  <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <component :is="s.icon" class="size-5" aria-hidden="true" />
                  </div>
                  <p class="font-bold leading-relaxed">{{ i + 1 }}. {{ s.title }}</p>
                  <p class="leading-relaxed text-muted-foreground">{{ s.detail }}</p>
                </CardContent>
              </Card>
            </li>
          </ol>
        </div>
      </div>
    </section>
  </div>
</template>
