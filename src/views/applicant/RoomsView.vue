<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { InfoIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import RoomBrowser from '@/components/domain/RoomBrowser.vue'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'
import type { Room } from '@/types'

const session = useSessionStore()
const reservation = useReservationStore()

// เลือกห้องได้เมื่อโปรไฟล์ครบ + (มีกลุ่มที่ตอบรับแล้ว หรือจะเหมาห้อง) และยังไม่มี hold ค้าง
const canReserve = computed(
  () => session.currentUser?.profileComplete === true && !reservation.myReservation,
)

function onSelect(room: Room) {
  // เฟส P3: จะต่อ flow จองจริง — leader กด Reserve → hold ทันที → countdown 15 นาที
  toast(
    `ต้นแบบ: เลือกห้อง ${room.number} — ขั้นถัดไปคือเลือกพักคู่/เหมาห้อง แล้วกดจอง ระบบจะล็อกห้องทันที (เฟส P3)`,
  )
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">เลือกห้องพัก</h1>
      <p class="text-sm text-muted-foreground">
        เลือกจากอาคาร → ชั้น → ห้องจริง เมื่อกดจอง ห้องจะถูกล็อกให้ทันทีระหว่างรอยืนยันและชำระเงิน
      </p>
    </div>

    <Alert v-if="reservation.myReservation">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>คุณมีการจองอยู่แล้ว</AlertTitle>
      <AlertDescription>
        ห้อง {{ reservation.myReservation.roomNumber }} — ดูสถานะได้ที่เมนู “การจองของฉัน”
        (1 คนมีได้ 1 การจอง/กลุ่มที่ใช้งานอยู่เท่านั้น)
      </AlertDescription>
    </Alert>
    <Alert v-else-if="!session.currentUser?.profileComplete" variant="destructive">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>ต้องกรอกโปรไฟล์ให้ครบก่อนจอง</AlertTitle>
      <AlertDescription>ไปที่เมนู “บัญชี” เพื่อกรอกข้อมูลที่จำเป็นให้ครบถ้วน</AlertDescription>
    </Alert>

    <RoomBrowser :selectable="canReserve" @select="onSelect" />
  </div>
</template>
