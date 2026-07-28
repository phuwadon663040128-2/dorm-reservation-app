<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, UsersIcon, XIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StaffPageHeader from '@/components/domain/StaffPageHeader.vue'
import { users } from '@/fixtures'

const applicants = users.filter(u => u.role === 'applicant')
const PAGE_SIZE = 25

const searchQuery = ref('')
const currentPage = ref(1)

const filteredApplicants = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('th-TH')
  if (!query) return applicants
  return applicants.filter(u =>
    [u.displayName, u.email, u.studentId]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase('th-TH').includes(query)),
  )
})

const paginatedApplicants = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredApplicants.value.slice(start, start + PAGE_SIZE)
})

const visibleRangeStart = computed(() =>
  filteredApplicants.value.length ? (currentPage.value - 1) * PAGE_SIZE + 1 : 0,
)

const visibleRangeEnd = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, filteredApplicants.value.length),
)

watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="space-y-5">
    <StaffPageHeader
      title="ผู้สมัคร"
      description="บัญชีอีเมลที่ยืนยันแล้วใช้ได้ครบทุกขั้นตอน — การผูก KKU SSO เป็นทางเลือก ไม่ใช่เงื่อนไข"
      :icon="UsersIcon"
    />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <InputGroup class="w-full max-w-sm bg-card">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          v-model="searchQuery"
          placeholder="ค้นหาชื่อ อีเมล หรือรหัสนักศึกษา"
          aria-label="ค้นหาผู้สมัคร"
        />
        <InputGroupAddon v-if="searchQuery" align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="ล้างคำค้นหาผู้สมัคร"
            title="ล้างคำค้นหา"
            @click="searchQuery = ''"
          >
            <XIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p class="text-sm text-muted-foreground" aria-live="polite">
        แสดง
        <b class="tabular-nums text-foreground">{{ visibleRangeStart }}–{{ visibleRangeEnd }}</b>
        จาก
        <b class="tabular-nums text-foreground">{{ filteredApplicants.length.toLocaleString('th-TH') }}</b>
        รายการ
        <span v-if="filteredApplicants.length !== applicants.length">
          (ทั้งหมด {{ applicants.length.toLocaleString('th-TH') }} บัญชี)
        </span>
      </p>
    </div>

    <div class="data-table-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ชื่อ-สกุล</TableHead>
            <TableHead>อีเมล</TableHead>
            <TableHead>รหัสนักศึกษา</TableHead>
            <TableHead>โปรไฟล์</TableHead>
            <TableHead>KKU SSO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="u in paginatedApplicants" :key="u.id">
            <TableCell class="font-medium">{{ u.displayName }}</TableCell>
            <TableCell class="text-sm text-muted-foreground">{{ u.email }}</TableCell>
            <TableCell class="text-sm tabular-nums">{{ u.studentId ?? '—' }}</TableCell>
            <TableCell>
              <Badge :variant="u.profileComplete ? 'success' : 'destructive'">
                {{ u.profileComplete ? 'ครบถ้วน' : 'ยังไม่ครบ' }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge :variant="u.kkuSsoLinked ? 'info' : 'outline'">{{ u.kkuSsoLinked ? 'ผูกแล้ว' : 'ยังไม่ผูก' }}</Badge>
            </TableCell>
          </TableRow>
          <TableRow v-if="!filteredApplicants.length">
            <TableCell :colspan="5" class="h-28 text-center text-muted-foreground">
              ไม่พบผู้สมัครตามคำค้นหา
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div v-if="filteredApplicants.length > PAGE_SIZE" class="border-t px-3 py-3 sm:px-4">
        <Pagination
          v-slot="{ page }"
          v-model:page="currentPage"
          :items-per-page="PAGE_SIZE"
          :total="filteredApplicants.length"
          :sibling-count="1"
          show-edges
          aria-label="แบ่งหน้ารายชื่อผู้สมัคร"
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
</template>
