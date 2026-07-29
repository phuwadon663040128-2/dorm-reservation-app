<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { FileTextIcon, PrinterIcon, UploadIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import FileAttachmentField from '@/components/domain/FileAttachmentField.vue'
import { contractStatusLabel, occupancyModeLabel } from '@/lib/labels'
import { useContractsStore } from '@/stores/contracts'
import { useReservationStore } from '@/stores/reservation'

const contractsStore = useContractsStore()
const reservation = useReservationStore()

const myContracts = computed(() => contractsStore.myContracts)
const groupProgress = computed(() => {
  const resv = reservation.myReservation
  return resv ? contractsStore.groupContractProgress(resv.id) : null
})
const pendingCancellation = computed(() => {
  const resv = reservation.myReservation
  return resv ? reservation.pendingCancellationForReservation(resv.id) : undefined
})

const uploadDialogOpen = ref(false)
const selectedContractId = ref('')
const signedFileName = ref('')
const signedFile = ref<File | null>(null)
const selectedContract = computed(() => myContracts.value.find(item => item.id === selectedContractId.value))

function openUploadDialog(contractId: string) {
  const contract = myContracts.value.find(item => item.id === contractId)
  if (contract && contractsStore.blockedReservationIds.includes(contract.reservationGroupId)) {
    toast.info('ขั้นตอนสัญญาถูกพักระหว่างรอพิจารณาคำขอยกเลิก')
    return
  }
  selectedContractId.value = contractId
  signedFileName.value = ''
  signedFile.value = null
  uploadDialogOpen.value = true
}

function uploadSignedContract() {
  if (!selectedContract.value || !signedFile.value) {
    toast.error('กรุณาเลือกไฟล์สแกนหรือรูปถ่ายสัญญาที่ลงนามแล้ว')
    return
  }

  const uploaded = contractsStore.uploadSignedContractScan(selectedContract.value.id, signedFile.value.name)
  if (!uploaded) {
    toast.error('ไม่สามารถบันทึกไฟล์สัญญานี้ได้ กรุณาตรวจสอบสถานะล่าสุด')
    return
  }

  toast.success('อัปโหลดสัญญาที่ลงนามแล้วสำเร็จ ไฟล์ถูกเก็บแบบ private และรอเจ้าหน้าที่ตรวจรับ')
  uploadDialogOpen.value = false
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">สัญญา</h1>
      <p class="text-sm text-muted-foreground">
        สัญญาเป็นกระดาษลงนามจริง — พิมพ์ ลงนาม แล้วอัปโหลดสแกน/ถ่ายรูปเก็บไว้เป็นหลักฐาน (เก็บแบบ private)
      </p>
    </div>

    <Alert v-if="pendingCancellation" class="border-primary/30 bg-primary/5">
      <FileTextIcon aria-hidden="true" />
      <AlertTitle>พักขั้นตอนสัญญาชั่วคราว</AlertTitle>
      <AlertDescription>ยังไม่สามารถพิมพ์หรือส่งสัญญาเพิ่มได้จนกว่าเจ้าหน้าที่จะแจ้งผลคำขอยกเลิก</AlertDescription>
    </Alert>

    <Card v-if="groupProgress && groupProgress.total > 1">
      <CardContent class="flex items-center justify-between gap-2 p-4">
        <p class="text-sm font-medium">สถานะกลุ่ม (พักคู่ลงนามแยกกันได้)</p>
        <Badge :variant="groupProgress.complete ? 'secondary' : 'outline'">
          ลงนามแล้ว {{ groupProgress.signed }} จาก {{ groupProgress.total }} ฉบับ
        </Badge>
      </CardContent>
    </Card>

    <div v-if="myContracts.length" class="space-y-3">
      <Card v-for="ct in myContracts" :key="ct.id">
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <CardTitle class="flex items-center gap-2 text-base">
              <FileTextIcon class="size-4" aria-hidden="true" />
              สัญญาห้อง {{ ct.roomNumber }} ({{ occupancyModeLabel[ct.occupancyMode] }})
            </CardTitle>
            <Badge>{{ contractStatusLabel[ct.status] }}</Badge>
          </div>
          <CardDescription>
            {{ ct.contractPeriod }} · แม่แบบ {{ ct.templateVersion }} ·
            สแกนลายเซ็น: {{ ct.signedScanUploaded ? 'อัปโหลดแล้ว' : 'ยังไม่อัปโหลด' }}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-if="ct.signedScanUploaded"
            class="flex min-w-0 items-center gap-3 rounded-lg border bg-muted/30 p-3"
          >
            <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
              <FileTextIcon class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ ct.signedScanFileName ?? 'ไฟล์สแกนสัญญาที่ลงนามแล้ว' }}</p>
              <p class="text-xs text-muted-foreground">ไฟล์ส่วนตัว · รอหรือผ่านการตรวจรับตามสถานะสัญญา</p>
            </div>
            <Badge variant="success" class="shrink-0">อัปโหลดแล้ว</Badge>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" @click="toast('ต้นแบบ: เปิดตัวอย่างสัญญา (PDF snapshot ไม่แก้ไขย้อนหลัง)')">
              ดูตัวอย่าง
            </Button>
            <Button
              size="sm"
              variant="outline"
              :disabled="contractsStore.blockedReservationIds.includes(ct.reservationGroupId)"
              @click="toast('ต้นแบบ: พิมพ์สัญญา — ระบบบันทึกประวัติการพิมพ์ทุกครั้ง')"
            >
              <PrinterIcon aria-hidden="true" /> พิมพ์
            </Button>
            <Button
              v-if="!ct.signedScanUploaded && ct.status === 'printed'"
              size="sm"
              :disabled="contractsStore.blockedReservationIds.includes(ct.reservationGroupId)"
              @click="openUploadDialog(ct.id)"
            >
              <UploadIcon aria-hidden="true" /> อัปโหลดสัญญาที่ลงนาม
            </Button>
          </div>
          <div v-if="ct.printHistory.length" class="text-xs text-muted-foreground">
            ประวัติการพิมพ์:
            <span v-for="(p, i) in ct.printHistory" :key="i">
              {{ i > 0 ? ' · ' : '' }}โดย {{ p.by }}<template v-if="p.reason"> (เหตุผล: {{ p.reason }})</template>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
    <Empty v-else class="border bg-card shadow-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon"><FileTextIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>ยังไม่มีสัญญา</EmptyTitle>
        <EmptyDescription>
          สัญญาจะสร้างได้หลังชำระครบและเจ้าหน้าที่ยืนยันการจองอย่างเป็นทางการ
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button as-child variant="outline" size="sm">
          <RouterLink to="/app/reservation">ตรวจสอบสถานะการจอง</RouterLink>
        </Button>
      </EmptyContent>
    </Empty>

    <Dialog v-model:open="uploadDialogOpen">
      <DialogContent class="w-[calc(100vw-1rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>อัปโหลดสัญญาที่ลงนามแล้ว</DialogTitle>
          <DialogDescription>
            สัญญาห้อง {{ selectedContract?.roomNumber }} · รองรับ PDF, JPG และ PNG ไฟล์นี้เป็นข้อมูลส่วนบุคคลและจัดเก็บแบบ private
          </DialogDescription>
        </DialogHeader>

        <FileAttachmentField
          v-model="signedFileName"
          v-model:file="signedFile"
          input-id="signed-contract-file"
          label="ไฟล์สัญญาที่ลงนามแล้ว"
          select-label="เลือกไฟล์สัญญา"
          hint="PDF, JPG หรือ PNG · สูงสุดตามข้อกำหนดของระบบจริง"
          accept="application/pdf,image/jpeg,image/png"
          status-text="พร้อมอัปโหลดแบบ private"
        />

        <DialogFooter>
          <Button variant="outline" @click="uploadDialogOpen = false">ยกเลิก</Button>
          <Button :disabled="!signedFile" @click="uploadSignedContract">
            <UploadIcon aria-hidden="true" /> ยืนยันอัปโหลด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
