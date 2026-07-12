<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { roommateGroupStatusLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import { useReservationStore } from '@/stores/reservation'

const reservation = useReservationStore()

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

function roomOf(groupId: string) {
  return reservation.reservationGroups.find(r => r.roommateGroupId === groupId)?.roomNumber ?? '—'
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">กลุ่มรูมเมท</h1>
      <p class="text-sm text-muted-foreground">กลุ่มละไม่เกิน 2 คน · 1 คนอยู่ได้ 1 กลุ่มที่ใช้งานอยู่</p>
    </div>

    <div class="overflow-x-auto rounded-md border">
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
            <TableCell class="font-mono text-xs">{{ g.id }}</TableCell>
            <TableCell>{{ nameOf(g.leaderId) }}</TableCell>
            <TableCell class="text-sm">{{ g.memberIds.map(nameOf).join(', ') }}</TableCell>
            <TableCell class="font-semibold">{{ roomOf(g.id) }}</TableCell>
            <TableCell><Badge variant="outline">{{ roommateGroupStatusLabel[g.status] }}</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
