<script setup lang="ts">
import { computed } from 'vue'

// แถบสัดส่วนสถานะห้องทั้งระบบ — สีตามความหมายสถานะชุดเดียวกับ badge (เขียว/เหลือง/ฟ้า/เทา)
// ชุดสีผ่าน dataviz validator ทั้งสองธีม; segment เว้นช่อง 2px และมี legend label+จำนวนเสมอ
// (สีเหลืองธีมสว่าง contrast ต่ำกว่า 3:1 — ชดเชยด้วย label ใน legend ตามข้อกำหนด ไม่พึ่งสีอย่างเดียว)
const props = defineProps<{
  summary: { total: number; available: number; temporarilyHeld: number; reserved: number; unavailable: number }
}>()

const segments = computed(() => [
  { key: 'available', label: 'ว่าง', value: props.summary.available, cls: 'bg-emerald-600 dark:bg-emerald-400' },
  { key: 'held', label: 'ถูกจองชั่วคราว', value: props.summary.temporarilyHeld, cls: 'bg-amber-500 dark:bg-amber-400' },
  { key: 'reserved', label: 'จองแล้ว', value: props.summary.reserved, cls: 'bg-sky-600 dark:bg-sky-400' },
  { key: 'unavailable', label: 'ไม่เปิดให้จอง', value: props.summary.unavailable, cls: 'bg-stone-500 dark:bg-gray-500' },
])

function pct(value: number) {
  if (!props.summary.total) return '0%'
  return `${((value / props.summary.total) * 100).toFixed(1)}%`
}
</script>

<template>
  <div class="space-y-3">
    <div
      class="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
      role="img"
      :aria-label="`สัดส่วนสถานะห้องจากทั้งหมด ${summary.total.toLocaleString('th-TH')} ห้อง`"
    >
      <div
        v-for="s in segments.filter(seg => seg.value > 0)"
        :key="s.key"
        class="min-w-1 rounded-[2px]"
        :class="s.cls"
        :style="{ flexGrow: s.value }"
        :title="`${s.label} ${s.value.toLocaleString('th-TH')} ห้อง (${pct(s.value)})`"
      />
    </div>
    <dl class="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
      <div v-for="s in segments" :key="s.key" class="flex items-center gap-2" :title="pct(s.value)">
        <span class="size-2.5 shrink-0 rounded-[3px]" :class="s.cls" aria-hidden="true" />
        <dt class="truncate text-xs text-muted-foreground">{{ s.label }}</dt>
        <dd class="ml-auto text-sm font-semibold tabular-nums">{{ s.value.toLocaleString('th-TH') }}</dd>
      </div>
    </dl>
  </div>
</template>
