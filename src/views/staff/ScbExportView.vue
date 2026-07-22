<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  CheckCircle2Icon,
  DownloadIcon,
  FileInputIcon,
  FileSpreadsheetIcon,
  InboxIcon,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { formatBaht } from '@/lib/labels'
import { downloadSlipsWorkbook } from '@/lib/slips-xlsx'
import { usePaymentsStore } from '@/stores/payments'
import type { ScbExportBatch } from '@/types'

const payments = usePaymentsStore()
const createOpen = ref(false)
const selectedIds = ref<string[]>([])

const selectedObligations = computed(() => payments.readyForExport.filter(item => selectedIds.value.includes(item.id)))
const selectedTotal = computed(() => selectedObligations.value.reduce((total, item) => total + item.amount, 0))

const batchStatusLabel: Record<string, string> = {
  draft: 'รอดาวน์โหลดไฟล์',
  exported: 'ส่งออกแล้ว',
  awaiting_returned_pdf: 'รอ PDF จากธนาคาร',
  pdf_imported: 'นำเข้า PDF แล้ว',
  completed: 'เสร็จสมบูรณ์',
}

const batchStatusVariant: Record<string, 'success' | 'warning' | 'info' | 'outline'> = {
  draft: 'outline',
  exported: 'info',
  awaiting_returned_pdf: 'warning',
  pdf_imported: 'success',
  completed: 'success',
}

function openCreateDialog() {
  selectedIds.value = payments.readyForExport.map(item => item.id)
  createOpen.value = true
}

function toggleObligation(id: string, checked: boolean | 'indeterminate') {
  if (checked === true) {
    if (!selectedIds.value.includes(id)) selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  }
}

function createBatch() {
  const batch = payments.createExportBatch(selectedIds.value)
  if (!batch) {
    toast.error('กรุณาเลือกรายการที่พร้อมส่งออกอย่างน้อย 1 รายการ')
    return
  }
  createOpen.value = false
  toast.success(`สร้าง ${batch.id} แล้ว — ตรวจสอบและดาวน์โหลดไฟล์ได้ทันที`)
}

function downloadBatch(batch: ScbExportBatch) {
  downloadSlipsWorkbook(batch)
  payments.markBatchExported(batch.id)
  toast.success(`ดาวน์โหลด ${batch.id}-SLIPS.xlsx แล้ว และเปลี่ยนสถานะเป็นรอ PDF`)
}

