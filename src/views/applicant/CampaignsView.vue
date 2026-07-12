<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDormStore } from '@/stores/dorm'

const dorm = useDormStore()

const statusLabel = { open: 'เปิดรับสมัคร', upcoming: 'เปิดเร็ว ๆ นี้', closed: 'ปิดรับแล้ว' } as const
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">รอบรับสมัคร</h1>
    <div class="grid gap-4 md:grid-cols-2">
      <Card v-for="c in dorm.campaigns" :key="c.id">
        <CardHeader>
          <div class="flex items-start justify-between gap-2">
            <CardTitle class="text-base">{{ c.name }}</CardTitle>
            <Badge :variant="c.status === 'open' ? 'default' : 'outline'">{{ statusLabel[c.status] }}</Badge>
          </div>
          <CardDescription>{{ c.openDate }} – {{ c.closeDate }} · สัญญา{{ c.contractPeriod }}</CardDescription>
        </CardHeader>
        <CardContent class="flex items-center justify-between gap-3">
          <p class="text-sm text-muted-foreground">
            {{ c.kind === 'renewal' ? 'สำหรับผู้พักปัจจุบันต่อสัญญา' : 'สำหรับผู้สมัครใหม่และผู้พักเดิม' }}
          </p>
          <Button as-child size="sm" variant="outline">
            <RouterLink :to="`/campaigns/${c.id}`">รายละเอียด</RouterLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
