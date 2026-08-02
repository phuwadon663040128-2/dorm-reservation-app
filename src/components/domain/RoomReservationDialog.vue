<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronDownIcon, ImageIcon, TimerIcon, XIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import RoomStatusBadge from '@/components/domain/RoomStatusBadge.vue'
import { priceLinesFor } from '@/fixtures/pricing'
import { formatBaht, occupancyModeLabel, roomConfigLabel } from '@/lib/labels'
import { useDormStore } from '@/stores/dorm'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'
import type { OccupancyMode, Room } from '@/types'

type DialogActionMode = 'login' | 'continue' | 'development'

const props = withDefaults(defineProps<{
  open: boolean
  room: Room | null
  actionMode?: DialogActionMode
  contentTestId?: string
}>(), {
  actionMode: 'development',
  contentTestId: 'room-reservation-dialog',
})

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'action', payload: { room: Room; occupancy: OccupancyMode | null }): void
}>()

const dorm = useDormStore()
const reservation = useReservationStore()
const session = useSessionStore()

const openModel = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const occupancy = ref<OccupancyMode | null>(null)
const selectedBuilding = computed(() =>
  dorm.buildings.find(building => building.id === props.room?.buildingId),
)
const selectedDormGroup = computed(() =>
  dorm.dormGroups.find(group => group.id === selectedBuilding.value?.dormGroupId),
)
const isLeaderOfAcceptedGroup = computed(
  () =>
    reservation.myRoommateGroup?.status === 'accepted'
    && reservation.myRoommateGroup.leaderId === session.currentUser?.id,
)
const hasActiveGroup = computed(() => !!reservation.myRoommateGroup)

function canChoose(mode: OccupancyMode) {
  if (!props.room?.occupancyCapability.includes(mode)) return false
  if (mode === 'shared') return isLeaderOfAcceptedGroup.value
  return !hasActiveGroup.value
}

function resetOccupancy(room: Room | null) {
  occupancy.value = room?.occupancyCapability.find(mode => canChoose(mode)) ?? null
}

watch(() => props.room, resetOccupancy, { immediate: true })
watch([isLeaderOfAcceptedGroup, hasActiveGroup], () => resetOccupancy(props.room))

const priceLines = computed(() =>
  props.room && selectedBuilding.value && occupancy.value
    ? priceLinesFor(selectedBuilding.value.dormGroupId, props.room.config, occupancy.value)
    : [],
)
const totalPrice = computed(() => priceLines.value.reduce((sum, line) => sum + line.amount, 0))
const campaign = computed(() => dorm.openCampaigns[0])
const roomImagePlaceholders = [1, 2, 3, 4, 5]

const actionLabel = computed(() => {
  if (props.room?.publicStatus !== 'available') return 'ห้องนี้ไม่ว่าง'
  if (props.actionMode === 'login') return 'เข้าสู่ระบบเพื่อจอง'
  if (props.actionMode === 'continue') return 'ไปจองห้องนี้'
  return 'จองห้องนี้'
})
const actionDisabled = computed(() =>
  props.room?.publicStatus !== 'available'
  || props.actionMode === 'development'
  || (props.actionMode !== 'login' && !occupancy.value),
)

function requestAction() {
  if (!props.room || actionDisabled.value) return
  emit('action', { room: props.room, occupancy: occupancy.value })
}

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
  detailsScrollArea.value?.scrollBy({
    top: Math.max(160, (detailsScrollArea.value?.clientHeight ?? 0) * 0.55),
    behavior: 'smooth',
  })
}

watch(detailsScrollArea, (element) => {
  detailsResizeObserver?.disconnect()
  if (!element || typeof ResizeObserver === 'undefined') {
    updateDetailsScrollState()
    return
  }
  detailsResizeObserver = new ResizeObserver(updateDetailsScrollState)
  detailsResizeObserver.observe(element)
  void nextTick(updateDetailsScrollState)
})

watch([openModel, occupancy, () => props.room], () => void nextTick(updateDetailsScrollState))
onBeforeUnmount(() => detailsResizeObserver?.disconnect())
</script>

