<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2Icon, CircleSlashIcon, LockIcon, TimerIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { roomPublicStatusLabel } from '@/lib/labels'
import type { RoomPublicStatus } from '@/types'

const props = defineProps<{ status: RoomPublicStatus }>()

// สถานะห้องต้องมีทั้งข้อความ+ไอคอน ไม่พึ่งสีอย่างเดียว (a11y baseline, doc 17)
const meta = computed(() => {
  switch (props.status) {
    case 'available':
      return { variant: 'secondary' as const, icon: CheckCircle2Icon, extra: 'text-emerald-700 dark:text-emerald-400' }
    case 'temporarily_held':
      return { variant: 'outline' as const, icon: TimerIcon, extra: 'text-amber-700 dark:text-amber-400 border-amber-300' }
    case 'reserved':
      return { variant: 'outline' as const, icon: LockIcon, extra: 'text-muted-foreground' }
    case 'unavailable':
      return { variant: 'destructive' as const, icon: CircleSlashIcon, extra: '' }
  }
})
</script>

<template>
  <Badge :variant="meta.variant" :class="meta.extra">
    <component :is="meta.icon" aria-hidden="true" />
    {{ roomPublicStatusLabel[status] }}
  </Badge>
</template>
