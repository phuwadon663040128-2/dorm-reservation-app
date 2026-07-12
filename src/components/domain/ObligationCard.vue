<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { CheckCircle2Icon, CircleAlertIcon, ClockIcon, FileTextIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { documentStatusLabel, formatBaht, formatDate, resultStatusLabel } from '@/lib/labels'
import type { PaymentObligation } from '@/types'

const props = defineProps<{ obligation: PaymentObligation }>()

const paid = computed(() =>
  ['paid', 'manual_recorded', 'confirmed'].includes(props.obligation.resultStatus),
)
const hasException = computed(() => props.obligation.resultStatus === 'exception')
const formReady = computed(
  () => props.obligation.documentStatus === 'payment_form_ready' && !!props.obligation.pdfPageId,
)

function downloadForm() {
  toast('ต้นแบบ: จะเปิดหน้าแบบฟอร์ม QR อย่างเป็นทางการ (PDF) ของคุณเท่านั้น — ไม่ใช่ของรูมเมท (PDF-012)')
}
</script>

<template>
  <Card>
    <CardContent class="flex flex-col gap-3 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <!-- แสดง ROOM/HL แยกกันเสมอ ห้ามรวมยอด (UI-PAY-001) -->
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
        <Button v-if="formReady" size="sm" variant="outline" @click="downloadForm">
          <FileTextIcon aria-hidden="true" />
          แบบฟอร์มชำระเงิน (QR)
        </Button>
        <span v-else-if="!paid" class="text-xs text-muted-foreground">
          แบบฟอร์ม QR จะพร้อมหลังเจ้าหน้าที่นำเข้าไฟล์จากธนาคาร
        </span>
      </div>

      <p v-if="obligation.override" class="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        ยอดถูกปรับจาก {{ formatBaht(obligation.override.originalAmount) }} — เหตุผล: {{ obligation.override.reason }}
      </p>
    </CardContent>
  </Card>
</template>
