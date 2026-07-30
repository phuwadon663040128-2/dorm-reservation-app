<script setup lang="ts">
import { BuildingIcon, DropletIcon, InfoIcon, PhoneIcon, ShieldIcon, ZapIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import PageHeader from '@/components/domain/PageHeader.vue'
import { feeAcademicYear, feeGroups } from '@/fixtures/fees'
import type { FeeRoomRow } from '@/fixtures/fees'

// อัตราค่าธรรมเนียม — ข้อมูลจริงจากประกาศ ปีการศึกษา 2568 (reference/data-packs/kku_dorm_fee_assets)
function baht(n: number | null | undefined) {
  return typeof n === 'number' ? n.toLocaleString('th-TH') : '—'
}

/** โครงตารางปรับตามรูปแบบการเก็บของหอ: รายภาคการศึกษา หรือเหมาจ่ายรายปี */
function isPerSemester(rooms: FeeRoomRow[]) {
  return rooms.some(r => typeof r.regularSemester === 'number')
}
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-8 px-3 py-8 sm:px-5">
    <PageHeader
      kicker="ข้อมูลเกี่ยวกับหอพักนักศึกษา"
      title="อัตราค่าธรรมเนียมหอพักในกำกับ"
      :subtitle="`อัตราค่าธรรมเนียมตามประกาศ ปีการศึกษา ${feeAcademicYear} — ยอดเรียกเก็บจริงยืนยันในแบบฟอร์มชำระเงินทางการของแต่ละรอบ`"
    />

    <section v-for="g in feeGroups" :key="g.id" class="space-y-4">
      <!-- หัวกลุ่มหอ -->
      <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div class="space-y-0.5">
          <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight">
            <BuildingIcon class="size-5 text-primary" aria-hidden="true" /> {{ g.name }}
          </h2>
          <p class="text-sm text-muted-foreground">{{ g.buildingCount }} อาคาร · {{ g.genderSplit }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{{ g.feeModel }}</Badge>
          <span v-for="tel in g.contact" :key="tel" class="inline-flex items-center gap-1.5 text-muted-foreground">
            <PhoneIcon class="size-3.5" aria-hidden="true" />
            <a :href="`tel:${tel.replaceAll('-', '')}`" class="hover:text-foreground hover:underline">{{ tel }}</a>
          </span>
        </div>
      </div>

      <!-- ตารางราคา -->
      <Card class="overflow-hidden rounded-3xl py-0">
        <div class="overflow-x-auto">
          <table class="w-full min-w-240 text-sm">
            <caption class="sr-only">อัตราค่าธรรมเนียม {{ g.name }} ปีการศึกษา {{ feeAcademicYear }}</caption>
            <thead>
              <tr class="border-b bg-muted/50 text-left">
                <th class="px-5 py-3 font-semibold">ประเภทห้อง</th>
                <template v-if="isPerSemester(g.rooms)">
                  <th class="px-4 py-3 text-right font-semibold">ภาคการศึกษาปกติ</th>
                  <th class="px-4 py-3 text-right font-semibold">ภาคการศึกษาพิเศษ</th>
                </template>
                <template v-else>
                  <th class="px-4 py-3 text-right font-semibold">พักคู่ (ต่อคน/ปี)</th>
                  <th class="px-4 py-3 text-right font-semibold">พักคู่ (ต่อคน/ภาค)</th>
                  <th class="px-4 py-3 text-right font-semibold">เหมาห้อง (ต่อห้อง/ปี)</th>
                  <th class="px-4 py-3 text-right font-semibold">เหมาห้อง (ต่อห้อง/ภาค)</th>
                </template>
                <th class="px-5 py-3 text-right font-semibold">หน่วยเรียกเก็บ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in g.rooms" :key="r.roomType" class="border-b last:border-0 hover:bg-muted/30">
                <td class="px-5 py-3 font-medium">
                  {{ r.roomType }}
                  <p v-if="r.notes" class="text-xs font-normal text-muted-foreground">{{ r.notes }}</p>
                </td>
                <template v-if="isPerSemester(g.rooms)">
                  <td class="px-4 py-3 text-right tabular-nums">{{ baht(r.regularSemester) }}</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ baht(r.specialSemester) }}</td>
                </template>
                <template v-else>
                  <td class="px-4 py-3 text-right tabular-nums">{{ baht(r.twoPersonAnnual) }}</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ baht(r.twoPersonSplitPerTerm) }}</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ baht(r.singleAnnual) }}</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ baht(r.singleSplitPerTerm) }}</td>
                </template>
                <td class="px-5 py-3 text-right text-xs text-muted-foreground">{{ r.billingBasis }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- ค่าน้ำ/ไฟ/มัดจำ ของกลุ่มนี้ (ใช้ค่าจากแถวแรก — ประกาศกำหนดเท่ากันทั้งกลุ่ม) -->
      <div v-if="g.rooms[0]" class="grid gap-3 sm:grid-cols-3">
        <Card class="rounded-2xl">
          <CardContent class="flex items-start gap-3 p-4">
            <DropletIcon class="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <div class="text-sm"><p class="font-semibold">ค่าน้ำประปา</p><p class="text-muted-foreground">{{ g.rooms[0].waterFee }}</p></div>
          </CardContent>
        </Card>
        <Card class="rounded-2xl">
          <CardContent class="flex items-start gap-3 p-4">
            <ZapIcon class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div class="text-sm"><p class="font-semibold">ค่าไฟฟ้า</p><p class="text-muted-foreground">{{ g.rooms[0].electricityFee }}</p></div>
          </CardContent>
        </Card>
        <Card class="rounded-2xl">
          <CardContent class="flex items-start gap-3 p-4">
            <ShieldIcon class="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div class="text-sm">
              <p class="font-semibold">เงินประกัน/มัดจำ</p>
              <p class="text-muted-foreground">ประกันความเสียหาย {{ g.rooms[0].damageDeposit }} · มัดจำกุญแจ {{ g.rooms[0].keyDeposit }}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    <Card class="rounded-3xl border-amber-500/30 bg-amber-500/5">
      <CardContent class="flex gap-3 p-5 text-sm leading-relaxed text-muted-foreground">
        <InfoIcon class="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
        <p>
          อัตราข้างต้นอ้างอิงประกาศปีการศึกษา {{ feeAcademicYear }} และอาจเปลี่ยนแปลงตามประกาศฉบับใหม่ —
          ระบบคงตัวเลขรายปีและรายภาคตามต้นฉบับ แม้บางแถวจะรวมกันไม่เท่ากันพอดี
        </p>
      </CardContent>
    </Card>
  </div>
</template>
