<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUpDownIcon, Building2Icon, ImportIcon, SearchIcon, XIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import RoomStatusBadge from '@/components/domain/RoomStatusBadge.vue'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { roomConfigLabel, roomPublicStatusLabel } from '@/lib/labels'
import { useDormStore } from '@/stores/dorm'

type RoomSort = 'room-asc' | 'room-desc' | 'building-asc' | 'floor-asc' | 'status-asc'

const dorm = useDormStore()

const searchQuery = ref('')
const dormFilter = ref('all')
const buildingFilter = ref('all')
const floorFilter = ref('all')
const configFilter = ref('all')
const statusFilter = ref('all')
const sortBy = ref<RoomSort>('room-asc')

const roomRows = computed(() =>
  dorm.rooms.map((room) => {
    const building = dorm.buildings.find(b => b.id === room.buildingId)
    const dormGroup = dorm.dormGroups.find(g => g.id === building?.dormGroupId)
    return {
      ...room,
      buildingName: building?.name ?? room.buildingId,
      dormGroupId: building?.dormGroupId ?? '',
      dormGroupName: dormGroup?.name ?? '',
    }
  }),
)

const buildingOptions = computed(() =>
  dorm.buildings.filter(b => dormFilter.value === 'all' || b.dormGroupId === dormFilter.value),
)

const floorOptions = computed(() => {
  const floors = roomRows.value
    .filter(r => dormFilter.value === 'all' || r.dormGroupId === dormFilter.value)
    .filter(r => buildingFilter.value === 'all' || r.buildingId === buildingFilter.value)
    .map(r => r.floor)
  return [...new Set(floors)].sort((a, b) => a - b)
})

watch(dormFilter, () => {
  buildingFilter.value = 'all'
  floorFilter.value = 'all'
})

watch(buildingFilter, () => {
  floorFilter.value = 'all'
})

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('th-TH')
  const rows = roomRows.value.filter((room) => {
    if (dormFilter.value !== 'all' && room.dormGroupId !== dormFilter.value) return false
    if (buildingFilter.value !== 'all' && room.buildingId !== buildingFilter.value) return false
    if (floorFilter.value !== 'all' && room.floor !== Number(floorFilter.value)) return false
    if (configFilter.value !== 'all' && room.config !== configFilter.value) return false
    if (statusFilter.value !== 'all' && room.publicStatus !== statusFilter.value) return false
    if (!query) return true

    return [
      room.number,
      room.dormGroupName,
      room.buildingName,
      `ชั้น ${room.floor}`,
      roomConfigLabel[room.config],
      roomPublicStatusLabel[room.publicStatus],
      room.dimensions,
      room.blockedReason,
    ]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase('th-TH').includes(query))
  })

  return [...rows].sort((a, b) => {
    if (sortBy.value === 'room-desc') return b.number.localeCompare(a.number, 'th', { numeric: true })
    if (sortBy.value === 'building-asc') {
      return a.buildingName.localeCompare(b.buildingName, 'th', { numeric: true })
        || a.floor - b.floor
        || a.number.localeCompare(b.number, 'th', { numeric: true })
    }
    if (sortBy.value === 'floor-asc') {
      return a.floor - b.floor || a.number.localeCompare(b.number, 'th', { numeric: true })
    }
    if (sortBy.value === 'status-asc') {
      return roomPublicStatusLabel[a.publicStatus].localeCompare(roomPublicStatusLabel[b.publicStatus], 'th')
        || a.number.localeCompare(b.number, 'th', { numeric: true })
    }
    return a.number.localeCompare(b.number, 'th', { numeric: true })
  })
})

const hasActiveFilters = computed(() =>
  searchQuery.value !== ''
  || dormFilter.value !== 'all'
  || buildingFilter.value !== 'all'
  || floorFilter.value !== 'all'
  || configFilter.value !== 'all'
  || statusFilter.value !== 'all'
  || sortBy.value !== 'room-asc',
)

function clearFilters() {
  searchQuery.value = ''
  dormFilter.value = 'all'
  buildingFilter.value = 'all'
  floorFilter.value = 'all'
  configFilter.value = 'all'
  statusFilter.value = 'all'
  sortBy.value = 'room-asc'
}

