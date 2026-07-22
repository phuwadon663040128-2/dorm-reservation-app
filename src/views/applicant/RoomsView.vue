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
import { priceLinesFor } from '@/fixtures'
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

const canReserve = computed(
  () => session.currentUser?.profileComplete === true
    && !!application.submittedDraft
    && !reservation.myReservation,
)

// dialog เลือกรูปแบบการพัก + ยืนยันจอง
const selectedRoom = ref<Room | null>(null)
const occupancy = ref<OccupancyMode>('shared')
const dialogOpen = ref(false)
const selectedBuilding = computed(() => dorm.buildings.find(building => building.id === selectedRoom.value?.buildingId))
const selectedDormGroup = computed(() => dorm.dormGroups.find(group => group.id === selectedBuilding.value?.dormGroupId))
const submittedDormGroup = computed(() => dorm.dormGroups.find(group => group.id === application.submittedDraft?.dormGroupId))
const submittedRoomTypeLabel = computed(() => {
  const config = application.submittedDraft?.roomType
  return config ? roomConfigLabel[config as keyof typeof roomConfigLabel] ?? config : '—'
})
const roomSelectionIssue = computed<'missing_application' | 'mismatch' | null>(() => {
  const room = selectedRoom.value
  const dormGroupId = selectedBuilding.value?.dormGroupId
  const userId = session.currentUser?.id
  if (!application.submittedDraft || !application.submittedReference) return 'missing_application'
  if (!room || !dormGroupId || !userId) return 'mismatch'
  return application.submittedRoomMatches(room, dormGroupId, userId) ? null : 'mismatch'
})

const isLeaderOfAcceptedGroup = computed(
  () =>
    reservation.myRoommateGroup?.status === 'accepted'
    && reservation.myRoommateGroup.leaderId === session.currentUser?.id,
)
const hasActiveGroup = computed(() => !!reservation.myRoommateGroup)

function canChoose(mode: OccupancyMode) {
  if (!selectedRoom.value?.occupancyCapability.includes(mode)) return false
  if (mode === 'shared') return isLeaderOfAcceptedGroup.value
  return !hasActiveGroup.value
}

function onSelect(room: Room) {
  selectedRoom.value = room
  // ตั้งค่าเริ่มต้นเป็นโหมดที่เลือกได้จริง
  occupancy.value = room.occupancyCapability.includes('shared') && isLeaderOfAcceptedGroup.value
    ? 'shared'
    : 'whole_room'
  dialogOpen.value = true
}

const priceLines = computed(() =>
  selectedRoom.value ? priceLinesFor(selectedRoom.value.config, occupancy.value) : [],
)
const totalPerResident = computed(() => priceLines.value.reduce((s, l) => s + l.amount, 0))

const campaign = computed(() => dorm.openCampaigns[0])

function reserve() {
  if (!selectedRoom.value) return
  const result = reservation.reserveRoom(selectedRoom.value.number, occupancy.value)
  toast(result.message)
  if (result.ok) {
    dialogOpen.value = false
    router.push('/app/reservation')
  }
}

