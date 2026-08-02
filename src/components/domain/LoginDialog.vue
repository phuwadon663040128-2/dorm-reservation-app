<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  ArrowLeftIcon, CheckCircle2Icon, ChevronDownIcon, EyeIcon, EyeOffIcon,
  GraduationCapIcon, InfoIcon, MailCheckIcon, MegaphoneIcon, RotateCcwIcon,
  ShieldCheckIcon, UserRoundCogIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/composables/useTheme'
import { users } from '@/fixtures/users'
import { resetDemoData } from '@/lib/demo-reset'
import { preloadCampus3d } from '@/lib/preloadCampus3d'
import { errorsFromZod, INPUT_LIMITS, loginCredentialsSchema, registrationSchema } from '@/lib/validation'
import { useSessionStore } from '@/stores/session'
import type { User } from '@/types'
import kkuEmblem from '@/assets/kku-emblem.webp'
import heroDay from '@/assets/login-illustration-light.webp'
import heroNight from '@/assets/login-illustration-dark.webp'

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
const loginEmail = ref('nicha.demo@example.test')
const loginPassword = ref('demo1234')
const loginError = ref('')
const loginFieldErrors = ref<Record<string, string>>({})
const registerEmail = ref('')
const registerPassword = ref('')
const acceptedNotice = ref(false)
const registrationError = ref('')
const registrationFieldErrors = ref<Record<string, string>>({})
const dialogInitialFocus = ref<HTMLElement | null>(null)

