<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ChevronDownIcon, ImageIcon, InfoIcon, TimerIcon, XIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import RoomBrowser from '@/components/domain/RoomBrowser.vue'
import RoomStatusBadge from '@/components/domain/RoomStatusBadge.vue'
import { formatBaht, occupancyModeLabel, roomConfigLabel } from '@/lib/labels'
import { priceLinesFor } from '@/fixtures/pricing'
import { useDormStore } from '@/stores/dorm'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'
import type { OccupancyMode, Room } from '@/types'

const session = useSessionStore()
const reservation = useReservationStore()
const dorm = useDormStore()
const route = useRoute()
const router = useRouter()

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

const canReserve = computed(
  () => Boolean(session.currentUser) && !reservation.myReservation,
)

// dialog เลือกรูปแบบการพัก + ยืนยันจอง
const selectedRoom = ref<Room | null>(null)
const occupancy = ref<OccupancyMode | null>(null)
const dialogOpen = ref(false)
const selectedBuilding = computed(() => dorm.buildings.find(building => building.id === selectedRoom.value?.buildingId))
const selectedDormGroup = computed(() => dorm.dormGroups.find(group => group.id === selectedBuilding.value?.dormGroupId))

const isLeaderOfAcceptedGroup = computed(
  () =>
    reservation.myRoommateGroup?.status === 'accepted'
    && reservation.myRoommateGroup.leaderId === session.currentUser?.id,
)
const hasActiveGroup = computed(() => !!reservation.myRoommateGroup)

function canChoose(mode: OccupancyMode) {
  if (!selectedRoom.value?.occupancyCapability.includes(mode)) return false
  if (mode === 'shared') {
    return isLeaderOfAcceptedGroup.value
  }
  return !hasActiveGroup.value
}

function onSelect(room: Room) {
  selectedRoom.value = room
  occupancy.value = room.occupancyCapability.find(mode => canChoose(mode)) ?? null
  dialogOpen.value = true
}

watch(requestedRoom, (room) => {
  if (room) onSelect(room)
}, { immediate: true })

const priceLines = computed(() =>
  selectedRoom.value && selectedBuilding.value && occupancy.value
    ? priceLinesFor(selectedBuilding.value.dormGroupId, selectedRoom.value.config, occupancy.value)
    : [],
)
const totalPrice = computed(() => priceLines.value.reduce((s, l) => s + l.amount, 0))

const campaign = computed(() => dorm.openCampaigns[0])
const roomImagePlaceholders = [1, 2, 3, 4, 5]
const detailsScrollArea = ref<HTMLElement | null>(null)
const canScrollDetails = ref(false)
const detailsAtTop = ref(true)
let detailsResizeObserver: ResizeObserver | null = null

function updateDetailsScrollState() {
  const element = detailsScrollArea.value
  if (!element) {
    canScrollDetails.value = false
    detailsAtTop.value = true
    return
  }
  canScrollDetails.value = element.scrollHeight > element.clientHeight + 8
  detailsAtTop.value = element.scrollTop < 12
}

function scrollRoomDetails() {
  const element = detailsScrollArea.value
  if (!element) return
  element.scrollBy({
    top: Math.max(160, element.clientHeight * 0.55),
    behavior: 'smooth',
  })
}

watch(detailsScrollArea, (element) => {
  detailsResizeObserver?.disconnect()
  if (!element) {
    updateDetailsScrollState()
    return
  }
  detailsResizeObserver = new ResizeObserver(updateDetailsScrollState)
  detailsResizeObserver.observe(element)
  void nextTick(updateDetailsScrollState)
})

watch([dialogOpen, occupancy, selectedRoom], () => {
  void nextTick(updateDetailsScrollState)
})

onBeforeUnmount(() => detailsResizeObserver?.disconnect())

