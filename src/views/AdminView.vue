<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  AlertCircle,
  Check,
  Clock,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  Settings,
  Users,
  XCircle,
} from '@lucide/vue'
import type { Applicant, AuditLog, DormCampaign, DormRooms } from '../types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel, FieldSet, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
  currentAdminTab: string
  campaigns: DormCampaign[]
  applicants: Applicant[]
  dormRooms: DormRooms
  auditLogs: AuditLog[]
}>()

const emit = defineEmits<{
  (e: 'update:currentAdminTab', tab: string): void
  (e: 'createCampaign', camp: DormCampaign): void
  (e: 'approveApp', appId: string): void
  (e: 'reuploadApp', payload: { appId: string; reason: string }): void
  (e: 'rejectApp', payload: { appId: string; reason: string }): void
  (e: 'exportData', type: 'residents' | 'payments'): void
  (e: 'showToast', msg: string): void
}>()

const campaignModalOpen = ref(false)
const verifyModalOpen = ref(false)
const selectedApp = ref<Applicant | null>(null)
const actionReason = ref('')

const adminSearch = ref('')
const adminFilterDorm = ref('all')
const adminFilterStatus = ref('all')
const adminFilterType = ref('all')

const cmName = ref('')
const cmType = ref('หอพักเครือข่าย')
const cmOpenDate = ref('')
const cmCloseDate = ref('')
const cmRequiredAmount = ref<number | ''>('')
const cmPaymentRequirement = ref('ค่าประกันความเสียหาย')

const showTab = (tab: string) => props.currentAdminTab === tab

const totalApplicants = computed(() => props.applicants.length)
const waitingPayment = computed(() => props.applicants.filter(app => app.status === 'Submitted').length)
const waitingVerify = computed(() => props.applicants.filter(app => app.status === 'Staff Verifying').length)
const confirmed = computed(() => props.applicants.filter(app => app.status === 'Confirmed').length)
const uniqueDorms = computed(() => Array.from(new Set(props.applicants.map(app => app.dormName))))
const recentApplicants = computed(() => props.applicants.slice(0, 6))

const quotaSummary = computed(() => {
  let total = 0
  let active = 0
  props.campaigns.forEach(campaign => {
    campaign.roomTypes.forEach(room => {
      total += room.capacity
      active += room.active
    })
  })

  const reserved = total - active
  return {
    total,
    active,
    reserved,
    percent: total ? Math.round((reserved / total) * 100) : 0,
  }
})

const roomCount = computed(() => {
  return Object.values(props.dormRooms).reduce((sum, dorm) => {
    return sum + dorm.floors.reduce((floorSum, floor) => floorSum + floor.rooms.length, 0)
  }, 0)
})

const filteredApplicants = computed(() => {
  const query = adminSearch.value.trim().toLowerCase()
  return props.applicants.filter(app => {
    const matchesSearch = !query
      || app.id.toLowerCase().includes(query)
      || app.name.toLowerCase().includes(query)
      || app.studentId.toLowerCase().includes(query)
    const matchesDorm = adminFilterDorm.value === 'all' || app.dormName === adminFilterDorm.value
    const matchesStatus = adminFilterStatus.value === 'all' || app.status === adminFilterStatus.value
    const matchesType = adminFilterType.value === 'all' || app.applicantType === adminFilterType.value
    return matchesSearch && matchesDorm && matchesStatus && matchesType
  })
})

function getThaiAppType(type: string) {
  switch (type) {
    case 'General Student': return 'นักศึกษาทั่วไป'
    case 'New First-Year': return 'นักศึกษาใหม่ปี 1'
    case 'Current Resident': return 'ต่อสัญญา'
    case 'International Student': return 'ต่างชาติ'
    default: return type
  }
}

function getStatusLabel(status: Applicant['status']) {
  switch (status) {
    case 'Submitted': return 'รอชำระเงิน'
    case 'Staff Verifying': return 'รอตรวจสลิป'
    case 'Confirmed': return 'ยืนยันแล้ว'
    case 'Need Re-upload': return 'ขอสลิปใหม่'
    case 'Rejected': return 'ปฏิเสธ'
    default: return status
  }
}

