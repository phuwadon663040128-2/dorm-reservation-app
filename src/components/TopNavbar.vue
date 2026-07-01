<script setup lang="ts">
import { computed, ref } from 'vue'
import { Building, ClipboardList, LogOut, Menu, User } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

type UserRole = 'applicant' | 'admin'

interface NavLink {
  label: string
  icon?: typeof Building
  action?: () => void
  tab?: string
}

interface TopbarUser {
  role: UserRole
  username: string
  displayName: string
  identifier: string
  unit?: string
}

const props = defineProps<{
  role: UserRole
  currentAdminTab: string
  user: TopbarUser | null
}>()

const emit = defineEmits<{
  (e: 'update:currentAdminTab', val: string): void
  (e: 'showMyStatus'): void
  (e: 'backToCampaigns'): void
  (e: 'logout'): void
}>()

const mobileMenuOpen = ref(false)

const applicantNav: NavLink[] = [
  { label: 'หอพักที่เปิดรับ', icon: Building, action: () => emit('backToCampaigns') },
  { label: 'สถานะของฉัน', icon: ClipboardList, action: () => emit('showMyStatus') },
]

const adminNav: NavLink[] = [
  { label: 'แดชบอร์ด', tab: 'dashboard' },
  { label: 'แคมเปญ', tab: 'campaigns' },
  { label: 'ใบสมัคร', tab: 'applicants' },
  { label: 'ห้องว่าง', tab: 'rooms' },
  { label: 'รายงาน', tab: 'reports' },
  { label: 'ตั้งค่า', tab: 'settings' },
]

const roleLabel = computed(() => (props.role === 'admin' ? 'เจ้าหน้าที่' : 'ผู้สมัคร'))

const profileInitials = computed(() => {
  const source = props.user?.displayName || props.user?.identifier || 'KKU'
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (!parts.length) return 'KKU'
  if (/^[A-Za-z]/.test(parts[0])) {
    return parts
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }

  return source.trim().slice(0, 2)
})

function handleAdminTabClick(tab = 'dashboard') {
  emit('update:currentAdminTab', tab)
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-card/95 shadow-sm backdrop-blur">
    <div class="mx-auto grid h-16 max-w-screen-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-5 sm:px-8 lg:px-10">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
          <Building class="size-4" />
        </div>
        <div class="hidden min-w-0 sm:block">
          <h1 class="truncate text-sm font-semibold leading-tight">ระบบจองหอพักในกำกับ มข.</h1>
          <p class="truncate text-[11px] text-muted-foreground">KKU Affiliated Dorm Reservation</p>
        </div>
      </div>

      <nav class="hidden min-w-0 items-center justify-center gap-1 md:flex">
        <template v-if="role === 'applicant'">
          <Button
            v-for="link in applicantNav"
            :key="link.label"
            variant="ghost"
            size="sm"
            @click="link.action?.()"
          >
            <component :is="link.icon" v-if="link.icon" class="size-3.5" />
            {{ link.label }}
          </Button>
        </template>
        <template v-else>
          <Button
            v-for="item in adminNav"
            :key="item.tab"
            :variant="currentAdminTab === item.tab ? 'default' : 'ghost'"
            size="sm"
            @click="handleAdminTabClick(item.tab)"
          >
            {{ item.label }}
          </Button>
        </template>
      </nav>

      <div class="flex min-w-0 justify-end gap-2">
        <DropdownMenu v-if="user">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="h-10 gap-2 px-2">
              <Avatar class="size-8">
                <AvatarFallback class="bg-foreground text-xs font-semibold text-background">
                  {{ profileInitials }}
                </AvatarFallback>
              </Avatar>
              <span class="min-w-0 text-left">
                <span class="block max-w-[6.75rem] truncate text-xs font-semibold leading-4 sm:max-w-[8rem]">{{ user.identifier }}</span>
                <span class="block max-w-[6.75rem] truncate text-[11px] font-normal leading-3 text-muted-foreground sm:max-w-[8rem]">{{ roleLabel }}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-72">
            <DropdownMenuLabel class="p-3">
              <div class="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3">
                <Avatar class="size-9">
                  <AvatarFallback class="bg-foreground text-xs font-semibold text-background">
                    {{ profileInitials }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold leading-5">{{ user.displayName }}</p>
                  <p class="truncate text-xs font-normal text-muted-foreground">{{ user.identifier }}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 px-3 py-2 text-xs">
              <span class="text-muted-foreground">Role</span>
              <span class="truncate font-medium">{{ roleLabel }}</span>
              <span class="text-muted-foreground">หน่วยงาน</span>
              <span class="truncate font-medium">{{ user.unit || 'Khon Kaen University' }}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="gap-2 px-3 py-2 text-destructive focus:text-destructive" @click="emit('logout')">
              <LogOut class="size-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="icon" class="md:hidden" @click="mobileMenuOpen = true">
          <Menu class="size-4" />
          <span class="sr-only">เปิดเมนู</span>
        </Button>
      </div>
    </div>
  </header>

  <Sheet v-model:open="mobileMenuOpen">
    <SheetContent side="right" class="w-[320px]">
      <SheetHeader>
        <SheetTitle>เมนูนำทาง</SheetTitle>
        <SheetDescription>
          เมนูจะแสดงตาม role ที่เข้าสู่ระบบ
        </SheetDescription>
      </SheetHeader>

      <template v-if="user">
        <div class="space-y-4 px-4">
          <div class="rounded-lg border bg-muted/50 p-3">
            <div class="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3">
              <Avatar class="size-10">
                <AvatarFallback class="bg-foreground text-xs font-semibold text-background">
                  {{ profileInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ user.displayName }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ user.identifier }}</p>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <User class="size-3.5" />
              {{ roleLabel }}
            </div>
          </div>

          <Separator />

          <div class="grid gap-1">
            <template v-if="role === 'applicant'">
              <Button
                v-for="link in applicantNav"
                :key="link.label"
                variant="ghost"
                class="justify-start"
                @click="link.action?.(); closeMobileMenu()"
              >
                <component :is="link.icon" v-if="link.icon" class="size-4" />
                {{ link.label }}
              </Button>
            </template>
            <template v-else>
              <Button
                v-for="item in adminNav"
                :key="item.tab"
                :variant="currentAdminTab === item.tab ? 'secondary' : 'ghost'"
                class="justify-start"
                @click="handleAdminTabClick(item.tab); closeMobileMenu()"
              >
                {{ item.label }}
              </Button>
            </template>
          </div>
        </div>

        <SheetFooter class="mt-auto">
          <Button variant="outline" class="w-full" @click="emit('logout'); closeMobileMenu()">
            <LogOut class="size-4" />
            ออกจากระบบ
          </Button>
        </SheetFooter>
      </template>
    </SheetContent>
  </Sheet>
</template>
