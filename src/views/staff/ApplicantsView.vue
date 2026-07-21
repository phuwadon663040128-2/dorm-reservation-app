<script setup lang="ts">
import { computed, ref } from 'vue'
import { SearchIcon, UsersIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

const searchQuery = ref('')

const filteredApplicants = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('th-TH')
  if (!query) return applicants
  return applicants.filter(u =>
    [u.displayName, u.email, u.studentId]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase('th-TH').includes(query)),
  )
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
      <div class="relative w-full max-w-sm">
        <SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          v-model="searchQuery"
          class="bg-card pl-8"
          placeholder="ค้นหาชื่อ อีเมล หรือรหัสนักศึกษา"
          aria-label="ค้นหาผู้สมัคร"
        />
      </div>
      <p class="text-sm text-muted-foreground" aria-live="polite">
        แสดง <b class="tabular-nums text-foreground">{{ filteredApplicants.length }}</b>
        จาก {{ applicants.length }} บัญชี
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
          <TableRow v-for="u in filteredApplicants" :key="u.id">
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
    </div>
  </div>
</template>
