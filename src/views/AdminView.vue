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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
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

const showTab = (tab: string) => props.currentAdminTab === tab

const statTotalApps = computed(() => props.applicants.length)
const statPendingVerify = computed(() => props.applicants.filter(a => a.status === 'Staff Verifying').length)
const statConfirmed = computed(() => props.applicants.filter(a => a.status === 'Confirmed').length)

const totalCapacityAndBeds = computed(() => {
  let reserved = 0
  let total = 0
  props.campaigns.forEach(campaign => {
    campaign.roomTypes.forEach(room => {
      reserved += room.capacity - room.active
      total += room.capacity
    })
  })
  return {
    reserved,
    total,
    pct: total > 0 ? Number(((reserved / total) * 100).toFixed(1)) : 0,
  }
})

const recentApplicants = computed(() => props.applicants.slice(0, 5))
const uniqueDorms = computed(() => Array.from(new Set(props.applicants.map(app => app.dormName))))

const campaignModalOpen = ref(false)
const cmName = ref('')
const cmOpenDate = ref('')
const cmCloseDate = ref('')
const cmRequiredAmount = ref<number | ''>('')
const cmType = ref('หอพักเครือข่าย')
const cmPaymentRequirement = ref('ค่าประกันความเสียหาย')

const adminSearch = ref('')
const adminFilterDorm = ref('all')
const adminFilterStatus = ref('all')
const adminFilterType = ref('all')

const verifyModalOpen = ref(false)
const selectedApp = ref<Applicant | null>(null)
const drawerActionReason = ref('')

const filteredApplicants = computed(() => {
  const query = adminSearch.value.toLowerCase()
  return props.applicants.filter(app => {
    const matchesQuery = app.name.toLowerCase().includes(query)
      || app.studentId.toLowerCase().includes(query)
      || app.id.toLowerCase().includes(query)
    const matchesDorm = adminFilterDorm.value === 'all' || app.dormName === adminFilterDorm.value
    const matchesStatus = adminFilterStatus.value === 'all' || app.status === adminFilterStatus.value
    const matchesType = adminFilterType.value === 'all' || app.applicantType === adminFilterType.value
    return matchesQuery && matchesDorm && matchesStatus && matchesType
  })
})

function handleOpenCampaignModal() {
  cmName.value = ''
  cmOpenDate.value = ''
  cmCloseDate.value = ''
  cmRequiredAmount.value = ''
  campaignModalOpen.value = true
}

function handleSaveCampaign() {
  if (!cmName.value || !cmRequiredAmount.value) {
    emit('showToast', 'กรุณากรอกข้อมูลแคมเปญให้ครบถ้วน')
    return
  }

  const newCampaign: DormCampaign = {
    id: `dorm-${Math.floor(1000 + Math.random() * 9000)}`,
    name: cmName.value,
    type: cmType.value,
    status: 'open',
    description: `รับสมัครเข้าพักอาศัย ${cmName.value} ประจำปีการศึกษา 2568`,
    openDate: cmOpenDate.value,
    closeDate: cmCloseDate.value,
    roomTypes: [
      { name: 'ห้องเตียงคู่ (เครื่องปรับอากาศ)', price: 9000, capacity: 50, active: 50 },
      { name: 'ห้องเตียงคู่ (พัดลม)', price: 4000, capacity: 30, active: 30 },
    ],
    rules: 'การชำระเงินตามเงื่อนไขของโครงการเพื่อยืนยันห้อง',
    paymentRequirement: cmPaymentRequirement.value,
    requiredAmount: Number(cmRequiredAmount.value),
    facilities: ['WiFi', 'เครื่องปรับอากาศ', 'เตียงนอน', 'ตู้เสื้อผ้า'],
  }

  emit('createCampaign', newCampaign)
  campaignModalOpen.value = false
}

function openVerifyModal(app: Applicant) {
  selectedApp.value = app
  drawerActionReason.value = ''
  verifyModalOpen.value = true
}

function closeVerifyModal() {
  selectedApp.value = null
  verifyModalOpen.value = false
}

