<script setup lang="ts">
import { MegaphoneIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { announcements } from '@/fixtures'
</script>

<template>
  <div class="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
    <div class="space-y-1">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <MegaphoneIcon class="size-6 text-primary" aria-hidden="true" /> ประกาศ
      </h1>
      <p class="text-sm text-muted-foreground">ข่าวสารและประกาศสำคัญจากกองบริการหอพักนักศึกษา</p>
    </div>

    <Card v-for="a in announcements" :key="a.id">
      <CardHeader>
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{{ a.tag }}</Badge>
          <span class="text-xs text-muted-foreground">{{ a.date }}</span>
        </div>
        <CardTitle class="text-base leading-snug">{{ a.title }}</CardTitle>
        <CardDescription class="leading-relaxed">{{ a.detail }}</CardDescription>
      </CardHeader>
      <CardContent class="hidden" />
    </Card>
  </div>
</template>
