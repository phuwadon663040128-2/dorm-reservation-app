<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Image,
  Info,
  Loader,
  Printer,
  Send,
  Upload,
} from '@lucide/vue'
import type { Applicant, DormCampaign, DormRooms } from '../types'
import RoomSelector from '../components/RoomSelector.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel, FieldSet, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const props = defineProps<{
  campaigns: DormCampaign[]
  dormRooms: DormRooms
  activeApp: Applicant | null
}>()

const emit = defineEmits<{
  (e: 'submitApp', appData: Omit<Applicant, 'id' | 'status' | 'amountPaid' | 'paymentDate' | 'paymentTime' | 'slipFile' | 'paymentMethod' | 'rejectReason'>): void
  (e: 'simulateUniPay'): void
  (e: 'submitManualSlip', slip: { amount: number; date: string; time: string; fileName: string }): void
  (e: 'printTicket'): void
  (e: 'showToast', msg: string): void
}>()

type ApplicantStep = 'campaigns' | 'room-select' | 'form' | 'tracking'

const step = ref<ApplicantStep>('campaigns')
const selectedCampaign = ref<DormCampaign | null>(null)
const selectedRoom = ref<{ floor: number; roomNumber: string; roomType: string } | null>(null)

const formRoomType = ref('')
const formApplicantType = ref('General Student')
const formStudentId = ref('')
const formName = ref('')
const formFaculty = ref('')
const formGender = ref('ชาย')
const formPhone = ref('')
const formEmail = ref('')
const formEmergencyName = ref('')
const formEmergencyPhone = ref('')
const docFileName = ref('')
const formAgree = ref(false)

const paymentTab = ref<'unipay' | 'manual'>('unipay')
const payAmount = ref<number | ''>('')
const payDate = ref('')
const payTime = ref('')
const slipFileName = ref('')

const secondsLeft = ref(600)
let timerId: ReturnType<typeof setInterval> | null = null

const workflowSteps: Array<{ key: ApplicantStep; label: string; description: string }> = [
  { key: 'campaigns', label: 'เลือกหอพัก', description: 'ดูรอบรับสมัครและ quota' },
  { key: 'room-select', label: 'เลือกห้อง', description: 'เลือกประเภทห้องและเตียงว่าง' },
  { key: 'form', label: 'กรอกใบสมัคร', description: 'ข้อมูลผู้สมัครและเอกสาร' },
  { key: 'tracking', label: 'ชำระเงิน', description: 'UniPay หรือสลิปโอนเงิน' },
]

onMounted(() => {
  timerId = setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value--
  }, 1000)

  if (props.activeApp) step.value = 'tracking'
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

watch(() => props.activeApp, (newVal) => {
  if (newVal) {
    step.value = 'tracking'
  } else {
    resetDraft()
  }
})

const currentStepIndex = computed(() => workflowSteps.findIndex(item => item.key === step.value))

