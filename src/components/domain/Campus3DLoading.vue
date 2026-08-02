<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

withDefaults(defineProps<{
  overlay?: boolean
  label?: string
}>(), {
  overlay: false,
  label: 'กำลังเตรียมผังอาคาร 3 มิติ',
})
</script>

<template>
  <div
    data-testid="campus-3d-loading"
    :class="[
      'overflow-hidden rounded-2xl',
      overlay ? 'absolute inset-0 z-40' : 'relative h-[58svh] min-h-105 border sm:h-[62vh]',
      'bg-card',
    ]"
    role="status"
    aria-live="polite"
    :aria-label="label"
  >
    <div class="absolute inset-0 bg-muted/20" aria-hidden="true">
      <div class="absolute inset-x-2 top-2 flex items-start justify-end gap-2 sm:inset-x-3 sm:top-3 sm:justify-between">
        <Skeleton class="hidden h-10 w-52 rounded-xl sm:block" />

        <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Skeleton class="h-9 min-w-0 rounded-md sm:w-28" />
          <Skeleton class="h-9 min-w-0 rounded-md sm:w-28" />
          <Skeleton class="col-span-2 ms-auto size-15 rounded-2xl sm:col-auto" />
        </div>
      </div>

      <div class="absolute inset-x-5 top-[31%] mx-auto flex max-w-3xl items-end justify-center gap-2 sm:inset-x-16 sm:gap-4">
        <Skeleton class="h-24 w-[28%] rounded-lg sm:h-40" />
        <Skeleton class="h-36 w-[38%] rounded-lg sm:h-56" />
        <Skeleton class="h-28 w-[30%] rounded-lg sm:h-44" />
      </div>

      <div class="absolute inset-x-5 top-[67%] mx-auto grid max-w-xl grid-cols-3 gap-2 sm:top-[72%]">
        <Skeleton class="h-7 rounded-full" />
        <Skeleton class="h-7 rounded-full" />
        <Skeleton class="h-7 rounded-full" />
      </div>

      <Skeleton class="absolute bottom-2 left-2 h-8 w-36 rounded-xl sm:hidden" />
      <Skeleton class="absolute bottom-3 left-3 hidden h-16 w-40 rounded-xl sm:block" />
      <Skeleton class="absolute bottom-2 right-2 h-7 w-36 rounded-full sm:bottom-3 sm:right-3" />
    </div>

    <span class="sr-only">กรุณารอสักครู่</span>
  </div>
</template>
