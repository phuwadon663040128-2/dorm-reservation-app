<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { users } from '@/fixtures'

const applicants = users.filter(u => u.role === 'applicant')
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">ผู้สมัคร</h1>
      <p class="text-sm text-muted-foreground">
        บัญชีอีเมลที่ยืนยันแล้วใช้ได้ครบทุกขั้นตอน — การผูก KKU SSO เป็นทางเลือก ไม่ใช่เงื่อนไข
      </p>
    </div>

    <div class="overflow-x-auto rounded-md border">
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
          <TableRow v-for="u in applicants" :key="u.id">
            <TableCell class="font-medium">{{ u.displayName }}</TableCell>
            <TableCell class="text-sm text-muted-foreground">{{ u.email }}</TableCell>
            <TableCell class="text-sm">{{ u.studentId ?? '—' }}</TableCell>
            <TableCell>
              <Badge :variant="u.profileComplete ? 'secondary' : 'destructive'">
                {{ u.profileComplete ? 'ครบถ้วน' : 'ยังไม่ครบ' }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{{ u.kkuSsoLinked ? 'ผูกแล้ว' : 'ยังไม่ผูก' }}</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
