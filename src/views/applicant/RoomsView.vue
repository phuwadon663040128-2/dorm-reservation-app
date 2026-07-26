<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { AlertTriangleIcon, FileCheck2Icon, InfoIcon, TimerIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import RoomBrowser from '@/components/domain/RoomBrowser.vue'
import RoomStatusBadge from '@/components/domain/RoomStatusBadge.vue'
import { formatBaht, occupancyModeLabel, roomConfigLabel } from '@/lib/labels'
import { priceLinesFor, users } from '@/fixtures'
import { useApplicationStore } from '@/stores/application'
import { useDormStore } from '@/stores/dorm'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'
import type { OccupancyMode, Room } from '@/types'

const session = useSessionStore()
const application = useApplicationStore()
const reservation = useReservationStore()
const dorm = useDormStore()
const router = useRouter()

const hasSubmittedApplication = computed(() => {
  const userId = session.currentUser?.id
  return Boolean(userId && application.hasSubmittedApplication(userId))
})

const canReserve = computed(
  () => session.currentUser?.profileComplete === true
    && hasSubmittedApplication.value
    && !reservation.myReservation,
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
const missingSharedApplicationMembers = computed(() =>
  (reservation.myRoommateGroup?.memberIds ?? [])
    .filter(userId => !application.hasSubmittedApplication(userId))
    .map(userId => users.find(user => user.id === userId)?.displayName ?? userId),
)

function canChoose(mode: OccupancyMode) {
  if (!selectedRoom.value?.occupancyCapability.includes(mode)) return false
  if (mode === 'shared') {
    return isLeaderOfAcceptedGroup.value && missingSharedApplicationMembers.value.length === 0
  }
  return !hasActiveGroup.value
}

function onSelect(room: Room) {
  selectedRoom.value = room
  occupancy.value = room.occupancyCapability.find(mode => canChoose(mode)) ?? null
  dialogOpen.value = true
}

const priceLines = computed(() =>
  selectedRoom.value && occupancy.value
    ? priceLinesFor(selectedRoom.value.config, occupancy.value)
    : [],
)
const totalPerResident = computed(() => priceLines.value.reduce((s, l) => s + l.amount, 0))

const campaign = computed(() => dorm.openCampaigns[0])

function reserve() {
  if (!selectedRoom.value || !occupancy.value) return
  const result = reservation.reserveRoom(selectedRoom.value.number, occupancy.value)
  toast(result.message)
  if (result.ok) {
    dialogOpen.value = false
    router.push('/app')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">เลือกห้องพัก</h1>
      <p class="text-sm text-muted-foreground">
        เลือกจากอาคาร → ชั้น → ห้องจริง เมื่อกดจอง ห้องจะถูกล็อกให้ทันทีระหว่างรอยืนยันและชำระเงิน
      </p>
    </div>

    <Alert v-if="reservation.myReservation">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>คุณมีการจองอยู่แล้ว</AlertTitle>
      <AlertDescription>
        ห้อง {{ reservation.myReservation.roomNumber }} — ดูสถานะได้ที่เมนู “การจองของฉัน”
        (1 คนมีได้ 1 การจอง/กลุ่มที่ใช้งานอยู่เท่านั้น)
      </AlertDescription>
    </Alert>
    <Alert v-else-if="!hasSubmittedApplication" variant="destructive">
      <FileCheck2Icon aria-hidden="true" />
      <AlertTitle>ยังไม่มีใบสมัครที่ส่งแล้ว</AlertTitle>
      <AlertDescription>
        คุณยังดูผังและรายละเอียดห้องได้ตามปกติ แต่ต้องส่งใบสมัครก่อนจึงจะยืนยันจองห้องได้
        เมื่อยืนยันห้องครบ ระบบจะเติมข้อมูลห้องในใบสมัครให้อัตโนมัติ
      </AlertDescription>
    </Alert>
    <Alert v-else-if="!session.currentUser?.profileComplete" variant="destructive">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>ข้อมูลผู้สมัครยังไม่ครบ</AlertTitle>
      <AlertDescription>กลับไปแก้ใบสมัครและส่งใหม่ก่อนยืนยันจองห้อง</AlertDescription>
    </Alert>

    <RoomBrowser @select="onSelect" />

    <!-- Dialog ยืนยันการจอง -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent
        v-if="selectedRoom"
        class="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg"
      >
        <DialogHeader class="shrink-0 px-4 pb-3 pr-12 pt-4">
          <div class="flex items-center justify-between gap-2">
            <DialogTitle>จองห้อง {{ selectedRoom.number }}</DialogTitle>
            <RoomStatusBadge :status="selectedRoom.publicStatus" />
          </div>
          <DialogDescription>
            {{ roomConfigLabel[selectedRoom.config] }}
            <template v-if="selectedRoom.dimensions"> · ขนาด {{ selectedRoom.dimensions }}</template>
          </DialogDescription>
        </DialogHeader>

        <div class="min-h-0 space-y-3 overflow-y-auto overscroll-contain border-y px-4 py-3">
          <Alert v-if="!hasSubmittedApplication" variant="destructive">
            <FileCheck2Icon aria-hidden="true" />
            <AlertTitle>ยังจองห้องนี้ไม่ได้</AlertTitle>
            <AlertDescription>
              กรุณากรอกและส่งใบสมัครก่อน ระบบจึงจะเปิดให้ยืนยันจองห้องนี้
            </AlertDescription>
          </Alert>
          <Alert
            v-if="isLeaderOfAcceptedGroup && selectedRoom.occupancyCapability.includes('shared') && missingSharedApplicationMembers.length"
            variant="destructive"
          >
            <AlertTriangleIcon aria-hidden="true" />
            <AlertTitle>สมาชิกในกลุ่มยังส่งใบสมัครไม่ครบ</AlertTitle>
            <AlertDescription>
              {{ missingSharedApplicationMembers.join(', ') }} ต้องส่งใบสมัครก่อน หัวหน้ากลุ่มจึงจะยืนยันห้องแบบพักคู่ได้
            </AlertDescription>
          </Alert>
          <HoldCountdown
            v-if="selectedRoom.publicStatus === 'temporarily_held' && selectedRoom.holdExpiresAt"
            :expires-at="selectedRoom.holdExpiresAt"
            label="ห้องนี้ถูกจองชั่วคราว เหลือ"
          />
          <dl class="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-lg border p-3 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-xs text-muted-foreground">หอพัก</dt>
              <dd class="font-medium">{{ selectedDormGroup?.name ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">อาคาร</dt>
              <dd class="font-medium">{{ selectedBuilding?.name ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">ชั้น</dt>
              <dd class="font-medium tabular-nums">{{ selectedRoom.floor }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">ประเภทห้อง</dt>
              <dd class="font-medium">{{ roomConfigLabel[selectedRoom.config] }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">เลขห้อง</dt>
              <dd class="font-medium tabular-nums">{{ selectedRoom.number }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">รูปแบบการพัก</dt>
              <dd class="font-medium">
                {{ occupancy ? occupancyModeLabel[occupancy] : 'ยังไม่มีรูปแบบที่จองได้' }}
              </dd>
            </div>
          </dl>
          <p v-if="occupancy" class="rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <template v-if="occupancy === 'shared'">
              ระบบจะเติมข้อมูลห้องนี้ในใบสมัครของสมาชิกทั้งสองคนเมื่อรูมเมทยืนยันห้องครบ
            </template>
            <template v-else>
              ระบบจะเติมข้อมูลห้องนี้ในใบสมัครทันทีเมื่อยืนยันจองและเข้าสู่ช่วงรอชำระเงิน
            </template>
          </p>
          <!-- เลือกรูปแบบการพัก -->
          <div class="space-y-2">
            <p id="occupancy-mode-label" class="text-sm font-semibold">รูปแบบการพัก</p>
            <div class="grid gap-2 sm:grid-cols-2" role="group" aria-labelledby="occupancy-mode-label">
              <Button
                v-for="mode in selectedRoom.occupancyCapability"
                :key="mode"
                type="button"
                :variant="occupancy === mode ? 'default' : 'outline'"
                :disabled="!canChoose(mode)"
                :aria-pressed="occupancy === mode"
                class="h-auto flex-col items-start gap-0.5 py-2.5"
                @click="occupancy = mode"
              >
                <span class="font-semibold">{{ occupancyModeLabel[mode] }}</span>
                <span class="text-xs font-normal opacity-80">
                  {{ mode === 'shared' ? 'แยกบิล แยกสัญญา คนละฉบับ' : 'จ่ายเต็มห้อง บล็อกเตียงที่สอง สัญญาเดียว' }}
                </span>
              </Button>
            </div>
            <p v-if="!isLeaderOfAcceptedGroup && selectedRoom.occupancyCapability.includes('shared')" class="text-xs text-muted-foreground">
              พักคู่ได้เมื่อมีกลุ่มรูมเมทที่ตอบรับแล้ว และคุณเป็นหัวหน้ากลุ่ม — จัดการได้ที่เมนู “รูมเมท”
            </p>
            <p
              v-if="isLeaderOfAcceptedGroup && missingSharedApplicationMembers.length && selectedRoom.occupancyCapability.includes('shared')"
              class="text-xs text-destructive"
            >
              ยังเลือกพักคู่ไม่ได้ — รอ {{ missingSharedApplicationMembers.join(', ') }} ส่งใบสมัครให้เรียบร้อยก่อน
            </p>
            <p v-if="hasActiveGroup && selectedRoom.occupancyCapability.includes('whole_room')" class="text-xs text-muted-foreground">
              ต้องการเหมาห้อง? ต้องยกเลิกกลุ่มรูมเมทปัจจุบันก่อน
            </p>
          </div>

          <!-- ประมาณการค่าใช้จ่าย (แยก ROOM/HL เสมอ) -->
          <div v-if="occupancy" class="space-y-1.5 rounded-lg border p-3">
            <p class="text-sm font-semibold">ประมาณการค่าใช้จ่ายต่อคน (ปีการศึกษา 2569)</p>
            <div v-for="line in priceLines" :key="line.action" class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{{ line.ref2 }} — {{ line.title }}</span>
              <span class="tabular-nums">{{ formatBaht(line.amount) }}</span>
            </div>
            <div class="flex items-center justify-between border-t pt-1.5 text-sm font-semibold">
              <span>รวมต่อคน</span>
              <span class="tabular-nums">{{ formatBaht(totalPerResident) }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              ยอดจริงยืนยันอีกครั้งในแบบฟอร์มชำระเงินของธนาคาร (ราคา Provisional)
            </p>
          </div>

          <!-- กติกา hold -->
          <p v-if="campaign && occupancy" class="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <TimerIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              เมื่อกดจอง ห้องถูกล็อกให้ทันที
              <template v-if="occupancy === 'shared' && campaign.roommateRoomConfirmationRequired">
                — รูมเมทต้องยืนยันห้องภายใน {{ campaign.roomConfirmationMinutes }} นาที มิฉะนั้นห้องถูกปล่อยคืน
              </template>
              จากนั้นกลุ่มมีเวลาชำระเงิน {{ campaign.paymentHoldHours }} ชั่วโมง (deadline เดียวร่วมกัน)
            </span>
          </p>
        </div>

        <DialogFooter
          class="mx-0 mb-0 grid shrink-0 grid-cols-2 rounded-none bg-popover p-3 [&>button]:w-full sm:flex sm:[&>button]:w-auto"
        >
          <Button variant="outline" @click="dialogOpen = false">ยกเลิก</Button>
          <Button
            :disabled="selectedRoom.publicStatus !== 'available' || !canReserve || !occupancy || !canChoose(occupancy)"
            @click="reserve"
          >
            <template v-if="selectedRoom.publicStatus !== 'available'">ห้องนี้ไม่ว่าง</template>
            <template v-else-if="!hasSubmittedApplication">ส่งใบสมัครก่อนจองห้อง</template>
            <template v-else-if="!occupancy">ยังไม่มีรูปแบบการพักที่จองได้</template>
            <template v-else>จองห้องนี้ — ล็อกทันที</template>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
