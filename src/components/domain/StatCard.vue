<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRightIcon } from '@lucide/vue'

// การ์ดตัวเลขบน Dashboard — ตัวเลขใหญ่สีเข้มเสมอ ส่วนโทนสีบอกสถานะผ่านแถบไอคอน
// warn = มีงานค้างต้องตรวจ, success = สถานะดี, default = ตัวเลขรายงานทั่วไป
const props = defineProps<{
  label: string
  value: number | string
  icon: Component
  to?: string
  tone?: 'default' | 'warn' | 'success'
  hint?: string
}>()

const chipClass = computed(() => {
  if (props.tone === 'warn') return 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'
  if (props.tone === 'success') return 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
  return 'bg-primary/10 text-primary'
})
</script>

<template>
  <component
    :is="to ? RouterLink : 'div'"
    :to="to"
    class="group flex h-full flex-col justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors"
    :class="[
      to ? 'hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring' : '',
      tone === 'warn' ? 'border-amber-400/50 dark:border-amber-400/30' : '',
    ]"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex size-9 items-center justify-center rounded-lg" :class="chipClass" aria-hidden="true">
        <component :is="icon" class="size-4.5" />
      </div>
      <ChevronRightIcon
        v-if="to"
        class="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </div>
    <div class="space-y-0.5">
      <p class="text-3xl font-bold leading-none tracking-tight tabular-nums">{{ value }}</p>
      <p class="pt-1 text-sm font-medium text-foreground/80">{{ label }}</p>
      <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
    </div>
  </component>
</template>