function blockRoom(number: string) {
  // การ block ต้องมีเหตุผลบังคับ + audit (doc 05) — ฟอร์มเหตุผลมาในเฟส P5
  toast(`ต้นแบบ: block/unblock ห้อง ${number} ต้องกรอกเหตุผลบังคับและบันทึก audit (เฟส P5)`)
}
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="อาคาร / ชั้น / ห้อง"
      description="ห้องจริงเป็น source of truth ของการจองทั้งหมด — เลขห้อง unique ทั้งระบบ"
      :icon="Building2Icon"
    >
      <template #actions>
        <Button variant="outline" @click="toast('ต้นแบบ: นำเข้า room master พร้อม preview/ตรวจซ้ำ/นำเข้าซ้ำได้แบบ idempotent (เฟส P5)')">
          <ImportIcon aria-hidden="true" /> นำเข้า Room Master
        </Button>
      </template>
    </StaffPageHeader>

    <PermissionGate permission="room.manage">
      <div class="space-y-3">
        <!-- Toolbar สำหรับข้อมูลจำนวนมาก: ค้นหา + filter แบบเจาะจง + sort อยู่ในพื้นที่เดียว -->
        <div class="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
            <div class="space-y-1.5 md:col-span-2 xl:col-span-3">
              <Label for="room-search">ค้นหาห้อง</Label>
              <div class="relative">
                <SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="room-search"
                  v-model="searchQuery"
                  class="pl-8"
                  placeholder="เลขห้อง อาคาร ประเภท หรือเหตุผล block"
                />
              </div>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>กลุ่มหอ</Label>
              <Select v-model="dormFilter">
                <SelectTrigger class="w-full" aria-label="กรองกลุ่มหอ"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกกลุ่มหอ</SelectItem>
                  <SelectItem v-for="g in dorm.dormGroups" :key="g.id" :value="g.id">{{ g.shortName }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>อาคาร</Label>
              <Select v-model="buildingFilter">
                <SelectTrigger class="w-full" aria-label="กรองอาคาร"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกอาคาร</SelectItem>
                  <SelectItem v-for="b in buildingOptions" :key="b.id" :value="b.id">{{ b.name }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 xl:col-span-1">
              <Label>ชั้น</Label>
              <Select v-model="floorFilter">
                <SelectTrigger class="w-full" aria-label="กรองชั้น"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกชั้น</SelectItem>
                  <SelectItem v-for="floor in floorOptions" :key="floor" :value="String(floor)">ชั้น {{ floor }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>ประเภทห้อง</Label>
              <Select v-model="configFilter">
                <SelectTrigger class="w-full" aria-label="กรองประเภทห้อง"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem v-for="(label, key) in roomConfigLabel" :key="key" :value="key">{{ label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5 xl:col-span-2">
              <Label>สถานะ</Label>
              <Select v-model="statusFilter">
                <SelectTrigger class="w-full" aria-label="กรองสถานะห้อง"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem
                    v-for="(label, key) in roomPublicStatusLabel"
                    :key="key"
                    :value="key"
                  >
                    {{ label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
            <p class="text-sm text-muted-foreground" aria-live="polite">
              พบ <b class="tabular-nums text-foreground">{{ filteredRows.length.toLocaleString('th-TH') }}</b>
              จาก {{ roomRows.length.toLocaleString('th-TH') }} ห้อง
            </p>
            <div class="flex flex-wrap items-end gap-2">
              <div class="space-y-1.5">
                <Label class="sr-only">เรียงข้อมูล</Label>
                <Select v-model="sortBy">
                  <SelectTrigger class="w-52" aria-label="เรียงข้อมูลห้อง">
                    <ArrowUpDownIcon class="size-4 text-muted-foreground" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end">
                    <SelectItem value="room-asc">เลขห้อง: น้อย → มาก</SelectItem>
                    <SelectItem value="room-desc">เลขห้อง: มาก → น้อย</SelectItem>
                    <SelectItem value="building-asc">อาคาร / ชั้น</SelectItem>
                    <SelectItem value="floor-asc">ชั้น: น้อย → มาก</SelectItem>
                    <SelectItem value="status-asc">สถานะห้อง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">
                <XIcon aria-hidden="true" /> ล้างตัวกรอง
              </Button>
            </div>
          </div>
        </div>

        <div class="data-table-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ห้อง</TableHead>
                <TableHead>กลุ่มหอ / อาคาร / ชั้น</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ขนาด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead class="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="room in filteredRows" :key="room.number">
                <TableCell class="font-semibold tabular-nums">{{ room.number }}</TableCell>
                <TableCell class="text-sm">
                  <span class="font-medium">{{ room.buildingName }}</span>
                  <span class="text-muted-foreground"> · ชั้น {{ room.floor }} · {{ room.dormGroupName }}</span>
                </TableCell>
                <TableCell>{{ roomConfigLabel[room.config] }}</TableCell>
                <TableCell class="text-sm">{{ room.dimensions ?? 'ไม่มีข้อมูล' }}</TableCell>
                <TableCell>
                  <div class="space-y-1">
                    <RoomStatusBadge :status="room.publicStatus" />
                    <p v-if="room.blockedReason" class="text-xs text-muted-foreground">เหตุผล: {{ room.blockedReason }}</p>
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <Button size="sm" variant="ghost" @click="blockRoom(room.number)">
                    {{ room.publicStatus === 'unavailable' ? 'ปลด block' : 'Block' }}
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="!filteredRows.length">
                <TableCell :colspan="6" class="h-32 text-center text-muted-foreground">
                  ไม่พบห้องตามคำค้นหาและตัวกรองที่เลือก
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </PermissionGate>
  </div>
</template>
