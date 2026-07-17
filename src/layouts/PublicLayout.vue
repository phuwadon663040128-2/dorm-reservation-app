<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { toast } from 'vue-sonner'
import { ChevronDownIcon, GlobeIcon, MenuIcon } from '@lucide/vue'
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import ThemeToggle from '@/components/domain/ThemeToggle.vue'
import { onlineServices } from '@/fixtures/services'
import { useSessionStore } from '@/stores/session'
import kkuEmblem from '@/assets/kku-emblem.png'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()

const mobileOpen = ref(false)

// โครงเมนูเรียงตามความสำคัญ: หน้าหลัก · หอพัก▾ · บริการออนไลน์▾ · ประกาศ · ข้อมูลหอพัก▾ · โครงสร้างบุคลากร · ติดต่อ
interface MenuItem { label: string; to: RouteLocationRaw; hint?: string }

const dormItems: MenuItem[] = [
  { label: 'วรเรสซิเดนซ์ (หอพัก 8 หลัง)', to: { path: '/rooms', query: { dorm: 'dorm-8-lang' } } },
  { label: 'หอพักวรอินเตอร์ (4 หลัง)', to: { path: '/rooms', query: { dorm: 'dorm-wor-inter' } } },
]

const serviceItems: MenuItem[] = [
  { label: 'บริการออนไลน์ทั้งหมด', to: '/services' },
  ...onlineServices.map(s => ({ label: s.title, to: `/services/${s.id}` })),
]

const infoItems: MenuItem[] = [
  { label: 'คู่มือการจองหอพักออนไลน์', to: '/guide' },
  { label: 'กฎระเบียบหอพักนักศึกษา', to: '/info/rules' },
  { label: 'อัตราค่าธรรมเนียมหอพัก', to: '/info/fees' },
  { label: 'แผนผังหอพักนักศึกษา', to: '/info/floor-plans' },
  { label: 'หน่วยบริการหอพัก', to: '/info/units' },
]

/** เมนูบนสุด — เมนูเดี่ยวมี to · เมนู dropdown มี items · activePrefixes กำหนดเงื่อนไขขีดเส้นใต้ */
interface TopMenu {
  label: string
  to?: RouteLocationRaw
  items?: MenuItem[]
  activePrefixes: string[]
}

const topMenus: TopMenu[] = [
  { label: 'หน้าหลัก', to: '/', activePrefixes: [] },
  { label: 'หอพัก', items: dormItems, activePrefixes: ['/rooms'] },
  { label: 'บริการออนไลน์', items: serviceItems, activePrefixes: ['/services'] },
  { label: 'ประกาศ', to: '/announcements', activePrefixes: ['/announcements'] },
  { label: 'ข้อมูลเกี่ยวกับหอพักนักศึกษา', items: infoItems, activePrefixes: ['/info', '/guide', '/campaigns'] },
  { label: 'โครงสร้างบุคลากร', to: '/personnel', activePrefixes: ['/personnel'] },
  { label: 'ติดต่อ', to: '/contact', activePrefixes: ['/contact'] },
]

function isMenuActive(menu: TopMenu) {
  if (menu.to === '/') return route.path === '/'
  return menu.activePrefixes.some(p => route.path === p || route.path.startsWith(p + '/') || route.path.startsWith(p))
}

// เมนูมือถือแบ่งเป็นหมวดเดียวกับเดสก์ท็อป เรียงตามความสำคัญ — หมวดไม่มีป้าย = ลิงก์เดี่ยว
const mobileSections: { label?: string; items: MenuItem[] }[] = [
  { items: [{ label: 'หน้าหลัก', to: '/' }] },
  { label: 'หอพัก', items: dormItems },
  { label: 'บริการออนไลน์', items: serviceItems },
  { items: [{ label: 'ประกาศ', to: '/announcements' }] },
  { label: 'ข้อมูลเกี่ยวกับหอพักนักศึกษา', items: infoItems },
  { items: [{ label: 'โครงสร้างบุคลากร', to: '/personnel' }, { label: 'ติดต่อ', to: '/contact' }] },
]

// ไฮไลต์รายการเมนูมือถือที่ตรงกับหน้าปัจจุบัน (ลิงก์หอพักเทียบ query dorm ด้วย)
function isNavItemActive(to: RouteLocationRaw) {
  if (typeof to === 'string') return route.path === to
  if (typeof to === 'object' && to !== null && 'path' in to && to.path) {
    if (route.path !== to.path) return false
    const q = (to as { query?: Record<string, string> }).query
    if (!q) return true
    return Object.entries(q).every(([k, v]) => route.query[k] === v)
  }
  return false
}

function goToPortal() {
  router.push(session.isStaff ? '/staff' : '/app')
}

function switchLang(lang: string) {
  if (lang === 'en') toast('English interface อยู่ในแผนเฟสถัดไป (Future scope ตามเอกสาร)')
}

