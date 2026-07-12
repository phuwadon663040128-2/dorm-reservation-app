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
import PermissionGate from '@/components/domain/PermissionGate.vue'
import { contractStatusLabel, occupancyModeLabel } from '@/lib/labels'
import { usePermissions } from '@/composables/usePermissions'
import { users } from '@/fixtures'
import { useContractsStore } from '@/stores/contracts'

const contractsStore = useContractsStore()
const { can } = usePermissions()

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">สัญญา</h1>
      <p class="text-sm text-muted-foreground">
        ห้องพักคู่ = 2 ฉบับใต้ 1 การจอง (ลงนามแยกได้ แต่กลุ่มไม่สมบูรณ์จนกว่าจะครบ) · เหมาห้อง = 1 ฉบับ ·
        การพิมพ์ซ้ำ/แก้ไขต้องมีเหตุผลและเก็บฉบับเดิมไว้เสมอ
      </p>
    </div>

    <PermissionGate permission="contract.generate">
      <div class="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ผู้พัก</TableHead>
              <TableHead>ห้อง</TableHead>
              <TableHead>รูปแบบ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>สแกนลายเซ็น</TableHead>
              <TableHead class="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="ct in contractsStore.contracts" :key="ct.id">
              <TableCell class="font-medium">{{ nameOf(ct.residentId) }}</TableCell>
              <TableCell class="font-mono">{{ ct.roomNumber }}</TableCell>
              <TableCell class="text-sm">{{ occupancyModeLabel[ct.occupancyMode] }}</TableCell>
              <TableCell><Badge variant="outline">{{ contractStatusLabel[ct.status] }}</Badge></TableCell>
              <TableCell>
                <Badge :variant="ct.signedScanUploaded ? 'secondary' : 'outline'">
                  {{ ct.signedScanUploaded ? 'มีไฟล์ (private)' : 'ยังไม่มี' }}
                </Badge>
              </TableCell>
              <TableCell class="space-x-1 text-right">
                <Button
                  v-if="ct.status === 'printed' && can('contract.receive')"
                  size="sm"
                  variant="outline"
                  @click="toast(`ต้นแบบ: บันทึกรับสัญญาที่ลงนาม + แนบสแกน (private) ของ ${nameOf(ct.residentId)} (เฟส P6)`)"
                >
                  รับสัญญา
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="toast('ต้นแบบ: พิมพ์ซ้ำต้องกรอกเหตุผล และเก็บประวัติฉบับเดิม (CONTRACT-006)')"
                >
                  พิมพ์ซ้ำ
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </PermissionGate>
  </div>
</template>
