<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  ClockIcon,
  FileTextIcon,
  LandmarkIcon,
  ScanLineIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import DemoQrCode from '@/components/domain/DemoQrCode.vue'
import { documentStatusLabel, formatBaht, formatDate, resultStatusLabel } from '@/lib/labels'
import { usePaymentsStore } from '@/stores/payments'
import type { PaymentObligation } from '@/types'

const props = defineProps<{ obligation: PaymentObligation }>()
const emit = defineEmits<{ (e: 'payment-flow-finished'): void }>()
const payments = usePaymentsStore()
const formOpen = ref(false)
const statusOpen = ref(false)
const paymentPhase = ref<'idle' | 'processing' | 'succeeded'>('idle')
const PAYMENT_PROCESSING_DELAY_MS = 900
let paymentTimer: number | undefined

const paid = computed(() =>
  ['paid', 'manual_recorded', 'confirmed'].includes(props.obligation.resultStatus),
)
const hasException = computed(() => props.obligation.resultStatus === 'exception')
const formReady = computed(
  () => props.obligation.documentStatus === 'payment_form_ready' && !!props.obligation.pdfPageId,
)
const paymentPayload = computed(() => [
  props.obligation.id,
  props.obligation.roomNumber,
  props.obligation.ref2,
  props.obligation.amount,
  props.obligation.pdfPageId,
].join('|'))

function openPaymentForm() {
  paymentPhase.value = 'idle'
  statusOpen.value = false
  formOpen.value = true
}

function preventStatusDialogDismiss(event: Event) {
  event.preventDefault()
}

function simulatePayment() {
  if (paymentPhase.value === 'processing' || paid.value) return
  formOpen.value = false
  paymentPhase.value = 'processing'
  statusOpen.value = true
  window.clearTimeout(paymentTimer)

  // เว้นช่วงสั้น ๆ ให้ผู้ใช้เห็นว่าระบบกำลังตรวจผลจากธนาคารก่อนเปลี่ยนสถานะรายการ
  paymentTimer = window.setTimeout(() => {
    paymentTimer = undefined
    if (!payments.simulateBankPayment(props.obligation.id)) {
      paymentPhase.value = 'idle'
      statusOpen.value = false
      formOpen.value = true
      toast.error('ยังไม่สามารถจำลองการชำระรายการนี้ได้')
      return
    }
    paymentPhase.value = 'succeeded'
  }, PAYMENT_PROCESSING_DELAY_MS)
}

function finishPaymentFlow() {
  statusOpen.value = false
  paymentPhase.value = 'idle'
  emit('payment-flow-finished')
}

onBeforeUnmount(() => {
  if (paymentTimer !== undefined) {
    window.clearTimeout(paymentTimer)
  }
})
</script>

