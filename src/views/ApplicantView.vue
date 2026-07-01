<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  AlertCircle,
  Check,
  CheckCircle,
  CreditCard,
  ExternalLink,
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel, FieldSet, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
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

const step = ref<'campaigns' | 'room-select' | 'form' | 'tracking'>('campaigns')
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
    step.value = 'campaigns'
    selectedCampaign.value = null
    selectedRoom.value = null
  }
})

const formattedTime = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function handleCampaignSelect(camp: DormCampaign) {
  selectedCampaign.value = camp
  selectedRoom.value = null
  step.value = 'room-select'
}

function handleRoomSelect(room: { floor: number; roomNumber: string; roomType: string }) {
  selectedRoom.value = room
  formRoomType.value = room.roomType
  step.value = 'form'
}

function updatePaymentRulesDisplay() {
  if (!selectedCampaign.value) return 0
  const appType = formApplicantType.value
  let amount = selectedCampaign.value.requiredAmount

  if (selectedCampaign.value.id === 'dorm-9') {
    const roomPrice = selectedCampaign.value.roomTypes.find(r => r.name === formRoomType.value)?.price || 8000
    amount = appType === 'New First-Year' ? roomPrice * 2 : roomPrice
  } else if (selectedCampaign.value.id === 'dorm-inter') {
    amount = appType === 'International Student' ? 19000 : 4000
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

function handleFormSubmit() {
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

function handleManualSlipSubmit() {
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

function campaignRemaining(campaign: DormCampaign) {
  return campaign.roomTypes.reduce((sum, room) => sum + room.active, 0)
}

function campaignCapacity(campaign: DormCampaign) {
  return campaign.roomTypes.reduce((sum, room) => sum + room.capacity, 0)
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
</script>

<template>
  <div class="space-y-6">
    <Card v-if="step === 'campaigns'">
      <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>หอพักในกำกับที่เปิดรับสมัคร</CardTitle>
          <CardDescription>เลือกหอพักที่ต้องการสมัครเพื่อดำเนินการจองห้องพักออนไลน์</CardDescription>
        </div>
        <Badge variant="secondary">
          <CheckCircle class="size-3" />
          UniPay พร้อมจำลอง
        </Badge>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="campaign in campaigns" :key="campaign.id">
            <CardHeader>
              <div class="flex items-center justify-between gap-2">
                <Badge variant="outline">{{ campaign.type }}</Badge>
                <Badge variant="secondary">{{ campaignRemaining(campaign) }}/{{ campaignCapacity(campaign) }} ว่าง</Badge>
              </div>
              <CardTitle class="text-base">{{ campaign.name }}</CardTitle>
              <CardDescription>{{ campaign.description }}</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="space-y-2">
                <div v-for="roomType in campaign.roomTypes" :key="roomType.name" class="flex items-center justify-between gap-3 text-sm">
                  <span class="text-muted-foreground">{{ roomType.name }}</span>
                  <Badge variant="outline">{{ roomType.active }}/{{ roomType.capacity }}</Badge>
                </div>
              </div>
              <Alert>
                <Info class="size-4" />
                <AlertTitle>เงื่อนไขการชำระเงิน</AlertTitle>
                <AlertDescription>{{ campaign.rules }}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                class="w-full"
                :disabled="campaignRemaining(campaign) <= 0"
                @click="handleCampaignSelect(campaign)"
              >
                {{ campaignRemaining(campaign) <= 0 ? 'ห้องพักเต็มแล้ว' : 'เลือกห้องและสมัคร' }}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>

    <RoomSelector
      v-if="step === 'room-select' && selectedCampaign"
      :campaign="selectedCampaign"
      :dorm-rooms="dormRooms"
      @back="step = 'campaigns'"
      @select-room="handleRoomSelect"
    />

    <Card v-if="step === 'form' && selectedCampaign">
      <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>กรอกรายละเอียดใบสมัคร</CardTitle>
          <CardDescription>{{ selectedCampaign.name }}</CardDescription>
        </div>
        <Button variant="outline" size="sm" @click="step = 'room-select'">ย้อนกลับ</Button>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit.prevent="handleFormSubmit">
          <Alert v-if="selectedRoom">
            <CheckCircle class="size-4" />
            <AlertTitle>ห้องที่เลือก</AlertTitle>
            <AlertDescription>
              ห้อง {{ selectedRoom.roomNumber }} ชั้น {{ selectedRoom.floor }} - {{ selectedRoom.roomType }}
            </AlertDescription>
          </Alert>

          <FieldSet>
            <FieldTitle>ประเภทห้องและผู้สมัคร</FieldTitle>
            <FieldGroup class="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>ประเภทห้องพัก</FieldLabel>
                <NativeSelect v-model="formRoomType" class="w-full" required>
                  <NativeSelectOption v-for="rt in selectedCampaign.roomTypes" :key="rt.name" :value="rt.name">
                    {{ rt.name }} - {{ rt.price.toLocaleString() }} บาท/เทอม
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>ประเภทผู้สมัคร</FieldLabel>
                <NativeSelect v-model="formApplicantType" class="w-full" required>
                  <NativeSelectOption value="General Student">นักศึกษาทั่วไป</NativeSelectOption>
                  <NativeSelectOption value="New First-Year">นักศึกษาใหม่ปี 1</NativeSelectOption>
                  <NativeSelectOption value="Current Resident">นักศึกษาเก่าหอเดิม - ต่อสัญญา</NativeSelectOption>
                  <NativeSelectOption value="International Student">นักศึกษาต่างชาติ</NativeSelectOption>
                </NativeSelect>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldTitle>ข้อมูลผู้สมัคร</FieldTitle>
            <FieldGroup class="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>รหัสนักศึกษา</FieldLabel>
                <Input v-model="formStudentId" placeholder="เช่น 653020XXX-X" required />
              </Field>
              <Field>
                <FieldLabel>ชื่อ-นามสกุล</FieldLabel>
                <Input v-model="formName" placeholder="เช่น นายสมชาย รักเรียน" required />
              </Field>
              <Field>
                <FieldLabel>คณะ / หน่วยงาน</FieldLabel>
                <Input v-model="formFaculty" placeholder="เช่น คณะวิศวกรรมศาสตร์" required />
              </Field>
              <Field>
                <FieldLabel>เพศ</FieldLabel>
                <NativeSelect v-model="formGender" class="w-full" required>
                  <NativeSelectOption value="ชาย">ชาย</NativeSelectOption>
                  <NativeSelectOption value="หญิง">หญิง</NativeSelectOption>
                </NativeSelect>
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
                <FieldLabel>ชื่อผู้ติดต่อฉุกเฉิน</FieldLabel>
                <Input v-model="formEmergencyName" placeholder="เช่น นางสมหญิง รักเรียน" />
              </Field>
              <Field>
                <FieldLabel>เบอร์โทรผู้ติดต่อ</FieldLabel>
                <Input v-model="formEmergencyPhone" type="tel" placeholder="0891234567" />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldTitle>อัปโหลดเอกสารประกอบ</FieldTitle>
            <Button type="button" variant="outline" class="h-auto w-full flex-col py-6" @click="triggerDocUpload">
              <Upload class="size-8 text-muted-foreground" />
              <span>คลิกเพื่อจำลองอัปโหลดสำเนาบัตรนักศึกษา</span>
              <span class="text-xs text-muted-foreground">รองรับ PDF, JPG, PNG ขนาดไม่เกิน 5MB</span>
            </Button>
            <div v-if="docFileName" class="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div class="flex items-center gap-2 text-sm">
                <FileText class="size-4 text-muted-foreground" />
                <span class="font-medium">{{ docFileName }}</span>
              </div>
              <Button type="button" variant="outline" size="sm" @click="docFileName = ''">ลบไฟล์</Button>
            </div>
          </FieldSet>

          <Alert>
            <Info class="size-4" />
            <AlertTitle>เงื่อนไขการชำระเงิน</AlertTitle>
            <AlertDescription>
              ยอดเงินที่ต้องชำระตามประเภทสิทธิ์: <strong>{{ updatePaymentRulesDisplay().toLocaleString() }} บาท</strong>
            </AlertDescription>
          </Alert>

          <Field orientation="horizontal">
            <Checkbox id="formAgree" v-model="formAgree" />
            <FieldLabel for="formAgree" class="text-sm font-normal leading-relaxed">
              ข้าพเจ้ายืนยันว่าข้อมูลถูกต้อง และยอมรับเงื่อนไขการจองหอพักตามที่หอพักกำหนด
            </FieldLabel>
          </Field>

          <div class="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" @click="step = 'room-select'">ยกเลิก</Button>
            <Button type="submit">ส่งใบสมัครและชำระเงิน</Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <Card v-if="step === 'tracking' && activeApp">
      <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>ชำระเงินและติดตามสถานะ</CardTitle>
          <CardDescription>{{ activeApp.id }} - {{ activeApp.dormName }}</CardDescription>
        </div>
        <div class="flex items-center gap-2">
          <Badge :variant="statusVariant(activeApp.status)">{{ statusLabel(activeApp.status) }}</Badge>
          <Button variant="outline" size="sm" @click="step = 'campaigns'">กลับหน้าหลัก</Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid gap-2 sm:grid-cols-4">
          <Card v-for="(label, index) in ['ยื่นสมัคร', 'ชำระเงิน', 'ตรวจสอบ', 'ยืนยันสิทธิ์']" :key="label" class="bg-muted/20">
            <CardContent class="flex items-center gap-3 p-3">
              <Badge :variant="index === 0 || activeApp.status === 'Confirmed' || (index === 1 && activeApp.status !== 'Submitted') || (index === 2 && ['Staff Verifying', 'Confirmed'].includes(activeApp.status)) ? 'default' : 'outline'">
                {{ index + 1 }}
              </Badge>
              <span class="text-sm font-medium">{{ label }}</span>
            </CardContent>
          </Card>
        </div>

        <Tabs v-if="activeApp.status === 'Submitted'" v-model="paymentTab" class="w-full">
          <TabsList>
            <TabsTrigger value="unipay">ชำระผ่าน UniPay</TabsTrigger>
            <TabsTrigger value="manual">อัปโหลดสลิป</TabsTrigger>
          </TabsList>

          <TabsContent value="unipay">
            <Card>
              <CardContent class="space-y-4 p-6 text-center">
                <div class="mx-auto flex size-14 items-center justify-center rounded-xl border bg-muted">
                  <CreditCard class="size-7" />
                </div>
                <div>
                  <h3 class="font-semibold">ระบบชำระเงินอัตโนมัติ UniPay</h3>
                  <p class="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    ระบบจะเชื่อมต่อกับ UniPay ของมหาวิทยาลัยขอนแก่น และอัปเดตสถานะชำระเงินอัตโนมัติ
                  </p>
                </div>
                <Badge variant="outline" class="font-mono">เหลือเวลา {{ formattedTime }} นาที</Badge>
                <div>
                  <Button @click="emit('simulateUniPay')">
                    <ExternalLink class="size-4" />
                    จำลองชำระผ่าน UniPay
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardContent class="p-6">
                <form class="space-y-4" @submit.prevent="handleManualSlipSubmit">
                  <FieldGroup class="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel>จำนวนเงินที่โอน (บาท)</FieldLabel>
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
                    <span>คลิกเพื่อจำลองอัปโหลดรูปสลิปโอนเงิน</span>
                  </Button>
                  <div v-if="slipFileName" class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    <span class="font-medium">{{ slipFileName }}</span>
                    <Button type="button" variant="outline" size="sm" @click="slipFileName = ''">ลบไฟล์</Button>
                  </div>
                  <Button type="submit" class="w-full">
                    <Send class="size-4" />
                    ส่งหลักฐานการชำระเงิน
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Alert v-else-if="activeApp.status === 'Staff Verifying'">
          <Loader class="size-4 animate-spin" />
          <AlertTitle>อยู่ระหว่างการตรวจสอบสลิป</AlertTitle>
          <AlertDescription>เจ้าหน้าที่กำลังตรวจสอบหลักฐานการชำระเงิน กรุณารอสักครู่</AlertDescription>
        </Alert>

        <Card v-else-if="activeApp.status === 'Need Re-upload'">
          <CardHeader>
            <CardTitle class="text-base">เจ้าหน้าที่ขอให้ส่งสลิปใหม่</CardTitle>
            <CardDescription>{{ activeApp.rejectReason }}</CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="handleManualSlipSubmit">
              <FieldGroup class="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel>จำนวนเงินที่โอน (บาท)</FieldLabel>
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
                <Image class="size-7 text-muted-foreground" />
                อัปโหลดสลิปแผ่นใหม่
              </Button>
              <Button type="submit" class="w-full">ส่งหลักฐานใหม่</Button>
            </form>
          </CardContent>
        </Card>

        <Alert v-else-if="activeApp.status === 'Confirmed'">
          <Check class="size-4" />
          <AlertTitle>ยืนยันสิทธิ์ห้องพักเรียบร้อย</AlertTitle>
          <AlertDescription>
            กรุณาพิมพ์ใบยืนยันสิทธิ์เพื่อแสดงในวันรายงานตัวเข้าหอพัก
          </AlertDescription>
        </Alert>

        <Alert v-else-if="activeApp.status === 'Rejected'">
          <AlertCircle class="size-4" />
          <AlertTitle>ใบสมัครถูกปฏิเสธ / สิทธิ์การจองถูกยกเลิก</AlertTitle>
          <AlertDescription>{{ activeApp.rejectReason || 'กรุณาติดต่อเจ้าหน้าที่หอพักเพื่อสอบถามรายละเอียดเพิ่มเติม' }}</AlertDescription>
        </Alert>

        <Separator />

        <div class="grid gap-4 text-sm md:grid-cols-2">
          <div class="space-y-2">
            <h3 class="font-medium">ข้อมูลใบสมัคร</h3>
            <div class="rounded-lg border p-3 text-muted-foreground">
              {{ activeApp.name }} / {{ activeApp.studentId }}<br>
              {{ activeApp.roomType }}{{ activeApp.roomNumber ? ` ห้อง ${activeApp.roomNumber}` : '' }}
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="font-medium">การชำระเงิน</h3>
            <div class="rounded-lg border p-3 text-muted-foreground">
              {{ activeApp.paymentMethod || 'ยังไม่มีข้อมูลการชำระเงิน' }}
              <template v-if="activeApp.amountPaid">
                / {{ activeApp.amountPaid.toLocaleString() }} บาท
              </template>
            </div>
          </div>
        </div>

        <Button v-if="activeApp.status === 'Confirmed'" variant="outline" class="w-full" @click="emit('printTicket')">
          <Printer class="size-4" />
          พิมพ์ใบยืนยันสิทธิ์
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
