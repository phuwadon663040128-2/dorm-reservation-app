<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  ArrowLeftIcon,
  BedDoubleIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClipboardPenLineIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  DoorOpenIcon,
  EllipsisIcon,
  FilePenLineIcon,
  FileSignatureIcon,
  KeyRoundIcon,
  LockIcon,
  RefreshCwIcon,
  UsersRoundIcon,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useApplicationStore } from '@/stores/application'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

interface ApplicantNavItem {
  label: string
  to: string
  exact?: boolean
  icon?: Component
}

interface ApplicantNavGroup {
  label: string
  description?: string
  icon?: Component
  items: ApplicantNavItem[]
}

const route = useRoute()
const router = useRouter()
const application = useApplicationStore()
const payments = usePaymentsStore()
const reservation = useReservationStore()
const session = useSessionStore()
const moreOpen = ref(false)

const overviewItem: ApplicantNavItem = { label: 'หอพักและห้องว่าง', to: '/app/rooms' }

const navGroups: ApplicantNavGroup[] = [
  {
    label: 'รอบและรูมเมท',
    items: [
      { label: 'รอบรับสมัคร', to: '/app/campaigns' },
      { label: 'รูมเมท', to: '/app/roommate' },
    ],
  },
  {
    label: 'การจองและชำระเงิน',
    items: [
      { label: 'สถานะการจอง', to: '/app/reservation' },
      { label: 'ชำระเงิน', to: '/app/payments' },
      { label: 'ใบสมัคร', to: '/app/application' },
    ],
  },
  {
    label: 'สัญญาและเข้าพัก',
    items: [
      { label: 'สัญญา', to: '/app/contracts' },
      { label: 'รับกุญแจ', to: '/app/next-steps' },
      { label: 'ต่อสัญญา', to: '/app/renewal' },
    ],
  },
]

const mobileMoreGroups: ApplicantNavGroup[] = [
  {
    label: 'รอบและรูมเมท',
    description: 'ดูรอบที่เปิดรับและจัดการสมาชิกก่อนเลือกห้องพักคู่',
    icon: ClipboardPenLineIcon,
    items: [
      { label: 'รอบรับสมัคร', to: '/app/campaigns', icon: CalendarDaysIcon },
      { label: 'รูมเมท', to: '/app/roommate', icon: UsersRoundIcon },
    ],
  },
  {
    label: 'สถานะการจอง',
    description: 'ติดตามห้องที่ล็อก กำหนดยืนยัน และสถานะของสมาชิก',
    icon: ClipboardCheckIcon,
    items: [
      { label: 'สถานะการจอง', to: '/app/reservation', icon: ClipboardCheckIcon },
    ],
  },
  {
    label: 'สัญญาและเข้าพัก',
    description: 'เอกสารและขั้นตอนก่อนเข้าพัก',
    icon: DoorOpenIcon,
    items: [
      { label: 'สัญญา', to: '/app/contracts', icon: FileSignatureIcon },
      { label: 'รับกุญแจ', to: '/app/next-steps', icon: KeyRoundIcon },
      { label: 'ต่อสัญญา', to: '/app/renewal', icon: RefreshCwIcon },
    ],
  },
]

const isApplicationActive = computed(() => pathMatches('/app/application'))
const isMoreActive = computed(() => mobileMoreGroups.some(group => group.items.some(isItemActive)))

const applicationAccessBlock = computed(() => {
  const applicantId = session.currentUser?.id
  if (!applicantId || application.hasSubmittedApplication(applicantId)) return null

  const activeReservation = reservation.myReservation
  if (!activeReservation) {
    return {
      shortLabel: 'เลือกห้องก่อน',
      message: 'ยังเปิดใบสมัครไม่ได้ กรุณาเลือกหอพักและห้องก่อน',
      to: '/app/rooms',
    }
  }

  if (activeReservation.holdStatus === 'held_roommate_confirmation') {
    return {
      shortLabel: 'รอยืนยันห้อง',
      message: 'ยังเปิดใบสมัครไม่ได้ กรุณาดำเนินการยืนยันห้องกับรูมเมทให้เรียบร้อยก่อน',
      to: '/app/roommate',
    }
  }

  const ownObligations = payments.myObligations.filter(
    obligation => obligation.reservationGroupId === activeReservation.id,
  )
  const ownPaymentComplete = ownObligations.length > 0
    && ownObligations.every(obligation => payments.isPaid(obligation))

  if (!ownPaymentComplete) {
    return {
      shortLabel: 'ชำระก่อน',
      message: 'ยังเปิดใบสมัครไม่ได้ กรุณาชำระรายการของคุณให้ครบก่อน',
      to: '/app/payments',
    }
  }

  return null
})

function pathMatches(prefix: string, exact = false) {
  if (exact) return route.path === prefix
  return route.path === prefix || route.path.startsWith(`${prefix}/`)
}

function isItemActive(item: ApplicantNavItem) {
  return pathMatches(item.to, item.exact)
}

function isGroupActive(group: ApplicantNavGroup) {
  return group.items.some(isItemActive)
}

function navigate(to: string) {
  moreOpen.value = false
  if (to === '/app/application' && applicationAccessBlock.value) {
    toast.info(applicationAccessBlock.value.message)
    router.push(applicationAccessBlock.value.to)
    return
  }
  router.push(to)
}
</script>

