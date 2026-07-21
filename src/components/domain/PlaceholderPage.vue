<script setup lang="ts">
import { CircleCheckIcon, ConstructionIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// จอที่ยังไม่ถึงเฟสพัฒนา — ระบุเฟสตาม docs/frontend-redesign-plan.md
defineProps<{
  title: string
  description: string
  phase: string
  features?: string[]
}>()
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <div class="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex" aria-hidden="true">
          <ConstructionIcon class="size-5" />
        </div>
        <div class="min-w-0 space-y-1">
          <h1 class="text-xl font-bold tracking-tight sm:text-2xl">{{ title }}</h1>
          <Badge variant="warning"><ConstructionIcon aria-hidden="true" /> อยู่ในแผนเฟส {{ phase }}</Badge>
        </div>
      </div>
    </header>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">ขอบเขตของจอนี้ตามรายละเอียดงานล่าสุด</CardTitle>
        <CardDescription class="leading-relaxed">{{ description }}</CardDescription>
      </CardHeader>
      <CardContent v-if="features?.length">
        <ul class="space-y-2.5 text-sm">
          <li v-for="f in features" :key="f" class="flex items-start gap-2.5">
            <CircleCheckIcon class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span class="leading-relaxed">{{ f }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