function useRoomInApplication() {
  const room = selectedRoom.value
  const dormGroupId = selectedBuilding.value?.dormGroupId
  if (!room || !dormGroupId) return
  application.hydrateIdentity(session.currentUser)
  application.reviseForRoom(room, dormGroupId)
  dialogOpen.value = false
  toast.info(`ผูกห้อง ${room.number} กับร่างใบสมัครแล้ว กรุณาตรวจสอบและส่งใบสมัคร`)
  router.push('/app/application')
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
    <Alert v-else-if="!application.submittedReference" variant="destructive">
      <FileCheck2Icon aria-hidden="true" />
      <AlertTitle>ยังไม่มีใบสมัครที่ส่งแล้ว</AlertTitle>
      <AlertDescription>
        คุณยังดูห้องได้ตามปกติ เมื่อเลือกห้อง ระบบจะนำหอพัก ประเภทห้อง และเลขห้องไปเติมในใบสมัครให้โดยอัตโนมัติ
      </AlertDescription>
    </Alert>
    <Alert v-else-if="!session.currentUser?.profileComplete" variant="destructive">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>ข้อมูลผู้สมัครยังไม่ครบ</AlertTitle>
      <AlertDescription>กลับไปแก้ใบสมัครและส่งใหม่ก่อนยืนยันจองห้อง</AlertDescription>
    </Alert>

    <RoomBrowser
      :initial-dorm-group-id="application.submittedDraft?.dormGroupId || application.draft.dormGroupId"
      :initial-config="application.submittedDraft?.roomType || application.draft.roomType"
      @select="onSelect"
    />

    <!-- Dialog ยืนยันการจอง -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent v-if="selectedRoom" class="sm:max-w-lg">
        <DialogHeader>
          <div class="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>จองห้อง {{ selectedRoom.number }}</DialogTitle>
            <RoomStatusBadge :status="selectedRoom.publicStatus" />
          </div>
          <DialogDescription>
            {{ roomConfigLabel[selectedRoom.config] }}
            <template v-if="selectedRoom.dimensions"> · ขนาด {{ selectedRoom.dimensions }}</template>
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <Alert v-if="roomSelectionIssue === 'missing_application'" variant="destructive">
            <FileCheck2Icon aria-hidden="true" />
            <AlertTitle>ยังจองห้องนี้ไม่ได้</AlertTitle>
            <AlertDescription>
              ระบบจะผูกห้อง {{ selectedRoom.number }}, {{ selectedDormGroup?.shortName }} และ {{ roomConfigLabel[selectedRoom.config] }} ลงในร่างใบสมัครก่อน เพื่อป้องกันข้อมูลคนละหอ
            </AlertDescription>
          </Alert>
          <Alert v-else-if="roomSelectionIssue === 'mismatch'" variant="destructive">
            <AlertTriangleIcon aria-hidden="true" />
            <AlertTitle>ห้องที่เลือกไม่ตรงกับใบสมัคร</AlertTitle>
            <AlertDescription>
              ใบสมัครปัจจุบัน: {{ submittedDormGroup?.shortName }} · {{ submittedRoomTypeLabel }}
              <template v-if="application.submittedDraft?.preferredRoomNumber">
                · ห้อง {{ application.submittedDraft.preferredRoomNumber }}
              </template>
              แต่คุณกำลังเลือก {{ selectedDormGroup?.shortName }} · {{ roomConfigLabel[selectedRoom.config] }} · ห้อง {{ selectedRoom.number }}
              ระบบจะไม่อนุญาตให้จองจนกว่าจะแก้และส่งใบสมัครใหม่
            </AlertDescription>
          </Alert>
          <HoldCountdown
            v-if="selectedRoom.publicStatus === 'temporarily_held' && selectedRoom.holdExpiresAt"
            :expires-at="selectedRoom.holdExpiresAt"
            label="ห้องนี้ถูกจองชั่วคราว เหลือ"
          />
          <!-- เลือกรูปแบบการพัก -->
          <div class="space-y-2">
            <p class="text-sm font-semibold">รูปแบบการพัก</p>
            <div class="grid gap-2 sm:grid-cols-2">
              <Button
                v-for="mode in selectedRoom.occupancyCapability"
                :key="mode"
                type="button"
                :variant="occupancy === mode ? 'default' : 'outline'"
                :disabled="!canChoose(mode)"
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
            <p v-if="hasActiveGroup && selectedRoom.occupancyCapability.includes('whole_room')" class="text-xs text-muted-foreground">
              ต้องการเหมาห้อง? ต้องยกเลิกกลุ่มรูมเมทปัจจุบันก่อน
            </p>
          </div>

          <!-- ประมาณการค่าใช้จ่าย (แยก ROOM/HL เสมอ) -->
          <div class="space-y-1.5 rounded-lg border p-3">
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
          <p v-if="campaign" class="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
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

        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">ยกเลิก</Button>
          <Button
            v-if="roomSelectionIssue"
            @click="useRoomInApplication"
          >
            <FileCheck2Icon aria-hidden="true" />
            {{ roomSelectionIssue === 'missing_application' ? 'ใช้ห้องนี้ในใบสมัคร' : 'แก้ใบสมัครให้ตรงกับห้องนี้' }}
          </Button>
          <Button
            v-else
            :disabled="selectedRoom.publicStatus !== 'available' || !canReserve || !canChoose(occupancy)"
            @click="reserve"
          >
            {{ selectedRoom.publicStatus === 'available' ? 'จองห้องนี้ — ล็อกทันที' : 'ห้องนี้ไม่ว่าง' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
