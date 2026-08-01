<script setup lang="ts">
import { computed } from 'vue'
import { FanIcon, SnowflakeIcon, SparklesIcon, TimerIcon, User2Icon, Users2Icon } from '@lucide/vue'
import { useCountdown } from '@/composables/useCountdown'
import { planRoomTypeLabel, roomConfigLabel, roomPublicStatusLabel } from '@/lib/labels'
import type { Room } from '@/types'

// ไทล์ห้องในแผนผังรายชั้น — สถานะสื่อด้วย สี + จุด + ข้อความ เสมอ (ไม่พึ่งสีอย่างเดียว)
// compact = ขนาดเล็กสำหรับมุมมองผังโครงสร้างที่มีหลายคอลัมน์
const props = defineProps<{ room: Room; compact?: boolean; planLabels?: boolean }>()
const emit = defineEmits<{ (e: 'click', room: Room): void }>()

const statusStyle = computed(() => {
  switch (props.room.publicStatus) {
    case 'available':
      return {
        tile: 'border-emerald-500/45 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 hover:shadow-md',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
      }
    case 'temporarily_held':
      return {
        tile: 'border-amber-500/45 bg-amber-500/10 hover:border-amber-500 hover:shadow-md',
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
      }
    case 'reserved':
      return {
        tile: 'border-border bg-muted/60 hover:border-foreground/25',
        dot: 'bg-muted-foreground',
        text: 'text-muted-foreground',
      }
    case 'unavailable':
      return {
        tile: 'border-destructive/35 bg-destructive/5 hover:border-destructive/60',
        dot: 'bg-destructive',
        text: 'text-destructive',
      }
  }
})

const configIcon = computed(() => {
  switch (props.room.config) {
    case 'normal': return FanIcon
    case 'special': return SparklesIcon
    default: return SnowflakeIcon
  }
})

const isHeld = computed(() => props.room.publicStatus === 'temporarily_held' && !!props.room.holdExpiresAt)
const { display: holdDisplay, expired: holdExpired } = useCountdown(() => (isHeld.value ? props.room.holdExpiresAt : undefined))
</script>

<template>
  <!-- h-full เฉพาะโหมดปกติ — โหมด compact ห้ามยืดเต็มคอลัมน์ ไม่งั้นผังปีกตั้งฉากจะล้น -->
  <button
    type="button"
    data-testid="room-tile"
    :data-room-status="room.publicStatus"
    class="flex flex-col text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :class="[statusStyle.tile, compact ? 'gap-0.5 rounded-lg border p-1.5' : 'h-full gap-1.5 rounded-xl border-2 p-3']"
    :aria-label="`ห้อง ${room.number} — ${roomPublicStatusLabel[room.publicStatus]}`"
    @click="emit('click', room)"
  >
    <div class="flex w-full items-start justify-between gap-1">
      <span class="font-bold leading-none" :class="compact ? 'text-sm' : 'text-lg'">{{ room.number }}</span>
      <span class="flex items-center gap-1 text-muted-foreground">
        <component :is="configIcon" :class="compact ? 'size-3' : 'size-3.5'" aria-hidden="true" />
        <template v-if="!compact">
          <Users2Icon v-if="room.occupancyCapability.includes('shared')" class="size-3.5" aria-hidden="true" />
          <User2Icon v-if="room.occupancyCapability.includes('whole_room')" class="size-3.5" aria-hidden="true" />
        </template>
      </span>
    </div>

    <span v-if="!compact" class="text-xs text-muted-foreground">{{ roomConfigLabel[room.config] }}</span>
    <span v-else-if="planLabels" class="max-w-full truncate text-[10px] leading-tight text-muted-foreground">
      <span class="md:hidden">{{ planRoomTypeLabel[room.config].short }}</span>
      <span class="hidden md:inline">{{ planRoomTypeLabel[room.config].full }}</span>
    </span>
    <span v-else class="truncate text-[10px] leading-tight text-muted-foreground">{{ roomConfigLabel[room.config] }}</span>

    <span class="mt-auto inline-flex items-center gap-1.5 font-medium" :class="[statusStyle.text, compact ? 'text-[10px]' : 'text-xs']">
      <span class="size-1.5 shrink-0 rounded-full" :class="statusStyle.dot" aria-hidden="true" />
      {{ roomPublicStatusLabel[room.publicStatus] }}
    </span>

    <span
      v-if="isHeld && !holdExpired"
      class="inline-flex items-center gap-1 tabular-nums text-amber-700 dark:text-amber-400"
      :class="compact ? 'text-[9px]' : 'text-[11px]'"
      aria-live="off"
    >
      <TimerIcon class="size-3" aria-hidden="true" /> <span data-allow-mismatch="text">เหลือ {{ holdDisplay }}</span>
    </span>
  </button>
</template>
