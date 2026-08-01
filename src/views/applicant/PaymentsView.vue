<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { CheckCircle2Icon, Clock3Icon, QrCodeIcon, WalletCardsIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import ReservationCancellationControl from '@/components/domain/ReservationCancellationControl.vue'
import { PRICING_REFERENCE_ACADEMIC_YEAR } from '@/fixtures/pricing'
import { formatBaht } from '@/lib/labels'
import { useApplicationStore } from '@/stores/application'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

const payments = usePaymentsStore()
const reservation = useReservationStore()
const application = useApplicationStore()
const session = useSessionStore()
const route = useRoute()
const router = useRouter()

interface PaymentCardHandle {
  openPaymentForm: () => boolean
}

const paymentCardRefs = new Map<string, PaymentCardHandle>()
const autoPaymentActive = ref(false)
const currentAutoObligationId = ref('')

const myResv = computed(() => reservation.myReservation)
const myObligations = computed(() => myResv.value
  ? payments.myObligations.filter(obligation => obligation.reservationGroupId === myResv.value?.id)
  : [],
)
const pendingCancellation = computed(() => myResv.value
  ? reservation.pendingCancellationForReservation(myResv.value.id)
  : undefined,
)
const myRefunds = computed(() => payments.refundRecords.filter(record => record.residentId === session.currentUser?.id))
const refundStatusLabel = {
  pending_review: 'รอตรวจสอบยอดคืน',
  approved: 'อนุมัติยอดคืนแล้ว',
  rejected: 'ไม่อนุมัติคืนเงิน',
  processing: 'กำลังดำเนินการคืนเงิน',
  completed: 'คืนเงินเสร็จสิ้น',
} as const
const readyToPay = computed(() => myObligations.value.filter(
  obligation => obligation.documentStatus === 'payment_form_ready'
    && !['paid', 'manual_recorded', 'confirmed'].includes(obligation.resultStatus),
).filter(() => !pendingCancellation.value))
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
const paymentDeadlineLabel = computed(() =>
  myResv.value?.occupancyMode === 'shared'
    ? 'deadline ชำระเงินร่วมของกลุ่ม เหลือ'
    : 'เวลาชำระเงินของคุณ เหลือ',
)

function setPaymentCardRef(obligationId: string, instance: unknown) {
  const handle = instance as PaymentCardHandle | null
  if (handle && typeof handle.openPaymentForm === 'function') {
    paymentCardRefs.set(obligationId, handle)
    return
  }
  paymentCardRefs.delete(obligationId)
}

function autoPaymentRequested() {
  const value = Array.isArray(route.query.pay) ? route.query.pay[0] : route.query.pay
  return value === 'auto'
}

async function clearAutoPaymentQuery() {
  if (!('pay' in route.query)) return
  const query = { ...route.query }
  delete query.pay
  await router.replace({ query })
}

async function openNextAutoPayment() {
  if (!autoPaymentActive.value || pendingCancellation.value) return
  await nextTick()

  const nextObligation = readyToPay.value[0]
  if (!nextObligation) {
    autoPaymentActive.value = false
    currentAutoObligationId.value = ''
    await clearAutoPaymentQuery()
    return
  }
  if (currentAutoObligationId.value === nextObligation.id) return

  const paymentCard = paymentCardRefs.get(nextObligation.id)
  if (!paymentCard?.openPaymentForm()) return

  currentAutoObligationId.value = nextObligation.id
  await clearAutoPaymentQuery()
}

async function onPaymentFlowFinished() {
  currentAutoObligationId.value = ''
  if (autoPaymentActive.value) {
    await nextTick()
    if (readyToPay.value.length) {
      await openNextAutoPayment()
      return
    }
    autoPaymentActive.value = false
  }
  if (!allPaid.value || !needsFirstApplication.value) return
  await router.push('/app/application')
}

watch(
  () => route.query.pay,
  () => {
    if (!autoPaymentRequested()) return
    autoPaymentActive.value = true
    void openNextAutoPayment()
  },
  { immediate: true, flush: 'post' },
)

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
        <span class="block text-xs">
          ยอดใน mock-up อ้างอิงประกาศค่าธรรมเนียมปีการศึกษา {{ PRICING_REFERENCE_ACADEMIC_YEAR }} ระหว่างรอราคาอย่างเป็นทางการของรอบปัจจุบัน
        </span>
      </p>
    </div>

    <Alert v-if="pendingCancellation" class="border-primary/30 bg-primary/5">
      <Clock3Icon aria-hidden="true" />
      <AlertTitle>พักการชำระเงินระหว่างรอตรวจคำขอยกเลิก</AlertTitle>
      <AlertDescription>ยังไม่สามารถเปิด QR หรือชำระรายการเพิ่มได้จนกว่าเจ้าหน้าที่จะตรวจคำขอ</AlertDescription>
    </Alert>
    <Alert v-else-if="readyToPay.length">
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
      v-if="myResv?.holdStatus === 'held_payment' && myResv.paymentDeadline && !groupPaymentComplete && !pendingCancellation"
      :expires-at="myResv.paymentDeadline"
      :label="paymentDeadlineLabel"
      @expired="onPaymentHoldExpired"
    />

    <div v-if="myObligations.length" class="space-y-3">
      <ObligationCard
        v-for="(o, index) in myObligations"
        :key="o.id"
        :ref="instance => setPaymentCardRef(o.id, instance)"
        :obligation="o"
        :disabled="Boolean(pendingCancellation)"
        :bill-index="index + 1"
        :bill-count="myObligations.length"
        :auto-queue-has-next="autoPaymentActive && readyToPay.some(item => item.id !== o.id)"
        @payment-flow-finished="onPaymentFlowFinished"
      />
    </div>
    <section v-if="myRefunds.length" class="space-y-3">
      <div>
        <h2 class="font-semibold">ติดตามการคืนเงิน</h2>
        <p class="text-sm text-muted-foreground">แยกสถานะตามบิล ROOM/HL การคืนเงินจริงดำเนินการโดยหน่วยงานผู้รับเงิน</p>
      </div>
      <Card v-for="refund in myRefunds" :key="refund.id" class="py-0">
        <CardContent class="space-y-3 p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-semibold">บิล {{ refund.action }}</p>
              <p class="text-xs text-muted-foreground">{{ refund.responsibleEntity }}</p>
            </div>
            <Badge :variant="refund.status === 'completed' ? 'success' : refund.status === 'rejected' ? 'destructive' : 'warning'">
              {{ refundStatusLabel[refund.status] }}
            </Badge>
          </div>
          <div class="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <div>
              <p class="text-xs text-muted-foreground">ยอดที่ชำระ</p>
              <p class="font-semibold tabular-nums">{{ formatBaht(refund.paidAmount) }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">ยอดที่อนุมัติคืน</p>
              <p class="font-semibold tabular-nums">{{ refund.approvedAmount === undefined ? 'รอตรวจ' : formatBaht(refund.approvedAmount) }}</p>
            </div>
          </div>
          <p v-if="refund.externalReference" class="text-xs text-muted-foreground">เลขอ้างอิง: {{ refund.externalReference }}</p>
          <p v-if="refund.notes" class="text-sm text-muted-foreground">{{ refund.notes }}</p>
        </CardContent>
      </Card>
    </section>
    <ReservationCancellationControl v-if="myResv" :reservation="myResv" />
    <Empty v-else-if="!myRefunds.length" class="border bg-card shadow-sm">
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
