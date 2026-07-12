<script setup lang="ts">
import { ConstructionIcon } from '@lucide/vue'
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
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-2xl font-bold">{{ title }}</h1>
      <Badge variant="outline"><ConstructionIcon aria-hidden="true" /> อยู่ในแผนเฟส {{ phase }}</Badge>
    </div>
    <Card>
      <CardHeader>
        <CardTitle class="text-base">ขอบเขตของจอนี้ตามรายละเอียดงานล่าสุด</CardTitle>
        <CardDescription>{{ description }}</CardDescription>
      </CardHeader>
      <CardContent v-if="features?.length">
        <ul class="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li v-for="f in features" :key="f">{{ f }}</li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
