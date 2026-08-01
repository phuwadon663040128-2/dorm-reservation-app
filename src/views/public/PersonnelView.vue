<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLinkIcon, MailIcon, NetworkIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PageHeader from '@/components/domain/PageHeader.vue'
import { personnel, personnelSections } from '@/fixtures/personnel'

// โครงสร้างบุคลากร — เรียงตามที่กำหนด: ภาพโครงสร้างหน่วยงานก่อน แล้วตามด้วยบุคลากรเรียงตามตำแหน่ง
const structureChart = '/personnel-images/structure-chart.webp'
const personnelPhoto = (photo: string) => photo.replace(/\.(?:jpe?g|png)$/i, '.webp')

const groups = computed(() =>
  personnelSections.map(section => ({
    section,
    people: personnel.filter(p => p.section === section),
  })),
)
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-10 px-3 py-8 sm:px-5">
    <PageHeader
      kicker="กองบริการหอพักนักศึกษา"
      title="โครงสร้างองค์กรและบุคลากร"
      subtitle="โครงสร้างการบริหารกองบริการหอพักนักศึกษา มหาวิทยาลัยขอนแก่น และบุคลากรผู้ดูแลหอพักแต่ละด้าน"
    />

    <!-- 1) ภาพโครงสร้างหน่วยงาน -->
    <section class="space-y-4">
      <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight">
        <NetworkIcon class="size-5 text-primary" aria-hidden="true" /> โครงสร้างหน่วยงาน
      </h2>
      <Card class="overflow-hidden rounded-3xl py-0">
        <div class="flex items-center justify-end border-b bg-muted/40 px-5 py-2.5">
          <Button as-child size="sm" variant="outline">
            <a :href="structureChart" target="_blank" rel="noopener">
              <ExternalLinkIcon aria-hidden="true" /> เปิดภาพเต็ม
            </a>
          </Button>
        </div>
        <div class="bg-white p-4 dark:bg-white/95">
        <img
          :src="structureChart"
          width="1400"
          height="788"
            alt="แผนภาพโครงสร้างกองบริการหอพักนักศึกษา มหาวิทยาลัยขอนแก่น"
            class="mx-auto w-full max-w-4xl"
            loading="lazy"
          />
        </div>
      </Card>
    </section>

    <!-- 2) บุคลากรเรียงตามตำแหน่ง/กลุ่มงาน -->
    <section v-for="g in groups" :key="g.section" class="space-y-4">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold tracking-tight">{{ g.section }}</h2>
        <span class="rounded-full bg-muted px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">{{ g.people.length }} คน</span>
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Card
          v-for="p in g.people"
          :key="p.id"
          class="overflow-hidden rounded-3xl py-0 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <img
            :src="personnelPhoto(p.photo)"
            :alt="`รูป${p.name}`"
            width="640"
            height="640"
            class="aspect-square w-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
          <CardContent class="space-y-0.5 p-3.5">
            <p class="text-sm font-bold leading-snug">{{ p.name }}</p>
            <p class="text-xs leading-relaxed text-primary">{{ p.position }}</p>
            <a
              v-if="p.email"
              :href="`mailto:${p.email}`"
              class="inline-flex max-w-full items-center gap-1 pt-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
            >
              <MailIcon class="size-3 shrink-0" aria-hidden="true" />
              <span class="truncate">{{ p.email }}</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
