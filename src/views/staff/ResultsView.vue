<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { CheckCircle2Icon, FileCheck2Icon, TriangleAlertIcon, UploadIcon } from '@lucide/vue'
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
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { exceptionTypeLabel, formatBaht } from '@/lib/labels'
import { usePermissions } from '@/composables/usePermissions'
import { users } from '@/fixtures'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'

const payments = usePaymentsStore()
const reservation = useReservationStore()
const { can } = usePermissions()

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

// จอ group completion: กลุ่มที่อยู่ระหว่าง payment hold
const pendingGroups = computed(() =>
  reservation.reservationGroups
    .filter(r => r.holdStatus === 'held_payment')
    .map(r => ({
      resv: r,
      members: r.memberIds.map(memberId => {
        const own = payments.obligationsForGroup(r.id).filter(o => o.residentId === memberId)
        return {
          memberId,
          paid: own.filter(o => payments.isPaid(o)).length,
          total: own.length,
        }
      }),
      complete: payments.groupPaymentComplete(r.id),
    })),
)

function resolveException(id: string) {
  toast(`ต้นแบบ: จัดการ exception ${id} — ต้องเลือกวิธีจัดการ + เหตุผลบังคับ + audit (เฟส P5)`)
}

function confirmReservation(roomNumber: string, complete: boolean) {
  if (!complete) {
    toast(`ยืนยันห้อง ${roomNumber} ไม่ได้ — ทุกรายการของทุกคนในกลุ่มต้องชำระครบก่อน (RESV-004)`)
    return
  }
  toast(`ต้นแบบ: ยืนยันห้อง ${roomNumber} ถาวร — ทำได้ครั้งเดียว (idempotent) และบันทึก audit (เฟส P5)`)
}
</script>

<template>
  <div class="space-y-7">
    <StaffPageHeader
      title="ผลการชำระเงิน / Exception"
      description="นำเข้ารายงานผลจาก SCB — รายการปกติจับคู่อัตโนมัติ ส่วนผิดปกติเข้าคิวตรวจสอบ ไม่ยืนยัน/ปัดตกอัตโนมัติ"
      :icon="FileCheck2Icon"
    >
      <template #actions>
        <PermissionGate permission="payment_result.import">
          <Button @click="toast('ต้นแบบ: อัปโหลดรายงานผลชำระ — นำเข้าซ้ำได้แบบ idempotent ไม่เกิดรายการซ้ำ (RESULT-003)')">
            <UploadIcon aria-hidden="true" /> นำเข้ารายงานผล
          </Button>
        </PermissionGate>
      </template>
    </StaffPageHeader>

    <!-- คิว exception — งานที่ต้องมีคนตัดสินใจ วางไว้บนสุดเสมอ -->
    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <TriangleAlertIcon class="size-4 text-destructive" aria-hidden="true" />
        <h2 class="text-base font-semibold">คิวตรวจสอบ</h2>
        <Badge variant="destructive">{{ payments.openExceptions.length }}</Badge>
      </div>
      <Card v-for="e in payments.openExceptions" :key="e.id" class="border-l-4 border-l-destructive py-0">
        <CardContent class="flex flex-wrap items-center justify-between gap-3 p-4">
          <div class="space-y-1.5">
            <Badge variant="destructive">{{ exceptionTypeLabel[e.type] }}</Badge>
            <p class="text-sm leading-relaxed">{{ e.detail }}</p>
          </div>
          <Button
            v-if="can('payment.exception.resolve')"
            size="sm"
            variant="outline"
            @click="resolveException(e.id)"
          >
            จัดการ
          </Button>
        </CardContent>
      </Card>
    </section>

    <!-- ตารางผลนำเข้า -->
    <section class="space-y-3">
      <h2 class="text-base font-semibold">รายการจากรายงานล่าสุด <span class="font-mono text-sm font-normal text-muted-foreground">imp-2569-001</span></h2>
      <div class="data-table-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Ref.1</TableHead>
              <TableHead>Ref.2</TableHead>
              <TableHead class="text-right">ยอด</TableHead>
              <TableHead>ผล</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in payments.resultRows" :key="r.id">
              <TableCell class="font-mono text-xs text-muted-foreground">{{ r.transactionRef }}</TableCell>
              <TableCell class="font-mono text-sm">{{ r.ref1 }}</TableCell>
              <TableCell class="font-mono text-sm">{{ r.ref2 }}</TableCell>
              <TableCell class="text-right font-semibold tabular-nums">{{ formatBaht(r.amount) }}</TableCell>
              <TableCell>
                <Badge :variant="r.outcome === 'paid' ? 'success' : 'destructive'">
                  {{ r.outcome === 'paid' ? 'สำเร็จ' : r.exceptionType ? exceptionTypeLabel[r.exceptionType] : r.outcome }}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>

    <!-- ความครบของกลุ่ม + ยืนยันถาวร -->
    <section class="space-y-3">
      <h2 class="text-base font-semibold">ความครบถ้วนของกลุ่ม (รอยืนยันห้อง)</h2>
      <div class="grid gap-3 lg:grid-cols-2">
        <Card v-for="g in pendingGroups" :key="g.resv.id">
          <CardHeader>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <CardTitle class="text-base">ห้อง {{ g.resv.roomNumber }}</CardTitle>
              <Badge :variant="g.complete ? 'success' : 'warning'">
                {{ g.complete ? 'ชำระครบทุกคน' : 'ยังชำระไม่ครบ' }}
              </Badge>
            </div>
            <CardDescription>ทุกรายการของทุกคนต้องครบก่อน จึงจะยืนยันถาวรได้ (deadline เดียวร่วมกัน)</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="m in g.members"
              :key="m.memberId"
              class="flex items-center justify-between gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm"
            >
              <span class="font-medium">{{ nameOf(m.memberId) }}</span>
              <Badge :variant="m.paid === m.total ? 'success' : 'warning'">{{ m.paid }} / {{ m.total }} รายการ</Badge>
            </div>
            <PermissionGate permission="payment.confirm">
              <Button
                class="w-full"
                :variant="g.complete ? 'default' : 'outline'"
                @click="confirmReservation(g.resv.roomNumber, g.complete)"
              >
                <CheckCircle2Icon aria-hidden="true" />
                ยืนยันห้องถาวร
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
