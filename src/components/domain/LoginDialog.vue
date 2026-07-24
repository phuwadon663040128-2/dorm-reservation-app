<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  ArrowLeftIcon, ArrowRightIcon, Building2Icon, CheckCircle2Icon, ChevronDownIcon,
  EyeIcon, EyeOffIcon, GraduationCapIcon, InfoIcon, KeyRoundIcon, MailCheckIcon,
  RotateCcwIcon, ShieldCheckIcon, UserRoundCogIcon, UsersRoundIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/composables/useTheme'
import { users } from '@/fixtures'
import { resetDemoData } from '@/lib/demo-reset'
import { useSessionStore } from '@/stores/session'
import type { User } from '@/types'
import heroDay from '@/assets/hero-day.png'
import heroNight from '@/assets/hero-night.png'

type InitialView = 'login' | 'register' | 'verify'
type DialogView = InitialView | 'sso' | 'reset'

const props = withDefaults(defineProps<{
  open: boolean
  redirect?: string
  reset?: boolean
  initialView?: InitialView
  email?: string
}>(), {
  redirect: undefined,
  reset: false,
  initialView: 'login',
  email: undefined,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'signed-in': [destination: string]
}>()

const session = useSessionStore()
const { theme } = useTheme()
const view = ref<DialogView>('login')
const demoOpen = ref(false)
const showPassword = ref(false)
const showRegisterPassword = ref(false)
const loginEmail = ref('thanapon.demo@example.test')
const loginPassword = ref('demo1234')
const loginError = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const acceptedNotice = ref(false)
const registrationError = ref('')

const heroImage = computed(() => (theme.value === 'dark' ? heroNight : heroDay))
const verificationEmail = computed(() => session.pendingEmailRegistration() || 'อีเมลที่สมัคร')
const hasPendingRegistration = computed(() => Boolean(session.pendingEmailRegistration()))
const ssoApplicants = users.filter(user => user.role === 'applicant' && user.kkuSsoLinked)
const staffAccounts = users.filter(user => user.role !== 'applicant')
const scenarioAccounts = [
  { id: 'applicant-i', label: 'เริ่มใบสมัครใหม่', hint: 'ยังไม่เชื่อมบัญชี KKU' },
  { id: 'applicant-b', label: 'ดูขั้นตอนชำระเงิน', hint: 'มีรายการ QR และรายการรอ QR' },
  { id: 'applicant-h', label: 'ยืนยันห้องกับรูมเมท', hint: 'พร้อมดำเนินการขั้นถัดไป' },
]
const journeyHighlights = [
  { icon: Building2Icon, title: 'เลือกห้องจริง', description: 'ดูอาคาร ชั้น และเลขห้องที่เปิดรับ' },
  { icon: UsersRoundIcon, title: 'จัดการรูมเมท', description: 'ส่งคำเชิญและติดตามเวลาตอบรับ' },
  { icon: CheckCircle2Icon, title: 'ติดตามทุกสถานะ', description: 'ใบสมัคร ชำระเงิน สัญญา และรับกุญแจ' },
]

let wasOpen = false
watch(
  () => [props.open, props.initialView, props.email] as const,
  ([isOpen, initialView, initialEmail]) => {
    if (!isOpen) {
      wasOpen = false
      return
    }
    const freshOpen = !wasOpen
    wasOpen = true
    view.value = initialView
    loginError.value = ''
    registrationError.value = ''
    if (freshOpen) {
      demoOpen.value = false
      showPassword.value = false
      showRegisterPassword.value = false
      registerPassword.value = ''
      acceptedNotice.value = false
    }
    if (initialView === 'verify') registerEmail.value = session.pendingEmailRegistration()
    else if (initialEmail) registerEmail.value = initialEmail
  },
  { immediate: true },
)

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join('')
}

function internalRedirect(value?: string) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null
}

function destination() {
  return internalRedirect(props.redirect) ?? (session.isStaff ? '/staff' : '/app')
}

function finishSso(userId: string) {
  if (!session.login(userId)) return
  toast.success('เข้าสู่ระบบด้วย KKU SSO แบบจำลองสำเร็จ')
  emit('signed-in', destination())
}

