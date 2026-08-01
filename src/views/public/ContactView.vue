<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  Building2Icon,
  ClockIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  SendIcon,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PageHeader from '@/components/domain/PageHeader.vue'
import { dormOfficeContact } from '@/fixtures/personnel'
import { feeGroups } from '@/fixtures/fees'
import { contactFormSchema, errorsFromZod, INPUT_LIMITS } from '@/lib/validation'

// ช่องทางติดต่อ — ที่อยู่/เวลาทำการจากข้อมูลจริงของกองบริการหอพัก + เบอร์รายหอจากประกาศค่าธรรมเนียม
const mapUrl = 'https://maps.google.com/?q=กองบริการหอพักนักศึกษา+มหาวิทยาลัยขอนแก่น'

const form = ref({ name: '', email: '', subject: '', message: '' })
const fieldErrors = ref<Record<string, string>>({})

async function submit() {
  const validation = contactFormSchema.safeParse(form.value)
  if (!validation.success) {
    fieldErrors.value = errorsFromZod(validation.error)
    toast.error(validation.error.issues[0]?.message ?? 'กรุณาตรวจสอบข้อมูลอีกครั้ง')
    await nextTick()
    const element = document.querySelector<HTMLElement>('#contact-form [aria-invalid="true"]')
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element?.focus({ preventScroll: true })
    return
  }
  fieldErrors.value = {}
  form.value = validation.data
  toast(`ส่งเรื่อง "${validation.data.subject}" ถึงกองบริการหอพักแล้ว — เจ้าหน้าที่จะติดต่อกลับทางอีเมล (ต้นแบบระบบ)`)
  form.value = { name: '', email: '', subject: '', message: '' }
}

function clearError(field: string) {
  if (!fieldErrors.value[field]) return
  const next = { ...fieldErrors.value }
  delete next[field]
  fieldErrors.value = next
}
</script>

