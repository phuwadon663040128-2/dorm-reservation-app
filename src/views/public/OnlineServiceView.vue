<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CheckIcon, ClockIcon, InfoIcon, MailIcon, MapPinIcon, PhoneIcon, UsersIcon } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import PageHeader from '@/components/domain/PageHeader.vue'
import { onlineServices, serviceById } from '@/fixtures/services'

// หน้าเดียวรองรับทุกบริการออนไลน์ผ่านพารามิเตอร์ :serviceId — เนื้อหามาจาก fixtures/services
const route = useRoute()
const service = computed(() => serviceById(String(route.params.serviceId)) ?? onlineServices[0]!)
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-8 px-3 py-8 sm:px-5">
    <!-- แถบสลับบริการ -->
    <nav class="flex gap-1.5 overflow-x-auto pb-1" aria-label="บริการออนไลน์ทั้งหมด">
      <RouterLink
        v-for="s in onlineServices"
        :key="s.id"
        :to="`/services/${s.id}`"
        class="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
        :class="s.id === service.id ? 'border-primary bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted'"
      >
        <component :is="s.icon" class="size-3.5" aria-hidden="true" />
        {{ s.title }}
      </RouterLink>
    </nav>

    <div class="flex items-start gap-4">
      <div class="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
        <component :is="service.icon" class="size-7" aria-hidden="true" />
      </div>
      <PageHeader
        kicker="บริการออนไลน์ (i-SERVICE)"
        :title="service.title + (service.titleEn ? ` — ${service.titleEn}` : '')"
        :subtitle="service.subtitle"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <!-- ขั้นตอนการใช้บริการ -->
      <Card class="rounded-3xl">
        <CardContent class="space-y-5 p-6 sm:p-7">
          <h2 class="text-lg font-bold">ขั้นตอนการใช้บริการ</h2>
          <ol class="space-y-0">
            <li v-for="(s, i) in service.steps" :key="s.title" class="relative flex gap-4 pb-6 last:pb-0">
              <span
                v-if="i < service.steps.length - 1"
                class="absolute left-[1.1rem] top-10 h-[calc(100%-2rem)] w-px bg-border"
                aria-hidden="true"
              />
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {{ i + 1 }}
              </span>
              <div class="min-w-0 space-y-0.5 pt-1">
                <h3 class="font-semibold leading-snug">{{ s.title }}</h3>
                <p class="text-sm leading-relaxed text-muted-foreground">{{ s.detail }}</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <!-- ข้อมูลประกอบด้านขวา -->
      <div class="space-y-4">
        <Card class="rounded-3xl">
          <CardContent class="space-y-2.5 p-5">
            <h2 class="flex items-center gap-2 text-sm font-bold">
              <UsersIcon class="size-4 text-primary" aria-hidden="true" /> ผู้มีสิทธิใช้บริการ
            </h2>
            <ul class="space-y-1.5 text-sm text-muted-foreground">
              <li v-for="a in service.audience" :key="a" class="flex gap-2">
                <CheckIcon class="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> {{ a }}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card class="rounded-3xl">
          <CardContent class="space-y-2.5 p-5">
            <h2 class="flex items-center gap-2 text-sm font-bold">
              <CheckIcon class="size-4 text-primary" aria-hidden="true" /> สิ่งที่ต้องเตรียม
            </h2>
            <ul class="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              <li v-for="p in service.prepare" :key="p">{{ p }}</li>
            </ul>
          </CardContent>
        </Card>

        <Card class="rounded-3xl">
          <CardContent class="space-y-2.5 p-5">
            <h2 class="flex items-center gap-2 text-sm font-bold">
              <MapPinIcon class="size-4 text-primary" aria-hidden="true" /> ช่องทางและเวลาให้บริการ
            </h2>
            <div class="space-y-2 text-sm text-muted-foreground">
              <p class="leading-relaxed">{{ service.channel.place }}</p>
              <p class="flex items-start gap-2">
                <ClockIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {{ service.channel.hours }}
              </p>
              <p class="flex items-center gap-2">
                <PhoneIcon class="size-3.5 shrink-0" aria-hidden="true" />
                <a :href="`tel:${service.channel.phone.replaceAll('-', '')}`" class="hover:text-foreground hover:underline">{{ service.channel.phone }}</a>
              </p>
              <p v-if="service.channel.email" class="flex items-center gap-2">
                <MailIcon class="size-3.5 shrink-0" aria-hidden="true" />
                <a :href="`mailto:${service.channel.email}`" class="hover:text-foreground hover:underline">{{ service.channel.email }}</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card class="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardContent class="space-y-2.5 p-5">
            <h2 class="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
              <InfoIcon class="size-4" aria-hidden="true" /> หมายเหตุ
            </h2>
            <ul class="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li v-for="n in service.notes" :key="n">• {{ n }}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
