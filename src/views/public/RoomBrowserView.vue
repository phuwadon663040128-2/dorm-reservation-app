<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckIcon, RulerIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import RoomStatusBadge from '@/components/domain/RoomStatusBadge.vue'
import { formatBaht, occupancyModeLabel, roomConfigLabel } from '@/lib/labels'
import {
  CURRENT_ACADEMIC_YEAR,
  PRICING_REFERENCE_ACADEMIC_YEAR,
  priceLinesFor,
} from '@/fixtures/pricing'
import { useDormStore } from '@/stores/dorm'
import { useSessionStore } from '@/stores/session'
import type { Room } from '@/types'

const dorm = useDormStore()
const session = useSessionStore()
const router = useRouter()
const summary = dorm.availabilitySummary

// รับตัวกรองจาก search bar หน้าแรก (/rooms?dorm=&config=&gender=)
const route = useRoute()
const initialDorm = computed(() =>
  typeof route.query.dorm === 'string' ? route.query.dorm : undefined,
)
const initialConfig = computed(() =>
  typeof route.query.config === 'string' ? route.query.config : undefined,
)
const initialGender = computed(() =>
  typeof route.query.gender === 'string' ? route.query.gender : undefined,
)

// dialog รายละเอียดห้อง (โหมดสาธารณะ — ดูข้อมูล + ชวนเข้าสู่ระบบเพื่อจอง)
const selectedRoom = ref<Room | null>(null)
const dialogOpen = ref(false)

function onSelect(room: Room) {
  selectedRoom.value = room
  dialogOpen.value = true
}

const buildingOfSelected = computed(() =>
  selectedRoom.value ? dorm.buildings.find(b => b.id === selectedRoom.value!.buildingId) : undefined,
)

// ประมาณการราคาแยกตามรูปแบบการพักที่ห้องรองรับ
const priceByMode = computed(() => {
  const room = selectedRoom.value
  const building = buildingOfSelected.value
  if (!room || !building) return []
  return room.occupancyCapability.map(mode => {
    const lines = priceLinesFor(building.dormGroupId, room.config, mode)
    return { mode, lines, total: lines.reduce((s, l) => s + l.amount, 0) }
  })
})

function goReserve() {
  dialogOpen.value = false
  const reservationTarget = {
    path: '/app/rooms',
    query: {
      ...(buildingOfSelected.value?.dormGroupId ? { dorm: buildingOfSelected.value.dormGroupId } : {}),
      ...(selectedRoom.value ? { room: selectedRoom.value.number } : {}),
    },
  }
  if (session.isLoggedIn && !session.isStaff) {
    router.push(reservationTarget)
  } else {
    router.push({
      path: route.path,
      query: {
        ...route.query,
        auth: 'login',
        redirect: router.resolve(reservationTarget).fullPath,
      },
    })
  }
}
</script>

<template>
  <!-- หน้าแผนผังใช้คอนเทนเนอร์กว้างพิเศษ + ระยะขอบแคบ เพื่อให้ผังแสดงเต็มโดยไม่ต้องเลื่อนแนวนอน -->
  <div class="mx-auto w-full max-w-352 space-y-5 px-3 py-6 sm:px-5">
    <LazyRoomBrowser
      hydrate-on-interaction
      :initial-dorm-group-id="initialDorm"
      :initial-config="initialConfig"
      :initial-gender="initialGender"
      @select="onSelect"
    >
      <!-- ส่วนหัวรวมอยู่ในการ์ดเดียวกับตัวกรอง — สถิติจาก exact rooms (ไม่ใช่โควตา) เป็น pill กะทัดรัด -->
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

    <!-- Dialog รายละเอียดห้อง -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent v-if="selectedRoom" class="sm:max-w-lg">
        <DialogHeader>
          <div class="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>ห้อง {{ selectedRoom.number }}</DialogTitle>
            <RoomStatusBadge :status="selectedRoom.publicStatus" />
          </div>
          <DialogDescription>
            {{ buildingOfSelected?.name }} · ชั้น {{ selectedRoom.floor }} · {{ roomConfigLabel[selectedRoom.config] }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <HoldCountdown
            v-if="selectedRoom.publicStatus === 'temporarily_held' && selectedRoom.holdExpiresAt"
            :expires-at="selectedRoom.holdExpiresAt"
            label="ถูกจองชั่วคราว เหลือ"
          />

          <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <RulerIcon class="size-4 shrink-0" aria-hidden="true" />
            <span v-if="selectedRoom.dimensions">ขนาดห้อง {{ selectedRoom.dimensions }}</span>
            <span v-else>ยังไม่มีข้อมูลขนาดห้องอย่างเป็นทางการ</span>
          </p>

          <div class="space-y-1.5">
            <p class="text-sm font-semibold">สิ่งอำนวยความสะดวก</p>
            <ul class="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <li v-for="fc in selectedRoom.facilities" :key="fc" class="flex items-center gap-1.5">
                <CheckIcon class="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> {{ fc }}
              </li>
            </ul>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-semibold">ประมาณการค่าใช้จ่ายรอบปีการศึกษา {{ CURRENT_ACADEMIC_YEAR }}</p>
            <div v-for="p in priceByMode" :key="p.mode" class="rounded-lg border p-3">
              <div class="mb-1 flex items-center justify-between gap-2">
                <Badge variant="secondary">{{ occupancyModeLabel[p.mode] }}</Badge>
                <span class="text-sm font-semibold tabular-nums">
                  {{ formatBaht(p.total) }}{{ p.mode === 'shared' ? ' / คน' : ' / ห้อง' }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ p.lines.map(l => `${l.ref2} ${l.amount.toLocaleString('th-TH')}`).join(' + ') }}
              </p>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground">
              ใช้อัตราประกาศปีการศึกษา {{ PRICING_REFERENCE_ACADEMIC_YEAR }} เป็นข้อมูลอ้างอิงชั่วคราว
              ระหว่างรอประกาศรอบ {{ CURRENT_ACADEMIC_YEAR }} · ยอดจริงยืนยันในแบบฟอร์มชำระเงิน
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">ปิด</Button>
          <Button v-if="selectedRoom.publicStatus === 'available'" @click="goReserve">
            {{ session.isLoggedIn && !session.isStaff ? 'ไปจองห้องนี้' : 'เข้าสู่ระบบเพื่อจอง' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
