<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
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
import RoomStatusBadge from '@/components/domain/RoomStatusBadge.vue'
import { roomConfigLabel } from '@/lib/labels'
import { useDormStore } from '@/stores/dorm'

const dorm = useDormStore()

const roomRows = computed(() =>
  dorm.rooms.map(r => ({
    ...r,
    buildingName: dorm.buildings.find(b => b.id === r.buildingId)?.name ?? r.buildingId,
    dormGroupName:
      dorm.dormGroups.find(g => g.id === dorm.buildings.find(b => b.id === r.buildingId)?.dormGroupId)?.name ?? '',
  })),
)

function blockRoom(number: string) {
  // การ block ต้องมีเหตุผลบังคับ + audit (doc 05) — ฟอร์มเหตุผลมาในเฟส P5
  toast(`ต้นแบบ: block/unblock ห้อง ${number} ต้องกรอกเหตุผลบังคับและบันทึก audit (เฟส P5)`)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">อาคาร / ชั้น / ห้อง</h1>
        <p class="text-sm text-muted-foreground">ห้องจริงเป็น source of truth ของการจองทั้งหมด — เลขห้อง unique ทั้งระบบ</p>
      </div>
      <Button variant="outline" @click="toast('ต้นแบบ: นำเข้า room master พร้อม preview/ตรวจซ้ำ/นำเข้าซ้ำได้แบบ idempotent (เฟส P5)')">
        นำเข้า Room Master
      </Button>
    </div>

    <PermissionGate permission="room.manage">
      <div class="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ห้อง</TableHead>
              <TableHead>กลุ่มหอ / อาคาร / ชั้น</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>ขนาด</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead class="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in roomRows" :key="r.number">
              <TableCell class="font-semibold">{{ r.number }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ r.dormGroupName }} · {{ r.buildingName }} · ชั้น {{ r.floor }}
              </TableCell>
              <TableCell>{{ roomConfigLabel[r.config] }}</TableCell>
              <TableCell class="text-sm">{{ r.dimensions ?? 'ไม่มีข้อมูล' }}</TableCell>
              <TableCell>
                <div class="space-y-1">
                  <RoomStatusBadge :status="r.publicStatus" />
                  <p v-if="r.blockedReason" class="text-xs text-muted-foreground">เหตุผล: {{ r.blockedReason }}</p>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <Button size="sm" variant="ghost" @click="blockRoom(r.number)">
                  {{ r.publicStatus === 'unavailable' ? 'ปลด block' : 'Block' }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </PermissionGate>
  </div>
</template>
