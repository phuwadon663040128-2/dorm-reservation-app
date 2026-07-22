<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  BarChart3Icon,
  Building2Icon,
  CalendarRangeIcon,
  FileCheck2Icon,
  FileSignatureIcon,
  FileSpreadsheetIcon,
  FileUpIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ReceiptTextIcon,
  RotateCcwIcon,
  ScrollTextIcon,
  SendIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SquarePenIcon,
  TimerIcon,
  UserCogIcon,
  UsersIcon,
  UsersRoundIcon,
} from '@lucide/vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import ThemeToggle from '@/components/domain/ThemeToggle.vue'
import { resetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'
import type { StaffSection } from '@/types'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()

const roleLabel = computed(() => (session.isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'))
const userInitial = computed(() => session.currentUser?.displayName?.trim().charAt(0) ?? '?')

interface NavItem { to: string; label: string; icon: Component }
interface NavGroup { title: string; section?: StaffSection; adminOnly?: boolean; items: NavItem[] }

// เมนู staff ตามเอกสาร 03 §Staff navigation — จัดกลุ่มตามส่วนงานที่ผู้ดูแลระบบกำหนดรายคน
const allNavGroups: NavGroup[] = [
  {
    title: 'ภาพรวม',
    section: 'overview',
    items: [
      { to: '/staff', label: 'Dashboard', icon: LayoutDashboardIcon },
      { to: '/staff/campaigns', label: 'รอบรับสมัคร', icon: CalendarRangeIcon },
    ],
  },
  {
    title: 'ห้องพักและการจอง',
    section: 'reservation',
    items: [
      { to: '/staff/rooms', label: 'อาคาร / ชั้น / ห้อง', icon: Building2Icon },
      { to: '/staff/applicants', label: 'ผู้สมัคร', icon: UsersIcon },
      { to: '/staff/groups', label: 'กลุ่มรูมเมท', icon: UsersRoundIcon },
      { to: '/staff/holds', label: 'ห้องที่ถูก hold', icon: TimerIcon },
      { to: '/staff/reservations/manual', label: 'จองแทน (manual)', icon: SquarePenIcon },
    ],
  },
  {
    title: 'การเงิน SCB',
    section: 'payment',
    items: [
      { to: '/staff/obligations', label: 'รายการชำระเงิน', icon: ReceiptTextIcon },
      { to: '/staff/scb/export', label: 'Export batch (SLIPS)', icon: FileSpreadsheetIcon },
      { to: '/staff/scb/pdf-import', label: 'นำเข้า PDF จากธนาคาร', icon: FileUpIcon },
      { to: '/staff/scb/results', label: 'ผลชำระ / Exception', icon: FileCheck2Icon },
    ],
  },
  {
    title: 'สัญญาและส่งต่อ',
    section: 'contract',
    items: [
      { to: '/staff/contracts', label: 'สัญญา', icon: FileSignatureIcon },
      { to: '/staff/key-handover', label: 'ส่งมอบกุญแจ', icon: KeyRoundIcon },
      { to: '/staff/handoff', label: 'ส่งข้อมูลมหาวิทยาลัย', icon: SendIcon },
    ],
  },
  {
    title: 'ระบบ',
    section: 'system',
    items: [
      { to: '/staff/reports', label: 'รายงาน', icon: BarChart3Icon },
      { to: '/staff/audit', label: 'Audit log', icon: ScrollTextIcon },
      { to: '/staff/settings', label: 'ตั้งค่า', icon: SettingsIcon },
    ],
  },
  {
    title: 'ผู้ดูแลระบบ',
    adminOnly: true,
    items: [
      { to: '/staff/access', label: 'จัดการสิทธิ์เจ้าหน้าที่', icon: UserCogIcon },
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

// breadcrumb บน top-bar: กลุ่มงาน / ชื่อจอปัจจุบัน
const currentCrumb = computed(() => {
  for (const group of allNavGroups) {
    const item = group.items.find(i => isActive(i.to))
    if (item) return { group: group.title, page: item.label }
  }
  return { group: 'ภาพรวม', page: 'Dashboard' }
})

function logout() {
  session.logout()
  router.push('/')
}
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as-child size="lg" tooltip="พื้นที่เจ้าหน้าที่" class="hover:bg-sidebar-accent">
              <RouterLink to="/staff">
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground" aria-hidden="true">
                  <ShieldCheckIcon class="size-4.5" />
                </div>
                <div class="grid min-w-0 leading-tight">
                  <span class="truncate text-sm font-bold">หอพักในกำกับ มข.</span>
                  <span class="truncate text-xs text-sidebar-foreground/70">ระบบงานเจ้าหน้าที่</span>
                </div>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup v-for="group in navGroups" :key="group.title">
          <SidebarGroupLabel>{{ group.title }}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in group.items" :key="item.to">
                <!-- จอที่เปิดอยู่ใช้พื้นสีส้มทึบ+ตัวหนังสือขาว ให้รู้ตำแหน่งได้แม้เหลือบมอง -->
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(item.to)"
                  :tooltip="item.label"
                  class="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
                >
                  <RouterLink :to="item.to">
                    <component :is="item.icon" aria-hidden="true" />
                    <span>{{ item.label }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as="div" size="lg" :tooltip="session.currentUser?.displayName ?? ''" class="cursor-default hover:bg-transparent active:bg-transparent">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground" aria-hidden="true">
                {{ userInitial }}
              </div>
              <div class="grid min-w-0 leading-tight">
                <span class="truncate text-sm font-medium">{{ session.currentUser?.displayName }}</span>
                <span class="truncate text-xs text-sidebar-foreground/70">{{ roleLabel }}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <SidebarMenuButton tooltip="รีเซตข้อมูลทดสอบ" class="text-sidebar-foreground/80">
                  <RotateCcwIcon aria-hidden="true" />
                  <span>รีเซตข้อมูลทดสอบ</span>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>เริ่มการทดสอบใหม่?</AlertDialogTitle>
                  <AlertDialogDescription>ข้อมูลที่เปลี่ยนใน workflow ทั้งฝั่งผู้สมัครและเจ้าหน้าที่จะกลับเป็นค่าเริ่มต้น และคุณจะออกจากระบบ</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction @click="resetDemoData">รีเซตและเริ่มใหม่</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="ออกจากระบบ" class="text-sidebar-foreground/80" @click="logout">
              <LogOutIcon aria-hidden="true" />
              <span>ออกจากระบบ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
        <SidebarTrigger aria-label="เปิด/ปิดเมนู" />
        <Separator orientation="vertical" class="h-5! self-center!" />
        <nav aria-label="ตำแหน่งปัจจุบัน" class="flex min-w-0 items-center gap-1.5 text-sm">
          <span class="hidden text-muted-foreground sm:inline">{{ currentCrumb.group }}</span>
          <span class="hidden text-muted-foreground/60 sm:inline" aria-hidden="true">/</span>
          <span class="truncate font-semibold">{{ currentCrumb.page }}</span>
        </nav>
        <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Badge variant="secondary" class="hidden md:inline-flex">{{ roleLabel }}</Badge>
          <ThemeToggle />
          <Button size="sm" variant="ghost" aria-label="ออกจากระบบ" @click="logout">
            <LogOutIcon aria-hidden="true" />
            <span class="hidden sm:inline">ออกจากระบบ</span>
          </Button>
        </div>
      </header>

      <main class="min-w-0 flex-1 px-3 py-5 sm:px-4 lg:px-6">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
