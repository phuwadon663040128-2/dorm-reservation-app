<script setup lang="ts">
// หัวหน้าเพจสาธารณะ — kicker ตัวเล็กสีหลัก + ชื่อหน้า + คำอธิบาย ใช้ร่วมกันทุกหน้าให้ภาษาภาพเดียวกัน
defineProps<{
  kicker: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="space-y-1.5">
    <p class="text-sm font-semibold uppercase tracking-wide text-primary">{{ kicker }}</p>
    <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ title }}</h1>
    <p v-if="subtitle" class="max-w-3xl leading-relaxed text-muted-foreground">{{ subtitle }}</p>
  </header>
</template>
