<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BedDoubleIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CircleIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  Clock3Icon,
  FileTextIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  MinusIcon,
  ReceiptTextIcon,
  TimerIcon,
  UsersIcon,
} from '@lucide/vue'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  useApplicantJourney,
  type JourneyStatus,
} from '@/composables/useApplicantJourney'
import { useCountdown } from '@/composables/useCountdown'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const {
  nextAction,
  milestones,
  alerts,
  statusSections,
  hasUrgentAction,
} = useApplicantJourney()

const deadline = computed(() => nextAction.value?.deadline)
const { display: deadlineDisplay, expired: deadlineExpired } = useCountdown(deadline)

const statusLabel: Record<JourneyStatus, string> = {
  completed: 'เสร็จแล้ว',
  current: 'ขั้นตอนปัจจุบัน',
  needs_action: 'คุณต้องดำเนินการ',
  waiting: 'กำลังรอ',
  blocked: 'ยังดำเนินการต่อไม่ได้',
  upcoming: 'ขั้นตอนถัดไป',
  skipped: 'ไม่ใช้กับรูปแบบการพักนี้',
}

const statusIcon: Record<JourneyStatus, Component> = {
  completed: CheckCircle2Icon,
  current: CircleDotIcon,
  needs_action: AlertTriangleIcon,
  waiting: Clock3Icon,
  blocked: LockKeyholeIcon,
  upcoming: CircleIcon,
  skipped: MinusIcon,
}

const journeyStatusClass: Record<JourneyStatus, string> = {
  completed: 'border-primary/30 bg-primary/10 text-primary',
  current: 'border-primary bg-background text-primary ring-2 ring-primary/15',
  needs_action: 'border-primary bg-primary text-primary-foreground ring-2 ring-primary/15',
  waiting: 'border-border bg-muted text-muted-foreground',
  blocked: 'border-destructive/40 bg-destructive/10 text-destructive',
  upcoming: 'border-border bg-background text-muted-foreground',
  skipped: 'border-dashed border-border bg-muted/50 text-muted-foreground',
}

const statusBadgeClass: Record<JourneyStatus, string> = {
  completed: 'border-primary/20 bg-primary/10 text-primary',
  current: 'border-primary/30 bg-primary/10 text-primary',
  needs_action: 'border-primary bg-primary text-primary-foreground',
  waiting: 'border-border bg-muted text-muted-foreground',
  blocked: 'border-destructive/30 bg-destructive/10 text-destructive',
  upcoming: 'border-border text-muted-foreground',
  skipped: 'border-dashed border-border text-muted-foreground',
}

const urgentAction = computed(() => {
  const urgency = nextAction.value?.urgency?.toLowerCase()
  return hasUrgentAction.value || urgency === 'urgent' || urgency === 'critical'
})

const nextActionSection = ref<HTMLElement | null>(null)
const nextActionVisible = ref(true)
let nextActionObserver: IntersectionObserver | undefined

const stickyAction = computed(() => {
  const action = nextAction.value
  if (!hasUrgentAction.value || !action?.to || nextActionVisible.value) return null
  return { ...action, to: action.to }
})

onMounted(() => {
  if (!nextActionSection.value || typeof IntersectionObserver === 'undefined') return
  nextActionObserver = new IntersectionObserver(
    ([entry]) => {
      nextActionVisible.value = entry?.isIntersecting ?? true
    },
    {
      // ไม่นับพื้นที่หลัง header เป็นพื้นที่ที่มองเห็น เพื่อให้ CTA ลอยขึ้นหลังการ์ดพ้นจริง
      rootMargin: '-64px 0px 0px 0px',
      threshold: 0,
    },
  )
  nextActionObserver.observe(nextActionSection.value)
})

onBeforeUnmount(() => {
  nextActionObserver?.disconnect()
})

const currentMilestoneId = computed(() => {
  const priority: JourneyStatus[] = ['needs_action', 'current', 'waiting', 'blocked']
  for (const status of priority) {
    const milestone = milestones.value.find((item) => item.status === status)
    if (milestone) return milestone.id
  }
  return undefined
})

