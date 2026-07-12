<script setup lang="ts">
import { toast } from 'vue-sonner'
import { UploadIcon } from '@lucide/vue'
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
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">นำเข้า PDF แบบฟอร์มชำระเงินจากธนาคาร</h1>
        <p class="text-sm text-muted-foreground">
          PDF รวมหลายหน้า 1 ไฟล์ — ระบบจับคู่หน้าเข้ากับ obligation จากข้อความเฉพาะของผู้พัก
          <strong>ห้าม</strong>ใช้ลำดับหน้า หรือ Ref.1+Ref.2 เพียงอย่างเดียว (PDF-004/005)
        </p>
      </div>
      <PermissionGate permission="payment_document.import">
        <Button @click="toast('ต้นแบบ: อัปโหลด PDF — เก็บไฟล์ต้นฉบับ+checksum แล้วแยกข้อความรายหน้า (เฟส P5)')">
          <UploadIcon aria-hidden="true" /> อัปโหลด PDF รวม
        </Button>
      </PermissionGate>
    </div>

    <PermissionGate permission="payment_document.match_review">
      <div class="overflow-x-auto rounded-md border">
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
              :class="p.matchStatus !== 'matched' ? 'bg-amber-50 dark:bg-amber-950/20' : ''"
            >
              <TableCell class="tabular-nums">{{ p.pageNo }}</TableCell>
              <TableCell class="max-w-md">
                <p class="truncate font-mono text-xs">{{ p.extractedText }}</p>
                <p v-if="p.matchNote" class="text-xs text-muted-foreground">{{ p.matchNote }}</p>
              </TableCell>
              <TableCell>
                <Badge :variant="p.matchStatus === 'matched' ? 'secondary' : 'destructive'">
                  {{ matchLabel[p.matchStatus] }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm">{{ ownerOf(p.matchedObligationId) }}</TableCell>
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
