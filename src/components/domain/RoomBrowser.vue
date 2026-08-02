<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { Building2Icon, LayoutGridIcon, MapIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import { formatBaht, roomConfigLabel, roomConfigOptions } from '@/lib/labels'
import { overlayFor } from '@/lib/planOverlays'
import { campusFor } from '@/lib/campus3d'
import { preloadCampus3d } from '@/lib/preloadCampus3d'
import { totalPriceFor } from '@/fixtures/pricing'
import { useDormStore } from '@/stores/dorm'
import type { Room, RoomConfig } from '@/types'

// โหลด Three.js เฉพาะตอนเปิดมุมมองตึก 3D — ไม่ถ่วง bundle หน้าอื่น
const Campus3D = defineAsyncComponent({
  loader: () => preloadCampus3d() ?? import('./Campus3D.vue'),
  loadingComponent: Campus3DLoading,
  delay: 0,
  suspensible: false,
})

// แผนผังห้องรายชั้นตามเอกสาร 03: กลุ่มหอ → อาคาร → ชั้น → ห้องจริง
// ตัวกรองทั้งหมดเป็น toolbar ด้านบน — พื้นที่ผังเต็มความกว้าง แสดงทีละชั้นตามแท็บที่เลือก
// จอสาธารณะห้ามเปิดเผยตัวตนผู้จอง (ROOM-007)
const props = defineProps<{
  initialDormGroupId?: string
  initialConfig?: string
  initialGender?: string
  initialView?: string
}>()

const emit = defineEmits<{ (e: 'select', room: Room): void }>()

const dorm = useDormStore()
const ALL_BUILDINGS = 'all'

const SELECTABLE_BUILDING_CODES: Record<string, readonly string[]> = {
  'dorm-8-lang': ['1', '2'],
  'dorm-wor-inter': ['A', 'B'],
}

// อาคาร 4–8 เป็นรายการสื่อสารขอบเขตงานเท่านั้น ไม่เพิ่มเข้า store จึงไม่มี
// floor/room/plan data หลุดไปทำงานร่วมกับ flow เลือกห้องโดยไม่ตั้งใจ
const DEVELOPMENT_ONLY_BUILDINGS: Record<string, readonly { id: string; code: string; name: string }[]> = {
  'dorm-8-lang': [
    { code: '4', gender: 'หญิง' },
    { code: '5', gender: 'ชาย' },
    { code: '6', gender: 'ชาย' },
    { code: '7', gender: 'หญิง' },
    { code: '8', gender: 'หญิง' },
  ].map(building => ({
    id: `development-building-${building.code}`,
    code: building.code,
    name: `อาคาร ${building.code} (${building.gender})`,
  })),
}

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
const has3d = computed(() => campusFor(selectedDormGroupId.value) !== null)
const configFilter = ref(
  props.initialConfig === 'hl'
    ? 'aircon'
    : props.initialConfig && props.initialConfig in roomConfigLabel ? props.initialConfig : 'all',
)
const genderFilter = ref(
  props.initialGender === 'male' || props.initialGender === 'female' ? props.initialGender : 'all',
)

watch(() => props.initialConfig, (config) => {
  configFilter.value = config === 'hl'
    ? 'aircon'
    : config && config in roomConfigLabel ? config : 'all'
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
const selectableBuildingCodes = computed(() =>
  SELECTABLE_BUILDING_CODES[selectedDormGroupId.value]
  ?? visibleBuildings.value.map(building => building.code),
)
function isBuildingSelectable(code: string) {
  return selectableBuildingCodes.value.includes(code)
}
const buildingMenuOptions = computed(() => [
  ...visibleBuildings.value.map(building => ({
    id: building.id,
    code: building.code,
    name: building.name,
    disabled: !isBuildingSelectable(building.code),
  })),
  ...(DEVELOPMENT_ONLY_BUILDINGS[selectedDormGroupId.value] ?? []).map(building => ({
    ...building,
    disabled: true,
  })),
])
const visibleBuildingCodes = computed(() =>
  genderFilter.value === 'all'
    ? undefined
    : visibleBuildings.value.map(building => building.code),
)

const selectedBuildingId = ref(
  has3d.value ? ALL_BUILDINGS : visibleBuildings.value[0]?.id ?? '',
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

// อาคาร 2 เป็นผังตัว L กลับด้านและไม่มีช่องว่างใน canvas มากพอ จึงวาง legend
// แยกด้านล่าง ส่วนผังอื่นให้ RealPlanOverlay หาพื้นที่ว่างจากพิกัดห้องอัตโนมัติ
const annotationPlacement = computed<'overlay-auto' | 'detached-bottom-right'>(() =>
  selectedDormGroupId.value === 'dorm-8-lang' && selectedBuilding.value?.code === '2'
    ? 'detached-bottom-right'
    : 'overlay-auto',
)

// พฤติกรรมเดิมของหน้าเลือกห้องเริ่มจากภาพรวมตึก 3D แล้วจึงเจาะลงไปยัง
// อาคาร → ชั้น → ผังห้อง โดยหอที่ไม่มีโมเดล 3D จะ fallback เป็นผังชั้น
const viewMode = ref<'3d' | 'plan' | 'list'>(has3d.value ? '3d' : 'plan')
const realPlanOpen = ref(false)
const campusRef = ref<{
  focusBuilding: (code: string) => boolean
  showAllBuildings: () => void
} | null>(null)

// ตัวกรองเพศต้องให้ผลที่มองเห็นได้ในผัง 3D ด้วย ไม่ปล่อยให้เมนูค้างที่ “ทุกอาคาร”
// โดยผู้ใช้ยังสลับดู A–C (หญิง) หรือ D (ชาย) จากเมนูอาคารได้
watch(genderFilter, () => {
  if (viewMode.value !== '3d') return
  selectedBuildingId.value = ALL_BUILDINGS
})

function selectViewMode(value: unknown) {
  if (value === '3d' && has3d.value) {
    selectedBuildingId.value = ALL_BUILDINGS
    viewMode.value = value
  }
  if (value === 'plan' || value === 'list') {
    if (selectedBuildingId.value === ALL_BUILDINGS) {
      selectedBuildingId.value = visibleBuildings.value[0]?.id ?? ''
    }
    viewMode.value = value
  }
}

watch(() => props.initialView, (requestedView) => {
  if (requestedView === 'plan' || requestedView === 'list') {
    selectViewMode(requestedView)
    return
  }
  // ค่าเริ่มต้นและ view=3d ต้องกลับสู่ภาพรวมตึก แม้ component เดิมยังไม่ unmount
  if (!requestedView || requestedView === '3d') selectViewMode('3d')
})

// ในมุมมอง 3D — เลือกอาคารจาก dropdown ด้านบน = โฟกัสตึกนั้นในฉาก 3D
watch([selectedBuildingId, viewMode, campusRef], ([id, currentView, campus]) => {
  // ระหว่าง async component แสดง Skeleton ค่า ref อาจชี้ loading component ที่ยังไม่มี API ของฉาก
  if (
    currentView !== '3d'
    || !campus
    || typeof campus.focusBuilding !== 'function'
    || typeof campus.showAllBuildings !== 'function'
  ) return
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
  if (!building || !isBuildingSelectable(building.code)) return
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
  if (!building || !isBuildingSelectable(building.code)) return
  if (!visibleBuildings.value.some(item => item.id === building.id)) genderFilter.value = 'all'
  selectedBuildingId.value = building.id
}

interface BuildingConfigSummary {
  config: RoomConfig
  count: number
  sharedPrice: number | undefined
  wholeRoomPrice: number | undefined
}

// สรุปภาพรวมอาคารที่เลือก: แสดงราคาแยกพักคู่/เหมาห้องให้ตรงกับรูปแบบที่ผู้ใช้จะเลือกจริง
const buildingSummary = computed(() => {
  const b = selectedBuilding.value
  if (!b) return null
  const all = dorm.roomsOf(b.id)
  if (!all.length) return null
  const configs = (Object.keys(roomConfigLabel) as RoomConfig[])
    .map((config) => {
      const matchingRooms = all.filter(room => room.config === config)
      if (!matchingRooms.length) return null
      const supportsShared = matchingRooms.some(room => room.occupancyCapability.includes('shared'))
      const supportsWholeRoom = matchingRooms.some(room => room.occupancyCapability.includes('whole_room'))
      return {
        config,
        count: matchingRooms.length,
        sharedPrice: supportsShared
          ? totalPriceFor(b.dormGroupId, config, 'shared')
          : undefined,
        wholeRoomPrice: supportsWholeRoom
          ? totalPriceFor(b.dormGroupId, config, 'whole_room')
          : undefined,
      }
    })
    .filter((item): item is BuildingConfigSummary => item !== null)
  return {
    configs,
  }
})
</script>

<template>
  <TooltipProvider :delay-duration="180">
    <div class="space-y-4">
    <!-- หัวหน้าจอสาธารณะแยกจากตัวกรอง เพื่อให้สรุปอาคารย้ายขึ้นมาอยู่ก่อน toolbar ได้ -->
    <div v-if="$slots.header" class="rounded-2xl border bg-card px-4 py-4 shadow-sm sm:px-5">
      <slot name="header" />
    </div>

    <!-- เมื่อเลือกอาคารแล้ว ให้เห็นสรุปและราคาแต่ละรูปแบบก่อนตัวกรองตามลำดับการอ่านบนมือถือ -->
    <div
      v-if="viewMode !== '3d' && selectedBuilding && buildingSummary"
      class="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
    >
      <div class="min-w-0 space-y-0.5">
        <p class="font-bold leading-tight">{{ selectedBuilding.name }}</p>
      </div>

      <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <section
          v-for="c in buildingSummary.configs"
          :key="c.config"
          class="min-w-0 rounded-xl border bg-muted/20 p-3"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <h3 class="min-w-0 text-sm font-semibold leading-snug">{{ roomConfigLabel[c.config] }}</h3>
            <span class="shrink-0 text-xs tabular-nums text-muted-foreground">{{ c.count }} ห้อง</span>
          </div>
          <dl
            class="mt-2 grid gap-3 border-t pt-2"
            :class="c.sharedPrice !== undefined && c.wholeRoomPrice !== undefined ? 'grid-cols-2' : 'grid-cols-1'"
          >
            <div v-if="c.sharedPrice !== undefined" class="min-w-0">
              <dt class="text-[11px] leading-tight text-muted-foreground">พักคู่ · ต่อคน/ปี</dt>
              <dd class="mt-0.5 whitespace-nowrap text-sm font-semibold tabular-nums">{{ formatBaht(c.sharedPrice) }}</dd>
            </div>
            <div v-if="c.wholeRoomPrice !== undefined" class="min-w-0">
              <dt class="text-[11px] leading-tight text-muted-foreground">เหมาห้อง · ต่อห้อง/ปี</dt>
              <dd class="mt-0.5 whitespace-nowrap text-sm font-semibold tabular-nums">{{ formatBaht(c.wholeRoomPrice) }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <!-- ตัวกรองย้ายมาอยู่หลังสรุปอาคาร; ในมุมมองทุกอาคารจะแสดงเป็นรายการแรกก่อนฉาก 3D -->
    <div class="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <!-- มือถือ: grid 2 คอลัมน์เท่ากันทุกช่อง · จอใหญ่ (sm+): แถว flex เดิม -->
      <div
        class="grid grid-cols-2 items-end gap-2.5 p-3 sm:flex sm:flex-wrap sm:gap-x-2.5 sm:gap-y-2.5 sm:px-5 sm:py-3.5"
      >
      <div class="min-w-0 sm:min-w-40">
        <Label class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">หอพัก</Label>
        <Select v-model="selectedDormGroupId">
          <SelectTrigger class="w-full" aria-label="เลือกหอพัก" data-testid="dorm-group-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="g in dorm.dormGroups"
              :key="g.id"
              :value="g.id"
              :data-testid="`dorm-group-option-${g.id}`"
            >
              {{ g.shortName }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-0 sm:min-w-44">
        <Label class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">อาคาร</Label>
        <Select v-model="selectedBuildingId" :disabled="!buildingMenuOptions.length">
          <SelectTrigger class="w-full" aria-label="เลือกอาคาร" data-testid="building-select">
            <SelectValue :placeholder="buildingMenuOptions.length ? 'เลือกอาคาร' : 'ไม่มีอาคารตามตัวกรอง'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-if="has3d && viewMode === '3d'" :value="ALL_BUILDINGS">
              ทุกอาคาร
            </SelectItem>
            <template v-for="building in buildingMenuOptions" :key="building.id">
              <SelectItem
                v-if="!building.disabled"
                :value="building.id"
                :data-testid="`building-option-${building.code}`"
              >
                {{ building.name }}
              </SelectItem>
              <Tooltip v-else>
                <TooltipTrigger as-child>
                  <div
                    tabindex="0"
                    role="note"
                    class="cursor-not-allowed rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    :aria-label="`${building.name} — กำลังพัฒนา`"
                    :data-testid="`building-development-${building.code}`"
                  >
                    <SelectItem
                      :value="building.id"
                      disabled
                      class="cursor-not-allowed"
                      :data-testid="`building-option-${building.code}`"
                    >
                      {{ building.name }}
                    </SelectItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" :side-offset="8">กำลังพัฒนา</TooltipContent>
              </Tooltip>
            </template>
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
            <SelectItem v-for="option in roomConfigOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
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
            data-testid="room-view-3d"
            class="h-8 w-full data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 sm:w-auto"
          >
            <Building2Icon aria-hidden="true" /> ตึก 3 มิติ
          </ToggleGroupItem>
          <ToggleGroupItem
            value="plan"
            data-testid="room-view-plan"
            class="h-8 w-full data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 sm:w-auto"
          >
            <MapIcon aria-hidden="true" /> ผังชั้น
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            data-testid="room-view-list"
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
    <ClientOnly v-if="viewMode === '3d'">
      <Campus3D
        ref="campusRef"
        :dorm-group-id="selectedDormGroupId"
        :availability="availabilityByCode"
        :visible-building-codes="visibleBuildingCodes"
        :selectable-building-codes="selectableBuildingCodes"
        @select-building="onSelectBuildingFrom3d"
        @select-floor="onSelectFloorFrom3d"
        @switch-dorm="selectedDormGroupId = $event"
      />
      <template #fallback>
        <Campus3DLoading />
      </template>
    </ClientOnly>

    <template v-if="viewMode !== '3d' && selectedBuilding && floorsWithRooms.length">
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

      </div>

      <!-- ผังของชั้นที่เลือก -->
      <section v-if="currentFloor" :key="currentFloor.floor" class="space-y-3">
        <!-- ปุ่มกลับอยู่ติดมุมขวาบนของพื้นที่ผังโดยตรง จึงหาเจอได้ทั้งธีมสว่าง/มืดและไม่หลุดเมื่อสรุปอาคารตัดบรรทัด -->
        <div class="flex min-h-9 flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold">
            {{ viewMode === 'plan' ? 'ผังห้อง' : 'รายการห้อง' }} {{ selectedBuilding.name }}  ชั้น {{ currentFloor.floor }}
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
  </TooltipProvider>
</template>
