<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  ArrowRightIcon,
  Building2Icon,
  CheckCircle2Icon,
  GraduationCapIcon,
  InfoIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  MailCheckIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  UserRoundCogIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/composables/useTheme'
import { users } from '@/fixtures'
import { resetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'
import type { User } from '@/types'
import heroDay from '@/assets/hero-day.png'
import heroNight from '@/assets/hero-night.png'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()
const { theme } = useTheme()

const ssoDialogOpen = ref(false)
const email = ref('thanapon.demo@example.test')
const password = ref('demo1234')
const loginError = ref('')

const ssoApplicants = users.filter(user => user.role === 'applicant' && user.kkuSsoLinked)
const staffAccounts = users.filter(user => user.role !== 'applicant')
const heroImage = computed(() => (theme.value === 'dark' ? heroNight : heroDay))

const scenarioAccounts = [
  { id: 'applicant-i', label: 'เริ่มใบสมัครใหม่', hint: 'ยังไม่เชื่อม KKU' },
  { id: 'applicant-b', label: 'ดูขั้นตอนชำระเงิน', hint: 'มีรายการ QR/รอ QR' },
  { id: 'applicant-h', label: 'ยืนยันห้องรูมเมท', hint: 'ต่อไปสร้าง batch ได้' },
]

function initials(displayName: string) {
  return displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join('')
}

function destination() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  return redirect ?? (session.isStaff ? '/staff' : '/app')
}

function finishLogin(userId: string, method: 'email' | 'sso') {
  const user = session.login(userId)
  if (!user) return
  ssoDialogOpen.value = false
  toast.success(`เข้าสู่ระบบด้วย${method === 'email' ? 'อีเมลส่วนตัว' : ' KKU SSO แบบจำลอง'}สำเร็จ`)
  router.push(destination())
}

function signInByEmail() {
  loginError.value = ''
  const user = session.userByEmail(email.value)
  if (!user || user.role !== 'applicant' || password.value !== 'demo1234') {
    loginError.value = 'ไม่พบบัญชีทดสอบหรือรหัสผ่านไม่ถูกต้อง กรุณาใช้รหัส demo1234'
    return
  }
  if (!user.emailVerified) {
    loginError.value = 'ต้องยืนยันอีเมลก่อนเข้าสู่ขั้นตอนส่งใบสมัคร'
    return
  }
  finishLogin(user.id, 'email')
}

function selectScenario(userId: string) {
  const user = users.find(item => item.id === userId)
  if (!user) return
  email.value = user.email
  password.value = 'demo1234'
  loginError.value = ''
}

function accountIdentifier(user: User) {
  if (user.role === 'applicant') return user.studentId ?? user.email
  return `รหัสทดสอบ: ${user.id}`
}
</script>

