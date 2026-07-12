<script setup lang="ts">
import { computed, ref } from 'vue'
import { BuildingIcon, RulerIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import HoldCountdown from './HoldCountdown.vue'
import RoomStatusBadge from './RoomStatusBadge.vue'
import { occupancyModeLabel, roomConfigLabel } from '@/lib/labels'
import { useDormStore } from '@/stores/dorm'
import type { Room } from '@/types'

// Room browser ลำดับชั้นตามเอกสาร 03: กลุ่มหอ → อาคาร → ชั้น → ห้องจริง
// จอสาธารณะห้ามเปิดเผยตัวตนผู้จอง (ROOM-007)
const props = defineProps<{
  /** โหมดเลือกห้อง (ฝั่ง applicant ที่พร้อมจอง) — ถ้า false เป็นการดูอย่างเดียว */
  selectable?: boolean
}>()

const emit = defineEmits<{ (e: 'select', room: Room): void }>()

const dorm = useDormStore()

const selectedDormGroupId = ref(dorm.dormGroups[0]!.id)
const buildingsOfGroup = computed(() => dorm.buildingsOf(selectedDormGroupId.value))
const selectedBuildingId = ref(buildingsOfGroup.value[0]!.id)

function onDormGroupChange(id: string) {
  selectedDormGroupId.value = id
  selectedBuildingId.value = dorm.buildingsOf(id)[0]!.id
  selectedFloor.value = 'all'
}

const selectedBuilding = computed(() =>
  dorm.buildings.find(b => b.id === selectedBuildingId.value),
)
const selectedFloor = ref<string>('all')

const roomList = computed(() =>
  dorm.roomsOf(
    selectedBuildingId.value,
    selectedFloor.value === 'all' ? undefined : Number(selectedFloor.value),
  ),
)

function canSelect(room: Room) {
  return props.selectable && room.publicStatus === 'available'
}
</script>

<template>
  <div class="space-y-4">
    <!-- เลือกกลุ่มหอ -->
    <div class="flex flex-wrap items-center gap-2">
      <Button
        v-for="g in dorm.dormGroups"
        :key="g.id"
        size="sm"
        :variant="selectedDormGroupId === g.id ? 'default' : 'outline'"
        @click="onDormGroupChange(g.id)"
      >
        <BuildingIcon aria-hidden="true" />
        {{ g.name }}
      </Button>
    </div>

    <!-- เลือกอาคาร + ชั้น -->
    <div class="flex flex-wrap items-center gap-3">
      <Tabs :model-value="selectedBuildingId" @update:model-value="v => { selectedBuildingId = String(v); selectedFloor = 'all' }">
        <TabsList>
          <TabsTrigger v-for="b in buildingsOfGroup" :key="b.id" :value="b.id">
            {{ b.name }}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Select v-model="selectedFloor">
        <SelectTrigger class="w-36" aria-label="เลือกชั้น">
          <SelectValue placeholder="ทุกชั้น" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกชั้น</SelectItem>
          <SelectItem v-for="f in selectedBuilding?.floors ?? []" :key="f" :value="String(f)">
            ชั้น {{ f }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- รายการห้องจริง -->
    <div v-if="roomList.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card v-for="room in roomList" :key="room.number">
        <CardContent class="flex h-full flex-col gap-3 p-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-lg font-bold">ห้อง {{ room.number }}</p>
              <p class="text-sm text-muted-foreground">
                {{ selectedBuilding?.name }} · ชั้น {{ room.floor }} · {{ roomConfigLabel[room.config] }}
              </p>
            </div>
            <RoomStatusBadge :status="room.publicStatus" />
          </div>

          <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <RulerIcon class="size-4 shrink-0" aria-hidden="true" />
            <!-- ห้ามแต่งตัวเลขขนาดห้องเอง — ไม่มีข้อมูลให้บอกตามจริง (ROOM-011) -->
            <span v-if="room.dimensions">ขนาดห้อง {{ room.dimensions }}</span>
            <span v-else>ยังไม่มีข้อมูลขนาดห้องอย่างเป็นทางการ</span>
          </p>

          <div class="flex flex-wrap gap-1.5">
            <Badge v-for="m in room.occupancyCapability" :key="m" variant="secondary">
              {{ occupancyModeLabel[m] }}
            </Badge>
          </div>

          <ul class="list-disc pl-5 text-xs text-muted-foreground">
            <li v-for="f in room.facilities.slice(0, 3)" :key="f">{{ f }}</li>
          </ul>

          <div class="mt-auto space-y-2 pt-1">
            <!-- ผู้อื่นเห็นว่าห้องถูกจองชั่วคราวถึงเมื่อไร แต่กดจองไม่ได้ (HOLD-010) -->
            <HoldCountdown
              v-if="room.publicStatus === 'temporarily_held' && room.holdExpiresAt"
              :expires-at="room.holdExpiresAt"
              label="ถูกจองชั่วคราว เหลือ"
            />
            <Button v-if="canSelect(room)" class="w-full" @click="emit('select', room)">
              เลือกห้องนี้
            </Button>
            <Button v-else-if="selectable" class="w-full" variant="outline" disabled>
              ไม่สามารถเลือกได้
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    <Card v-else>
      <CardContent class="p-8 text-center text-sm text-muted-foreground">
        ไม่พบห้องในชั้นที่เลือก — ลองเปลี่ยนอาคารหรือชั้น
      </CardContent>
    </Card>
  </div>
</template>
