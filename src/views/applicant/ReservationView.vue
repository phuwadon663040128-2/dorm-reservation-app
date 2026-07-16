<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import { holdStatusLabel, occupancyModeLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'

const reservation = useReservationStore()
const payments = usePaymentsStore()

const myResv = computed(() => reservation.myReservation)

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

// สถานะการชำระของสมาชิกแต่ละคน — เห็นความครบ/ไม่ครบ แต่ไม่โชว์รายละเอียดการเงินof รูมเมทเกินจำเป็น
const memberPaymentStates = computed(() => {
  if (!myResv.value) return []
  const list = payments.obligationsForGroup(myResv.value.id)
  return myResv.value.memberIds.map(memberId => {
    const own = list.filter(o => o.residentId === memberId)
    const paid = own.filter(o => payments.isPaid(o)).length
    return { memberId, paid, total: own.length, complete: own.length > 0 && paid === own.length }
  })
})

// หมดเวลา hold → ปล่อยห้องครั้งเดียว (จำลอง expiry worker ฝั่ง server)
function onHoldExpired() {
  if (!myResv.value) return
  const result = reservation.expireHold(myResv.value.id)
  if (result.ok) toast(result.message)
}
</script>

<template>
  <div class="space-y-5">
    <h1 class="text-2xl font-bold">การจองของฉัน</h1>

    <template v-if="myResv">
      <Card>
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <CardTitle class="text-lg">ห้อง {{ myResv.roomNumber }}</CardTitle>
            <Badge>{{ holdStatusLabel[myResv.holdStatus] }}</Badge>
          </div>
          <CardDescription>
            {{ occupancyModeLabel[myResv.occupancyMode] }}
            <template v-if="myResv.manual"> · สร้างโดยเจ้าหน้าที่ (manual)</template>
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <HoldCountdown
            v-if="myResv.holdStatus === 'held_roommate_confirmation' && myResv.confirmationDeadline"
            :expires-at="myResv.confirmationDeadline"
            label="รูมเมทต้องยืนยันห้องภายใน"
            @expired="onHoldExpired"
          />
          <HoldCountdown
            v-else-if="myResv.holdStatus === 'held_payment' && myResv.paymentDeadline"
            :expires-at="myResv.paymentDeadline"
            label="deadline ชำระเงินร่วมของกลุ่ม เหลือ"
            @expired="onHoldExpired"
          />

          <!-- ความครบของการชำระรายสมาชิก — กลุ่ม shared ใช้ deadline เดียว (doc 08) -->
          <div class="space-y-2">
            <p class="text-sm font-semibold">การชำระเงินของสมาชิก</p>
            <div
              v-for="s in memberPaymentStates"
              :key="s.memberId"
              class="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span>{{ nameOf(s.memberId) }}</span>
              <Badge :variant="s.complete ? 'secondary' : 'outline'">
                ชำระแล้ว {{ s.paid }} / {{ s.total }} รายการ
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground">
              การจองจะยืนยันถาวรเมื่อสมาชิกทุกคนชำระครบทุกรายการ และเจ้าหน้าที่กดยืนยัน —
              หากพ้น deadline โดยมีคนชำระไม่ครบ ห้องจะถูกปล่อยคืนตามกติกา (Provisional) และยอดที่ชำระแล้วเข้าสู่การตรวจสอบ/คืนเงิน
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button as-child variant="outline" size="sm">
              <RouterLink to="/app/payments">ไปหน้าชำระเงิน</RouterLink>
            </Button>
            <Button as-child variant="outline" size="sm">
              <RouterLink to="/app/contracts">ไปหน้าสัญญา</RouterLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </template>

    <Card v-else>
      <CardContent class="space-y-3 p-8 text-center">
        <p class="font-medium">ยังไม่มีการจอง</p>
        <p class="text-sm text-muted-foreground">เริ่มจากจับคู่รูมเมท (หรือเลือกเหมาห้อง) แล้วเลือกห้องจริงที่ต้องการ</p>
        <div class="flex justify-center gap-2">
          <Button as-child><RouterLink to="/app/roommate">จับคู่รูมเมท</RouterLink></Button>
          <Button as-child variant="outline"><RouterLink to="/app/rooms">ดูห้องว่าง</RouterLink></Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