function getStatusVariant(status: Applicant['status']) {
  if (status === 'Confirmed') return 'default'
  if (status === 'Submitted' || status === 'Staff Verifying') return 'secondary'
  return 'outline'
}

function roomProgress(capacity: number, active: number) {
  return capacity ? Math.round(((capacity - active) / capacity) * 100) : 0
}

function openApplicant(app: Applicant) {
  selectedApp.value = app
  actionReason.value = ''
  verifyModalOpen.value = true
}

function closeApplicant() {
  selectedApp.value = null
  verifyModalOpen.value = false
}

function openCampaignModal() {
  cmName.value = ''
  cmOpenDate.value = ''
  cmCloseDate.value = ''
  cmRequiredAmount.value = ''
  cmType.value = 'หอพักเครือข่าย'
  cmPaymentRequirement.value = 'ค่าประกันความเสียหาย'
  campaignModalOpen.value = true
}

function saveCampaign() {
  if (!cmName.value || !cmRequiredAmount.value) {
    emit('showToast', 'กรุณากรอกข้อมูลแคมเปญให้ครบถ้วน')
    return
  }

  emit('createCampaign', {
    id: `dorm-${Math.floor(1000 + Math.random() * 9000)}`,
    name: cmName.value,
    type: cmType.value,
    status: 'open',
    description: `รอบรับสมัคร ${cmName.value}`,
    openDate: cmOpenDate.value,
    closeDate: cmCloseDate.value,
    requiredAmount: Number(cmRequiredAmount.value),
    paymentRequirement: cmPaymentRequirement.value,
    rules: `ชำระ ${cmPaymentRequirement.value} เพื่อยืนยันสิทธิ์`,
    facilities: ['WiFi', 'ระบบรักษาความปลอดภัย', 'พื้นที่ส่วนกลาง'],
    roomTypes: [
      { name: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)', price: 9000, capacity: 40, active: 40 },
      { name: 'ห้องเตียงคู่ (พัดลม)', price: 4000, capacity: 30, active: 30 },
    ],
  })
  campaignModalOpen.value = false
}

function approveApplicant() {
  if (!selectedApp.value) return
  emit('approveApp', selectedApp.value.id)
  emit('showToast', 'อนุมัติสิทธิ์ห้องพักสำเร็จ')
  closeApplicant()
}

function requestReupload() {
  if (!selectedApp.value) return
  if (!actionReason.value.trim()) {
    emit('showToast', 'กรุณาระบุเหตุผลสำหรับการขอสลิปใหม่')
    return
  }
  emit('reuploadApp', { appId: selectedApp.value.id, reason: actionReason.value.trim() })
  emit('showToast', 'ส่งคำขอสลิปใหม่สำเร็จ')
  closeApplicant()
}

