<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import { holdStatusLabel, occupancyModeLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import { useReservationStore } from '@/stores/reservation'

const reservation = useReservationStore()

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">ห้องที่ถูก hold</h1>
      <p class="text-sm text-muted-foreground">
        การหมดเวลา/ปล่อยห้องเป็นงานอัตโนมัติฝั่ง server (ปล่อยครั้งเดียวเท่านั้น) — จอนี้ไว้เฝ้าระวัง hold ที่ใกล้หมดเวลา
      </p>
    </div>

    <div v-if="reservation.activeHolds.length" class="space-y-3">
      <Card v-for="h in reservation.activeHolds" :key="h.id">
        <CardContent class="flex flex-wrap items-center justify-between gap-3 p-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <p class="text-lg font-bold">ห้อง {{ h.roomNumber }}</p>
              <Badge variant="outline">{{ occupancyModeLabel[h.occupancyMode] }}</Badge>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ holdStatusLabel[h.holdStatus] }} · สมาชิก: {{ h.memberIds.map(nameOf).join(', ') }}
            </p>
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
    <Card v-else>
      <CardContent class="p-8 text-center text-sm text-muted-foreground">ไม่มีห้องที่ถูก hold อยู่ขณะนี้</CardContent>
    </Card>
  </div>
</template>