function sectionIcon(sectionId: string): Component {
  const id = sectionId.toLowerCase()
  if (id.includes('roommate') || id.includes('group')) return UsersIcon
  if (id.includes('hold') || id.includes('lock')) return TimerIcon
  if (id.includes('payment') || id.includes('obligation')) return ReceiptTextIcon
  if (id.includes('reservation') || id.includes('booking')) return ClipboardCheckIcon
  if (id.includes('contract')) return FileTextIcon
  if (id.includes('handover') || id.includes('key')) return KeyRoundIcon
  if (id.includes('room')) return BedDoubleIcon
  return ClipboardListIcon
}

const currentSectionId = computed(() => {
  const sections = statusSections.value
  if (!sections.length) return undefined

  const actionRoute = nextAction.value?.to
  if (actionRoute) {
    const routeMatch = sections.find((section) => section.to === actionRoute)
    if (routeMatch) return routeMatch.id
  }

  const currentMilestone = milestones.value.find((milestone) => milestone.id === currentMilestoneId.value)
  if (currentMilestone) {
    const milestoneId = currentMilestone.id.toLowerCase()
    const aliases: Record<string, string[]> = {
      roommate: ['roommate', 'group'],
      room: ['hold', 'room', 'reservation'],
      payment: ['payment', 'obligation'],
      contract: ['contract'],
      handover: ['handover', 'key'],
    }
    const aliasKey = Object.keys(aliases).find((key) => milestoneId.includes(key))
    const candidates = aliasKey ? aliases[aliasKey] : [milestoneId]
    for (const candidate of candidates ?? []) {
      const milestoneMatch = sections.find((section) =>
        section.id.toLowerCase().includes(candidate),
      )
      if (milestoneMatch) return milestoneMatch.id
    }
  }

  return undefined
})

const openSections = ref<string[]>([])

