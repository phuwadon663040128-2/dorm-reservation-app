<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Building2Icon,
  CalendarRangeIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  FileSignatureIcon,
  FileSpreadsheetIcon,
  FileUpIcon,
  HourglassIcon,
  KeyRoundIcon,
  ScrollTextIcon,
  SendIcon,
  ShieldAlertIcon,
  TimerIcon,
  TriangleAlertIcon,
  WalletIcon,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import RoomStatusMeter from '@/components/domain/RoomStatusMeter.vue'
import StatCard from '@/components/domain/StatCard.vue'
import { formatDate, formatDateTime, holdStatusLabel } from '@/lib/labels'
import { useContractsStore } from '@/stores/contracts'
import { useDormStore } from '@/stores/dorm'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

const dorm = useDormStore()
const reservation = useReservationStore()
const payments = usePaymentsStore()
const contractsStore = useContractsStore()
const session = useSessionStore()

// Dashboard เป็นหน้า fallback ของทุกคน แต่ตัวเลขปฏิบัติการอยู่ในส่วนงาน overview —
// เจ้าหน้าที่ที่ผู้ดูแลระบบยังไม่เปิดสิทธิ์ต้องเห็นจอแจ้งสถานะแทน (AUTH-005/006)
const canViewOverview = computed(() => session.canAccessSection('overview'))

