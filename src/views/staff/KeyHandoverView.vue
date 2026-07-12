<script setup lang="ts">
import { toast } from 'vue-sonner'
import { KeyRoundIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import { keyHandoverStatusLabel } from '@/lib/labels'
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
      <h1 class="text-2xl font-bold">ส่งมอบกุญแจ</h1>
      <p class="text-sm text-muted-foreground">
        เอกสารลงนามแยกจากสัญญา — ส่งมอบได้เมื่อห้องยืนยันแล้ว ชำระครบ สัญญาลงนามครบ และเอกสารประกอบครบ
      </p>
    </div>

    <PermissionGate permission="key_handover.record">
      <div class="space-y-3">
        <Card v-for="kh in contractsStore.keyHandovers" :key="kh.id">
          <CardContent class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div class="flex items-center gap-3">
              <KeyRoundIcon class="size-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <p class="font-medium">ห้อง {{ kh.roomNumber }} — {{ nameOf(kh.residentId) }}</p>
                <Badge :variant="kh.status === 'ready' ? 'secondary' : 'outline'" class="mt-1">
                  {{ keyHandoverStatusLabel[kh.status] }}
                </Badge>
              </div>
            </div>
            <Button
              v-if="kh.status === 'ready' && can('key_handover.record')"
              size="sm"
              @click="toast('ต้นแบบ: บันทึกส่งมอบกุญแจพร้อมเอกสารลงนาม (เก็บ private) — เฟส P6')"
            >
              บันทึกส่งมอบ
            </Button>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  </div>
</template>
