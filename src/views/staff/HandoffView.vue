<script setup lang="ts">
import { toast } from 'vue-sonner'
import { SendIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import { formatDateTime } from '@/lib/labels'
import { users } from '@/fixtures'
import { useContractsStore } from '@/stores/contracts'

const contractsStore = useContractsStore()

const statusLabel: Record<string, string> = {
  queued: 'รอรอบมหาวิทยาลัยเปิด',
  exported: 'ส่งออกไฟล์แล้ว',
  submitted: 'ยื่นเข้าระบบมหาวิทยาลัยแล้ว',
}

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">ส่งข้อมูลเข้าระบบมหาวิทยาลัย</h1>
        <p class="text-sm text-muted-foreground">
          ผู้พักที่ยืนยันแล้วเข้าคิวรอรอบทางการ — การแก้ไขภายหลังสร้าง correction export แยก
          <strong>ไม่แก้ทับ</strong>ข้อมูลที่ยื่นไปแล้ว (HANDOFF-004)
        </p>
      </div>
      <PermissionGate permission="university_export.create">
        <Button @click="toast('ต้นแบบ: สร้างไฟล์ export ตามคอลัมน์ที่มหาวิทยาลัยกำหนด (รูปแบบยังรอ stakeholder ยืนยัน) — เฟส P6')">
          <SendIcon aria-hidden="true" /> สร้างไฟล์ export
        </Button>
      </PermissionGate>
    </div>

    <PermissionGate permission="university_export.create">
      <div class="space-y-3">
        <Card v-for="b in contractsStore.handoffBatches" :key="b.id">
          <CardHeader>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <CardTitle class="text-base">
                {{ b.id }}
                <Badge class="ml-2" variant="outline">{{ b.kind === 'original' ? 'ยื่นครั้งแรก' : 'Correction' }}</Badge>
              </CardTitle>
              <Badge>{{ statusLabel[b.status] }}</Badge>
            </div>
            <CardDescription>
              สร้างเมื่อ {{ formatDateTime(b.createdAt) }} โดย {{ b.createdBy }}
              <template v-if="b.correctsBatchId"> · แก้ไขอ้างอิง {{ b.correctsBatchId }}</template>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm">ผู้พักในชุดนี้: {{ b.residentIds.map(nameOf).join(', ') }}</p>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  </div>
</template>
