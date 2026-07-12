<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { KeyRoundIcon, UserIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { users } from '@/fixtures'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()

// ต้นแบบ: เลือกบัญชีสมมติเพื่อเดินชม workflow แต่ละมุมมอง
const applicantAccounts = users.filter(u => u.role === 'applicant')
const staffAccounts = users.filter(u => u.role !== 'applicant')

const accountHint: Record<string, string> = {
  'applicant-a': 'หัวหน้ากลุ่ม — จ่ายครบ รอรูมเมท',
  'applicant-b': 'รูมเมท — จ่าย ROOM แล้ว ค้าง HL',
  'applicant-c': 'โปรไฟล์ยังไม่ครบ',
  'applicant-d': 'หัวหน้ากลุ่ม — รอรูมเมทยืนยันห้อง (15 นาที)',
  'applicant-h': 'รูมเมท — ต้องยืนยันห้องภายใน 15 นาที',
  'applicant-e': 'เหมาห้อง — ยืนยันแล้ว รอรับกุญแจ',
  'applicant-f': 'ลงนามสัญญาแล้ว (กลุ่มยังไม่ครบ)',
  'applicant-g': 'ยังไม่ส่งสัญญาที่ลงนาม',
  'staff-dorm': 'สิทธิ์จัดการห้อง/จองแทน',
  'staff-manager': 'ผู้จัดการหอ + ดู audit',
  'staff-finance': 'สิทธิ์ export / นำเข้า PDF / ผลชำระ',
  'staff-contract': 'สิทธิ์สัญญา + ส่งมอบกุญแจ',
  'staff-admin': 'ส่งข้อมูลมหาวิทยาลัย + audit',
  'staff-unauthorized': 'ไม่มีสิทธิ์ใด ๆ (ทดสอบจอ denied)',
}

function signIn(userId: string) {
  const user = session.login(userId)
  if (!user) return
  toast(`เข้าสู่ระบบเป็น ${user.displayName}`)
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  router.push(redirect ?? (session.isStaff ? '/staff' : '/app'))
}

function ssoSignIn() {
  toast('ต้นแบบ: จะพาไปหน้า KKU SSO — การผูกบัญชี KKU เป็นทางเลือก ไม่บังคับต่อการจอง/ทำสัญญา')
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-bold">เข้าสู่ระบบ</h1>
      <p class="text-sm text-muted-foreground">
        ต้นแบบระบบ — เลือกบัญชีสมมติด้านล่างเพื่อเดินชมแต่ละสถานการณ์
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <UserIcon class="size-4" aria-hidden="true" /> ผู้สมัคร / ผู้พัก
        </CardTitle>
        <CardDescription>บัญชีอีเมลส่วนตัวที่ยืนยันแล้วใช้ได้ครบทุกขั้นตอน — ไม่ต้องมีบัญชี KKU</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-2 sm:grid-cols-2">
        <Button
          v-for="u in applicantAccounts"
          :key="u.id"
          variant="outline"
          class="h-auto justify-start py-2 text-left"
          @click="signIn(u.id)"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">{{ u.displayName }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ accountHint[u.id] }}</p>
          </div>
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <KeyRoundIcon class="size-4" aria-hidden="true" /> เจ้าหน้าที่
        </CardTitle>
        <CardDescription>สิทธิ์แต่ละด้านแยกอิสระ (RBAC) — การเงินไม่เห็นเมนูสัญญา ฯลฯ</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-2 sm:grid-cols-2">
        <Button
          v-for="u in staffAccounts"
          :key="u.id"
          variant="outline"
          class="h-auto justify-start py-2 text-left"
          @click="signIn(u.id)"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">{{ u.displayName }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ accountHint[u.id] }}</p>
          </div>
        </Button>
      </CardContent>
    </Card>

    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <Separator class="flex-1" />
        <span class="text-xs text-muted-foreground">หรือ</span>
        <Separator class="flex-1" />
      </div>
      <div class="flex flex-col items-center gap-2">
        <Button variant="secondary" class="w-full sm:w-auto" @click="ssoSignIn">
          เข้าสู่ระบบด้วย KKU SSO
          <Badge variant="outline" class="ml-1">ไม่บังคับ</Badge>
        </Button>
        <p class="text-center text-xs text-muted-foreground">
          ยังไม่มีบัญชี? <RouterLink to="/register" class="text-primary underline">สมัครด้วยอีเมลส่วนตัว</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
