<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { Building2Icon, LayoutGridIcon, MapIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FloorPlanGrid from './FloorPlanGrid.vue'
import Campus3DLoading from './Campus3DLoading.vue'
import RealPlanDialog from './RealPlanDialog.vue'
import RealPlanOverlay from './RealPlanOverlay.vue'
import RoomTile from './RoomTile.vue'
import { Badge } from '@/components/ui/badge'
import { formatBaht, roomConfigLabel, roomPublicStatusLabel } from '@/lib/labels'
import { overlayFor } from '@/lib/planOverlays'
import { campusFor } from '@/lib/campus3d'
import { priceLinesFor } from '@/fixtures'
import { useDormStore } from '@/stores/dorm'
import type { Room, RoomConfig, RoomPublicStatus } from '@/types'

// โหลด Three.js เฉพาะตอนเปิดมุมมองตึก 3D — ไม่ถ่วง bundle หน้าอื่น
const Campus3D = defineAsyncComponent({
  loader: () => import('./Campus3D.vue'),
  loadingComponent: Campus3DLoading,
  delay: 120,
})

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
const ALL_BUILDINGS = 'all'

const selectedDormGroupId = ref(
  dorm.dormGroups.some(g => g.id === props.initialDormGroupId)
    ? props.initialDormGroupId!
    : dorm.dormGroups[0]!.id,
)

watch(() => props.initialDormGroupId, (dormGroupId) => {
  if (
    dormGroupId
    && dormGroupId !== selectedDormGroupId.value
    && dorm.dormGroups.some(group => group.id === dormGroupId)
  ) {
    selectedDormGroupId.value = dormGroupId
  }
})
const configFilter = ref(props.initialConfig && props.initialConfig in roomConfigLabel ? props.initialConfig : 'all')
const genderFilter = ref(
  props.initialGender === 'male' || props.initialGender === 'female' ? props.initialGender : 'all',
)

watch(() => props.initialConfig, (config) => {
  configFilter.value = config && config in roomConfigLabel ? config : 'all'
})

watch(() => props.initialGender, (gender) => {
  genderFilter.value = gender === 'male' || gender === 'female' ? gender : 'all'
})
const onlyAvailable = ref(false)

// อาคารที่มองเห็น กรองตามเพศของอาคาร
const visibleBuildings = computed(() =>
  dorm
    .buildingsOf(selectedDormGroupId.value)
    .filter(b => genderFilter.value === 'all' || b.gender === genderFilter.value),
)

const selectedBuildingId = ref(
  campusFor(selectedDormGroupId.value)
    ? ALL_BUILDINGS
    : visibleBuildings.value[0]?.id ?? '',
)

watch(visibleBuildings, (list) => {
  if (selectedBuildingId.value === ALL_BUILDINGS) return
  if (!list.some(b => b.id === selectedBuildingId.value)) {
    selectedBuildingId.value = list[0]?.id ?? ''
  }
})

const selectedBuilding = computed(() =>
  dorm.buildings.find(b =>
    b.id === selectedBuildingId.value && b.dormGroupId === selectedDormGroupId.value,
  ),
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

// อาคาร 2 เป็นทรง L กลับด้าน จึงแยกคำอธิบายไว้ในพื้นที่มุมขวาล่างใต้ canvas ผัง
const annotationPlacement = computed<'overlay-top-left' | 'detached-bottom-right'>(() =>
  selectedDormGroupId.value === 'dorm-8-lang' && selectedBuilding.value?.code === '2'
    ? 'detached-bottom-right'
    : 'overlay-top-left',
)

// มุมมอง: ตึก 3D (ค่าเริ่มต้นถ้าหอนี้มีโมเดล) / ผังชั้น / รายการ + modal ผังจริง
const has3d = computed(() => campusFor(selectedDormGroupId.value) !== null)
const viewMode = ref<'3d' | 'plan' | 'list'>(has3d.value ? '3d' : 'plan')
const realPlanOpen = ref(false)
const campusRef = ref<{
  focusBuilding: (code: string) => boolean
  showAllBuildings: () => void
} | null>(null)

function selectViewMode(value: unknown) {
  if (value === '3d' && has3d.value) viewMode.value = value
  if (value === 'plan' || value === 'list') {
    if (selectedBuildingId.value === ALL_BUILDINGS) {
      selectedBuildingId.value = visibleBuildings.value[0]?.id ?? ''
    }
    viewMode.value = value
  }
}

// ในมุมมอง 3D — เลือกอาคารจาก dropdown ด้านบน = โฟกัสตึกนั้นในฉาก 3D
watch([selectedBuildingId, viewMode, campusRef], ([id, currentView, campus]) => {
  if (currentView !== '3d' || !campus) return
  if (id === ALL_BUILDINGS) {
    campus.showAllBuildings()
    return
  }
  const building = dorm.buildings.find(item =>
    item.id === id && item.dormGroupId === selectedDormGroupId.value,
  )
  if (building) campus.focusBuilding(building.code)
}, { flush: 'post' })

watch(selectedDormGroupId, () => {
  selectedBuildingId.value = viewMode.value === '3d' && has3d.value
    ? ALL_BUILDINGS
    : visibleBuildings.value[0]?.id ?? ''
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

function onSelectBuildingFrom3d(buildingCode: string | null) {
  if (buildingCode === null) {
    selectedBuildingId.value = ALL_BUILDINGS
    return
  }
  const building = dorm.buildingsOf(selectedDormGroupId.value).find(item => item.code === buildingCode)
  if (!building) return
  if (!visibleBuildings.value.some(item => item.id === building.id)) genderFilter.value = 'all'
  selectedBuildingId.value = building.id
}

// สรุปภาพรวมอาคารที่เลือก: จำนวนห้อง/ว่าง + ประเภทห้องพร้อมราคาเริ่มต้นต่อคน (พักคู่) ต่อปีการศึกษา
const buildingSummary = computed(() => {
  const b = selectedBuilding.value
  if (!b) return null
  const all = dorm.roomsOf(b.id)
  if (!all.length) return null
  const configs = (Object.keys(roomConfigLabel) as RoomConfig[])
    .map((config) => {
      const count = all.filter(r => r.config === config).length
      if (!count) return null
      const priceFrom = priceLinesFor(config, 'shared').reduce((s, l) => s + l.amount, 0)
      return { config, count, priceFrom }
    })
    .filter((x): x is { config: RoomConfig; count: number; priceFrom: number } => x !== null)
  return {
    total: all.length,
    available: all.filter(r => r.publicStatus === 'available').length,
    configs,
  }
})

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
      <!-- มือถือ: grid 2 คอลัมน์เท่ากันทุกช่อง · จอใหญ่ (sm+): แถว flex เดิม -->
      <div
        class="grid grid-cols-2 items-end gap-2.5 p-3 sm:flex sm:flex-wrap sm:gap-x-2.5 sm:gap-y-2.5 sm:px-5 sm:py-3.5"
        :class="$slots.header ? 'border-t bg-muted/40' : ''"
      >
      <div class="min-w-0 sm:min-w-40">
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

      <div class="min-w-0 sm:min-w-44">
        <Label class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">อาคาร</Label>
        <Select v-model="selectedBuildingId" :disabled="!visibleBuildings.length">
          <SelectTrigger class="w-full" aria-label="เลือกอาคาร">
            <SelectValue :placeholder="visibleBuildings.length ? 'เลือกอาคาร' : 'ไม่มีอาคารตามตัวกรอง'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-if="has3d && viewMode === '3d'" :value="ALL_BUILDINGS">
              ทุกอาคาร
            </SelectItem>
            <SelectItem v-for="b in visibleBuildings" :key="b.id" :value="b.id">
              {{ b.name }} · ว่าง {{ dorm.roomsOf(b.id).filter(r => r.publicStatus === 'available').length }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-0 sm:min-w-36">
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

      <div class="min-w-0 sm:min-w-24">
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

      <label class="col-span-2 flex items-center gap-2 ps-1 pt-0.5 text-sm sm:col-auto sm:self-end sm:pb-2 sm:pt-0">
        <Switch v-model="onlyAvailable" aria-label="แสดงเฉพาะห้องว่าง" />
        แสดงเฉพาะห้องว่าง
      </label>

      <!-- สลับมุมมอง + ผังจริง — มือถือ: ปุ่ม 2×2 เต็มความกว้าง · จอใหญ่: ชิดขวาแถวเดียว -->
      <div
        class="col-span-2 grid grid-cols-2 gap-1.5 sm:ms-auto sm:flex sm:items-center sm:gap-1 sm:self-end sm:pb-0.5"
      >
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          :spacing="1"
          :model-value="viewMode"
          class="contents sm:flex sm:w-auto sm:items-center sm:gap-1"
          aria-label="เลือกมุมมองห้อง"
          @update:model-value="selectViewMode"
        >
          <ToggleGroupItem
            v-if="has3d"
            value="3d"
            class="h-8 w-full data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 sm:w-auto"
          >
            <Building2Icon aria-hidden="true" /> ตึก 3 มิติ
          </ToggleGroupItem>
          <ToggleGroupItem
            value="plan"
            class="h-8 w-full data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 sm:w-auto"
          >
            <MapIcon aria-hidden="true" /> ผังชั้น
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            class="h-8 w-full data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 sm:w-auto"
          >
            <LayoutGridIcon aria-hidden="true" /> รายการ
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          size="sm"
          variant="outline"
          :disabled="!selectedBuilding || selectedFloor === null || viewMode === '3d'"
          :aria-label="selectedBuilding && selectedFloor !== null
            ? `เปิดแผนผังจริง ${selectedBuilding.name} ชั้น ${selectedFloor}`
            : 'เปิดแผนผังจริง'"
          @click="realPlanOpen = true"
        >
          <MapIcon aria-hidden="true" /> แผนผังจริง
        </Button>
      </div>
      </div>
    </div>

    <!-- มุมมองตึก 3 มิติ — เต็มความกว้าง (แยกจากแท็บชั้น) -->
    <Campus3D
      v-if="viewMode === '3d'"
      ref="campusRef"
      :dorm-group-id="selectedDormGroupId"
      :availability="availabilityByCode"
      @select-building="onSelectBuildingFrom3d"
      @select-floor="onSelectFloorFrom3d"
      @switch-dorm="selectedDormGroupId = $event"
    />

    <template v-if="viewMode !== '3d' && selectedBuilding && floorsWithRooms.length">
      <!-- แถบสรุปอาคาร: ชื่อ + เพศ + จำนวนห้อง/ว่าง + ประเภทห้องพร้อมราคาเริ่มต้น -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-2xl border bg-card px-4 py-3 shadow-sm sm:px-5">
        <div class="min-w-0">
          <p class="flex flex-wrap items-center gap-2 font-bold leading-tight">
            {{ selectedBuilding.name }}
            <Badge variant="secondary" class="font-medium">
              {{ selectedBuilding.gender === 'female' ? 'หอพักหญิง' : 'หอพักชาย' }}
            </Badge>
          </p>
          <p v-if="buildingSummary" class="text-xs text-muted-foreground">
            {{ floorsWithRooms.length }} ชั้น · {{ buildingSummary.total }} ห้อง ·
            ว่าง <b class="tabular-nums text-emerald-700 dark:text-emerald-400">{{ buildingSummary.available }}</b> ห้อง
          </p>
        </div>

        <div v-if="buildingSummary" class="flex flex-wrap items-center gap-1.5 text-xs">
          <span
            v-for="c in buildingSummary.configs"
            :key="c.config"
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
          >
            <b>{{ roomConfigLabel[c.config] }}</b>
            <span class="tabular-nums text-muted-foreground">× {{ c.count }}</span>
            <span class="text-muted-foreground">เริ่ม {{ formatBaht(c.priceFrom) }}/คน/ปี</span>
          </span>
        </div>
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
        <!-- ปุ่มกลับอยู่ติดมุมขวาบนของพื้นที่ผังโดยตรง จึงหาเจอได้ทั้งธีมสว่าง/มืดและไม่หลุดเมื่อสรุปอาคารตัดบรรทัด -->
        <div class="flex min-h-9 flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold">
            {{ viewMode === 'plan' ? 'แผนผังประเภทห้อง' : 'รายการห้อง' }} {{ selectedBuilding.name }}  ชั้น {{ currentFloor.floor }}
          </h3>
          <Button
            v-if="has3d && viewMode === 'plan'"
            size="sm"
            variant="outline"
            class="ms-auto bg-background shadow-sm dark:border-white/80 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90 dark:hover:text-slate-950"
            @click="viewMode = '3d'"
          >
            <Building2Icon aria-hidden="true" /> กลับไปมุมมองตึก 3 มิติ
          </Button>
        </div>

        <!-- มุมมองผัง: ชั้นที่มีพิกัดห้องใช้ผังวางทับแบบแปลนจริง — ชั้นอื่นใช้ผังโครงสร้าง -->
        <RealPlanOverlay
          v-if="viewMode === 'plan' && currentOverlay"
          :overlay="currentOverlay"
          :rooms="currentFloor.allRooms"
          :matched-numbers="currentFloor.matchedNumbers"
          :annotation-placement="annotationPlacement"
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
