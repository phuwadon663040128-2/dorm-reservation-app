<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { MailPlusIcon, UsersIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import { invitationStatusLabel, roommateGroupStatusLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import { useApplicationStore } from '@/stores/application'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const application = useApplicationStore()
const reservation = useReservationStore()
const router = useRouter()

const myGroup = computed(() => reservation.myRoommateGroup)
const myInvitations = computed(() => reservation.myInvitations)
const receivedPending = computed(() => reservation.myReceivedPendingInvitations)
const missingApplicationMembers = computed(() =>
  (myGroup.value?.memberIds ?? [])
    .filter(userId => !application.hasSubmittedApplication(userId))
    .map(userId => users.find(user => user.id === userId)?.displayName ?? userId),
)
const allGroupApplicationsSubmitted = computed(() => missingApplicationMembers.value.length === 0)

// การจองที่รอรูมเมทยืนยันห้อง (15 นาที)
const pendingRoomConfirmation = computed(() => {
  const resv = reservation.myReservation
  return resv?.holdStatus === 'held_roommate_confirmation' ? resv : undefined
})
const iAmInvitee = computed(
  () => pendingRoomConfirmation.value && pendingRoomConfirmation.value.leaderId !== session.currentUser?.id,
)

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

// ---- dialog ส่งคำเชิญ ----
const inviteDialogOpen = ref(false)
const inviteeId = ref('')

const invitableUsers = computed(() =>
  users.filter(
    u => u.role === 'applicant' && u.id !== session.currentUser?.id && u.profileComplete,
  ),
)

function sendInvitation() {
  if (!inviteeId.value) return
  const result = reservation.sendInvitation(inviteeId.value)
  toast(result.message)
  if (result.ok) {
    inviteDialogOpen.value = false
    inviteeId.value = ''
  }
}

function accept(invId: string) {
  toast(reservation.acceptInvitation(invId).message)
}
function decline(invId: string) {
  toast(reservation.declineInvitation(invId).message)
}
function confirmRoom() {
  if (!pendingRoomConfirmation.value) return
  const result = reservation.confirmRoomSelection(pendingRoomConfirmation.value.id)
  toast(result.message)
  if (result.ok) router.push('/app')
}
function declineRoom() {
  if (!pendingRoomConfirmation.value) return
  toast(reservation.declineRoomSelection(pendingRoomConfirmation.value.id).message)
}
function onConfirmationExpired() {
  if (!pendingRoomConfirmation.value) return
  const result = reservation.expireHold(pendingRoomConfirmation.value.id)
  if (result.ok) toast(result.message)
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">รูมเมท</h1>
      <p class="text-sm text-muted-foreground">
        กติกา: สมาชิกทั้งคู่ต้องส่งใบสมัครก่อนยืนยันห้องพักคู่ · กลุ่มละไม่เกิน 2 คน · 1 คนมีได้ 1 คำเชิญ/กลุ่มที่ใช้งานอยู่ ·
        ต้องตอบรับคำเชิญก่อนเลือกห้อง
      </p>
    </div>

    <!-- คำเชิญที่ได้รับ (รอตอบ) -->
    <Card v-for="inv in receivedPending" :key="inv.id" class="border-primary/50">
      <CardContent class="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p class="font-medium">{{ nameOf(inv.leaderId) }} เชิญคุณเป็นรูมเมท</p>
          <p class="text-xs text-muted-foreground">คำเชิญมีอายุ 48 ชั่วโมงนับจากเวลาที่ส่ง</p>
        </div>
        <div class="flex gap-2">
          <Button size="sm" @click="accept(inv.id)">ตอบรับ</Button>
          <Button size="sm" variant="outline" @click="decline(inv.id)">ปฏิเสธ</Button>
        </div>
      </CardContent>
    </Card>

    <!-- สถานะกลุ่มปัจจุบัน -->
    <Card v-if="myGroup">
      <CardHeader>
        <div class="flex items-center justify-between gap-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <UsersIcon class="size-4" aria-hidden="true" /> กลุ่มของฉัน
          </CardTitle>
          <Badge>{{ roommateGroupStatusLabel[myGroup.status] }}</Badge>
        </div>
        <CardDescription>
          หัวหน้ากลุ่ม (ผู้กดจองห้อง): {{ nameOf(myGroup.leaderId) }}
          <template v-if="myGroup.leaderId === session.currentUser?.id"> — คือคุณ</template>
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <ul class="space-y-1 text-sm">
          <li v-for="m in myGroup.memberIds" :key="m" class="flex flex-wrap items-center gap-2">
            <span class="font-medium">{{ nameOf(m) }}</span>
            <Badge v-if="m === myGroup.leaderId" variant="outline">หัวหน้ากลุ่ม</Badge>
            <Badge :variant="application.hasSubmittedApplication(m) ? 'secondary' : 'outline'">
              {{ application.hasSubmittedApplication(m) ? 'ส่งใบสมัครแล้ว' : 'ยังไม่ส่งใบสมัคร' }}
            </Badge>
          </li>
        </ul>

        <!-- กลุ่มพร้อมเลือกห้อง -->
        <div v-if="myGroup.status === 'accepted' && myGroup.leaderId === session.currentUser?.id" class="flex gap-2">
          <Button v-if="allGroupApplicationsSubmitted" as-child>
            <RouterLink to="/app/rooms">ไปเลือกห้อง (คุณเป็นหัวหน้ากลุ่ม)</RouterLink>
          </Button>
          <Button v-else disabled>รอสมาชิกส่งใบสมัคร</Button>
        </div>
        <p
          v-if="myGroup.status === 'accepted' && !allGroupApplicationsSubmitted"
          class="text-sm text-destructive"
        >
          ยังเลือกห้องพักคู่ไม่ได้ — รอ {{ missingApplicationMembers.join(', ') }} ส่งใบสมัครให้เรียบร้อยก่อน
        </p>
        <p v-else-if="myGroup.status === 'accepted' && myGroup.leaderId !== session.currentUser?.id" class="text-sm text-muted-foreground">
          รอ {{ nameOf(myGroup.leaderId) }} (หัวหน้ากลุ่ม) เลือกห้อง — คุณจะได้รับแจ้งให้ยืนยันห้องภายใน 15 นาที
        </p>

        <!-- รอยืนยันห้อง 15 นาที -->
        <template v-if="pendingRoomConfirmation">
          <HoldCountdown
            :expires-at="pendingRoomConfirmation.confirmationDeadline"
            label="ยืนยันห้องภายใน"
            @expired="onConfirmationExpired"
          />
          <template v-if="iAmInvitee">
            <div class="flex flex-wrap gap-2">
              <Button :disabled="!allGroupApplicationsSubmitted" @click="confirmRoom">
                ยืนยันห้อง {{ pendingRoomConfirmation.roomNumber }}
              </Button>
              <Button variant="outline" @click="declineRoom">ปฏิเสธ (ปล่อยห้องทันที)</Button>
            </div>
            <p v-if="!allGroupApplicationsSubmitted" class="text-sm text-destructive">
              ยังยืนยันห้องไม่ได้ — รอ {{ missingApplicationMembers.join(', ') }} ส่งใบสมัครให้เรียบร้อยก่อน
            </p>
          </template>
          <p v-else class="text-sm text-muted-foreground">
            รอรูมเมทยืนยันห้อง {{ pendingRoomConfirmation.roomNumber }} — หากหมดเวลา ห้องจะถูกปล่อยคืนอัตโนมัติ
          </p>
        </template>
      </CardContent>
    </Card>

    <!-- ยังไม่มีกลุ่ม -->
    <Card v-else>
      <CardContent class="space-y-3 p-6 text-center">
        <p class="font-medium">ยังไม่มีกลุ่มรูมเมท</p>
        <p class="text-sm text-muted-foreground">
          ส่งคำเชิญถึงเพื่อนเพื่อพักคู่ หรือข้ามขั้นตอนนี้หากต้องการเหมาห้องพักคนเดียว
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <Button :disabled="!session.currentUser?.profileComplete" @click="inviteDialogOpen = true">
            <MailPlusIcon aria-hidden="true" /> ส่งคำเชิญรูมเมท
          </Button>
          <Button as-child variant="outline">
            <RouterLink to="/app/rooms">เหมาห้อง — ไปเลือกห้องเลย</RouterLink>
          </Button>
        </div>
        <p v-if="!session.currentUser?.profileComplete" class="text-xs text-destructive">
          ต้องกรอกโปรไฟล์ให้ครบก่อนส่งคำเชิญ
        </p>
      </CardContent>
    </Card>

    <!-- ประวัติคำเชิญ -->
    <Card v-if="myInvitations.length">
      <CardHeader>
        <CardTitle class="text-base">คำเชิญของฉัน</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-2 text-sm">
          <li v-for="inv in myInvitations" :key="inv.id" class="flex flex-wrap items-center justify-between gap-2">
            <span>{{ nameOf(inv.leaderId) }} → {{ nameOf(inv.inviteeId) }}</span>
            <Badge :variant="inv.status === 'accepted' ? 'secondary' : 'outline'">
              {{ invitationStatusLabel[inv.status] }}
            </Badge>
          </li>
        </ul>
      </CardContent>
    </Card>

    <!-- Dialog ส่งคำเชิญ -->
    <Dialog v-model:open="inviteDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ส่งคำเชิญรูมเมท</DialogTitle>
          <DialogDescription>
            เลือกเพื่อนที่โปรไฟล์ครบถ้วนแล้ว — คำเชิญมีอายุ 48 ชั่วโมง และแต่ละคนมีได้ 1 คำเชิญ/กลุ่มที่ใช้งานอยู่
          </DialogDescription>
        </DialogHeader>
        <Select v-model="inviteeId">
          <SelectTrigger class="w-full" aria-label="เลือกเพื่อนที่จะเชิญ">
            <SelectValue placeholder="เลือกเพื่อน…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="u in invitableUsers" :key="u.id" :value="u.id">
              {{ u.displayName }} ({{ u.studentId ?? 'ไม่มีรหัส นศ.' }})
            </SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" @click="inviteDialogOpen = false">ยกเลิก</Button>
          <Button :disabled="!inviteeId" @click="sendInvitation">ส่งคำเชิญ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
