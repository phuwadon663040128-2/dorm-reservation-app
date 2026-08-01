<script setup lang="ts">
import { toast } from 'vue-sonner'
import { SendIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { formatDateTime } from '@/lib/labels'
import { users } from '@/fixtures/users'
import { useContractsStore } from '@/stores/contracts'

const contractsStore = useContractsStore()

const statusLabel: Record<string, string> = {
  queued: 'รอรอบมหาวิทยาลัยเปิด',
  exported: 'ส่งออกไฟล์แล้ว',
  submitted: 'ยื่นเข้าระบบมหาวิทยาลัยแล้ว',
}

const statusVariant: Record<string, 'success' | 'warning' | 'info'> = {
  queued: 'warning',
  exported: 'info',
  submitted: 'success',
}

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="ส่งข้อมูลเข้าระบบมหาวิทยาลัย"
      description="ผู้พักที่ยืนยันแล้วเข้าคิวรอรอบทางการ — การแก้ไขภายหลังสร้าง correction export แยก ไม่แก้ทับข้อมูลที่ยื่นไปแล้ว (HANDOFF-004)"
      :icon="SendIcon"
    >
      <template #actions>
        <PermissionGate permission="university_export.create">
          <Button @click="toast('ต้นแบบ: สร้างไฟล์ export ตามคอลัมน์ที่มหาวิทยาลัยกำหนด (รูปแบบยังรอ stakeholder ยืนยัน) — เฟส P6')">
            <SendIcon aria-hidden="true" /> สร้างไฟล์ export
          </Button>
        </PermissionGate>
      </template>
    </StaffPageHeader>

    <PermissionGate permission="university_export.create">
      <div class="space-y-3">
        <Card v-for="b in contractsStore.handoffBatches" :key="b.id">
          <CardHeader>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <CardTitle class="font-mono text-base">{{ b.id }}</CardTitle>
                <Badge variant="outline">{{ b.kind === 'original' ? 'ยื่นครั้งแรก' : 'Correction' }}</Badge>
              </div>
              <Badge :variant="statusVariant[b.status] ?? 'outline'">{{ statusLabel[b.status] }}</Badge>
            </div>
            <CardDescription>
              สร้างเมื่อ {{ formatDateTime(b.createdAt) }} โดย {{ b.createdBy }}
              <template v-if="b.correctsBatchId"> · แก้ไขอ้างอิง <span class="font-mono">{{ b.correctsBatchId }}</span></template>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm"><span class="text-muted-foreground">ผู้พักในชุดนี้:</span> {{ b.residentIds.map(nameOf).join(', ') }}</p>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  </div>
</template>