const todayLabel = new Date().toLocaleDateString('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const activeCampaign = computed(() => dorm.openCampaigns[0])

const incompleteGroups = computed(() =>
  reservation.reservationGroups.filter(
    r => r.holdStatus === 'held_payment' && !payments.groupPaymentComplete(r.id),
  ).length,
)
const contractsIncomplete = computed(() => contractsStore.contracts.filter(c => c.status !== 'signed_received').length)
const handoverPending = computed(() => contractsStore.keyHandovers.filter(k => k.status === 'ready').length)

// widget ตามเอกสาร 03 §Staff Dashboard + เอกสาร 05 §Daily operational dashboard
// จัดเป็น 3 หมวดตามสายงาน ให้เจ้าหน้าที่แต่ละฝ่ายกวาดตาเฉพาะแถวของตัวเองได้
const sections = computed(() => {
  const holds15 = reservation.reservationGroups.filter(r => r.holdStatus === 'held_roommate_confirmation').length
  const holds72 = reservation.reservationGroups.filter(r => r.holdStatus === 'held_payment').length
  const unmatchedPdf = payments.unmatchedPdfPages.length
  const openExceptions = payments.openExceptions.length

  return [
    {
      title: 'ห้องพักและการจอง',
      cards: [
        { label: 'ห้องว่าง', value: dorm.availabilitySummary.available, to: '/staff/rooms', icon: Building2Icon, tone: 'success' as const },
        { label: 'รอรูมเมทยืนยัน (15 นาที)', value: holds15, to: '/staff/holds', icon: TimerIcon, tone: holds15 > 0 ? ('warn' as const) : undefined },
        { label: 'รอชำระเงิน (72 ชม.)', value: holds72, to: '/staff/holds', icon: HourglassIcon, tone: holds72 > 0 ? ('warn' as const) : undefined },
        { label: 'ห้องยืนยันถาวรแล้ว', value: reservation.confirmedReservations.length, to: '/staff/rooms', icon: CircleCheckIcon },
      ],
    },
    {
      title: 'การเงิน SCB',
      cards: [
        { label: 'กลุ่มชำระยังไม่ครบ', value: incompleteGroups.value, to: '/staff/scb/results', icon: WalletIcon, tone: incompleteGroups.value > 0 ? ('warn' as const) : undefined },
        { label: 'รายการพร้อม export', value: payments.readyForExport.length, to: '/staff/scb/export', icon: FileSpreadsheetIcon },
        { label: 'หน้า PDF ที่ match ไม่ได้', value: unmatchedPdf, to: '/staff/scb/pdf-import', icon: FileUpIcon, tone: unmatchedPdf > 0 ? ('warn' as const) : undefined },
        { label: 'Payment exception เปิดอยู่', value: openExceptions, to: '/staff/scb/results', icon: TriangleAlertIcon, tone: openExceptions > 0 ? ('warn' as const) : undefined },
      ],
    },
    {
      title: 'สัญญาและส่งต่อ',
      cards: [
        { label: 'สัญญายังไม่ครบ', value: contractsIncomplete.value, to: '/staff/contracts', icon: FileSignatureIcon },
        { label: 'รอส่งมอบกุญแจ', value: contractsStore.keyHandovers.filter(k => k.status === 'ready' || k.status === 'not_ready').length, to: '/staff/key-handover', icon: KeyRoundIcon },
        { label: 'คิวส่งข้อมูลมหาวิทยาลัย', value: contractsStore.handoffBatches.filter(b => b.status === 'queued').length, to: '/staff/handoff', icon: SendIcon },
      ],
    },
  ]
})

// panel ขวา: งานที่ต้องมีคนตัดสินใจ เรียงจากเร่งด่วนสุด — ศูนย์รวม "เมนูจัดการ" ของวันนี้
interface TaskRow { label: string; count: number; to: string; icon: Component; tone: 'danger' | 'warn' | 'normal' }
const tasks = computed<TaskRow[]>(() => {
  const rows: TaskRow[] = []
  if (payments.openExceptions.length)
    rows.push({ label: 'Payment exception รอจัดการ', count: payments.openExceptions.length, to: '/staff/scb/results', icon: TriangleAlertIcon, tone: 'danger' })
  if (payments.unmatchedPdfPages.length)
    rows.push({ label: 'หน้า PDF จับคู่ไม่ได้', count: payments.unmatchedPdfPages.length, to: '/staff/scb/pdf-import', icon: FileUpIcon, tone: 'warn' })
  if (incompleteGroups.value)
    rows.push({ label: 'กลุ่มชำระยังไม่ครบ', count: incompleteGroups.value, to: '/staff/scb/results', icon: WalletIcon, tone: 'warn' })
  if (contractsIncomplete.value)
    rows.push({ label: 'สัญญารอดำเนินการ', count: contractsIncomplete.value, to: '/staff/contracts', icon: FileSignatureIcon, tone: 'normal' })
  if (handoverPending.value)
    rows.push({ label: 'พร้อมส่งมอบกุญแจ', count: handoverPending.value, to: '/staff/key-handover', icon: KeyRoundIcon, tone: 'normal' })
  return rows
})

const taskChip: Record<TaskRow['tone'], string> = {
  danger: 'bg-destructive/10 text-destructive',
  warn: 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  normal: 'bg-primary/10 text-primary',
}
const taskBadge: Record<TaskRow['tone'], 'destructive' | 'warning' | 'secondary'> = {
  danger: 'destructive',
  warn: 'warning',
  normal: 'secondary',
}

const recentEvents = computed(() =>
  [...contractsStore.auditEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5),
)
</script>

<template>
  <!-- เจ้าหน้าที่ที่ยังไม่ได้รับสิทธิ์ส่วนงานใด — ห้ามเห็นตัวเลขปฏิบัติการ -->
  <div v-if="!canViewOverview" class="mx-auto max-w-md py-16 text-center">
    <div class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
      <ShieldAlertIcon class="size-7 text-muted-foreground" aria-hidden="true" />
    </div>
    <h1 class="text-xl font-bold">ยังไม่ได้รับสิทธิ์เข้าถึงส่วนงาน</h1>
    <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
      บัญชีของคุณเป็นเจ้าหน้าที่แล้ว แต่ผู้ดูแลระบบยังไม่ได้เปิดสิทธิ์ส่วนงานใดให้
      กรุณาติดต่อผู้ดูแลระบบ (กองบริการหอพัก) เพื่อกำหนดสิทธิ์การเข้าถึง
    </p>
  </div>

  <div v-else class="space-y-6">
    <!-- ทักทาย + วันที่ + รอบรับสมัครที่เปิดอยู่ -->
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div class="space-y-1">
        <p class="text-sm text-muted-foreground">{{ todayLabel }}</p>
        <h1 class="text-2xl font-bold tracking-tight">สวัสดี, {{ session.currentUser?.displayName }}</h1>
        <p class="text-sm text-muted-foreground">
          Pilot: วรเรสซิเดนซ์ / หอ 8 หลัง + หอพักวรอินเตอร์ · ตัวเลขคำนวณจากข้อมูลห้องจริงรายห้อง
        </p>
      </div>
      <RouterLink v-if="activeCampaign" to="/staff/campaigns" class="group">
        <Badge variant="success" class="h-8 gap-1.5 px-3 text-sm font-medium">
          <CalendarRangeIcon aria-hidden="true" />
          เปิดรับสมัครถึง {{ formatDate(activeCampaign.closeDate) }}
        </Badge>
      </RouterLink>
    </header>

    <div class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- คอลัมน์หลัก: ภาพรวม + ตัวเลขปฏิบัติการ -->
      <div class="min-w-0 space-y-6">
        <Card>
          <CardHeader class="pb-3">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <CardTitle class="text-base">สถานะห้องทั้งหมด</CardTitle>
              <p class="text-sm text-muted-foreground">
                รวม <b class="tabular-nums text-foreground">{{ dorm.availabilitySummary.total.toLocaleString('th-TH') }}</b> ห้อง
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <RoomStatusMeter :summary="dorm.availabilitySummary" />
          </CardContent>
        </Card>

        <section v-for="sec in sections" :key="sec.title" class="space-y-3">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{{ sec.title }}</h2>
          <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              v-for="c in sec.cards"
              :key="c.label"
              :label="c.label"
              :value="c.value"
              :icon="c.icon"
              :to="c.to"
              :tone="c.tone"
            />
          </div>
        </section>
      </div>

      <!-- panel ขวา: งานสำคัญที่ต้องจัดการ + ความเคลื่อนไหวล่าสุด -->
      <aside class="min-w-0 space-y-5 xl:sticky xl:top-19">
        <Card class="gap-0 py-0">
          <CardHeader class="border-b py-4!">
            <CardTitle class="flex items-center gap-2 text-base">
              <TriangleAlertIcon class="size-4 text-primary" aria-hidden="true" />
              งานด่วนวันนี้
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <div v-if="tasks.length || reservation.activeHolds.length" class="divide-y">
              <RouterLink
                v-for="t in tasks"
                :key="t.label"
                :to="t.to"
                class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg" :class="taskChip[t.tone]" aria-hidden="true">
                  <component :is="t.icon" class="size-4" />
                </div>
                <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ t.label }}</span>
                <Badge :variant="taskBadge[t.tone]">{{ t.count }}</Badge>
                <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </RouterLink>

              <!-- hold ที่กำลังนับถอยหลัง — เห็นเวลาเหลือโดยไม่ต้องเข้าไปหน้า hold -->
              <RouterLink
                v-for="h in reservation.activeHolds"
                :key="h.id"
                to="/staff/holds"
                class="group block space-y-2 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div class="flex items-center gap-3">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300" aria-hidden="true">
                    <TimerIcon class="size-4" />
                  </div>
                  <span class="min-w-0 flex-1 truncate text-sm font-medium">ห้อง {{ h.roomNumber }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ holdStatusLabel[h.holdStatus] }}</span>
                </div>
                <HoldCountdown
                  v-if="h.holdStatus === 'held_roommate_confirmation' && h.confirmationDeadline"
                  :expires-at="h.confirmationDeadline"
                  label="เหลือเวลายืนยัน"
                />
                <HoldCountdown
                  v-else-if="h.holdStatus === 'held_payment' && h.paymentDeadline"
                  :expires-at="h.paymentDeadline"
                  label="เหลือเวลาชำระ"
                />
              </RouterLink>
            </div>
            <div v-else class="flex items-center gap-3 px-4 py-6">
              <CircleCheckIcon class="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <p class="text-sm text-muted-foreground">ไม่มีงานค้างที่ต้องจัดการตอนนี้</p>
            </div>
          </CardContent>
        </Card>

        <Card class="gap-0 py-0">
          <CardHeader class="border-b py-4!">
            <CardTitle class="flex items-center gap-2 text-base">
              <ScrollTextIcon class="size-4 text-primary" aria-hidden="true" />
              กิจกรรมล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <ul class="divide-y">
              <li v-for="e in recentEvents" :key="e.id" class="px-4 py-3">
                <p class="line-clamp-2 text-sm leading-snug">{{ e.detail }}</p>
                <p class="mt-1 text-xs text-muted-foreground">{{ e.actor }} · {{ formatDateTime(e.timestamp) }}</p>
              </li>
            </ul>
            <RouterLink
              to="/staff/audit"
              class="flex items-center justify-center gap-1 border-t px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/50"
            >
              ดู Audit log ทั้งหมด
              <ChevronRightIcon class="size-4" aria-hidden="true" />
            </RouterLink>
          </CardContent>
        </Card>
      </aside>
    </div>
  </div>
</template>
