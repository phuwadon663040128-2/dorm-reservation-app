<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import {
  ChevronDownIcon,
  GlobeIcon,
  LogOutIcon,
  MenuIcon,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/domain/ThemeToggle.vue'
import kkuEmblem from '@/assets/kku-emblem-40.webp'
import { logoutAndResetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'

// These overlay trees are not needed for the first public paint. Their code is
// fetched only when an authenticated account menu or the mobile drawer renders.
const GlobalAccountMenu = defineAsyncComponent(() => import('@/components/domain/GlobalAccountMenu.vue'))
const Sheet = defineAsyncComponent(() => import('@/components/ui/sheet').then(module => module.Sheet))
const SheetContent = defineAsyncComponent(() => import('@/components/ui/sheet').then(module => module.SheetContent))
const SheetHeader = defineAsyncComponent(() => import('@/components/ui/sheet').then(module => module.SheetHeader))
const SheetTitle = defineAsyncComponent(() => import('@/components/ui/sheet').then(module => module.SheetTitle))

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
const headerRef = ref<HTMLElement | null>(null)
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
  { label: 'บิลค่าน้ำ-ค่าไฟ', to: '/services/utilities' },
  { label: 'แจ้งซ่อมออนไลน์', to: '/services/maintenance' },
  { label: 'แจ้งรับพัสดุ(ไปรษณีย์ไทย)', to: '/services/parcel' },
]

const topMenus: TopMenu[] = [
  { label: 'หน้าหลัก', to: '/', activePrefixes: [] },
  { label: 'หอพัก', items: dormItems, activePrefixes: ['/rooms'] },
  { label: 'บริการออนไลน์', items: serviceItems, activePrefixes: ['/services'] },
  { label: 'ประกาศ', to: '/announcements', activePrefixes: ['/announcements'] },
  { label: 'ติดต่อ', to: '/contact', activePrefixes: ['/contact'] },
]

const mobileSections: { label?: string; items: MenuItem[] }[] = [
  { items: [{ label: 'หน้าหลัก', to: '/' }] },
  { label: 'หอพัก', items: dormItems },
  { label: 'บริการออนไลน์', items: serviceItems },
  { items: [{ label: 'ประกาศ', to: '/announcements' }] },
  { items: [{ label: 'ติดต่อ', to: '/contact' }] },
]

function isMenuActive(menu: TopMenu) {
  if (menu.to === '/') return route.path === '/'
  if (
    session.isLoggedIn
    && !session.isStaff
    && route.path === '/app/rooms'
    && menu.activePrefixes.includes('/rooms')
  ) return true
  return menu.activePrefixes.some(prefix => route.path === prefix || route.path.startsWith(`${prefix}/`))
}

function portalAwareDestination(to: RouteLocationRaw): RouteLocationRaw {
  if (
    session.isLoggedIn
    && !session.isStaff
    && typeof to === 'object'
    && to !== null
    && 'path' in to
    && to.path === '/rooms'
  ) {
    return { ...to, path: '/app/rooms' }
  }
  return to
}

function isNavItemActive(to: RouteLocationRaw) {
  const destination = portalAwareDestination(to)
  if (typeof destination === 'string') return route.path === destination
  if (typeof destination === 'object' && destination !== null && 'path' in destination && destination.path) {
    if (route.path !== destination.path) return false
    const query = (destination as { query?: Record<string, string> }).query
    return !query || Object.entries(query).every(([key, value]) => route.query[key] === value)
  }
  return false
}

function closeDesktopMenus(except?: HTMLDetailsElement) {
  const openMenus = headerRef.value?.querySelectorAll<HTMLDetailsElement>(
    'details[data-header-dropdown][open]',
  )
  openMenus?.forEach((menu) => {
    if (menu !== except) menu.open = false
  })
}

function handleDropdownToggle(event: Event) {
  const menu = event.currentTarget as HTMLDetailsElement
  if (menu.open) closeDesktopMenus(menu)
}

function handleDropdownClick(event: MouseEvent) {
  const summary = event.currentTarget as HTMLElement
  const menu = summary.closest('details') as HTMLDetailsElement | null
  if (menu && !menu.open) closeDesktopMenus(menu)
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  const openMenus = headerRef.value?.querySelectorAll<HTMLDetailsElement>(
    'details[data-header-dropdown][open]',
  )
  openMenus?.forEach((menu) => {
    if (!menu.contains(target)) menu.open = false
  })
}

function handleDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDesktopMenus()
}

function navigate(to: RouteLocationRaw) {
  mobileOpen.value = false
  closeDesktopMenus()
  router.push(portalAwareDestination(to))
}

function requestLogin() {
  mobileOpen.value = false
  closeDesktopMenus()
  emit('requestLogin')
}

function goToPortal() {
  mobileOpen.value = false
  closeDesktopMenus()
  router.push(session.isStaff ? '/staff' : '/app')
}

