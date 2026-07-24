<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  GlobeIcon,
  LinkIcon,
  LogOutIcon,
  MailCheckIcon,
  MenuIcon,
  RotateCcwIcon,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import ThemeToggle from '@/components/domain/ThemeToggle.vue'
import kkuEmblem from '@/assets/kku-emblem.png'
import { onlineServices } from '@/fixtures/services'
import { logoutAndResetDemoData, resetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'

const emit = defineEmits<{
  requestLogin: []
}>()

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const mobileOpen = ref(false)
const profileOpen = ref(false)

interface MenuItem {
  label: string
  to: RouteLocationRaw
  hint?: string
}

interface TopMenu {
  label: string
  to?: RouteLocationRaw
  items?: MenuItem[]
  activePrefixes: string[]
}

const dormItems: MenuItem[] = [
  { label: 'วรเรสซิเดนซ์ (หอพัก 8 หลัง)', to: { path: '/rooms', query: { dorm: 'dorm-8-lang' } } },
  { label: 'หอพักวรอินเตอร์ (4 หลัง)', to: { path: '/rooms', query: { dorm: 'dorm-wor-inter' } } },
]

const serviceItems: MenuItem[] = [
  { label: 'บริการออนไลน์ทั้งหมด', to: '/services' },
  ...onlineServices.map(service => ({ label: service.title, to: `/services/${service.id}` })),
]

const infoItems: MenuItem[] = [
  { label: 'คู่มือการจองหอพักออนไลน์', to: '/guide' },
  { label: 'กฎระเบียบหอพักนักศึกษา', to: '/info/rules' },
  { label: 'อัตราค่าธรรมเนียมหอพัก', to: '/info/fees' },
  { label: 'แผนผังหอพักนักศึกษา', to: '/info/floor-plans' },
  { label: 'หน่วยบริการหอพัก', to: '/info/units' },
]

const topMenus: TopMenu[] = [
  { label: 'หน้าหลัก', to: '/', activePrefixes: [] },
  { label: 'หอพัก', items: dormItems, activePrefixes: ['/rooms'] },
  { label: 'บริการออนไลน์', items: serviceItems, activePrefixes: ['/services'] },
  { label: 'ประกาศ', to: '/announcements', activePrefixes: ['/announcements'] },
  { label: 'ข้อมูลเกี่ยวกับหอพักนักศึกษา', items: infoItems, activePrefixes: ['/info', '/guide', '/campaigns'] },
  { label: 'โครงสร้างบุคลากร', to: '/personnel', activePrefixes: ['/personnel'] },
  { label: 'ติดต่อ', to: '/contact', activePrefixes: ['/contact'] },
]

const mobileSections: { label?: string; items: MenuItem[] }[] = [
  { items: [{ label: 'หน้าหลัก', to: '/' }] },
  { label: 'หอพัก', items: dormItems },
  { label: 'บริการออนไลน์', items: serviceItems },
  { items: [{ label: 'ประกาศ', to: '/announcements' }] },
  { label: 'ข้อมูลเกี่ยวกับหอพักนักศึกษา', items: infoItems },
  { items: [{ label: 'โครงสร้างบุคลากร', to: '/personnel' }, { label: 'ติดต่อ', to: '/contact' }] },
]

const avatarInitials = computed(() => {
  const parts = session.currentUser?.displayName.trim().split(/\s+/).filter(Boolean) ?? []
  return parts.length > 0 ? parts.slice(0, 2).map(part => part.charAt(0)).join('') : 'ผู้ใช้'
})

const accountIdentifier = computed(() => {
  if (!session.currentUser) return ''
  if (session.currentUser.role === 'applicant') {
    return session.currentUser.studentId ?? 'ยังไม่มีรหัสนักศึกษา'
  }
  return `รหัสเจ้าหน้าที่ ${session.currentUser.id}`
})

function isMenuActive(menu: TopMenu) {
  if (menu.to === '/') return route.path === '/'
  return menu.activePrefixes.some(prefix => route.path === prefix || route.path.startsWith(`${prefix}/`))
}

function isNavItemActive(to: RouteLocationRaw) {
  if (typeof to === 'string') return route.path === to
  if (typeof to === 'object' && to !== null && 'path' in to && to.path) {
    if (route.path !== to.path) return false
    const query = (to as { query?: Record<string, string> }).query
    return !query || Object.entries(query).every(([key, value]) => route.query[key] === value)
  }
  return false
}

function navigate(to: RouteLocationRaw) {
  mobileOpen.value = false
  router.push(to)
}

function requestLogin() {
  mobileOpen.value = false
  emit('requestLogin')
}

function goToPortal() {
  mobileOpen.value = false
  router.push(session.isStaff ? '/staff' : '/app')
}

function switchLang(lang: string) {
  if (lang === 'en') toast('English interface อยู่ในแผนเฟสถัดไป (Future scope ตามเอกสาร)')
}

function linkKkuAccount() {
  if (!session.linkCurrentUserToKkuSso()) return
  toast.success('เชื่อม KKU SSO แบบจำลองแล้ว โดยคงข้อมูลใบสมัครและการจองเดิมไว้')
}

function logout() {
  profileOpen.value = false
  logoutAndResetDemoData()
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
    <div class="mx-auto flex h-16 w-full max-w-352 items-center gap-2 px-3 sm:gap-4 sm:px-5">
      <RouterLink
        to="/"
        class="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="กลับหน้าหลักเว็บไซต์หอพักในกำกับ มหาวิทยาลัยขอนแก่น"
      >
        <img :src="kkuEmblem" alt="" class="h-9 w-auto shrink-0 sm:h-10" />
        <span class="hidden min-w-0 leading-tight sm:block xl:hidden min-[1700px]:block">
          <span class="block truncate text-[15px] font-bold text-kku-red">หอพักในกำกับ มหาวิทยาลัยขอนแก่น</span>
          <span class="block text-xs text-muted-foreground">ระบบจัดการจองหอพัก</span>
        </span>
      </RouterLink>

      <nav class="mx-auto hidden items-center gap-0.5 text-sm font-medium xl:flex" aria-label="เมนูเว็บไซต์หอพัก">
        <template v-for="menu in topMenus" :key="menu.label">
          <RouterLink
            v-if="menu.to"
            :to="menu.to"
            class="rounded-md px-3 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="isMenuActive(menu) ? 'font-semibold text-primary' : 'text-foreground/75'"
          >
            {{ menu.label }}
          </RouterLink>

          <DropdownMenu v-else>
            <DropdownMenuTrigger
              class="flex items-center gap-1 rounded-md px-3 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="isMenuActive(menu) ? 'font-semibold text-primary' : 'text-foreground/75'"
            >
              {{ menu.label }}
              <ChevronDownIcon class="size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="min-w-64">
              <DropdownMenuItem
                v-for="item in menu.items"
                :key="item.label"
                class="cursor-pointer"
                @click="navigate(item.to)"
              >
                <span class="flex flex-col">
                  {{ item.label }}
                  <span v-if="item.hint" class="text-xs text-muted-foreground">{{ item.hint }}</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </nav>

      <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger class="hidden items-center gap-1 rounded-full px-3 py-2 text-sm font-medium hover:bg-muted lg:flex">
            <GlobeIcon class="size-4" aria-hidden="true" /> TH
            <ChevronDownIcon class="size-3.5" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem class="cursor-pointer" @click="switchLang('th')">TH — ไทย</DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer" @click="switchLang('en')">EN — English</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <Button
          v-if="!session.isLoggedIn"
          class="hidden rounded-full sm:inline-flex"
          @click="requestLogin"
        >
          เข้าสู่ระบบ
        </Button>
        <Button
          v-else
          size="sm"
          variant="outline"
          class="rounded-full px-2.5 text-xs sm:px-3 sm:text-sm"
          @click="goToPortal"
        >
          {{ session.isStaff ? 'พื้นที่เจ้าหน้าที่' : 'การจองของฉัน' }}
        </Button>

        <Popover v-if="session.isLoggedIn" v-model:open="profileOpen">
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              class="h-10 max-w-36 gap-2 rounded-full px-1 sm:px-2"
              :aria-label="`เปิดเมนูบัญชี ${accountIdentifier}`"
            >
              <Avatar class="size-8 shrink-0">
                <AvatarFallback class="bg-primary/10 text-xs font-semibold text-primary">{{ avatarInitials }}</AvatarFallback>
              </Avatar>
              <span class="hidden min-w-0 truncate text-xs font-medium text-muted-foreground sm:block">
                {{ accountIdentifier }}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" :side-offset="8" class="w-[min(22rem,calc(100vw-1rem))] p-0">
            <div class="space-y-3 p-4">
              <div class="flex items-start gap-3">
                <Avatar class="size-10 shrink-0">
                  <AvatarFallback class="bg-primary/10 font-semibold text-primary">{{ avatarInitials }}</AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold">{{ session.currentUser?.displayName }}</p>
                  <p class="truncate text-xs text-muted-foreground">{{ session.currentUser?.email }}</p>
                  <p class="mt-0.5 text-xs text-muted-foreground">{{ accountIdentifier }}</p>
                </div>
              </div>

              <div v-if="!session.isStaff" class="grid gap-2 rounded-lg bg-muted p-3 text-xs">
                <div class="flex items-center justify-between gap-3">
                  <span class="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MailCheckIcon class="size-3.5" aria-hidden="true" /> อีเมลส่วนตัว
                  </span>
                  <Badge variant="success">ยืนยันแล้ว</Badge>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="inline-flex items-center gap-1.5 text-muted-foreground">
                    <LinkIcon class="size-3.5" aria-hidden="true" /> KKU SSO
                  </span>
                  <Badge :variant="session.currentUser?.kkuSsoLinked ? 'success' : 'outline'">
                    {{ session.currentUser?.kkuSsoLinked ? 'เชื่อมแล้ว' : 'ยังไม่เชื่อม' }}
                  </Badge>
                </div>
              </div>

              <Button
                v-if="!session.isStaff && !session.currentUser?.kkuSsoLinked"
                variant="outline"
                class="w-full"
                @click="linkKkuAccount"
              >
                <LinkIcon aria-hidden="true" /> เชื่อม KKU SSO ภายหลัง (จำลอง)
              </Button>
              <p
                v-else-if="!session.isStaff"
                class="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle2Icon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                บัญชีนี้ยังเข้าสู่ระบบด้วยอีเมลส่วนตัวได้ และข้อมูลเดิมถูกเก็บในบัญชีเดียวกัน
              </p>
            </div>
            <Separator />
            <div class="grid gap-1 p-2">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="ghost" class="justify-start">
                    <RotateCcwIcon aria-hidden="true" /> รีเซตข้อมูลทดสอบ
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>เริ่มการทดสอบใหม่?</AlertDialogTitle>
                    <AlertDialogDescription>
                      ข้อมูลจำลองที่เปลี่ยนทั้งหมดจะกลับเป็นค่าเริ่มต้น และคุณจะออกจากระบบ
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction @click="resetDemoData">รีเซตและเริ่มใหม่</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" class="justify-start" @click="logout">
                <LogOutIcon aria-hidden="true" /> ออกจากระบบ
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Sheet v-model:open="mobileOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="xl:hidden" aria-label="เปิดเมนูเว็บไซต์หอพัก">
              <MenuIcon aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle class="text-left text-kku-red">หอพักในกำกับ มข.</SheetTitle>
            </SheetHeader>
            <nav class="flex flex-col px-3 pb-6" aria-label="เมนูเว็บไซต์หอพักบนมือถือ">
              <template v-for="(section, index) in mobileSections" :key="section.label ?? `section-${index}`">
                <div v-if="index > 0" class="my-2 border-t" aria-hidden="true" />
                <p v-if="section.label" class="px-3 pb-1.5 pt-1 text-[11px] font-semibold text-primary">
                  {{ section.label }}
                </p>
                <button
                  v-for="item in section.items"
                  :key="item.label"
                  type="button"
                  class="rounded-lg px-3 py-2 text-left text-sm leading-snug transition-colors"
                  :class="isNavItemActive(item.to)
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'"
                  @click="navigate(item.to)"
                >
                  {{ item.label }}
                </button>
              </template>

              <Button v-if="!session.isLoggedIn" class="mt-4 rounded-full" @click="requestLogin">
                เข้าสู่ระบบ
              </Button>
              <Button v-else class="mt-4 rounded-full" variant="outline" @click="goToPortal">
                {{ session.isStaff ? 'พื้นที่เจ้าหน้าที่' : 'การจองของฉัน' }}
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>
