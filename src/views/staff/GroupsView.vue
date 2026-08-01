<script setup lang="ts">
import { UsersRoundIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { roommateGroupStatusLabel } from '@/lib/labels'
import { users } from '@/fixtures/users'
import { useReservationStore } from '@/stores/reservation'
import type { RoommateGroupStatus } from '@/types'

const reservation = useReservationStore()

// โทนป้ายสถานะ: เหลือง = รอการกระทำ, ฟ้า = เดินหน้าต่อได้, เขียว = จบขั้นตอน, เทา = สิ้นสุด/เปลี่ยนแปลง
const statusVariant: Record<RoommateGroupStatus, 'success' | 'warning' | 'info' | 'outline'> = {
  invitation_pending: 'warning',
  accepted: 'info',
  room_confirmation_pending: 'warning',
  ready_for_payment: 'info',
  confirmed: 'success',
  cancelled: 'outline',
  replaced: 'outline',
}

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

function roomOf(groupId: string) {
  return reservation.reservationGroups.find(r => r.roommateGroupId === groupId)?.roomNumber ?? '—'
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="กลุ่มรูมเมท"
      description="กลุ่มละไม่เกิน 2 คน · 1 คนอยู่ได้ 1 กลุ่มที่ใช้งานอยู่"
      :icon="UsersRoundIcon"
    />

    <div class="data-table-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>กลุ่ม</TableHead>
            <TableHead>หัวหน้ากลุ่ม</TableHead>
            <TableHead>สมาชิก</TableHead>
            <TableHead>ห้อง</TableHead>
            <TableHead>สถานะ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="g in reservation.roommateGroups" :key="g.id">
            <TableCell class="font-mono text-xs text-muted-foreground">{{ g.id }}</TableCell>
            <TableCell class="font-medium">{{ nameOf(g.leaderId) }}</TableCell>
            <TableCell class="text-sm">{{ g.memberIds.map(nameOf).join(', ') }}</TableCell>
            <TableCell class="font-semibold tabular-nums">{{ roomOf(g.id) }}</TableCell>
            <TableCell>
              <Badge :variant="statusVariant[g.status]">{{ roommateGroupStatusLabel[g.status] }}</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
