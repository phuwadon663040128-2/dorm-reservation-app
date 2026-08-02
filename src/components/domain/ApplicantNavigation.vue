<script setup lang="ts">
import { ref, type Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  BedDoubleIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  DoorOpenIcon,
  EllipsisIcon,
  FilePenLineIcon,
  FileSignatureIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  UsersRoundIcon,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DevelopmentNavItem {
  id: string
  label: string
  icon: Component
}

interface DevelopmentNavGroup {
  label: string
  description: string
  icon: Component
  items: DevelopmentNavItem[]
}

const route = useRoute()
const moreOpen = ref(false)

const desktopDevelopmentItems: DevelopmentNavItem[] = [
  { id: 'roommate', label: 'รูมเมท', icon: UsersRoundIcon },
  { id: 'reservation-payment', label: 'การจองและชำระเงิน', icon: CreditCardIcon },
  { id: 'contract-stay', label: 'สัญญาและเข้าพัก', icon: DoorOpenIcon },
]

const mobileLockedShortcuts: DevelopmentNavItem[] = [
  { id: 'payment', label: 'ชำระเงิน', icon: CreditCardIcon },
  { id: 'application', label: 'ใบสมัคร', icon: FilePenLineIcon },
]

const mobileMoreGroups: DevelopmentNavGroup[] = [
  {
    label: 'รูมเมท',
    description: 'จัดการสมาชิกสำหรับการพักคู่',
    icon: UsersRoundIcon,
    items: [
      { id: 'roommate', label: 'รูมเมท', icon: UsersRoundIcon },
    ],
  },
  {
    label: 'สถานะการจอง',
    description: 'ติดตามห้องที่เลือกและสถานะการยืนยัน',
    icon: ClipboardCheckIcon,
    items: [
      { id: 'reservation', label: 'สถานะการจอง', icon: ClipboardCheckIcon },
    ],
  },
  {
    label: 'สัญญาและเข้าพัก',
    description: 'เอกสารและขั้นตอนก่อนเข้าพัก',
    icon: DoorOpenIcon,
    items: [
      { id: 'contract', label: 'สัญญา', icon: FileSignatureIcon },
      { id: 'key-handover', label: 'รับกุญแจ', icon: KeyRoundIcon },
      { id: 'renewal', label: 'ต่อสัญญา', icon: RefreshCwIcon },
    ],
  },
]

function roomsActive() {
  return route.path === '/app/rooms' || route.path.startsWith('/app/rooms/')
}
</script>

<template>
  <TooltipProvider :delay-duration="180">
    <div class="sticky top-16 z-30 hidden border-b bg-background/95 backdrop-blur lg:block">
      <nav
        class="mx-auto flex h-12 w-full max-w-352 items-center gap-1 px-5"
        aria-label="เมนูผู้สมัคร"
      >
        <RouterLink
          to="/app/rooms"
          class="rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="roomsActive()
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          :aria-current="roomsActive() ? 'page' : undefined"
        >
          หอพักและห้องว่าง
        </RouterLink>

        <Tooltip v-for="item in desktopDevelopmentItems" :key="item.id">
          <TooltipTrigger as-child>
            <span
              tabindex="0"
              role="button"
              aria-disabled="true"
              class="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="`${item.label} — กำลังพัฒนา`"
              :data-testid="`applicant-desktop-development-${item.id}`"
            >
              <button
                type="button"
                disabled
                class="pointer-events-none rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-50"
              >
                {{ item.label }}
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>กำลังพัฒนา</TooltipContent>
        </Tooltip>
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
          :class="roomsActive() ? 'text-primary' : 'text-muted-foreground'"
          aria-label="หอพักและห้องว่าง"
          :aria-current="roomsActive() ? 'page' : undefined"
        >
          <BedDoubleIcon class="size-5" aria-hidden="true" />
          <span>ห้องพัก</span>
        </RouterLink>

        <Tooltip v-for="item in mobileLockedShortcuts" :key="item.id">
          <TooltipTrigger as-child>
            <span
              tabindex="0"
              role="button"
              aria-disabled="true"
              class="flex min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="`${item.label} — กำลังพัฒนา`"
              :data-testid="`applicant-mobile-shortcut-${item.id}`"
            >
              <button
                type="button"
                disabled
                class="pointer-events-none flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-muted-foreground opacity-50"
              >
                <component :is="item.icon" class="size-5" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">กำลังพัฒนา</TooltipContent>
        </Tooltip>

        <Sheet v-model:open="moreOpen">
          <SheetTrigger as-child>
            <button
              type="button"
              class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="เปิดเมนูเพิ่มเติม"
              data-testid="applicant-mobile-more"
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
                ฟังก์ชันรูมเมท การจอง และขั้นตอนก่อนเข้าพักอยู่ระหว่างพัฒนา
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
                  <Tooltip v-for="item in group.items" :key="item.id">
                    <TooltipTrigger as-child>
                      <span
                        tabindex="0"
                        role="button"
                        aria-disabled="true"
                        class="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        :aria-label="`${item.label} — กำลังพัฒนา`"
                        :data-testid="`applicant-more-development-${item.id}`"
                      >
                        <button
                          type="button"
                          disabled
                          class="pointer-events-none flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground opacity-50"
                        >
                          <component :is="item.icon" class="size-4.5 shrink-0" aria-hidden="true" />
                          <span>{{ item.label }}</span>
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left">กำลังพัฒนา</TooltipContent>
                  </Tooltip>
                </div>
              </section>
            </nav>

            <div class="border-t bg-muted/30 p-3">
              <Button as-child variant="outline" class="min-h-11 w-full justify-start bg-background">
                <RouterLink to="/" @click="moreOpen = false">
                  <ArrowLeftIcon aria-hidden="true" />
                  กลับเว็บไซต์หอพัก
                </RouterLink>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  </TooltipProvider>
</template>