<template>
  <section class="grid min-h-[calc(100svh-8rem)] bg-background lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.95fr)]">
    <div class="relative isolate min-h-64 overflow-hidden lg:min-h-[45rem]">
      <img :src="heroImage" alt="อาคารหอพักในกำกับ มหาวิทยาลัยขอนแก่น" class="absolute inset-0 size-full object-cover object-center" />
      <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10 lg:bg-linear-to-r lg:from-black/80 lg:via-black/30 lg:to-transparent" />
      <div class="relative flex h-full min-h-64 flex-col justify-end p-6 text-white sm:p-10 lg:min-h-[45rem] lg:p-14 xl:p-18">
        <Badge class="mb-5 w-fit border-white/20 bg-black/35 text-white backdrop-blur-sm hover:bg-black/35">
          <Building2Icon class="size-3.5" aria-hidden="true" /> KKU Affiliated Dormitory
        </Badge>
        <h1 class="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          สมัครและติดตามการจองหอพักในกำกับ มข.
        </h1>
        <p class="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
          เริ่มสมัครได้แม้ยังไม่มีบัญชี KKU และเชื่อม KKU SSO ภายหลังได้โดยประวัติใบสมัคร การชำระเงิน และการจองเดิมไม่หาย
        </p>
        <div class="mt-6 hidden flex-wrap gap-x-6 gap-y-2 text-sm text-white/85 sm:flex">
          <span class="inline-flex items-center gap-2"><CheckCircle2Icon class="size-4" /> อีเมลยืนยันแล้วสมัครได้ทันที</span>
          <span class="inline-flex items-center gap-2"><CheckCircle2Icon class="size-4" /> KKU SSO เป็นทางเลือก</span>
          <span class="inline-flex items-center gap-2"><CheckCircle2Icon class="size-4" /> ข้อมูลบัญชีเดียว ไม่สร้างซ้ำ</span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
      <Card class="w-full max-w-xl shadow-lg shadow-foreground/5">
        <CardHeader class="space-y-4 pb-3">
          <Alert v-if="route.query.reset === '1'">
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>รีเซตข้อมูลทดสอบแล้ว</AlertTitle>
            <AlertDescription>เลือกสถานการณ์และเริ่มทดสอบใหม่ได้ทันที</AlertDescription>
          </Alert>
          <div class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheckIcon class="size-5" aria-hidden="true" />
          </div>
          <div class="space-y-1.5">
            <CardTitle class="text-2xl">เข้าสู่ระบบ</CardTitle>
            <CardDescription class="leading-5">เลือกวิธีที่ตรงกับสถานะบัญชีของคุณ</CardDescription>
          </div>
        </CardHeader>

        <CardContent class="space-y-5">
          <Tabs default-value="email">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="email"><MailCheckIcon aria-hidden="true" /> อีเมลส่วนตัว</TabsTrigger>
              <TabsTrigger value="kku"><GraduationCapIcon aria-hidden="true" /> KKU SSO</TabsTrigger>
            </TabsList>

            <TabsContent value="email" class="mt-4 space-y-4">
              <Alert>
                <InfoIcon aria-hidden="true" />
                <AlertTitle>สำหรับผู้สมัครที่ยังไม่มีบัญชี KKU</AlertTitle>
                <AlertDescription>
                  ใช้อีเมลส่วนตัวที่ยืนยันแล้วทำทุกขั้นตอนได้ KKU SSO ไม่ใช่เงื่อนไขบังคับและเชื่อมภายหลังได้
                </AlertDescription>
              </Alert>

              <div class="space-y-1.5">
                <Label for="login-email">อีเมลส่วนตัว</Label>
                <Input id="login-email" v-model="email" type="email" autocomplete="email" @keydown.enter="signInByEmail" />
              </div>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between gap-3">
                  <Label for="login-password">รหัสผ่าน</Label>
                  <span class="text-xs text-muted-foreground">ต้นแบบใช้: demo1234</span>
                </div>
                <Input id="login-password" v-model="password" type="password" autocomplete="current-password" @keydown.enter="signInByEmail" />
              </div>
              <p v-if="loginError" class="text-sm text-destructive" role="alert">{{ loginError }}</p>
              <Button size="lg" class="w-full" @click="signInByEmail">
                <KeyRoundIcon aria-hidden="true" /> เข้าสู่ระบบด้วยอีเมล
                <ArrowRightIcon class="ml-auto" aria-hidden="true" />
              </Button>

              <div class="space-y-2">
                <p class="text-xs font-medium text-muted-foreground">เลือกสถานการณ์ทดสอบด่วน</p>
                <div class="grid gap-2 sm:grid-cols-3">
                  <Button
                    v-for="scenario in scenarioAccounts"
                    :key="scenario.id"
                    variant="outline"
                    class="h-auto min-w-0 flex-col items-start gap-0.5 px-3 py-2 text-left whitespace-normal"
                    @click="selectScenario(scenario.id)"
                  >
                    <span class="text-xs font-medium">{{ scenario.label }}</span>
                    <span class="text-[11px] font-normal text-muted-foreground">{{ scenario.hint }}</span>
                  </Button>
                </div>
              </div>

              <p class="text-center text-xs text-muted-foreground">
                ยังไม่มีบัญชี? <RouterLink to="/register" class="font-medium text-primary underline underline-offset-4">สร้างบัญชีด้วยอีเมลส่วนตัว</RouterLink>
              </p>
            </TabsContent>

            <TabsContent value="kku" class="mt-4 space-y-4">
              <Alert>
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>KKU SSO แบบจำลอง</AlertTitle>
                <AlertDescription>
                  ใช้สำหรับผู้สมัครที่มีบัญชี KKU แล้วและเจ้าหน้าที่ ระบบจริงจะส่งต่อไปหน้าล็อกอินของมหาวิทยาลัย
                </AlertDescription>
              </Alert>
              <Button size="lg" class="w-full" @click="ssoDialogOpen = true">
                <LockKeyholeIcon aria-hidden="true" /> เข้าสู่ระบบด้วย KKU SSO
                <ArrowRightIcon class="ml-auto" aria-hidden="true" />
              </Button>
              <p class="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <ShieldCheckIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                ต้นแบบไม่รับหรือจัดเก็บรหัสผ่านบัญชี KKU
              </p>
            </TabsContent>
          </Tabs>

          <Separator />
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-muted-foreground">Interactive Prototype · ข้อมูลทั้งหมดเป็นข้อมูลสมมติ</p>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button size="sm" variant="ghost"><RotateCcwIcon aria-hidden="true" /> รีเซตข้อมูลทดสอบ</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>เริ่มการทดสอบใหม่?</AlertDialogTitle>
                  <AlertDialogDescription>ข้อมูลที่เปลี่ยนระหว่างการจำลองทั้งหมดจะกลับไปเป็น fixture เริ่มต้น และบัญชีปัจจุบันจะออกจากระบบ</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction @click="resetDemoData">รีเซตและเริ่มใหม่</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>

  <Dialog v-model:open="ssoDialogOpen">
    <DialogContent class="max-h-[calc(100svh-2rem)] overflow-hidden p-0 sm:max-w-2xl">
      <DialogHeader class="border-b px-5 py-5 pr-12 text-left sm:px-6">
        <DialogTitle>เลือกบัญชี KKU SSO จำลอง</DialogTitle>
        <DialogDescription>ผู้สมัครที่เชื่อม KKU แล้วและบัญชีเจ้าหน้าที่สำหรับทดสอบ workflow</DialogDescription>
      </DialogHeader>
      <Tabs default-value="staff" class="min-h-0 gap-0">
        <div class="px-5 pt-4 sm:px-6">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="applicant"><GraduationCapIcon /> ผู้สมัคร</TabsTrigger>
            <TabsTrigger value="staff"><UserRoundCogIcon /> เจ้าหน้าที่</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="applicant" class="mt-0 min-h-0 px-3 pb-3 pt-3">
          <ScrollArea class="h-[min(52svh,26rem)]">
            <div class="grid gap-2 px-2 pb-2 sm:grid-cols-2">
              <Button v-for="user in ssoApplicants" :key="user.id" variant="outline" class="h-auto justify-start gap-3 p-3 text-left whitespace-normal" @click="finishLogin(user.id, 'sso')">
                <Avatar><AvatarFallback>{{ initials(user.displayName) }}</AvatarFallback></Avatar>
                <span class="min-w-0"><span class="block truncate font-medium">{{ user.displayName }}</span><span class="block truncate text-xs text-muted-foreground">{{ accountIdentifier(user) }}</span></span>
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="staff" class="mt-0 min-h-0 px-3 pb-3 pt-3">
          <ScrollArea class="h-[min(52svh,26rem)]">
            <div class="grid gap-2 px-2 pb-2 sm:grid-cols-2">
              <Button v-for="user in staffAccounts" :key="user.id" variant="outline" class="h-auto justify-start gap-3 p-3 text-left whitespace-normal" @click="finishLogin(user.id, 'sso')">
                <Avatar><AvatarFallback>{{ initials(user.displayName) }}</AvatarFallback></Avatar>
                <span class="min-w-0"><span class="block truncate font-medium">{{ user.displayName }}</span><span class="block truncate text-xs text-muted-foreground">{{ accountIdentifier(user) }}</span></span>
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
