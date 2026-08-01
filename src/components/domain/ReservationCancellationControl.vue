<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { BanIcon, Clock3Icon, ReceiptTextIcon, TriangleAlertIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { users } from '@/fixtures/users'
import { formatBaht, resultStatusLabel } from '@/lib/labels'
import { INPUT_LIMITS } from '@/lib/validation'
import { useContractsStore } from '@/stores/contracts'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'
import type { CancellationRequestKind, ReservationGroup } from '@/types'

const props = defineProps<{ reservation: ReservationGroup }>()

const router = useRouter()
const reservationStore = useReservationStore()
const payments = usePaymentsStore()
const contracts = useContractsStore()
const session = useSessionStore()

const dialogOpen = ref(false)
const reasonCode = ref('')
const reasonDetail = ref('')
const reasonError = ref('')
const impactAcknowledged = ref(false)
const impactError = ref('')

const reasons = [
  { value: 'change_room', label: 'ต้องการเลือกห้องใหม่' },
  { value: 'change_plan', label: 'เปลี่ยนแผนการเข้าพัก' },
  { value: 'payment_problem', label: 'ไม่สามารถดำเนินการชำระเงินได้' },
  { value: 'other', label: 'เหตุผลอื่น' },
]

const pendingRequest = computed(() => reservationStore.pendingCancellationForReservation(props.reservation.id))
const obligations = computed(() => payments.obligationsForGroup(props.reservation.id))
const hasPaid = computed(() => payments.hasPaidObligationsForReservation(props.reservation.id))
const signedContract = computed(() => contracts.hasSignedContractForReservation(props.reservation.id))
const isLeader = computed(() => props.reservation.leaderId === session.currentUser?.id)
const isSharedMember = computed(() => props.reservation.occupancyMode === 'shared' && !isLeader.value)
const requestKind = computed<CancellationRequestKind>(() => isSharedMember.value ? 'member_withdrawal' : 'group_cancellation')
const requiresReview = computed(() =>
  isSharedMember.value || hasPaid.value || props.reservation.holdStatus === 'confirmed',
)
const actionLabel = computed(() => {
  if (isSharedMember.value) return 'ขอถอนตัวจากการจอง'
  return requiresReview.value ? 'ส่งคำขอยกเลิก' : 'ยกเลิกการจอง'
})

function nameOf(userId: string) {
  return users.find(user => user.id === userId)?.displayName ?? userId
}

function obligationsOf(userId: string) {
  return obligations.value.filter(obligation => obligation.residentId === userId)
}

function openDialog() {
  reasonCode.value = ''
  reasonDetail.value = ''
  reasonError.value = ''
  impactAcknowledged.value = false
  impactError.value = ''
  dialogOpen.value = true
}

async function submitCancellation() {
  const selectedReason = reasons.find(reason => reason.value === reasonCode.value)?.label
  const detail = reasonDetail.value.trim()
  if (!selectedReason) {
    reasonError.value = 'กรุณาเลือกเหตุผล'
    return
  }
  if (reasonCode.value === 'other' && !detail) {
    reasonError.value = 'กรุณาระบุรายละเอียดเหตุผลอื่น'
    return
  }
  if (!impactAcknowledged.value) {
    impactError.value = 'กรุณายืนยันว่ารับทราบผลกระทบก่อนดำเนินการ'
    return
  }
  const reason = detail ? `${selectedReason}: ${detail}` : selectedReason
  if (reason.length > INPUT_LIMITS.cancellationReason) {
    reasonError.value = `เหตุผลรวมต้องไม่เกิน ${INPUT_LIMITS.cancellationReason} ตัวอักษร`
    return
  }

  const result = requiresReview.value
    ? reservationStore.requestPaidCancellation(props.reservation.id, reason, requestKind.value)
    : reservationStore.cancelUnpaidReservation(props.reservation.id, reason)
  if (!result.ok) {
    reasonError.value = result.message
    toast.error(result.message)
    return
  }

  dialogOpen.value = false
  toast.success(result.message)
  if (!requiresReview.value) await router.push('/app/rooms')
}
</script>

<template>
  <Alert v-if="pendingRequest" class="border-primary/30 bg-primary/5">
    <Clock3Icon aria-hidden="true" />
    <AlertTitle>กำลังพิจารณา{{ pendingRequest.kind === 'member_withdrawal' ? 'คำขอถอนตัว' : 'คำขอยกเลิก' }}</AlertTitle>
    <AlertDescription class="space-y-1">
      <p>ห้องและรายการชำระเงินที่เหลือถูกพักไว้ชั่วคราว เจ้าหน้าที่ยังไม่ได้ปล่อยห้อง</p>
      <p class="text-xs">เหตุผล: {{ pendingRequest.reason }}</p>
    </AlertDescription>
  </Alert>

  <Alert v-else-if="signedContract">
    <BanIcon aria-hidden="true" />
    <AlertTitle>ไม่สามารถยกเลิกด้วยตนเองได้</AlertTitle>
    <AlertDescription>การจองนี้มีสัญญาที่ลงนามแล้ว กรุณาติดต่อเจ้าหน้าที่หอพักเพื่อดำเนินการตามระเบียบ</AlertDescription>
  </Alert>

  <Button v-else type="button" variant="destructive" size="sm" @click="openDialog">
    <BanIcon aria-hidden="true" />
    {{ actionLabel }}
  </Button>

  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-h-[calc(100svh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ actionLabel }}</DialogTitle>
        <DialogDescription>
          {{ requiresReview
            ? 'ระบบจะพักรายการชำระเงินและส่งให้เจ้าหน้าที่ตรวจสอบก่อนปล่อยห้อง'
            : 'ห้องจะถูกปล่อยคืนทันทีหลังยืนยัน และกลุ่มรูมเมทยังเลือกห้องใหม่ได้' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="hasPaid" variant="destructive">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>มีรายการชำระเงินแล้ว</AlertTitle>
        <AlertDescription>ยอดที่ชำระจะเข้าสู่การพิจารณาแยกรายบิล ROOM/HL ระบบยังไม่รับประกันยอดหรือผลการคืนเงิน</AlertDescription>
      </Alert>

      <div class="space-y-2 rounded-lg border bg-muted/30 p-3">
        <div class="flex items-center gap-2">
          <ReceiptTextIcon class="size-4 text-primary" aria-hidden="true" />
          <p class="text-sm font-semibold">ห้อง {{ reservation.roomNumber }} · สมาชิก {{ reservation.memberIds.length }} คน</p>
        </div>
        <div v-for="memberId in reservation.memberIds" :key="memberId" class="rounded-md border bg-card p-2.5">
          <p class="text-sm font-medium">{{ nameOf(memberId) }}</p>
          <div v-if="obligationsOf(memberId).length" class="mt-2 space-y-1.5">
            <div v-for="obligation in obligationsOf(memberId)" :key="obligation.id" class="flex items-center justify-between gap-3 text-xs">
              <span class="flex items-center gap-1.5"><Badge variant="outline">{{ obligation.action }}</Badge>{{ resultStatusLabel[obligation.resultStatus] }}</span>
              <span class="font-medium tabular-nums">{{ formatBaht(obligation.amount) }}</span>
            </div>
          </div>
          <p v-else class="mt-1 text-xs text-muted-foreground">ยังไม่มีรายการชำระเงิน</p>
        </div>
      </div>

      <Field>
        <FieldLabel for="cancellation-reason">เหตุผล <span class="text-primary">*</span></FieldLabel>
        <Select v-model="reasonCode" @update:model-value="reasonError = ''">
          <SelectTrigger id="cancellation-reason" class="w-full" :aria-invalid="Boolean(reasonError && !reasonCode)">
            <SelectValue placeholder="เลือกเหตุผล" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="reason in reasons" :key="reason.value" :value="reason.value">{{ reason.label }}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel for="cancellation-detail">รายละเอียดเพิ่มเติม</FieldLabel>
        <Textarea id="cancellation-detail" v-model="reasonDetail" rows="3" :maxlength="INPUT_LIMITS.cancellationReason" :aria-invalid="Boolean(reasonError)" @input="reasonError = ''" />
        <div class="flex items-start justify-between gap-3">
          <FieldError :errors="[reasonError]" />
          <FieldDescription class="ml-auto tabular-nums">{{ reasonDetail.length }}/{{ INPUT_LIMITS.cancellationReason }}</FieldDescription>
        </div>
      </Field>

      <Field>
        <Label class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal">
          <Checkbox v-model="impactAcknowledged" class="mt-0.5" :aria-invalid="Boolean(impactError)" @update:model-value="impactError = ''" />
          <span class="text-sm leading-relaxed">
            ข้าพเจ้ารับทราบว่า{{ requiresReview
              ? 'ห้องจะยังไม่ถูกปล่อยระหว่างรอตรวจ และยอดที่ชำระแล้วไม่ได้รับประกันว่าจะคืนเต็มจำนวน'
              : 'ห้องจะถูกปล่อยคืนทันที บิลค้างถูกยกเลิก และต้องเลือกห้องใหม่' }}
          </span>
        </Label>
        <FieldError :errors="[impactError]" />
      </Field>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button type="button" variant="outline" @click="dialogOpen = false">กลับ</Button>
        <Button type="button" variant="destructive" :disabled="!impactAcknowledged" @click="submitCancellation">
          {{ requiresReview ? 'ยืนยันส่งคำขอ' : 'ยืนยันยกเลิกห้อง' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
