<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'
import { Textarea } from '@/components/ui/textarea'
import ApplicationAttachmentField from '@/components/domain/ApplicationAttachmentField.vue'
import {
  formatGpa,
  formatStudentId,
  INPUT_LIMITS,
  maskIdentityNumber,
  normalizeApplicationData,
  normalizePhone,
  type ValidationErrors,
  validateApplicationStepData,
} from '@/lib/validation'
import { useApplicationStore } from '@/stores/application'
import { useDormStore } from '@/stores/dorm'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const dorm = useDormStore()
const session = useSessionStore()
const application = useApplicationStore()
const { currentRecord, draft, isRevising, submittedReference } = storeToRefs(application)

const currentStep = ref(1)
const highestStep = ref(1)
const validationMessage = ref('')
const fieldErrors = ref<ValidationErrors>({})
const submissionSuccessOpen = ref(false)
const birthDatePopoverOpen = ref(false)
const birthDateClosedByViewportMove = ref(false)
const photoUploadFile = shallowRef<File | null>(null)
const medicalCertificateUploadFile = shallowRef<File | null>(null)
const desktopApplicantNavigationVisible = useMediaQuery('(min-width: 1024px)')

// Portal ของ dropdown และปฏิทินต้องหลบทั้ง header และ bottom navigation บนมือถือ
const floatingContentCollisionPadding = computed(() => ({
  top: desktopApplicantNavigationVisible.value ? 120 : 72,
  right: 16,
  bottom: desktopApplicantNavigationVisible.value ? 16 : 80,
  left: 16,
}))

const birthDateViewportTarget = computed<EventTarget | null>(() =>
  birthDatePopoverOpen.value ? document : null,
)

const currentDate = today(getLocalTimeZone())
const defaultBirthDate = currentDate.subtract({ years: 18 })
const thaiDateFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const steps = [
  {
    id: 1,
    title: 'ประเภทผู้สมัคร',
    description: 'เลือกประเภทผู้สมัครในรอบนี้',
    icon: GraduationCapIcon,
  },
  {
    id: 2,
    title: 'ข้อมูลผู้สมัคร',
    description: 'ข้อมูลส่วนตัวและการศึกษา',
    icon: UserRoundIcon,
  },
  {
    id: 3,
    title: 'สุขภาพและเอกสาร',
    description: 'ข้อมูลเพิ่มเติมประกอบการสมัคร',
    icon: HeartPulseIcon,
  },
  {
    id: 4,
    title: 'ตรวจสอบและส่ง',
    description: 'ทบทวนข้อมูลและข้อตกลง',
    icon: ClipboardCheckIcon,
  },
]

const applicantTypes = [
  { value: 'new_first_year', label: 'นักศึกษาใหม่ชั้นปีที่ 1', detail: 'ผู้มีรหัสนักศึกษาและกำลังเริ่มปีการศึกษา 2569' },
  { value: 'current_resident', label: 'ผู้พักปัจจุบัน', detail: 'ผู้พักที่ต้องการยื่นข้อมูลสำหรับรอบใหม่' },
  { value: 'other_dorm_senior', label: 'นักศึกษาชั้นปีอื่นจากหออื่น', detail: 'นักศึกษาปัจจุบันที่ประสงค์ย้ายเข้าหอพักในกำกับ' },
  { value: 'international', label: 'นักศึกษาต่างชาติ', detail: 'International student applicant' },
  { value: 'general', label: 'ผู้สมัครทั่วไปตามประกาศ', detail: 'ขึ้นอยู่กับคุณสมบัติของรอบรับสมัครนี้' },
]

const campaign = computed(() => dorm.campaignById(draft.value.campaignId) ?? dorm.openCampaigns[0])
const selectedApplicantType = computed(() => applicantTypes.find(type => type.value === draft.value.applicantType))
const gpaRequired = computed(() => ['current_resident', 'other_dorm_senior'].includes(draft.value.applicantType))
const activeAssignment = computed(() =>
  application.roomAssignmentForApplicant(session.currentUser?.id ?? ''),
)
const roomAssignmentDisplayStep = computed(() =>
  desktopApplicantNavigationVisible.value ? 1 : steps.length,
)
const isFormLocked = computed(() => Boolean(submittedReference.value) && !isRevising.value)
const submissionConfirmationsComplete = computed(() =>
  Boolean(draft.value.acceptsRules && draft.value.confirmsAccuracy),
)
const progressValue = computed(() => currentStep.value * 25)

function parseDraftBirthDate() {
  if (!draft.value.dateOfBirth) return null
  try {
    return parseDate(draft.value.dateOfBirth)
  }
  catch {
    return null
  }
}

// เก็บค่าใน store เป็น ISO เดิมเพื่อไม่เปลี่ยนสัญญาข้อมูล แม้หน้าจอใช้ CalendarDate
const birthDateValue = computed<DateValue | undefined>({
  get: () => parseDraftBirthDate() ?? undefined,
  set: (value) => {
    draft.value.dateOfBirth = value?.toString() ?? ''
    if (value) birthDatePopoverOpen.value = false
  },
})

const formattedBirthDate = computed(() => {
  const value = birthDateValue.value
  if (!value) return ''
  return thaiDateFormatter.format(new Date(Date.UTC(value.year, value.month - 1, value.day)))
})

function closeBirthDatePopoverOnViewportMove() {
  if (!birthDatePopoverOpen.value) return
  birthDateClosedByViewportMove.value = true
  birthDatePopoverOpen.value = false
}

function handleBirthDateCloseAutoFocus(event: Event) {
  if (!birthDateClosedByViewportMove.value) return
  event.preventDefault()
  birthDateClosedByViewportMove.value = false
}

watch(birthDatePopoverOpen, (open) => {
  if (open) birthDateClosedByViewportMove.value = false
})

