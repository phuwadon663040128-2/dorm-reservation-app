<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ShieldIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const session = useSessionStore()

const email = ref('')
const password = ref('')
const acceptedNotice = ref(false)
const error = ref('')

function submit() {
  error.value = ''
  if (!email.value.includes('@')) {
    error.value = 'กรุณากรอกอีเมลให้ถูกต้อง'
    return
  }
  if (password.value.length < 8) {
    error.value = 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (!acceptedNotice.value) {
    error.value = 'กรุณาอ่านและรับทราบประกาศความเป็นส่วนตัวก่อนสมัคร'
    return
  }
  session.beginEmailRegistration(email.value)
  toast.success('ส่งลิงก์ยืนยันอีเมลแบบจำลองแล้ว')
  router.push({ path: '/verify-email', query: { email: email.value.trim().toLowerCase() } })
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6 px-4 py-8">
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-bold">สมัครสมาชิกด้วยอีเมลส่วนตัว</h1>
      <p class="text-sm text-muted-foreground">
        นักศึกษาใหม่ที่ยังไม่ได้รับบัญชี KKU สมัครและจองห้องได้ทันที — ผูกบัญชี KKU ภายหลังได้โดยข้อมูลเดิมไม่หาย
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">ข้อมูลบัญชี</CardTitle>
        <CardDescription>ต้องยืนยันอีเมลก่อนจึงจะส่งใบสมัคร/เชิญรูมเมทได้</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-1.5">
          <Label for="email">อีเมล</Label>
          <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" />
        </div>
        <div class="space-y-1.5">
          <Label for="password">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</Label>
          <Input id="password" v-model="password" type="password" autocomplete="new-password" />
        </div>

        <!-- PDPA: แจ้งก่อนเก็บข้อมูล และไม่ใช้ checkbox เดียวครอบทุกอย่าง (doc 14) -->
        <Alert>
          <ShieldIcon aria-hidden="true" />
          <AlertTitle>ประกาศความเป็นส่วนตัว</AlertTitle>
          <AlertDescription>
            ระบบเก็บข้อมูลเท่าที่จำเป็นต่อการสมัครและจองหอพัก ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            <a href="#" class="underline">อ่านประกาศฉบับเต็ม</a>
          </AlertDescription>
        </Alert>
        <div class="flex items-start gap-2">
          <Checkbox id="notice" v-model="acceptedNotice" class="mt-0.5" />
          <Label for="notice" class="text-sm font-normal leading-snug">
            ข้าพเจ้าได้อ่านและรับทราบประกาศความเป็นส่วนตัวแล้ว
          </Label>
        </div>

        <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

        <Button class="w-full" @click="submit">สมัครสมาชิก</Button>
        <p class="text-center text-xs text-muted-foreground">
          มีบัญชีแล้ว? <RouterLink to="/login" class="text-primary underline">เข้าสู่ระบบ</RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
