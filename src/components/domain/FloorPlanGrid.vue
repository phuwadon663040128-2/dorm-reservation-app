<script setup lang="ts">
import { computed } from 'vue'
import RoomTile from './RoomTile.vue'
import { buildFloorLayout } from '@/lib/floorPlan'
import type { Room } from '@/types'

// ผังโครงสร้างอย่างง่ายตามผังจริง — ตึกเป็นรูปตัว L:
// ปีกหลักแนวนอน (2 แถวคั่นทางเดิน) อยู่ซ้าย-ล่าง + ปีกตั้งฉากอยู่ขวา-บน เหมือนแบบแปลน
// ห้องที่ไม่ตรงตัวกรองจะจางลง (ไม่ตัดออก) เพื่อรักษาตำแหน่งตามผัง
const props = defineProps<{
  dormGroupId: string
  rooms: Room[]
  /** เลขห้องที่ตรงตัวกรองปัจจุบัน — ห้องนอกชุดนี้แสดงจาง กดไม่ได้ */
  matchedNumbers: Set<string>
}>()

const emit = defineEmits<{ (e: 'select', room: Room): void }>()

const layout = computed(() => buildFloorLayout(props.dormGroupId, props.rooms))

function isDimmed(room: Room) {
  return !props.matchedNumbers.has(room.number)
}

function onSelect(room: Room) {
  if (!isDimmed(room)) emit('select', room)
}

const tileClass = (room: Room) => (isDimmed(room) ? 'pointer-events-none opacity-30' : '')
</script>

<template>
  <!-- เรียงตามแปลนจริง: ปีกตั้งฉากอยู่บน-ขวา แล้วปีกหลักเต็มความกว้างด้านล่าง
       (ไม่วางคู่กันแนวนอน เพื่อให้ปีกหลักได้พื้นที่เต็มโดยไม่ต้องมี scrollbar) -->
  <div class="space-y-3">
    <!-- แถวบน: โถงทางเข้า + ปีกตั้งฉากชิดขวา -->
    <div v-if="layout.wing" class="flex items-stretch justify-end gap-1.5">
      <div
        v-if="layout.main.length"
        class="hidden w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 sm:flex"
        aria-hidden="true"
      >
        <span class="text-[10px] text-muted-foreground" style="writing-mode: vertical-rl">โถงทางเข้า / อเนกประสงค์</span>
      </div>
      <div class="w-full space-y-1.5 sm:w-80">
        <p class="text-xs font-medium text-muted-foreground">โซนปีกด้านหลังตึก</p>
        <div class="grid grid-cols-[1fr_auto_1fr] gap-1.5">
        <div class="flex flex-col gap-1.5">
          <RoomTile
            v-for="r in layout.wing.left"
            :key="r.number"
            :room="r"
            compact
            class="w-full"
            :class="tileClass(r)"
            @click="onSelect"
          />
        </div>
        <div class="flex w-5 items-center justify-center rounded bg-muted/70" aria-hidden="true">
          <span class="text-[10px] text-muted-foreground" style="writing-mode: vertical-rl">ทางเดิน</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <RoomTile
            v-for="r in layout.wing.right"
            :key="r.number"
            :room="r"
            compact
            class="w-full"
            :class="tileClass(r)"
            @click="onSelect"
          />
        </div>
        </div>
      </div>
    </div>

    <!-- ปีกหลักแนวนอนเต็มความกว้าง: ฝั่งบน / ทางเดิน / ฝั่งล่าง -->
    <div v-if="layout.main.length" class="overflow-x-auto pb-1">
      <div
        class="grid w-full gap-1.5"
        :style="{ gridTemplateColumns: `repeat(${layout.main.length}, minmax(5.75rem, 1fr))` }"
      >
        <template v-for="(col, i) in layout.main" :key="'top-' + i">
          <div class="min-h-16">
            <RoomTile v-if="col.top" :room="col.top" compact class="h-full w-full" :class="tileClass(col.top)" @click="onSelect" />
            <div v-else class="h-full rounded-lg border border-dashed border-border/60" aria-hidden="true" />
          </div>
        </template>

        <div
          class="col-span-full flex items-center justify-center rounded bg-muted/70 py-0.5 text-[10px] tracking-widest text-muted-foreground"
          aria-hidden="true"
        >
          ทางเดิน
        </div>

        <template v-for="(col, i) in layout.main" :key="'bottom-' + i">
          <div class="min-h-16">
            <RoomTile v-if="col.bottom" :room="col.bottom" compact class="h-full w-full" :class="tileClass(col.bottom)" @click="onSelect" />
            <div v-else class="h-full rounded-lg border border-dashed border-border/60" aria-hidden="true" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
