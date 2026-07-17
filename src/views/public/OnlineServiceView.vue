<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  CheckIcon,
  ClipboardListIcon,
  ClockIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
} from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import { onlineServices, serviceById } from '@/fixtures/services'

// หน้าเดียวรองรับทุกบริการออนไลน์ผ่านพารามิเตอร์ :serviceId — เนื้อหามาจาก fixtures/services
const route = useRoute()
const service = computed(() => serviceById(String(route.params.serviceId)) ?? onlineServices[0]!)
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-6 px-3 py-8 sm:px-5">
    <RouterLink
      to="/services"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      <ArrowLeftIcon class="size-4" aria-hidden="true" /> บริการออนไลน์ทั้งหมด
    </RouterLink>

    <!-- Hero ของบริการ: ไอคอนใหญ่ + ชื่อ + ชิปข้อมูลด่วน (เวลา/สถานที่/โทร) -->
    <section class="relative overflow-hidden rounded-3xl border bg-linear-to-br from-primary/10 via-background to-background p-6 sm:p-8">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <component :is="service.icon" class="size-8" aria-hidden="true" />
        </div>
        <div class="min-w-0 space-y-2">
          <p class="text-sm font-semibold uppercase tracking-wide text-primary">บริการออนไลน์ (i-SERVICE)</p>
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
            {{ service.title }}
            <span v-if="service.titleEn" class="mt-0.5 block text-base font-semibold text-muted-foreground">{{ service.titleEn }}</span>
          </h1>
          <p class="max-w-3xl leading-relaxed text-muted-foreground">{{ service.subtitle }}</p>
          <div class="flex flex-wrap gap-2 pt-1.5 text-xs font-medium">
            <span class="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5">
              <ClockIcon class="size-3.5 text-primary" aria-hidden="true" /> {{ service.channel.hours }}
            </span>
            <span class="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-card px-3 py-1.5">
              <MapPinIcon class="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span class="truncate">{{ service.channel.place }}</span>
            </span>
            <a
              :href="`tel:${service.channel.phone.replaceAll('-', '')}`"
              class="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 transition-colors hover:border-primary hover:text-primary"
            >
              <PhoneIcon class="size-3.5 text-primary" aria-hidden="true" /> {{ service.channel.phone }}
            </a>
            <a
              v-if="service.channel.email"
              :href="`mailto:${service.channel.email}`"
              class="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 transition-colors hover:border-primary hover:text-primary"
            >
              <MailIcon class="size-3.5 text-primary" aria-hidden="true" /> {{ service.channel.email }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <!-- สลับบริการ (ซ้าย, sticky บนจอใหญ่) -->
      <nav class="lg:sticky lg:top-24 lg:self-start" aria-label="บริการออนไลน์ทั้งหมด">
        <p class="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">บริการทั้งหมด</p>
        <div class="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          <RouterLink
            v-for="s in onlineServices"
            :key="s.id"
            :to="`/services/${s.id}`"
            class="flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors lg:shrink"
            :class="s.id === service.id
              ? 'border-primary/50 bg-primary/10 font-semibold text-primary'
              : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'"
          >
            <component :is="s.icon" class="size-4 shrink-0" aria-hidden="true" />
            <span class="whitespace-nowrap lg:whitespace-normal lg:leading-snug">{{ s.title }}</span>
          </RouterLink>
        </div>
      </nav>

      <!-- เนื้อหาหลัก -->
      <div class="space-y-6">
        <!-- ขั้นตอนการใช้บริการ -->
        <Card class="rounded-3xl py-0">
          <CardContent class="space-y-5 p-6 sm:p-7">
            <h2 class="flex items-center gap-2 text-lg font-bold">
              <ClipboardListIcon class="size-5 text-primary" aria-hidden="true" /> ขั้นตอนการใช้บริการ
            </h2>
            <ol class="space-y-0">
              <li v-for="(s, i) in service.steps" :key="s.title" class="relative flex gap-4 pb-6 last:pb-0">
                <span
                  v-if="i < service.steps.length - 1"
                  class="absolute left-[1.1rem] top-10 h-[calc(100%-2rem)] w-px bg-linear-to-b from-primary/40 to-border"
                  aria-hidden="true"
                />
                <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25">
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

        <!-- ผู้มีสิทธิ + สิ่งที่ต้องเตรียม เคียงกัน -->
        <div class="grid gap-6 sm:grid-cols-2">
          <Card class="rounded-3xl py-0">
            <CardContent class="space-y-3 p-6">
              <h2 class="flex items-center gap-2 font-bold">
                <UsersIcon class="size-4.5 text-primary" aria-hidden="true" /> ผู้มีสิทธิใช้บริการ
              </h2>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li v-for="a in service.audience" :key="a" class="flex gap-2 leading-relaxed">
                  <CheckIcon class="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> {{ a }}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card class="rounded-3xl py-0">
            <CardContent class="space-y-3 p-6">
              <h2 class="flex items-center gap-2 font-bold">
                <ClipboardListIcon class="size-4.5 text-primary" aria-hidden="true" /> สิ่งที่ต้องเตรียม
              </h2>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li v-for="(p, i) in service.prepare" :key="p" class="flex gap-2.5 leading-relaxed">
                  <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                    {{ i + 1 }}
                  </span>
                  {{ p }}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <!-- หมายเหตุ/เงื่อนไข -->
        <Card class="rounded-3xl border-amber-500/30 bg-amber-500/5 py-0">
          <CardContent class="space-y-3 p-6">
            <h2 class="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
              <InfoIcon class="size-4.5" aria-hidden="true" /> หมายเหตุและเงื่อนไข
            </h2>
            <ul class="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li v-for="n in service.notes" :key="n" class="flex gap-2">
                <span class="mt-2 size-1 shrink-0 rounded-full bg-amber-500" aria-hidden="true" /> {{ n }}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
