<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
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
  LayoutDashboardIcon,
  RefreshCwIcon,
  UsersRoundIcon,
  WalletCardsIcon,
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
const moreOpen = ref(false)

const overviewItem: ApplicantNavItem = { label: 'ภาพรวมการสมัคร', to: '/app', exact: true }

const navGroups: ApplicantNavGroup[] = [
  {
    label: 'สมัครและเลือกห้อง',
    items: [
      { label: 'รอบรับสมัคร', to: '/app/campaigns' },
      { label: 'ใบสมัคร', to: '/app/application' },
      { label: 'เลือกห้องพัก', to: '/app/rooms' },
      { label: 'รูมเมท', to: '/app/roommate' },
    ],
  },
  {
    label: 'การจองและชำระเงิน',
    items: [
      { label: 'สถานะการจอง', to: '/app/reservation' },
      { label: 'ชำระเงิน', to: '/app/payments' },
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
    label: 'สมัครและเลือกห้อง',
    description: 'รอบที่เปิดรับ ห้องพัก และรูมเมท',
    icon: ClipboardPenLineIcon,
    items: [
      { label: 'รอบรับสมัคร', to: '/app/campaigns', icon: CalendarDaysIcon },
      { label: 'เลือกห้องพัก', to: '/app/rooms', icon: BedDoubleIcon },
      { label: 'รูมเมท', to: '/app/roommate', icon: UsersRoundIcon },
    ],
  },
  {
    label: 'การจองและชำระเงิน',
    description: 'รายการค่าใช้จ่ายและกำหนดชำระ',
    icon: WalletCardsIcon,
    items: [
      { label: 'ชำระเงิน', to: '/app/payments', icon: CreditCardIcon },
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

const applyPrefixes = navGroups[0].items.map(item => item.to)
const statusPrefixes = navGroups[1].items.map(item => item.to)
const morePrefixes = navGroups[2].items.map(item => item.to)

const isApplyActive = computed(() => applyPrefixes.some(prefix => pathMatches(prefix)))
const isStatusActive = computed(() => statusPrefixes.some(prefix => pathMatches(prefix)))
const isMoreActive = computed(() => morePrefixes.some(prefix => pathMatches(prefix)))

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
            {{ item.label }}
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
        to="/app"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="route.path === '/app' ? 'text-primary' : 'text-muted-foreground'"
        aria-label="ภาพรวมการสมัคร"
        :aria-current="route.path === '/app' ? 'page' : undefined"
      >
        <LayoutDashboardIcon class="size-5" aria-hidden="true" />
        <span>ภาพรวม</span>
      </RouterLink>

      <RouterLink
        to="/app/application"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="isApplyActive ? 'text-primary' : 'text-muted-foreground'"
        aria-label="สมัครและเลือกห้อง"
        :aria-current="isApplyActive ? 'location' : undefined"
      >
        <FilePenLineIcon class="size-5" aria-hidden="true" />
        <span>สมัคร</span>
      </RouterLink>

      <RouterLink
        to="/app/reservation"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="isStatusActive ? 'text-primary' : 'text-muted-foreground'"
        aria-label="สถานะการจองและชำระเงิน"
        :aria-current="isStatusActive ? 'location' : undefined"
      >
        <ClipboardCheckIcon class="size-5" aria-hidden="true" />
        <span>สถานะ</span>
      </RouterLink>

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
              เมนูสำหรับขั้นตอนถัดจากการสมัครและติดตามสถานะ
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
