<script setup lang="ts">
import type { Component } from 'vue'

// หัวเพจมาตรฐานฝั่งเจ้าหน้าที่ — ไอคอน + ชื่อจอ + คำอธิบาย และช่องปุ่ม action ขวามือ
// ใช้ร่วมกันทุกจอเพื่อให้ตำแหน่ง/น้ำหนักตัวอักษรเหมือนกันทั้งระบบ
defineProps<{
  title: string
  description?: string
  icon?: Component
}>()
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
    <div class="flex min-w-0 items-start gap-3">
      <div
        v-if="icon"
        class="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex"
        aria-hidden="true"
      >
        <component :is="icon" class="size-5" />
      </div>
      <div class="min-w-0 space-y-1">
        <h1 class="text-xl font-bold tracking-tight sm:text-2xl">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {{ description }}
        </p>
        <slot name="meta" />
      </div>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