function reserve() {
  if (!selectedRoom.value || !occupancy.value) return
  const result = reservation.reserveRoom(selectedRoom.value.number, occupancy.value)
  toast(result.message)
  if (result.ok) {
    dialogOpen.value = false
    router.push(
      reservation.myReservation?.holdStatus === 'held_payment'
        ? { path: '/app/payments', query: { pay: 'auto' } }
        : '/app/roommate',
    )
  }
}
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
      @select="onSelect"
    />

    <!-- Dialog ยืนยันการจอง -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent
        v-if="selectedRoom"
        :show-close-button="false"
        class="h-[63.4375rem] max-h-[calc(100dvh-0.5rem)] w-[calc(100vw-0.5rem)] max-w-[24.375rem] grid-rows-[14.5rem_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl border p-0 lg:h-[39.875rem] lg:max-h-[calc(100dvh-2rem)] lg:w-[calc(100vw-2rem)] lg:max-w-[64rem] lg:grid-cols-2 lg:grid-rows-1"
      >
        <DialogClose as-child>
          <Button
            type="button"
            size="icon"
            variant="outline"
            class="absolute right-4 top-4 z-30 size-10 rounded-full bg-card shadow-sm"
            aria-label="ปิดหน้าต่างจองห้อง"
          >
            <XIcon class="size-6" aria-hidden="true" />
          </Button>
        </DialogClose>

        <!-- Desktop: พื้นที่ภาพแบบ mosaic รอเชื่อมรูปจริง -->
        <div
          class="hidden min-h-0 grid-cols-2 grid-rows-[1.1fr_0.5fr_0.5fr] gap-4 border-r bg-card p-4 lg:grid"
          aria-label="ตัวอย่างพื้นที่แสดงภาพห้อง"
        >
          <div
            class="col-span-2 grid min-h-0 place-items-center rounded-2xl bg-muted/45 text-border"
            role="img"
            aria-label="ยังไม่มีภาพหลักของห้อง"
          >
            <ImageIcon class="size-28" :stroke-width="1.5" aria-hidden="true" />
          </div>
          <div
            class="row-span-2 grid min-h-0 place-items-center rounded-2xl bg-muted/45 text-border"
            role="img"
            aria-label="ยังไม่มีภาพเพิ่มเติมของห้อง ภาพที่ 1"
          >
            <ImageIcon class="size-24" :stroke-width="1.5" aria-hidden="true" />
          </div>
          <div
            class="grid min-h-0 place-items-center rounded-2xl bg-muted/45 text-border"
            role="img"
            aria-label="ยังไม่มีภาพเพิ่มเติมของห้อง ภาพที่ 2"
          >
            <ImageIcon class="size-14" :stroke-width="1.5" aria-hidden="true" />
          </div>
          <div
            class="grid min-h-0 place-items-center rounded-2xl bg-muted/45 text-border"
            role="img"
            aria-label="ยังไม่มีภาพเพิ่มเติมของห้อง ภาพที่ 3"
          >
            <ImageIcon class="size-14" :stroke-width="1.5" aria-hidden="true" />
          </div>
        </div>

        <!-- Mobile/tablet: ภาพหลักอยู่ด้านบน -->
        <div
          class="grid min-h-0 place-items-center bg-muted/45 text-border lg:hidden"
          role="img"
          aria-label="ยังไม่มีภาพหลักของห้อง"
        >
          <ImageIcon class="size-24" :stroke-width="1.5" aria-hidden="true" />
        </div>

        <div class="relative z-10 -mt-5 flex min-h-0 flex-col overflow-hidden rounded-t-3xl border-t bg-card lg:mt-0 lg:rounded-none lg:border-t-0">
          <DialogHeader class="shrink-0 gap-0.5 px-4 pb-3 pr-14 pt-4 lg:min-h-20 lg:justify-center lg:border-b lg:px-4 lg:py-3">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <DialogTitle>จองห้อง {{ selectedRoom.number }}</DialogTitle>
              <RoomStatusBadge
                v-if="selectedRoom.publicStatus !== 'available'"
                :status="selectedRoom.publicStatus"
              />
            </div>
            <DialogDescription>
              {{ roomConfigLabel[selectedRoom.config] }}
              <template v-if="selectedRoom.dimensions"> ขนาด {{ selectedRoom.dimensions }}</template>
              <template v-else> · ยังไม่มีข้อมูลขนาดห้องอย่างเป็นทางการ</template>
            </DialogDescription>
          </DialogHeader>

          <!-- Mobile/tablet: รูปย่อยเลื่อนได้ด้วย shadcn-vue Carousel -->
          <div class="shrink-0 border-b px-4 pb-4 lg:hidden">
            <Carousel
              class="w-full px-10"
              :opts="{ align: 'start', containScroll: 'trimSnaps' }"
              aria-label="ภาพเพิ่มเติมของห้อง"
            >
              <CarouselContent class="-ml-2">
                <CarouselItem
                  v-for="imageIndex in roomImagePlaceholders"
                  :key="imageIndex"
                  class="basis-1/3 pl-2"
                >
                  <div
                    class="grid aspect-square place-items-center rounded-lg bg-muted/45 text-border"
                    role="img"
                    :aria-label="`ยังไม่มีภาพเพิ่มเติมของห้อง ภาพที่ ${imageIndex}`"
                  >
                    <ImageIcon class="size-11" :stroke-width="1.5" aria-hidden="true" />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious
                class="left-0 size-6 bg-card"
                aria-label="ดูภาพก่อนหน้า"
              />
              <CarouselNext
                class="right-0 size-6 bg-card"
                aria-label="ดูภาพถัดไป"
              />
            </Carousel>
          </div>

          <div
            ref="detailsScrollArea"
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            @scroll="updateDetailsScrollState"
          >
            <div
              v-if="selectedRoom.publicStatus === 'temporarily_held' && selectedRoom.holdExpiresAt"
              class="border-b px-4 py-3"
            >
              <HoldCountdown
                :expires-at="selectedRoom.holdExpiresAt"
                label="ห้องนี้ถูกจองชั่วคราว เหลือ"
              />
            </div>

            <dl class="grid grid-cols-2 gap-x-6 gap-y-3 border-b px-4 py-4 text-sm lg:grid-cols-3">
              <div>
                <dt class="text-xs text-muted-foreground">หอพัก</dt>
                <dd class="mt-0.5 font-semibold">{{ selectedDormGroup?.shortName ?? selectedDormGroup?.name ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted-foreground">อาคาร</dt>
                <dd class="mt-0.5 font-semibold">{{ selectedBuilding?.name ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted-foreground">เลขห้อง</dt>
                <dd class="mt-0.5 font-semibold tabular-nums">{{ selectedRoom.number }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted-foreground">ชั้น</dt>
                <dd class="mt-0.5 font-semibold tabular-nums">{{ selectedRoom.floor }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted-foreground">ประเภทห้อง</dt>
                <dd class="mt-0.5 font-semibold">{{ roomConfigLabel[selectedRoom.config] }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted-foreground">รูปแบบการพัก</dt>
                <dd class="mt-0.5 font-semibold">
                  {{ occupancy ? occupancyModeLabel[occupancy] : 'ยังไม่ได้เลือก' }}
                </dd>
              </div>
            </dl>

            <!-- เลือกรูปแบบการพัก -->
            <section class="space-y-2 border-b px-4 py-3">
              <h3 id="occupancy-mode-label" class="text-sm font-semibold">รูปแบบการจอง</h3>
              <div class="grid grid-cols-2 gap-2" role="group" aria-labelledby="occupancy-mode-label">
                <Button
                  v-for="mode in selectedRoom.occupancyCapability"
                  :key="mode"
                  type="button"
                  :variant="occupancy === mode ? 'default' : 'outline'"
                  :disabled="!canChoose(mode)"
                  :aria-pressed="occupancy === mode"
                  class="h-14 min-w-0 flex-col items-start gap-0 px-3 py-1 text-left"
                  @click="occupancy = mode"
                >
                  <span class="truncate font-semibold">{{ occupancyModeLabel[mode] }}</span>
                  <span class="truncate text-xs font-normal opacity-80">
                    {{ mode === 'shared' ? 'แยกบิล แยกสัญญา' : 'จ่ายเต็มห้อง สัญญาเดียว' }}
                  </span>
                </Button>
              </div>
              <p
                v-if="!isLeaderOfAcceptedGroup && selectedRoom.occupancyCapability.includes('shared')"
                class="text-xs leading-relaxed text-muted-foreground"
              >
                พักคู่ได้เมื่อมีกลุ่มรูมเมทที่ตอบรับแล้ว และคุณเป็นหัวหน้ากลุ่ม จัดการได้ที่เมนู
                <RouterLink
                  to="/app/roommate"
                  class="font-medium text-foreground underline decoration-primary/70 underline-offset-2 hover:text-primary"
                  @click="dialogOpen = false"
                >
                  “รูมเมท”
                </RouterLink>
              </p>
              <p
                v-if="hasActiveGroup && selectedRoom.occupancyCapability.includes('whole_room')"
                class="text-xs leading-relaxed text-muted-foreground"
              >
                ต้องการเหมาห้อง? ต้องยกเลิกกลุ่มรูมเมทปัจจุบันก่อน
              </p>
            </section>

            <!-- ประมาณการค่าใช้จ่ายตามประเภทห้องและรูปแบบการพัก -->
            <section v-if="occupancy" class="space-y-3 px-4 py-3">
              <h3 class="text-sm font-semibold">ค่าใช้จ่าย</h3>
              <div class="space-y-2">
                <div
                  v-for="line in priceLines"
                  :key="line.action"
                  class="flex items-center justify-between gap-4 text-sm"
                >
                  <span>
                    {{ line.ref2 }}<template v-if="occupancy === 'whole_room'"> (เหมาห้อง)</template>
                  </span>
                  <span class="shrink-0 font-semibold tabular-nums">{{ formatBaht(line.amount) }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between border-t pt-2 font-semibold">
                <span>รวมทั้งหมด</span>
                <span class="text-xl text-primary tabular-nums">{{ formatBaht(totalPrice) }}</span>
              </div>

              <p
                v-if="campaign"
                class="flex items-start gap-2 rounded-[10px] border bg-muted px-2 py-2 text-xs leading-relaxed text-muted-foreground"
              >
                <TimerIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  <template v-if="occupancy === 'shared' && campaign.roommateRoomConfirmationRequired">
                    รูมเมทต้องยืนยันห้องภายใน {{ campaign.roomConfirmationMinutes }} นาที จากนั้นกลุ่มมีเวลาชำระเงิน {{ campaign.paymentHoldHours }} ชั่วโมง
                  </template>
                  <template v-else>
                    เมื่อกดจอง คุณมีเวลาชำระเงิน {{ campaign.paymentHoldHours }} ชั่วโมง
                  </template>
                </span>
              </p>
            </section>
          </div>

          <Button
            v-if="canScrollDetails && detailsAtTop"
            type="button"
            size="icon"
            variant="ghost"
            class="absolute bottom-[4.65rem] left-1/2 z-20 size-9 -translate-x-1/2 rounded-full bg-card/85 text-muted-foreground shadow-sm backdrop-blur hover:bg-card hover:text-foreground lg:hidden"
            aria-label="เลื่อนลงเพื่อดูรายละเอียดห้องและค่าใช้จ่ายเพิ่มเติม"
            @click="scrollRoomDetails"
          >
            <ChevronDownIcon class="size-6" :stroke-width="2.5" aria-hidden="true" />
          </Button>

          <DialogFooter
            class="m-0 grid shrink-0 grid-cols-2 gap-3 rounded-none border-t bg-card p-4 [&>button]:h-11 [&>button]:w-full [&>button]:text-base"
          >
            <Button variant="outline" @click="dialogOpen = false">ยกเลิก</Button>
            <Button
              :disabled="selectedRoom.publicStatus !== 'available' || !canReserve || !occupancy || !canChoose(occupancy)"
              @click="reserve"
            >
              <template v-if="selectedRoom.publicStatus !== 'available'">ห้องนี้ไม่ว่าง</template>
              <template v-else-if="!occupancy">ยังไม่มีรูปแบบการพักที่จองได้</template>
              <template v-else>จองห้องนี้</template>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