watch(draft, () => {
  fieldErrors.value = {}
  validationMessage.value = ''
}, { deep: true, flush: 'sync' })

// ปิดก่อน Floating UI คำนวณตำแหน่งใหม่ระหว่างเลื่อน เพื่อไม่ให้ปฏิทินลอยตามหรือทับแถบนำทาง
useEventListener(
  birthDateViewportTarget,
  ['wheel', 'touchmove', 'scroll'],
  closeBirthDatePopoverOnViewportMove,
  { capture: true, passive: true },
)

function validateStep(step: number) {
  if (step < 1 || step > 4) return false
  const normalized = normalizeApplicationData(draft.value)
  Object.assign(draft.value, normalized)
  const validation = validateApplicationStepData(normalized, step as 1 | 2 | 3 | 4)
  fieldErrors.value = validation.errors
  validationMessage.value = validation.ok
    ? ''
    : Object.values(validation.errors)[0] ?? 'กรุณาตรวจสอบข้อมูลอีกครั้ง'

  if (!validation.ok) void focusFirstInvalidField()
  return validation.ok
}

async function focusFirstInvalidField() {
  await nextTick()
  const element = document.querySelector<HTMLElement>('[aria-invalid="true"]')
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element?.focus({ preventScroll: true })
}

function validateApplication() {
  for (const step of steps) {
    if (validateStep(step.id)) continue
    currentStep.value = step.id
    return false
  }
  return true
}

