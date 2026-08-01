<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CheckCircle2Icon,
  LinkIcon,
  LogOutIcon,
  MailCheckIcon,
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { resetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'

const emit = defineEmits<{
  logout: []
}>()

const session = useSessionStore()
const profileOpen = ref(false)

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

async function linkKkuAccount() {
  const { toast } = await import('vue-sonner')
  if (!session.linkCurrentUserToKkuSso()) return
  toast.success('เชื่อม KKU SSO แบบจำลองแล้ว โดยคงข้อมูลใบสมัครและการจองเดิมไว้')
}

function logout() {
  profileOpen.value = false
  emit('logout')
}
</script>

<template>
  <Popover v-model:open="profileOpen">
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
        <p v-else-if="!session.isStaff" class="flex items-start gap-2 text-xs text-muted-foreground">
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
</template>