function receiveReturnedPdf(batch: ScbExportBatch) {
  const count = payments.importReturnedPdf(batch.id)
  if (count === 0) {
    toast.error('batch นี้ยังไม่อยู่ในสถานะที่นำเข้า PDF ได้')
    return
  }
  toast.success(`นำเข้าและจับคู่แบบฟอร์ม QR สำเร็จ ${count} หน้า — ผู้สมัครเปิด QR ได้แล้ว`)
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="SCB Export Batch (SLIPS)"
      description="เลือก obligation ที่พร้อมส่งออก → สร้าง batch → ดาวน์โหลด .xlsx → รับ combined PDF กลับมาเพื่อเปิด QR ให้ผู้สมัคร"
      :icon="FileSpreadsheetIcon"
    >
      <template #actions>
        <PermissionGate permission="payment_export.create">
          <Button @click="openCreateDialog">
            <FileSpreadsheetIcon aria-hidden="true" /> สร้าง batch ใหม่
            <Badge variant="secondary" class="ml-1">{{ payments.readyForExport.length }}</Badge>
          </Button>
        </PermissionGate>
      </template>
    </StaffPageHeader>

    <Card>
      <CardContent class="grid gap-3 p-4 text-sm sm:grid-cols-3">
        <div class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
          <div><p class="font-medium">สร้างและดาวน์โหลด</p><p class="text-xs text-muted-foreground">ไฟล์จริง .xlsx ชีต SLIPS</p></div>
        </div>
        <div class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">2</span>
          <div><p class="font-medium">รับ combined PDF</p><p class="text-xs text-muted-foreground">จำลองระบบ SCB/internal app ส่งกลับ</p></div>
        </div>
        <div class="flex items-start gap-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">3</span>
          <div><p class="font-medium">ผู้สมัครเปิด QR</p><p class="text-xs text-muted-foreground">แยกหน้าตาม obligation โดยไม่ใช้ Ref ซ้ำเป็น ID</p></div>
        </div>
      </CardContent>
    </Card>

    <PermissionGate permission="payment_export.create">
      <div class="space-y-4">
        <Card v-for="batch in payments.batches" :key="batch.id">
          <CardHeader>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2.5">
                  <CardTitle class="font-mono text-base">{{ batch.id }}</CardTitle>
                  <Badge :variant="batchStatusVariant[batch.status] ?? 'outline'">{{ batchStatusLabel[batch.status] }}</Badge>
                </div>
                <CardDescription>
                  {{ batch.rows.length }} แถว · checksum <span class="font-mono">{{ batch.fileChecksum }}</span> · สร้างโดย {{ batch.createdBy }}
                </CardDescription>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" @click="downloadBatch(batch)">
                  <DownloadIcon aria-hidden="true" /> ดาวน์โหลด .xlsx
                </Button>
                <Button
                  v-if="batch.status === 'awaiting_returned_pdf' || batch.status === 'exported'"
                  size="sm"
                  @click="receiveReturnedPdf(batch)"
                >
                  <FileInputIcon aria-hidden="true" /> จำลองรับ PDF จาก SCB
                </Button>
                <Badge v-else-if="batch.status === 'pdf_imported' || batch.status === 'completed'" variant="success" class="h-8 px-3">
                  <CheckCircle2Icon aria-hidden="true" /> QR พร้อมให้ผู้สมัคร
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="data-table-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Payer Name *</TableHead>
                    <TableHead>Ref.1 *</TableHead>
                    <TableHead>Ref.2</TableHead>
                    <TableHead class="text-right">Amount *</TableHead>
                    <TableHead>Payment Date *</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Alert Message</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in batch.rows" :key="row.obligationId">
                    <TableCell class="text-muted-foreground">(ว่าง)</TableCell>
                    <TableCell class="font-medium">{{ row.payerName }}</TableCell>
                    <TableCell class="font-mono">{{ row.ref1 }}</TableCell>
                    <TableCell class="font-mono">{{ row.ref2 }}</TableCell>
                    <TableCell class="text-right font-semibold tabular-nums">{{ row.amount.toLocaleString('th-TH') }}</TableCell>
                    <TableCell class="tabular-nums">{{ row.paymentDate }}</TableCell>
                    <TableCell class="text-xs">{{ row.email }}</TableCell>
                    <TableCell>{{ row.alertMessage }}</TableCell>
                    <TableCell class="text-xs text-muted-foreground">{{ row.remark }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              รูมเมทอาจมี Ref.1/Ref.2 ซ้ำกันโดยตั้งใจ ระบบจึงผูกแต่ละแถวด้วย obligation ID ภายในเสมอ
            </p>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>

    <Dialog v-model:open="createOpen">
      <DialogContent class="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>สร้าง SCB export batch ใหม่</DialogTitle>
          <DialogDescription>
            เลือกรายการสถานะ ready_for_export ก่อนสร้างไฟล์ ระบบจะเก็บ batch เดิมไว้ในประวัติและไม่สร้าง reference ใหม่เมื่อดาวน์โหลดซ้ำ
          </DialogDescription>
        </DialogHeader>

        <div v-if="payments.readyForExport.length" class="space-y-3">
          <div class="rounded-lg border">
            <label
              v-for="obligation in payments.readyForExport"
              :key="obligation.id"
              class="flex cursor-pointer items-start gap-3 border-b p-3 last:border-b-0 hover:bg-muted/50"
            >
              <Checkbox
                :model-value="selectedIds.includes(obligation.id)"
                class="mt-1"
                @update:model-value="toggleObligation(obligation.id, $event)"
              />
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-2">
                  <Badge :variant="obligation.action === 'HL' ? 'outline' : 'default'">{{ obligation.action }}</Badge>
                  <span class="font-medium">ห้อง {{ obligation.roomNumber }}</span>
                  <span class="font-mono text-xs text-muted-foreground">{{ obligation.ref2 }}</span>
                </span>
                <span class="mt-1 block text-sm text-muted-foreground">{{ obligation.title }}</span>
              </span>
              <span class="shrink-0 font-semibold tabular-nums">{{ formatBaht(obligation.amount) }}</span>
            </label>
          </div>
          <div class="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
            <span>เลือก {{ selectedObligations.length }} รายการ</span>
            <span class="font-semibold tabular-nums">รวม {{ formatBaht(selectedTotal) }}</span>
          </div>
        </div>

        <div v-else class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <InboxIcon class="size-9 text-muted-foreground" aria-hidden="true" />
          <div class="space-y-1">
            <p class="font-medium">ยังไม่มีรายการที่พร้อมสร้าง batch</p>
            <p class="max-w-md text-sm text-muted-foreground">
              ให้ผู้สมัครหรือรูมเมทยืนยันห้องก่อน ระบบจะสร้าง obligation สถานะ ready_for_export อัตโนมัติ แล้วกลับมาที่หน้านี้
            </p>
          </div>
          <Button as-child variant="outline">
            <RouterLink to="/staff/holds">ไปดูคิวห้องที่ถูก hold</RouterLink>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="createOpen = false">ยกเลิก</Button>
          <Button :disabled="selectedObligations.length === 0" @click="createBatch">
            <FileSpreadsheetIcon aria-hidden="true" /> สร้าง batch {{ selectedObligations.length }} รายการ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
