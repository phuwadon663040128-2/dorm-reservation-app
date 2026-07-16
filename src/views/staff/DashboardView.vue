<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ShieldAlertIcon } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
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

// widget ตามเอกสาร 03 §Staff Dashboard + เอกสาร 05 §Daily operational dashboard
const widgets = computed(() => {
  const holds15 = reservation.reservationGroups.filter(r => r.holdStatus === 'held_roommate_confirmation').length
  const holds72 = reservation.reservationGroups.filter(r => r.holdStatus === 'held_payment').length
  const incompleteGroups = reservation.reservationGroups.filter(
    r => r.holdStatus === 'held_payment' && !payments.groupPaymentComplete(r.id),
  ).length
  const contractsIncomplete = contractsStore.contracts.filter(c => c.status !== 'signed_received').length
  const handoverPending = contractsStore.keyHandovers.filter(k => k.status === 'ready' || k.status === 'not_ready').length

  return [
    { label: 'ห้องว่าง', value: dorm.availabilitySummary.available, to: '/staff/rooms' },
    { label: 'รอรูมเมทยืนยัน (15 นาที)', value: holds15, to: '/staff/holds', warn: holds15 > 0 },
    { label: 'รอชำระเงิน (72 ชม.)', value: holds72, to: '/staff/holds', warn: holds72 > 0 },
    { label: 'ห้องยืนยันถาวรแล้ว', value: reservation.confirmedReservations.length, to: '/staff/rooms' },
    { label: 'กลุ่มชำระยังไม่ครบ', value: incompleteGroups, to: '/staff/scb/results', warn: incompleteGroups > 0 },
    { label: 'รายการพร้อม export', value: payments.readyForExport.length, to: '/staff/scb/export' },
    { label: 'หน้า PDF ที่ match ไม่ได้', value: payments.unmatchedPdfPages.length, to: '/staff/scb/pdf-import', warn: payments.unmatchedPdfPages.length > 0 },
    { label: 'Payment exception เปิดอยู่', value: payments.openExceptions.length, to: '/staff/scb/results', warn: payments.openExceptions.length > 0 },
    { label: 'สัญญายังไม่ครบ', value: contractsIncomplete, to: '/staff/contracts' },
    { label: 'รอส่งมอบกุญแจ', value: handoverPending, to: '/staff/key-handover' },
    { label: 'คิวส่งข้อมูลมหาวิทยาลัย', value: contractsStore.handoffBatches.filter(b => b.status === 'queued').length, to: '/staff/handoff' },
  ]
})
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

  <div v-else class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">Dashboard ปฏิบัติการรายวัน</h1>
      <p class="text-sm text-muted-foreground">
        Pilot: วรเรสซิเดนซ์ / หอ 8 หลัง + หอพักวรอินเตอร์ · ตัวเลขคำนวณจากข้อมูลห้องจริงรายห้อง
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <RouterLink v-for="w in widgets" :key="w.label" :to="w.to" class="group">
        <Card class="h-full transition-colors group-hover:border-primary">
          <CardContent class="p-4">
            <p class="text-2xl font-bold tabular-nums" :class="w.warn ? 'text-amber-600 dark:text-amber-400' : ''">
              {{ w.value }}
            </p>
            <p class="text-xs text-muted-foreground">{{ w.label }}</p>
          </CardContent>
        </Card>
      </RouterLink>
    </div>
  </div>
</template>
