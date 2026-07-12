<script setup lang="ts">
import RoomBrowser from '@/components/domain/RoomBrowser.vue'
import { Card, CardContent } from '@/components/ui/card'
import { useDormStore } from '@/stores/dorm'

const dorm = useDormStore()
const summary = dorm.availabilitySummary
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">ห้องพักทั้งหมด</h1>
      <p class="text-sm text-muted-foreground">
        สถานะคำนวณจากห้องจริงรายห้อง — ห้องที่ถูกจองชั่วคราวจะแสดงเวลาหมดสิทธิ์ และจะกลับมาว่างอัตโนมัติหากไม่ชำระตามกำหนด
      </p>
    </div>

    <!-- summary คำนวณจาก exact rooms (ไม่ใช่โควตา) -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <CardContent class="p-4 text-center">
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ summary.available }}</p>
          <p class="text-xs text-muted-foreground">ห้องว่าง</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 text-center">
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ summary.temporarilyHeld }}</p>
          <p class="text-xs text-muted-foreground">ถูกจองชั่วคราว</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 text-center">
          <p class="text-2xl font-bold">{{ summary.reserved }}</p>
          <p class="text-xs text-muted-foreground">จองแล้ว</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 text-center">
          <p class="text-2xl font-bold text-muted-foreground">{{ summary.unavailable }}</p>
          <p class="text-xs text-muted-foreground">ไม่เปิดให้จอง</p>
        </CardContent>
      </Card>
    </div>

    <RoomBrowser />
  </div>
</template>