function nextStep() {
  if (!isFormLocked.value && !validateStep(currentStep.value)) return
  currentStep.value = Math.min(currentStep.value + 1, steps.length)
  highestStep.value = Math.max(highestStep.value, currentStep.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 1)
  validationMessage.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function submitApplication() {
  if (!validateApplication()) return
  const reference = application.submit()
  if (!reference) {
    validationMessage.value = 'ไม่สามารถบันทึกใบสมัครได้ กรุณาตรวจสอบข้อมูลอีกครั้ง'
    return
  }
  session.markCurrentApplicantProfileComplete()
  submissionSuccessOpen.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function goToReservationAfterSubmission() {
  submissionSuccessOpen.value = false
  await router.push('/app/reservation')
}

function beginRevision() {
  application.beginRevision()
  draft.value.confirmsAccuracy = false
  currentStep.value = 2
  highestStep.value = steps.length
  validationMessage.value = ''
  toast.info('เปิดข้อมูลส่วนตัวให้แก้ไขแล้ว กรุณาตรวจสอบและยืนยันความถูกต้องอีกครั้ง')
}

function saveRevision() {
  if (!validateApplication()) return
  const reference = application.saveRevision()
  if (!reference) {
    validationMessage.value = 'ไม่สามารถบันทึกการแก้ไขได้ กรุณาตรวจสอบข้อมูลอีกครั้ง'
    return
  }
  toast.success(`บันทึกการแก้ไขใบสมัคร ${reference} เรียบร้อยแล้ว`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectStep(stepId: number | undefined) {
  if (!stepId || stepId === currentStep.value || stepId > highestStep.value) return
  if (
    !isFormLocked.value
    && stepId > currentStep.value
    && !validateStep(currentStep.value)
  ) return

  currentStep.value = stepId
  validationMessage.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  application.hydrateIdentity(session.currentUser)
  const campaignId = typeof route.params.campaignId === 'string' ? route.params.campaignId : ''
  if (!submittedReference.value && campaignId && dorm.campaignById(campaignId)) draft.value.campaignId = campaignId
  if (!draft.value.campaignId && dorm.openCampaigns[0]) draft.value.campaignId = dorm.openCampaigns[0].id
  if (submittedReference.value) highestStep.value = steps.length
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1408px] space-y-6 pb-10">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">ปีการศึกษา 2569</Badge>
          <Badge v-if="campaign?.status === 'open'">เปิดรับสมัคร</Badge>
        </div>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">กรอกใบสมัครเข้าหอพัก</h1>
        <p class="max-w-3xl text-sm text-muted-foreground sm:text-base">
          ระบบเติมข้อมูลหอพักและห้องจากรายการจองของคุณให้อัตโนมัติ กรุณากรอกข้อมูลส่วนตัวให้ครบและตรวจสอบก่อนส่ง
        </p>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <SaveIcon class="size-4" aria-hidden="true" />
        ร่างนี้เก็บไว้ระหว่างการสาธิต
      </div>
    </div>

    <div class="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside class="hidden lg:sticky lg:top-[7.5rem] lg:block">
        <Card class="overflow-hidden">
          <CardHeader class="space-y-3 pb-4">
            <div>
              <CardTitle>ขั้นตอนการกรอกใบสมัคร</CardTitle>
              <CardDescription class="mt-1">กรอกข้อมูลทั้งหมด 4 ขั้นตอน สามารถย้อนกลับไปตรวจสอบขั้นที่เปิดแล้วได้</CardDescription>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="font-medium text-foreground">ขั้นตอน {{ currentStep }} จาก {{ steps.length }}</span>
                <span class="tabular-nums text-muted-foreground">{{ progressValue }}%</span>
              </div>
              <Progress :model-value="progressValue" class="h-2" />
            </div>
          </CardHeader>
          <CardContent class="pt-0">
            <Stepper
              :model-value="currentStep"
              orientation="vertical"
              linear
              class="flex w-full flex-col gap-0"
              @update:model-value="selectStep"
            >
              <StepperItem
                v-for="step in steps"
                :key="step.id"
                v-slot="{ state }"
                :step="step.id"
                :disabled="step.id > highestStep"
                class="relative flex w-full items-start pb-8 last:pb-0"
              >
                <StepperSeparator
                  v-if="step.id < steps.length"
                  class="absolute bottom-0 left-5 top-10 w-0.5 -translate-x-1/2 rounded-full bg-border transition-colors group-data-[state=completed]:bg-primary"
                />
                <StepperTrigger
                  class="group/step relative z-10 w-full flex-row items-start gap-4 rounded-md p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <StepperIndicator
                    class="size-10 shrink-0 border border-border bg-card text-muted-foreground transition-colors group-data-[state=active]:border-primary group-data-[state=active]:bg-card group-data-[state=active]:text-primary group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary/20 group-data-[state=active]:ring-offset-2 group-data-[state=active]:ring-offset-card group-data-[state=completed]:border-primary group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground"
                  >
                    <CheckIcon v-if="state === 'completed'" class="size-5" aria-hidden="true" />
                    <component :is="step.icon" v-else class="size-5" aria-hidden="true" />
                  </StepperIndicator>
                  <div class="min-w-0 flex-1 space-y-1 pt-0.5">
                    <StepperTitle class="text-left text-sm leading-5 transition-colors group-data-[state=active]:text-primary group-hover/step:text-primary">
                      {{ step.title }}
                    </StepperTitle>
                    <StepperDescription class="text-left text-xs leading-relaxed">{{ step.description }}</StepperDescription>
                  </div>
                </StepperTrigger>
              </StepperItem>
            </Stepper>
          </CardContent>
        </Card>
      </aside>

      <div class="min-w-0 space-y-5">
        <Card class="overflow-hidden lg:hidden">
          <CardHeader class="space-y-3 pb-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <CardTitle>ขั้นตอนการกรอกใบสมัคร</CardTitle>
                <CardDescription class="mt-1">แตะขั้นตอนที่เปิดแล้วเพื่อกลับไปตรวจสอบข้อมูล</CardDescription>
              </div>
              <Badge variant="outline" class="shrink-0 tabular-nums">{{ currentStep }} / {{ steps.length }}</Badge>
            </div>
            <Progress :model-value="progressValue" class="h-2" />
          </CardHeader>
          <CardContent class="pt-0">
            <Stepper
              :model-value="currentStep"
              orientation="vertical"
              linear
              class="flex w-full flex-col gap-0"
              @update:model-value="selectStep"
            >
              <StepperItem
                v-for="step in steps"
                :key="step.id"
                v-slot="{ state }"
                :step="step.id"
                :disabled="step.id > highestStep"
                class="relative flex w-full items-start pb-6 last:pb-0"
              >
                <StepperSeparator
                  v-if="step.id < steps.length"
                  class="absolute bottom-0 left-[1.125rem] top-9 w-0.5 -translate-x-1/2 rounded-full bg-border transition-colors group-data-[state=completed]:bg-primary"
                />
                <StepperTrigger
                  class="group/step relative z-10 w-full flex-row items-start gap-3 rounded-md p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <StepperIndicator
                    class="size-9 shrink-0 border border-border bg-card text-muted-foreground transition-colors group-data-[state=active]:border-primary group-data-[state=active]:bg-card group-data-[state=active]:text-primary group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary/20 group-data-[state=active]:ring-offset-2 group-data-[state=active]:ring-offset-card group-data-[state=completed]:border-primary group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground"
                  >
                    <CheckIcon v-if="state === 'completed'" class="size-4" aria-hidden="true" />
                    <component :is="step.icon" v-else class="size-4" aria-hidden="true" />
                  </StepperIndicator>
                  <div class="min-w-0 flex-1 space-y-1 pt-0.5">
                    <StepperTitle class="text-left text-sm leading-5 transition-colors group-data-[state=active]:text-primary group-hover/step:text-primary">
                      {{ step.id }}. {{ step.title }}
                    </StepperTitle>
                    <StepperDescription class="text-left text-xs leading-relaxed">{{ step.description }}</StepperDescription>
                  </div>
                </StepperTrigger>
              </StepperItem>
            </Stepper>
          </CardContent>
        </Card>

        <Alert
          v-if="submittedReference"
          class="border-emerald-600/30 bg-emerald-600/10 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-100"
        >
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>ส่งใบสมัครต้นแบบเรียบร้อยแล้ว</AlertTitle>
          <AlertDescription class="text-emerald-800 dark:text-emerald-200">
            เลขที่ใบสมัคร <strong class="text-current">{{ submittedReference }}</strong>
            <span v-if="currentRecord" class="ml-1">เวอร์ชัน {{ currentRecord.revision }}</span>
            ระบบบันทึกใบสมัครพร้อมเชื่อมข้อมูลห้องจากรายการจองของคุณแล้ว
            <Button
              v-if="!isRevising"
              type="button"
              size="sm"
              variant="outline"
              class="mt-3 flex text-foreground"
              @click="beginRevision"
            >
              แก้ไขข้อมูลใบสมัคร
            </Button>
          </AlertDescription>
        </Alert>

        <Card v-if="activeAssignment && currentStep === roomAssignmentDisplayStep">
          <CardHeader>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-start gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <Building2Icon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>ข้อมูลห้องที่ระบบเติมให้</CardTitle>
                  <CardDescription>อ้างอิงจากรายการจองและการชำระเงินของคุณโดยอัตโนมัติ ข้อมูลส่วนนี้จึงแก้ไขจากใบสมัครไม่ได้</CardDescription>
                </div>
              </div>
              <Badge :variant="activeAssignment.status === 'confirmed' ? 'success' : 'warning'">
                {{ activeAssignment.status === 'confirmed' ? 'ยืนยันการจองแล้ว' : 'บันทึกจากการจองแล้ว' }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl class="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-lg border p-4">
                <dt class="text-xs text-muted-foreground">ชื่อหอพัก</dt>
                <dd class="mt-1 font-semibold">{{ activeAssignment.dormName }}</dd>
                <dd v-if="activeAssignment.dormCode" class="text-xs text-muted-foreground">{{ activeAssignment.dormCode }}</dd>
              </div>
              <div class="rounded-lg border p-4">
                <dt class="text-xs text-muted-foreground">อาคาร</dt>
                <dd class="mt-1 font-semibold">{{ activeAssignment.buildingName }}</dd>
              </div>
              <div class="rounded-lg border p-4">
                <dt class="text-xs text-muted-foreground">ชั้น</dt>
                <dd class="mt-1 font-semibold tabular-nums">ชั้น {{ activeAssignment.floor }}</dd>
              </div>
              <div class="rounded-lg border p-4">
                <dt class="text-xs text-muted-foreground">ประเภทห้อง</dt>
                <dd class="mt-1 font-semibold">{{ activeAssignment.roomTypeLabel }}</dd>
              </div>
              <div class="rounded-lg border p-4">
                <dt class="text-xs text-muted-foreground">เลขห้อง</dt>
                <dd class="mt-1 font-semibold tabular-nums">{{ activeAssignment.roomNumber }}</dd>
              </div>
              <div class="rounded-lg border p-4">
                <dt class="text-xs text-muted-foreground">รูปแบบการพัก</dt>
                <dd class="mt-1 font-semibold">
                  {{ activeAssignment.occupancyMode === 'whole_room' ? 'เหมาห้อง' : 'พักคู่' }}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div>
      <form class="min-w-0" @submit.prevent>
        <fieldset :disabled="isFormLocked" class="min-w-0 space-y-5 disabled:opacity-75">
        <template v-if="currentStep === 1">
          <Card>
            <CardHeader>
              <div class="flex items-start gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <GraduationCapIcon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>ประเภทผู้สมัคร</CardTitle>
                  <CardDescription>เลือกประเภทที่ตรงกับสถานะของคุณในรอบนี้</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup
                v-model="draft.applicantType"
                :disabled="Boolean(submittedReference)"
                :aria-invalid="Boolean(fieldErrors.applicantType)"
                class="grid gap-3 sm:grid-cols-2"
              >
                <FieldLabel
                  v-for="type in applicantTypes"
                  :key="type.value"
                  class="cursor-pointer flex-row items-start gap-3 p-4"
                >
                  <RadioGroupItem :value="type.value" class="mt-0.5" />
                  <span class="min-w-0">
                    <span class="block font-medium">{{ type.label }}</span>
                    <span class="mt-1 block text-xs font-normal text-muted-foreground">{{ type.detail }}</span>
                  </span>
                </FieldLabel>
              </RadioGroup>
              <FieldError class="mt-2" :errors="[fieldErrors.applicantType]" />
              <p v-if="submittedReference" class="mt-3 text-xs text-muted-foreground">
                ประเภทผู้สมัครและรอบรับสมัครถูกล็อกหลังส่งใบสมัครครั้งแรก
              </p>
            </CardContent>
          </Card>
        </template>

        <template v-else-if="currentStep === 2">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
              <CardDescription>ข้อมูลบางส่วนถูกเติมจากบัญชี KKU SSO mock โปรดตรวจสอบอีกครั้ง</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div class="grid gap-4 sm:grid-cols-[10rem_1fr_1fr]">
                  <Field>
                    <FieldLabel for="title">คำนำหน้า <span class="text-primary">*</span></FieldLabel>
                    <Select v-model="draft.title">
                      <SelectTrigger
                        id="title"
                        class="h-10 w-full"
                        aria-label="เลือกคำนำหน้า"
                        :aria-invalid="Boolean(fieldErrors.title)"
                      >
                        <SelectValue placeholder="เลือก" />
                      </SelectTrigger>
                      <SelectContent
                        :collision-padding="floatingContentCollisionPadding"
                        :side-flip="true"
                        class="w-[var(--reka-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                      >
                        <SelectItem value="นาย">นาย</SelectItem>
                        <SelectItem value="นาง">นาง</SelectItem>
                        <SelectItem value="นางสาว">นางสาว</SelectItem>
                        <SelectItem value="other">อื่น ๆ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError :errors="[fieldErrors.title]" />
                  </Field>
                  <Field>
                    <FieldLabel for="first-name">ชื่อ <span class="text-primary">*</span></FieldLabel>
                    <Input id="first-name" v-model="draft.firstName" class="h-10" autocomplete="given-name" :maxlength="INPUT_LIMITS.personName" :aria-invalid="Boolean(fieldErrors.firstName)" />
                    <FieldError :errors="[fieldErrors.firstName]" />
                  </Field>
                  <Field>
                    <FieldLabel for="last-name">นามสกุล <span class="text-primary">*</span></FieldLabel>
                    <Input id="last-name" v-model="draft.lastName" class="h-10" autocomplete="family-name" :maxlength="INPUT_LIMITS.personName" :aria-invalid="Boolean(fieldErrors.lastName)" />
                    <FieldError :errors="[fieldErrors.lastName]" />
                  </Field>
                </div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field>
                    <FieldLabel for="nickname">ชื่อเล่น</FieldLabel>
                    <Input id="nickname" v-model="draft.nickname" class="h-10" :maxlength="INPUT_LIMITS.nickname" :aria-invalid="Boolean(fieldErrors.nickname)" />
                    <FieldError :errors="[fieldErrors.nickname]" />
                  </Field>
                  <Field>
                    <FieldLabel for="birth-date">วันเดือนปีเกิด <span class="text-primary">*</span></FieldLabel>
                    <Popover v-model:open="birthDatePopoverOpen">
                      <PopoverTrigger as-child>
                        <Button
                          id="birth-date"
                          type="button"
                          variant="outline"
                          class="h-10 w-full justify-between px-3 font-normal"
                          :aria-invalid="Boolean(fieldErrors.dateOfBirth)"
                          :aria-label="formattedBirthDate ? `วันเดือนปีเกิด ${formattedBirthDate}` : 'เลือกวันเดือนปีเกิด'"
                        >
                          <span :class="formattedBirthDate ? 'text-foreground' : 'text-muted-foreground'">
                            {{ formattedBirthDate || 'เลือกวันเดือนปีเกิด' }}
                          </span>
                          <CalendarDaysIcon class="size-4 text-muted-foreground" aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        :collision-padding="floatingContentCollisionPadding"
                        hide-when-detached
                        align="start"
                        :side-offset="6"
                        class="z-20 w-80 max-w-[calc(100vw-2rem)] p-0 data-closed:animate-none data-closed:duration-0"
                        @close-auto-focus="handleBirthDateCloseAutoFocus"
                      >
                        <Calendar
                          v-model="birthDateValue"
                          :default-placeholder="defaultBirthDate"
                          :max-value="currentDate"
                          fixed-weeks
                          locale="th-TH"
                          layout="month-and-year"
                          initial-focus
                          class="w-full p-2"
                        />
                      </PopoverContent>
                    </Popover>
                    <FieldDescription>เลือกวันเกิดตามปฏิทิน ระบบจะแสดงปีพุทธศักราชและบันทึกเป็นวันที่มาตรฐาน</FieldDescription>
                    <FieldError :errors="[fieldErrors.dateOfBirth]" />
                  </Field>
                  <Field>
                    <FieldLabel for="nationality">สัญชาติ</FieldLabel>
                    <Input id="nationality" v-model="draft.nationality" class="h-10" :maxlength="INPUT_LIMITS.nationality" :aria-invalid="Boolean(fieldErrors.nationality)" />
                    <FieldError :errors="[fieldErrors.nationality]" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel for="id-number">เลขประจำตัวประชาชน / Passport</FieldLabel>
                  <Input id="id-number" v-model="draft.idNumber" class="h-10 sm:max-w-md" :maxlength="INPUT_LIMITS.identityNumber" :aria-invalid="Boolean(fieldErrors.idNumber)" autocomplete="off" />
                  <FieldDescription>ข้อมูลเสริม รองรับเลขบัตรประชาชนหรือ Passport และยังไม่ได้ยืนยันตัวตนด้วย ThaID</FieldDescription>
                  <FieldError :errors="[fieldErrors.idNumber]" />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลนักศึกษา</CardTitle>
              <CardDescription>อ้างอิงหัวข้อจากแบบฟอร์มกระดาษปีการศึกษา 2569</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field>
                    <FieldLabel for="student-id">รหัสนักศึกษา <span class="text-primary">*</span></FieldLabel>
                    <Input id="student-id" v-model="draft.studentId" class="h-10" inputmode="numeric" :maxlength="INPUT_LIMITS.studentId" :aria-invalid="Boolean(fieldErrors.studentId)" @blur="draft.studentId = formatStudentId(draft.studentId)" />
                    <FieldDescription>ตรวจเฉพาะรูปแบบ 10 หลัก ยังไม่ได้ตรวจสอบกับฐานข้อมูล KKU</FieldDescription>
                    <FieldError :errors="[fieldErrors.studentId]" />
                  </Field>
                  <Field>
                    <FieldLabel for="degree-level">ระดับการศึกษา <span class="text-primary">*</span></FieldLabel>
                    <Select v-model="draft.degreeLevel">
                      <SelectTrigger id="degree-level" class="h-10 w-full" aria-label="เลือกระดับการศึกษา" :aria-invalid="Boolean(fieldErrors.degreeLevel)">
                        <SelectValue placeholder="เลือกระดับการศึกษา" />
                      </SelectTrigger>
                      <SelectContent
                        :collision-padding="floatingContentCollisionPadding"
                        :side-flip="true"
                        class="w-[var(--reka-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                      >
                        <SelectItem value="bachelor">ปริญญาตรี</SelectItem>
                        <SelectItem value="master">ปริญญาโท</SelectItem>
                        <SelectItem value="doctoral">ปริญญาเอก</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError :errors="[fieldErrors.degreeLevel]" />
                  </Field>
                  <Field>
                    <FieldLabel for="study-year">ชั้นปี <span class="text-primary">*</span></FieldLabel>
                    <Select v-model="draft.studyYear">
                      <SelectTrigger
                        id="study-year"
                        class="h-10 w-full"
                        aria-label="เลือกชั้นปี"
                        :aria-invalid="Boolean(fieldErrors.studyYear)"
                      >
                        <SelectValue placeholder="เลือกชั้นปี" />
                      </SelectTrigger>
                      <SelectContent
                        :collision-padding="floatingContentCollisionPadding"
                        :side-flip="true"
                        class="w-[var(--reka-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                      >
                        <SelectItem v-for="year in 8" :key="year" :value="String(year)">ปี {{ year }}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError :errors="[fieldErrors.studyYear]" />
                  </Field>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel for="faculty">คณะ <span class="text-primary">*</span></FieldLabel>
                    <Input id="faculty" v-model="draft.faculty" class="h-10" placeholder="เช่น วิศวกรรมศาสตร์" :maxlength="INPUT_LIMITS.faculty" :aria-invalid="Boolean(fieldErrors.faculty)" />
                    <FieldError :errors="[fieldErrors.faculty]" />
                  </Field>
                  <Field>
                    <FieldLabel for="major">สาขาวิชา <span class="text-primary">*</span></FieldLabel>
                    <Input id="major" v-model="draft.major" class="h-10" :maxlength="INPUT_LIMITS.major" :aria-invalid="Boolean(fieldErrors.major)" />
                    <FieldError :errors="[fieldErrors.major]" />
                  </Field>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel for="gpa">เกรดเฉลี่ยสะสม (GPA) <span v-if="gpaRequired" class="text-primary">*</span></FieldLabel>
                    <Input id="gpa" v-model="draft.gpa" class="h-10" inputmode="decimal" placeholder="0.00" maxlength="4" :aria-invalid="Boolean(fieldErrors.gpa)" @blur="draft.gpa = formatGpa(draft.gpa)" />
                    <FieldDescription>{{ gpaRequired ? 'จำเป็นสำหรับประเภทผู้สมัครนี้' : 'เว้นว่างได้หากยังไม่มีผลการเรียนหรือใช้ระบบคะแนนอื่น' }}</FieldDescription>
                    <FieldError :errors="[fieldErrors.gpa]" />
                  </Field>
                  <Field>
                    <FieldLabel for="advisor">ชื่ออาจารย์ที่ปรึกษา</FieldLabel>
                    <Input id="advisor" v-model="draft.advisor" class="h-10" :maxlength="INPUT_LIMITS.advisor" :aria-invalid="Boolean(fieldErrors.advisor)" />
                    <FieldError :errors="[fieldErrors.advisor]" />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ช่องทางติดต่อและผู้ติดต่อฉุกเฉิน</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel for="phone">เบอร์โทรศัพท์ <span class="text-primary">*</span></FieldLabel>
                    <Input id="phone" v-model="draft.phone" class="h-10" type="tel" autocomplete="tel" :maxlength="INPUT_LIMITS.phone" :aria-invalid="Boolean(fieldErrors.phone)" @blur="draft.phone = normalizePhone(draft.phone)" />
                    <FieldDescription>รองรับเบอร์ไทย หรือรูปแบบสากล เช่น +66812345678</FieldDescription>
                    <FieldError :errors="[fieldErrors.phone]" />
                  </Field>
                  <Field>
                    <FieldLabel for="email">อีเมล <span class="text-primary">*</span></FieldLabel>
                    <Input id="email" v-model="draft.email" class="h-10" type="email" autocomplete="email" :maxlength="INPUT_LIMITS.email" :aria-invalid="Boolean(fieldErrors.email)" />
                    <FieldError :errors="[fieldErrors.email]" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel for="address">ที่อยู่ที่ติดต่อได้ <span class="text-primary">*</span></FieldLabel>
                  <Textarea id="address" v-model="draft.address" rows="3" placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" :maxlength="INPUT_LIMITS.address" :aria-invalid="Boolean(fieldErrors.address)" />
                  <div class="flex items-start justify-between gap-3"><FieldError :errors="[fieldErrors.address]" /><span class="ml-auto text-xs tabular-nums text-muted-foreground">{{ draft.address.length }}/{{ INPUT_LIMITS.address }}</span></div>
                </Field>
                <Separator />
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field>
                    <FieldLabel for="emergency-name">ชื่อผู้ติดต่อฉุกเฉิน <span class="text-primary">*</span></FieldLabel>
                    <Input id="emergency-name" v-model="draft.emergencyName" class="h-10" :maxlength="INPUT_LIMITS.emergencyName" :aria-invalid="Boolean(fieldErrors.emergencyName)" />
                    <FieldError :errors="[fieldErrors.emergencyName]" />
                  </Field>
                  <Field>
                    <FieldLabel for="emergency-relation">ความสัมพันธ์</FieldLabel>
                    <Input id="emergency-relation" v-model="draft.emergencyRelation" class="h-10" placeholder="เช่น บิดา มารดา ผู้ปกครอง" :maxlength="INPUT_LIMITS.emergencyRelation" :aria-invalid="Boolean(fieldErrors.emergencyRelation)" />
                    <FieldError :errors="[fieldErrors.emergencyRelation]" />
                  </Field>
                  <Field>
                    <FieldLabel for="emergency-phone">เบอร์โทรศัพท์ <span class="text-primary">*</span></FieldLabel>
                    <Input id="emergency-phone" v-model="draft.emergencyPhone" class="h-10" type="tel" :maxlength="INPUT_LIMITS.phone" :aria-invalid="Boolean(fieldErrors.emergencyPhone)" @blur="draft.emergencyPhone = normalizePhone(draft.emergencyPhone)" />
                    <FieldError :errors="[fieldErrors.emergencyPhone]" />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </template>

        <template v-else-if="currentStep === 3">
          <Card>
            <CardHeader>
              <div class="flex items-start gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <HeartPulseIcon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>ข้อมูลสุขภาพ</CardTitle>
                  <CardDescription>ใช้เพื่อเตรียมการดูแลและติดต่อเมื่อเกิดเหตุฉุกเฉิน</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-5">
              <Field>
                <FieldLabel for="blood-group">หมู่เลือด <span class="text-primary">*</span></FieldLabel>
                <Select v-model="draft.bloodGroup">
                  <SelectTrigger
                    id="blood-group"
                    class="h-10 w-full"
                    aria-label="เลือกหมู่เลือด"
                    :aria-invalid="Boolean(fieldErrors.bloodGroup)"
                  >
                    <SelectValue placeholder="เลือกหมู่เลือด" />
                  </SelectTrigger>
                  <SelectContent
                    :collision-padding="floatingContentCollisionPadding"
                    :side-flip="true"
                    class="w-[var(--reka-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                  >
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                    <SelectItem value="unknown">ไม่ทราบ</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError :errors="[fieldErrors.bloodGroup]" />
              </Field>
              <Field>
                <FieldLabel>มีโรคประจำตัวหรือไม่</FieldLabel>
                <RadioGroup v-model="draft.hasCongenitalDisease" class="flex flex-wrap gap-3">
                  <FieldLabel class="cursor-pointer flex-row items-center gap-2 p-3">
                    <RadioGroupItem value="no" /> ไม่มี
                  </FieldLabel>
                  <FieldLabel class="cursor-pointer flex-row items-center gap-2 p-3">
                    <RadioGroupItem value="yes" /> มี
                  </FieldLabel>
                </RadioGroup>
              </Field>
              <Field v-if="draft.hasCongenitalDisease === 'yes'">
                <FieldLabel for="disease-details">รายละเอียดโรคประจำตัว <span class="text-primary">*</span></FieldLabel>
                <Textarea id="disease-details" v-model="draft.congenitalDiseaseDetails" rows="3" placeholder="ระบุชื่อโรค อาการ และข้อควรระวัง" :maxlength="INPUT_LIMITS.healthDetails" :aria-invalid="Boolean(fieldErrors.congenitalDiseaseDetails)" />
                <div class="flex items-start justify-between gap-3"><FieldError :errors="[fieldErrors.congenitalDiseaseDetails]" /><span class="ml-auto text-xs tabular-nums text-muted-foreground">{{ draft.congenitalDiseaseDetails.length.toLocaleString('th-TH') }}/{{ INPUT_LIMITS.healthDetails.toLocaleString('th-TH') }}</span></div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div class="flex items-start gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <ActivityIcon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>กิจกรรมและความสามารถพิเศษ</CardTitle>
                  <CardDescription>ข้อมูลส่วนนี้ไม่บังคับ ใช้ประกอบการจัดกิจกรรมภายในหอพัก</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel for="dorm-activities">กิจกรรมของหอพักที่เคยเข้าร่วม</FieldLabel>
                  <Textarea id="dorm-activities" v-model="draft.dormActivities" rows="3" :maxlength="INPUT_LIMITS.activity" :aria-invalid="Boolean(fieldErrors.dormActivities)" />
                  <div class="flex items-start justify-between gap-3"><FieldError :errors="[fieldErrors.dormActivities]" /><span class="ml-auto text-xs tabular-nums text-muted-foreground">{{ draft.dormActivities.length }}/{{ INPUT_LIMITS.activity }}</span></div>
                </Field>
                <Field>
                  <FieldLabel for="university-activities">กิจกรรมของคณะ / มหาวิทยาลัย</FieldLabel>
                  <Textarea id="university-activities" v-model="draft.universityActivities" rows="3" :maxlength="INPUT_LIMITS.activity" :aria-invalid="Boolean(fieldErrors.universityActivities)" />
                  <div class="flex items-start justify-between gap-3"><FieldError :errors="[fieldErrors.universityActivities]" /><span class="ml-auto text-xs tabular-nums text-muted-foreground">{{ draft.universityActivities.length }}/{{ INPUT_LIMITS.activity }}</span></div>
                </Field>
                <Field>
                  <FieldLabel for="talents">ความสามารถพิเศษ</FieldLabel>
                  <Textarea id="talents" v-model="draft.talents" rows="3" :maxlength="INPUT_LIMITS.activity" :aria-invalid="Boolean(fieldErrors.talents)" />
                  <div class="flex items-start justify-between gap-3"><FieldError :errors="[fieldErrors.talents]" /><span class="ml-auto text-xs tabular-nums text-muted-foreground">{{ draft.talents.length }}/{{ INPUT_LIMITS.activity }}</span></div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ยานพาหนะ</CardTitle>
              <CardDescription>กรอกเฉพาะกรณีนำยานพาหนะเข้าพื้นที่หอพัก</CardDescription>
            </CardHeader>
            <CardContent class="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel for="vehicle-type">ประเภทยานพาหนะ</FieldLabel>
                <Input id="vehicle-type" v-model="draft.vehicleType" class="h-10" placeholder="เช่น รถจักรยานยนต์" :maxlength="INPUT_LIMITS.vehicle" :aria-invalid="Boolean(fieldErrors.vehicleType)" />
                <FieldError :errors="[fieldErrors.vehicleType]" />
              </Field>
              <Field>
                <FieldLabel for="vehicle-brand">ยี่ห้อ</FieldLabel>
                <Input id="vehicle-brand" v-model="draft.vehicleBrand" class="h-10" :maxlength="INPUT_LIMITS.vehicle" :aria-invalid="Boolean(fieldErrors.vehicleBrand)" />
                <FieldError :errors="[fieldErrors.vehicleBrand]" />
              </Field>
              <Field>
                <FieldLabel for="vehicle-registration">เลขทะเบียน</FieldLabel>
                <Input id="vehicle-registration" v-model="draft.vehicleRegistration" class="h-10" :maxlength="INPUT_LIMITS.vehicleRegistration" :aria-invalid="Boolean(fieldErrors.vehicleRegistration)" />
                <FieldError :errors="[fieldErrors.vehicleRegistration]" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>เอกสารประกอบ</CardTitle>
              <CardDescription>รายการด้านล่างเป็นตัวอย่างจากแบบฟอร์มกระดาษ รายการจริงขึ้นอยู่กับประกาศของรอบรับสมัคร</CardDescription>
            </CardHeader>
            <CardContent class="grid items-start gap-4 sm:grid-cols-2">
              <ApplicationAttachmentField
                v-model="draft.photoFileName"
                v-model:file="photoUploadFile"
                input-id="photo-upload"
                label="รูปถ่ายผู้สมัคร"
                select-label="เลือกไฟล์รูปถ่าย"
                hint="JPG หรือ PNG"
                accept="image/png,image/jpeg"
                kind="image"
                :max-size-mb="5"
                :state="isFormLocked ? 'done' : 'idle'"
              />
              <ApplicationAttachmentField
                v-model="draft.medicalCertificateFileName"
                v-model:file="medicalCertificateUploadFile"
                input-id="medical-upload"
                label="ใบรับรองแพทย์ (ถ้ามี)"
                select-label="เลือกไฟล์เอกสาร"
                hint="PDF, JPG หรือ PNG"
                accept="application/pdf,image/png,image/jpeg"
                :max-size-mb="10"
                :state="isFormLocked ? 'done' : 'idle'"
              />
            </CardContent>
          </Card>
        </template>

        <template v-else>
          <Card>
            <CardHeader>
              <div class="flex items-start gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <ClipboardCheckIcon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>ตรวจสอบข้อมูลใบสมัคร</CardTitle>
                  <CardDescription>หากต้องการแก้ไข ให้กด “ย้อนกลับ” หรือเลือกขั้นตอนที่เปิดไว้จากรายการขั้นตอน</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-5">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-lg border p-4">
                  <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ผู้สมัคร</p>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">ชื่อ</dt><dd class="text-right font-medium">{{ draft.title }} {{ draft.firstName }} {{ draft.lastName }}</dd></div>
                     <div class="flex justify-between gap-4"><dt class="text-muted-foreground">รหัสนักศึกษา</dt><dd class="font-medium">{{ draft.studentId }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">เลขประจำตัว / Passport</dt><dd class="font-medium tabular-nums">{{ maskIdentityNumber(draft.idNumber) }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">คณะ / สาขา</dt><dd class="text-right font-medium">{{ draft.faculty }} / {{ draft.major }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">ติดต่อ</dt><dd class="text-right font-medium">{{ draft.phone }}</dd></div>
                  </dl>
                </div>
                <div class="rounded-lg border p-4">
                  <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">รายการที่สมัคร</p>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">ประเภทผู้สมัคร</dt><dd class="text-right font-medium">{{ selectedApplicantType?.label }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">รอบรับสมัคร</dt><dd class="text-right font-medium">{{ campaign?.name }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">หมู่เลือด</dt><dd class="font-medium">{{ draft.bloodGroup === 'unknown' ? 'ไม่ทราบ' : draft.bloodGroup }}</dd></div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div class="flex items-start gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <ShieldCheckIcon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>รับรองข้อมูลและข้อตกลง</CardTitle>
                  <CardDescription>โปรดอ่านและยืนยันก่อนส่งใบสมัคร</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <Label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal">
                <Checkbox v-model="draft.acceptsRules" class="mt-0.5" :aria-invalid="Boolean(fieldErrors.acceptsRules)" />
                <span>
                  <span class="block font-medium">ข้าพเจ้าได้อ่านและรับทราบกฎระเบียบหอพัก</span>
                  <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">รวมถึงเงื่อนไขสัญญาปีการศึกษา การใช้พื้นที่ส่วนกลาง และแนวทางการยกเลิกตามประกาศที่มีผลบังคับใช้</span>
                </span>
              </Label>
              <FieldError :errors="[fieldErrors.acceptsRules]" />
              <Label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal">
                <Checkbox v-model="draft.confirmsAccuracy" class="mt-0.5" :aria-invalid="Boolean(fieldErrors.confirmsAccuracy)" />
                <span>
                  <span class="block font-medium">ข้าพเจ้ายืนยันว่าข้อมูลข้างต้นถูกต้อง</span>
                  <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">ยินยอมให้มหาวิทยาลัยใช้ข้อมูลเพื่อดำเนินการสมัคร ตรวจสอบสิทธิ์ ติดต่อ และบริหารการเข้าพักตามวัตถุประสงค์ของระบบ</span>
                </span>
              </Label>
              <FieldError :errors="[fieldErrors.confirmsAccuracy]" />
            </CardContent>
          </Card>
        </template>

        <Alert v-if="validationMessage" variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>ข้อมูลยังไม่ครบ</AlertTitle>
          <AlertDescription>{{ validationMessage }}</AlertDescription>
        </Alert>

        </fieldset>

        <div class="mt-5 flex flex-row items-center justify-between gap-3 border-t pt-5">
          <Button v-if="currentStep > 1" type="button" variant="outline" class="sm:min-w-28" @click="previousStep">
            <ArrowLeftIcon aria-hidden="true" /> ย้อนกลับ
          </Button>
          <span v-else />
          <Button v-if="currentStep < steps.length" type="button" class="sm:min-w-36" @click="nextStep">
            บันทึกและถัดไป <ArrowRightIcon aria-hidden="true" />
          </Button>
          <Button
            v-else
            type="button"
            class="sm:min-w-40"
            :disabled="(Boolean(submittedReference) && !isRevising) || !submissionConfirmationsComplete"
            @click="isRevising ? saveRevision() : submitApplication()"
          >
            <CheckIcon aria-hidden="true" />
            {{ isRevising ? 'ยืนยันบันทึกการแก้ไข' : submittedReference ? 'ส่งใบสมัครแล้ว' : 'ยืนยันส่งใบสมัคร' }}
          </Button>
        </div>
      </form>
        </div>
      </div>
    </div>

    <Dialog v-model:open="submissionSuccessOpen">
      <DialogContent class="w-[calc(100vw-1rem)] max-w-[430px] gap-0 overflow-hidden rounded-2xl border bg-card p-0">
        <div class="px-3.5 pb-4 pt-[18px]">
          <DialogHeader class="items-center gap-1 pr-0 text-center">
            <span class="mb-1 grid size-[60px] place-items-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
              <CheckCircle2Icon class="size-7" :stroke-width="2.5" aria-hidden="true" />
            </span>
            <DialogTitle class="leading-7">ส่งใบสมัครเรียบร้อยแล้ว</DialogTitle>
            <DialogDescription class="leading-7">
              ระบบบันทึกใบสมัครเลขที่
              <strong class="font-semibold text-foreground">{{ submittedReference }}</strong>
              ของคุณแล้ว
            </DialogDescription>
          </DialogHeader>
          <div class="mt-3 rounded-2xl border bg-muted/35 p-2 text-sm leading-7 text-muted-foreground">
            ใบสมัครถูกส่งเข้าสู่ขั้นตอนตรวจสอบแล้ว คุณสามารถกลับมาเปิดดูหรือแก้ไขข้อมูลที่อนุญาตได้จากเมนูใบสมัคร
          </div>
        </div>

        <DialogFooter class="m-0 grid h-[60px] grid-cols-1 rounded-none border-t bg-muted/40 px-4 py-2.5">
          <Button type="button" class="h-10 w-full text-base" @click="goToReservationAfterSubmission">
            ไปหน้าสถานะการจอง
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