function navigate(to: RouteLocationRaw) {
  mobileOpen.value = false
  router.push(to)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-16 w-full max-w-352 items-center justify-between gap-4 px-3 sm:px-5">
        <!-- โลโก้ + ชื่อระบบ -->
        <RouterLink to="/" class="flex min-w-0 items-center gap-2.5">
          <img :src="kkuEmblem" alt="ตรามหาวิทยาลัยขอนแก่น" class="h-10 w-auto shrink-0" />
          <span class="min-w-0 leading-tight">
            <span class="block truncate text-[15px] font-bold text-kku-red">
              หอพักในกำกับ มหาวิทยาลัยขอนแก่น
            </span>
            <span class="block text-xs text-muted-foreground">ระบบจัดการจองหอพัก</span>
          </span>
        </RouterLink>

        <!-- เมนูหลัก (เดสก์ท็อป) — สถานะ active ใช้ขีดเส้นใต้สีหลัก -->
        <nav class="hidden items-center gap-0.5 text-sm font-medium xl:flex" aria-label="เมนูหลัก">
          <template v-for="menu in topMenus" :key="menu.label">
            <!-- ลิงก์เดี่ยว -->
            <RouterLink
              v-if="menu.to"
              :to="menu.to"
              class="px-3 py-2 transition-colors hover:text-primary"
              :class="isMenuActive(menu) ? 'font-semibold text-primary' : 'text-foreground/75'"
            >
              <span class="relative">
                {{ menu.label }}
                <span v-if="isMenuActive(menu)" class="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
              </span>
            </RouterLink>

            <!-- เมนูแบบ dropdown — ขีดเส้นใต้ผูกกับ "ข้อความ" เท่านั้น (ไม่รวมไอคอน ▾) จึงอยู่กึ่งกลางคำ -->
            <DropdownMenu v-else>
              <DropdownMenuTrigger
                class="flex items-center gap-1 px-3 py-2 transition-colors hover:text-primary"
                :class="isMenuActive(menu) ? 'font-semibold text-primary' : 'text-foreground/75'"
              >
                <span class="relative">
                  {{ menu.label }}
                  <span v-if="isMenuActive(menu)" class="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
                </span>
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

        <!-- ฝั่งขวา -->
        <div class="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger class="hidden items-center gap-1 rounded-full px-3 py-2 text-sm font-medium hover:bg-muted sm:flex">
              <GlobeIcon class="size-4" aria-hidden="true" /> TH
              <ChevronDownIcon class="size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem class="cursor-pointer" @click="switchLang('th')">TH — ไทย</DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="switchLang('en')">EN — English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <!-- ภาษาเดียวกับปุ่มค้นหาห้องหน้าแรก: ยกตัว+เงาตอน hover · กดจมตอน active -->
          <Button
            v-if="!session.isLoggedIn"
            class="hidden rounded-full duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/40 hover:brightness-105 active:translate-y-0 active:bg-primary active:shadow-none active:brightness-95 sm:inline-flex"
            @click="router.push('/login')"
          >
            เข้าสู่ระบบ
          </Button>
          <Button v-else class="hidden rounded-full sm:inline-flex" variant="outline" @click="goToPortal">
            {{ session.isStaff ? 'พื้นที่เจ้าหน้าที่' : 'การจองของฉัน' }}
          </Button>

          <!-- เมนูมือถือ -->
          <Sheet v-model:open="mobileOpen">
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon" class="xl:hidden" aria-label="เปิดเมนู">
                <MenuIcon aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" class="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle class="text-left text-kku-red">หอพักในกำกับ มข.</SheetTitle>
              </SheetHeader>
              <!-- เมนูแบ่งหมวดด้วยเส้นคั่น + ป้ายหมวดสีหลัก · รายการกะทัดรัด text-sm · ไฮไลต์หน้าปัจจุบัน -->
              <nav class="flex flex-col px-3 pb-6" aria-label="เมนูหลัก (มือถือ)">
                <template v-for="(sec, i) in mobileSections" :key="sec.label ?? `sec-${i}`">
                  <div v-if="i > 0" class="my-2 border-t" aria-hidden="true" />
                  <p
                    v-if="sec.label"
                    class="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-primary"
                  >
                    {{ sec.label }}
                  </p>
                  <button
                    v-for="item in sec.items"
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

                <Button v-if="!session.isLoggedIn" class="mt-4 rounded-full" @click="navigate('/login')">
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

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t">
      <div class="mx-auto flex w-full max-w-352 flex-col gap-2 px-3 py-5 text-sm sm:px-5 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span class="font-bold">หอพักในกำกับ มหาวิทยาลัยขอนแก่น</span>
          <span class="ml-3 text-muted-foreground">กองบริการหอพักนักศึกษา</span>
        </p>
        <p class="text-muted-foreground">043-204-303 · dormitory@kku.ac.th · จันทร์–ศุกร์ 08:30–16:30 น.</p>
      </div>
      <p class="pb-4 text-center text-xs text-muted-foreground/70">
        ต้นแบบระบบ (Interactive Prototype) — ข้อมูลทั้งหมดเป็นข้อมูลสมมติ
      </p>
    </footer>
  </div>
</template>
