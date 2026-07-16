<script setup lang="ts">
import { computed } from 'vue'
import { useCountdown } from '@/composables/useCountdown'
import { roomConfigLabel, roomPublicStatusLabel } from '@/lib/labels'
import type { PlanOverlay } from '@/lib/planOverlays'
import type { Room } from '@/types'

// ผังเลือกห้องแบบวางทับแบบแปลนจริง — ตำแหน่ง/สัดส่วนห้องตรงกับแบบสถาปนิก
// สี hotspot สื่อสถานะเดียวกับ RoomTile (เขียว/เหลือง/เทา/แดง) — ห้องนอกตัวกรองแสดงจาง กดไม่ได้
const props = defineProps<{
  overlay: PlanOverlay
  rooms: Room[]
  matchedNumbers: Set<string>
}>()

const emit = defineEmits<{ (e: 'select', room: Room): void }>()

const roomByNumber = computed(() => new Map(props.rooms.map(r => [r.number, r])))

interface Spot {
  room: Room
  style: { left: string; top: string; width: string; height: string }
  cls: string
  dimmed: boolean
}

const statusClass: Record<Room['publicStatus'], string> = {
  available:
    'border-emerald-600/70 bg-emerald-500/15 text-emerald-900 hover:bg-emerald-500/30 hover:border-emerald-600 dark:text-emerald-950',
  temporarily_held:
    'border-amber-500/80 bg-amber-400/25 text-amber-900 hover:bg-amber-400/40 dark:text-amber-950',
  reserved: 'border-slate-500/60 bg-slate-400/25 text-slate-700 hover:bg-slate-400/35 dark:text-slate-900',
  unavailable: 'border-red-500/70 bg-red-400/20 text-red-800 hover:bg-red-400/30 dark:text-red-950',
}

const spots = computed<Spot[]>(() =>
  props.overlay.rooms
    .map((rect) => {
      const room = roomByNumber.value.get(rect.number)
      if (!room) return null
      return {
        room,
        style: {
          left: `${(rect.x / props.overlay.cropW) * 100}%`,
          top: `${(rect.y / props.overlay.cropH) * 100}%`,
          width: `${(rect.w / props.overlay.cropW) * 100}%`,
          height: `${(rect.h / props.overlay.cropH) * 100}%`,
        },
        cls: statusClass[room.publicStatus],
        dimmed: !props.matchedNumbers.has(room.number),
      }
    })
    .filter((s): s is Spot => s !== null),
)

function label(room: Room) {
  return `ห้อง ${room.number} — ${roomConfigLabel[room.config]} — ${roomPublicStatusLabel[room.publicStatus]}`
}

// ป้ายประเภทห้องแบบสั้นให้พอดีพื้นที่ในผัง (ฉบับเต็มอยู่ใน tooltip/dialog)
const shortConfigLabel: Record<Room['config'], string> = {
  normal: 'พัดลม',
  aircon: 'แอร์',
  hl: 'แอร์ (HL)',
  special: 'แอร์พิเศษ',
}

// countdown ของห้องที่ถูกจองชั่วคราว (แสดงใน tooltip title ผ่าน label เพียงพอ — จอเล็กไม่มีพื้นที่)
const heldRoom = computed(() => props.rooms.find(r => r.publicStatus === 'temporarily_held' && r.holdExpiresAt))
const { display: heldDisplay } = useCountdown(() => heldRoom.value?.holdExpiresAt)
</script>

<template>
  <div class="space-y-2">
    <div class="relative overflow-hidden rounded-2xl border bg-white">
      <!-- แบบแปลนจริง (ฉบับไม่มีเลขห้อง) — เรนเดอร์ผ่าน <svg><image> ให้เหมือนไฟล์ออกแบบต้นฉบับ
           (ไฟล์แปลนมี viewBox เลื่อนจุดเริ่ม การใช้ <img> ตรง ๆ จะทำให้ภาพเพี้ยนไม่ตรงพิกัดห้อง) -->
      <svg
        class="block w-full"
        :viewBox="`0 0 ${overlay.cropW} ${overlay.cropH}`"
        role="img"
        aria-label="แบบแปลนอาคาร"
      >
        <image :href="overlay.image" x="0" y="0" :width="overlay.viewW" :height="overlay.viewH" opacity="0.9" />
      </svg>

      <!-- hotspot ห้อง -->
      <button
        v-for="s in spots"
        :key="s.room.number"
        type="button"
        class="absolute flex flex-col items-center justify-center rounded-sm border-2 font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="[s.cls, s.dimmed ? 'pointer-events-none opacity-20' : '']"
        :style="s.style"
        :aria-label="label(s.room)"
        :title="label(s.room)"
        @click="emit('select', s.room)"
      >
        <span class="text-[clamp(8px,1.2vw,13px)] tabular-nums">{{ s.room.number }}</span>
        <span class="mt-0.5 hidden text-[clamp(6px,0.75vw,10px)] font-medium opacity-80 sm:block">
          {{ shortConfigLabel[s.room.config] }}
        </span>
        <span
          v-if="s.room.publicStatus === 'temporarily_held' && s.room.number === heldRoom?.number"
          class="hidden text-[clamp(6px,0.75vw,10px)] font-medium sm:block"
        >
          เหลือ {{ heldDisplay }}
        </span>
      </button>

      <!-- เข็มทิศ — ทิศเหนือชี้ขึ้นตามแบบแปลน -->
      <div
        class="absolute left-3 top-3 flex flex-col items-center gap-0.5 rounded-xl border bg-background/90 px-2.5 py-2 shadow-sm backdrop-blur"
        role="img"
        aria-label="เข็มทิศ — ทิศเหนือชี้ขึ้นด้านบนของแบบแปลน"
      >
        <svg viewBox="0 0 24 24" class="size-7" aria-hidden="true">
          <circle cx="12" cy="12" r="10.5" class="fill-none stroke-border" stroke-width="1.5" />
          <path d="M12 4 L15 13 L12 11.4 L9 13 Z" class="fill-primary" />
          <path d="M12 20 L9 13 L12 14.6 L15 13 Z" class="fill-muted-foreground/40" />
        </svg>
        <span class="text-[10px] font-bold leading-none text-primary">N · เหนือ</span>
      </div>
    </div>
    <p class="text-xs text-muted-foreground">{{ overlay.northNote }} · ขนาดและตำแหน่งห้องตามแบบแปลนสถาปนิกจริง</p>
  </div>
</template>
