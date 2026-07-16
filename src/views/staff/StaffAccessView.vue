<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { ShieldCheckIcon, UserCogIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { staffSectionMeta, users } from '@/fixtures'
import { useSessionStore } from '@/stores/session'
import { useStaffAccessStore } from '@/stores/staffAccess'
import type { StaffSection, User } from '@/types'

// ผู้ดูแลระบบกำหนดส่วนงานที่เจ้าหน้าที่แต่ละคนเข้าถึงได้
// เจ้าหน้าที่มีบทบาทเดียว ทำได้ทุกอย่างภายในส่วนงานที่เปิดให้
const session = useSessionStore()
const access = useStaffAccessStore()

const staffUsers = computed(() => users.filter(u => u.role === 'staff'))

function hasSection(user: User, section: StaffSection) {
  return access.sectionsFor(user).includes(section)
}

function toggle(user: User, section: StaffSection) {
  // เก็บค่าปัจจุบันก่อน toggle เพื่อใช้ในข้อความแจ้งเตือน
  const enabling = !hasSection(user, section)
  access.setSections(
    user.id,
    enabling
      ? [...access.sectionsFor(user), section]
      : access.sectionsFor(user).filter(s => s !== section),
  )
  const meta = staffSectionMeta.find(s => s.key === section)
  toast(`${enabling ? 'เปิด' : 'ปิด'}สิทธิ์ "${meta?.label}" ให้ ${user.displayName} — บันทึก audit event แล้ว`)
}

function sectionCount(user: User) {
  return access.sectionsFor(user).length
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="space-y-1">
      <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <UserCogIcon class="size-6 text-primary" aria-hidden="true" /> จัดการสิทธิ์เจ้าหน้าที่
      </h1>
      <p class="text-sm text-muted-foreground">
        เจ้าหน้าที่ทุกคนมีบทบาทเดียวกัน — ผู้ดูแลระบบเลือกได้ว่าแต่ละคนเข้าถึงส่วนงานใดบ้าง
        การเปิด/ปิดสิทธิ์มีผลกับเมนูและ permission ในส่วนงานนั้นทันที
      </p>
    </div>

    <Alert>
      <ShieldCheckIcon aria-hidden="true" />
      <AlertTitle>เข้าสู่ระบบเป็น {{ session.currentUser?.displayName }}</AlertTitle>
      <AlertDescription>
        การเปลี่ยนสิทธิ์ทุกครั้งต้องบันทึก audit event (ผู้กระทำ, เวลา, ก่อน/หลัง) — ต้นแบบนี้จำลองการบันทึกให้อัตโนมัติ
      </AlertDescription>
    </Alert>

    <Card v-for="u in staffUsers" :key="u.id">
      <CardHeader>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <CardTitle class="text-base">{{ u.displayName }}</CardTitle>
          <Badge :variant="sectionCount(u) ? 'secondary' : 'destructive'">
            {{ sectionCount(u) ? `เข้าถึงได้ ${sectionCount(u)} ส่วนงาน` : 'ยังไม่ได้รับสิทธิ์' }}
          </Badge>
        </div>
        <CardDescription>{{ u.email }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-2.5">
        <div
          v-for="s in staffSectionMeta"
          :key="s.key"
          class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ s.label }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ s.description }}</p>
          </div>
          <Switch
            :model-value="hasSection(u, s.key)"
            :aria-label="`สิทธิ์ ${s.label} ของ ${u.displayName}`"
            @update:model-value="toggle(u, s.key)"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
