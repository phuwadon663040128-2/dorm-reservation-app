<script setup lang="ts">
import { computed } from 'vue'
import { useCountdown } from '@/composables/useCountdown'
import { planRoomTypeLabel, planRoomTypeLegendItems, roomPublicStatusLabel } from '@/lib/labels'
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

const spots = computed<Spot[]>(() => {
  // พิกัดห้องเป็นพิกัดสัมบูรณ์ของภาพ — แปลงเป็น % ของหน้าต่างครอบตัด (เริ่มที่ cropX/cropY)
  const ox = props.overlay.cropX ?? 0
  const oy = props.overlay.cropY ?? 0
  return props.overlay.rooms
    .map((rect) => {
      const room = roomByNumber.value.get(rect.number)
      if (!room) return null
      return {
        room,
        style: {
          left: `${((rect.x - ox) / props.overlay.cropW) * 100}%`,
          top: `${((rect.y - oy) / props.overlay.cropH) * 100}%`,
          width: `${(rect.w / props.overlay.cropW) * 100}%`,
          height: `${(rect.h / props.overlay.cropH) * 100}%`,
        },
        cls: statusClass[room.publicStatus],
        dimmed: !props.matchedNumbers.has(room.number),
      }
    })
    .filter((s): s is Spot => s !== null)
})

function label(room: Room) {
  return `ห้อง ${room.number} — ${planRoomTypeLabel[room.config].full} — ${roomPublicStatusLabel[room.publicStatus]}`
}

const typeLegendItems = computed(() =>
  planRoomTypeLegendItems(props.rooms.map(room => room.config)),
)

// countdown ของห้องที่ถูกจองชั่วคราว (แสดงใน tooltip title ผ่าน label เพียงพอ — จอเล็กไม่มีพื้นที่)
const heldRoom = computed(() => props.rooms.find(r => r.publicStatus === 'temporarily_held' && r.holdExpiresAt))
const { display: heldDisplay } = useCountdown(() => heldRoom.value?.holdExpiresAt)
</script>

<template>
  <div class="space-y-2">
    <div class="relative overflow-hidden rounded-2xl border bg-white">
      <!-- แยก canvas ผังออกจากพื้นที่วางคำอธิบาย เพื่อเพิ่มพื้นที่ด้านล่างได้โดยไม่ทำให้ % ของ hotspot เพี้ยน -->
      <div class="relative">
        <!-- แบบแปลนจริง (ฉบับไม่มีเลขห้อง) — เรนเดอร์ผ่าน <svg><image> ให้เหมือนไฟล์ออกแบบต้นฉบับ
             (ไฟล์แปลนมี viewBox เลื่อนจุดเริ่ม การใช้ <img> ตรง ๆ จะทำให้ภาพเพี้ยนไม่ตรงพิกัดห้อง) -->
        <svg
          class="block w-full"
          :viewBox="`${overlay.cropX ?? 0} ${overlay.cropY ?? 0} ${overlay.cropW} ${overlay.cropH}`"
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
          :class="[s.cls, s.dimmed ? 'opacity-20' : '']"
          :style="s.style"
          :disabled="s.dimmed"
          :aria-label="`${label(s.room)}${s.dimmed ? ' — ไม่ตรงตัวกรอง' : ''}`"
          :title="label(s.room)"
          @click="emit('select', s.room)"
        >
          <span class="max-w-full truncate px-px text-[clamp(6px,1.05vw,11px)] font-bold md:hidden">
            {{ planRoomTypeLabel[s.room.config].short }}
          </span>
          <span class="hidden max-w-full truncate px-px text-[clamp(6px,1.05vw,11px)] font-bold md:block">
            {{ planRoomTypeLabel[s.room.config].full }}
          </span>
          <span class="mt-0.5 hidden text-[clamp(6px,0.75vw,10px)] font-medium tabular-nums opacity-80 md:block">
            {{ s.room.number }}
          </span>
          <span
            v-if="s.room.publicStatus === 'temporarily_held' && s.room.number === heldRoom?.number"
            class="hidden text-[clamp(6px,0.75vw,10px)] font-medium md:block"
          >
            เหลือ {{ heldDisplay }}
          </span>
        </button>
      </div>

      <!-- คำอธิบายชื่อย่อประเภทห้องสำหรับหน้าจอขนาดเล็ก -->
      <div
        class="pointer-events-auto absolute right-2 top-2 z-10 flex w-28 select-none flex-col gap-0.5 sm:w-44 sm:gap-2 md:hidden"
      >
        <div
          class="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-slate-950 shadow-sm sm:px-3 sm:py-2 md:hidden"
          role="group"
          aria-label="คำอธิบายรหัสประเภทห้องบนแผนผัง"
        >
          <p class="mb-px text-[10px] font-semibold leading-3 sm:mb-1 sm:text-sm sm:leading-tight">
            ประเภทห้อง
          </p>
          <div class="flex flex-col gap-px sm:gap-1" role="list">
            <span
              v-for="item in typeLegendItems"
              :key="item.key"
              class="flex min-h-3 min-w-0 items-center gap-1 text-[9px] leading-3 text-slate-600 sm:min-h-5 sm:gap-2 sm:text-xs sm:leading-tight"
              role="listitem"
              :aria-label="`${item.short} หมายถึง ${item.full}`"
            >
              <b class="grid h-3 min-w-6 shrink-0 place-items-center rounded border border-slate-200 bg-slate-50 px-0.5 text-[8px] font-bold leading-none text-slate-900 sm:h-5 sm:min-w-8 sm:px-1 sm:text-[11px]">
                {{ item.short }}
              </b>
              <span class="whitespace-nowrap">{{ item.full }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