<template>
  <div class="mx-auto w-full max-w-352 space-y-6 px-3 py-6 sm:px-5 sm:py-8">
    <PageHeader
      kicker="ติดต่อเรา"
      title="ติดต่อกองบริการหอพักนักศึกษา"
      subtitle="สอบถามการจองหอพัก ค่าธรรมเนียม สัญญาเข้าพัก หรือแจ้งปัญหาการใช้งานระบบ"
    />

    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div class="min-w-0 space-y-5">
        <!-- ข้อมูลสำนักงานแยกหัวข้อและค่าของแต่ละช่องทางให้กวาดสายตาได้ง่าย -->
        <Card class="min-w-0 overflow-hidden rounded-xl shadow-sm">
          <CardContent class="p-0">
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
              <div class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPinIcon class="size-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ที่ตั้งสำนักงาน</p>
                <h2 class="mt-1 text-base font-semibold">{{ dormOfficeContact.organization }}</h2>
                <p class="mt-1 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{{ dormOfficeContact.address }}</p>
                <Button as-child variant="outline" size="sm" class="mt-3">
                  <a :href="mapUrl" target="_blank" rel="noopener">
                    เปิดแผนที่ Google Maps
                    <ExternalLinkIcon class="size-3.5" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
            <dl class="grid border-t sm:grid-cols-3">
              <div class="flex min-w-0 items-start gap-3 p-4 sm:p-5">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                  <ClockIcon class="size-4" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium text-muted-foreground">เวลาทำการ</dt>
                  <dd class="mt-1 text-sm leading-5">{{ dormOfficeContact.officeHours }}</dd>
                </div>
              </div>
              <div class="flex min-w-0 items-start gap-3 border-t p-4 sm:border-l sm:border-t-0 sm:p-5">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                  <PhoneIcon class="size-4" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium text-muted-foreground">โทรศัพท์ส่วนกลาง</dt>
                  <dd class="mt-1 text-sm font-medium tabular-nums">
                    <a href="tel:043204303" class="hover:text-primary hover:underline">043-204-303</a>
                  </dd>
                </div>
              </div>
              <div class="flex min-w-0 items-start gap-3 border-t p-4 sm:border-l sm:border-t-0 sm:p-5">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                  <MailIcon class="size-4" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium text-muted-foreground">อีเมล</dt>
                  <dd class="mt-1 truncate text-sm font-medium">
                    <a href="mailto:dormitory@kku.ac.th" class="hover:text-primary hover:underline">dormitory@kku.ac.th</a>
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <!-- เบอร์รายกลุ่มหอแสดงเป็นรายการย่อยที่ชื่อ กลุ่มอาคาร และเบอร์โทรอยู่แนวเดียวกัน -->
        <Card class="min-w-0 rounded-xl shadow-sm">
          <CardHeader class="pb-4">
            <div class="flex items-start gap-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2Icon class="size-5" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <CardTitle>เบอร์ติดต่อหอพักแต่ละกลุ่ม</CardTitle>
                <CardDescription class="mt-1">เลือกโทรติดต่อกลุ่มหอพักที่ต้องการสอบถามโดยตรง</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent class="grid gap-3 pt-0">
            <article
              v-for="g in feeGroups"
              :key="g.id"
              class="rounded-xl border bg-muted/20 p-4"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <h3 class="text-sm font-semibold leading-6">{{ g.name }}</h3>
                  <p class="mt-0.5 text-xs leading-5 text-muted-foreground">{{ g.genderSplit }}</p>
                </div>
                <Badge variant="outline" class="w-fit shrink-0 tabular-nums">{{ g.buildingCount }} อาคาร</Badge>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 border-t pt-3">
                <a
                  v-for="tel in g.contact"
                  :key="tel"
                  :href="`tel:${tel.replaceAll('-', '')}`"
                  class="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium tabular-nums transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <PhoneIcon class="size-3.5" aria-hidden="true" />
                  {{ tel }}
                </a>
              </div>
            </article>
          </CardContent>
        </Card>
      </div>

      <!-- แบบฟอร์มคงอยู่ด้านข้างบนจอกว้าง และเรียงต่อจากข้อมูลติดต่อบนจอเล็ก -->
      <Card class="min-w-0 self-start rounded-xl shadow-sm xl:sticky xl:top-20">
        <CardHeader class="pb-4">
          <div class="flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareTextIcon class="size-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <CardTitle>ส่งเรื่องถึงเจ้าหน้าที่</CardTitle>
              <CardDescription class="mt-1 leading-5">เจ้าหน้าที่ตอบกลับทางอีเมลภายใน 1–2 วันทำการ</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="pt-0">
          <form id="contact-form" @submit.prevent="submit">
            <FieldGroup class="gap-4">
              <Field>
                <FieldLabel for="ct-name">ชื่อ–นามสกุล <span class="text-primary">*</span></FieldLabel>
                <Input id="ct-name" v-model="form.name" class="h-10" placeholder="เช่น ศุภกร ใจดี" required :maxlength="INPUT_LIMITS.contactName" :aria-invalid="Boolean(fieldErrors.name)" @input="clearError('name')" />
                <FieldError :errors="[fieldErrors.name]" />
              </Field>
              <Field>
                <FieldLabel for="ct-email" class="flex items-center justify-between gap-3">
                  <span>อีเมลสำหรับติดต่อกลับ</span>
                  <span class="text-xs font-normal text-muted-foreground">ไม่บังคับ</span>
                </FieldLabel>
                <Input id="ct-email" v-model="form.email" class="h-10" type="email" placeholder="name@example.com" :maxlength="INPUT_LIMITS.email" :aria-invalid="Boolean(fieldErrors.email)" @input="clearError('email')" />
                <FieldError :errors="[fieldErrors.email]" />
              </Field>
              <Field>
                <FieldLabel for="ct-subject">หัวข้อเรื่อง <span class="text-primary">*</span></FieldLabel>
                <Input id="ct-subject" v-model="form.subject" class="h-10" placeholder="เช่น สอบถามการย้ายห้อง" required :maxlength="INPUT_LIMITS.contactSubject" :aria-invalid="Boolean(fieldErrors.subject)" @input="clearError('subject')" />
                <FieldError :errors="[fieldErrors.subject]" />
              </Field>
              <Field>
                <FieldLabel for="ct-message" class="flex items-center justify-between gap-3">
                  <span>รายละเอียด</span>
                  <span class="text-xs font-normal text-muted-foreground">ไม่บังคับ</span>
                </FieldLabel>
                <Textarea id="ct-message" v-model="form.message" class="min-h-28 resize-y" rows="5" placeholder="อธิบายรายละเอียดที่ต้องการสอบถาม" :maxlength="INPUT_LIMITS.contactMessage" :aria-invalid="Boolean(fieldErrors.message)" @input="clearError('message')" />
                <div class="flex items-start justify-between gap-3">
                  <FieldError :errors="[fieldErrors.message]" />
                  <span class="ml-auto text-xs tabular-nums text-muted-foreground">{{ form.message.length.toLocaleString('th-TH') }}/{{ INPUT_LIMITS.contactMessage.toLocaleString('th-TH') }}</span>
                </div>
              </Field>
              <Button type="submit" class="h-10 w-full">
                <SendIcon aria-hidden="true" /> ส่งเรื่อง
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