<template>
  <div class="sticky top-16 z-30 hidden border-b bg-background/95 backdrop-blur lg:block">
    <nav
      class="mx-auto flex h-12 w-full max-w-352 items-center gap-1 px-5"
      aria-label="ขั้นตอนการสมัครและการจอง"
    >
      <RouterLink
        :to="overviewItem.to"
        class="rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="isItemActive(overviewItem)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        :aria-current="isItemActive(overviewItem) ? 'page' : undefined"
      >
        {{ overviewItem.label }}
      </RouterLink>

      <DropdownMenu v-for="group in navGroups" :key="group.label">
        <DropdownMenuTrigger
          class="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="isGroupActive(group)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          :aria-current="isGroupActive(group) ? 'location' : undefined"
        >
          {{ group.label }}
          <ChevronDownIcon class="size-3.5" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="min-w-56">
          <DropdownMenuItem
            v-for="item in group.items"
            :key="item.to"
            class="cursor-pointer"
            :class="isItemActive(item) ? 'bg-accent font-semibold text-primary' : ''"
            @click="navigate(item.to)"
          >
            <LockIcon
              v-if="item.to === '/app/application' && applicationAccessBlock"
              class="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{{ item.label }}</span>
            <span
              v-if="item.to === '/app/application' && applicationAccessBlock"
              class="ml-auto text-[11px] text-muted-foreground"
            >
              {{ applicationAccessBlock.shortLabel }}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  </div>

  <nav
    class="fixed inset-x-0 -bottom-1 z-50 isolate transform-gpu border-t bg-card pb-[calc(env(safe-area-inset-bottom)_+_0.25rem)] shadow-lg lg:hidden"
    aria-label="เมนูผู้สมัครบนมือถือ"
  >
    <div class="mx-auto grid h-16 max-w-lg grid-cols-4 px-1">
      <RouterLink
        to="/app/rooms"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="pathMatches('/app/rooms') ? 'text-primary' : 'text-muted-foreground'"
        aria-label="เลือกหอพักและห้องว่าง"
        :aria-current="pathMatches('/app/rooms') ? 'page' : undefined"
      >
        <BedDoubleIcon class="size-5" aria-hidden="true" />
        <span>ห้องพัก</span>
      </RouterLink>

      <RouterLink
        to="/app/payments"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="pathMatches('/app/payments') ? 'text-primary' : 'text-muted-foreground'"
        aria-label="ชำระเงิน"
        :aria-current="pathMatches('/app/payments') ? 'page' : undefined"
      >
        <CreditCardIcon class="size-5" aria-hidden="true" />
        <span>ชำระเงิน</span>
      </RouterLink>

      <button
        type="button"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="isApplicationActive
          ? 'text-primary'
          : applicationAccessBlock ? 'text-muted-foreground/60' : 'text-muted-foreground'"
        :aria-label="applicationAccessBlock
          ? `ใบสมัครยังไม่พร้อม: ${applicationAccessBlock.shortLabel}`
          : 'กรอกใบสมัคร'"
        :aria-current="isApplicationActive ? 'page' : undefined"
        @click="navigate('/app/application')"
      >
        <LockIcon v-if="applicationAccessBlock" class="size-5" aria-hidden="true" />
        <FilePenLineIcon v-else class="size-5" aria-hidden="true" />
        <span>ใบสมัคร</span>
      </button>

      <Sheet v-model:open="moreOpen">
        <SheetTrigger as-child>
          <button
            type="button"
            class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="isMoreActive ? 'text-primary' : 'text-muted-foreground'"
            aria-label="เปิดเมนูการจองเพิ่มเติม"
            :aria-current="isMoreActive ? 'location' : undefined"
          >
            <EllipsisIcon class="size-5" aria-hidden="true" />
            <span>เพิ่มเติม</span>
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          class="!w-[min(23rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0 pb-[calc(env(safe-area-inset-bottom)_+_0.5rem)]"
        >
          <SheetHeader class="border-b px-5 py-5 pr-12 text-left">
            <SheetTitle class="text-lg">เมนูการจองเพิ่มเติม</SheetTitle>
            <SheetDescription>
              ดูรอบ จัดการรูมเมท ติดตามการจอง และขั้นตอนก่อนเข้าพัก
            </SheetDescription>
          </SheetHeader>

          <nav
            class="grid flex-1 content-start gap-3 overflow-y-auto px-3 py-4"
            aria-label="เมนูผู้สมัครเพิ่มเติม"
          >
            <section
              v-for="group in mobileMoreGroups"
              :key="group.label"
              class="rounded-xl border bg-card p-2"
            >
              <div class="flex items-start gap-3 px-2 pb-2 pt-1">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <component :is="group.icon" class="size-4.5" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <h2 class="text-sm font-semibold">{{ group.label }}</h2>
                  <p class="text-xs leading-relaxed text-muted-foreground">{{ group.description }}</p>
                </div>
              </div>

              <div class="grid gap-1">
                <button
                  v-for="item in group.items"
                  :key="item.to"
                  type="button"
                  class="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  :class="isItemActive(item)
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground/85 hover:bg-muted hover:text-foreground'"
                  :aria-current="isItemActive(item) ? 'page' : undefined"
                  @click="navigate(item.to)"
                >
                  <component
                    :is="item.icon"
                    class="size-4.5 shrink-0"
                    :class="isItemActive(item) ? 'text-primary' : 'text-muted-foreground'"
                    aria-hidden="true"
                  />
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </section>
          </nav>

          <div class="border-t bg-muted/30 p-3">
            <Button
              variant="outline"
              class="min-h-11 w-full justify-start bg-background"
              @click="navigate('/')"
            >
              <ArrowLeftIcon aria-hidden="true" />
              กลับเว็บไซต์หอพัก
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  </nav>
</template>