async function switchLang(lang: string) {
  closeDesktopMenus()
  const { toast } = await import('vue-sonner')
  if (lang === 'en') toast('English interface อยู่ในแผนเฟสถัดไป (Future scope ตามเอกสาร)')
}

function logout() {
  mobileOpen.value = false
  closeDesktopMenus()
  logoutAndResetDemoData()
}

watch(() => route.fullPath, () => closeDesktopMenus())

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeyDown)
})
</script>

<template>
  <header
    ref="headerRef"
    class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"
    @keydown.esc="closeDesktopMenus()"
  >
    <div
      class="mx-auto flex h-16 w-full max-w-352 items-center gap-2 px-3 sm:gap-4 sm:px-5 min-[1440px]:grid min-[1440px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2 min-[1440px]:flex-none">
        <RouterLink
          to="/"
          class="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="กลับหน้าหลักเว็บไซต์หอพักในกำกับ มหาวิทยาลัยขอนแก่น"
        >
          <img :src="kkuEmblem" alt="" width="40" height="71" class="h-9 w-auto shrink-0 sm:h-10" />
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
        class="relative z-10 hidden items-center gap-2 whitespace-nowrap text-[13px] font-medium min-[1440px]:flex min-[1700px]:gap-3 min-[1700px]:text-sm"
        aria-label="เมนูเว็บไซต์หอพัก"
      >
        <template v-for="menu in topMenus" :key="menu.label">
          <RouterLink
            v-if="menu.to"
            :to="menu.to"
            :data-testid="menu.to === '/contact' ? 'top-nav-contact' : undefined"
            class="top-nav-item rounded-md px-3 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1700px]:px-4"
            :class="isMenuActive(menu) ? 'font-semibold text-primary' : 'text-foreground/75'"
            :data-active="isMenuActive(menu) || undefined"
            :aria-current="isMenuActive(menu) ? 'page' : undefined"
            @click="closeDesktopMenus()"
          >
            <span class="top-nav-label">{{ menu.label }}</span>
          </RouterLink>

          <details
            v-else
            data-header-dropdown
            class="group relative"
            @toggle="handleDropdownToggle"
          >
            <summary
              class="top-nav-item flex cursor-pointer list-none items-center gap-1.5 rounded-md px-3 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1700px]:px-4 [&::-webkit-details-marker]:hidden"
              :class="isMenuActive(menu) ? 'font-semibold text-primary' : 'text-foreground/75'"
              :data-active="isMenuActive(menu) || undefined"
              :aria-current="isMenuActive(menu) ? 'location' : undefined"
              @click="handleDropdownClick"
            >
              <span class="top-nav-label">{{ menu.label }}</span>
              <ChevronDownIcon class="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div class="absolute left-0 top-full z-50 mt-1 min-w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <button
                v-for="item in menu.items"
                :key="item.label"
                type="button"
                class="flex w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                @click="navigate(item.to)"
              >
                <span class="flex flex-col">
                  {{ item.label }}
                  <span v-if="item.hint" class="text-xs text-muted-foreground">{{ item.hint }}</span>
                </span>
              </button>
            </div>
          </details>
        </template>
      </nav>

      <div class="flex shrink-0 items-center gap-1 sm:gap-1.5 min-[1440px]:justify-self-end">
        <details
          data-header-dropdown
          class="group relative hidden lg:block"
          @toggle="handleDropdownToggle"
        >
          <summary
            class="flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
            @click="handleDropdownClick"
          >
            <GlobeIcon class="size-4" aria-hidden="true" /> TH
            <ChevronDownIcon class="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div class="absolute right-0 top-full z-50 mt-1 min-w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            <button type="button" class="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" @click="switchLang('th')">TH — ไทย</button>
            <button type="button" class="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" @click="switchLang('en')">EN — English</button>
          </div>
        </details>

        <ThemeToggle />

        <Button
          v-if="!session.isLoggedIn"
          data-testid="login-open"
          class="hidden rounded-full hover:-translate-y-px hover:bg-primary/90 hover:shadow-md sm:inline-flex"
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

        <GlobalAccountMenu v-if="session.isLoggedIn" @logout="logout" />

        <Button
          variant="ghost"
          size="icon"
          :class="isApplicantContext
            ? 'hidden min-[1024px]:inline-flex min-[1440px]:hidden'
            : 'min-[1440px]:hidden'"
          aria-label="เปิดเมนูเว็บไซต์หอพัก"
          @click="mobileOpen = true"
        >
          <MenuIcon aria-hidden="true" />
        </Button>

        <Sheet v-if="mobileOpen" v-model:open="mobileOpen">
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
                <Button
                  v-if="!session.isLoggedIn"
                  class="mt-4 rounded-full hover:-translate-y-px hover:bg-primary/90 hover:shadow-md"
                  @click="requestLogin"
                >
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
