<script setup lang="ts">
import { toast } from 'vue-sonner'
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
import { documentStatusLabel, formatBaht, resultStatusLabel } from '@/lib/labels'
import { usePermissions } from '@/composables/usePermissions'
import { users } from '@/fixtures'
import { usePaymentsStore } from '@/stores/payments'

const payments = usePaymentsStore()
const { can } = usePermissions()

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

function override(id: string) {
  // override ครั้งเดียว เฉพาะ finance + เหตุผลบังคับ + audit; ไม่แตะ pricing rule ถาวร (PRICE-005/006)
  toast(`ต้นแบบ: override ยอด ${id} — ต้องกรอกเหตุผลบังคับ มีผลเฉพาะรายการนี้ (เฟส P5)`)
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">รายการชำระเงิน (Obligations)</h1>
      <p class="text-sm text-muted-foreground">
        1 รายการ = ผู้พัก 1 คน × 1 payment action · ห้อง HL สร้าง ROOM + HL แยกกัน ·
        Ref.1+Ref.2 ซ้ำกันได้ระหว่างรูมเมท (ไม่ใช่ unique key)
      </p>
    </div>

    <div class="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ผู้พัก</TableHead>
            <TableHead>Ref.1</TableHead>
            <TableHead>Ref.2</TableHead>
            <TableHead class="text-right">ยอด</TableHead>
            <TableHead>เอกสาร</TableHead>
            <TableHead>ผลชำระ</TableHead>
            <TableHead v-if="can('payment_obligation.override')" class="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="o in payments.obligations" :key="o.id">
            <TableCell class="font-medium">{{ nameOf(o.residentId) }}</TableCell>
            <TableCell class="font-mono text-sm">{{ o.roomNumber }}</TableCell>
            <TableCell class="font-mono text-sm">{{ o.ref2 }}</TableCell>
            <TableCell class="text-right tabular-nums">{{ formatBaht(o.amount) }}</TableCell>
            <TableCell class="text-xs text-muted-foreground">{{ documentStatusLabel[o.documentStatus] }}</TableCell>
            <TableCell>
              <Badge :variant="payments.isPaid(o) ? 'secondary' : o.resultStatus === 'exception' ? 'destructive' : 'outline'">
                {{ resultStatusLabel[o.resultStatus] }}
              </Badge>
            </TableCell>
            <TableCell v-if="can('payment_obligation.override')" class="text-right">
              <Button size="sm" variant="ghost" @click="override(o.id)">Override</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <p v-if="!can('payment_obligation.override')" class="text-xs text-muted-foreground">
      การ override ยอดทำได้เฉพาะบทบาทการเงิน (payment_obligation.override) — บทบาทของคุณดูได้อย่างเดียว
    </p>
  </div>
</template>