<template>
  <Dialog v-model:open="openModel">
    <DialogContent
      v-if="room"
      :data-testid="contentTestId"
      data-room-dialog-layout="shared-reservation"
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

      <div
        data-testid="room-reservation-gallery"
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

      <div
        class="grid min-h-0 place-items-center bg-muted/45 text-border lg:hidden"
        role="img"
        aria-label="ยังไม่มีภาพหลักของห้อง"
      >
        <ImageIcon class="size-24" :stroke-width="1.5" aria-hidden="true" />
      </div>

      <div
        data-testid="room-reservation-details"
        class="relative z-10 -mt-5 flex min-h-0 flex-col overflow-hidden rounded-t-3xl border-t bg-card lg:mt-0 lg:rounded-none lg:border-t-0"
      >
        <DialogHeader class="shrink-0 gap-0.5 px-4 pb-3 pr-14 pt-4 lg:min-h-20 lg:justify-center lg:border-b lg:px-4 lg:py-3">
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <DialogTitle>จองห้อง {{ room.number }}</DialogTitle>
            <RoomStatusBadge v-if="room.publicStatus !== 'available'" :status="room.publicStatus" />
          </div>
          <DialogDescription>
            {{ roomConfigLabel[room.config] }}
            <template v-if="room.dimensions"> ขนาด {{ room.dimensions }}</template>
            <template v-else> · ยังไม่มีข้อมูลขนาดห้องอย่างเป็นทางการ</template>
          </DialogDescription>
        </DialogHeader>

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
            <CarouselPrevious class="left-0 size-6 bg-card" aria-label="ดูภาพก่อนหน้า" />
            <CarouselNext class="right-0 size-6 bg-card" aria-label="ดูภาพถัดไป" />
          </Carousel>
        </div>

        <div
          ref="detailsScrollArea"
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          @scroll="updateDetailsScrollState"
        >
          <div
            v-if="room.publicStatus === 'temporarily_held' && room.holdExpiresAt"
            class="border-b px-4 py-3"
          >
            <HoldCountdown :expires-at="room.holdExpiresAt" label="ห้องนี้ถูกจองชั่วคราว เหลือ" />
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
              <dd class="mt-0.5 font-semibold tabular-nums">{{ room.number }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">ชั้น</dt>
              <dd class="mt-0.5 font-semibold tabular-nums">{{ room.floor }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">ประเภทห้อง</dt>
              <dd class="mt-0.5 font-semibold">{{ roomConfigLabel[room.config] }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">รูปแบบการพัก</dt>
              <dd class="mt-0.5 font-semibold">
                {{ occupancy ? occupancyModeLabel[occupancy] : 'ยังไม่ได้เลือก' }}
              </dd>
            </div>
          </dl>

          <section class="space-y-2 border-b px-4 py-3">
            <h3 id="occupancy-mode-label" class="text-sm font-semibold">รูปแบบการจอง</h3>
            <div class="grid grid-cols-2 gap-2" role="group" aria-labelledby="occupancy-mode-label">
              <Button
                v-for="mode in room.occupancyCapability"
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
              v-if="!isLeaderOfAcceptedGroup && room.occupancyCapability.includes('shared')"
              class="text-xs leading-relaxed text-muted-foreground"
            >
              พักคู่ได้เมื่อมีกลุ่มรูมเมทที่ตอบรับแล้ว และคุณเป็นหัวหน้ากลุ่ม — ฟังก์ชัน “รูมเมท” กำลังพัฒนา
            </p>
            <p
              v-if="hasActiveGroup && room.occupancyCapability.includes('whole_room')"
              class="text-xs leading-relaxed text-muted-foreground"
            >
              ต้องการเหมาห้อง? ต้องยกเลิกกลุ่มรูมเมทปัจจุบันก่อน
            </p>
          </section>

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

        <DialogFooter class="m-0 grid shrink-0 grid-cols-2 gap-3 rounded-none border-t bg-card p-4">
          <Button class="h-11 w-full text-base" variant="outline" @click="openModel = false">ยกเลิก</Button>

          <TooltipProvider v-if="actionMode === 'development'" :delay-duration="180">
            <Tooltip>
              <TooltipTrigger as-child>
                <span
                  tabindex="0"
                  role="button"
                  aria-disabled="true"
                  :aria-label="`${actionLabel} — กำลังพัฒนา`"
                  title="กำลังพัฒนา"
                  class="w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="reservation-development-trigger"
                >
                  <Button
                    disabled
                    class="pointer-events-none h-11 w-full text-base opacity-50"
                    data-testid="reservation-submit"
                  >
                    {{ actionLabel }}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">กำลังพัฒนา</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            v-else
            class="h-11 w-full text-base"
            :disabled="actionDisabled"
            data-testid="public-room-reserve"
            @click="requestAction"
          >
            {{ actionLabel }}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
