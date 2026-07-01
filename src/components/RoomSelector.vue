<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, BedDouble, DoorOpen } from '@lucide/vue'
import type { DormCampaign, DormRooms, RoomInfo } from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

const props = defineProps<{
  campaign: DormCampaign
  dormRooms: DormRooms
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'selectRoom', room: { floor: number; roomNumber: string; roomType: string }): void
}>()

const selectedRoomType = ref(props.campaign.roomTypes[0]?.name || '')
const selectedFloor = ref(2)
const selectedRoom = ref<RoomInfo | null>(null)

watch(() => props.campaign.id, (newDormId) => {
  selectedRoomType.value = props.campaign.roomTypes[0]?.name || ''
  const dormData = props.dormRooms[newDormId]
  selectedFloor.value = dormData?.floors[0]?.floor || 2
  selectedRoom.value = null
}, { immediate: true })

const currentDormRooms = computed(() => props.dormRooms[props.campaign.id] || null)

const floorData = computed(() => {
  if (!currentDormRooms.value) return null
  return currentDormRooms.value.floors.find(f => f.floor === selectedFloor.value) || null
})

const filteredRooms = computed(() => {
  if (!floorData.value) return []
  return floorData.value.rooms.filter(r => !selectedRoomType.value || r.type === selectedRoomType.value)
})

const selectedRoomPrice = computed(() => {
  if (!selectedRoom.value) return 0
  const rt = props.campaign.roomTypes.find(r => r.name === selectedRoom.value?.type)
  return rt?.price || 0
})

function selectFloor(floor: number) {
  selectedFloor.value = floor
  selectedRoom.value = null
}

function handleSelectRoomType(type: string) {
  selectedRoomType.value = type
  selectedRoom.value = null
}

function handleSelectRoomCell(room: RoomInfo) {
  if (room.capacity - room.occupied <= 0) return
  selectedRoom.value = room
}

function handleProceed() {
  if (!selectedRoom.value) return
  emit('selectRoom', {
    floor: selectedFloor.value,
    roomNumber: selectedRoom.value.number,
    roomType: selectedRoom.value.type,
  })
}

function roomAvailability(room: RoomInfo) {
  return room.capacity - room.occupied
}

function roomProgress(room: RoomInfo) {
  return Math.round((room.occupied / room.capacity) * 100)
}
</script>

<template>
  <Card>
    <CardHeader class="gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <CardTitle>เลือกชั้นและห้องพัก</CardTitle>
        <CardDescription>{{ campaign.name }}</CardDescription>
        <div class="flex flex-wrap gap-1.5 pt-2">
          <Badge v-for="facility in campaign.facilities" :key="facility" variant="secondary">
            {{ facility }}
          </Badge>
        </div>
      </div>
      <Button variant="outline" size="sm" @click="emit('back')">
        <ArrowLeft class="size-4" />
        ย้อนกลับ
      </Button>
    </CardHeader>

    <CardContent class="space-y-5">
      <div class="space-y-2">
        <p class="text-sm font-medium">ประเภทห้องพัก</p>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="rt in campaign.roomTypes"
            :key="rt.name"
            :variant="selectedRoomType === rt.name ? 'default' : 'outline'"
            size="sm"
            @click="handleSelectRoomType(rt.name)"
          >
            {{ rt.name }}
            <Badge :variant="selectedRoomType === rt.name ? 'secondary' : 'outline'">
              {{ rt.active }}/{{ rt.capacity }}
            </Badge>
          </Button>
        </div>
      </div>

      <div v-if="currentDormRooms" class="space-y-2">
        <p class="text-sm font-medium">ชั้น</p>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="floor in currentDormRooms.floors"
            :key="floor.floor"
            :variant="floor.floor === selectedFloor ? 'default' : 'outline'"
            size="sm"
            @click="selectFloor(floor.floor)"
          >
            ชั้น {{ floor.floor }}
          </Button>
        </div>
      </div>

      <Separator />

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div class="space-y-3 lg:col-span-2">
          <div class="flex flex-wrap gap-2">
            <Badge variant="outline">ว่าง</Badge>
            <Badge variant="outline">ว่างบางส่วน</Badge>
            <Badge variant="secondary">เต็ม</Badge>
            <Badge>เลือกอยู่</Badge>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            <Button
              v-for="room in filteredRooms"
              :key="room.number"
              type="button"
              :variant="selectedRoom?.number === room.number ? 'default' : 'outline'"
              :disabled="roomAvailability(room) <= 0"
              class="h-auto flex-col items-stretch gap-2 whitespace-normal p-3 text-left"
              @click="handleSelectRoomCell(room)"
            >
              <span class="flex items-center justify-between gap-2">
                <span class="font-semibold">ห้อง {{ room.number }}</span>
                <Badge :variant="roomAvailability(room) <= 0 ? 'secondary' : 'outline'">
                  {{ roomAvailability(room) }}/{{ room.capacity }}
                </Badge>
              </span>
              <Progress :model-value="roomProgress(room)" class="h-1" />
              <span class="text-[11px] text-muted-foreground">
                {{ roomAvailability(room) <= 0 ? 'เต็มแล้ว' : `ว่าง ${roomAvailability(room)} เตียง` }}
              </span>
            </Button>
          </div>
        </div>

        <Card class="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle class="text-base">รายละเอียดห้อง</CardTitle>
            <CardDescription>
              {{ selectedRoom ? `ห้อง ${selectedRoom.number} ชั้น ${selectedFloor}` : 'ยังไม่ได้เลือกห้อง' }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="selectedRoom" class="space-y-4">
              <div class="flex items-center justify-center rounded-lg border bg-muted p-6">
                <div class="text-center">
                  <BedDouble class="mx-auto mb-2 size-10 text-muted-foreground" />
                  <div class="text-lg font-semibold">ห้อง {{ selectedRoom.number }}</div>
                  <div class="text-sm text-muted-foreground">ชั้น {{ selectedFloor }}</div>
                </div>
              </div>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">ประเภท</span>
                  <span class="text-right font-medium">{{ selectedRoom.type }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">จำนวนเตียง</span>
                  <span class="font-medium">{{ selectedRoom.capacity }} เตียง</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">ว่าง</span>
                  <span class="font-medium">{{ selectedRoom.capacity - selectedRoom.occupied }} เตียง</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">ราคา/เทอม</span>
                  <span class="font-semibold">{{ selectedRoomPrice.toLocaleString() }} บาท</span>
                </div>
              </div>

              <Button class="w-full" @click="handleProceed">
                จองห้องนี้
              </Button>
            </div>

            <div v-else class="flex flex-col items-center py-8 text-center text-sm text-muted-foreground">
              <DoorOpen class="mb-3 size-10" />
              คลิกเลือกห้องเพื่อดูรายละเอียด
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>