<template>
  <Card>
    <CardContent class="flex flex-col gap-3 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Badge :variant="obligation.action === 'HL' ? 'outline' : 'default'">{{ obligation.action }}</Badge>
          <span class="font-medium">{{ obligation.title }}</span>
        </div>
        <span class="text-lg font-semibold tabular-nums">{{ formatBaht(obligation.amount) }}</span>
      </div>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
        <div>
          <dt class="text-xs">Ref.1 (ห้อง)</dt>
          <dd class="font-medium text-foreground">{{ obligation.roomNumber }}</dd>
        </div>
        <div>
          <dt class="text-xs">Ref.2 (รายการ)</dt>
          <dd class="font-medium text-foreground">{{ obligation.ref2 }}</dd>
        </div>
        <div>
          <dt class="text-xs">วันที่ออกบิล</dt>
          <dd class="font-medium text-foreground">{{ formatDate(obligation.billIssueDate) }}</dd>
        </div>
        <div>
          <dt class="text-xs">ชำระภายใน</dt>
          <dd class="font-medium text-foreground">{{ formatDate(obligation.paymentDeadline) }}</dd>
        </div>
      </dl>

      <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span
            class="inline-flex items-center gap-1.5"
            :class="paid ? 'text-emerald-700 dark:text-emerald-400' : hasException ? 'text-destructive' : 'text-amber-700 dark:text-amber-400'"
          >
            <CheckCircle2Icon v-if="paid" class="size-4" aria-hidden="true" />
            <CircleAlertIcon v-else-if="hasException" class="size-4" aria-hidden="true" />
            <ClockIcon v-else class="size-4" aria-hidden="true" />
            {{ resultStatusLabel[obligation.resultStatus] }}
          </span>
          <span class="text-muted-foreground">· เอกสาร: {{ documentStatusLabel[obligation.documentStatus] }}</span>
        </div>
        <Button v-if="formReady" size="sm" variant="outline" @click="openPaymentForm">
          <FileTextIcon aria-hidden="true" />
          {{ paid ? 'ดูแบบฟอร์ม QR' : 'เปิด QR เพื่อชำระเงิน' }}
        </Button>
        <span v-else-if="!paid" class="max-w-sm text-right text-xs text-muted-foreground">
          ยังไม่ต้องดำเนินการ — รอเจ้าหน้าที่นำเข้าแบบฟอร์ม PDF จาก SCB
        </span>
      </div>

      <p v-if="obligation.override" class="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        ยอดถูกปรับจาก {{ formatBaht(obligation.override.originalAmount) }} — เหตุผล: {{ obligation.override.reason }}
      </p>
    </CardContent>
  </Card>

  <Dialog v-model:open="formOpen">
    <DialogContent class="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>แบบฟอร์มชำระเงิน SCB</DialogTitle>
        <DialogDescription>
          หน้าเฉพาะรายการ {{ obligation.action }} ของคุณจาก combined PDF ที่เจ้าหน้าที่นำเข้าแล้ว
        </DialogDescription>
      </DialogHeader>

      <div class="rounded-lg bg-muted p-3 sm:p-5">
        <div class="mx-auto max-w-md space-y-4 rounded-sm border bg-white p-5 text-black shadow-sm">
          <div class="flex items-start justify-between gap-3 border-b border-black/15 pb-3">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-black/55">SCB Bill Payment · Prototype</p>
              <h3 class="mt-1 font-bold">หอพักในกำกับ มหาวิทยาลัยขอนแก่น</h3>
            </div>
            <LandmarkIcon class="size-7 shrink-0" aria-hidden="true" />
          </div>

          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt class="text-black/55">Ref.1</dt>
              <dd class="font-mono font-semibold">{{ obligation.roomNumber }}</dd>
            </div>
            <div>
              <dt class="text-black/55">Ref.2</dt>
              <dd class="font-mono font-semibold">{{ obligation.ref2 }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-black/55">รายการ</dt>
              <dd class="font-medium">{{ obligation.title }}</dd>
            </div>
            <div>
              <dt class="text-black/55">ยอดชำระ</dt>
              <dd class="text-base font-bold">{{ formatBaht(obligation.amount) }}</dd>
            </div>
            <div>
              <dt class="text-black/55">กำหนดชำระ</dt>
              <dd class="font-semibold">{{ formatDate(obligation.paymentDeadline) }}</dd>
            </div>
          </dl>

          <div class="mx-auto w-48 border border-black/10 p-2">
            <DemoQrCode :value="paymentPayload" />
          </div>
          <p class="text-center text-[11px] leading-4 text-black/60">
            เลขหน้า {{ obligation.pdfPageId }} · QR สำหรับสาธิต UX เท่านั้น ไม่สามารถใช้ชำระเงินจริง
          </p>
        </div>
      </div>

      <Alert v-if="!paid">
        <ScanLineIcon aria-hidden="true" />
        <AlertTitle>ขั้นตอนถัดไปในการทดสอบ</AlertTitle>
        <AlertDescription>
          กดปุ่มด้านล่างเพื่อจำลองการชำระผ่านแอปธนาคารและผลรายการที่ SCB ส่งกลับ ระบบจะเปลี่ยนสถานะเป็น “ชำระแล้ว”
        </AlertDescription>
      </Alert>
      <Alert v-else>
        <CheckCircle2Icon aria-hidden="true" />
        <AlertTitle>รายการนี้ชำระแล้ว</AlertTitle>
        <AlertDescription>เก็บแบบฟอร์มไว้ดูย้อนหลังได้ แต่ไม่ต้องชำระซ้ำ</AlertDescription>
      </Alert>

      <DialogFooter v-if="!paid">
        <Button class="w-full sm:w-auto" @click="simulatePayment">
          <ScanLineIcon aria-hidden="true" />
          จำลองชำระผ่าน SCB สำเร็จ
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="statusOpen">
    <DialogContent
      class="sm:max-w-sm"
      :show-close-button="false"
      @escape-key-down="preventStatusDialogDismiss"
      @interact-outside="preventStatusDialogDismiss"
    >
      <div class="flex flex-col items-center pt-2 text-center" role="status" aria-live="polite">
        <span
          v-if="paymentPhase === 'processing'"
          class="mb-4 grid size-14 place-items-center rounded-full bg-primary/10 text-primary"
        >
          <Spinner class="size-7" aria-hidden="true" />
        </span>
        <span
          v-else
          class="mb-4 grid size-14 place-items-center rounded-full bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950"
        >
          <CheckCircle2Icon class="size-8" aria-hidden="true" />
        </span>

        <DialogHeader class="items-center text-center">
          <DialogTitle>
            {{ paymentPhase === 'processing' ? 'กำลังประมวลผลการชำระเงิน' : 'ชำระเงินสำเร็จ' }}
          </DialogTitle>
          <DialogDescription class="max-w-xs text-center leading-relaxed">
            {{ paymentPhase === 'processing'
              ? 'กรุณารอสักครู่และอย่าปิดหน้าต่างนี้ ระบบกำลังตรวจสอบผลรายการ'
              : 'ระบบจำลองได้รับผลจาก SCB และบันทึกสถานะรายการนี้เรียบร้อยแล้ว' }}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div class="grid gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
        <div class="flex items-start justify-between gap-3">
          <span class="text-muted-foreground">รายการ</span>
          <span class="text-right font-medium">{{ obligation.title }}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-muted-foreground">ยอดชำระ</span>
          <span class="font-semibold tabular-nums">{{ formatBaht(obligation.amount) }}</span>
        </div>
      </div>

      <DialogFooter v-if="paymentPhase === 'succeeded'">
        <Button class="w-full" @click="finishPaymentFlow">
          <CheckCircle2Icon aria-hidden="true" />
          เสร็จสิ้น
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
