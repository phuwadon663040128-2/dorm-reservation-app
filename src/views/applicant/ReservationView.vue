<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { BedDoubleIcon, CheckCircle2Icon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import ReservationCancellationControl from '@/components/domain/ReservationCancellationControl.vue'
import { holdStatusLabel, occupancyModeLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'

const reservation = useReservationStore()
const payments = usePaymentsStore()

const myResv = computed(() => reservation.myReservation)
const paymentCompleteAwaitingReview = computed(() => Boolean(
  myResv.value?.holdStatus === 'held_payment'
  && payments.groupPaymentComplete(myResv.value.id),
))
const pendingCancellation = computed(() => myResv.value
  ? reservation.pendingCancellationForReservation(myResv.value.id)
  : undefined,
)
const isSharedReservation = computed(() => myResv.value?.occupancyMode === 'shared')
const paymentDeadlineLabel = computed(() =>
  isSharedReservation.value
    ? 'deadline ชำระเงินร่วมของกลุ่ม เหลือ'
    : 'เวลาชำระเงินของคุณ เหลือ',
)
const displayedReservationStatus = computed(() => {
  if (!myResv.value) return ''
  if (paymentCompleteAwaitingReview.value) return 'ชำระเงินครบแล้ว · รอตรวจสอบ'
  return holdStatusLabel[myResv.value.holdStatus]
})

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
            <Badge :variant="paymentCompleteAwaitingReview ? 'success' : 'default'">
              {{ displayedReservationStatus }}
            </Badge>
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
            v-else-if="myResv.holdStatus === 'held_payment' && myResv.paymentDeadline && !paymentCompleteAwaitingReview"
            :expires-at="myResv.paymentDeadline"
            :label="paymentDeadlineLabel"
            @expired="onHoldExpired"
          />
          <div
            v-else-if="paymentCompleteAwaitingReview"
            class="flex items-start gap-3 rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-3 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-100"
          >
            <CheckCircle2Icon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div class="space-y-0.5 text-sm">
              <p class="font-semibold">
                {{ isSharedReservation ? 'ชำระเงินของกลุ่มครบแล้ว' : 'ชำระเงินครบทุกรายการแล้ว' }}
              </p>
              <p class="text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
                {{ isSharedReservation
                  ? 'ระบบหยุดนับเวลาชำระเงินของกลุ่มแล้ว และกำลังรอเจ้าหน้าที่ตรวจสอบเพื่อยืนยันการจองอย่างเป็นทางการ'
                  : 'ระบบหยุดนับเวลาชำระเงินของคุณแล้ว และกำลังรอเจ้าหน้าที่ตรวจสอบเพื่อยืนยันการจองอย่างเป็นทางการ' }}
              </p>
            </div>
          </div>

          <!-- ความครบของการชำระรายสมาชิก — กลุ่ม shared ใช้ deadline เดียว (doc 08) -->
          <div class="space-y-2">
            <p class="text-sm font-semibold">
              {{ isSharedReservation ? 'การชำระเงินของสมาชิก' : 'การชำระเงินของคุณ' }}
            </p>
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
            <p v-if="paymentCompleteAwaitingReview" class="text-xs text-muted-foreground">
              {{ isSharedReservation
                ? 'สมาชิกชำระครบทุกรายการแล้ว ขั้นตอนถัดไปคือรอเจ้าหน้าที่ตรวจสอบและยืนยันการจองอย่างเป็นทางการ'
                : 'คุณชำระครบทุกรายการแล้ว ขั้นตอนถัดไปคือรอเจ้าหน้าที่ตรวจสอบและยืนยันการจองอย่างเป็นทางการ' }}
            </p>
            <p v-else-if="isSharedReservation" class="text-xs text-muted-foreground">
              การจองจะยืนยันถาวรเมื่อสมาชิกทุกคนชำระครบทุกรายการ และเจ้าหน้าที่กดยืนยัน —
              หากพ้น deadline โดยมีคนชำระไม่ครบ ห้องจะถูกปล่อยคืนตามกติกา (Provisional) และยอดที่ชำระแล้วเข้าสู่การตรวจสอบ/คืนเงิน
            </p>
            <p v-else class="text-xs text-muted-foreground">
              การจองจะยืนยันอย่างเป็นทางการเมื่อคุณชำระครบทุกรายการและเจ้าหน้าที่ตรวจสอบแล้ว —
              หากพ้นเวลาชำระ ห้องจะถูกปล่อยคืนตามกติกา (Provisional) และยอดที่ชำระแล้วเข้าสู่การตรวจสอบ/คืนเงิน
            </p>
          </div>

          <div v-if="!pendingCancellation" class="flex w-full flex-wrap justify-end gap-2">
            <Button as-child variant="outline" size="sm">
              <RouterLink to="/app/payments">ไปหน้าชำระเงิน</RouterLink>
            </Button>
            <Button as-child variant="outline" size="sm">
              <RouterLink to="/app/contracts">ไปหน้าสัญญา</RouterLink>
            </Button>
          </div>
          <ReservationCancellationControl :reservation="myResv" />
        </CardContent>
      </Card>
    </template>

    <Empty v-else class="border bg-card shadow-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon"><BedDoubleIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>ยังไม่มีการจอง</EmptyTitle>
        <EmptyDescription>เริ่มจากจับคู่รูมเมท หรือเลือกเหมาห้อง แล้วเลือกห้องจริงที่ต้องการ</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-wrap justify-center gap-2">
          <Button as-child><RouterLink to="/app/roommate">จับคู่รูมเมท</RouterLink></Button>
          <Button as-child variant="outline"><RouterLink to="/app/rooms">ดูห้องว่าง</RouterLink></Button>
        </div>
      </EmptyContent>
    </Empty>
  </div>
</template>
