<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  ClockIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SendIcon,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PageHeader from '@/components/domain/PageHeader.vue'
import { dormOfficeContact } from '@/fixtures/personnel'
import { feeGroups } from '@/fixtures/fees'

// ช่องทางติดต่อ — ที่อยู่/เวลาทำการจากข้อมูลจริงของกองบริการหอพัก + เบอร์รายหอจากประกาศค่าธรรมเนียม
const mapUrl = 'https://maps.google.com/?q=กองบริการหอพักนักศึกษา+มหาวิทยาลัยขอนแก่น'

const form = ref({ name: '', email: '', subject: '', message: '' })

function submit() {
  if (!form.value.name || !form.value.subject) {
    toast('กรุณากรอกชื่อและหัวข้อเรื่องให้ครบถ้วน')
    return
  }
  toast(`ส่งเรื่อง "${form.value.subject}" ถึงกองบริการหอพักแล้ว — เจ้าหน้าที่จะติดต่อกลับทางอีเมล (ต้นแบบระบบ)`)
  form.value = { name: '', email: '', subject: '', message: '' }
}
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-8 px-3 py-8 sm:px-5">
    <PageHeader
      kicker="ติดต่อเรา"
      title="ติดต่อกองบริการหอพักนักศึกษา"
      subtitle="สอบถามการจองหอพัก ค่าธรรมเนียม สัญญาเข้าพัก หรือแจ้งปัญหาการใช้งานระบบ"
    />

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div class="space-y-4">
        <!-- ที่อยู่ + เวลาทำการ -->
        <Card class="rounded-3xl">
          <CardContent class="space-y-4 p-6">
            <div class="flex items-start gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPinIcon class="size-5" aria-hidden="true" />
              </div>
              <div class="space-y-1">
                <h2 class="font-bold">{{ dormOfficeContact.organization }}</h2>
                <p class="text-sm leading-relaxed text-muted-foreground">{{ dormOfficeContact.address }}</p>
                <a
                  :href="mapUrl"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  เปิดแผนที่ Google Maps <ExternalLinkIcon class="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div class="grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
              <p class="flex items-start gap-2 text-muted-foreground">
                <ClockIcon class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {{ dormOfficeContact.officeHours }}
              </p>
              <p class="flex items-center gap-2 text-muted-foreground">
                <PhoneIcon class="size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href="tel:043204303" class="hover:text-foreground hover:underline">043-204-303</a>
              </p>
              <p class="flex items-center gap-2 text-muted-foreground">
                <MailIcon class="size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href="mailto:dormitory@kku.ac.th" class="hover:text-foreground hover:underline">dormitory@kku.ac.th</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- เบอร์ติดต่อรายหอ -->
        <Card class="rounded-3xl">
          <CardContent class="space-y-3 p-6">
            <h2 class="font-bold">เบอร์ติดต่อหอพักแต่ละกลุ่ม</h2>
            <div class="divide-y">
              <div
                v-for="g in feeGroups"
                :key="g.id"
                class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <p class="text-sm font-medium">{{ g.name }}</p>
                <p class="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                  <a
                    v-for="tel in g.contact"
                    :key="tel"
                    :href="`tel:${tel.replaceAll('-', '')}`"
                    class="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
                  >
                    <PhoneIcon class="size-3.5" aria-hidden="true" /> {{ tel }}
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- แบบฟอร์มติดต่อ -->
      <Card class="self-start rounded-3xl">
        <CardContent class="space-y-4 p-6">
          <div class="space-y-1">
            <h2 class="font-bold">ส่งเรื่องถึงเจ้าหน้าที่</h2>
            <p class="text-sm text-muted-foreground">เจ้าหน้าที่ตอบกลับทางอีเมลภายใน 1–2 วันทำการ</p>
          </div>
          <form class="space-y-3" @submit.prevent="submit">
            <div class="space-y-1.5">
              <Label for="ct-name">ชื่อ–นามสกุล</Label>
              <Input id="ct-name" v-model="form.name" placeholder="เช่น ศุภกร ใจดี" required />
            </div>
            <div class="space-y-1.5">
              <Label for="ct-email">อีเมลสำหรับติดต่อกลับ</Label>
              <Input id="ct-email" v-model="form.email" type="email" placeholder="name@example.com" />
            </div>
            <div class="space-y-1.5">
              <Label for="ct-subject">หัวข้อเรื่อง</Label>
              <Input id="ct-subject" v-model="form.subject" placeholder="เช่น สอบถามการย้ายห้อง" required />
            </div>
            <div class="space-y-1.5">
              <Label for="ct-message">รายละเอียด</Label>
              <Textarea id="ct-message" v-model="form.message" rows="4" placeholder="อธิบายรายละเอียดที่ต้องการสอบถาม" />
            </div>
            <Button type="submit" class="w-full rounded-full">
              <SendIcon aria-hidden="true" /> ส่งเรื่อง
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