function signInByEmail() {
  loginError.value = ''
  const user = session.authenticateApplicant(loginEmail.value, loginPassword.value)
  if (!user) {
    loginError.value = 'ไม่พบบัญชีผู้สมัครหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง'
    return
  }
  if (!user.emailVerified) {
    loginError.value = 'กรุณายืนยันอีเมลก่อนเข้าสู่ขั้นตอนส่งใบสมัคร'
    return
  }
  toast.success('เข้าสู่ระบบด้วยอีเมลส่วนตัวสำเร็จ')
  emit('signed-in', destination())
}

function submitRegistration() {
  registrationError.value = ''
  const normalizedEmail = registerEmail.value.trim().toLowerCase()
  if (!normalizedEmail.includes('@')) {
    registrationError.value = 'กรุณากรอกอีเมลให้ถูกต้อง'
    return
  }
  if (session.userByEmail(normalizedEmail)) {
    registrationError.value = 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณากลับไปเข้าสู่ระบบ'
    return
  }
  if (registerPassword.value.length < 8) {
    registrationError.value = 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (!acceptedNotice.value) {
    registrationError.value = 'กรุณาอ่านและรับทราบประกาศความเป็นส่วนตัวก่อนสมัคร'
    return
  }
  registerEmail.value = normalizedEmail
  session.beginEmailRegistration(normalizedEmail, registerPassword.value)
  toast.success('ส่งลิงก์ยืนยันอีเมลแบบจำลองแล้ว')
  view.value = 'verify'
}

function completeVerification() {
  const user = session.completeEmailRegistration()
  if (!user) {
    toast.error('ไม่พบคำขอสมัครบัญชี กรุณากรอกข้อมูลสมัครใหม่')
    view.value = 'register'
    return
  }
  loginEmail.value = user.email
  loginPassword.value = registerPassword.value
  toast.success('ยืนยันอีเมลสำเร็จ — สร้างบัญชีผู้สมัครแล้ว')
  emit('signed-in', '/app/application')
}

function selectScenario(userId: string) {
  const user = users.find(item => item.id === userId)
  if (!user) return
  loginEmail.value = user.email
  loginPassword.value = 'demo1234'
  loginError.value = ''
  demoOpen.value = false
  toast.success('เลือกบัญชีทดสอบแล้ว กดเข้าสู่ระบบเพื่อดำเนินการต่อ')
}

function requestPasswordReset() {
  toast('ต้นแบบ: ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลที่กรอก')
}

function accountIdentifier(user: User) {
  return user.role === 'applicant' ? (user.studentId ?? user.email) : 'รหัสทดสอบ: ' + user.id
}

function roleLabel(user: User) {
  if (user.role === 'applicant') return 'ผู้สมัคร'
  if (user.role === 'admin') return 'ผู้ดูแลระบบ'
  return 'เจ้าหน้าที่'
}

function openView(nextView: DialogView) {
  view.value = nextView
  loginError.value = ''
  registrationError.value = ''
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[calc(100svh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto p-0 sm:max-w-6xl lg:h-[46rem] lg:overflow-hidden">
      <div class="grid min-h-0 lg:h-full lg:grid-cols-5">
        <aside class="relative isolate hidden min-h-0 overflow-y-auto lg:col-span-3 lg:block">
          <img :src="heroImage" alt="อาคารหอพักในกำกับ มหาวิทยาลัยขอนแก่น" class="absolute inset-0 size-full object-cover object-center" />
          <div class="absolute inset-0 bg-linear-to-br from-black/80 via-black/35 to-black/70" />
          <div class="relative flex min-h-full flex-col p-7 text-white">
            <div class="flex min-h-10 items-center">
              <Badge class="border-white/20 bg-black/35 text-white backdrop-blur-md hover:bg-black/35">
                <ShieldCheckIcon class="size-3.5" aria-hidden="true" />
                KKU Affiliated Dormitory
              </Badge>
            </div>

            <div class="mt-8 max-w-2xl">
              <h2 class="text-4xl font-bold leading-[1.18] tracking-tight">
                <span class="block">บริการของหอพักออนไลน์</span>
                <span class="mt-1 block text-primary">เลือกห้องพัก ชำระเงิน และทำสัญญา<br />ครบในระบบเดียว</span>
              </h2>
              <p class="mt-4 max-w-2xl text-sm leading-6 text-white/80 xl:text-base">
                ระบบรับสมัครและจองหอพักในกำกับมหาวิทยาลัยขอนแก่น รองรับการเลือกห้องเป็นรายห้อง<br />
                จับคู่รูมเมท เหมาห้อง ชำระเงินผ่านแบบฟอร์มธนาคารอย่างเป็นทางการ และติดตามสัญญาจนถึงวันรับกุญแจ
              </p>

            </div>

            <div class="mt-auto pt-8">
              <ol class="grid grid-cols-3 gap-2.5" aria-label="สิ่งที่ทำได้ในระบบ">
                <li
                  v-for="(item, index) in journeyHighlights"
                  :key="item.title"
                  class="flex min-h-32 flex-col rounded-xl border border-white/15 bg-black/35 p-3.5 backdrop-blur-md"
                >
                  <span class="flex items-center justify-between gap-3">
                    <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold tabular-nums text-white/80">
                      0{{ index + 1 }}
                    </span>
                    <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <component :is="item.icon" class="size-4.5" aria-hidden="true" />
                    </span>
                  </span>
                  <span class="mt-3 min-w-0">
                    <span class="block text-sm font-semibold">{{ item.title }}</span>
                    <span class="mt-1 block text-xs leading-5 text-white/65">{{ item.description }}</span>
                  </span>
                </li>
              </ol>
              <div class="mt-3.5 flex items-start gap-2.5 rounded-xl border border-white/15 bg-black/40 p-3.5 text-xs leading-5 text-white/75 backdrop-blur-md">
                <InfoIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>การเลือกห้องและส่งข้อมูลยังไม่ถือว่าได้รับสิทธิ์เข้าพัก จนกว่าจะมีการยืนยันอย่างเป็นทางการ</p>
              </div>
            </div>
          </div>
        </aside>
        <div class="min-h-0 lg:col-span-2 lg:h-full lg:overflow-y-auto">
          <div class="mx-auto w-full max-w-lg p-5 sm:p-6 lg:max-w-none lg:p-7">            <template v-if="view === 'login'">
              <DialogHeader class="space-y-3 text-left">
                <div class="flex items-center gap-3 pr-7">
                  <div class="flex items-center gap-3">
                    <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <KeyRoundIcon class="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span class="block text-sm font-semibold">หอพักในกำกับ มข.</span>
                      <span class="block text-xs text-muted-foreground">Dormitory account</span>
                    </span>
                  </div>
                </div>
                <div class="space-y-1.5">
                  <DialogTitle class="text-2xl">เข้าสู่ระบบ</DialogTitle>
                  <DialogDescription>ใช้อีเมลส่วนตัวที่ยืนยันแล้ว หรือบัญชี KKU ที่เชื่อมไว้</DialogDescription>
                </div>
              </DialogHeader>

              <Alert v-if="props.reset" class="mt-5">
                <CheckCircle2Icon aria-hidden="true" />
                <AlertTitle>รีเซตข้อมูลทดสอบแล้ว</AlertTitle>
                <AlertDescription>เลือกสถานการณ์และเริ่มทดสอบใหม่ได้ทันที</AlertDescription>
              </Alert>

              <form class="mt-5 space-y-4" @submit.prevent="signInByEmail">
                <div class="space-y-1.5">
                  <Label for="dialog-login-email">อีเมลส่วนตัว</Label>
                                    <Input
                    id="dialog-login-email"
                    v-model="loginEmail"
                    class="h-11"
                    type="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    :aria-invalid="Boolean(loginError)"
                    :aria-describedby="loginError ? 'dialog-login-error' : undefined"
                    @input="loginError = ''"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="dialog-login-password">รหัสผ่าน</Label>
                  <div class="relative">
                    <Input
                      id="dialog-login-password"
                      v-model="loginPassword"
                      class="h-11 w-full pr-11"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      :aria-invalid="Boolean(loginError)"
                      :aria-describedby="loginError ? 'dialog-login-error' : undefined"
                      @input="loginError = ''"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                      @click="showPassword = !showPassword"
                    >
                      <EyeOffIcon v-if="showPassword" class="size-4" aria-hidden="true" />
                      <EyeIcon v-else class="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <Button type="button" variant="link" class="h-auto px-0 text-xs" @click="requestPasswordReset">ลืมรหัสผ่าน?</Button>
                </div>
                <div v-if="loginError" id="dialog-login-error" class="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive" role="alert">
                  <InfoIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{{ loginError }}</span>
                </div>
                <Button type="submit" size="lg" class="w-full justify-center">
                  เข้าสู่ระบบ
                </Button>
              </form>

              <div class="my-5 flex items-center gap-3" aria-hidden="true">
                <Separator class="flex-1" /><span class="text-xs text-muted-foreground">หรือ</span><Separator class="flex-1" />
              </div>
              <Button type="button" size="lg" variant="outline" class="relative w-full justify-center" @click="openView('sso')">
                <GraduationCapIcon class="absolute left-3" aria-hidden="true" />
                <span>เข้าสู่ระบบด้วย KKU SSO</span>
              </Button>
              <p class="mt-2 text-center text-xs leading-5 text-muted-foreground">สำหรับบัญชีที่เชื่อม KKU แล้วและบัญชีเจ้าหน้าที่ · SSO แบบจำลอง</p>

              <div class="mt-5 rounded-xl border bg-muted/35 p-3.5">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium">ยังไม่มีบัญชีใช่ไหม?</p>
                    <p class="text-xs text-muted-foreground">สมัครด้วยอีเมลส่วนตัวและเชื่อม KKU ภายหลังได้</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" class="shrink-0 bg-card" @click="openView('register')">สร้างบัญชี</Button>
                </div>
              </div>

              <Collapsible v-model:open="demoOpen" class="mt-4 rounded-xl border">
                <CollapsibleTrigger as-child>
                  <Button type="button" variant="ghost" class="h-auto w-full justify-between px-4 py-3">
                    <span class="flex items-center gap-2 text-sm"><UserRoundCogIcon class="size-4 text-muted-foreground" aria-hidden="true" />เครื่องมือทดสอบต้นแบบ</span>
                    <ChevronDownIcon class="size-4 transition-transform" :class="demoOpen && 'rotate-180'" aria-hidden="true" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent class="px-3 pb-3">
                  <Separator class="mb-3" />
                  <div class="grid gap-2">
                    <button
                      v-for="account in scenarioAccounts"
                      :key="account.id"
                      type="button"
                      class="rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      @click="selectScenario(account.id)"
                    >
                      <span class="block text-sm font-medium">{{ account.label }}</span>
                      <span class="block text-xs text-muted-foreground">{{ account.hint }}</span>
                    </button>
                  </div>
                  <Button type="button" variant="ghost" size="sm" class="mt-2 w-full text-muted-foreground" @click="openView('reset')">
                    <RotateCcwIcon aria-hidden="true" />รีเซตข้อมูลทดสอบทั้งหมด
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <p class="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted-foreground">
                <ShieldCheckIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                ต้นแบบนี้ไม่รับรหัสผ่านบัญชี KKU และยังไม่ใช่การยืนยันสิทธิ์เข้าพัก
              </p>
            </template>

            <template v-else-if="view === 'register'">
              <DialogHeader class="text-left">
                <div class="mb-3 flex items-center gap-3 pr-7">
                  <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="กลับไปหน้าเข้าสู่ระบบ" @click="openView('login')">
                    <ArrowLeftIcon aria-hidden="true" />
                  </Button>
                  <div>
                    <DialogTitle>สร้างบัญชีผู้สมัคร</DialogTitle>
                    <DialogDescription class="mt-1">สมัครด้วยอีเมลส่วนตัวและเชื่อมบัญชี KKU ภายหลังได้</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form class="mt-3 space-y-4" @submit.prevent="submitRegistration">
                <div class="space-y-1.5">
                  <Label for="dialog-register-email">อีเมลส่วนตัว</Label>
                                    <Input
                    id="dialog-register-email"
                    v-model="registerEmail"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    :aria-invalid="Boolean(registrationError)"
                    :aria-describedby="registrationError ? 'dialog-register-error' : undefined"
                    @input="registrationError = ''"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label for="dialog-register-password">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</Label>
                  <div class="flex items-stretch gap-2">
                    <Input
                      id="dialog-register-password"
                      v-model="registerPassword"
                      class="min-w-0 flex-1"
                      :type="showRegisterPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      @input="registrationError = ''"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      class="shrink-0"
                      :aria-label="showRegisterPassword ? 'ซ่อนรหัสผ่านใหม่' : 'แสดงรหัสผ่านใหม่'"
                      @click="showRegisterPassword = !showRegisterPassword"
                    >
                      <EyeOffIcon v-if="showRegisterPassword" class="size-4" aria-hidden="true" />
                      <EyeIcon v-else class="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <Alert>
                  <ShieldCheckIcon aria-hidden="true" />
                  <AlertTitle>ประกาศความเป็นส่วนตัว</AlertTitle>
                  <AlertDescription>ระบบเก็บข้อมูลเท่าที่จำเป็นต่อการสมัครและจองหอพัก ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</AlertDescription>
                </Alert>
                <div class="flex items-start gap-2">
                  <Checkbox id="dialog-register-notice" v-model="acceptedNotice" class="mt-0.5" :aria-invalid="Boolean(registrationError)" />
                  <Label for="dialog-register-notice" class="text-sm font-normal leading-snug">ข้าพเจ้าได้อ่านและรับทราบประกาศความเป็นส่วนตัวแล้ว</Label>
                </div>
                <p v-if="registrationError" id="dialog-register-error" class="text-sm text-destructive" role="alert">{{ registrationError }}</p>
                <Button type="submit" size="lg" class="w-full">สมัครและส่งอีเมลยืนยัน <ArrowRightIcon class="ml-auto" aria-hidden="true" /></Button>
              </form>
              <Button type="button" variant="link" class="mt-3 w-full" @click="openView('login')">มีบัญชีแล้ว? กลับไปเข้าสู่ระบบ</Button>
            </template>
            <template v-else-if="view === 'verify'">
              <DialogHeader class="text-left">
                <div class="mb-3 flex items-center gap-3 pr-7">
                  <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="กลับไปแก้ข้อมูลสมัคร" @click="openView('register')">
                    <ArrowLeftIcon aria-hidden="true" />
                  </Button>
                  <div>
                    <DialogTitle>ตรวจสอบอีเมลของคุณ</DialogTitle>
                    <DialogDescription class="mt-1">ต้องยืนยันอีเมลก่อนส่งใบสมัคร เชิญรูมเมท หรือจองห้อง</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
                            <Alert v-if="!hasPendingRegistration" class="mt-4">
                <InfoIcon aria-hidden="true" />
                <AlertTitle>ไม่พบคำขอที่รอยืนยัน</AlertTitle>
                <AlertDescription>กลับไปกรอกข้อมูลสมัครใหม่เพื่อรับอีเมลยืนยันแบบจำลอง</AlertDescription>
              </Alert>
              <div class="mt-5 rounded-xl border bg-muted/35 p-5 text-center">
                <span class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MailCheckIcon class="size-6" aria-hidden="true" />
                </span>
                <p class="mt-3 break-all text-sm font-semibold">{{ verificationEmail }}</p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">ในต้นแบบนี้กดปุ่มด้านล่างแทนการเปิดลิงก์จากอีเมล</p>
              </div>
              <div class="mt-5 grid gap-2">
                <Button type="button" variant="outline" :disabled="!hasPendingRegistration" @click="toast.success('ส่งอีเมลยืนยันแบบจำลองใหม่แล้ว')">ส่งอีเมลยืนยันอีกครั้ง</Button>
                <Button type="button" :disabled="!hasPendingRegistration" @click="completeVerification">จำลองยืนยันอีเมลและเริ่มกรอกใบสมัคร</Button>
              </div>
              <div class="mt-3 flex flex-wrap justify-center gap-x-2 text-xs">
                <Button type="button" variant="link" size="sm" @click="openView('register')">แก้ข้อมูลสมัคร</Button>
                <Button type="button" variant="link" size="sm" @click="openView('login')">กลับไปเข้าสู่ระบบ</Button>
              </div>
            </template>

            <template v-else-if="view === 'sso'">
              <DialogHeader class="text-left">
                <div class="mb-3 flex items-center gap-3 pr-7">
                  <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="กลับไปหน้ารหัสผ่าน" @click="openView('login')">
                    <ArrowLeftIcon aria-hidden="true" />
                  </Button>
                  <div>
                    <DialogTitle>เลือกบัญชี KKU SSO</DialogTitle>
                    <DialogDescription class="mt-1">เลือกบทบาทสำหรับเข้าสู่ระบบต้นแบบ</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <Tabs default-value="applicant" class="mt-2">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="applicant">นักศึกษา</TabsTrigger>
                  <TabsTrigger value="staff">เจ้าหน้าที่</TabsTrigger>
                </TabsList>
                <TabsContent value="applicant" class="mt-3 grid gap-2">
                  <button
                    v-for="user in ssoApplicants"
                    :key="user.id"
                    type="button"
                    class="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    @click="finishSso(user.id)"
                  >
                    <Avatar class="size-10 shrink-0">
                      <AvatarFallback class="bg-primary/10 font-semibold text-primary">{{ initials(user.displayName) }}</AvatarFallback>
                    </Avatar>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-semibold">{{ user.displayName }}</span>
                      <span class="block truncate text-xs text-muted-foreground">{{ accountIdentifier(user) }}</span>
                    </span>
                    <Badge variant="secondary">{{ roleLabel(user) }}</Badge>
                  </button>
                </TabsContent>
                <TabsContent value="staff" class="mt-3 grid gap-2">
                  <button
                    v-for="user in staffAccounts"
                    :key="user.id"
                    type="button"
                    class="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    @click="finishSso(user.id)"
                  >
                    <Avatar class="size-10 shrink-0">
                      <AvatarFallback class="bg-primary/10 font-semibold text-primary">{{ initials(user.displayName) }}</AvatarFallback>
                    </Avatar>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-semibold">{{ user.displayName }}</span>
                      <span class="block truncate text-xs text-muted-foreground">{{ accountIdentifier(user) }}</span>
                    </span>
                    <Badge variant="secondary">{{ roleLabel(user) }}</Badge>
                  </button>
                </TabsContent>
              </Tabs>
              <p class="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                <InfoIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                หน้านี้จำลองการเลือกบัญชีเท่านั้น ยังไม่ได้เชื่อมต่อ KKU SSO จริง
              </p>
            </template>

            <template v-else>
              <DialogHeader class="text-left">
                <div class="mb-3 flex items-center gap-3 pr-7">
                  <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="กลับไปหน้าเข้าสู่ระบบ" @click="openView('login')">
                    <ArrowLeftIcon aria-hidden="true" />
                  </Button>
                  <div>
                    <DialogTitle>เริ่มการทดสอบใหม่?</DialogTitle>
                    <DialogDescription class="mt-1">ข้อมูลจำลองที่เปลี่ยนทั้งหมดจะกลับเป็นค่าเริ่มต้น และคุณจะออกจากระบบ</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div class="mt-3 rounded-xl border bg-muted/35 p-4">
                <p class="text-sm font-medium">สิ่งที่จะเกิดขึ้น</p>
                <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>ล้างบัญชีและ session สำหรับการสาธิต</li>
                  <li>คืนค่าข้อมูล mock-up เป็นสถานะเริ่มต้น</li>
                  <li>กลับมาเปิดหน้าต่างเข้าสู่ระบบอีกครั้ง</li>
                </ul>
              </div>
              <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" @click="openView('login')">ยกเลิก</Button>
                <Button type="button" @click="resetDemoData"><RotateCcwIcon aria-hidden="true" />รีเซตและเริ่มใหม่</Button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
