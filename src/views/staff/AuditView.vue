<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BracesIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, ScrollTextIcon, SearchIcon, XIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import PermissionGate from '@/components/domain/PermissionGate.vue'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { formatDateTime } from '@/lib/labels'
import { useContractsStore } from '@/stores/contracts'
import type { AuditEvent } from '@/types'

type TimeRange = 'all' | '24h' | '7d' | '30d'
type AuditSort = 'newest' | 'oldest'

const PAGE_SIZE = 25

const contractsStore = useContractsStore()

const searchQuery = ref('')
const actionGroupFilter = ref('all')
const actorFilter = ref('all')
const timeRange = ref<TimeRange>('all')
const sortBy = ref<AuditSort>('newest')
const currentPage = ref(1)
const jsonOpen = ref(false)
const selectedEvent = ref<AuditEvent | null>(null)

const actionGroupLabels: Record<string, string> = {
  reservation: 'การจอง',
  payment_result: 'ผลชำระเงิน',
  payment_export: 'ส่งออกธนาคาร',
  payment: 'การชำระเงิน',
  roommate: 'รูมเมท',
  contract: 'สัญญา',
  room: 'ห้องพัก',
  key_handover: 'รับกุญแจ',
  handoff: 'ส่งต่อมหาวิทยาลัย',
  user: 'ผู้ใช้งาน',
  system: 'ระบบ',
}

function actionGroup(action: string) {
  const [prefix = 'system'] = action.split('.')
  return prefix
}

function actionGroupLabel(action: string) {
  const group = actionGroup(action)
  return actionGroupLabels[group] ?? group
}

const actionGroups = computed(() => {
  const groups = new Set(contractsStore.auditEvents.map(event => actionGroup(event.action)))
  return [...groups].sort((a, b) => actionGroupLabels[a]?.localeCompare(actionGroupLabels[b] ?? b, 'th') ?? a.localeCompare(b))
})

const actors = computed(() =>
  [...new Set(contractsStore.auditEvents.map(event => event.actor))].sort((a, b) => a.localeCompare(b, 'th')),
)

const filteredEvents = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('th-TH')
  const now = Date.now()
  const maxAge = timeRange.value === '24h'
    ? 24 * 60 * 60 * 1000
    : timeRange.value === '7d'
      ? 7 * 24 * 60 * 60 * 1000
      : timeRange.value === '30d'
        ? 30 * 24 * 60 * 60 * 1000
        : null

  const events = contractsStore.auditEvents.filter((event) => {
    if (actionGroupFilter.value !== 'all' && actionGroup(event.action) !== actionGroupFilter.value) return false
    if (actorFilter.value !== 'all' && event.actor !== actorFilter.value) return false
    if (maxAge !== null && now - new Date(event.timestamp).getTime() > maxAge) return false
    if (!query) return true

    return [
      event.id,
      event.actor,
      event.action,
      actionGroupLabel(event.action),
      event.detail,
      event.reason,
      ...(event.relatedIds ?? []),
    ]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase('th-TH').includes(query))
  })

  return [...events].sort((a, b) => {
    const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    return sortBy.value === 'newest' ? diff : -diff
  })
})

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredEvents.value.slice(start, start + PAGE_SIZE)
})

const visibleRangeStart = computed(() =>
  filteredEvents.value.length ? (currentPage.value - 1) * PAGE_SIZE + 1 : 0,
)

const visibleRangeEnd = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, filteredEvents.value.length),
)

const hasActiveFilters = computed(() =>
  searchQuery.value !== ''
  || actionGroupFilter.value !== 'all'
  || actorFilter.value !== 'all'
  || timeRange.value !== 'all'
  || sortBy.value !== 'newest',
)

const formattedJson = computed(() => JSON.stringify(selectedEvent.value, null, 2))

watch([searchQuery, actionGroupFilter, actorFilter, timeRange, sortBy], () => {
  currentPage.value = 1
})

