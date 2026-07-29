<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { CheckIcon, MailPlusIcon, UserRoundIcon, UsersIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxViewport,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import { invitationStatusLabel, roommateGroupStatusLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import {
  ROOMMATE_SEARCH_MIN_STUDENT_DIGITS,
  ROOMMATE_SEARCH_MIN_LENGTH,
  ROOMMATE_SEARCH_MAX_LENGTH,
  ROOMMATE_SEARCH_RESULT_LIMIT,
  useReservationStore,
} from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const reservation = useReservationStore()
const router = useRouter()

const myGroup = computed(() => reservation.myRoommateGroup)
const myInvitations = computed(() => reservation.myInvitations)
const receivedPending = computed(() => reservation.myReceivedPendingInvitations)

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
const inviteSearchOpen = ref(false)
const inviteSearchInput = ref('')
const debouncedInviteSearch = ref('')
const INVITE_SEARCH_DEBOUNCE_MS = 300

const normalizedInviteSearch = computed(() => inviteSearchInput.value.trim().toLocaleLowerCase('th-TH'))
const inviteStudentDigits = computed(() => normalizedInviteSearch.value.replace(/\D/g, ''))
const isStudentIdSearch = computed(() => /^[\d\s-]+$/.test(normalizedInviteSearch.value))
const isCompleteEmailSearch = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedInviteSearch.value),
)
const canSearchInvitees = computed(() =>
  normalizedInviteSearch.value.length >= ROOMMATE_SEARCH_MIN_LENGTH
  && (isCompleteEmailSearch.value
    || (isStudentIdSearch.value && inviteStudentDigits.value.length >= ROOMMATE_SEARCH_MIN_STUDENT_DIGITS)),
)
const inviteSearchPending = computed(() =>
  canSearchInvitees.value
  && debouncedInviteSearch.value.trim().toLocaleLowerCase('th-TH') !== normalizedInviteSearch.value,
)
const candidateSearch = computed(() =>
  canSearchInvitees.value && !inviteSearchPending.value
    ? reservation.searchRoommateCandidates(debouncedInviteSearch.value, ROOMMATE_SEARCH_RESULT_LIMIT)
    : { items: [], hasMore: false },
)
const selectedInvitee = computed(() => users.find(user => user.id === inviteeId.value))
const searchGuidance = computed(() => {
  const query = normalizedInviteSearch.value
  if (!query) return `กรอกรหัสนักศึกษาอย่างน้อย ${ROOMMATE_SEARCH_MIN_STUDENT_DIGITS} หลัก หรืออีเมลเต็ม`
  if (query.includes('@')) {
    return isCompleteEmailSearch.value
      ? ''
      : 'กรอกอีเมลให้ครบ เช่น name@example.com'
  }
  if (!isStudentIdSearch.value) return 'ค้นหาได้ด้วยรหัสนักศึกษา หรืออีเมลเต็มเท่านั้น'

  const remaining = Math.max(0, ROOMMATE_SEARCH_MIN_STUDENT_DIGITS - inviteStudentDigits.value.length)
  return remaining > 0 ? `กรอกรหัสนักศึกษาเพิ่มอีก ${remaining} หลักเพื่อเริ่มค้นหา` : ''
})

watch(inviteSearchInput, (value, _previous, onCleanup) => {
  if (!value.trim()) {
    debouncedInviteSearch.value = ''
    return
  }

  const timer = window.setTimeout(() => {
    debouncedInviteSearch.value = value.trim()
  }, INVITE_SEARCH_DEBOUNCE_MS)
  onCleanup(() => window.clearTimeout(timer))
})

watch(inviteeId, (id) => {
  if (!id) return
  inviteSearchOpen.value = false
  inviteSearchInput.value = ''
  debouncedInviteSearch.value = ''
})

watch(inviteDialogOpen, (open) => {
  if (open) return
  resetInviteSearch()
})

function updateInviteSearchInput(value: string) {
  inviteSearchInput.value = value
  if (value.trim() && inviteeId.value) inviteeId.value = ''
}

function clearInviteSelection() {
  inviteeId.value = ''
  inviteSearchInput.value = ''
  debouncedInviteSearch.value = ''
  inviteSearchOpen.value = true
}

