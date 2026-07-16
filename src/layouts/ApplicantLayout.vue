<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { BuildingIcon, LogOutIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/domain/ThemeToggle.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()

// เมนู applicant ตามเอกสาร 03 §Applicant navigation
const navItems = [
  { to: '/app', label: 'ภาพรวม', exact: true },
  { to: '/app/campaigns', label: 'รอบรับสมัคร' },
  { to: '/app/rooms', label: 'เลือกห้องพัก' },
  { to: '/app/roommate', label: 'รูมเมท' },
  { to: '/app/reservation', label: 'การจองของฉัน' },
  { to: '/app/payments', label: 'ชำระเงิน' },
  { to: '/app/contracts', label: 'สัญญา' },
  { to: '/app/next-steps', label: 'รับกุญแจ' },
  { to: '/app/renewal', label: 'ต่อสัญญา' },
  { to: '/app/account', label: 'บัญชี' },
]

function logout() {
  session.logout()
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-14 w-full max-w-352 items-center justify-between gap-3 px-3 sm:px-5">
        <RouterLink to="/app" class="flex min-w-0 items-center gap-2 font-bold">
          <BuildingIcon class="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span class="truncate">หอพักในกำกับ มข.</span>
        </RouterLink>
        <div class="flex items-center gap-2 text-sm">
          <div class="hidden text-right sm:block">
            <p class="font-medium leading-tight">{{ session.currentUser?.displayName }}</p>
            <p class="text-xs text-muted-foreground">ผู้สมัคร / ผู้พัก</p>
          </div>
          <ThemeToggle />
          <Button size="sm" variant="ghost" aria-label="ออกจากระบบ" @click="logout">
            <LogOutIcon aria-hidden="true" />
            <span class="hidden sm:inline">ออกจากระบบ</span>
          </Button>
        </div>
      </div>
      <!-- mobile-first: เมนูเลื่อนแนวนอนได้ -->
      <nav class="mx-auto w-full max-w-352 overflow-x-auto px-3 sm:px-5" aria-label="เมนูผู้สมัคร">
        <div class="flex w-max gap-1 pb-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm hover:bg-muted"
            :class="($route.path === item.to || (!item.exact && $route.path.startsWith(item.to + '/')))
              ? 'bg-primary text-primary-foreground hover:bg-primary'
              : 'text-muted-foreground'"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-352 flex-1 px-3 py-5 sm:px-5">
      <RouterView />
    </main>
  </div>
</template>
