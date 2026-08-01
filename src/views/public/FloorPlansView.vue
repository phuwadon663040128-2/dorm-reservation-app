<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRightIcon, ExternalLinkIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PageHeader from '@/components/domain/PageHeader.vue'

// แกลเลอรีแบบแปลนจริงครบทุกตึก/ชั้น — ไฟล์ PNG แปลงจากแบบแปลนต้นฉบับใน public/plans
const catalogs = [
  {
    id: '8lang',
    name: 'วรเรสซิเดนซ์ (หอพัก 8 หลัง)',
    buildings: ['1', '2', '3', '4', '5', '6', '7', '8'],
    floors: [1, 2, 3, 4],
    buildingLabel: (b: string) => `อาคาร ${b}`,
    planUrl: (b: string, f: number) => `/plans/8lang/${b}${String(f).padStart(2, '0')}.png`,
  },
  {
    id: 'inter',
    name: 'หอพักวรอินเตอร์ (4 หลัง)',
    buildings: ['A', 'B', 'C', 'D'],
    floors: [1, 2, 3, 4, 5, 6, 7],
    buildingLabel: (b: string) => `อาคาร ${b}`,
    planUrl: (b: string, f: number) => `/plans/inter/${b}${f}.png`,
  },
]

const selectedCatalogId = ref(catalogs[0]!.id)
const selectedBuilding = ref(catalogs[0]!.buildings[0]!)
const selectedFloor = ref(catalogs[0]!.floors[0]!)

const catalog = computed(() => catalogs.find(c => c.id === selectedCatalogId.value) ?? catalogs[0]!)
const planUrl = computed(() => catalog.value.planUrl(selectedBuilding.value, selectedFloor.value))

function pickCatalog(id: string) {
  selectedCatalogId.value = id
  selectedBuilding.value = catalog.value.buildings[0]!
  selectedFloor.value = catalog.value.floors[0]!
}
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-6 px-3 py-8 sm:px-5">
    <PageHeader
      kicker="ข้อมูลเกี่ยวกับหอพักนักศึกษา"
      title="แผนผังหอพักนักศึกษา"
      subtitle="แบบแปลนต้นฉบับของทุกอาคารทุกชั้น ใช้ดูตำแหน่งห้อง ประเภทห้อง และทิศทางภายในอาคารประกอบการเลือกห้อง"
    />

    <!-- ตัวเลือก หอ → อาคาร → ชั้น -->
    <Card class="rounded-3xl">
      <CardContent class="space-y-4 p-5">
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="เลือกหอพัก">
          <button
            v-for="c in catalogs"
            :key="c.id"
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm transition-colors"
            :class="selectedCatalogId === c.id ? 'border-primary bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted'"
            @click="pickCatalog(c.id)"
          >
            {{ c.name }}
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="เลือกอาคาร">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">อาคาร</span>
            <button
              v-for="b in catalog.buildings"
              :key="b"
              type="button"
              class="min-w-9 rounded-lg border px-2.5 py-1.5 text-sm tabular-nums transition-colors"
              :class="selectedBuilding === b ? 'border-primary bg-primary/10 font-bold text-primary' : 'hover:bg-muted'"
              @click="selectedBuilding = b"
            >
              {{ b }}
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="เลือกชั้น">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ชั้น</span>
            <button
              v-for="f in catalog.floors"
              :key="f"
              type="button"
              class="min-w-9 rounded-lg border px-2.5 py-1.5 text-sm tabular-nums transition-colors"
              :class="selectedFloor === f ? 'border-primary bg-primary/10 font-bold text-primary' : 'hover:bg-muted'"
              @click="selectedFloor = f"
            >
              {{ f }}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- ภาพแปลน -->
    <Card class="overflow-hidden rounded-3xl py-0">
      <div class="flex items-center justify-between gap-3 border-b bg-muted/40 px-5 py-3">
        <p class="text-sm font-semibold">
          {{ catalog.buildingLabel(selectedBuilding) }} · ชั้น {{ selectedFloor }}
          <span class="ml-2 font-normal text-muted-foreground">{{ catalog.name }}</span>
        </p>
        <Button as-child size="sm" variant="outline">
          <a :href="planUrl" target="_blank" rel="noopener">
            <ExternalLinkIcon aria-hidden="true" /> เปิดภาพเต็ม
          </a>
        </Button>
      </div>
      <div class="bg-white p-3 dark:bg-white/95">
        <img
          :src="planUrl"
          :alt="`แบบแปลน ${catalog.buildingLabel(selectedBuilding)} ชั้น ${selectedFloor} — ${catalog.name}`"
          width="1684"
          height="1191"
          class="mx-auto max-h-[70vh] w-auto max-w-full"
          loading="lazy"
          decoding="async"
        />
      </div>
    </Card>

    <Card class="rounded-3xl border-primary/25 bg-primary/5">
      <CardContent class="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <p class="text-sm text-muted-foreground">
          ต้องการเห็นสถานะว่าง/จองของแต่ละห้องบนแผนผัง? ระบบจองแสดงสถานะสดรายห้องพร้อมตำแหน่งตามแปลนจริง
        </p>
        <Button as-child size="sm" class="shrink-0 rounded-full">
          <RouterLink to="/rooms">ดูแผนผังห้องว่าง <ArrowRightIcon aria-hidden="true" /></RouterLink>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
