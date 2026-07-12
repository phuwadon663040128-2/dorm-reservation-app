<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import ObligationCard from '@/components/domain/ObligationCard.vue'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'

const payments = usePaymentsStore()
const reservation = useReservationStore()

const myObligations = computed(() => payments.myObligations)
const myResv = computed(() => reservation.myReservation)
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">การชำระเงิน</h1>
      <p class="text-sm text-muted-foreground">
        แต่ละรายการแยกอิสระ (ห้องแอร์ HL มี 2 รายการ: ROOM + HL) —
        ชำระด้วยแบบฟอร์ม QR อย่างเป็นทางการจากธนาคาร ไม่ต้องอัปโหลดสลิปในขั้นตอนปกติ
      </p>
    </div>

    <HoldCountdown
      v-if="myResv?.holdStatus === 'held_payment' && myResv.paymentDeadline"
      :expires-at="myResv.paymentDeadline"
      label="deadline ชำระเงินร่วมของกลุ่ม เหลือ"
    />

    <div v-if="myObligations.length" class="space-y-3">
      <ObligationCard v-for="o in myObligations" :key="o.id" :obligation="o" />
    </div>
    <Card v-else>
      <CardContent class="p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีรายการชำระเงิน — รายการจะถูกสร้างหลังการจองห้องสำเร็จ
      </CardContent>
    </Card>
  </div>
</template>
