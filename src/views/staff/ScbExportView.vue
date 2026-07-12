<script setup lang="ts">
import { toast } from 'vue-sonner'
import { DownloadIcon, FileSpreadsheetIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import { usePaymentsStore } from '@/stores/payments'

const payments = usePaymentsStore()

const batchStatusLabel: Record<string, string> = {
  draft: 'ฉบับร่าง',
  exported: 'ส่งออกแล้ว',
  awaiting_returned_pdf: 'รอ PDF จากธนาคาร',
  pdf_imported: 'นำเข้า PDF แล้ว',
  completed: 'เสร็จสมบูรณ์',
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">SCB Export Batch (SLIPS)</h1>
        <p class="text-sm text-muted-foreground">
          ไฟล์ .xlsx ชีตชื่อ <code class="font-mono">SLIPS</code> คอลัมน์ตามที่ธนาคารกำหนด · ช่อง ID เว้นว่างเสมอ ·
          1 แถว = ผู้พัก 1 คน × 1 action
        </p>
      </div>
      <PermissionGate permission="payment_export.create">
        <Button @click="toast(`ต้นแบบ: เลือก obligation ที่พร้อม (${payments.readyForExport.length} รายการ) → ตรวจ validation → preview → สร้างไฟล์ (เฟส P5)`)">
          <FileSpreadsheetIcon aria-hidden="true" /> สร้าง batch ใหม่
        </Button>
      </PermissionGate>
    </div>

    <PermissionGate permission="payment_export.create">
      <div class="space-y-4">
        <Card v-for="b in payments.batches" :key="b.id">
          <CardHeader>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <CardTitle class="text-base">{{ b.id }}</CardTitle>
              <div class="flex items-center gap-2">
                <Badge variant="outline">{{ batchStatusLabel[b.status] }}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  @click="toast('ต้นแบบ: ดาวน์โหลดไฟล์เดิมซ้ำได้โดยไม่สร้าง reference ใหม่ (XLSX-008)')"
                >
                  <DownloadIcon aria-hidden="true" /> ดาวน์โหลด .xlsx
                </Button>
              </div>
            </div>
            <CardDescription>
              {{ b.rows.length }} แถว · checksum {{ b.fileChecksum }} · สร้างโดย {{ b.createdBy }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <!-- คอลัมน์ตรงตาม template ธนาคารทุกตัว (XLSX-002) -->
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
                  <TableRow v-for="row in b.rows" :key="row.obligationId">
                    <TableCell class="text-muted-foreground">(ว่าง)</TableCell>
                    <TableCell>{{ row.payerName }}</TableCell>
                    <TableCell class="font-mono">{{ row.ref1 }}</TableCell>
                    <TableCell class="font-mono">{{ row.ref2 }}</TableCell>
                    <TableCell class="text-right tabular-nums">{{ row.amount.toLocaleString('th-TH') }}</TableCell>
                    <TableCell>{{ row.paymentDate }}</TableCell>
                    <TableCell class="text-xs">{{ row.email }}</TableCell>
                    <TableCell>{{ row.alertMessage }}</TableCell>
                    <TableCell class="text-xs">{{ row.remark }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              สังเกต: รูมเมท 2 คนใช้ Ref.1/Ref.2 ซ้ำกันโดยตั้งใจ — ระบบห้ามใช้คู่ค่านี้เป็นตัวระบุผู้พัก
            </p>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  </div>
</template>
