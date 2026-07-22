<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  CheckIcon,
  ClipboardCheckIcon,
  FileCheck2Icon,
  GraduationCapIcon,
  HeartPulseIcon,
  InfoIcon,
  LandmarkIcon,
  SaveIcon,
  ShieldCheckIcon,
  UploadIcon,
  UserRoundIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { useApplicationStore } from '@/stores/application'
import { useDormStore } from '@/stores/dorm'
import { useSessionStore } from '@/stores/session'
import { priceLinesFor } from '@/fixtures'
import type { RoomConfig } from '@/types'

const route = useRoute()
const dorm = useDormStore()
const session = useSessionStore()
const application = useApplicationStore()
const { draft, submittedReference } = storeToRefs(application)

const currentStep = ref(1)
const highestStep = ref(1)
const validationMessage = ref('')

const steps = [
  {
    id: 1,
    title: 'รอบและประเภท',
    description: 'เลือกสิทธิ์และประเภทห้อง',
    icon: Building2Icon,
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
    description: 'ทบทวนค่าใช้จ่ายและข้อตกลง',
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

const roomTypes = [
  { value: 'normal', label: 'ห้องธรรมดา' },
  { value: 'aircon', label: 'ห้องปรับอากาศ' },
  { value: 'hl', label: 'ห้องปรับอากาศ HL' },
  { value: 'special', label: 'ห้องปรับอากาศพิเศษ' },
]

const campaign = computed(() => dorm.campaignById(draft.value.campaignId) ?? dorm.openCampaigns[0])
const selectedDorm = computed(() => dorm.dormGroups.find(group => group.id === draft.value.dormGroupId))
const selectedApplicantType = computed(() => applicantTypes.find(type => type.value === draft.value.applicantType))
const selectedRoomType = computed(() => roomTypes.find(type => type.value === draft.value.roomType))
const preferredRoom = computed(() => dorm.roomByNumber(draft.value.preferredRoomNumber))
const preferredBuilding = computed(() => dorm.buildings.find(building => building.id === preferredRoom.value?.buildingId))
const currentStepMeta = computed(() => steps[currentStep.value - 1])
const progressValue = computed(() => currentStep.value * 25)

const estimatedFees = computed(() => {
  const isInternational = draft.value.dormGroupId === 'dorm-wor-inter'
  const roomFee = draft.value.roomType
    ? priceLinesFor(draft.value.roomType as RoomConfig, 'shared').reduce((total, line) => total + line.amount, 0)
    : 0
  const deposit = isInternational ? 3000 : 2800
  return {
    roomFee,
    deposit,
    total: roomFee + deposit,
  }
})

function formatBaht(value: number) {
  return new Intl.NumberFormat('th-TH').format(value)
}

function preferenceForRoomIsConsistent() {
  const room = preferredRoom.value
  const building = preferredBuilding.value
  if (!draft.value.preferredRoomNumber) return true
  return !!room
    && !!building
    && building.dormGroupId === draft.value.dormGroupId
    && room.config === draft.value.roomType
}

function markFile(event: Event, field: 'photoFileName' | 'medicalCertificateFileName') {
  const input = event.target as HTMLInputElement
  draft.value[field] = input.files?.[0]?.name ?? ''
}

function validateStep(step: number) {
  validationMessage.value = ''

  if (step === 1 && (!draft.value.applicantType || !draft.value.dormGroupId || !draft.value.roomType)) {
    validationMessage.value = 'กรุณาเลือกประเภทผู้สมัคร หอพัก และประเภทห้องให้ครบ'
  }
  if (step === 1 && !campaign.value?.dormGroupIds.includes(draft.value.dormGroupId)) {
    validationMessage.value = 'หอพักที่เลือกไม่อยู่ในรอบรับสมัครนี้ กรุณาเลือกรายการใหม่'
  }
  if (step === 1 && !preferenceForRoomIsConsistent()) {
    validationMessage.value = 'หอพักหรือประเภทห้องไม่ตรงกับห้องที่เลือกจากผัง กรุณาเลือกห้องใหม่'
  }

  if (step === 2) {
    const required = [
      draft.value.title,
      draft.value.firstName,
      draft.value.lastName,
      draft.value.studentId,
      draft.value.dateOfBirth,
      draft.value.studyYear,
      draft.value.faculty,
      draft.value.major,
      draft.value.phone,
      draft.value.email,
      draft.value.address,
      draft.value.emergencyName,
      draft.value.emergencyPhone,
    ]
    if (required.some(value => !String(value).trim())) {
      validationMessage.value = 'กรุณากรอกช่องที่มีเครื่องหมาย * ให้ครบก่อนดำเนินการต่อ'
    }
  }

  if (step === 3 && !draft.value.bloodGroup) {
    validationMessage.value = 'กรุณาระบุหมู่เลือด หรือเลือก “ไม่ทราบ”'
  }
  if (step === 3 && draft.value.hasCongenitalDisease === 'yes' && !draft.value.congenitalDiseaseDetails.trim()) {
    validationMessage.value = 'กรุณาระบุรายละเอียดโรคประจำตัว'
  }

  if (step === 4 && (!draft.value.acceptsRules || !draft.value.confirmsAccuracy)) {
    validationMessage.value = 'กรุณารับทราบกฎระเบียบและยืนยันความถูกต้องของข้อมูล'
  }

  if (validationMessage.value) {
    toast.error(validationMessage.value)
    return false
  }
  return true
}

function nextStep() {
  if (!validateStep(currentStep.value)) return
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
  if (!validateStep(4)) return
  const reference = application.submit()
  session.markCurrentApplicantProfileComplete()
  toast.success(`ส่งใบสมัครต้นแบบแล้ว เลขที่ ${reference}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function reopenApplication() {
  application.reopenForRevision()
  currentStep.value = 1
  highestStep.value = Math.max(highestStep.value, 1)
  toast.info('เปิดใบสมัครให้แก้ไขแล้ว ต้องตรวจสอบและส่งใหม่ก่อนจองห้อง')
}

watch(
  () => [draft.value.dormGroupId, draft.value.roomType],
  () => {
    if (!draft.value.preferredRoomNumber || preferenceForRoomIsConsistent()) return
    const previousRoom = draft.value.preferredRoomNumber
    draft.value.preferredRoomNumber = ''
    toast.info(`ยกเลิกห้องที่สนใจ ${previousRoom} เพราะคุณเปลี่ยนหอพักหรือประเภทห้องในใบสมัคร`)
  },
)

onMounted(() => {
  application.hydrateIdentity(session.currentUser)
  // รองรับ draft จากต้นแบบรุ่นก่อนที่ใช้ค่า air
  if (draft.value.roomType === 'air') draft.value.roomType = 'aircon'
  const campaignId = typeof route.params.campaignId === 'string' ? route.params.campaignId : ''
  if (campaignId && dorm.campaignById(campaignId)) draft.value.campaignId = campaignId
  if (!draft.value.campaignId && dorm.openCampaigns[0]) draft.value.campaignId = dorm.openCampaigns[0].id
})
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 pb-10">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">ปีการศึกษา 2569</Badge>
          <Badge v-if="campaign?.status === 'open'">เปิดรับสมัคร</Badge>
        </div>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">กรอกใบสมัครเข้าหอพัก</h1>
        <p class="max-w-2xl text-sm text-muted-foreground sm:text-base">
          แบบฟอร์มออนไลน์อ้างอิงจากใบสมัครหอพักวรเรสซิเดนซ์และวรอินเตอร์ กรุณาตรวจสอบข้อมูลก่อนส่ง
        </p>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <SaveIcon class="size-4" aria-hidden="true" />
        ร่างนี้เก็บไว้ระหว่างการสาธิต
      </div>
    </div>

    <Alert v-if="submittedReference" class="border-primary/30 bg-primary/5">
      <FileCheck2Icon aria-hidden="true" />
      <AlertTitle>ส่งใบสมัครต้นแบบเรียบร้อยแล้ว</AlertTitle>
      <AlertDescription>
        เลขที่ใบสมัคร <strong class="text-foreground">{{ submittedReference }}</strong>
        ระบบยังต้องตรวจคุณสมบัติ เอกสาร การชำระเงิน และโควตาก่อนยืนยันผล
        <Button type="button" size="sm" variant="outline" class="mt-3 flex" @click="reopenApplication">
          แก้ไขหอพักหรือห้องที่สมัคร
        </Button>
      </AlertDescription>
    </Alert>

    <Card class="overflow-hidden">
      <CardContent class="p-4 sm:p-6">
        <div class="space-y-3 md:hidden">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-medium text-muted-foreground">ขั้นตอน {{ currentStep }} จาก {{ steps.length }}</p>
              <p class="font-semibold">{{ currentStepMeta.title }}</p>
            </div>
            <span class="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <component :is="currentStepMeta.icon" class="size-5" aria-hidden="true" />
            </span>
          </div>
          <Progress :model-value="progressValue" class="h-2" />
          <p class="text-xs text-muted-foreground">{{ currentStepMeta.description }}</p>
        </div>

        <Stepper v-model="currentStep" linear class="hidden w-full items-start gap-0 md:flex">
          <StepperItem
            v-for="step in steps"
            :key="step.id"
            :step="step.id"
            :disabled="step.id > highestStep"
            class="relative flex flex-1 flex-col items-center gap-0"
          >
            <StepperSeparator
              v-if="step.id < steps.length"
              class="absolute left-[calc(50%+1.75rem)] right-[calc(-50%+1.75rem)] top-5 h-px group-data-[state=completed]:bg-primary"
            />
            <StepperTrigger class="relative z-10 w-full gap-2 p-0">
              <StepperIndicator
                class="size-10 border bg-card group-data-[state=active]:border-primary group-data-[state=completed]:border-primary group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground"
              >
                <CheckIcon v-if="step.id < currentStep" class="size-5" aria-hidden="true" />
                <component :is="step.icon" v-else class="size-5" aria-hidden="true" />
              </StepperIndicator>
              <div class="space-y-0.5 px-2">
                <StepperTitle class="text-sm">{{ step.title }}</StepperTitle>
                <StepperDescription class="hidden lg:block">{{ step.description }}</StepperDescription>
              </div>
            </StepperTrigger>
          </StepperItem>
        </Stepper>
      </CardContent>
    </Card>

    <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <form class="min-w-0" @submit.prevent>
        <fieldset :disabled="Boolean(submittedReference)" class="min-w-0 space-y-5 disabled:opacity-75">
        <Alert v-if="validationMessage" variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>ข้อมูลยังไม่ครบ</AlertTitle>
          <AlertDescription>{{ validationMessage }}</AlertDescription>
        </Alert>

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
              <RadioGroup v-model="draft.applicantType" class="grid gap-3 sm:grid-cols-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div class="flex items-start gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <Building2Icon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>หอพักและประเภทห้อง</CardTitle>
                  <CardDescription>หากเลือกห้องจากผังมาก่อน ระบบจะผูกหอพักและประเภทห้องให้ตรงกันอัตโนมัติ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-5">
              <RadioGroup v-model="draft.dormGroupId" class="grid gap-3 sm:grid-cols-2">
                <FieldLabel
                  v-for="group in dorm.dormGroups"
                  :key="group.id"
                  class="cursor-pointer flex-row items-start gap-3 p-4"
                >
                  <RadioGroupItem :value="group.id" class="mt-0.5" />
                  <span class="min-w-0">
                    <span class="block font-medium">{{ group.shortName }}</span>
                    <span class="mt-1 block text-xs font-normal text-muted-foreground">
                      {{ group.buildingCount }} อาคาร · {{ group.contractLabel }}
                    </span>
                  </span>
                </FieldLabel>
              </RadioGroup>

              <Field>
                <FieldLabel for="room-type">ประเภทห้องที่ต้องการ <span class="text-primary">*</span></FieldLabel>
                <NativeSelect id="room-type" v-model="draft.roomType" class="h-10 w-full">
                  <NativeSelectOption value="" disabled>เลือกประเภทห้อง</NativeSelectOption>
                  <NativeSelectOption v-for="room in roomTypes" :key="room.value" :value="room.value">
                    {{ room.label }}
                  </NativeSelectOption>
                </NativeSelect>
                <FieldDescription>การจัดสรรขึ้นอยู่กับคุณสมบัติและโควตาคงเหลือของรอบรับสมัคร</FieldDescription>
              </Field>

              <Alert v-if="preferredRoom">
                <Building2Icon aria-hidden="true" />
                <AlertTitle>ห้องที่สนใจ: {{ preferredRoom.number }}</AlertTitle>
                <AlertDescription>
                  {{ selectedDorm?.shortName }} · {{ preferredBuilding?.name }} · {{ selectedRoomType?.label }}
                  ห้องนี้ยังไม่ถูก hold จนกว่าจะส่งใบสมัครและกดยืนยันจอง หากเปลี่ยนหอหรือประเภทห้อง ระบบจะยกเลิกห้องที่สนใจนี้
                </AlertDescription>
              </Alert>
              <Alert v-else>
                <InfoIcon aria-hidden="true" />
                <AlertTitle>ยังไม่ได้ระบุเลขห้อง</AlertTitle>
                <AlertDescription>หลังส่งใบสมัคร คุณเลือกได้เฉพาะห้องในหอพักและประเภทที่ตรงกับใบสมัคร หรือกลับมาแก้ไขและส่งใบสมัครใหม่</AlertDescription>
              </Alert>
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
                    <NativeSelect id="title" v-model="draft.title" class="h-10 w-full">
                      <NativeSelectOption value="" disabled>เลือก</NativeSelectOption>
                      <NativeSelectOption value="นาย">นาย</NativeSelectOption>
                      <NativeSelectOption value="นาง">นาง</NativeSelectOption>
                      <NativeSelectOption value="นางสาว">นางสาว</NativeSelectOption>
                      <NativeSelectOption value="other">อื่น ๆ</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel for="first-name">ชื่อ <span class="text-primary">*</span></FieldLabel>
                    <Input id="first-name" v-model="draft.firstName" class="h-10" autocomplete="given-name" />
                  </Field>
                  <Field>
                    <FieldLabel for="last-name">นามสกุล <span class="text-primary">*</span></FieldLabel>
                    <Input id="last-name" v-model="draft.lastName" class="h-10" autocomplete="family-name" />
                  </Field>
                </div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field>
                    <FieldLabel for="nickname">ชื่อเล่น</FieldLabel>
                    <Input id="nickname" v-model="draft.nickname" class="h-10" />
                  </Field>
                  <Field>
                    <FieldLabel for="birth-date">วันเดือนปีเกิด <span class="text-primary">*</span></FieldLabel>
                    <Input id="birth-date" v-model="draft.dateOfBirth" type="date" class="h-10" />
                  </Field>
                  <Field>
                    <FieldLabel for="nationality">สัญชาติ</FieldLabel>
                    <Input id="nationality" v-model="draft.nationality" class="h-10" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel for="id-number">เลขประจำตัวประชาชน / Passport</FieldLabel>
                  <Input id="id-number" v-model="draft.idNumber" class="h-10 sm:max-w-md" inputmode="numeric" />
                  <FieldDescription>ใช้เพื่อตรวจสอบตัวตนตามเงื่อนไขของรอบรับสมัครเท่านั้น</FieldDescription>
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
                    <Input id="student-id" v-model="draft.studentId" class="h-10" />
                  </Field>
                  <Field>
                    <FieldLabel for="degree-level">ระดับการศึกษา <span class="text-primary">*</span></FieldLabel>
                    <NativeSelect id="degree-level" v-model="draft.degreeLevel" class="h-10 w-full">
                      <NativeSelectOption value="bachelor">ปริญญาตรี</NativeSelectOption>
                      <NativeSelectOption value="master">ปริญญาโท</NativeSelectOption>
                      <NativeSelectOption value="doctoral">ปริญญาเอก</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel for="study-year">ชั้นปี <span class="text-primary">*</span></FieldLabel>
                    <NativeSelect id="study-year" v-model="draft.studyYear" class="h-10 w-full">
                      <NativeSelectOption value="" disabled>เลือกชั้นปี</NativeSelectOption>
                      <NativeSelectOption v-for="year in 8" :key="year" :value="String(year)">ปี {{ year }}</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel for="faculty">คณะ <span class="text-primary">*</span></FieldLabel>
                    <Input id="faculty" v-model="draft.faculty" class="h-10" placeholder="เช่น วิศวกรรมศาสตร์" />
                  </Field>
                  <Field>
                    <FieldLabel for="major">สาขาวิชา <span class="text-primary">*</span></FieldLabel>
                    <Input id="major" v-model="draft.major" class="h-10" />
                  </Field>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel for="gpa">เกรดเฉลี่ยสะสม (GPA)</FieldLabel>
                    <Input id="gpa" v-model="draft.gpa" class="h-10" inputmode="decimal" placeholder="0.00" />
                  </Field>
                  <Field>
                    <FieldLabel for="advisor">ชื่ออาจารย์ที่ปรึกษา</FieldLabel>
                    <Input id="advisor" v-model="draft.advisor" class="h-10" />
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
                    <Input id="phone" v-model="draft.phone" class="h-10" type="tel" autocomplete="tel" />
                  </Field>
                  <Field>
                    <FieldLabel for="email">อีเมล <span class="text-primary">*</span></FieldLabel>
                    <Input id="email" v-model="draft.email" class="h-10" type="email" autocomplete="email" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel for="address">ที่อยู่ที่ติดต่อได้ <span class="text-primary">*</span></FieldLabel>
                  <Textarea id="address" v-model="draft.address" rows="3" placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" />
                </Field>
                <Separator />
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field>
                    <FieldLabel for="emergency-name">ชื่อผู้ติดต่อฉุกเฉิน <span class="text-primary">*</span></FieldLabel>
                    <Input id="emergency-name" v-model="draft.emergencyName" class="h-10" />
                  </Field>
                  <Field>
                    <FieldLabel for="emergency-relation">ความสัมพันธ์</FieldLabel>
                    <Input id="emergency-relation" v-model="draft.emergencyRelation" class="h-10" placeholder="เช่น บิดา มารดา ผู้ปกครอง" />
                  </Field>
                  <Field>
                    <FieldLabel for="emergency-phone">เบอร์โทรศัพท์ <span class="text-primary">*</span></FieldLabel>
                    <Input id="emergency-phone" v-model="draft.emergencyPhone" class="h-10" type="tel" />
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
                <NativeSelect id="blood-group" v-model="draft.bloodGroup" class="h-10 w-full">
                  <NativeSelectOption value="" disabled>เลือกหมู่เลือด</NativeSelectOption>
                  <NativeSelectOption value="A">A</NativeSelectOption>
                  <NativeSelectOption value="B">B</NativeSelectOption>
                  <NativeSelectOption value="AB">AB</NativeSelectOption>
                  <NativeSelectOption value="O">O</NativeSelectOption>
                  <NativeSelectOption value="unknown">ไม่ทราบ</NativeSelectOption>
                </NativeSelect>
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
                <Textarea id="disease-details" v-model="draft.congenitalDiseaseDetails" rows="3" placeholder="ระบุชื่อโรค อาการ และข้อควรระวัง" />
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
                  <Textarea id="dorm-activities" v-model="draft.dormActivities" rows="3" />
                </Field>
                <Field>
                  <FieldLabel for="university-activities">กิจกรรมของคณะ / มหาวิทยาลัย</FieldLabel>
                  <Textarea id="university-activities" v-model="draft.universityActivities" rows="3" />
                </Field>
                <Field>
                  <FieldLabel for="talents">ความสามารถพิเศษ</FieldLabel>
                  <Textarea id="talents" v-model="draft.talents" rows="3" />
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
                <Input id="vehicle-type" v-model="draft.vehicleType" class="h-10" placeholder="เช่น รถจักรยานยนต์" />
              </Field>
              <Field>
                <FieldLabel for="vehicle-brand">ยี่ห้อ</FieldLabel>
                <Input id="vehicle-brand" v-model="draft.vehicleBrand" class="h-10" />
              </Field>
              <Field>
                <FieldLabel for="vehicle-registration">เลขทะเบียน</FieldLabel>
                <Input id="vehicle-registration" v-model="draft.vehicleRegistration" class="h-10" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>เอกสารประกอบ</CardTitle>
              <CardDescription>รายการด้านล่างเป็นตัวอย่างจากแบบฟอร์มกระดาษ รายการจริงขึ้นอยู่กับประกาศของรอบรับสมัคร</CardDescription>
            </CardHeader>
            <CardContent class="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel for="photo-upload">รูปถ่ายผู้สมัคร</FieldLabel>
                <label class="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4 text-center hover:bg-muted/50" for="photo-upload">
                  <UploadIcon class="size-5 text-muted-foreground" aria-hidden="true" />
                  <span class="text-sm font-medium">เลือกไฟล์รูปถ่าย</span>
                  <span class="text-xs text-muted-foreground">JPG หรือ PNG</span>
                  <span v-if="draft.photoFileName" class="max-w-full truncate text-xs text-primary">{{ draft.photoFileName }}</span>
                </label>
                <Input id="photo-upload" type="file" accept="image/png,image/jpeg" class="sr-only" @change="markFile($event, 'photoFileName')" />
              </Field>
              <Field>
                <FieldLabel for="medical-upload">ใบรับรองแพทย์ (ถ้ามี)</FieldLabel>
                <label class="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4 text-center hover:bg-muted/50" for="medical-upload">
                  <UploadIcon class="size-5 text-muted-foreground" aria-hidden="true" />
                  <span class="text-sm font-medium">เลือกไฟล์เอกสาร</span>
                  <span class="text-xs text-muted-foreground">PDF, JPG หรือ PNG</span>
                  <span v-if="draft.medicalCertificateFileName" class="max-w-full truncate text-xs text-primary">{{ draft.medicalCertificateFileName }}</span>
                </label>
                <Input id="medical-upload" type="file" accept="application/pdf,image/png,image/jpeg" class="sr-only" @change="markFile($event, 'medicalCertificateFileName')" />
              </Field>
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
                  <CardDescription>หากต้องการแก้ไข ให้กด “ย้อนกลับ” หรือเลือกขั้นตอนที่ทำเสร็จแล้วด้านบน</CardDescription>
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
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">คณะ / สาขา</dt><dd class="text-right font-medium">{{ draft.faculty }} / {{ draft.major }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">ติดต่อ</dt><dd class="text-right font-medium">{{ draft.phone }}</dd></div>
                  </dl>
                </div>
                <div class="rounded-lg border p-4">
                  <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">รายการที่สมัคร</p>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">ประเภทผู้สมัคร</dt><dd class="text-right font-medium">{{ selectedApplicantType?.label }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">หอพัก</dt><dd class="text-right font-medium">{{ selectedDorm?.shortName }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">ประเภทห้อง</dt><dd class="font-medium">{{ selectedRoomType?.label }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-muted-foreground">ห้องที่สนใจ</dt><dd class="font-medium">{{ draft.preferredRoomNumber || 'เลือกภายหลัง' }}</dd></div>
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
                  <LandmarkIcon class="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>ค่าใช้จ่ายที่ต้องเตรียมชำระ</CardTitle>
                  <CardDescription>ยอดอ้างอิงสำหรับต้นแบบจากประเภทห้องที่เลือก ก่อนเจ้าหน้าที่ตรวจสิทธิ์</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="overflow-hidden rounded-lg border">
                <div class="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm">
                  <span>ค่าหอพัก {{ selectedRoomType?.label }}</span>
                  <span class="font-semibold">{{ formatBaht(estimatedFees.roomFee) }} บาท</span>
                </div>
                <div class="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm">
                  <span>ค่าประกันห้องพัก</span>
                  <span class="font-semibold">{{ formatBaht(estimatedFees.deposit) }} บาท</span>
                </div>
                <div class="flex items-center justify-between gap-4 bg-muted/50 px-4 py-3">
                  <span class="font-semibold">รวมยอดอ้างอิง</span>
                  <span class="text-lg font-bold text-primary">{{ formatBaht(estimatedFees.total) }} บาท</span>
                </div>
              </div>
              <p class="text-xs leading-relaxed text-muted-foreground">
                ยอดและกำหนดชำระจริงขึ้นอยู่กับห้องที่จองและเงื่อนไขรอบรับสมัคร ระบบจะแสดงแบบฟอร์ม QR จาก SCB แยกตามรายการเมื่อเจ้าหน้าที่นำเอกสารกลับเข้าระบบแล้ว
              </p>
              <Alert>
                <InfoIcon aria-hidden="true" />
                <AlertTitle>การส่งใบสมัครยังไม่ใช่การยืนยันสิทธิ์ห้องพัก</AlertTitle>
                <AlertDescription>ต้องผ่านการตรวจข้อมูล หลักฐานการชำระเงิน และการอนุมัติตามโควตาก่อน ระบบจึงจะแจ้งผลอย่างเป็นทางการ</AlertDescription>
              </Alert>
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
                <Checkbox v-model="draft.acceptsRules" class="mt-0.5" />
                <span>
                  <span class="block font-medium">ข้าพเจ้าได้อ่านและรับทราบกฎระเบียบหอพัก</span>
                  <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">รวมถึงเงื่อนไขสัญญาปีการศึกษา การใช้พื้นที่ส่วนกลาง และแนวทางการยกเลิกตามประกาศที่มีผลบังคับใช้</span>
                </span>
              </Label>
              <Label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal">
                <Checkbox v-model="draft.confirmsAccuracy" class="mt-0.5" />
                <span>
                  <span class="block font-medium">ข้าพเจ้ายืนยันว่าข้อมูลข้างต้นถูกต้อง</span>
                  <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">ยินยอมให้มหาวิทยาลัยใช้ข้อมูลเพื่อดำเนินการสมัคร ตรวจสอบสิทธิ์ ติดต่อ และบริหารการเข้าพักตามวัตถุประสงค์ของระบบ</span>
                </span>
              </Label>
            </CardContent>
          </Card>
        </template>

        <div class="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button v-if="currentStep > 1" type="button" variant="outline" class="sm:min-w-28" @click="previousStep">
            <ArrowLeftIcon aria-hidden="true" /> ย้อนกลับ
          </Button>
          <span v-else />
          <Button v-if="currentStep < steps.length" type="button" class="sm:min-w-36" @click="nextStep">
            บันทึกและถัดไป <ArrowRightIcon aria-hidden="true" />
          </Button>
          <Button v-else type="button" class="sm:min-w-40" :disabled="Boolean(submittedReference)" @click="submitApplication">
            <CheckIcon aria-hidden="true" /> {{ submittedReference ? 'ส่งใบสมัครแล้ว' : 'ยืนยันส่งใบสมัคร' }}
          </Button>
        </div>
        </fieldset>
      </form>

      <aside class="space-y-4 lg:sticky lg:top-40">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">รอบรับสมัคร</CardTitle>
            <CardDescription>{{ campaign?.name }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">สถานะ</span>
              <Badge :variant="campaign?.status === 'open' ? 'default' : 'outline'">{{ campaign?.status === 'open' ? 'เปิดรับสมัคร' : 'ตรวจสอบรอบ' }}</Badge>
            </div>
            <div>
              <p class="text-muted-foreground">ระยะเวลารับสมัคร</p>
              <p class="mt-1 font-medium">{{ campaign?.openDate }} – {{ campaign?.closeDate }}</p>
            </div>
            <Separator />
            <div>
              <p class="text-muted-foreground">ผู้สมัครปัจจุบัน</p>
              <p class="mt-1 font-medium">{{ session.currentUser?.displayName }}</p>
              <p class="text-xs text-muted-foreground">{{ session.currentUser?.studentId }}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">ความคืบหน้า</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <Progress :model-value="progressValue" class="h-2" />
            <p class="text-sm font-medium">ขั้นตอน {{ currentStep }} จาก {{ steps.length }}</p>
            <p class="text-xs leading-relaxed text-muted-foreground">คุณสามารถกลับมาแก้ไขขั้นตอนที่ทำเสร็จแล้วก่อนส่งใบสมัคร</p>
          </CardContent>
        </Card>

        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>ต้องการความช่วยเหลือ?</AlertTitle>
          <AlertDescription>{{ campaign?.contact }}</AlertDescription>
        </Alert>
      </aside>
    </div>
  </div>
</template>