watch(
  currentSectionId,
  (sectionId) => {
    if (sectionId) openSections.value = [sectionId]
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="space-y-6 lg:pb-4"
    :class="hasUrgentAction && nextAction?.to ? 'pb-[calc(11rem+env(safe-area-inset-bottom))]' : 'pb-24'"
  >
    <header class="space-y-1">
      <p class="text-sm font-medium text-primary">ภาพรวมการสมัคร</p>
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
        สวัสดี {{ session.currentUser?.displayName || 'ผู้สมัคร' }}
      </h1>
      <p class="max-w-2xl text-sm text-muted-foreground sm:text-base">
        ตรวจสอบขั้นตอนปัจจุบันและสิ่งที่ต้องทำต่อ โดยสถานะแต่ละด้านยังแสดงแยกกันอย่างชัดเจน
      </p>
    </header>

    <section v-if="alerts.length" aria-label="ข้อความสำคัญ" class="space-y-2">
      <Alert
        v-for="alert in alerts"
        :key="alert.id"
        :variant="alert.variant === 'destructive' ? 'destructive' : 'default'"
      >
        <AlertTriangleIcon aria-hidden="true" />
        <AlertTitle>{{ alert.title }}</AlertTitle>
        <AlertDescription>
          {{ alert.description }}
          <RouterLink
            v-if="alert.to"
            :to="alert.to"
            class="ml-1 font-medium underline underline-offset-2"
          >
            {{ alert.ctaLabel || 'ดูรายละเอียด' }}
          </RouterLink>
        </AlertDescription>
      </Alert>
    </section>

    <section ref="nextActionSection" aria-labelledby="next-action-title">
      <Card :class="urgentAction ? 'ring-destructive/30' : 'ring-primary/20'">
        <CardHeader class="gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <Badge :variant="urgentAction ? 'destructive' : 'secondary'">
                {{ nextAction?.actorLabel || 'สถานะล่าสุด' }}
              </Badge>
              <Badge v-if="urgentAction" variant="outline" class="border-destructive/30 text-destructive">
                มีเวลาจำกัด
              </Badge>
            </div>
            <div class="space-y-1">
              <CardDescription id="next-action-title" class="font-medium text-foreground">
                สิ่งที่ต้องทำตอนนี้
              </CardDescription>
              <CardTitle class="text-xl sm:text-2xl">
                {{ nextAction?.title || 'ยังไม่มีรายการที่คุณต้องดำเนินการ' }}
              </CardTitle>
              <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {{ nextAction?.description || 'ระบบจะแจ้งที่นี่เมื่อมีขั้นตอนใหม่ กรุณากลับมาตรวจสอบสถานะเป็นระยะ' }}
              </p>
            </div>
          </div>

          <Button
            v-if="nextAction?.to"
            as-child
            size="lg"
            class="hidden min-w-32 sm:inline-flex"
            :variant="urgentAction ? 'destructive' : 'default'"
          >
            <RouterLink :to="nextAction.to">
              {{ nextAction.ctaLabel || 'ดำเนินการต่อ' }}
              <ArrowRightIcon aria-hidden="true" />
            </RouterLink>
          </Button>
        </CardHeader>

        <CardContent class="space-y-3">
          <div
            v-if="nextAction?.deadline"
            class="inline-flex max-w-full items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="timer"
            aria-live="polite"
          >
            <TimerIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span v-if="!deadlineExpired">
              เหลือเวลาดำเนินการ
              <strong data-allow-mismatch="text" class="tabular-nums">{{ deadlineDisplay }}</strong>
            </span>
            <span v-else>เลยกำหนดเวลาแล้ว — โปรดตรวจสอบสถานะล่าสุดก่อนดำเนินการ</span>
          </div>

          <div
            v-else-if="!nextAction?.to"
            class="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground"
          >
            <Clock3Icon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>ขณะนี้ยังไม่ต้องดำเนินการ ระบบจะแสดงผู้รับผิดชอบและขั้นตอนถัดไปให้ทราบ</span>
          </div>

          <Button
            v-if="nextAction?.to"
            as-child
            size="lg"
            class="w-full sm:hidden"
            :variant="urgentAction ? 'destructive' : 'default'"
          >
            <RouterLink :to="nextAction.to">
              {{ nextAction.ctaLabel || 'ดำเนินการต่อ' }}
              <ArrowRightIcon aria-hidden="true" />
            </RouterLink>
          </Button>
        </CardContent>
      </Card>
    </section>

    <section aria-labelledby="journey-title" class="space-y-3">
      <div>
        <h2 id="journey-title" class="text-lg font-semibold">เส้นทางการสมัครและเข้าพัก</h2>
        <p class="text-sm text-muted-foreground">
          แสดงสถานะตามขั้นตอนจริง ไม่ใช่เปอร์เซ็นต์ความสำเร็จ
        </p>
      </div>

      <Card>
        <CardContent>
          <ol class="hidden grid-cols-6 gap-2 lg:grid" aria-label="ขั้นตอนการสมัคร">
            <li
              v-for="(milestone, index) in milestones"
              :key="milestone.id"
              class="relative min-w-0 text-center"
              :aria-current="milestone.id === currentMilestoneId ? 'step' : undefined"
            >
              <div
                v-if="index > 0"
                class="absolute right-1/2 top-5 h-px w-full bg-border"
                aria-hidden="true"
              />
              <div class="relative z-10 mx-auto flex w-fit flex-col items-center gap-2 bg-card px-2">
                <span
                  class="flex size-10 items-center justify-center rounded-full border"
                  :class="journeyStatusClass[milestone.status]"
                >
                  <component :is="statusIcon[milestone.status]" class="size-5" aria-hidden="true" />
                </span>
                <Badge variant="outline" :class="statusBadgeClass[milestone.status]">
                  {{ statusLabel[milestone.status] }}
                </Badge>
              </div>
              <div class="mt-2 space-y-1 px-1">
                <h3 class="text-sm font-semibold leading-snug">{{ milestone.label }}</h3>
                <p class="text-xs leading-relaxed text-muted-foreground">{{ milestone.description }}</p>
              </div>
            </li>
          </ol>

          <ol class="space-y-0 lg:hidden" aria-label="ขั้นตอนการสมัคร">
            <li
              v-for="(milestone, index) in milestones"
              :key="milestone.id"
              class="relative flex gap-3 pb-5 last:pb-0"
              :aria-current="milestone.id === currentMilestoneId ? 'step' : undefined"
            >
              <div class="relative flex shrink-0 flex-col items-center">
                <span
                  class="relative z-10 flex size-9 items-center justify-center rounded-full border"
                  :class="journeyStatusClass[milestone.status]"
                >
                  <component :is="statusIcon[milestone.status]" class="size-4" aria-hidden="true" />
                </span>
                <span
                  v-if="index < milestones.length - 1"
                  class="absolute bottom-[-1.25rem] top-9 w-px bg-border"
                  aria-hidden="true"
                />
              </div>
              <div class="min-w-0 flex-1 space-y-1 pt-0.5">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold">{{ milestone.label }}</h3>
                  <Badge variant="outline" :class="statusBadgeClass[milestone.status]">
                    {{ statusLabel[milestone.status] }}
                  </Badge>
                </div>
                <p class="text-sm leading-relaxed text-muted-foreground">{{ milestone.description }}</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </section>

    <section aria-labelledby="status-details-title" class="space-y-3">
      <div>
        <h2 id="status-details-title" class="text-lg font-semibold">รายละเอียดสถานะ</h2>
        <p class="text-sm text-muted-foreground">
          ห้อง รูมเมท การล็อกห้อง การชำระเงิน การจอง สัญญา และการรับกุญแจแสดงแยกกันเสมอ
        </p>
      </div>

      <Card class="py-0">
        <CardContent class="p-0">
          <Accordion v-model="openSections" type="multiple" class="w-full">
            <AccordionItem
              v-for="section in statusSections"
              :key="section.id"
              :value="section.id"
              class="px-4 last:border-b-0"
            >
              <AccordionTrigger class="gap-3 py-4 hover:no-underline">
                <div class="flex min-w-0 flex-1 items-start gap-3 pr-2">
                  <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <component :is="sectionIcon(section.id)" class="size-4" aria-hidden="true" />
                  </span>
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-semibold text-foreground">{{ section.title }}</span>
                      <Badge variant="outline">{{ section.statusLabel }}</Badge>
                    </div>
                    <p class="text-sm font-normal leading-relaxed text-muted-foreground">
                      {{ section.summary }}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent class="pl-12 pr-1">
                <div class="space-y-3">
                  <p v-if="section.description" class="leading-relaxed text-muted-foreground">
                    {{ section.description }}
                  </p>
                  <p v-if="section.detail" class="rounded-lg bg-muted/60 px-3 py-2 leading-relaxed">
                    {{ section.detail }}
                  </p>
                  <Button v-if="section.to" as-child variant="outline" size="sm">
                    <RouterLink :to="section.to">
                      {{ section.ctaLabel || 'ดูรายละเอียด' }}
                      <ArrowRightIcon aria-hidden="true" />
                    </RouterLink>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </section>

    <div
      v-if="stickyAction"
      class="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 lg:hidden"
    >
      <div class="mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-card p-2 shadow-lg">
        <div class="min-w-0 flex-1 pl-1">
          <p class="truncate text-xs font-medium text-destructive">ต้องดำเนินการภายในเวลาที่กำหนด</p>
          <p class="truncate text-sm font-semibold">{{ stickyAction.title }}</p>
        </div>
        <Button as-child variant="destructive" size="lg">
          <RouterLink :to="stickyAction.to">
            {{ stickyAction.ctaLabel || 'ดำเนินการ' }}
            <ArrowRightIcon aria-hidden="true" />
          </RouterLink>
        </Button>
      </div>
    </div>
  </div>
</template>
