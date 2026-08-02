<script setup lang="ts">
import { type Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  BedDoubleIcon,
  CreditCardIcon,
  DoorOpenIcon,
  UsersRoundIcon,
} from '@lucide/vue'
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

const route = useRoute()

const developmentItems: DevelopmentNavItem[] = [
  { id: 'roommate', label: 'รูมเมท', icon: UsersRoundIcon },
  { id: 'reservation-payment', label: 'การจองและชำระเงิน', icon: CreditCardIcon },
  { id: 'contract-stay', label: 'สัญญาและเข้าพัก', icon: DoorOpenIcon },
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

        <Tooltip v-for="item in developmentItems" :key="item.id">
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
          class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="roomsActive() ? 'text-primary' : 'text-muted-foreground'"
          aria-label="หอพักและห้องว่าง"
          :aria-current="roomsActive() ? 'page' : undefined"
        >
          <BedDoubleIcon class="size-5" aria-hidden="true" />
          <span class="text-center">หอพักและห้องว่าง</span>
        </RouterLink>

        <Tooltip v-for="item in developmentItems" :key="item.id">
          <TooltipTrigger as-child>
            <span
              tabindex="0"
              role="button"
              aria-disabled="true"
              class="flex min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="`${item.label} — กำลังพัฒนา`"
              :data-testid="`applicant-mobile-development-${item.id}`"
            >
              <button
                type="button"
                disabled
                class="pointer-events-none flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-0.5 text-[10px] font-medium leading-tight text-muted-foreground opacity-50"
              >
                <component :is="item.icon" class="size-5 shrink-0" aria-hidden="true" />
                <span class="text-center text-balance">{{ item.label }}</span>
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">กำลังพัฒนา</TooltipContent>
        </Tooltip>
      </div>
    </nav>
  </TooltipProvider>
</template>
