<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CircleAlertIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import {
  contractStatusLabel,
  holdStatusLabel,
  keyHandoverStatusLabel,
  occupancyModeLabel,
  resultStatusLabel,
  roommateGroupStatusLabel,
} from '@/lib/labels'
import { useContractsStore } from '@/stores/contracts'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const reservation = useReservationStore()
const payments = usePaymentsStore()
const contractsStore = useContractsStore()

const myResv = computed(() => reservation.myReservation)
const myGroup = computed(() => reservation.myRoommateGroup)
const myObligations = computed(() => payments.myObligations)

const contractProgress = computed(() =>
  myResv.value ? contractsStore.groupContractProgress(myResv.value.id) : null,
)
const myContract = computed(() => contractsStore.myContracts[0])
const myHandover = computed(() => contractsStore.myKeyHandovers[0])

const reservationStatusText = computed(() => {
  if (!myResv.value) return 'ยังไม่มีการจอง'
  if (myResv.value.holdStatus === 'confirmed') return 'ยืนยันถาวรแล้ว (ได้ห้องแล้ว)'
  if (payments.groupPaymentComplete(myResv.value.id)) return 'ชำระครบแล้ว — รอเจ้าหน้าที่ยืนยัน'
  return 'รอชำระครบทุกรายการของทุกคนในกลุ่ม'
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold">สวัสดี {{ session.currentUser?.displayName }}</h1>
      <p class="text-sm text-muted-foreground">
        สถานะแต่ละด้านแสดงแยกกันเสมอ เพื่อให้รู้ชัดว่าเหลือขั้นตอนใด
      </p>
    </div>

    <!-- โปรไฟล์ไม่ครบ: บล็อกการเชิญ/จอง แต่เก็บร่างไว้ (AUTH-007) -->
    <Alert v-if="!session.currentUser?.profileComplete" variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>โปรไฟล์ยังไม่ครบถ้วน</AlertTitle>
      <AlertDescription>
        กรอกข้อมูลที่จำเป็นให้ครบก่อน จึงจะเชิญรูมเมทหรือจองห้องได้ —
        <RouterLink to="/app/application" class="underline">ไปกรอกข้อมูลใบสมัคร</RouterLink>
      </AlertDescription>
    </Alert>

    <!-- การ์ดสถานะแยก 7 ด้าน — ห้ามรวบเป็นสถานะเดียว (doc 03 §6, RESV-010) -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <!-- 1. ห้องและรูปแบบการพัก -->
      <Card>
        <CardContent class="space-y-1.5 p-4">
          <p class="text-xs font-semibold uppercase text-muted-foreground">ห้องพัก</p>
          <template v-if="myResv">
            <p class="text-lg font-bold">ห้อง {{ myResv.roomNumber }}</p>
            <p class="text-sm text-muted-foreground">{{ occupancyModeLabel[myResv.occupancyMode] }}</p>
          </template>
          <template v-else>
            <p class="text-sm text-muted-foreground">ยังไม่ได้เลือกห้อง</p>
            <RouterLink to="/app/rooms" class="text-sm text-primary underline">ไปเลือกห้อง</RouterLink>
          </template>
        </CardContent>
      </Card>

      <!-- 2. รูมเมท -->
      <Card>
        <CardContent class="space-y-1.5 p-4">
          <p class="text-xs font-semibold uppercase text-muted-foreground">รูมเมท</p>
          <template v-if="myGroup">
            <p class="font-medium">{{ roommateGroupStatusLabel[myGroup.status] }}</p>
            <p class="text-sm text-muted-foreground">สมาชิก {{ myGroup.memberIds.length }} / 2 คน</p>
          </template>
          <template v-else>
            <p class="text-sm text-muted-foreground">ยังไม่มีกลุ่มรูมเมท</p>
            <RouterLink to="/app/roommate" class="text-sm text-primary underline">เชิญรูมเมท</RouterLink>
          </template>
        </CardContent>
      </Card>

      <!-- 3. การล็อกห้อง (hold) -->
      <Card>
        <CardContent class="space-y-2 p-4">
          <p class="text-xs font-semibold uppercase text-muted-foreground">การล็อกห้อง</p>
          <template v-if="myResv">
            <p class="font-medium">{{ holdStatusLabel[myResv.holdStatus] }}</p>
            <HoldCountdown
              v-if="myResv.holdStatus === 'held_roommate_confirmation' && myResv.confirmationDeadline"
              :expires-at="myResv.confirmationDeadline"
              label="รูมเมทต้องยืนยันภายใน"
            />
            <HoldCountdown
              v-else-if="myResv.holdStatus === 'held_payment' && myResv.paymentDeadline"
              :expires-at="myResv.paymentDeadline"
              label="ชำระเงินภายใน"
            />
          </template>
          <p v-else class="text-sm text-muted-foreground">ยังไม่มีห้องที่ถูกล็อก</p>
        </CardContent>
      </Card>

      <!-- 4. รายการชำระเงิน — ROOM/HL แยกบรรทัดเสมอ -->
      <Card>
        <CardContent class="space-y-1.5 p-4">
          <p class="text-xs font-semibold uppercase text-muted-foreground">การชำระเงิน</p>
          <template v-if="myObligations.length">
            <div v-for="o in myObligations" :key="o.id" class="flex items-center justify-between gap-2 text-sm">
              <span class="font-medium">{{ o.ref2 }}</span>
              <Badge :variant="payments.isPaid(o) ? 'secondary' : 'outline'">
                {{ resultStatusLabel[o.resultStatus] }}
              </Badge>
            </div>
            <RouterLink to="/app/payments" class="text-sm text-primary underline">ดูรายละเอียด/แบบฟอร์ม QR</RouterLink>
          </template>
          <p v-else class="text-sm text-muted-foreground">ยังไม่มีรายการชำระเงิน</p>
        </CardContent>
      </Card>

      <!-- 5. การจอง -->
      <Card>
        <CardContent class="space-y-1.5 p-4">
          <p class="text-xs font-semibold uppercase text-muted-foreground">สถานะการจอง</p>
          <p class="font-medium">{{ reservationStatusText }}</p>
          <p v-if="myResv && myResv.holdStatus !== 'confirmed'" class="text-xs text-muted-foreground">
            การจองยืนยันถาวรเมื่อทุกคนในกลุ่มชำระครบและเจ้าหน้าที่ยืนยัน
          </p>
        </CardContent>
      </Card>

      <!-- 6. สัญญา -->
      <Card>
        <CardContent class="space-y-1.5 p-4">
          <p class="text-xs font-semibold uppercase text-muted-foreground">สัญญา</p>
          <template v-if="contractProgress && contractProgress.total > 0">
            <p class="font-medium">ลงนามแล้ว {{ contractProgress.signed }} จาก {{ contractProgress.total }} ฉบับ</p>
            <p v-if="myContract" class="text-sm text-muted-foreground">
              ฉบับของฉัน: {{ contractStatusLabel[myContract.status] }}
            </p>
          </template>
          <p v-else class="text-sm text-muted-foreground">สัญญาจะพร้อมหลังการจองได้รับการยืนยัน</p>
        </CardContent>
      </Card>

      <!-- 7. รับกุญแจ -->
      <Card>
        <CardContent class="space-y-1.5 p-4">
          <p class="text-xs font-semibold uppercase text-muted-foreground">รับกุญแจ</p>
          <p class="font-medium">
            {{ myHandover ? keyHandoverStatusLabel[myHandover.status] : keyHandoverStatusLabel.not_ready }}
          </p>
          <p class="text-xs text-muted-foreground">
            รับกุญแจได้หลังชำระครบ ลงนามสัญญา และเอกสารครบตามที่หอกำหนด
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
