<script setup lang="ts">
import { watch } from 'vue'
import { TimerIcon } from '@lucide/vue'
import { useCountdown } from '@/composables/useCountdown'

const props = defineProps<{
  expiresAt?: string
  /** เช่น "รูมเมทต้องยืนยันภายใน" หรือ "ชำระเงินภายใน" */
  label: string
}>()

const emit = defineEmits<{ (e: 'expired'): void }>()

const { display, expired } = useCountdown(() => props.expiresAt)

watch(expired, (v) => {
  if (v) emit('expired')
}, { immediate: true })
</script>

<template>
  <!-- aria-live=polite: ประกาศการเปลี่ยนแปลงโดยไม่รัวเกินไป (doc 17 a11y) -->
  <div
    class="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
    :class="expired ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'"
    role="timer"
    aria-live="polite"
  >
    <TimerIcon class="size-4 shrink-0" aria-hidden="true" />
    <span v-if="!expired">{{ label }} <strong class="tabular-nums">{{ display }}</strong></span>
    <span v-else>หมดเวลา — ห้องถูกปล่อยคืนอัตโนมัติ</span>
  </div>
</template>