function resetInviteSearch() {
  inviteeId.value = ''
  inviteSearchOpen.value = false
  inviteSearchInput.value = ''
  debouncedInviteSearch.value = ''
}

function sendInvitation() {
  if (!inviteeId.value) return
  const result = reservation.sendInvitation(inviteeId.value)
  toast(result.message)
  if (result.ok) {
    inviteDialogOpen.value = false
    resetInviteSearch()
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
  if (result.ok) router.push({ path: '/app/payments', query: { pay: 'auto' } })
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
        กติกา: กลุ่มละไม่เกิน 2 คน · 1 คนมีได้ 1 คำเชิญ/กลุ่มที่ใช้งานอยู่ · ต้องตอบรับคำเชิญก่อนเลือกห้อง
        และกรอกใบสมัครได้ภายหลังเมื่อชำระเงินของตนเองเรียบร้อยแล้ว
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
            <Badge variant="outline">สมาชิกกลุ่ม</Badge>
          </li>
        </ul>

        <!-- กลุ่มพร้อมเลือกห้อง -->
        <div v-if="myGroup.status === 'accepted' && myGroup.leaderId === session.currentUser?.id" class="flex gap-2">
          <Button as-child>
            <RouterLink to="/app/rooms">ไปเลือกห้อง (คุณเป็นหัวหน้ากลุ่ม)</RouterLink>
          </Button>
        </div>
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
              <Button @click="confirmRoom">
                ยืนยันห้อง {{ pendingRoomConfirmation.roomNumber }}
              </Button>
              <Button variant="outline" @click="declineRoom">ปฏิเสธ (ปล่อยห้องทันที)</Button>
            </div>
          </template>
          <p v-else class="text-sm text-muted-foreground">
            รอรูมเมทยืนยันห้อง {{ pendingRoomConfirmation.roomNumber }} — หากหมดเวลา ห้องจะถูกปล่อยคืนอัตโนมัติ
          </p>
        </template>
      </CardContent>
    </Card>

    <!-- ยังไม่มีกลุ่ม -->
    <Empty v-else class="border bg-card shadow-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon"><UsersIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>ยังไม่มีกลุ่มรูมเมท</EmptyTitle>
        <EmptyDescription>
          ส่งคำเชิญถึงเพื่อนเพื่อพักคู่ หรือข้ามขั้นตอนนี้หากต้องการเหมาห้องพักคนเดียว
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-wrap justify-center gap-2">
          <Button @click="inviteDialogOpen = true">
            <MailPlusIcon aria-hidden="true" /> ส่งคำเชิญรูมเมท
          </Button>
          <Button as-child variant="outline">
            <RouterLink to="/app/rooms">เหมาห้อง — ไปเลือกห้องเลย</RouterLink>
          </Button>
        </div>
      </EmptyContent>
    </Empty>

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
      <DialogContent class="w-[calc(100vw-1rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ส่งคำเชิญรูมเมท</DialogTitle>
          <DialogDescription>
            ค้นหาด้วยรหัสนักศึกษาหรืออีเมล แล้วเลือกเพื่อนที่ต้องการพักด้วย คำเชิญมีอายุ 48 ชั่วโมง
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label for="roommate-search">ค้นหาเพื่อน</Label>
          <Combobox
            v-model="inviteeId"
            v-model:open="inviteSearchOpen"
            ignore-filter
            open-on-click
            open-on-focus
            :reset-search-term-on-blur="false"
            :reset-search-term-on-select="false"
          >
            <ComboboxAnchor class="w-full">
              <ComboboxInput
                id="roommate-search"
                :model-value="inviteSearchInput"
                class="h-11 text-sm"
                placeholder="เช่น 673010 หรือ name@example.com"
                autocomplete="off"
                inputmode="search"
                enterkeyhint="search"
                :maxlength="ROOMMATE_SEARCH_MAX_LENGTH"
                aria-describedby="roommate-search-help"
                @update:model-value="updateInviteSearchInput"
              />
            </ComboboxAnchor>

            <ComboboxList
              align="start"
              :collision-padding="12"
              class="z-[60] max-w-[calc(100vw-2rem)]"
            >
              <ComboboxViewport class="max-h-[min(16rem,40dvh)] p-1 data-empty:p-1">
                <div
                  v-if="!canSearchInvitees"
                  class="px-3 py-5 text-center text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {{ searchGuidance }}
                </div>

                <div
                  v-else-if="inviteSearchPending"
                  class="space-y-2 p-2"
                  role="status"
                  aria-label="กำลังค้นหาผู้สมัคร"
                >
                  <Skeleton v-for="index in 3" :key="index" class="h-12 w-full rounded-lg" />
                  <span class="sr-only">กำลังค้นหา กรุณารอสักครู่</span>
                </div>

                <div
                  v-else-if="candidateSearch.items.length === 0"
                  class="px-3 py-5 text-center text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  ไม่พบบัญชีผู้สมัครที่ตรงกับข้อมูลนี้
                </div>

                <template v-else>
                  <ComboboxGroup
                    :heading="candidateSearch.hasMore
                      ? `แสดง ${ROOMMATE_SEARCH_RESULT_LIMIT} รายการแรก`
                      : `ผลการค้นหา ${candidateSearch.items.length} รายการ`"
                  >
                    <ComboboxItem
                      v-for="candidate in candidateSearch.items"
                      :key="candidate.id"
                      :value="candidate.id"
                      :text-value="`${candidate.displayName} ${candidate.studentId ?? candidate.email}`"
                      :disabled="!candidate.available"
                      class="min-h-12 items-start px-2.5 py-2.5 pr-9"
                    >
                      <span class="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
                        <UserRoundIcon class="size-4 text-muted-foreground" aria-hidden="true" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="flex flex-wrap items-center gap-1.5 font-medium">
                          {{ candidate.displayName }}
                          <Badge v-if="!candidate.available" variant="outline" class="text-[10px]">
                            รับคำเชิญไม่ได้
                          </Badge>
                        </span>
                        <span class="block truncate text-xs text-muted-foreground">
                          {{ candidate.studentId ?? candidate.email }}
                        </span>
                        <span
                          v-if="candidate.unavailableReason"
                          class="mt-0.5 block text-xs text-muted-foreground"
                        >
                          {{ candidate.unavailableReason }}
                        </span>
                      </span>
                      <ComboboxItemIndicator>
                        <CheckIcon aria-hidden="true" />
                      </ComboboxItemIndicator>
                    </ComboboxItem>
                  </ComboboxGroup>

                  <p
                    v-if="candidateSearch.hasMore"
                    class="border-t px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                    aria-live="polite"
                  >
                    พบมากกว่า {{ ROOMMATE_SEARCH_RESULT_LIMIT }} คน กรุณาพิมพ์รหัสให้ละเอียดขึ้น
                  </p>
                </template>
              </ComboboxViewport>
            </ComboboxList>
          </Combobox>

          <p id="roommate-search-help" class="text-xs leading-relaxed text-muted-foreground">
            ระบบเริ่มค้นหาเมื่อกรอกรหัสอย่างน้อย {{ ROOMMATE_SEARCH_MIN_STUDENT_DIGITS }} หลัก และแสดงไม่เกิน
            {{ ROOMMATE_SEARCH_RESULT_LIMIT }} คนต่อครั้ง
          </p>
        </div>

        <div v-if="selectedInvitee" class="flex items-start justify-between gap-3 rounded-lg border bg-muted/40 p-3">
          <div class="flex min-w-0 items-start gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
              <CheckIcon class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <p class="text-xs text-muted-foreground">ผู้ที่จะได้รับคำเชิญ</p>
              <p class="font-semibold">{{ selectedInvitee.displayName }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ selectedInvitee.studentId ?? selectedInvitee.email }}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" class="shrink-0" @click="clearInviteSelection">
            เปลี่ยนคน
          </Button>
        </div>

        <DialogFooter class="gap-2 sm:gap-2">
          <Button type="button" variant="outline" class="w-full sm:w-auto" @click="inviteDialogOpen = false">ยกเลิก</Button>
          <Button type="button" class="w-full sm:w-auto" :disabled="!inviteeId" @click="sendInvitation">ส่งคำเชิญ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
