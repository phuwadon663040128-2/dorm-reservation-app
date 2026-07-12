<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { FileTextIcon, PrinterIcon, UploadIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">สัญญา</h1>
      <p class="text-sm text-muted-foreground">
        สัญญาเป็นกระดาษลงนามจริง — พิมพ์ ลงนาม แล้วอัปโหลดสแกน/ถ่ายรูปเก็บไว้เป็นหลักฐาน (เก็บแบบ private)
      </p>
    </div>

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
          <div class="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" @click="toast('ต้นแบบ: เปิดตัวอย่างสัญญา (PDF snapshot ไม่แก้ไขย้อนหลัง)')">
              ดูตัวอย่าง
            </Button>
            <Button size="sm" variant="outline" @click="toast('ต้นแบบ: พิมพ์สัญญา — ระบบบันทึกประวัติการพิมพ์ทุกครั้ง')">
              <PrinterIcon aria-hidden="true" /> พิมพ์
            </Button>
            <Button
              v-if="!ct.signedScanUploaded && ct.status === 'printed'"
              size="sm"
              @click="toast('ต้นแบบ: อัปโหลดสแกน/รูปสัญญาที่ลงนามแล้ว — ไฟล์เก็บแบบ private (เฟส P6)')"
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
    <Card v-else>
      <CardContent class="p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีสัญญา — สัญญาจะสร้างได้หลังการจองได้รับการยืนยัน (ชำระครบ + เจ้าหน้าที่ยืนยัน)
      </CardContent>
    </Card>
  </div>
</template>
