<script setup lang="ts">
import { toast } from 'vue-sonner'
import { FileUpIcon, UploadIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { usePermissions } from '@/composables/usePermissions'
import { users } from '@/fixtures'
import { usePaymentsStore } from '@/stores/payments'

const payments = usePaymentsStore()
const { can } = usePermissions()

const matchLabel: Record<string, string> = {
  matched: 'จับคู่แล้ว',
  ambiguous: 'กำกวม — ต้องตรวจสอบ',
  unmatched: 'จับคู่ไม่ได้',
  superseded: 'ถูกแทนที่',
}

const matchVariant: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
  matched: 'success',
  ambiguous: 'warning',
  unmatched: 'destructive',
  superseded: 'outline',
}

function ownerOf(obligationId?: string) {
  if (!obligationId) return '—'
  const o = payments.obligations.find(x => x.id === obligationId)
  if (!o) return '—'
  return users.find(u => u.id === o.residentId)?.displayName ?? o.residentId
}

function rematch(pageId: string) {
  // manual rematch เฉพาะผู้มีสิทธิ์ + เหตุผลบังคับ + เก็บ mapping เดิมเป็นประวัติ (PDF-008)
  toast(`ต้นแบบ: จับคู่หน้า ${pageId} ด้วยมือ — ต้องกรอกเหตุผล และระบบเก็บ mapping เดิมไว้เป็นประวัติ (เฟส P5)`)
}

function uploadReturnedPdf() {
  const batch = payments.batches.find(item => item.status === 'awaiting_returned_pdf' || item.status === 'exported')
  if (!batch) {
    toast.info('ไม่มี batch ที่รอ PDF — ดาวน์โหลด batch จากหน้า SCB Export ก่อน')
    return
  }
  const count = payments.importReturnedPdf(batch.id)
  toast.success(`นำเข้า ${batch.id} และจับคู่แบบฟอร์มสำเร็จ ${count} หน้า`)
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="นำเข้า PDF แบบฟอร์มชำระเงินจากธนาคาร"
      description="PDF รวมหลายหน้า 1 ไฟล์ — ระบบจับคู่หน้าเข้ากับ obligation จากข้อความเฉพาะของผู้พัก ห้ามใช้ลำดับหน้า หรือ Ref.1+Ref.2 เพียงอย่างเดียว (PDF-004/005)"
      :icon="FileUpIcon"
    >
      <template #actions>
        <PermissionGate permission="payment_document.import">
          <Button @click="uploadReturnedPdf">
            <UploadIcon aria-hidden="true" /> จำลองอัปโหลด PDF รวม
          </Button>
        </PermissionGate>
      </template>
    </StaffPageHeader>

    <PermissionGate permission="payment_document.match_review">
      <div class="data-table-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หน้า</TableHead>
              <TableHead>ข้อความที่สกัดได้</TableHead>
              <TableHead>ผลจับคู่</TableHead>
              <TableHead>ผู้พัก</TableHead>
              <TableHead class="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="p in payments.pdfPages"
              :key="p.id"
              :class="p.matchStatus !== 'matched' ? 'bg-amber-500/8 hover:bg-amber-500/15 dark:bg-amber-400/8 dark:hover:bg-amber-400/15' : ''"
            >
              <TableCell class="font-semibold tabular-nums">{{ p.pageNo }}</TableCell>
              <TableCell class="max-w-md">
                <p class="truncate font-mono text-xs">{{ p.extractedText }}</p>
                <p v-if="p.matchNote" class="mt-0.5 text-xs text-muted-foreground">{{ p.matchNote }}</p>
              </TableCell>
              <TableCell>
                <Badge :variant="matchVariant[p.matchStatus] ?? 'outline'">
                  {{ matchLabel[p.matchStatus] }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm font-medium">{{ ownerOf(p.matchedObligationId) }}</TableCell>
              <TableCell class="text-right">
                <Button
                  v-if="p.matchStatus !== 'matched' && can('payment_document.match_review')"
                  size="sm"
                  variant="outline"
                  @click="rematch(p.id)"
                >
                  จับคู่ด้วยมือ
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p class="mt-2 text-xs text-muted-foreground">
        หน้า 2 กำกวมเพราะ Ref.1+Ref.2 ซ้ำกับหน้าอื่นและไม่มีข้อความระบุตัวผู้พัก —
        เคสนี้คือเหตุผลที่ระบบห้าม auto-match จาก Ref อย่างเดียว
      </p>
    </PermissionGate>
  </div>
</template>
