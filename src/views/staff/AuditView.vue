<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import { formatDateTime } from '@/lib/labels'
import { useContractsStore } from '@/stores/contracts'

const contractsStore = useContractsStore()
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">Audit Log</h1>
      <p class="text-sm text-muted-foreground">
        ทุก action สำคัญ (จองแทน / บันทึกจ่าย manual / override / จับคู่ PDF ใหม่ / พิมพ์ซ้ำ / ยกเลิก)
        ต้องมีผู้กระทำ เหตุผล และเวลาเสมอ
      </p>
    </div>

    <PermissionGate permission="audit.view">
      <div class="space-y-2">
        <Card v-for="e in contractsStore.auditEvents" :key="e.id">
          <CardContent class="space-y-1 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="font-mono text-xs">{{ e.action }}</Badge>
                <span class="text-sm font-medium">{{ e.actor }}</span>
              </div>
              <span class="text-xs text-muted-foreground">{{ formatDateTime(e.timestamp) }}</span>
            </div>
            <p class="text-sm">{{ e.detail }}</p>
            <p v-if="e.reason" class="text-xs text-muted-foreground">เหตุผล: {{ e.reason }}</p>
            <p v-if="e.relatedIds?.length" class="font-mono text-xs text-muted-foreground">
              อ้างอิง: {{ e.relatedIds.join(', ') }}
            </p>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  </div>
</template>
