<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { Building2Icon, LayoutGridIcon, MapIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FloorPlanGrid from './FloorPlanGrid.vue'
import RealPlanDialog from './RealPlanDialog.vue'
import RealPlanOverlay from './RealPlanOverlay.vue'
import RoomTile from './RoomTile.vue'
import { roomConfigLabel, roomPublicStatusLabel } from '@/lib/labels'
import { overlayFor } from '@/lib/planOverlays'
import { campusFor } from '@/lib/campus3d'
import { useDormStore } from '@/stores/dorm'
import type { Room, RoomPublicStatus } from '@/types'

// โหลด Three.js เฉพาะตอนเปิดมุมมองตึก 3D — ไม่ถ่วง bundle หน้าอื่น
const Campus3D = defineAsyncComponent(() => import('./Campus3D.vue'))

// แผนผังห้องรายชั้นตามเอกสาร 03: กลุ่มหอ → อาคาร → ชั้น → ห้องจริง
// ตัวกรองทั้งหมดเป็น toolbar ด้านบน — พื้นที่ผังเต็มความกว้าง แสดงทีละชั้นตามแท็บที่เลือก
// จอสาธารณะห้ามเปิดเผยตัวตนผู้จอง (ROOM-007)
const props = defineProps<{
  initialDormGroupId?: string
  initialConfig?: string
  initialGender?: string
}>()

const emit = defineEmits<{ (e: 'select', room: Room): void }>()

const dorm = useDormStore()

const selectedDormGroupId = ref(
  dorm.dormGroups.some(g => g.id === props.initialDormGroupId)
    ? props.initialDormGroupId!
    : dorm.dormGroups[0]!.id,
)
const configFilter = ref(props.initialConfig && props.initialConfig in roomConfigLabel ? props.initialConfig : 'all')
const genderFilter = ref(
  props.initialGender === 'male' || props.initialGender === 'female' ? props.initialGender : 'all',
)
const onlyAvailable = ref(false)

// อาคารที่มองเห็น กรองตามเพศของอาคาร
const visibleBuildings = computed(() =>
  dorm
    .buildingsOf(selectedDormGroupId.value)
    .filter(b => genderFilter.value === 'all' || b.gender === genderFilter.value),
)

const selectedBuildingId = ref(visibleBuildings.value[0]?.id ?? '')

watch(visibleBuildings, (list) => {
  if (!list.some(b => b.id === selectedBuildingId.value)) {
    selectedBuildingId.value = list[0]?.id ?? ''
  }
})

const selectedBuilding = computed(() =>
  dorm.buildings.find(b => b.id === selectedBuildingId.value),
)

function matchesFilter(room: Room) {
  if (configFilter.value !== 'all' && room.config !== configFilter.value) return false
  if (onlyAvailable.value && room.publicStatus !== 'available') return false
  return true
}

/** ชั้นของอาคารที่เลือก (เฉพาะชั้นที่มีข้อมูลห้อง)
 * มุมมองผังต้องได้ห้องครบทั้งชั้นเพื่อรักษาตำแหน่ง — ห้องนอกตัวกรองแสดงจางแทนการตัดออก */
const floorsWithRooms = computed(() => {
  const building = selectedBuilding.value
  if (!building) return []
  return building.floors
    .map((floor) => {
      const allRooms = dorm.roomsOf(building.id, floor)
      const rooms = allRooms.filter(matchesFilter)
      return {
        floor,
        allRooms,
        rooms,
        matchedNumbers: new Set(rooms.map(r => r.number)),
        availableCount: allRooms.filter(r => r.publicStatus === 'available').length,
      }
    })
    .filter(f => f.allRooms.length > 0)
})

// แสดงทีละชั้น — เปลี่ยนอาคารแล้วชั้นเดิมไม่มีอยู่ ให้เด้งไปชั้นแรกที่มีห้อง
const selectedFloor = ref<number | null>(floorsWithRooms.value[0]?.floor ?? null)

watch(floorsWithRooms, (list) => {
  if (!list.some(f => f.floor === selectedFloor.value)) {
    selectedFloor.value = list[0]?.floor ?? null
  }
})

const currentFloor = computed(() =>
  floorsWithRooms.value.find(f => f.floor === selectedFloor.value) ?? null,
)

// ผังวางทับแบบแปลนจริง — ใช้เมื่อชั้นนั้นมีข้อมูลพิกัดห้อง (planOverlays) ไม่มีก็ใช้ผังโครงสร้าง
const currentOverlay = computed(() =>
  selectedBuilding.value && selectedFloor.value !== null
    ? overlayFor(selectedDormGroupId.value, selectedBuilding.value.code, selectedFloor.value)
    : null,
)

// มุมมอง: ตึก 3D (ค่าเริ่มต้นถ้าหอนี้มีโมเดล) / ผังชั้น / รายการ + modal ผังจริง
const has3d = computed(() => campusFor(selectedDormGroupId.value) !== null)
const viewMode = ref<'3d' | 'plan' | 'list'>(has3d.value ? '3d' : 'plan')
const realPlanOpen = ref(false)
const campusRef = ref<{ focusBuilding: (code: string) => void } | null>(null)

// ในมุมมอง 3D — เลือกอาคารจาก dropdown ด้านบน = โฟกัสตึกนั้นในฉาก 3D
watch(selectedBuildingId, (id) => {
  if (viewMode.value !== '3d' || !campusRef.value) return
  const b = dorm.buildings.find(x => x.id === id)
  if (b) campusRef.value.focusBuilding(b.code)
})

// เปลี่ยนหอแล้วถ้าหอใหม่ไม่มีโมเดล 3D ให้เด้งไปมุมมองผัง
watch(has3d, (v) => {
  if (!v && viewMode.value === '3d') viewMode.value = 'plan'
})

// ข้อมูลจำนวนห้องว่าง/ทั้งหมด รายอาคาร→รายชั้น สำหรับป้ายบนตึก 3D (คีย์ด้วย building.code)
const availabilityByCode = computed(() => {
  const out: Record<string, Record<number, { available: number; total: number }>> = {}
  for (const b of dorm.buildingsOf(selectedDormGroupId.value)) {
    for (const floor of b.floors) {
      const rooms = dorm.roomsOf(b.id, floor)
      if (!rooms.length) continue
      out[b.code] ??= {}
      out[b.code]![floor] = {
        available: rooms.filter(r => r.publicStatus === 'available').length,
        total: rooms.length,
      }
    }
  }
  return out
})

// จาก 3D กดเลือกชั้น → ตั้งอาคาร/ชั้น แล้วสลับไปแผนผังห้อง (พร้อมปุ่มกลับ 3D)
function onSelectFloorFrom3d(payload: { buildingCode: string; floor: number }) {
  const building = dorm.buildingsOf(selectedDormGroupId.value).find(b => b.code === payload.buildingCode)
  if (!building) return
  selectedBuildingId.value = building.id
  selectedFloor.value = payload.floor
  viewMode.value = 'plan'
}

// legend นับจากชั้นที่กำลังแสดง
const legendItems: { status: RoomPublicStatus; dot: string }[] = [
  { status: 'available', dot: 'bg-emerald-500' },
  { status: 'temporarily_held', dot: 'bg-amber-500' },
  { status: 'reserved', dot: 'bg-muted-foreground' },
  { status: 'unavailable', dot: 'bg-destructive' },
]

function statusCount(status: RoomPublicStatus) {
  return currentFloor.value?.allRooms.filter(r => r.publicStatus === status).length ?? 0
}
</script>

<template>
  <div class="space-y-4">
    <!-- การ์ดหัวหน้า + ตัวกรองรวมเป็นชิ้นเดียว: ส่วนหัว (slot จากหน้าเรียกใช้) คั่นเส้น แล้วตามด้วยแถวตัวกรอง -->
    <div class="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div v-if="$slots.header" class="px-4 pt-4 pb-3.5 sm:px-5">
        <slot name="header" />
      </div>
      <div
        class="flex flex-wrap items-end gap-x-2.5 gap-y-2.5 p-3 sm:px-5 sm:py-3.5"
        :class="$slots.header ? 'border-t bg-muted/40' : ''"
      >
      <div class="min-w-40">
        <Label class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">หอพัก</Label>
        <Select v-model="selectedDormGroupId">
          <SelectTrigger class="w-full" aria-label="เลือกหอพัก">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="g in dorm.dormGroups" :key="g.id" :value="g.id">{{ g.shortName }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-44">
        <Label class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">อาคาร</Label>
        <Select v-model="selectedBuildingId" :disabled="!visibleBuildings.length">
          <SelectTrigger class="w-full" aria-label="เลือกอาคาร">
            <SelectValue :placeholder="visibleBuildings.length ? 'เลือกอาคาร' : 'ไม่มีอาคารตามตัวกรอง'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="b in visibleBuildings" :key="b.id" :value="b.id">
              {{ b.name }} · ว่าง {{ dorm.roomsOf(b.id).filter(r => r.publicStatus === 'available').length }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-36">
        <Label class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">ประเภทห้อง</Label>
        <Select v-model="configFilter">
          <SelectTrigger class="w-full" aria-label="กรองประเภทห้อง">
            <SelectValue placeholder="ทุกประเภทห้อง" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภทห้อง</SelectItem>
            <SelectItem v-for="(label, key) in roomConfigLabel" :key="key" :value="key">{{ label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-24">
        <Label class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">เพศ</Label>
        <Select v-model="genderFilter">
          <SelectTrigger class="w-full" aria-label="กรองตามเพศ">
            <SelectValue placeholder="ทุกเพศ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกเพศ</SelectItem>
            <SelectItem value="male">ชาย</SelectItem>
            <SelectItem value="female">หญิง</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <label class="flex items-center gap-2 self-end pb-2 ps-1 text-sm">
        <Switch v-model="onlyAvailable" aria-label="แสดงเฉพาะห้องว่าง" />
        แสดงเฉพาะห้องว่าง
      </label>

      <!-- สลับมุมมอง + ผังจริง ชิดขวา -->
      <div class="ms-auto flex items-center gap-1 self-end pb-0.5" role="group" aria-label="เลือกมุมมองห้อง">
        <Button
          v-if="has3d"
          size="sm"
          :variant="viewMode === '3d' ? 'default' : 'outline'"
          :aria-pressed="viewMode === '3d'"
          @click="viewMode = '3d'"
        >
          <Building2Icon aria-hidden="true" /> ตึก 3 มิติ
        </Button>
        <Button
          size="sm"
          :variant="viewMode === 'plan' ? 'default' : 'outline'"
          :aria-pressed="viewMode === 'plan'"
          @click="viewMode = 'plan'"
        >
          <MapIcon aria-hidden="true" /> ผังชั้น
        </Button>
        <Button
          size="sm"
          :variant="viewMode === 'list' ? 'default' : 'outline'"
          :aria-pressed="viewMode === 'list'"
          @click="viewMode = 'list'"
        >
          <LayoutGridIcon aria-hidden="true" /> รายการ
        </Button>
        <Button size="sm" variant="outline" :disabled="!selectedBuilding || selectedFloor === null || viewMode === '3d'" @click="realPlanOpen = true">
          <MapIcon aria-hidden="true" /> ดูผังจริง
        </Button>
      </div>
      </div>
    </div>

    <!-- มุมมองตึก 3 มิติ — เต็มความกว้าง (แยกจากแท็บชั้น) -->
    <Campus3D
      v-if="viewMode === '3d'"
      :dorm-group-id="selectedDormGroupId"
      :availability="availabilityByCode"
      @select-floor="onSelectFloorFrom3d"
      @switch-dorm="selectedDormGroupId = $event"
    />

    <template v-if="viewMode !== '3d' && selectedBuilding && floorsWithRooms.length">
      <!-- ปุ่มกลับมุมมอง 3D เมื่อเข้ามาจากการกดชั้นบนตึก -->
      <div v-if="has3d" class="flex">
        <Button size="sm" variant="ghost" class="-ms-1" @click="viewMode = '3d'">
          <Building2Icon aria-hidden="true" /> กลับไปมุมมองตึก 3 มิติ
        </Button>
      </div>

      <!-- แท็บเลือกชั้น — แสดงผังทีละชั้น -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="เลือกชั้น">
          <button
            v-for="f in floorsWithRooms"
            :key="f.floor"
            type="button"
            role="tab"
            :aria-selected="selectedFloor === f.floor"
            class="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors"
            :class="selectedFloor === f.floor
              ? 'border-primary bg-primary text-primary-foreground font-semibold'
              : 'hover:bg-muted'"
            @click="selectedFloor = f.floor"
          >
            ชั้น {{ f.floor }}
            <span
              class="rounded-full px-1.5 text-xs tabular-nums"
              :class="selectedFloor === f.floor ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'"
            >
              ว่าง {{ f.availableCount }}
            </span>
          </button>
        </div>

        <!-- legend ของชั้นที่แสดงอยู่ -->
        <div class="ms-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span v-for="item in legendItems" :key="item.status" class="inline-flex items-center gap-1.5">
            <span class="size-2 rounded-full" :class="item.dot" aria-hidden="true" />
            {{ roomPublicStatusLabel[item.status] }} <span class="tabular-nums">{{ statusCount(item.status) }}</span>
          </span>
        </div>
      </div>

      <!-- ผังของชั้นที่เลือก -->
      <section v-if="currentFloor" :key="currentFloor.floor" class="space-y-3">
        <h3 class="sr-only">{{ selectedBuilding.name }} ชั้น {{ currentFloor.floor }}</h3>

        <!-- มุมมองผัง: ชั้นที่มีพิกัดห้องใช้ผังวางทับแบบแปลนจริง — ชั้นอื่นใช้ผังโครงสร้าง -->
        <RealPlanOverlay
          v-if="viewMode === 'plan' && currentOverlay"
          :overlay="currentOverlay"
          :rooms="currentFloor.allRooms"
          :matched-numbers="currentFloor.matchedNumbers"
          @select="emit('select', $event)"
        />
        <FloorPlanGrid
          v-else-if="viewMode === 'plan'"
          :dorm-group-id="selectedDormGroupId"
          :rooms="currentFloor.allRooms"
          :matched-numbers="currentFloor.matchedNumbers"
          @select="emit('select', $event)"
        />

        <!-- มุมมองรายการ -->
        <div v-else-if="currentFloor.rooms.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
          <RoomTile v-for="room in currentFloor.rooms" :key="room.number" :room="room" @click="emit('select', $event)" />
        </div>
        <p v-else class="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          ชั้นนี้ไม่มีห้องตรงตามตัวกรอง — ลองเปลี่ยนชั้นหรือปรับตัวกรอง
        </p>
      </section>
    </template>
    <Card v-else-if="viewMode !== '3d'">
      <CardContent class="p-10 text-center text-sm text-muted-foreground">
        ไม่พบห้องตามเงื่อนไขที่เลือก — ลองเปลี่ยนอาคารหรือปรับตัวกรอง
      </CardContent>
    </Card>

    <RealPlanDialog v-model:open="realPlanOpen" :building="selectedBuilding ?? null" :floor="selectedFloor" />
  </div>
</template>
