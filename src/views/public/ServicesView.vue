<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRightIcon, ClockIcon, MailIcon, PhoneIcon } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import PageHeader from '@/components/domain/PageHeader.vue'
import { onlineServices } from '@/fixtures/services'
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-8 px-3 py-8 sm:px-5">
    <PageHeader
      kicker="บริการออนไลน์ (i-SERVICE)"
      title="บริการออนไลน์ของกองบริการหอพักนักศึกษา"
      subtitle="รวมทุกบริการสำหรับผู้พักอาศัยหอพักในกำกับ — เลือกบริการเพื่อดูขั้นตอน เอกสารที่ต้องเตรียม และช่องทางติดต่อ"
    />

    <!-- การ์ดบริการ: ไอคอนโทนสีหลัก + ชื่อ + คำอธิบายย่อ + เวลาให้บริการ -->
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="s in onlineServices"
        :key="s.id"
        :to="`/services/${s.id}`"
        class="group block h-full"
      >
        <Card class="h-full rounded-3xl py-0 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
          <CardContent class="flex h-full flex-col gap-4 p-6">
            <div class="flex items-start justify-between gap-3">
              <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <component :is="s.icon" class="size-6" aria-hidden="true" />
              </div>
              <span
                class="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:border-primary group-hover:text-primary"
                aria-hidden="true"
              >
                <ArrowRightIcon class="size-4" />
              </span>
            </div>
            <div class="flex-1 space-y-1.5">
              <h2 class="font-bold leading-snug">{{ s.title }}</h2>
              <p v-if="s.titleEn" class="text-xs font-medium text-primary">{{ s.titleEn }}</p>
              <p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{{ s.subtitle }}</p>
            </div>
            <p class="flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
              <ClockIcon class="size-3.5 shrink-0" aria-hidden="true" /> {{ s.channel.hours }}
            </p>
          </CardContent>
        </Card>
      </RouterLink>

      <!-- การ์ดติดต่อ ปิดท้าย grid ให้ครบแถว -->
      <Card class="h-full rounded-3xl border-dashed py-0">
        <CardContent class="flex h-full flex-col justify-center gap-3 p-6">
          <h2 class="font-bold">ไม่พบบริการที่ต้องการ?</h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            ติดต่อกองบริการหอพักนักศึกษาได้โดยตรง เจ้าหน้าที่พร้อมให้คำแนะนำทุกเรื่องเกี่ยวกับการพักอาศัย
          </p>
          <div class="space-y-1.5 text-sm">
            <a href="tel:043204303" class="flex items-center gap-2 font-medium hover:text-primary">
              <PhoneIcon class="size-4 text-primary" aria-hidden="true" /> 043-204-303
            </a>
            <a href="mailto:dormitory@kku.ac.th" class="flex items-center gap-2 font-medium hover:text-primary">
              <MailIcon class="size-4 text-primary" aria-hidden="true" /> dormitory@kku.ac.th
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
