<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRightIcon, BuildingIcon, ClockIcon, MailIcon, MapPinIcon, WrenchIcon } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import PageHeader from '@/components/domain/PageHeader.vue'
import { dormOfficeContact, personnel } from '@/fixtures/personnel'

// หน่วยบริการหอพัก — หัวหน้าหน่วยจากข้อมูลบุคลากรจริงของกองบริการหอพักนักศึกษา
const unitHeads = computed(() => personnel.filter(p => p.section === 'หัวหน้าหน่วยบริการหอพัก'))

const duties = [
  'รับแจ้งเข้า–ออกหอพัก ตรวจสอบสิทธิผู้พัก และดูแลการรับกุญแจ',
  'รับเรื่องแจ้งซ่อมและประสานหน่วยซ่อมบำรุงเข้าดำเนินการ',
  'จุดรับพัสดุไปรษณีย์และเอกสารของผู้พักประจำอาคาร',
  'ดูแลความเรียบร้อย ความปลอดภัย และการอยู่ร่วมกันภายในอาคาร',
  'ประสานงานเรื่องค่าธรรมเนียม สัญญา และเอกสารรับรองการเข้าพัก',
]
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-8 px-3 py-8 sm:px-5">
    <PageHeader
      kicker="ข้อมูลเกี่ยวกับหอพักนักศึกษา"
      title="หน่วยบริการหอพัก"
      subtitle="หน่วยบริการประจำพื้นที่หอพักแต่ละกลุ่มอาคาร เป็นจุดติดต่อแรกของผู้พักในทุกเรื่อง ตั้งแต่รับกุญแจ แจ้งซ่อม ไปจนถึงเอกสารรับรองการเข้าพัก"
    />

    <div class="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <!-- หน้าที่ของหน่วยบริการ + เวลาทำการ -->
      <div class="space-y-4">
        <Card class="rounded-3xl">
          <CardContent class="space-y-3 p-6">
            <h2 class="flex items-center gap-2 text-lg font-bold">
              <WrenchIcon class="size-5 text-primary" aria-hidden="true" /> หน่วยบริการดูแลเรื่องใดบ้าง
            </h2>
            <ul class="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li v-for="d in duties" :key="d" class="flex gap-2">
                <span class="mt-2 size-1 shrink-0 rounded-full bg-primary/60" aria-hidden="true" /> {{ d }}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card class="rounded-3xl">
          <CardContent class="space-y-2.5 p-6 text-sm text-muted-foreground">
            <h2 class="flex items-center gap-2 text-base font-bold text-foreground">
              <MapPinIcon class="size-4 text-primary" aria-hidden="true" /> {{ dormOfficeContact.organization }}
            </h2>
            <p class="leading-relaxed">{{ dormOfficeContact.address }}</p>
            <p class="flex items-start gap-2">
              <ClockIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {{ dormOfficeContact.officeHours }}
            </p>
            <RouterLink to="/contact" class="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              ช่องทางติดต่อทั้งหมด <ArrowRightIcon class="size-3.5" aria-hidden="true" />
            </RouterLink>
          </CardContent>
        </Card>
      </div>

      <!-- หัวหน้าหน่วยบริการ -->
      <section class="space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-bold">
          <BuildingIcon class="size-5 text-primary" aria-hidden="true" /> หัวหน้าหน่วยบริการหอพัก
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card v-for="p in unitHeads" :key="p.id" class="overflow-hidden rounded-3xl py-0 transition-colors hover:border-primary/40">
            <img :src="p.photo" :alt="`รูป${p.name}`" class="aspect-square w-full object-cover object-top" loading="lazy" />
            <CardContent class="space-y-0.5 p-4">
              <p class="font-bold leading-snug">{{ p.name }}</p>
              <p class="text-sm text-primary">{{ p.position }}</p>
              <a
                v-if="p.email"
                :href="`mailto:${p.email}`"
                class="inline-flex items-center gap-1.5 pt-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                <MailIcon class="size-3" aria-hidden="true" /> {{ p.email }}
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  </div>
</template>
