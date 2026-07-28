<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { CheckCircle2Icon, Clock3Icon, QrCodeIcon, WalletCardsIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import ObligationCard from '@/components/domain/ObligationCard.vue'
import { useApplicationStore } from '@/stores/application'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

const payments = usePaymentsStore()
const reservation = useReservationStore()
const application = useApplicationStore()
const session = useSessionStore()
const router = useRouter()

const myResv = computed(() => reservation.myReservation)
const myObligations = computed(() => myResv.value
  ? payments.myObligations.filter(obligation => obligation.reservationGroupId === myResv.value?.id)
  : [],
)
const readyToPay = computed(() => myObligations.value.filter(
  obligation => obligation.documentStatus === 'payment_form_ready'
    && !['paid', 'manual_recorded', 'confirmed'].includes(obligation.resultStatus),
))
const waitingForForm = computed(() => myObligations.value.filter(
  obligation => !['payment_form_ready', 'cancelled', 'superseded'].includes(obligation.documentStatus)
    && !['paid', 'manual_recorded', 'confirmed'].includes(obligation.resultStatus),
))
const allPaid = computed(() => myObligations.value.length > 0 && myObligations.value.every(
  obligation => ['paid', 'manual_recorded', 'confirmed'].includes(obligation.resultStatus),
))
const groupPaymentComplete = computed(() => Boolean(
  myResv.value && payments.groupPaymentComplete(myResv.value.id),
))
const needsFirstApplication = computed(() => {
  const applicantId = session.currentUser?.id
  return Boolean(applicantId && !application.hasSubmittedApplication(applicantId))
})

async function onPaymentFlowFinished() {
  if (!allPaid.value || !needsFirstApplication.value) return
  await router.push('/app/application')
}

async function onPaymentHoldExpired() {
  const activeReservation = myResv.value
  if (!activeReservation || activeReservation.holdStatus !== 'held_payment') return
  const result = reservation.expireHold(activeReservation.id)
  if (!result.ok) return
  toast.error('หมดเวลาชำระเงิน ห้องถูกปล่อยคืนแล้ว กรุณาเลือกห้องใหม่')
  await router.push('/app/rooms')
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">การชำระเงิน</h1>
      <p class="text-sm text-muted-foreground">
        ชำระด้วยแบบฟอร์ม QR เฉพาะรายการที่ธนาคารส่งกลับมาให้ระบบ ไม่ต้องอัปโหลดสลิปในขั้นตอนปกติ
      </p>
    </div>

    <Alert v-if="readyToPay.length">
      <QrCodeIcon aria-hidden="true" />
      <AlertTitle>ดำเนินการต่อ: เปิด QR และชำระ {{ readyToPay.length }} รายการ</AlertTitle>
      <AlertDescription>
        เลือก “เปิด QR เพื่อชำระเงิน” ในรายการด้านล่าง แต่ละรายการ ROOM/HL ต้องชำระแยกกันและมีสถานะของตัวเอง
      </AlertDescription>
    </Alert>
    <Alert v-else-if="waitingForForm.length">
      <Clock3Icon aria-hidden="true" />
      <AlertTitle>ยังไม่ต้องชำระ — กำลังจัดทำแบบฟอร์ม QR</AlertTitle>
      <AlertDescription>
        เจ้าหน้าที่ต้องส่งออกรายการไป SCB และนำ combined PDF กลับเข้าระบบก่อน เมื่อพร้อมแล้วปุ่มเปิด QR จะปรากฏที่รายการโดยอัตโนมัติ
      </AlertDescription>
    </Alert>
    <Alert v-else-if="allPaid">
      <CheckCircle2Icon aria-hidden="true" />
      <AlertTitle>ชำระครบทุกรายการแล้ว</AlertTitle>
      <AlertDescription class="space-y-3">
        <p v-if="needsFirstApplication">
          ขั้นตอนถัดไปคือกรอกใบสมัคร ระบบได้เก็บข้อมูลหอ อาคาร ชั้น ประเภท และเลขห้องไว้ให้แล้ว
        </p>
        <p v-else>
          ระบบบันทึกสถานะการชำระเงินเรียบร้อยแล้ว คุณสามารถกลับมาตรวจสอบรายการและแบบฟอร์ม QR ได้จากหน้านี้
        </p>
        <Button v-if="needsFirstApplication" as-child size="sm">
          <RouterLink to="/app/application">ไปกรอกใบสมัคร</RouterLink>
        </Button>
      </AlertDescription>
    </Alert>

    <HoldCountdown
      v-if="myResv?.holdStatus === 'held_payment' && myResv.paymentDeadline && !groupPaymentComplete"
      :expires-at="myResv.paymentDeadline"
      label="deadline ชำระเงินร่วมของกลุ่ม เหลือ"
      @expired="onPaymentHoldExpired"
    />

    <div v-if="myObligations.length" class="space-y-3">
      <ObligationCard
        v-for="o in myObligations"
        :key="o.id"
        :obligation="o"
        @payment-flow-finished="onPaymentFlowFinished"
      />
    </div>
    <Empty v-else class="border bg-card shadow-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon"><WalletCardsIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>ยังไม่มีรายการชำระเงิน</EmptyTitle>
        <EmptyDescription>รายการจะถูกสร้างหลังเลือกและยืนยันห้องเรียบร้อยแล้ว</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button as-child variant="outline">
          <RouterLink to="/app/rooms">ไปเลือกห้องพัก</RouterLink>
        </Button>
      </EmptyContent>
    </Empty>
  </div>
</template>
