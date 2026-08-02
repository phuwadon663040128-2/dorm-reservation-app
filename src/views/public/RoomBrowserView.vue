<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDormStore } from '@/stores/dorm'
import { useSessionStore } from '@/stores/session'
import type { Room } from '@/types'

const RoomReservationDialog = defineAsyncComponent(
  () => import('@/components/domain/RoomReservationDialog.vue'),
)

const dorm = useDormStore()
const session = useSessionStore()
const router = useRouter()
const route = useRoute()
const summary = dorm.availabilitySummary

const initialDorm = computed(() =>
  typeof route.query.dorm === 'string' ? route.query.dorm : undefined,
)
const initialConfig = computed(() =>
  typeof route.query.config === 'string' ? route.query.config : undefined,
)
const initialGender = computed(() =>
  typeof route.query.gender === 'string' ? route.query.gender : undefined,
)
const initialView = computed(() =>
  typeof route.query.view === 'string' ? route.query.view : undefined,
)

const selectedRoom = ref<Room | null>(null)
const dialogOpen = ref(false)
const actionMode = computed<'login' | 'continue' | 'development'>(() => {
  if (!session.isLoggedIn) return 'login'
  return session.isStaff ? 'development' : 'continue'
})

function onSelect(room: Room) {
  selectedRoom.value = room
  dialogOpen.value = true
}

function goReserve({ room }: { room: Room }) {
  dialogOpen.value = false
  const building = dorm.buildings.find(item => item.id === room.buildingId)
  const reservationTarget = {
    path: '/app/rooms',
    query: {
      ...(building?.dormGroupId ? { dorm: building.dormGroupId } : {}),
      room: room.number,
    },
  }

  if (session.isLoggedIn && !session.isStaff) {
    router.push(reservationTarget)
    return
  }

  router.push({
    path: route.path,
    query: {
      ...route.query,
      auth: 'login',
      redirect: router.resolve(reservationTarget).fullPath,
    },
  })
}
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-5 px-3 py-6 sm:px-5">
    <LazyRoomBrowser
      hydrate-on-visible
      :initial-dorm-group-id="initialDorm"
      :initial-config="initialConfig"
      :initial-gender="initialGender"
      :initial-view="initialView"
      @select="onSelect"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div class="space-y-0.5">
            <h1 class="text-xl font-bold tracking-tight sm:text-2xl">แผนผังห้องพัก</h1>
            <p class="max-w-2xl text-sm text-muted-foreground">
              แสดงสถานะรายห้อง ห้องที่ถูกจองชั่วคราวจะแสดงเวลาหมดสิทธิ์ และกลับมาว่างอัตโนมัติหากไม่ชำระตามกำหนด
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-sm" aria-label="สรุปสถานะห้องทั้งระบบ">
            <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1">
              <span class="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              ว่าง <b class="tabular-nums text-emerald-700 dark:text-emerald-400">{{ summary.available }}</b>
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1">
              <span class="size-2 rounded-full bg-amber-500" aria-hidden="true" />
              จองชั่วคราว <b class="tabular-nums text-amber-700 dark:text-amber-400">{{ summary.temporarilyHeld }}</b>
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1">
              <span class="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
              จองแล้ว <b class="tabular-nums">{{ summary.reserved }}</b>
            </span>
          </div>
        </div>
      </template>
    </LazyRoomBrowser>

    <RoomReservationDialog
      v-if="selectedRoom"
      v-model:open="dialogOpen"
      :room="selectedRoom"
      :action-mode="actionMode"
      content-test-id="public-room-detail"
      @action="goReserve"
    />
  </div>
</template>