function handleApprove() {
  if (!selectedApp.value) return
  emit('approveApp', selectedApp.value.id)
  emit('showToast', 'อนุมัติสิทธิ์ห้องพักสำเร็จ')
  closeVerifyModal()
}

function handleRequestReupload() {
  if (!selectedApp.value) return
  if (!drawerActionReason.value.trim()) {
    emit('showToast', 'กรุณาระบุเหตุผลที่ต้องการให้ส่งสลิปใหม่')
    return
  }
  emit('reuploadApp', { appId: selectedApp.value.id, reason: drawerActionReason.value.trim() })
  emit('showToast', 'ส่งคำขอสลิปใหม่สำเร็จ')
  closeVerifyModal()
}

function handleReject() {
  if (!selectedApp.value) return
  if (!drawerActionReason.value.trim()) {
    emit('showToast', 'กรุณาระบุเหตุผลการปฏิเสธสิทธิ์')
    return
  }
  emit('rejectApp', { appId: selectedApp.value.id, reason: drawerActionReason.value.trim() })
  emit('showToast', 'ปฏิเสธคำขอสิทธิ์การจองเรียบร้อย')
  closeVerifyModal()
}

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
    case 'Staff Verifying': return 'รอตรวจสอบ'
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
  return capacity > 0 ? Math.round(((capacity - active) / capacity) * 100) : 0
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="showTab('dashboard')" class="space-y-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">ผู้สมัครทั้งหมด</CardTitle>
            <FileText class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ statTotalApps }}</div>
            <p class="text-xs text-muted-foreground">ใบสมัครรวมในระบบ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">รอตรวจสลิป</CardTitle>
            <Clock class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ statPendingVerify }}</div>
            <p class="text-xs text-muted-foreground">ต้องตรวจสอบหลักฐาน</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">ยืนยันสิทธิ์แล้ว</CardTitle>
            <Check class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ statConfirmed }}</div>
            <p class="text-xs text-muted-foreground">จองห้องพักสำเร็จ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">อัตราจอง</CardTitle>
            <Users class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="text-2xl font-bold">{{ totalCapacityAndBeds.pct }}%</div>
            <Progress :model-value="totalCapacityAndBeds.pct" />
            <p class="text-xs text-muted-foreground">
              จองแล้ว {{ totalCapacityAndBeds.reserved }} / โควตา {{ totalCapacityAndBeds.total }}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ใบสมัครล่าสุด</CardTitle>
          <CardDescription>รายการที่เจ้าหน้าที่ควรตรวจดูเป็นลำดับแรก</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead class="hidden sm:table-cell">หอพัก</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="app in recentApplicants"
                :key="app.id"
                class="cursor-pointer"
                @click="emit('update:currentAdminTab', 'applicants'); openVerifyModal(app)"
              >
                <TableCell class="font-medium">{{ app.id }}</TableCell>
                <TableCell>{{ app.name }}</TableCell>
                <TableCell class="hidden sm:table-cell">{{ app.dormName }}</TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(app.status)">{{ getStatusLabel(app.status) }}</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Card v-if="showTab('campaigns')">
      <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>จัดการแคมเปญรับสมัคร</CardTitle>
          <CardDescription>สร้าง แก้ไข และเปิด/ปิดรอบรับสมัครหอพัก</CardDescription>
        </div>
        <Button @click="handleOpenCampaignModal">
          <Plus class="size-4" />
          สร้างแคมเปญใหม่
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อหอพัก</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead class="hidden md:table-cell">ว่าง/ทั้งหมด</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead class="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="campaign in campaigns" :key="campaign.id">
              <TableCell class="font-medium">{{ campaign.name }}</TableCell>
              <TableCell>{{ campaign.type }}</TableCell>
              <TableCell class="hidden md:table-cell">
                {{ campaign.roomTypes.reduce((s, r) => s + r.active, 0) }} /
                {{ campaign.roomTypes.reduce((s, r) => s + r.capacity, 0) }}
              </TableCell>
              <TableCell>
                <Badge :variant="campaign.status === 'open' ? 'secondary' : 'outline'">
                  {{ campaign.status === 'open' ? 'เปิดรับสมัคร' : 'ปิดการรับ' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" @click="emit('showToast', `แก้ไขแคมเปญ ${campaign.name}`)">แก้ไข</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Card v-if="showTab('applicants')">
      <CardHeader>
        <CardTitle>รายการใบสมัคร</CardTitle>
        <CardDescription>ค้นหา กรอง และตรวจสอบหลักฐานการชำระเงิน</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 md:grid-cols-4">
          <Input v-model="adminSearch" placeholder="ค้นหาชื่อ รหัสนักศึกษา หรือเลขใบสมัคร" />
          <Select v-model="adminFilterDorm">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="ทุกหอพัก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหอพัก</SelectItem>
              <SelectItem v-for="dorm in uniqueDorms" :key="dorm" :value="dorm">{{ dorm }}</SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="adminFilterStatus">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
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
            <SelectTrigger class="w-full">
              <SelectValue placeholder="ทุกประเภทสิทธิ์" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภทสิทธิ์</SelectItem>
              <SelectItem value="General Student">นักศึกษาทั่วไป</SelectItem>
              <SelectItem value="New First-Year">นักศึกษาใหม่ปี 1</SelectItem>
              <SelectItem value="Current Resident">ต่อสัญญา</SelectItem>
              <SelectItem value="International Student">ต่างชาติ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัส</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead class="hidden sm:table-cell">หอพัก</TableHead>
              <TableHead class="hidden md:table-cell">ประเภทห้อง</TableHead>
              <TableHead class="hidden lg:table-cell">ประเภทสิทธิ์</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead class="text-right">ดู</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="app in filteredApplicants" :key="app.id" class="cursor-pointer" @click="openVerifyModal(app)">
              <TableCell class="font-medium">{{ app.id }}</TableCell>
              <TableCell>{{ app.name }}</TableCell>
              <TableCell class="hidden sm:table-cell">{{ app.dormName }}</TableCell>
              <TableCell class="hidden md:table-cell">{{ app.roomType }}</TableCell>
              <TableCell class="hidden lg:table-cell">{{ getThaiAppType(app.applicantType) }}</TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(app.status)">{{ getStatusLabel(app.status) }}</Badge>
              </TableCell>
              <TableCell class="text-right" @click.stop>
                <Button variant="ghost" size="icon-sm" @click="openVerifyModal(app)">
                  <Eye class="size-4" />
                  <span class="sr-only">ดูรายละเอียด</span>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Card v-if="showTab('rooms')">
      <CardHeader>
        <CardTitle>โควตาห้องพักตามประเภท</CardTitle>
        <CardDescription>แสดงการจองแบบ room type/quota สำหรับ mock-up ระยะแรก</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <template v-for="campaign in campaigns" :key="campaign.id">
            <Card v-for="roomType in campaign.roomTypes" :key="roomType.name">
              <CardHeader>
                <Badge variant="outline" class="w-fit">{{ campaign.name }}</Badge>
                <CardTitle class="text-base">{{ roomType.name }}</CardTitle>
                <CardDescription>{{ roomType.active }} ว่าง จาก {{ roomType.capacity }}</CardDescription>
              </CardHeader>
              <CardContent class="space-y-2">
                <Progress :model-value="roomProgress(roomType.capacity, roomType.active)" />
                <p class="text-xs text-muted-foreground">
                  จองแล้ว {{ roomType.capacity - roomType.active }} ({{ roomProgress(roomType.capacity, roomType.active) }}%)
                </p>
              </CardContent>
            </Card>
          </template>
        </div>
      </CardContent>
    </Card>

    <Card v-if="showTab('reports')">
      <CardHeader>
        <CardTitle>รายงานและส่งออกข้อมูล</CardTitle>
        <CardDescription>เตรียมข้อมูลสำหรับงานเอกสารและระบบการเงินเดิม</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <Users class="size-5 text-muted-foreground" />
              <CardTitle class="text-base">รายชื่อผู้จองที่ยืนยันสิทธิ์แล้ว</CardTitle>
              <CardDescription>ส่งออก CSV รายชื่อนักศึกษาที่จองสำเร็จ</CardDescription>
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
              <CardTitle class="text-base">ข้อมูลการเงินการชำระเงิน</CardTitle>
              <CardDescription>ส่งออก CSV รายละเอียดเงินโอนสำหรับฝ่ายบัญชี</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" class="w-full" @click="emit('exportData', 'payments')">
                <Download class="size-4" />
                ดาวน์โหลด CSV
              </Button>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>

    <Card v-if="showTab('settings')">
      <CardHeader>
        <CardTitle>ตั้งค่าเงื่อนไขระบบ</CardTitle>
        <CardDescription>ค่าจำลองสำหรับรอบรับสมัครและการตรวจสลิป</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet class="max-w-md">
          <FieldTitle>เงื่อนไขหลัก</FieldTitle>
          <FieldGroup>
            <Field>
              <FieldLabel>เวลาการจอง (ชั่วโมง) ก่อนสิทธิ์หมดอายุหากไม่จ่ายเงิน</FieldLabel>
              <Input type="number" value="12" />
            </Field>
            <Field>
              <FieldLabel>จำนวนครั้งสูงสุดในการส่งสลิปซ้ำ</FieldLabel>
              <Input type="number" value="3" />
            </Field>
          </FieldGroup>
          <Button class="w-fit" @click="emit('showToast', 'บันทึกการตั้งค่าระบบเรียบร้อย')">
            <Settings class="size-4" />
            บันทึกการตั้งค่า
          </Button>
        </FieldSet>
      </CardContent>
    </Card>

    <Card v-if="showTab('auditlog')">
      <CardHeader>
        <CardTitle>บันทึกกิจกรรมในระบบ</CardTitle>
        <CardDescription>System Audit Trail</CardDescription>
      </CardHeader>
      <CardContent class="max-h-[350px] space-y-2 overflow-y-auto">
        <div v-for="log in auditLogs" :key="log.timestamp + log.detail" class="border-b pb-2 text-sm">
          <span class="font-mono text-xs text-muted-foreground">[{{ log.timestamp }}]</span>
          <p>{{ log.detail }}</p>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="campaignModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>สร้างแคมเปญใหม่</DialogTitle>
          <DialogDescription>กำหนดข้อมูลรอบรับสมัครและเงื่อนไขการชำระเงินเบื้องต้น</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <Field>
            <FieldLabel>ชื่อหอพัก / แคมเปญ</FieldLabel>
            <Input v-model="cmName" placeholder="เช่น หอพักวรเรสซิเดนซ์ รอบที่ 1/2568" />
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
            <NativeSelect v-model="cmPaymentRequirement" class="w-full">
              <NativeSelectOption value="ค่าประกันความเสียหาย">ค่าประกันความเสียหาย</NativeSelectOption>
              <NativeSelectOption value="ค่าหอพักล่วงหน้า 1 เทอม">ค่าหอพักล่วงหน้า 1 เทอม</NativeSelectOption>
              <NativeSelectOption value="ค่าหอพัก 2 เทอม">ค่าหอพัก 2 เทอม</NativeSelectOption>
              <NativeSelectOption value="ค่าประกัน + ค่าหอพัก 1 เทอม">ค่าประกัน + ค่าหอพัก 1 เทอม</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel>จำนวนเงินที่ต้องชำระ (บาท)</FieldLabel>
            <Input v-model="cmRequiredAmount" type="number" placeholder="3000" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="campaignModalOpen = false">ยกเลิก</Button>
          <Button @click="handleSaveCampaign">บันทึกแคมเปญ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="verifyModalOpen">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>รายละเอียดใบสมัครและการตรวจสอบ</DialogTitle>
          <DialogDescription v-if="selectedApp">
            {{ selectedApp.id }} - {{ selectedApp.name }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedApp" class="grid max-h-[70vh] gap-6 overflow-y-auto md:grid-cols-2">
          <div class="space-y-4 text-sm">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">ข้อมูลผู้สมัคร</CardTitle>
              </CardHeader>
              <CardContent class="space-y-2">
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">รหัสใบสมัคร</span><strong>{{ selectedApp.id }}</strong></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">ชื่อ</span><strong>{{ selectedApp.name }}</strong></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">รหัสนักศึกษา</span><strong>{{ selectedApp.studentId }}</strong></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">คณะ</span><span class="text-right">{{ selectedApp.faculty }} ({{ selectedApp.gender }})</span></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">ประเภทสิทธิ์</span><span>{{ getThaiAppType(selectedApp.applicantType) }}</span></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">ติดต่อ</span><span class="text-right">{{ selectedApp.phone }}<br>{{ selectedApp.email }}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-base">รายละเอียดห้องพัก</CardTitle>
              </CardHeader>
              <CardContent class="space-y-2">
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">หอพัก</span><span class="text-right font-medium">{{ selectedApp.dormName }}</span></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">ประเภทห้อง</span><span class="text-right">{{ selectedApp.roomType }}</span></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">ห้อง</span><span>{{ selectedApp.roomNumber || '-' }}</span></div>
                <div class="flex justify-between gap-3"><span class="text-muted-foreground">สถานะ</span><Badge :variant="getStatusVariant(selectedApp.status)">{{ getStatusLabel(selectedApp.status) }}</Badge></div>
              </CardContent>
            </Card>
          </div>

          <div class="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">หลักฐานการชำระเงิน</CardTitle>
                <CardDescription>{{ selectedApp.paymentMethod || 'ยังไม่มีข้อมูลการชำระเงิน' }}</CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="selectedApp.paymentMethod" class="rounded-lg border bg-muted/30 p-4 font-mono text-xs">
                  <div class="border-b pb-2 text-center font-bold">KKU PAYMENT RECEIPT</div>
                  <div class="mt-3 space-y-2">
                    <div class="flex justify-between"><span>Ref No:</span><span>{{ selectedApp.id }}</span></div>
                    <div class="flex justify-between"><span>Date:</span><span>{{ selectedApp.paymentDate }}</span></div>
                    <div class="flex justify-between"><span>Time:</span><span>{{ selectedApp.paymentTime || '10:15' }}</span></div>
                    <div class="flex justify-between"><span>Method:</span><span>{{ selectedApp.paymentMethod }}</span></div>
                    <Separator />
                    <div class="flex justify-between font-bold"><span>TOTAL PAID:</span><span>{{ selectedApp.amountPaid.toLocaleString() }} THB</span></div>
                  </div>
                </div>
                <Alert v-else>
                  <AlertCircle class="size-4" />
                  <AlertTitle>ยังไม่มีประวัติการโอนเงิน</AlertTitle>
                  <AlertDescription>ผู้สมัครยังไม่ได้ชำระเงินหรืออัปโหลดหลักฐาน</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card v-if="selectedApp.status !== 'Confirmed' && selectedApp.status !== 'Rejected'">
              <CardHeader>
                <CardTitle class="text-base">การดำเนินการ</CardTitle>
                <CardDescription>อนุมัติ ขอเอกสารใหม่ หรือปฏิเสธใบสมัคร</CardDescription>
              </CardHeader>
              <CardContent class="space-y-3">
                <Button class="w-full" @click="handleApprove">
                  <Check class="size-4" />
                  อนุมัติสิทธิ์ห้องพัก
                </Button>
                <Field>
                  <FieldLabel>เหตุผล (กรณีขอสลิปใหม่ / ปฏิเสธ)</FieldLabel>
                  <Textarea v-model="drawerActionReason" placeholder="ระบุเหตุผล เช่น รูปเบลอ, ยอดเงินไม่ถูกต้อง..." />
                </Field>
                <div class="grid grid-cols-2 gap-2">
                  <Button variant="outline" @click="handleRequestReupload">
                    <AlertCircle class="size-4" />
                    อัปโหลดใหม่
                  </Button>
                  <Button variant="outline" @click="handleReject">
                    <XCircle class="size-4" />
                    ปฏิเสธสิทธิ์
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
