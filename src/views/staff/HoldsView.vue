<script setup lang="ts">
import { computed } from 'vue'
import { DoorOpenIcon, TimerIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { holdStatusLabel, occupancyModeLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import { useReservationStore } from '@/stores/reservation'

const reservation = useReservationStore()

const holds15 = computed(() => reservation.activeHolds.filter(h => h.holdStatus === 'held_roommate_confirmation').length)
const holds72 = computed(() => reservation.activeHolds.filter(h => h.holdStatus === 'held_payment').length)

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="ห้องที่ถูก hold"
      description="การหมดเวลา/ปล่อยห้องเป็นงานอัตโนมัติฝั่ง server (ปล่อยครั้งเดียวเท่านั้น) — จอนี้ไว้เฝ้าระวัง hold ที่ใกล้หมดเวลา"
      :icon="TimerIcon"
    >
      <template #meta>
        <div class="flex flex-wrap gap-2 pt-1">
          <Badge variant="warning">รอรูมเมทยืนยัน {{ holds15 }}</Badge>
          <Badge variant="info">รอชำระเงิน {{ holds72 }}</Badge>
        </div>
      </template>
    </StaffPageHeader>

    <div v-if="reservation.activeHolds.length" class="space-y-3">
      <Card v-for="h in reservation.activeHolds" :key="h.id" class="py-0">
        <CardContent class="flex flex-wrap items-center justify-between gap-3 p-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-bold tabular-nums text-primary" aria-hidden="true">
              {{ h.roomNumber }}
            </div>
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-bold">ห้อง {{ h.roomNumber }}</p>
                <Badge variant="outline">{{ occupancyModeLabel[h.occupancyMode] }}</Badge>
                <Badge :variant="h.holdStatus === 'held_roommate_confirmation' ? 'warning' : 'info'">
                  {{ holdStatusLabel[h.holdStatus] }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">สมาชิก: {{ h.memberIds.map(nameOf).join(', ') }}</p>
            </div>
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
        </CardContent>
      </Card>
    </div>

    <Empty v-else class="rounded-xl border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <DoorOpenIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>ไม่มีห้องที่ถูก hold อยู่ขณะนี้</EmptyTitle>
        <EmptyDescription>เมื่อผู้สมัครเริ่มจองห้อง รายการ hold พร้อมเวลานับถอยหลังจะแสดงที่นี่</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>
</template>
