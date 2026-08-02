<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { InfoIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import RoomBrowser from '@/components/domain/RoomBrowser.vue'
import { useDormStore } from '@/stores/dorm'
import { useReservationStore } from '@/stores/reservation'
import type { Room } from '@/types'

const RoomReservationDialog = defineAsyncComponent(
  () => import('@/components/domain/RoomReservationDialog.vue'),
)

const reservation = useReservationStore()
const dorm = useDormStore()
const route = useRoute()

const requestedRoom = computed(() => {
  const roomNumber = typeof route.query.room === 'string' ? route.query.room : ''
  return roomNumber ? dorm.roomByNumber(roomNumber) : undefined
})
const requestedDormGroupId = computed(() => {
  const room = requestedRoom.value
  if (room) {
    return dorm.buildings.find(building => building.id === room.buildingId)?.dormGroupId
  }
  return typeof route.query.dorm === 'string' ? route.query.dorm : undefined
})
const requestedConfig = computed(() =>
  typeof route.query.config === 'string' ? route.query.config : undefined,
)
const requestedGender = computed(() =>
  typeof route.query.gender === 'string' ? route.query.gender : undefined,
)
const requestedView = computed(() =>
  typeof route.query.view === 'string' ? route.query.view : undefined,
)

const selectedRoom = ref<Room | null>(null)
const dialogOpen = ref(false)

function onSelect(room: Room) {
  selectedRoom.value = room
  dialogOpen.value = true
}

watch(requestedRoom, (room) => {
  if (room) onSelect(room)
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">เลือกห้องพัก</h1>
      <p class="text-sm text-muted-foreground">
        เลือกหอ อาคาร ชั้น และห้องจริงได้ทันที หลังยืนยันห้องระบบจะพาไปจำลองการชำระเงิน แล้วจึงกรอกใบสมัครภายหลัง
      </p>
    </div>

    <Alert v-if="reservation.myReservation">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>คุณมีการจองอยู่แล้ว</AlertTitle>
      <AlertDescription>
        ห้อง {{ reservation.myReservation.roomNumber }} — ดูรายละเอียดได้ที่เมนู “สถานะการจอง”
        (1 คนมีได้ 1 การจอง/กลุ่มที่ใช้งานอยู่เท่านั้น)
      </AlertDescription>
    </Alert>

    <RoomBrowser
      :initial-dorm-group-id="requestedDormGroupId"
      :initial-config="requestedConfig"
      :initial-gender="requestedGender"
      :initial-view="requestedView"
      @select="onSelect"
    />

    <RoomReservationDialog
      v-if="selectedRoom"
      v-model:open="dialogOpen"
      :room="selectedRoom"
      action-mode="development"
      content-test-id="applicant-room-detail"
    />
  </div>
</template>