function rejectApplicant() {
  if (!selectedApp.value) return
  if (!actionReason.value.trim()) {
    emit('showToast', 'กรุณาระบุเหตุผลสำหรับการปฏิเสธ')
    return
  }
  emit('rejectApp', { appId: selectedApp.value.id, reason: actionReason.value.trim() })
  emit('showToast', 'ปฏิเสธใบสมัครเรียบร้อย')
  closeApplicant()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">Dorm operations workspace</p>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{
            showTab('dashboard') ? 'แดชบอร์ดภาพรวม'
            : showTab('campaigns') ? 'จัดการรอบรับสมัคร'
            : showTab('applicants') ? 'รายการใบสมัคร'
            : showTab('rooms') ? 'โควตาห้องพัก'
            : showTab('reports') ? 'รายงานและส่งออก'
            : 'ตั้งค่าระบบ'
          }}
        </h1>
      </div>
      <div class="flex gap-2">
        <Button v-if="showTab('campaigns')" @click="openCampaignModal">
          <Plus class="size-4" />
          สร้างแคมเปญ
        </Button>
        <Button v-if="showTab('reports')" variant="outline" @click="emit('exportData', 'residents')">
          <Download class="size-4" />
          Export residents
        </Button>
      </div>
    </div>

    <section v-if="showTab('dashboard')" class="space-y-5">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">ใบสมัครทั้งหมด</CardTitle>
            <FileText class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-semibold">{{ totalApplicants }}</p>
            <p class="text-xs text-muted-foreground">รายการในระบบจำลอง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">รอชำระเงิน</CardTitle>
            <Clock class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-semibold">{{ waitingPayment }}</p>
            <p class="text-xs text-muted-foreground">ผู้สมัครที่ยังไม่ส่งหลักฐาน</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">รอตรวจสลิป</CardTitle>
            <AlertCircle class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-semibold">{{ waitingVerify }}</p>
            <p class="text-xs text-muted-foreground">ต้องดำเนินการโดยเจ้าหน้าที่</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">ยืนยันแล้ว</CardTitle>
            <Check class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-semibold">{{ confirmed }}</p>
            <p class="text-xs text-muted-foreground">ผ่านเงื่อนไขการจอง</p>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>ใบสมัครล่าสุด</CardTitle>
            <CardDescription>คลิกแถวเพื่อเปิดรายละเอียดและตรวจสอบหลักฐาน</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ผู้สมัคร</TableHead>
                  <TableHead class="hidden md:table-cell">หอพัก</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="app in recentApplicants" :key="app.id" class="cursor-pointer" @click="openApplicant(app)">
                  <TableCell class="font-medium">{{ app.id }}</TableCell>
                  <TableCell>{{ app.name }}</TableCell>
                  <TableCell class="hidden md:table-cell">{{ app.dormName }}</TableCell>
                  <TableCell>
                    <Badge :variant="getStatusVariant(app.status)">{{ getStatusLabel(app.status) }}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ภาพรวมโควตา</CardTitle>
            <CardDescription>{{ roomCount }} ห้องในข้อมูลจำลอง</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="rounded-lg border bg-muted/40 p-4">
              <p class="text-sm text-muted-foreground">อัตราจองรวม</p>
              <p class="mt-1 text-3xl font-semibold">{{ quotaSummary.percent }}%</p>
              <Progress :model-value="quotaSummary.percent" class="mt-3" />
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg border p-3">
                <p class="text-muted-foreground">จองแล้ว</p>
                <p class="font-semibold">{{ quotaSummary.reserved }}</p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-muted-foreground">คงเหลือ</p>
                <p class="font-semibold">{{ quotaSummary.active }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    <section v-if="showTab('campaigns')" class="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>แคมเปญรับสมัคร</CardTitle>
          <CardDescription>กำหนดรอบสมัคร เงื่อนไขชำระเงิน และ quota ตามประเภทห้อง</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หอพัก</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead class="hidden md:table-cell">ช่วงเวลา</TableHead>
                <TableHead>โควตา</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="campaign in campaigns" :key="campaign.id">
                <TableCell class="font-medium">{{ campaign.name }}</TableCell>
                <TableCell>{{ campaign.type }}</TableCell>
                <TableCell class="hidden md:table-cell">{{ campaign.openDate }} - {{ campaign.closeDate }}</TableCell>
                <TableCell>
                  {{ campaign.roomTypes.reduce((sum, room) => sum + room.active, 0) }}
                  /
                  {{ campaign.roomTypes.reduce((sum, room) => sum + room.capacity, 0) }}
                </TableCell>
                <TableCell>
                  <Badge :variant="campaign.status === 'open' ? 'secondary' : 'outline'">
                    {{ campaign.status === 'open' ? 'เปิดรับ' : 'ปิดรับ' }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>

    <section v-if="showTab('applicants')" class="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรองใบสมัคร</CardTitle>
          <CardDescription>ใช้ตัวกรองเพื่อจัดคิวงานตรวจสลิปและอนุมัติสิทธิ์</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 md:grid-cols-[minmax(16rem,1.4fr)_repeat(3,minmax(11rem,1fr))]">
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="adminSearch" class="pl-9" placeholder="ค้นหาชื่อ รหัสนักศึกษา หรือเลขใบสมัคร" />
          </div>
          <Select v-model="adminFilterDorm">
            <SelectTrigger class="w-full"><SelectValue placeholder="ทุกหอพัก" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหอพัก</SelectItem>
              <SelectItem v-for="dorm in uniqueDorms" :key="dorm" :value="dorm">{{ dorm }}</SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="adminFilterStatus">
            <SelectTrigger class="w-full"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="Submitted">รอชำระเงิน</SelectItem>
              <SelectItem value="Staff Verifying">รอตรวจสลิป</SelectItem>
              <SelectItem value="Confirmed">ยืนยันแล้ว</SelectItem>
              <SelectItem value="Need Re-upload">ขอสลิปใหม่</SelectItem>
              <SelectItem value="Rejected">ปฏิเสธ</SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="adminFilterType">
            <SelectTrigger class="w-full"><SelectValue placeholder="ทุกประเภทสิทธิ์" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภทสิทธิ์</SelectItem>
              <SelectItem value="General Student">นักศึกษาทั่วไป</SelectItem>
              <SelectItem value="New First-Year">นักศึกษาใหม่ปี 1</SelectItem>
              <SelectItem value="Current Resident">ต่อสัญญา</SelectItem>
              <SelectItem value="International Student">ต่างชาติ</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการใบสมัคร</CardTitle>
          <CardDescription>{{ filteredApplicants.length }} รายการจาก {{ applicants.length }} รายการทั้งหมด</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ผู้สมัคร</TableHead>
                <TableHead class="hidden md:table-cell">หอพัก</TableHead>
                <TableHead class="hidden lg:table-cell">ประเภทสิทธิ์</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead class="text-right">เปิด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="app in filteredApplicants" :key="app.id" class="cursor-pointer" @click="openApplicant(app)">
                <TableCell class="font-medium">{{ app.id }}</TableCell>
                <TableCell>
                  <div class="font-medium">{{ app.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ app.studentId }}</div>
                </TableCell>
                <TableCell class="hidden md:table-cell">{{ app.dormName }}</TableCell>
                <TableCell class="hidden lg:table-cell">{{ getThaiAppType(app.applicantType) }}</TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(app.status)">{{ getStatusLabel(app.status) }}</Badge>
                </TableCell>
                <TableCell class="text-right" @click.stop>
                  <Button variant="ghost" size="icon-sm" @click="openApplicant(app)">
                    <Eye class="size-4" />
                    <span class="sr-only">เปิดรายละเอียด</span>
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="!filteredApplicants.length">
                <TableCell colspan="6" class="h-24 text-center text-muted-foreground">ไม่พบใบสมัครตามเงื่อนไข</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>

    <section v-if="showTab('rooms')" class="space-y-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <template v-for="campaign in campaigns" :key="campaign.id">
          <Card v-for="roomType in campaign.roomTypes" :key="`${campaign.id}-${roomType.name}`">
            <CardHeader>
              <Badge variant="outline" class="w-fit">{{ campaign.name }}</Badge>
              <CardTitle class="text-base">{{ roomType.name }}</CardTitle>
              <CardDescription>{{ roomType.active }} ว่าง จาก {{ roomType.capacity }}</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <Progress :model-value="roomProgress(roomType.capacity, roomType.active)" />
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">จองแล้ว</span>
                <span class="font-medium">{{ roomType.capacity - roomType.active }} ห้อง/เตียง</span>
              </div>
            </CardContent>
          </Card>
        </template>
      </div>
    </section>

    <section v-if="showTab('reports')" class="grid gap-5 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Users class="size-5 text-muted-foreground" />
          <CardTitle class="text-base">รายชื่อผู้จองที่ยืนยันแล้ว</CardTitle>
          <CardDescription>ส่งออกข้อมูลผู้สมัครที่ได้รับสิทธิ์</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" class="w-full" @click="emit('exportData', 'residents')">
            <Download class="size-4" />
            ดาวน์โหลด CSV
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <FileText class="size-5 text-muted-foreground" />
          <CardTitle class="text-base">ข้อมูลการชำระเงิน</CardTitle>
          <CardDescription>ส่งออกข้อมูลการชำระเงินเพื่อกระทบยอด</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" class="w-full" @click="emit('exportData', 'payments')">
            <Download class="size-4" />
            ดาวน์โหลด CSV
          </Button>
        </CardFooter>
      </Card>
    </section>

    <section v-if="showTab('settings')" class="grid gap-5 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>ตั้งค่า Workflow</CardTitle>
          <CardDescription>ค่าจำลองสำหรับกฎการสมัครและตรวจสอบหลักฐาน</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldTitle>เงื่อนไขหลัก</FieldTitle>
            <FieldGroup>
              <Field>
                <FieldLabel>เวลาถือสิทธิ์หลังยื่นสมัคร (ชั่วโมง)</FieldLabel>
                <Input type="number" value="12" />
              </Field>
              <Field>
                <FieldLabel>จำนวนครั้งสูงสุดในการส่งสลิปซ้ำ</FieldLabel>
                <Input type="number" value="3" />
              </Field>
              <Button class="w-fit" @click="emit('showToast', 'บันทึกการตั้งค่าระบบเรียบร้อย')">
                <Settings class="size-4" />
                บันทึก
              </Button>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>กิจกรรมล่าสุดในระบบจำลอง</CardDescription>
        </CardHeader>
        <CardContent class="max-h-[28rem] space-y-3 overflow-y-auto">
          <div v-for="log in auditLogs" :key="log.timestamp + log.detail" class="rounded-lg border p-3 text-sm">
            <p class="font-mono text-xs text-muted-foreground">{{ log.timestamp }}</p>
            <p class="mt-1">{{ log.detail }}</p>
          </div>
        </CardContent>
      </Card>
    </section>

    <Dialog v-model:open="campaignModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>สร้างแคมเปญรับสมัคร</DialogTitle>
          <DialogDescription>กำหนดข้อมูลเบื้องต้นสำหรับรอบรับสมัครใหม่</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <Field>
            <FieldLabel>ชื่อแคมเปญ / หอพัก</FieldLabel>
            <Input v-model="cmName" placeholder="หอพักวรเรสซิเดนซ์ รอบ 1/2568" />
          </Field>
          <Field>
            <FieldLabel>ประเภทหอพัก</FieldLabel>
            <Select v-model="cmType">
              <SelectTrigger class="w-full"><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="หอพักเครือข่าย">หอพักเครือข่าย</SelectItem>
                <SelectItem value="หอพักหญิง มข.">หอพักหญิง มข.</SelectItem>
                <SelectItem value="หอพักนานาชาติ">หอพักนานาชาติ</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <FieldGroup class="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>วันเปิดรับสมัคร</FieldLabel>
              <Input v-model="cmOpenDate" type="date" />
            </Field>
            <Field>
              <FieldLabel>วันปิดรับสมัคร</FieldLabel>
              <Input v-model="cmCloseDate" type="date" />
            </Field>
          </FieldGroup>
          <Field>
            <FieldLabel>เงื่อนไขชำระเงิน</FieldLabel>
            <Select v-model="cmPaymentRequirement">
              <SelectTrigger class="w-full"><SelectValue placeholder="เลือกเงื่อนไข" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ค่าประกันความเสียหาย">ค่าประกันความเสียหาย</SelectItem>
                <SelectItem value="ค่าหอพักล่วงหน้า 1 เทอม">ค่าหอพักล่วงหน้า 1 เทอม</SelectItem>
                <SelectItem value="ค่าหอพัก 2 เทอม">ค่าหอพัก 2 เทอม</SelectItem>
                <SelectItem value="ค่าประกัน + ค่าหอพัก 1 เทอม">ค่าประกัน + ค่าหอพัก 1 เทอม</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>ยอดที่ต้องชำระ (บาท)</FieldLabel>
            <Input v-model="cmRequiredAmount" type="number" placeholder="3000" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="campaignModalOpen = false">ยกเลิก</Button>
          <Button @click="saveCampaign">บันทึกแคมเปญ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="verifyModalOpen">
      <DialogContent class="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>รายละเอียดใบสมัคร</DialogTitle>
          <DialogDescription v-if="selectedApp">{{ selectedApp.id }} / {{ selectedApp.name }}</DialogDescription>
        </DialogHeader>

        <div v-if="selectedApp" class="grid max-h-[72vh] gap-5 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div class="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">ข้อมูลผู้สมัคร</CardTitle>
              </CardHeader>
              <CardContent class="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p class="text-muted-foreground">ชื่อ</p>
                  <p class="font-medium">{{ selectedApp.name }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">รหัสนักศึกษา</p>
                  <p class="font-medium">{{ selectedApp.studentId }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">คณะ</p>
                  <p class="font-medium">{{ selectedApp.faculty }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">ติดต่อ</p>
                  <p class="font-medium">{{ selectedApp.phone }}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-base">รายละเอียดการจอง</CardTitle>
              </CardHeader>
              <CardContent class="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p class="text-muted-foreground">หอพัก</p>
                  <p class="font-medium">{{ selectedApp.dormName }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">ประเภทห้อง</p>
                  <p class="font-medium">{{ selectedApp.roomType }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">ประเภทสิทธิ์</p>
                  <p class="font-medium">{{ getThaiAppType(selectedApp.applicantType) }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">สถานะ</p>
                  <Badge :variant="getStatusVariant(selectedApp.status)">{{ getStatusLabel(selectedApp.status) }}</Badge>
                </div>
              </CardContent>
            </Card>

          </div>

          <aside class="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">หลักฐานการชำระเงิน</CardTitle>
                <CardDescription>{{ selectedApp.paymentMethod || 'ยังไม่มีข้อมูลการชำระเงิน' }}</CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="selectedApp.paymentMethod" class="rounded-lg border bg-muted/30 p-4 font-mono text-xs">
                  <div class="flex justify-between"><span>Ref</span><span>{{ selectedApp.id }}</span></div>
                  <div class="flex justify-between"><span>Date</span><span>{{ selectedApp.paymentDate }}</span></div>
                  <div class="flex justify-between"><span>Time</span><span>{{ selectedApp.paymentTime }}</span></div>
                  <Separator class="my-3" />
                  <div class="flex justify-between font-semibold"><span>Total</span><span>{{ selectedApp.amountPaid.toLocaleString() }} THB</span></div>
                </div>
                <Alert v-else>
                  <AlertCircle class="size-4" />
                  <AlertTitle>ยังไม่มีหลักฐาน</AlertTitle>
                  <AlertDescription>ผู้สมัครยังไม่ได้ชำระเงินหรืออัปโหลดสลิป</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div class="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
              <Button class="w-full" :disabled="selectedApp.status === 'Confirmed' || selectedApp.status === 'Rejected'" @click="approveApplicant">
                <Check class="size-4" />
                อนุมัติสิทธิ์
              </Button>
              <Field>
                <FieldLabel>เหตุผล</FieldLabel>
                <Textarea v-model="actionReason" placeholder="เช่น รูปสลิปไม่ชัด ยอดเงินไม่ตรง หรือเอกสารไม่ครบ" />
              </Field>
              <div class="grid gap-2">
                <Button variant="outline" :disabled="selectedApp.status === 'Confirmed' || selectedApp.status === 'Rejected'" @click="requestReupload">
                  <AlertCircle class="size-4" />
                  ขอให้ส่งสลิปใหม่
                </Button>
                <Button variant="outline" :disabled="selectedApp.status === 'Confirmed' || selectedApp.status === 'Rejected'" @click="rejectApplicant">
                  <XCircle class="size-4" />
                  ปฏิเสธใบสมัคร
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
