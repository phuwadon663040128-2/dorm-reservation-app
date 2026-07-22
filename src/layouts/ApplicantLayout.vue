<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { BuildingIcon, CheckCircle2Icon, ChevronDownIcon, LinkIcon, LogOutIcon, MailCheckIcon, RotateCcwIcon } from '@lucide/vue'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import ThemeToggle from '@/components/domain/ThemeToggle.vue'
import { resetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const profileOpen = ref(false)

const avatarInitials = computed(() => {
  const nameParts = session.currentUser?.displayName.trim().split(/\s+/).filter(Boolean) ?? []
  return nameParts.length > 0
    ? nameParts.slice(0, 2).map(part => part.charAt(0)).join('')
    : 'นศ'
})

// เมนู applicant ตามเอกสาร 03 §Applicant navigation
const navItems = [
  { to: '/app', label: 'ภาพรวม', exact: true },
  { to: '/app/campaigns', label: 'รอบรับสมัคร' },
  { to: '/app/application', label: 'ใบสมัคร' },
  { to: '/app/rooms', label: 'เลือกห้องพัก' },
  { to: '/app/roommate', label: 'รูมเมท' },
  { to: '/app/reservation', label: 'การจองของฉัน' },
  { to: '/app/payments', label: 'ชำระเงิน' },
  { to: '/app/contracts', label: 'สัญญา' },
  { to: '/app/next-steps', label: 'รับกุญแจ' },
  { to: '/app/renewal', label: 'ต่อสัญญา' },
]

function logout() {
  session.logout()
  router.push('/login')
}

function linkKkuAccount() {
  if (!session.linkCurrentUserToKkuSso()) return
  toast.success('เชื่อม KKU SSO แบบจำลองแล้ว โดยคงข้อมูลใบสมัครและการจองเดิมไว้')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-16 w-full max-w-352 items-center gap-3 px-3 sm:px-5 xl:gap-4">
        <RouterLink to="/app" class="flex shrink-0 items-center gap-2 font-bold">
          <BuildingIcon class="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span class="hidden truncate md:inline">หอพักในกำกับ มข.</span>
        </RouterLink>

        <!-- desktop: โลโก้ เมนู และบัญชีอยู่ในแถวเดียวกัน ไม่เกิดกล่องบัญชีลอยเหนือเมนู -->
        <nav class="hidden min-w-0 flex-1 overflow-x-auto xl:block" aria-label="เมนูผู้สมัคร">
          <div class="mx-auto flex w-max items-center gap-1">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted"
              :class="($route.path === item.to || (!item.exact && $route.path.startsWith(item.to + '/')))
                ? 'bg-primary text-primary-foreground hover:bg-primary'
                : 'text-muted-foreground'"
            >
              {{ item.label }}
            </RouterLink>
          </div>
        </nav>

        <div class="ml-auto flex h-full shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Popover v-model:open="profileOpen">
            <PopoverTrigger as-child>
              <Button
                variant="ghost"
                class="h-10 max-w-[15rem] justify-start gap-2 px-2"
                aria-label="เปิดเมนูบัญชีผู้สมัคร"
              >
                <Avatar class="size-8 shrink-0">
                  <AvatarFallback class="bg-primary/10 font-semibold text-primary">{{ avatarInitials }}</AvatarFallback>
                </Avatar>
                <span class="hidden min-w-0 text-left leading-tight sm:block">
                  <span class="block truncate text-sm font-medium">{{ session.currentUser?.displayName }}</span>
                  <span class="block truncate text-xs font-normal text-muted-foreground">
                    {{ session.currentUser?.studentId ?? 'ยังไม่มีรหัสนักศึกษา' }}
                  </span>
                </span>
                <ChevronDownIcon class="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
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
                    <p class="mt-0.5 text-xs text-muted-foreground">{{ session.currentUser?.studentId ?? 'ยังไม่มีรหัสนักศึกษา' }}</p>
                  </div>
                </div>
                <div class="grid gap-2 rounded-lg bg-muted p-3 text-xs">
                  <div class="flex items-center justify-between gap-3">
                    <span class="inline-flex items-center gap-1.5 text-muted-foreground"><MailCheckIcon class="size-3.5" /> อีเมลส่วนตัว</span>
                    <Badge variant="success">ยืนยันแล้ว</Badge>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="inline-flex items-center gap-1.5 text-muted-foreground"><LinkIcon class="size-3.5" /> KKU SSO</span>
                    <Badge :variant="session.currentUser?.kkuSsoLinked ? 'success' : 'outline'">
                      {{ session.currentUser?.kkuSsoLinked ? 'เชื่อมแล้ว' : 'ยังไม่เชื่อม' }}
                    </Badge>
                  </div>
                </div>
                <Button v-if="!session.currentUser?.kkuSsoLinked" variant="outline" class="w-full" @click="linkKkuAccount">
                  <LinkIcon aria-hidden="true" /> เชื่อม KKU SSO ภายหลัง (จำลอง)
                </Button>
                <p v-else class="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2Icon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  บัญชีนี้ยังเข้าสู่ระบบด้วยอีเมลส่วนตัวได้ และข้อมูลเดิมถูกเก็บในบัญชีเดียวกัน
                </p>
              </div>
              <Separator />
              <div class="grid gap-1 p-2">
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button variant="ghost" class="justify-start"><RotateCcwIcon aria-hidden="true" /> รีเซตข้อมูลทดสอบ</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>เริ่มการทดสอบใหม่?</AlertDialogTitle>
                      <AlertDialogDescription>ข้อมูลจำลองที่เปลี่ยนทั้งหมดจะกลับเป็นค่าเริ่มต้น และคุณจะออกจากระบบ</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                      <AlertDialogAction @click="resetDemoData">รีเซตและเริ่มใหม่</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="ghost" class="justify-start" @click="logout"><LogOutIcon aria-hidden="true" /> ออกจากระบบ</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <!-- tablet/mobile: แยกเป็นแถวที่สองและเลื่อนแนวนอนได้เมื่อพื้นที่ไม่พอ -->
      <nav class="mx-auto w-full max-w-352 overflow-x-auto px-3 sm:px-5 xl:hidden" aria-label="เมนูผู้สมัคร">
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