const heroImage = computed(() => (theme.value === 'dark' ? heroNight : heroDay))
const verificationEmail = computed(() => session.pendingEmailRegistration() || 'อีเมลที่สมัคร')
const hasPendingRegistration = computed(() => Boolean(session.pendingEmailRegistration()))
const ssoApplicants = users.filter(user => user.role === 'applicant' && user.kkuSsoLinked)
const staffAccounts = users.filter(user => user.role !== 'applicant')
const scenarioAccounts = [
  { id: 'applicant-i', label: 'เริ่มเลือกห้องใหม่', hint: 'ยังไม่มีการจองและใบสมัคร' },
  { id: 'applicant-b', label: 'ดูขั้นตอนชำระเงิน', hint: 'มีรายการ QR และรายการรอ QR' },
  { id: 'applicant-h', label: 'ยืนยันห้องกับรูมเมท', hint: 'พร้อมดำเนินการขั้นถัดไป' },
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
    loginFieldErrors.value = {}
    registrationFieldErrors.value = {}
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

async function focusFirstInvalid() {
  await nextTick()
  const element = document.querySelector<HTMLElement>('[role="dialog"] [aria-invalid="true"]')
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element?.focus({ preventScroll: true })
}

async function signInByEmail() {
  loginError.value = ''
  loginFieldErrors.value = {}
  const validation = loginCredentialsSchema.safeParse({
    email: loginEmail.value,
    password: loginPassword.value,
  })
  if (!validation.success) {
    loginFieldErrors.value = errorsFromZod(validation.error)
    await focusFirstInvalid()
    return
  }
  loginEmail.value = validation.data.email.trim().toLowerCase()
  const user = session.authenticateApplicant(loginEmail.value, loginPassword.value)
  if (!user) {
    loginError.value = 'ไม่พบบัญชีผู้สมัครหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง'
    return
  }
  if (!user.emailVerified) {
    loginError.value = 'กรุณายืนยันอีเมลก่อนเริ่มเลือกและจองห้องพัก'
    return
  }
  toast.success('เข้าสู่ระบบด้วยอีเมลส่วนตัวสำเร็จ')
  void preloadCampus3d()
  emit('signed-in', destination())
}

async function submitRegistration() {
  registrationError.value = ''
  registrationFieldErrors.value = {}
  const validation = registrationSchema.safeParse({
    email: registerEmail.value,
    password: registerPassword.value,
    acceptedNotice: acceptedNotice.value,
  })
  if (!validation.success) {
    registrationFieldErrors.value = errorsFromZod(validation.error)
    await focusFirstInvalid()
    return
  }
  const normalizedEmail = validation.data.email.trim().toLowerCase()
  if (session.userByEmail(normalizedEmail)) {
    registrationError.value = 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณากลับไปเข้าสู่ระบบ'
    return
  }
  registerEmail.value = normalizedEmail
  if (!session.beginEmailRegistration(normalizedEmail, validation.data.password)) {
    registrationError.value = 'ไม่สามารถบันทึกข้อมูลสมัครบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง'
    return
  }
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
  emit('signed-in', destination())
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

function handleOpenAutoFocus(event: Event) {
  event.preventDefault()
  void nextTick(() => dialogInitialFocus.value?.focus({ preventScroll: true }))
}
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="h-auto max-h-[calc(100svh-2rem)] w-[calc(100vw-1rem)] max-w-[32rem]! grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden rounded-xl bg-card p-0 min-[1100px]:h-[calc(100svh-2rem)] min-[1100px]:max-h-[42rem] min-[1100px]:max-w-[72rem]! min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,29fr)_minmax(26rem,21fr)] [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:z-30 [&_[data-slot=dialog-close]]:bg-card/80 [&_[data-slot=dialog-close]]:backdrop-blur-sm"
      @open-auto-focus="handleOpenAutoFocus"
    >
      <aside class="relative isolate hidden min-h-0 overflow-hidden bg-background min-[1100px]:block" aria-label="บริการของหอพักออนไลน์">
        <template v-if="view === 'register'">
          <img
            :src="heroImage"
            width="1200"
            :height="theme === 'dark' ? 800 : 689"
            alt="อาคารหอพักในกำกับ มหาวิทยาลัยขอนแก่น"
            decoding="async"
            class="absolute -left-[24.8%] -top-[0.25%] h-auto w-[158.7%] max-w-none"
          />
          <div class="absolute inset-x-0 bottom-0 z-10 h-[44.4%] bg-background px-8 pb-7 pt-14">
            <h2 class="max-w-2xl text-[2rem] font-bold leading-[1.18] tracking-tight">
              <span class="block">บริการของหอพักออนไลน์</span>
              <span class="mt-1 block text-primary">เลือกห้องพัก ชำระเงิน และทำสัญญา<br />ครบในระบบเดียว</span>
            </h2>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              ระบบรับสมัครและจองหอพักในกำกับมหาวิทยาลัยขอนแก่น รองรับการเลือกห้องเป็นรายห้อง จับคู่รูมเมท
              เหมาห้อง ชำระเงินผ่านแบบฟอร์มธนาคารอย่างเป็นทางการ และติดตามสัญญาจนถึงวันรับกุญแจ
            </p>
          </div>
        </template>

        <template v-else>
          <div class="relative z-10 px-10 py-9">
            <Badge variant="outline" class="h-8 gap-2 border-border bg-card px-4 text-sm font-semibold text-primary shadow-sm hover:bg-card">
              <MegaphoneIcon class="size-4" aria-hidden="true" />
              เปิดให้จอง · 1 - 31 พฤษภาคม 2569
            </Badge>
            <h2 class="mt-5 max-w-2xl text-[2rem] font-bold leading-[1.18] tracking-tight">
              <span class="block">บริการของหอพักออนไลน์</span>
              <span class="mt-2 block text-primary">เลือกห้องพัก ชำระเงิน และทำสัญญา<br />ครบในระบบเดียว</span>
            </h2>
            <p class="mt-5 max-w-[27rem] text-sm leading-6 text-muted-foreground">
              ระบบรับสมัครและจองหอพักในกำกับมหาวิทยาลัยขอนแก่น รองรับการเลือกห้องเป็นรายห้อง จับคู่รูมเมท
              เหมาห้อง ชำระเงินผ่านแบบฟอร์มธนาคารอย่างเป็นทางการ และติดตามสัญญาจนถึงวันรับกุญแจ
            </p>
          </div>
          <img
            :src="heroImage"
            width="1200"
            :height="theme === 'dark' ? 800 : 689"
            alt="อาคารหอพักในกำกับ มหาวิทยาลัยขอนแก่น"
            decoding="async"
            class="absolute -left-[6.67%] top-[49.6%] h-[63.5%] w-[106.7%] max-w-none object-cover object-center"
          />
        </template>
      </aside>

      <section
        ref="dialogInitialFocus"
        tabindex="-1"
        class="flex min-h-0 min-w-0 flex-col overflow-y-auto bg-card px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] focus:outline-none sm:px-8 sm:py-8"
        aria-label="เข้าสู่ระบบและสร้างบัญชี"
      >
        <div class="mx-auto flex min-h-0 min-w-0 w-full max-w-[31.5rem] flex-1 flex-col">
          <div v-if="view === 'login' || view === 'register'" class="flex h-9 items-center gap-2.5 pr-10 sm:h-10">
            <img :src="kkuEmblem" alt="ตรามหาวิทยาลัยขอนแก่น" width="150" height="267" class="h-9 w-auto shrink-0 sm:h-10" />
            <span class="leading-tight">
              <span class="block text-[13px] font-semibold text-kku-red">หอพักในกำกับ มหาวิทยาลัยขอนแก่น</span>
              <span class="mt-0.5 block text-[11px] text-muted-foreground">ระบบจัดการจองหอพัก</span>
            </span>
          </div>
          <template v-if="view === 'login'">
            <div class="flex min-h-0 flex-1 flex-col">
              <DialogHeader class="mt-4 space-y-0 text-left sm:mt-7">
                <DialogTitle class="text-[1.75rem] font-bold leading-8 tracking-tight sm:text-[2rem] sm:leading-9">เข้าสู่ระบบ</DialogTitle>
                <DialogDescription class="mt-1 text-sm leading-5 sm:mt-2 sm:leading-6">
                  ใช้อีเมลส่วนตัวที่ยืนยันแล้ว หรือบัญชี KKU-SSO ของท่าน
                </DialogDescription>
              </DialogHeader>

              <Alert v-if="props.reset" class="mt-4">
                <CheckCircle2Icon aria-hidden="true" />
                <AlertTitle>รีเซตข้อมูลทดสอบแล้ว</AlertTitle>
                <AlertDescription>เลือกสถานการณ์และเริ่มทดสอบใหม่ได้ทันที</AlertDescription>
              </Alert>

              <form data-testid="login-form" class="mt-4 space-y-3 sm:mt-5 sm:space-y-4" @submit.prevent="signInByEmail">
                <Field>
                  <FieldLabel for="dialog-login-email" class="text-sm font-semibold">อีเมล</FieldLabel>
                  <Input
                    id="dialog-login-email"
                    v-model="loginEmail"
                    class="h-10 rounded-xl px-3 text-sm sm:h-11"
                    type="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    :maxlength="INPUT_LIMITS.email"
                    :aria-invalid="Boolean(loginFieldErrors.email)"
                    :aria-describedby="loginError ? 'dialog-login-error' : undefined"
                    @input="loginError = ''; loginFieldErrors.email = ''"
                  />
                  <FieldError :errors="[loginFieldErrors.email]" />
                </Field>

                <Field>
                  <FieldLabel for="dialog-login-password" class="text-sm font-semibold">รหัสผ่าน</FieldLabel>
                  <div class="relative">
                    <Input
                      id="dialog-login-password"
                      v-model="loginPassword"
                      class="h-10 w-full rounded-xl px-3 pr-11 text-sm sm:h-11"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      :maxlength="INPUT_LIMITS.password"
                      :aria-invalid="Boolean(loginFieldErrors.password)"
                      :aria-describedby="loginError ? 'dialog-login-error' : undefined"
                      @input="loginError = ''; loginFieldErrors.password = ''"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                      @click="showPassword = !showPassword"
                    >
                      <EyeOffIcon v-if="showPassword" class="size-4" aria-hidden="true" />
                      <EyeIcon v-else class="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <FieldError :errors="[loginFieldErrors.password]" />
                  <div class="flex justify-end">
                    <Button type="button" variant="link" class="h-auto px-0 py-0 text-xs font-normal" @click="requestPasswordReset">
                      ลืมรหัสผ่าน?
                    </Button>
                  </div>
                </Field>

                <FieldError
                  v-if="loginError"
                  id="dialog-login-error"
                  class="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                >
                  <InfoIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{{ loginError }}</span>
                </FieldError>

                <Button
                  type="submit"
                  data-testid="login-submit"
                  size="lg"
                  class="h-10 w-full justify-center rounded-xl font-semibold hover:-translate-y-px hover:bg-primary/90 hover:shadow-md sm:h-11"
                  @pointerenter="preloadCampus3d"
                  @focus="preloadCampus3d"
                >
                  เข้าสู่ระบบ
                </Button>
              </form>

              <div class="my-3 flex items-center gap-3 sm:my-4" aria-hidden="true">
                <Separator class="flex-1" />
                <span class="text-sm text-muted-foreground">หรือ</span>
                <Separator class="flex-1" />
              </div>

              <Tooltip>
                <TooltipTrigger as-child>
                  <span
                    tabindex="0"
                    class="block cursor-not-allowed rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="เข้าสู่ระบบด้วย KKU SSO — กำลังพัฒนา"
                  >
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      class="pointer-events-none h-10 w-full justify-center rounded-xl bg-background/50 font-semibold sm:h-11"
                      disabled
                      aria-disabled="true"
                    >
                      <GraduationCapIcon class="size-4.5" aria-hidden="true" />
                      เข้าสู่ระบบด้วย KKU SSO
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" :side-offset="8">กำลังพัฒนา</TooltipContent>
              </Tooltip>

              <div class="mt-auto pt-4 text-center sm:pt-5">
                <p class="text-sm text-muted-foreground">ยังไม่มีบัญชีใช่ไหม?</p>
                <Button type="button" variant="outline" class="mt-1.5 h-10 w-full rounded-xl bg-background/50 font-semibold sm:mt-2 sm:h-11" data-testid="login-create-account" @click="openView('register')">
                  สร้างบัญชี
                </Button>
              </div>
            </div>
          </template>

          <template v-else-if="view === 'register'">
            <DialogHeader class="mt-4 space-y-0 text-left sm:mt-7">
              <DialogTitle class="pr-10 text-[1.75rem] font-bold leading-8 tracking-tight sm:text-[2rem] sm:leading-9">สร้างบัญชีผู้สมัคร</DialogTitle>
              <DialogDescription class="mt-1 text-sm leading-5 sm:mt-2 sm:leading-6">
                สมัครด้วยอีเมลส่วนตัวและเชื่อมบัญชี KKU ภายหลังได้
              </DialogDescription>
            </DialogHeader>

            <form class="mt-4 space-y-3 sm:mt-5 sm:space-y-4" @submit.prevent="submitRegistration">
              <Field>
                <FieldLabel for="dialog-register-email" class="text-sm font-semibold">อีเมล</FieldLabel>
                <Input
                  id="dialog-register-email"
                  v-model="registerEmail"
                  class="h-10 rounded-xl px-3 text-sm sm:h-11"
                  type="email"
                  autocomplete="email"
                  placeholder="name@example.com"
                  :maxlength="INPUT_LIMITS.email"
                  :aria-invalid="Boolean(registrationFieldErrors.email)"
                  :aria-describedby="registrationError ? 'dialog-register-error' : undefined"
                  @input="registrationError = ''; registrationFieldErrors.email = ''"
                />
                <FieldError :errors="[registrationFieldErrors.email]" />
              </Field>

              <Field>
                <FieldLabel for="dialog-register-password" class="text-sm font-semibold">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</FieldLabel>
                <div class="relative">
                  <Input
                    id="dialog-register-password"
                    v-model="registerPassword"
                    class="h-10 w-full rounded-xl px-3 pr-11 text-sm sm:h-11"
                    :type="showRegisterPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="••••••••"
                    :maxlength="INPUT_LIMITS.password"
                    :aria-invalid="Boolean(registrationFieldErrors.password)"
                    :aria-describedby="registrationError ? 'dialog-register-error' : undefined"
                    @input="registrationError = ''; registrationFieldErrors.password = ''"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    :aria-label="showRegisterPassword ? 'ซ่อนรหัสผ่านใหม่' : 'แสดงรหัสผ่านใหม่'"
                    @click="showRegisterPassword = !showRegisterPassword"
                  >
                    <EyeOffIcon v-if="showRegisterPassword" class="size-4" aria-hidden="true" />
                    <EyeIcon v-else class="size-4" aria-hidden="true" />
                  </button>
                </div>
                <FieldError :errors="[registrationFieldErrors.password]" />
              </Field>

              <div class="flex min-w-0 items-start gap-2.5 rounded-xl border bg-background/40 p-3">
                <ShieldCheckIcon class="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                <div class="min-w-0">
                  <p class="text-sm font-semibold">ประกาศความเป็นส่วนตัว</p>
                  <p class="mt-1 break-words text-xs leading-5 text-muted-foreground">
                    ระบบเก็บข้อมูลเท่าที่จำเป็นต่อการสมัครและจองหอพัก ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                  </p>
                </div>
              </div>

              <Field orientation="horizontal" class="items-start gap-2.5">
                <Checkbox id="dialog-register-notice" v-model="acceptedNotice" class="mt-0.5" :aria-invalid="Boolean(registrationFieldErrors.acceptedNotice)" @update:model-value="registrationFieldErrors.acceptedNotice = ''" />
                <FieldLabel for="dialog-register-notice" class="text-xs font-normal leading-5 sm:text-sm">
                  ข้าพเจ้าได้อ่านและรับทราบประกาศความเป็นส่วนตัวแล้ว
                </FieldLabel>
              </Field>
              <FieldError :errors="[registrationFieldErrors.acceptedNotice]" />

              <FieldError v-if="registrationError" id="dialog-register-error">
                {{ registrationError }}
              </FieldError>

              <Button type="submit" size="lg" class="h-10 w-full rounded-xl font-semibold sm:h-11">สร้างบัญชี</Button>
            </form>

            <Button type="button" variant="link" class="mt-2 w-full text-primary" @click="openView('login')">
              มีบัญชีแล้ว? กลับไปเข้าสู่ระบบ
            </Button>
          </template>

          <template v-else-if="view === 'verify'">
            <DialogHeader class="text-left">
              <div class="mb-3 flex items-center gap-3 pr-10">
                <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="กลับไปแก้ข้อมูลสมัคร" @click="openView('register')">
                  <ArrowLeftIcon aria-hidden="true" />
                </Button>
                <div>
                  <DialogTitle class="text-2xl">ตรวจสอบอีเมลของคุณ</DialogTitle>
                  <DialogDescription class="mt-1">ต้องยืนยันอีเมลก่อนเลือกห้อง เชิญรูมเมท หรือจองห้องพัก</DialogDescription>
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
              <Button type="button" variant="outline" :disabled="!hasPendingRegistration" @click="toast.success('ส่งอีเมลยืนยันแบบจำลองใหม่แล้ว')">
                ส่งอีเมลยืนยันอีกครั้ง
              </Button>
              <Button type="button" :disabled="!hasPendingRegistration" @click="completeVerification">จำลองยืนยันอีเมลและเริ่มเลือกห้อง</Button>
            </div>
            <div class="mt-3 flex flex-wrap justify-center gap-x-2 text-xs">
              <Button type="button" variant="link" size="sm" @click="openView('register')">แก้ข้อมูลสมัคร</Button>
              <Button type="button" variant="link" size="sm" @click="openView('login')">กลับไปเข้าสู่ระบบ</Button>
            </div>
          </template>

          <template v-else-if="view === 'sso'">
            <DialogHeader class="text-left">
              <div class="mb-3 flex items-center gap-3 pr-10">
                <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="กลับไปหน้ารหัสผ่าน" @click="openView('login')">
                  <ArrowLeftIcon aria-hidden="true" />
                </Button>
                <div>
                  <DialogTitle class="text-2xl">เลือกบัญชี KKU SSO</DialogTitle>
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
            <Collapsible v-model:open="demoOpen" class="mt-3 rounded-xl border text-left">
              <CollapsibleTrigger as-child>
                <Button type="button" variant="ghost" class="h-10 w-full justify-between px-4 text-xs text-muted-foreground">
                  <span class="flex items-center gap-2"><UserRoundCogIcon class="size-4" aria-hidden="true" />บัญชีทดสอบสำหรับต้นแบบ</span>
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
          </template>

          <template v-else>
            <DialogHeader class="text-left">
              <div class="mb-3 flex items-center gap-3 pr-10">
                <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="กลับไปหน้าเข้าสู่ระบบ" @click="openView('login')">
                  <ArrowLeftIcon aria-hidden="true" />
                </Button>
                <div>
                  <DialogTitle class="text-2xl">เริ่มการทดสอบใหม่?</DialogTitle>
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
      </section>
    </DialogContent>
    </Dialog>
  </TooltipProvider>
</template>
