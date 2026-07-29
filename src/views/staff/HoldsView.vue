<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { ClipboardCheckIcon, DoorOpenIcon, TimerIcon, UserMinusIcon } from '@lucide/vue'
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
import { Textarea } from '@/components/ui/textarea'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { holdStatusLabel, occupancyModeLabel } from '@/lib/labels'
import { INPUT_LIMITS } from '@/lib/validation'
import { users } from '@/fixtures'
import { useReservationStore } from '@/stores/reservation'

const reservation = useReservationStore()

const holds15 = computed(() => reservation.activeHolds.filter(h => h.holdStatus === 'held_roommate_confirmation').length)
const holds72 = computed(() => reservation.activeHolds.filter(h => h.holdStatus === 'held_payment').length)
const reviewOpen = ref(false)
const selectedRequestId = ref('')
const reviewDecision = ref<'approved' | 'rejected'>('approved')
const reviewReason = ref('')
const reviewError = ref('')

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

function reservationOf(requestId: string) {
  const request = reservation.cancellationRequests.find(item => item.id === requestId)
  return request ? reservation.reservationById(request.reservationGroupId) : undefined
}

function openReview(requestId: string, decision: 'approved' | 'rejected') {
  selectedRequestId.value = requestId
  reviewDecision.value = decision
  reviewReason.value = ''
  reviewError.value = ''
  reviewOpen.value = true
}

function submitReview() {
  const result = reservation.reviewCancellationRequest(selectedRequestId.value, reviewDecision.value, reviewReason.value)
  if (!result.ok) {
    reviewError.value = result.message
    toast.error(result.message)
    return
  }
  reviewOpen.value = false
  toast.success(result.message)
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
          <Badge variant="destructive">คำขอยกเลิก {{ reservation.pendingCancellationRequests.length }}</Badge>
        </div>
      </template>
    </StaffPageHeader>

    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <ClipboardCheckIcon class="size-4 text-primary" aria-hidden="true" />
        <h2 class="text-base font-semibold">คิวคำขอยกเลิกและถอนตัว</h2>
        <Badge variant="destructive">{{ reservation.pendingCancellationRequests.length }}</Badge>
      </div>
      <div v-if="reservation.pendingCancellationRequests.length" class="grid gap-3 lg:grid-cols-2">
        <Card v-for="request in reservation.pendingCancellationRequests" :key="request.id" class="py-0">
          <CardContent class="space-y-3 p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="font-semibold">ห้อง {{ reservationOf(request.id)?.roomNumber ?? '-' }}</p>
                <p class="text-sm text-muted-foreground">ผู้ขอ: {{ nameOf(request.requestedBy) }}</p>
              </div>
              <Badge :variant="request.kind === 'member_withdrawal' ? 'warning' : 'destructive'">
                <UserMinusIcon class="size-3" aria-hidden="true" />
                {{ request.kind === 'member_withdrawal' ? 'ขอถอนตัว' : 'ขอยกเลิกทั้งกลุ่ม' }}
              </Badge>
            </div>
            <p class="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">{{ request.reason }}</p>
            <PermissionGate permission="reservation.cancel.review">
              <div class="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" @click="openReview(request.id, 'rejected')">ปฏิเสธ</Button>
                <Button size="sm" variant="destructive" @click="openReview(request.id, 'approved')">อนุมัติและปล่อยห้อง</Button>
              </div>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>
      <p v-else class="rounded-xl border bg-card px-4 py-5 text-sm text-muted-foreground">ไม่มีคำขอยกเลิกที่รอตรวจสอบ</p>
    </section>

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

    <Dialog v-model:open="reviewOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ reviewDecision === 'approved' ? 'อนุมัติคำขอยกเลิก' : 'ปฏิเสธคำขอยกเลิก' }}</DialogTitle>
          <DialogDescription>
            {{ reviewDecision === 'approved'
              ? 'ห้องจะถูกปล่อยคืน บิลที่ยังไม่จ่ายจะถูกยกเลิก และยอดที่จ่ายแล้วเข้าสู่คิวพิจารณาคืนเงิน'
              : 'ระบบจะคืนสถานะและเวลาที่เหลือของ hold/payment ให้กลุ่ม' }}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel for="cancellation-review-reason">ผลการตรวจและเหตุผล <span class="text-primary">*</span></FieldLabel>
          <Textarea id="cancellation-review-reason" v-model="reviewReason" rows="4" :maxlength="INPUT_LIMITS.reviewReason" :aria-invalid="Boolean(reviewError)" @input="reviewError = ''" />
          <div class="flex items-start justify-between gap-3">
            <FieldError :errors="[reviewError]" />
            <FieldDescription class="ml-auto tabular-nums">{{ reviewReason.length }}/{{ INPUT_LIMITS.reviewReason }}</FieldDescription>
          </div>
        </Field>
        <DialogFooter>
          <Button variant="outline" @click="reviewOpen = false">กลับ</Button>
          <Button :variant="reviewDecision === 'approved' ? 'destructive' : 'default'" @click="submitReview">
            ยืนยันผลการตรวจ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
