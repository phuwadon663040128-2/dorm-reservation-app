<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
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
import { useDormStore } from '@/stores/dorm'
import { useSessionStore } from '@/stores/session'
import kkuEmblem from '@/assets/kku-emblem.png'

const session = useSessionStore()
const dorm = useDormStore()
const router = useRouter()
const route = useRoute()

const mobileOpen = ref(false)

const navLinks = [
  { to: '/', label: 'หน้าหลัก' },
  { to: '/rooms', label: 'หอพัก' },
  { to: '/announcements', label: 'ประกาศ' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}

function goToPortal() {
  router.push(session.isStaff ? '/staff' : '/app')
}

function switchLang(lang: string) {
  if (lang === 'en') toast('English interface อยู่ในแผนเฟสถัดไป (Future scope ตามเอกสาร)')
}

function navigate(to: string) {
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

        <!-- เมนูหลัก (เดสก์ท็อป) -->
        <nav class="hidden items-center gap-1 text-sm font-medium xl:flex" aria-label="เมนูหลัก">
          <RouterLink
            v-for="item in navLinks"
            :key="item.to"
            :to="item.to"
            class="rounded-full px-4 py-2 transition-colors"
            :class="isActive(item.to) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
          >
            {{ item.label }}
          </RouterLink>

          <DropdownMenu>
            <DropdownMenuTrigger class="flex items-center gap-1 rounded-full px-4 py-2 hover:bg-muted">
              บริการออนไลน์ <ChevronDownIcon class="size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem class="cursor-pointer" @click="navigate('/login')">เข้าสู่ระบบ</DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="navigate('/register')">สมัครสมาชิก</DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="navigate('/app/reservation')">ติดตามการจองของฉัน</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger class="flex items-center gap-1 rounded-full px-4 py-2 hover:bg-muted">
              ข้อมูลเกี่ยวกับหอพักนักศึกษา <ChevronDownIcon class="size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                v-for="c in dorm.campaigns"
                :key="c.id"
                class="cursor-pointer"
                @click="navigate(`/campaigns/${c.id}`)"
              >
                {{ c.name }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <RouterLink
            to="/personnel"
            class="rounded-full px-4 py-2 transition-colors"
            :class="isActive('/personnel') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
          >
            โครงสร้างบุคลากร
          </RouterLink>
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

          <Button v-if="!session.isLoggedIn" class="hidden rounded-full sm:inline-flex" @click="router.push('/login')">
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
            <SheetContent side="right" class="w-72">
              <SheetHeader>
                <SheetTitle class="text-left text-kku-red">หอพักในกำกับ มข.</SheetTitle>
              </SheetHeader>
              <nav class="flex flex-col gap-1 px-4 pb-6" aria-label="เมนูหลัก (มือถือ)">
                <Button
                  v-for="item in [...navLinks, { to: '/personnel', label: 'โครงสร้างบุคลากร' }]"
                  :key="item.to"
                  variant="ghost"
                  class="justify-start"
                  @click="navigate(item.to)"
                >
                  {{ item.label }}
                </Button>
                <Button
                  v-for="c in dorm.campaigns"
                  :key="c.id"
                  variant="ghost"
                  class="h-auto justify-start whitespace-normal py-2 text-left text-muted-foreground"
                  @click="navigate(`/campaigns/${c.id}`)"
                >
                  {{ c.name }}
                </Button>
                <Button v-if="!session.isLoggedIn" class="mt-2 rounded-full" @click="navigate('/login')">
                  เข้าสู่ระบบ
                </Button>
                <Button v-else class="mt-2 rounded-full" variant="outline" @click="goToPortal">
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
          <span class="ml-3 text-muted-foreground">ฝ่ายกิจการนักศึกษา มหาวิทยาลัยขอนแก่น</span>
        </p>
        <p class="text-muted-foreground">043-204-303 · dormitory@kku.ac.th · 09:00–16:30</p>
      </div>
      <p class="pb-4 text-center text-xs text-muted-foreground/70">
        ต้นแบบระบบ (Interactive Prototype) — ข้อมูลทั้งหมดเป็นข้อมูลสมมติ
      </p>
    </footer>
  </div>
</template>