const formattedTime = computed(() => {
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const selectedPaymentAmount = computed(() => calculatePaymentAmount())

function resetDraft() {
  step.value = 'campaigns'
  selectedCampaign.value = null
  selectedRoom.value = null
  formRoomType.value = ''
  formApplicantType.value = 'General Student'
  docFileName.value = ''
  slipFileName.value = ''
  formAgree.value = false
}

function campaignRemaining(campaign: DormCampaign) {
  return campaign.roomTypes.reduce((sum, room) => sum + room.active, 0)
}

function campaignCapacity(campaign: DormCampaign) {
  return campaign.roomTypes.reduce((sum, room) => sum + room.capacity, 0)
}

function campaignProgress(campaign: DormCampaign) {
  const capacity = campaignCapacity(campaign)
  return capacity ? Math.round(((capacity - campaignRemaining(campaign)) / capacity) * 100) : 0
}

function chooseCampaign(campaign: DormCampaign) {
  selectedCampaign.value = campaign
  selectedRoom.value = null
  formRoomType.value = campaign.roomTypes[0]?.name || ''
  step.value = 'room-select'
}

function handleRoomSelect(room: { floor: number; roomNumber: string; roomType: string }) {
  selectedRoom.value = room
  formRoomType.value = room.roomType
  step.value = 'form'
}

function calculatePaymentAmount() {
  if (!selectedCampaign.value) return props.activeApp?.amountPaid || 0

  let amount = selectedCampaign.value.requiredAmount
  if (selectedCampaign.value.id === 'dorm-9') {
    const roomPrice = selectedCampaign.value.roomTypes.find(room => room.name === formRoomType.value)?.price || 8000
    amount = formApplicantType.value === 'New First-Year' ? roomPrice * 2 : roomPrice
  } else if (selectedCampaign.value.id === 'dorm-inter') {
    amount = formApplicantType.value === 'International Student' ? 19000 : 4000
  }

  return amount
}

function triggerDocUpload() {
  docFileName.value = 'student_card_verified.pdf'
  emit('showToast', 'อัปโหลดเอกสารสำเร็จ')
}

function triggerSlipUpload() {
  slipFileName.value = 'slip_transfer_receipt.png'
  emit('showToast', 'อัปโหลดรูปภาพสลิปสำเร็จ')
}

function submitApplication() {
  if (!selectedCampaign.value) return

  if (!docFileName.value) {
    emit('showToast', 'กรุณาอัปโหลดเอกสารประกอบก่อนยื่นสมัคร')
    return
  }

  if (!formAgree.value) {
    emit('showToast', 'กรุณายอมรับเงื่อนไขการจองหอพัก')
    return
  }

  emit('submitApp', {
    name: formName.value,
    studentId: formStudentId.value,
    phone: formPhone.value,
    email: formEmail.value,
    faculty: formFaculty.value,
    gender: formGender.value,
    dormId: selectedCampaign.value.id,
    dormName: selectedCampaign.value.name,
    roomType: formRoomType.value,
    roomNumber: selectedRoom.value?.roomNumber || '',
    applicantType: formApplicantType.value,
    docFile: docFileName.value,
  })
}

function submitManualSlip() {
  if (!slipFileName.value) {
    emit('showToast', 'กรุณาอัปโหลดสลิปโอนเงิน')
    return
  }

  if (!payAmount.value) {
    emit('showToast', 'กรุณากรอกจำนวนเงิน')
    return
  }

  emit('submitManualSlip', {
    amount: Number(payAmount.value),
    date: payDate.value,
    time: payTime.value,
    fileName: slipFileName.value,
  })
}

function statusLabel(status: Applicant['status']) {
  switch (status) {
    case 'Submitted': return 'รอชำระเงิน'
    case 'Staff Verifying': return 'รอตรวจสอบ'
    case 'Confirmed': return 'ยืนยันสิทธิ์แล้ว'
    case 'Need Re-upload': return 'ต้องส่งสลิปใหม่'
    case 'Rejected': return 'ถูกปฏิเสธ'
    default: return status
  }
}

function statusVariant(status: Applicant['status']) {
  if (status === 'Confirmed') return 'default'
  if (status === 'Submitted' || status === 'Staff Verifying') return 'secondary'
  return 'outline'
}

function isWorkflowDone(index: number) {
  if (!props.activeApp) return index <= currentStepIndex.value
  if (props.activeApp.status === 'Confirmed') return true
  if (props.activeApp.status === 'Staff Verifying') return index <= 2
  if (props.activeApp.status === 'Submitted' || props.activeApp.status === 'Need Re-upload') return index <= 1
  return index === 0
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
    <aside class="space-y-4">
      <Card class="xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle class="text-base">ขั้นตอนการสมัคร</CardTitle>
          <CardDescription>ดำเนินการตามลำดับเพื่อยื่นคำขอจอง</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="(item, index) in workflowSteps"
            :key="item.key"
            class="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border p-3"
            :class="item.key === step ? 'bg-muted/60' : 'bg-card'"
          >
            <Badge :variant="isWorkflowDone(index) ? 'default' : 'outline'" class="size-7 justify-center rounded-full p-0">
              {{ index + 1 }}
            </Badge>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ item.label }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ item.description }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>

    <main class="min-w-0 space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm text-muted-foreground">Student reservation workspace</p>
          <h1 class="text-2xl font-semibold tracking-tight">สมัครและจองหอพัก</h1>
        </div>
        <Button v-if="activeApp" variant="outline" @click="step = 'tracking'">
          <Clock class="size-4" />
          ดูสถานะล่าสุด
        </Button>
      </div>

      <section v-if="step === 'campaigns'" class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="campaign in campaigns" :key="campaign.id" class="flex flex-col">
            <CardHeader class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <Badge variant="outline">{{ campaign.type }}</Badge>
                <Badge variant="secondary">{{ campaignRemaining(campaign) }}/{{ campaignCapacity(campaign) }} ว่าง</Badge>
              </div>
              <div>
                <CardTitle class="text-base">{{ campaign.name }}</CardTitle>
                <CardDescription class="mt-1 line-clamp-2">{{ campaign.description }}</CardDescription>
              </div>
            </CardHeader>
            <CardContent class="flex flex-1 flex-col justify-between gap-4">
              <div class="space-y-3">
                <Progress :model-value="campaignProgress(campaign)" />
                <div class="space-y-2 text-sm">
                  <div v-for="roomType in campaign.roomTypes" :key="roomType.name" class="flex items-center justify-between gap-3">
                    <span class="truncate text-muted-foreground">{{ roomType.name }}</span>
                    <span class="shrink-0 font-medium">{{ roomType.active }}/{{ roomType.capacity }}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <Info class="size-4" />
                <AlertTitle>เงื่อนไขชำระเงิน</AlertTitle>
                <AlertDescription>{{ campaign.paymentRequirement }} / {{ campaign.requiredAmount.toLocaleString() }} บาท</AlertDescription>
              </Alert>

              <Button :disabled="campaignRemaining(campaign) <= 0" class="w-full" @click="chooseCampaign(campaign)">
                <Building class="size-4" />
                {{ campaignRemaining(campaign) <= 0 ? 'ห้องพักเต็มแล้ว' : 'เลือกหอพักนี้' }}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <RoomSelector
        v-if="step === 'room-select' && selectedCampaign"
        :campaign="selectedCampaign"
        :dorm-rooms="dormRooms"
        @back="step = 'campaigns'"
        @select-room="handleRoomSelect"
      />

      <section v-if="step === 'form' && selectedCampaign" class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>กรอกรายละเอียดใบสมัคร</CardTitle>
              <CardDescription>{{ selectedCampaign.name }}</CardDescription>
            </div>
            <Button variant="outline" size="sm" @click="step = 'room-select'">
              <ArrowLeft class="size-4" />
              กลับไปเลือกห้อง
            </Button>
          </CardHeader>
          <CardContent>
            <form class="space-y-6" @submit.prevent="submitApplication">
              <Alert v-if="selectedRoom">
                <CheckCircle class="size-4" />
                <AlertTitle>ห้องที่เลือก</AlertTitle>
                <AlertDescription>
                  ห้อง {{ selectedRoom.roomNumber }} ชั้น {{ selectedRoom.floor }} / {{ selectedRoom.roomType }}
                </AlertDescription>
              </Alert>

              <FieldSet>
                <FieldTitle>ประเภทสิทธิ์และห้องพัก</FieldTitle>
                <FieldGroup class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>ประเภทห้องพัก</FieldLabel>
                    <Select v-model="formRoomType">
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="เลือกประเภทห้อง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="roomType in selectedCampaign.roomTypes" :key="roomType.name" :value="roomType.name">
                          {{ roomType.name }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>ประเภทผู้สมัคร</FieldLabel>
                    <Select v-model="formApplicantType">
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="เลือกประเภทผู้สมัคร" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Student">นักศึกษาทั่วไป</SelectItem>
                        <SelectItem value="New First-Year">นักศึกษาใหม่ปี 1</SelectItem>
                        <SelectItem value="Current Resident">นักศึกษาเก่าหอเดิม - ต่อสัญญา</SelectItem>
                        <SelectItem value="International Student">นักศึกษาต่างชาติ</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldTitle>ข้อมูลผู้สมัคร</FieldTitle>
                <FieldGroup class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>รหัสนักศึกษา</FieldLabel>
                    <Input v-model="formStudentId" placeholder="653020XXX-X" required />
                  </Field>
                  <Field>
                    <FieldLabel>ชื่อ-นามสกุล</FieldLabel>
                    <Input v-model="formName" placeholder="ชื่อภาษาไทยหรืออังกฤษ" required />
                  </Field>
                  <Field>
                    <FieldLabel>คณะ / หน่วยงาน</FieldLabel>
                    <Input v-model="formFaculty" placeholder="คณะวิทยาศาสตร์" required />
                  </Field>
                  <Field>
                    <FieldLabel>เพศ</FieldLabel>
                    <Select v-model="formGender">
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="เลือกเพศ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ชาย">ชาย</SelectItem>
                        <SelectItem value="หญิง">หญิง</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>เบอร์โทรศัพท์</FieldLabel>
                    <Input v-model="formPhone" type="tel" placeholder="0812345678" required />
                  </Field>
                  <Field>
                    <FieldLabel>อีเมล</FieldLabel>
                    <Input v-model="formEmail" type="email" placeholder="name@kku.ac.th" required />
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldTitle>ผู้ติดต่อฉุกเฉิน</FieldTitle>
                <FieldGroup class="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>ชื่อผู้ติดต่อ</FieldLabel>
                    <Input v-model="formEmergencyName" placeholder="ชื่อผู้ปกครองหรือผู้ติดต่อ" />
                  </Field>
                  <Field>
                    <FieldLabel>เบอร์โทรผู้ติดต่อ</FieldLabel>
                    <Input v-model="formEmergencyPhone" type="tel" placeholder="0891234567" />
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldTitle>เอกสารประกอบ</FieldTitle>
                <Button type="button" variant="outline" class="h-auto w-full flex-col py-6" @click="triggerDocUpload">
                  <Upload class="size-8 text-muted-foreground" />
                  <span>อัปโหลดสำเนาบัตรนักศึกษา</span>
                  <span class="text-xs text-muted-foreground">จำลองไฟล์ PDF/JPG/PNG</span>
                </Button>
                <div v-if="docFileName" class="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div class="flex min-w-0 items-center gap-2 text-sm">
                    <FileText class="size-4 shrink-0 text-muted-foreground" />
                    <span class="truncate font-medium">{{ docFileName }}</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" @click="docFileName = ''">ลบ</Button>
                </div>
              </FieldSet>

              <Field orientation="horizontal">
                <Checkbox id="formAgree" v-model="formAgree" />
                <FieldLabel for="formAgree" class="text-sm font-normal leading-relaxed">
                  ยืนยันว่าข้อมูลถูกต้อง และยอมรับเงื่อนไขการสมัคร/จองหอพักตามที่หอพักกำหนด
                </FieldLabel>
              </Field>

              <div class="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" @click="step = 'room-select'">ยกเลิก</Button>
                <Button type="submit">
                  <Send class="size-4" />
                  ส่งใบสมัคร
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside class="space-y-5">
          <Card class="xl:sticky xl:top-24">
            <CardHeader>
              <CardTitle class="text-base">สรุปก่อนยื่น</CardTitle>
              <CardDescription>ยอดชำระจะเปลี่ยนตามประเภทสิทธิ์</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="rounded-lg border bg-muted/40 p-4">
                <p class="text-sm text-muted-foreground">ยอดที่ต้องชำระ</p>
                <p class="mt-1 text-2xl font-semibold">{{ selectedPaymentAmount.toLocaleString() }} บาท</p>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">หอพัก</span>
                  <span class="text-right font-medium">{{ selectedCampaign.name }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">ห้อง</span>
                  <span class="font-medium">{{ selectedRoom?.roomNumber || '-' }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">ประเภทสิทธิ์</span>
                  <span class="text-right font-medium">{{ formApplicantType }}</span>
                </div>
              </div>
              <Alert>
                <Info class="size-4" />
                <AlertTitle>ยังไม่ถือว่าได้ห้องแน่นอน</AlertTitle>
                <AlertDescription>ต้องชำระเงินและผ่านการตรวจสอบตามนโยบายหอพักก่อน</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </section>

      <section v-if="step === 'tracking' && activeApp" class="space-y-5">
        <Card>
          <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>ติดตามใบสมัคร</CardTitle>
              <CardDescription>{{ activeApp.id }} / {{ activeApp.dormName }}</CardDescription>
            </div>
            <Badge :variant="statusVariant(activeApp.status)">{{ statusLabel(activeApp.status) }}</Badge>
          </CardHeader>
          <CardContent class="space-y-5">
            <div class="grid gap-3 md:grid-cols-4">
              <div
                v-for="(item, index) in ['สมัคร', 'ชำระเงิน', 'ตรวจสอบ', 'ยืนยัน']"
                :key="item"
                class="rounded-lg border p-3"
              >
                <Badge :variant="isWorkflowDone(index) ? 'default' : 'outline'" class="mb-2">{{ index + 1 }}</Badge>
                <p class="text-sm font-medium">{{ item }}</p>
              </div>
            </div>

            <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div class="space-y-4">
                <Tabs v-if="activeApp.status === 'Submitted'" v-model="paymentTab">
                  <TabsList>
                    <TabsTrigger value="unipay">UniPay</TabsTrigger>
                    <TabsTrigger value="manual">อัปโหลดสลิป</TabsTrigger>
                  </TabsList>

                  <TabsContent value="unipay">
                    <Card>
                      <CardContent class="space-y-4 p-6 text-center">
                        <div class="mx-auto flex size-14 items-center justify-center rounded-xl border bg-muted">
                          <CreditCard class="size-7" />
                        </div>
                        <div>
                          <h3 class="font-semibold">ชำระผ่าน UniPay</h3>
                          <p class="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                            จำลองการสร้างรายการชำระเงินและ sync สถานะจาก UniPay
                          </p>
                        </div>
                        <Badge variant="outline" class="font-mono">เหลือเวลา {{ formattedTime }}</Badge>
                        <Button @click="emit('simulateUniPay')">จำลองชำระผ่าน UniPay</Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="manual">
                    <Card>
                      <CardContent class="p-6">
                        <form class="space-y-4" @submit.prevent="submitManualSlip">
                          <FieldGroup class="grid gap-4 sm:grid-cols-3">
                            <Field>
                              <FieldLabel>จำนวนเงิน</FieldLabel>
                              <Input v-model="payAmount" type="number" required />
                            </Field>
                            <Field>
                              <FieldLabel>วันที่โอน</FieldLabel>
                              <Input v-model="payDate" type="date" required />
                            </Field>
                            <Field>
                              <FieldLabel>เวลาที่โอน</FieldLabel>
                              <Input v-model="payTime" type="time" required />
                            </Field>
                          </FieldGroup>
                          <Button type="button" variant="outline" class="h-auto w-full flex-col py-6" @click="triggerSlipUpload">
                            <Image class="size-8 text-muted-foreground" />
                            อัปโหลดรูปสลิปโอนเงิน
                          </Button>
                          <div v-if="slipFileName" class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                            <span class="font-medium">{{ slipFileName }}</span>
                            <Button type="button" variant="outline" size="sm" @click="slipFileName = ''">ลบ</Button>
                          </div>
                          <Button type="submit" class="w-full">ส่งหลักฐาน</Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card v-else-if="activeApp.status === 'Need Re-upload'">
                  <CardHeader>
                    <CardTitle class="text-base">กรุณาส่งสลิปใหม่</CardTitle>
                    <CardDescription>{{ activeApp.rejectReason }}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form class="space-y-4" @submit.prevent="submitManualSlip">
                      <FieldGroup class="grid gap-4 sm:grid-cols-3">
                        <Field>
                          <FieldLabel>จำนวนเงิน</FieldLabel>
                          <Input v-model="payAmount" type="number" required />
                        </Field>
                        <Field>
                          <FieldLabel>วันที่โอน</FieldLabel>
                          <Input v-model="payDate" type="date" required />
                        </Field>
                        <Field>
                          <FieldLabel>เวลาที่โอน</FieldLabel>
                          <Input v-model="payTime" type="time" required />
                        </Field>
                      </FieldGroup>
                      <Button type="button" variant="outline" class="h-auto w-full flex-col py-5" @click="triggerSlipUpload">
                        <Upload class="size-7 text-muted-foreground" />
                        อัปโหลดสลิปใหม่
                      </Button>
                      <Button type="submit" class="w-full">ส่งหลักฐานใหม่</Button>
                    </form>
                  </CardContent>
                </Card>

                <Alert v-else-if="activeApp.status === 'Staff Verifying'">
                  <Loader class="size-4 animate-spin" />
                  <AlertTitle>อยู่ระหว่างตรวจสอบ</AlertTitle>
                  <AlertDescription>เจ้าหน้าที่กำลังตรวจสอบหลักฐานการชำระเงิน</AlertDescription>
                </Alert>

                <Alert v-else-if="activeApp.status === 'Confirmed'">
                  <Check class="size-4" />
                  <AlertTitle>ยืนยันสิทธิ์เรียบร้อย</AlertTitle>
                  <AlertDescription>พิมพ์ใบยืนยันสิทธิ์เพื่อใช้ในวันรายงานตัวเข้าหอพัก</AlertDescription>
                </Alert>

                <Alert v-else-if="activeApp.status === 'Rejected'">
                  <AlertCircle class="size-4" />
                  <AlertTitle>ใบสมัครถูกปฏิเสธ</AlertTitle>
                  <AlertDescription>{{ activeApp.rejectReason || 'กรุณาติดต่อเจ้าหน้าที่หอพัก' }}</AlertDescription>
                </Alert>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle class="text-base">ข้อมูลใบสมัคร</CardTitle>
                </CardHeader>
                <CardContent class="space-y-3 text-sm">
                  <div class="flex justify-between gap-3">
                    <span class="text-muted-foreground">ชื่อ</span>
                    <span class="text-right font-medium">{{ activeApp.name }}</span>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-muted-foreground">รหัสนักศึกษา</span>
                    <span class="font-medium">{{ activeApp.studentId }}</span>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-muted-foreground">ห้อง</span>
                    <span class="text-right font-medium">{{ activeApp.roomNumber || '-' }}</span>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-muted-foreground">ประเภทห้อง</span>
                    <span class="text-right font-medium">{{ activeApp.roomType }}</span>
                  </div>
                  <Separator />
                  <div class="flex justify-between gap-3">
                    <span class="text-muted-foreground">วิธีชำระ</span>
                    <span class="font-medium">{{ activeApp.paymentMethod || '-' }}</span>
                  </div>
                  <div class="flex justify-between gap-3">
                    <span class="text-muted-foreground">ยอดชำระ</span>
                    <span class="font-semibold">{{ activeApp.amountPaid ? `${activeApp.amountPaid.toLocaleString()} บาท` : '-' }}</span>
                  </div>
                  <Button v-if="activeApp.status === 'Confirmed'" variant="outline" class="w-full" @click="emit('printTicket')">
                    <Printer class="size-4" />
                    พิมพ์ใบยืนยันสิทธิ์
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  </div>
</template>
