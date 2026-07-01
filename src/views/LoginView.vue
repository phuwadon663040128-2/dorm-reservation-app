<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Building, Eye, EyeOff, Lock, User } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type UserRole = 'applicant' | 'admin'

interface TestAccount {
  label: string
  description: string
  username: string
  password: string
  role: UserRole
  appId?: string
  displayName: string
  identifier: string
  unit: string
}

const emit = defineEmits<{
  (e: 'login', payload: {
    role: UserRole
    username: string
    displayName: string
    identifier: string
    unit: string
    activeAppId?: string
  }): void
  (e: 'showToast', msg: string): void
}>()

const loginRole = ref<UserRole>('applicant')
const username = ref('')
const password = ref('')
const showPassword = ref(false)

const testAccounts: TestAccount[] = [
  {
    label: 'สมศรี ดีเลิศ',
    description: 'ผู้สมัคร - รอตรวจสลิป',
    username: '653020222-3',
    password: '1234',
    role: 'applicant',
    appId: 'APP-001095',
    displayName: 'นางสาวสมศรี ดีเลิศ',
    identifier: '653020222-3',
    unit: 'คณะแพทยศาสตร์',
  },
  {
    label: 'สมชาย รักดี',
    description: 'ผู้สมัคร - ยืนยันสิทธิ์แล้ว',
    username: '643020111-2',
    password: '1234',
    role: 'applicant',
    appId: 'APP-001042',
    displayName: 'นายสมชาย รักดี',
    identifier: '643020111-2',
    unit: 'คณะวิศวกรรมศาสตร์',
  },
  {
    label: 'กัญญา พรหมดี',
    description: 'ผู้สมัคร - รอชำระเงิน',
    username: '643020444-1',
    password: '1234',
    role: 'applicant',
    appId: 'APP-001150',
    displayName: 'นางสาวกัญญา พรหมดี',
    identifier: '643020444-1',
    unit: 'คณะมนุษยศาสตร์ฯ',
  },
  {
    label: 'Dorm Operations',
    description: 'เจ้าหน้าที่ฝ่ายหอพัก',
    username: 'staff.dorm',
    password: '1234',
    role: 'admin',
    displayName: 'เจ้าหน้าที่ฝ่ายหอพัก',
    identifier: 'STAFF-DORM-001',
    unit: 'กองบริการหอพักนักศึกษา',
  },
]

const visibleAccounts = computed(() => testAccounts.filter(acc => acc.role === loginRole.value))

const usernameLabel = computed(() => loginRole.value === 'admin' ? 'บัญชีเจ้าหน้าที่' : 'รหัสนักศึกษา')
const usernamePlaceholder = computed(() => loginRole.value === 'admin' ? 'staff.dorm' : '653020XXX-X')

function useShortcut(acc: TestAccount) {
  loginRole.value = acc.role
  username.value = acc.username
  password.value = acc.password
  handleLogin()
}

function handleLogin() {
  const cleanUsername = username.value.trim()
  const authUsername = loginRole.value === 'admin' && cleanUsername === 'admin' ? 'staff.dorm' : cleanUsername

  if (!cleanUsername || !password.value) {
    emit('showToast', 'กรุณากรอกบัญชีผู้ใช้และรหัสผ่าน')
    return
  }

  if (password.value !== '1234') {
    emit('showToast', 'รหัสผ่านไม่ถูกต้อง (รหัสทดสอบคือ 1234)')
    return
  }

  const matchingAcc = testAccounts.find(acc => acc.username === authUsername && acc.role === loginRole.value)

  if (!matchingAcc && loginRole.value === 'admin') {
    emit('showToast', 'ไม่พบบัญชีเจ้าหน้าที่ในระบบจำลอง')
    return
  }

  const account: TestAccount = matchingAcc || {
    label: 'บัญชีนักศึกษา',
    description: 'ผู้สมัครใหม่',
    username: cleanUsername,
    password: password.value,
    role: 'applicant',
    displayName: 'นักศึกษา มข.',
    identifier: cleanUsername,
    unit: 'Khon Kaen University',
  }

  emit('login', {
    role: account.role,
    username: account.username,
    displayName: account.displayName,
    identifier: account.identifier,
    unit: account.unit,
    activeAppId: account.appId,
  })
  emit('showToast', account.role === 'admin' ? 'เข้าสู่ระบบเจ้าหน้าที่สำเร็จ' : 'เข้าสู่ระบบผู้สมัครสำเร็จ')
}
</script>

