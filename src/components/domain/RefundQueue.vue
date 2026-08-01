<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { BanknoteArrowDownIcon } from '@lucide/vue'
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { users } from '@/fixtures/users'
import { formatBaht } from '@/lib/labels'
import { INPUT_LIMITS } from '@/lib/validation'
import { usePaymentsStore } from '@/stores/payments'
import type { PaymentRefundStatus } from '@/types'

const payments = usePaymentsStore()

const refundStatusLabel: Record<PaymentRefundStatus, string> = {
  pending_review: 'รอตรวจสอบ',
  approved: 'อนุมัติยอดคืน',
  rejected: 'ไม่อนุมัติคืนเงิน',
  processing: 'กำลังดำเนินการคืนเงิน',
  completed: 'คืนเงินเสร็จสิ้น',
}

const refundStatusVariant: Record<PaymentRefundStatus, 'warning' | 'success' | 'destructive' | 'info'> = {
  pending_review: 'warning',
  approved: 'info',
  rejected: 'destructive',
  processing: 'info',
  completed: 'success',
}

const activeRefunds = computed(() => payments.refundRecords.filter(record => record.status !== 'completed'))
const completedRefunds = computed(() => payments.refundRecords.filter(record => record.status === 'completed'))
const dialogOpen = ref(false)
const selectedId = ref('')
const status = ref<PaymentRefundStatus>('pending_review')
const approvedAmount = ref('')
const externalReference = ref('')
const notes = ref('')
const formError = ref('')
const selectedRecord = computed(() => payments.refundRecords.find(record => record.id === selectedId.value))

function residentName(id: string) {
  return users.find(user => user.id === id)?.displayName ?? id
}

function openManage(id: string) {
  const record = payments.refundRecords.find(item => item.id === id)
  if (!record) return
  selectedId.value = id
  status.value = record.status
  approvedAmount.value = String(record.approvedAmount ?? record.paidAmount)
  externalReference.value = record.externalReference ?? ''
  notes.value = record.notes ?? ''
  formError.value = ''
  dialogOpen.value = true
}

function submitUpdate() {
  const record = selectedRecord.value
  if (!record) return
  const amount = approvedAmount.value.trim() === '' ? undefined : Number(approvedAmount.value)
  if (amount !== undefined && (!Number.isFinite(amount) || amount < 0 || amount > record.paidAmount)) {
    formError.value = `ยอดคืนต้องอยู่ระหว่าง 0 ถึง ${formatBaht(record.paidAmount)}`
    return
  }
  if (status.value === 'rejected' && !notes.value.trim()) {
    formError.value = 'กรุณาระบุเหตุผลที่ไม่อนุมัติคืนเงิน'
    return
  }
  if (status.value === 'completed' && !externalReference.value.trim()) {
    formError.value = 'กรุณาระบุเลขอ้างอิงการคืนเงินจริง'
    return
  }
  const updated = payments.updateRefundRecord(record.id, {
    status: status.value,
    approvedAmount: amount,
    externalReference: externalReference.value,
    notes: notes.value,
  })
  if (!updated) {
    formError.value = 'บันทึกไม่ได้ กรุณาตรวจสอบข้อมูลและสิทธิ์อีกครั้ง'
    return
  }
  toast.success('อัปเดตสถานะคืนเงินแล้ว')
  dialogOpen.value = false
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <BanknoteArrowDownIcon class="size-4 text-primary" aria-hidden="true" />
      <h2 class="text-base font-semibold">คิวติดตามคืนเงินแยกบิล</h2>
      <Badge variant="warning">{{ activeRefunds.length }}</Badge>
    </div>
    <p class="text-sm text-muted-foreground">
      ระบบบันทึกสถานะเท่านั้น การคืนเงินจริงดำเนินการภายนอกและไม่รับประกันยอดคืนจนกว่าจะผ่านการพิจารณา
    </p>

    <div v-if="payments.refundRecords.length" class="grid gap-3 lg:grid-cols-2">
      <Card v-for="record in [...activeRefunds, ...completedRefunds]" :key="record.id" class="py-0">
        <CardContent class="space-y-3 p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-semibold">บิล {{ record.action }} · {{ residentName(record.residentId) }}</p>
              <p class="text-xs text-muted-foreground">{{ record.responsibleEntity }}</p>
            </div>
            <Badge :variant="refundStatusVariant[record.status]">{{ refundStatusLabel[record.status] }}</Badge>
          </div>
          <div class="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <div>
              <p class="text-xs text-muted-foreground">ยอดที่ชำระ</p>
              <p class="font-semibold tabular-nums">{{ formatBaht(record.paidAmount) }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">ยอดที่อนุมัติ</p>
              <p class="font-semibold tabular-nums">{{ record.approvedAmount === undefined ? 'รอตรวจ' : formatBaht(record.approvedAmount) }}</p>
            </div>
          </div>
          <p v-if="record.externalReference" class="text-xs text-muted-foreground">
            เลขอ้างอิง: <span class="font-medium text-foreground">{{ record.externalReference }}</span>
          </p>
          <Button size="sm" variant="outline" @click="openManage(record.id)">จัดการสถานะ</Button>
        </CardContent>
      </Card>
    </div>

    <Empty v-else class="border">
      <EmptyHeader>
        <EmptyMedia variant="icon"><BanknoteArrowDownIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>ยังไม่มีรายการคืนเงิน</EmptyTitle>
        <EmptyDescription>รายการจะถูกสร้างแยกตามบิล ROOM/HL หลังอนุมัติคำขอยกเลิกที่มียอดชำระแล้ว</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="w-[calc(100vw-1rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>อัปเดตสถานะคืนเงิน {{ selectedRecord?.action }}</DialogTitle>
          <DialogDescription>
            ยอดชำระ {{ selectedRecord ? formatBaht(selectedRecord.paidAmount) : '-' }} · {{ selectedRecord?.responsibleEntity }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <Field>
            <FieldLabel for="refund-status">สถานะ</FieldLabel>
            <NativeSelect id="refund-status" v-model="status">
              <NativeSelectOption v-for="(label, key) in refundStatusLabel" :key="key" :value="key">{{ label }}</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel for="refund-amount">ยอดที่อนุมัติคืน (บาท)</FieldLabel>
            <Input id="refund-amount" v-model="approvedAmount" type="number" min="0" :max="selectedRecord?.paidAmount" step="0.01" inputmode="decimal" />
            <FieldDescription>กรอกได้ไม่เกินยอดที่ชำระจริง และอาจเป็น 0 หากนโยบายไม่อนุมัติยอดคืน</FieldDescription>
          </Field>
          <Field>
            <FieldLabel for="refund-reference">เลขอ้างอิงจากหน่วยงานผู้คืนเงิน</FieldLabel>
            <Input id="refund-reference" v-model="externalReference" :maxlength="INPUT_LIMITS.refundReference" placeholder="จำเป็นเมื่อสถานะคืนเงินเสร็จสิ้น" />
          </Field>
          <Field>
            <FieldLabel for="refund-notes">หมายเหตุ / ผลการพิจารณา</FieldLabel>
            <Textarea id="refund-notes" v-model="notes" rows="3" :maxlength="INPUT_LIMITS.refundNotes" />
            <FieldDescription class="text-right tabular-nums">{{ notes.length }}/{{ INPUT_LIMITS.refundNotes }}</FieldDescription>
          </Field>
          <FieldError :errors="[formError]" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">ยกเลิก</Button>
          <Button @click="submitUpdate">บันทึกสถานะ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