function clearFilters() {
  searchQuery.value = ''
  actionGroupFilter.value = 'all'
  actorFilter.value = 'all'
  timeRange.value = 'all'
  sortBy.value = 'newest'
}

function showJson(event: AuditEvent) {
  selectedEvent.value = event
  jsonOpen.value = true
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    toast('คัดลอก JSON แล้ว')
  } catch {
    toast('ไม่สามารถคัดลอก JSON ได้ในเบราว์เซอร์นี้')
  }
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="Audit Log"
      description="ตรวจสอบว่าใครทำอะไร เมื่อใด และมีเหตุผลหรือข้อมูลอ้างอิงใด โดยเปิดดู payload ดิบของแต่ละเหตุการณ์เป็น JSON ได้"
      :icon="ScrollTextIcon"
    >
      <template #actions>
        <Badge variant="outline" class="h-7 px-3 font-normal">
          {{ contractsStore.auditEvents.length.toLocaleString('th-TH') }} เหตุการณ์ทั้งหมด
        </Badge>
      </template>
    </StaffPageHeader>

    <PermissionGate permission="audit.view">
      <div class="space-y-3">
        <div class="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
            <div class="space-y-1.5 md:col-span-2 xl:col-span-4">
              <Label for="audit-search">ค้นหา Audit Log</Label>
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="audit-search"
                  v-model="searchQuery"
                  placeholder="Action, ผู้กระทำ, รายละเอียด, เหตุผล หรือรหัสอ้างอิง"
                  aria-label="ค้นหา Audit Log"
                />
                <InputGroupAddon v-if="searchQuery" align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="ล้างคำค้นหา Audit Log"
                    title="ล้างคำค้นหา"
                    @click="searchQuery = ''"
                  >
                    <XIcon aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>หมวดเหตุการณ์</Label>
              <Select v-model="actionGroupFilter">
                <SelectTrigger class="w-full" aria-label="กรองหมวดเหตุการณ์"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกหมวด</SelectItem>
                  <SelectItem v-for="group in actionGroups" :key="group" :value="group">
                    {{ actionGroupLabels[group] ?? group }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>ผู้กระทำ</Label>
              <Select v-model="actorFilter">
                <SelectTrigger class="w-full" aria-label="กรองผู้กระทำ"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกคน</SelectItem>
                  <SelectItem v-for="actor in actors" :key="actor" :value="actor">{{ actor }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>ช่วงเวลา</Label>
              <Select v-model="timeRange">
                <SelectTrigger class="w-full" aria-label="กรองช่วงเวลา"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกช่วงเวลา</SelectItem>
                  <SelectItem value="24h">24 ชั่วโมงล่าสุด</SelectItem>
                  <SelectItem value="7d">7 วันล่าสุด</SelectItem>
                  <SelectItem value="30d">30 วันล่าสุด</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>เรียงตามเวลา</Label>
              <Select v-model="sortBy">
                <SelectTrigger class="w-full" aria-label="เรียง Audit Log"><SelectValue /></SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value="newest">ใหม่ล่าสุดก่อน</SelectItem>
                  <SelectItem value="oldest">เก่าสุดก่อน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p class="text-sm text-muted-foreground" aria-live="polite">
              แสดง
              <b class="tabular-nums text-foreground">{{ visibleRangeStart }}–{{ visibleRangeEnd }}</b>
              จาก
              <b class="tabular-nums text-foreground">{{ filteredEvents.length.toLocaleString('th-TH') }}</b>
              เหตุการณ์
              <span v-if="filteredEvents.length !== contractsStore.auditEvents.length">
                (ทั้งหมด {{ contractsStore.auditEvents.length.toLocaleString('th-TH') }} เหตุการณ์)
              </span>
            </p>
            <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">
              <XIcon aria-hidden="true" /> ล้างตัวกรอง
            </Button>
          </div>
        </div>

        <div class="data-table-card">
          <Table class="min-w-225 table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead class="w-36">วันและเวลา</TableHead>
                <TableHead class="w-48">Action</TableHead>
                <TableHead class="w-32">ผู้กระทำ</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead class="w-44">เหตุผล / อ้างอิง</TableHead>
                <TableHead class="w-26 text-right">ข้อมูลดิบ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="event in paginatedEvents" :key="event.id">
                <TableCell class="whitespace-nowrap align-top text-xs text-muted-foreground">
                  {{ formatDateTime(event.timestamp) }}
                </TableCell>
                <TableCell class="align-top">
                  <div class="space-y-1.5">
                    <Badge variant="secondary" class="font-normal">{{ actionGroupLabel(event.action) }}</Badge>
                    <code class="block text-xs text-muted-foreground">{{ event.action }}</code>
                  </div>
                </TableCell>
                <TableCell class="align-top text-sm font-medium">{{ event.actor }}</TableCell>
                <TableCell class="break-words whitespace-normal align-top text-sm leading-relaxed">{{ event.detail }}</TableCell>
                <TableCell class="break-words whitespace-normal align-top">
                  <p v-if="event.reason" class="line-clamp-3 text-xs leading-relaxed" :title="event.reason">{{ event.reason }}</p>
                  <p v-if="event.relatedIds?.length" class="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {{ event.relatedIds.join(', ') }}
                  </p>
                  <span v-if="!event.reason && !event.relatedIds?.length" class="text-xs text-muted-foreground">—</span>
                </TableCell>
                <TableCell class="text-right align-top">
                  <Button size="sm" variant="outline" @click="showJson(event)">
                    <BracesIcon aria-hidden="true" /> ดู JSON
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="!filteredEvents.length">
                <TableCell :colspan="6" class="h-32 text-center text-muted-foreground">
                  ไม่พบเหตุการณ์ตามคำค้นหาและตัวกรองที่เลือก
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div v-if="filteredEvents.length > PAGE_SIZE" class="border-t px-3 py-3 sm:px-4">
            <Pagination
              v-slot="{ page }"
              v-model:page="currentPage"
              :items-per-page="PAGE_SIZE"
              :total="filteredEvents.length"
              :sibling-count="1"
              show-edges
              aria-label="แบ่งหน้า Audit Log"
            >
              <PaginationContent v-slot="{ items }">
                <PaginationPrevious aria-label="หน้าก่อนหน้า">
                  <ChevronLeftIcon aria-hidden="true" />
                  <span class="hidden sm:inline">ก่อนหน้า</span>
                </PaginationPrevious>
                <template v-for="(item, index) in items" :key="index">
                  <PaginationItem
                    v-if="item.type === 'page'"
                    :value="item.value"
                    :is-active="item.value === page"
                    :aria-label="`หน้าที่ ${item.value}`"
                  >
                    {{ item.value.toLocaleString('th-TH') }}
                  </PaginationItem>
                  <PaginationEllipsis v-else :index="index">
                    <span aria-hidden="true">…</span>
                    <span class="sr-only">มีหน้าที่ซ่อนอยู่</span>
                  </PaginationEllipsis>
                </template>
                <PaginationNext aria-label="หน้าถัดไป">
                  <span class="hidden sm:inline">ถัดไป</span>
                  <ChevronRightIcon aria-hidden="true" />
                </PaginationNext>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </PermissionGate>

    <Dialog v-model:open="jsonOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>JSON ของเหตุการณ์ {{ selectedEvent?.id }}</DialogTitle>
          <DialogDescription>
            ข้อมูลดิบที่ระบบบันทึกสำหรับตรวจสอบย้อนหลัง
          </DialogDescription>
        </DialogHeader>
        <pre class="max-h-[60vh] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed"><code>{{ formattedJson }}</code></pre>
        <DialogFooter>
          <Button variant="outline" @click="copyJson">
            <CopyIcon aria-hidden="true" /> คัดลอก JSON
          </Button>
          <Button @click="jsonOpen = false">ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