<template>
  <div class="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-10">
    <div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-screen-xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_28rem]">
      <section class="space-y-8">
        <div class="flex items-center gap-3">
          <div class="flex size-12 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
            <Building class="size-6" />
          </div>
          <div>
            <p class="text-sm font-semibold">Khon Kaen University</p>
            <p class="text-xs text-muted-foreground">Affiliated Dorm Reservation</p>
          </div>
        </div>

        <div class="max-w-2xl space-y-4">
          <Badge variant="secondary">ระบบจำลองบัญชีมหาวิทยาลัย</Badge>
          <h1 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            ระบบรับสมัครและจองหอพักในกำกับ มข.
          </h1>
          <p class="max-w-xl text-sm leading-6 text-muted-foreground">
            เข้าสู่ระบบด้วยบัญชีทดสอบเพื่อดู workflow ตามบทบาทผู้สมัครหรือเจ้าหน้าที่ โดยไม่มีปุ่มสลับ role หลังจากเข้าสู่ระบบ
          </p>
        </div>

        <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
          <Card class="shadow-sm">
            <CardHeader class="pb-3">
              <CardTitle class="text-sm">ผู้สมัคร</CardTitle>
              <CardDescription>ติดตามใบสมัคร ชำระเงิน และสถานะการจอง</CardDescription>
            </CardHeader>
          </Card>
          <Card class="shadow-sm">
            <CardHeader class="pb-3">
              <CardTitle class="text-sm">เจ้าหน้าที่</CardTitle>
              <CardDescription>ตรวจสลิป อนุมัติใบสมัคร และดูรายงาน</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section class="w-full">
        <Card class="shadow-sm">
          <CardHeader class="space-y-3">
            <div>
              <CardTitle class="text-xl">เข้าสู่ระบบ</CardTitle>
              <CardDescription>เลือกประเภทบัญชีเพื่อเข้า template ของ role นั้น</CardDescription>
            </div>
            <Alert>
              <AlertTitle>ข้อมูลสำหรับทดสอบ</AlertTitle>
              <AlertDescription>
                รหัสผ่านทุกบัญชีคือ 1234 และข้อมูล mock จะรีเซ็ตเมื่อออกจากระบบ
              </AlertDescription>
            </Alert>
          </CardHeader>

          <CardContent class="space-y-6">
            <Tabs v-model="loginRole" class="w-full">
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="applicant">ผู้สมัคร</TabsTrigger>
                <TabsTrigger value="admin">เจ้าหน้าที่</TabsTrigger>
              </TabsList>

              <TabsContent value="applicant" class="mt-4 space-y-4">
                <form class="space-y-4" @submit.prevent="handleLogin">
                  <Field>
                    <FieldLabel for="username-applicant">{{ usernameLabel }}</FieldLabel>
                    <div class="relative">
                      <User class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="username-applicant"
                        v-model="username"
                        type="text"
                        :placeholder="usernamePlaceholder"
                        class="pl-9"
                        autocomplete="username"
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel for="password-applicant">รหัสผ่าน</FieldLabel>
                    <div class="relative">
                      <Lock class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password-applicant"
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="1234"
                        class="pl-9 pr-10"
                        autocomplete="current-password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        class="absolute right-1 top-1/2 -translate-y-1/2"
                        @click="showPassword = !showPassword"
                      >
                        <component :is="showPassword ? EyeOff : Eye" class="size-4" />
                      </Button>
                    </div>
                  </Field>

                  <Button type="submit" size="lg" class="w-full justify-center">
                    เข้าสู่ระบบผู้สมัคร
                    <ArrowRight class="size-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" class="mt-4 space-y-4">
                <form class="space-y-4" @submit.prevent="handleLogin">
                  <Field>
                    <FieldLabel for="username-admin">{{ usernameLabel }}</FieldLabel>
                    <div class="relative">
                      <User class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="username-admin"
                        v-model="username"
                        type="text"
                        :placeholder="usernamePlaceholder"
                        class="pl-9"
                        autocomplete="username"
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel for="password-admin">รหัสผ่าน</FieldLabel>
                    <div class="relative">
                      <Lock class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password-admin"
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="1234"
                        class="pl-9 pr-10"
                        autocomplete="current-password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        class="absolute right-1 top-1/2 -translate-y-1/2"
                        @click="showPassword = !showPassword"
                      >
                        <component :is="showPassword ? EyeOff : Eye" class="size-4" />
                      </Button>
                    </div>
                  </Field>

                  <Button type="submit" size="lg" class="w-full justify-center">
                    เข้าสู่ระบบเจ้าหน้าที่
                    <ArrowRight class="size-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator />

            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase text-muted-foreground">บัญชีทดสอบ</p>
                <Badge variant="secondary">{{ loginRole === 'admin' ? 'Staff' : 'Student' }}</Badge>
              </div>
              <div class="grid gap-2">
                <Button
                  v-for="acc in visibleAccounts"
                  :key="acc.username"
                  type="button"
                  variant="outline"
                  class="h-auto w-full justify-between gap-3 whitespace-normal px-3 py-2 text-left"
                  @click="useShortcut(acc)"
                >
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-medium">{{ acc.label }}</span>
                    <span class="block truncate text-xs text-muted-foreground">{{ acc.description }}</span>
                  </span>
                  <Badge variant="secondary" class="shrink-0 font-mono">{{ acc.identifier }}</Badge>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  </div>
</template>
