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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
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

const props = withDefaults(defineProps<{
  context?: 'public' | 'applicant'
}>(), {
  context: 'public',
})

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const mobileOpen = ref(false)
const profileOpen = ref(false)
const isApplicantContext = computed(() => props.context === 'applicant')

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
  const nameInitials = parts.length > 0
    ? parts.slice(0, 2).map(part => part.charAt(0)).join('')
    : 'ผู้ใช้'
  if (session.currentUser?.role !== 'applicant') return nameInitials
  const studentIdDigits = session.currentUser.studentId?.replace(/\D/g, '') ?? ''
  return studentIdDigits.length >= 2 ? studentIdDigits.slice(0, 2) : nameInitials
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
  mobileOpen.value = false
  profileOpen.value = false
  logoutAndResetDemoData()
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
    <div
      class="mx-auto flex h-16 w-full max-w-352 items-center gap-2 px-3 sm:gap-4 sm:px-5 min-[1440px]:grid min-[1440px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2 min-[1440px]:flex-none">
        <RouterLink
          to="/"
          class="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="กลับหน้าหลักเว็บไซต์หอพักในกำกับ มหาวิทยาลัยขอนแก่น"
        >
          <img :src="kkuEmblem" alt="" class="h-9 w-auto shrink-0 sm:h-10" />
          <span v-if="!isApplicantContext" class="hidden min-w-0 leading-tight sm:block">
            <span class="block truncate text-[15px] font-bold text-kku-red">หอพักในกำกับ มหาวิทยาลัยขอนแก่น</span>
            <span class="block text-xs text-muted-foreground">ระบบจัดการจองหอพัก</span>
          </span>
          <span v-else class="hidden min-w-0 leading-tight lg:block">
            <span class="block truncate text-[15px] font-bold text-kku-red">หอพักในกำกับ มหาวิทยาลัยขอนแก่น</span>
            <span class="block text-xs text-muted-foreground">ระบบจัดการจองหอพัก</span>
          </span>
        </RouterLink>
        <span
          v-if="isApplicantContext"
          class="min-w-0 truncate text-sm font-semibold text-foreground lg:hidden"
        >
          หอพักและการจอง
        </span>
      </div>

      <nav
        class="hidden items-center gap-0.5 whitespace-nowrap text-[13px] font-medium min-[1440px]:flex min-[1700px]:text-sm"
        aria-label="เมนูเว็บไซต์หอพัก"
      >
        <template v-for="menu in topMenus" :key="menu.label">
          <RouterLink
            v-if="menu.to"
            :to="menu.to"
            class="rounded-md px-2 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1700px]:px-3"
            :class="isMenuActive(menu) ? 'font-semibold text-primary' : 'text-foreground/75'"
          >
            {{ menu.label }}
          </RouterLink>

          <DropdownMenu v-else>
            <DropdownMenuTrigger
              class="flex items-center gap-1 rounded-md px-2 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1700px]:px-3"
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

      <div class="flex shrink-0 items-center gap-1 sm:gap-1.5 min-[1440px]:justify-self-end">
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
          v-else-if="!isApplicantContext"
          size="sm"
          variant="outline"
          class="rounded-full px-2.5 text-xs sm:px-3 sm:text-sm"
          @click="goToPortal"
        >
          {{ session.isStaff ? 'พื้นที่เจ้าหน้าที่' : 'ไปเลือกห้องพัก' }}
        </Button>

        <Popover v-if="session.isLoggedIn" v-model:open="profileOpen">
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="rounded-full"
              :aria-label="`เปิดเมนูบัญชี ${accountIdentifier}`"
            >
              <Avatar class="size-8 shrink-0">
                <AvatarFallback class="bg-primary/10 text-xs font-semibold text-primary">{{ avatarInitials }}</AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            :side-offset="8"
            class="max-h-[calc(100dvh-5rem)] w-[min(17.5rem,calc(100vw-1rem))] overflow-y-auto p-0 sm:w-[min(22rem,calc(100vw-1rem))]"
          >
            <div class="space-y-2 p-3 sm:space-y-3 sm:p-4">
              <Item size="sm" class="flex-nowrap border-0 p-0">
                <ItemMedia>
                  <Avatar class="size-9 shrink-0 sm:size-10">
                    <AvatarFallback class="bg-primary/10 font-semibold text-primary">{{ avatarInitials }}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent class="min-w-0">
                  <ItemTitle class="max-w-full truncate font-semibold">{{ session.currentUser?.displayName }}</ItemTitle>
                  <ItemDescription class="line-clamp-none break-all text-xs">
                    {{ session.currentUser?.email }}<br>{{ accountIdentifier }}
                  </ItemDescription>
                </ItemContent>
              </Item>

              <div v-if="!session.isStaff" class="grid gap-1">
                <Item size="xs" variant="muted" class="flex-nowrap">
                  <ItemMedia variant="icon"><MailCheckIcon aria-hidden="true" /></ItemMedia>
                  <ItemContent><ItemTitle class="text-xs text-muted-foreground">อีเมลส่วนตัว</ItemTitle></ItemContent>
                  <ItemActions><Badge variant="success">ยืนยันแล้ว</Badge></ItemActions>
                </Item>
                <Item size="xs" variant="muted" class="flex-nowrap">
                  <ItemMedia variant="icon"><LinkIcon aria-hidden="true" /></ItemMedia>
                  <ItemContent><ItemTitle class="text-xs text-muted-foreground">KKU SSO</ItemTitle></ItemContent>
                  <ItemActions>
                    <Badge :variant="session.currentUser?.kkuSsoLinked ? 'success' : 'outline'">
                      {{ session.currentUser?.kkuSsoLinked ? 'เชื่อมแล้ว' : 'ยังไม่เชื่อม' }}
                    </Badge>
                  </ItemActions>
                </Item>
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
            <div class="grid gap-0.5 p-1.5 sm:gap-1 sm:p-2">
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
            <Button
              variant="ghost"
              size="icon"
              :class="isApplicantContext
                ? 'hidden min-[1024px]:inline-flex min-[1440px]:hidden'
                : 'min-[1440px]:hidden'"
              aria-label="เปิดเมนูเว็บไซต์หอพัก"
            >
              <MenuIcon aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="w-80 gap-0 overflow-hidden p-0">
            <SheetHeader>
              <SheetTitle class="text-left text-kku-red">หอพักในกำกับ มข.</SheetTitle>
            </SheetHeader>
            <nav
              class="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4"
              aria-label="เมนูเว็บไซต์หอพักบนมือถือ"
            >
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

              <template v-if="!isApplicantContext">
                <Button v-if="!session.isLoggedIn" class="mt-4 rounded-full" @click="requestLogin">
                  เข้าสู่ระบบ
                </Button>
              </template>
            </nav>

            <div
              v-if="session.isLoggedIn"
              class="border-t bg-muted/30 p-3 pb-[calc(env(safe-area-inset-bottom)_+_0.75rem)]"
            >
              <Button
                variant="outline"
                class="min-h-11 w-full justify-start bg-background"
                @click="logout"
              >
                <LogOutIcon aria-hidden="true" />
                ออกจากระบบ
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>
