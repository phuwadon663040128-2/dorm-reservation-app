<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, BedDouble, DoorOpen } from '@lucide/vue'
import type { DormCampaign, DormRooms, RoomInfo } from '../types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
const selectedFloor = ref('')
const selectedRoom = ref<RoomInfo | null>(null)

const currentDormRooms = computed(() => props.dormRooms[props.campaign.id] || null)
const floorOptions = computed(() => currentDormRooms.value?.floors.map(floor => String(floor.floor)) || [])

watch(() => props.campaign.id, () => {
  selectedRoomType.value = props.campaign.roomTypes[0]?.name || ''
  selectedFloor.value = floorOptions.value[0] || ''
  selectedRoom.value = null
}, { immediate: true })

watch(floorOptions, (floors) => {
  if (!selectedFloor.value && floors.length) selectedFloor.value = floors[0]
})

const floorData = computed(() => {
  if (!currentDormRooms.value) return null
  return currentDormRooms.value.floors.find(floor => String(floor.floor) === selectedFloor.value) || null
})

const filteredRooms = computed(() => {
  if (!floorData.value) return []
  return floorData.value.rooms.filter(room => !selectedRoomType.value || room.type === selectedRoomType.value)
})

const selectedRoomPrice = computed(() => {
  if (!selectedRoom.value) return 0
  const roomType = props.campaign.roomTypes.find(room => room.name === selectedRoom.value?.type)
  return roomType?.price || 0
})

const remainingByType = computed(() => {
  const roomType = props.campaign.roomTypes.find(room => room.name === selectedRoomType.value)
  return roomType ? `${roomType.active}/${roomType.capacity}` : '-'
})

function roomAvailability(room: RoomInfo) {
  return room.capacity - room.occupied
}

function roomProgress(room: RoomInfo) {
  return room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0
}

function chooseRoom(room: RoomInfo) {
  if (roomAvailability(room) <= 0) return
  selectedRoom.value = room
}

function proceed() {
  if (!selectedRoom.value) return
  emit('selectRoom', {
    floor: Number(selectedFloor.value),
    roomNumber: selectedRoom.value.number,
    roomType: selectedRoom.value.type,
  })
}
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <section class="space-y-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <Button variant="ghost" size="sm" class="-ml-2" @click="emit('back')">
            <ArrowLeft class="size-4" />
            กลับไปเลือกหอพัก
          </Button>
          <h2 class="text-2xl font-semibold tracking-tight">เลือกประเภทห้องและห้องพัก</h2>
          <p class="text-sm text-muted-foreground">{{ campaign.name }}</p>
        </div>
        <Badge variant="secondary" class="w-fit">คงเหลือ {{ remainingByType }}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">เงื่อนไขการเลือก</CardTitle>
          <CardDescription>เลือกประเภทห้องก่อน แล้วเลือกชั้นและห้องที่ยังมีเตียงว่าง</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(12rem,0.7fr)]">
          <div class="space-y-2">
            <label class="text-sm font-medium">ประเภทห้องพัก</label>
            <Select v-model="selectedRoomType">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="เลือกประเภทห้อง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="roomType in campaign.roomTypes" :key="roomType.name" :value="roomType.name">
                  {{ roomType.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">ชั้น</label>
            <Select v-model="selectedFloor">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="เลือกชั้น" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="floor in floorOptions" :key="floor" :value="floor">
                  ชั้น {{ floor }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle class="text-base">ผังห้อง</CardTitle>
              <CardDescription>แสดงสถานะเตียงว่างในชั้นที่เลือก</CardDescription>
            </div>
            <div class="flex flex-wrap gap-2">
              <Badge variant="outline">ว่าง</Badge>
              <Badge variant="secondary">เต็ม</Badge>
              <Badge>กำลังเลือก</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="filteredRooms.length" class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            <Button
              v-for="room in filteredRooms"
              :key="room.number"
              type="button"
              :variant="selectedRoom?.number === room.number ? 'default' : 'outline'"
              :disabled="roomAvailability(room) <= 0"
              class="h-[7.25rem] flex-col items-stretch justify-between whitespace-normal p-3 text-left"
              @click="chooseRoom(room)"
            >
              <span class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold">ห้อง {{ room.number }}</span>
                <Badge :variant="roomAvailability(room) > 0 ? 'outline' : 'secondary'">
                  {{ roomAvailability(room) }}/{{ room.capacity }}
                </Badge>
              </span>
              <Progress :model-value="roomProgress(room)" class="h-1" />
              <span class="text-[11px] text-muted-foreground">
                {{ roomAvailability(room) > 0 ? `ว่าง ${roomAvailability(room)} เตียง` : 'เต็มแล้ว' }}
              </span>
            </Button>
          </div>
          <Alert v-else>
            <DoorOpen class="size-4" />
            <AlertTitle>ไม่พบห้องในเงื่อนไขนี้</AlertTitle>
            <AlertDescription>ลองเปลี่ยนประเภทห้องหรือชั้นที่ต้องการ</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </section>

    <aside class="space-y-5">
      <Card class="xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle class="text-base">สรุปห้องที่เลือก</CardTitle>
          <CardDescription>
            {{ selectedRoom ? `ห้อง ${selectedRoom.number} ชั้น ${selectedFloor}` : 'ยังไม่ได้เลือกห้อง' }}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="flex items-center justify-center rounded-lg border bg-muted/40 p-6">
            <div class="text-center">
              <BedDouble class="mx-auto mb-2 size-10 text-muted-foreground" />
              <p class="text-lg font-semibold">{{ selectedRoom ? `ห้อง ${selectedRoom.number}` : 'เลือกห้อง' }}</p>
              <p class="text-sm text-muted-foreground">{{ selectedRoom ? `ชั้น ${selectedFloor}` : 'จากผังห้องด้านซ้าย' }}</p>
            </div>
          </div>

          <div v-if="selectedRoom" class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">ประเภท</span>
              <span class="text-right font-medium">{{ selectedRoom.type }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">จำนวนเตียง</span>
              <span class="font-medium">{{ selectedRoom.capacity }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">เตียงว่าง</span>
              <span class="font-medium">{{ roomAvailability(selectedRoom) }}</span>
            </div>
            <Separator />
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">ราคา/เทอม</span>
              <span class="font-semibold">{{ selectedRoomPrice.toLocaleString() }} บาท</span>
            </div>
          </div>

          <Button class="w-full" :disabled="!selectedRoom" @click="proceed">
            ดำเนินการสมัคร
          </Button>
        </CardContent>
      </Card>
    </aside>
  </div>
</template>
