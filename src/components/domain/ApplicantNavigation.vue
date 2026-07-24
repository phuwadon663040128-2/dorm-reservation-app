<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  FilePenLineIcon,
  HouseIcon,
  LayoutDashboardIcon,
  LinkIcon,
  LogOutIcon,
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { logoutAndResetDemoData, resetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'

interface ApplicantNavItem {
  label: string
  to: string
  exact?: boolean
}

interface ApplicantNavGroup {
  label: string
  items: ApplicantNavItem[]
}

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const moreOpen = ref(false)

const overviewItem: ApplicantNavItem = { label: 'ภาพรวมการสมัคร', to: '/app', exact: true }

const navGroups: ApplicantNavGroup[] = [
  {
    label: 'สมัครและเลือกห้อง',
    items: [
      { label: 'รอบรับสมัคร', to: '/app/campaigns' },
      { label: 'ใบสมัคร', to: '/app/application' },
      { label: 'เลือกห้องพัก', to: '/app/rooms' },
      { label: 'รูมเมท', to: '/app/roommate' },
    ],
  },
  {
    label: 'การจองและชำระเงิน',
    items: [
      { label: 'สถานะการจอง', to: '/app/reservation' },
      { label: 'ชำระเงิน', to: '/app/payments' },
    ],
  },
  {
    label: 'สัญญาและเข้าพัก',
    items: [
      { label: 'สัญญา', to: '/app/contracts' },
      { label: 'รับกุญแจ', to: '/app/next-steps' },
      { label: 'ต่อสัญญา', to: '/app/renewal' },
    ],
  },
]

const applyPrefixes = navGroups[0].items.map(item => item.to)
const statusPrefixes = navGroups[1].items.map(item => item.to)
const morePrefixes = navGroups[2].items.map(item => item.to)

const avatarInitials = computed(() => {
  const parts = session.currentUser?.displayName.trim().split(/\s+/).filter(Boolean) ?? []
  return parts.length > 0 ? parts.slice(0, 2).map(part => part.charAt(0)).join('') : 'นศ'
})

const isMoreActive = computed(() => morePrefixes.some(prefix => pathMatches(prefix)))

function pathMatches(prefix: string, exact = false) {
  if (exact) return route.path === prefix
  return route.path === prefix || route.path.startsWith(`${prefix}/`)
}

function isItemActive(item: ApplicantNavItem) {
  return pathMatches(item.to, item.exact)
}

function isGroupActive(group: ApplicantNavGroup) {
  return group.items.some(isItemActive)
}

function navigate(to: string) {
  moreOpen.value = false
  router.push(to)
}

function linkKkuAccount() {
  if (!session.linkCurrentUserToKkuSso()) return
  toast.success('เชื่อม KKU SSO แบบจำลองแล้ว โดยคงข้อมูลใบสมัครและการจองเดิมไว้')
}

function logout() {
  moreOpen.value = false
  logoutAndResetDemoData()
}
</script>

<template>
  <div class="sticky top-16 z-30 hidden border-b bg-background/95 backdrop-blur lg:block">
    <nav
      class="mx-auto flex h-12 w-full max-w-352 items-center gap-1 px-5"
      aria-label="ขั้นตอนการสมัครและการจอง"
    >
      <RouterLink
        :to="overviewItem.to"
        class="rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="isItemActive(overviewItem)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
      >
        {{ overviewItem.label }}
      </RouterLink>

      <DropdownMenu v-for="group in navGroups" :key="group.label">
        <DropdownMenuTrigger
          class="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="isGroupActive(group)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        >
          {{ group.label }}
          <ChevronDownIcon class="size-3.5" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="min-w-56">
          <DropdownMenuItem
            v-for="item in group.items"
            :key="item.to"
            class="cursor-pointer"
            :class="isItemActive(item) ? 'bg-accent font-semibold text-primary' : ''"
            @click="navigate(item.to)"
          >
            {{ item.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  </div>

  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden"
    aria-label="เมนูผู้สมัครบนมือถือ"
  >
    <div class="mx-auto grid h-16 max-w-lg grid-cols-4 px-1">
      <RouterLink
        to="/app"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="route.path === '/app' ? 'text-primary' : 'text-muted-foreground'"
      >
        <LayoutDashboardIcon class="size-5" aria-hidden="true" />
        <span>ภาพรวม</span>
      </RouterLink>

      <RouterLink
        to="/app/application"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="applyPrefixes.some(prefix => pathMatches(prefix)) ? 'text-primary' : 'text-muted-foreground'"
      >
        <FilePenLineIcon class="size-5" aria-hidden="true" />
        <span>สมัคร</span>
      </RouterLink>

      <RouterLink
        to="/app/reservation"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="statusPrefixes.some(prefix => pathMatches(prefix)) ? 'text-primary' : 'text-muted-foreground'"
      >
        <ClipboardCheckIcon class="size-5" aria-hidden="true" />
        <span>สถานะ</span>
      </RouterLink>

      <Sheet v-model:open="moreOpen">
        <SheetTrigger as-child>
          <button
            type="button"
            class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="isMoreActive ? 'text-primary' : 'text-muted-foreground'"
            aria-label="เปิดเมนูผู้สมัครเพิ่มเติม"
          >
            <MenuIcon class="size-5" aria-hidden="true" />
            <span>เพิ่มเติม</span>
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          class="w-[min(22rem,calc(100vw-1rem))] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle class="text-left">การจองของฉัน</SheetTitle>
          </SheetHeader>

          <div class="mx-3 rounded-xl border bg-card p-3">
            <div class="flex items-center gap-3">
              <Avatar class="size-10 shrink-0">
                <AvatarFallback class="bg-primary/10 font-semibold text-primary">{{ avatarInitials }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <p class="truncate font-semibold">{{ session.currentUser?.displayName }}</p>
                <p class="truncate text-xs text-muted-foreground">
                  {{ session.currentUser?.studentId ?? session.currentUser?.email }}
                </p>
              </div>
            </div>
          </div>

          <nav class="grid gap-4 px-3" aria-label="เมนูผู้สมัครเพิ่มเติม">
            <div>
              <p class="mb-1 px-2 text-xs font-semibold text-muted-foreground">ภาพรวม</p>
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                :class="isItemActive(overviewItem) ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted'"
                @click="navigate(overviewItem.to)"
              >
                {{ overviewItem.label }}
              </button>
            </div>

            <div v-for="group in navGroups" :key="group.label">
              <p class="mb-1 px-2 text-xs font-semibold text-muted-foreground">{{ group.label }}</p>
              <button
                v-for="item in group.items"
                :key="item.to"
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                :class="isItemActive(item) ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted'"
                @click="navigate(item.to)"
              >
                {{ item.label }}
              </button>
            </div>
          </nav>

          <Separator />

          <div class="grid gap-1 px-3">
            <Button variant="outline" class="justify-start" @click="navigate('/')">
              <HouseIcon aria-hidden="true" /> เว็บไซต์หอพัก
            </Button>
            <Button
              v-if="!session.currentUser?.kkuSsoLinked"
              variant="ghost"
              class="justify-start"
              @click="linkKkuAccount"
            >
              <LinkIcon aria-hidden="true" /> เชื่อม KKU SSO ภายหลัง (จำลอง)
            </Button>
            <p v-else class="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <CheckCircle2Icon class="size-4 text-primary" aria-hidden="true" /> เชื่อม KKU SSO แล้ว
            </p>

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
        </SheetContent>
      </Sheet>
    </div>
  </nav>
</template>
