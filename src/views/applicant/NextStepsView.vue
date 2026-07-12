<script setup lang="ts">
import { computed } from 'vue'
import { KeyRoundIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { keyHandoverStatusLabel } from '@/lib/labels'
import { useContractsStore } from '@/stores/contracts'

const contractsStore = useContractsStore()
const myHandovers = computed(() => contractsStore.myKeyHandovers)
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">รับกุญแจ / ขั้นตอนถัดไป</h1>
      <p class="text-sm text-muted-foreground">
        การส่งมอบกุญแจเป็นเอกสารลงนามแยกจากสัญญา — รับได้เมื่อชำระครบ ลงนามสัญญาแล้ว และเอกสารครบตามที่หอกำหนด
      </p>
    </div>

    <div v-if="myHandovers.length" class="space-y-3">
      <Card v-for="kh in myHandovers" :key="kh.id">
        <CardHeader>
          <div class="flex items-center justify-between gap-2">
            <CardTitle class="flex items-center gap-2 text-base">
              <KeyRoundIcon class="size-4" aria-hidden="true" /> กุญแจห้อง {{ kh.roomNumber }}
            </CardTitle>
            <Badge :variant="kh.status === 'ready' || kh.status === 'signed_handed_over' ? 'secondary' : 'outline'">
              {{ keyHandoverStatusLabel[kh.status] }}
            </Badge>
          </div>
          <CardDescription v-if="kh.status === 'ready'">
            ติดต่อรับกุญแจที่สำนักงานหอพักในวัน-เวลาทำการ พร้อมบัตรประจำตัว
          </CardDescription>
        </CardHeader>
        <CardContent v-if="kh.status === 'not_ready'" class="text-sm text-muted-foreground">
          เงื่อนไขที่ยังไม่ครบจะแสดงที่หน้า “ภาพรวม” — โดยทั่วไปคือการชำระเงินหรือสัญญาของกลุ่มยังไม่ครบ
        </CardContent>
      </Card>
    </div>
    <Card v-else>
      <CardContent class="p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีรายการรับกุญแจ — จะปรากฏหลังการจองได้รับการยืนยันและสัญญาเรียบร้อย
      </CardContent>
    </Card>
  </div>
</template>
