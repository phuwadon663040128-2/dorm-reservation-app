<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { LogOutIcon, ShieldCheckIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/domain/ThemeToggle.vue'
import { useSessionStore } from '@/stores/session'
import type { StaffSection } from '@/types'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()

const roleLabel = computed(() => (session.isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'))

// เมนู staff ตามเอกสาร 03 §Staff navigation — จัดกลุ่มตามส่วนงานที่ผู้ดูแลระบบกำหนดรายคน
const allNavGroups: { title: string; section?: StaffSection; adminOnly?: boolean; items: { to: string; label: string }[] }[] = [
  {
    title: 'ภาพรวม',
    section: 'overview',
    items: [
      { to: '/staff', label: 'Dashboard' },
      { to: '/staff/campaigns', label: 'รอบรับสมัคร' },
    ],
  },
  {
    title: 'ห้องพักและการจอง',
    section: 'reservation',
    items: [
      { to: '/staff/rooms', label: 'อาคาร / ชั้น / ห้อง' },
      { to: '/staff/applicants', label: 'ผู้สมัคร' },
      { to: '/staff/groups', label: 'กลุ่มรูมเมท' },
      { to: '/staff/holds', label: 'ห้องที่ถูก hold' },
      { to: '/staff/reservations/manual', label: 'จองแทน (manual)' },
    ],
  },
  {
    title: 'การเงิน SCB',
    section: 'payment',
    items: [
      { to: '/staff/obligations', label: 'รายการชำระเงิน' },
      { to: '/staff/scb/export', label: 'Export batch (SLIPS)' },
      { to: '/staff/scb/pdf-import', label: 'นำเข้า PDF จากธนาคาร' },
      { to: '/staff/scb/results', label: 'ผลชำระ / Exception' },
    ],
  },
  {
    title: 'สัญญาและส่งต่อ',
    section: 'contract',
    items: [
      { to: '/staff/contracts', label: 'สัญญา' },
      { to: '/staff/key-handover', label: 'ส่งมอบกุญแจ' },
      { to: '/staff/handoff', label: 'ส่งข้อมูลมหาวิทยาลัย' },
    ],
  },
  {
    title: 'ระบบ',
    section: 'system',
    items: [
      { to: '/staff/reports', label: 'รายงาน' },
      { to: '/staff/audit', label: 'Audit log' },
      { to: '/staff/settings', label: 'ตั้งค่า' },
    ],
  },
  {
    title: 'ผู้ดูแลระบบ',
    adminOnly: true,
    items: [
      { to: '/staff/access', label: 'จัดการสิทธิ์เจ้าหน้าที่' },
    ],
  },
]

// แสดงเฉพาะกลุ่มที่เข้าถึงได้ — Dashboard เข้าได้เสมอ จึงคงกลุ่มภาพรวมไว้บางส่วน
const navGroups = computed(() =>
  allNavGroups
    .filter(g => (g.adminOnly ? session.isAdmin : true))
    .map(g => ({
      ...g,
      items: g.section && !session.canAccessSection(g.section)
        ? g.items.filter(item => item.to === '/staff')
        : g.items,
    }))
    .filter(g => g.items.length > 0),
)

function isActive(to: string) {
  if (to === '/staff') return route.path === '/staff'
  return route.path === to || route.path.startsWith(to + '/')
}

function logout() {
  session.logout()
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div class="flex h-14 items-center justify-between gap-3 px-4">
        <RouterLink to="/staff" class="flex items-center gap-2 font-bold">
          <ShieldCheckIcon class="size-5 text-primary" aria-hidden="true" />
          <span>พื้นที่เจ้าหน้าที่ — หอพักในกำกับ มข.</span>
        </RouterLink>
        <div class="flex items-center gap-2 text-sm">
          <div class="hidden text-right sm:block">
            <p class="font-medium leading-tight">{{ session.currentUser?.displayName }}</p>
            <p class="text-xs text-muted-foreground">{{ roleLabel }}</p>
          </div>
          <ThemeToggle />
          <Button size="sm" variant="ghost" aria-label="ออกจากระบบ" @click="logout">
            <LogOutIcon aria-hidden="true" />
            <span class="hidden sm:inline">ออกจากระบบ</span>
          </Button>
        </div>
      </div>
      <!-- มือถือ: เมนูเลื่อนแนวนอน -->
      <nav class="overflow-x-auto px-4 lg:hidden" aria-label="เมนูเจ้าหน้าที่ (มือถือ)">
        <div class="flex w-max gap-1 pb-2">
          <RouterLink
            v-for="item in navGroups.flatMap(g => g.items)"
            :key="item.to"
            :to="item.to"
            class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm hover:bg-muted"
            :class="isActive(item.to) ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-muted-foreground'"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>
    </header>

    <div class="flex flex-1">
      <!-- เดสก์ท็อป: sidebar -->
      <aside class="hidden w-60 shrink-0 border-r lg:block" aria-label="เมนูเจ้าหน้าที่">
        <nav class="sticky top-14 space-y-5 p-4">
          <div v-for="group in navGroups" :key="group.title">
            <p class="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {{ group.title }}
            </p>
            <div class="space-y-0.5">
              <RouterLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                :class="isActive(item.to) ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-muted-foreground'"
              >
                {{ item.label }}
              </RouterLink>
            </div>
          </div>
        </nav>
      </aside>

      <main class="min-w-0 flex-1 px-3 py-5 lg:px-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
