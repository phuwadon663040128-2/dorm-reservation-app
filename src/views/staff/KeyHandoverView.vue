<script setup lang="ts">
import { toast } from 'vue-sonner'
import { KeyRoundIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { keyHandoverStatusLabel } from '@/lib/labels'
import { usePermissions } from '@/composables/usePermissions'
import { users } from '@/fixtures'
import { useContractsStore } from '@/stores/contracts'
import type { KeyHandoverStatus } from '@/types'

const contractsStore = useContractsStore()
const { can } = usePermissions()

const statusVariant: Record<KeyHandoverStatus, 'success' | 'warning' | 'info' | 'outline'> = {
  not_ready: 'outline',
  ready: 'warning',
  signed_handed_over: 'success',
  corrected: 'info',
  cancelled: 'outline',
}

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="ส่งมอบกุญแจ"
      description="เอกสารลงนามแยกจากสัญญา — ส่งมอบได้เมื่อห้องยืนยันแล้ว ชำระครบ สัญญาลงนามครบ และเอกสารประกอบครบ"
      :icon="KeyRoundIcon"
    />

    <PermissionGate permission="key_handover.record">
      <div class="space-y-3">
        <Card v-for="kh in contractsStore.keyHandovers" :key="kh.id" class="py-0">
          <CardContent class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                <KeyRoundIcon class="size-5" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold">ห้อง {{ kh.roomNumber }} <span class="font-normal text-muted-foreground">—</span> {{ nameOf(kh.residentId) }}</p>
                <Badge :variant="statusVariant[kh.status]" class="mt-1">
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
