<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { MailCheckIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const email = computed(() => String(route.query.email || session.pendingEmailRegistration() || 'อีเมลที่สมัคร'))

function verifyAndContinue() {
  const user = session.completeEmailRegistration()
  if (!user) {
    toast.error('ไม่พบคำขอสมัครบัญชี กรุณากลับไปสมัครใหม่')
    router.push('/register')
    return
  }
  toast.success('ยืนยันอีเมลสำเร็จ — สร้างบัญชีผู้สมัครแล้ว')
  router.push('/app/application')
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-8">
    <Card>
      <CardContent class="space-y-4 p-8 text-center">
        <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheckIcon class="size-6" aria-hidden="true" />
        </div>
        <h1 class="text-xl font-bold">ตรวจสอบอีเมลของคุณ</h1>
        <p class="break-all text-sm font-medium">{{ email }}</p>
        <p class="text-sm text-muted-foreground">
          ต้องยืนยันอีเมลก่อนจึงจะส่งใบสมัคร เชิญรูมเมท หรือจองห้องได้ ในต้นแบบนี้กดปุ่มด้านล่างแทนการเปิดลิงก์จากอีเมล
        </p>
        <div class="flex flex-col gap-2">
          <Button variant="outline" @click="toast.success('ส่งอีเมลยืนยันแบบจำลองใหม่แล้ว')">ส่งอีเมลยืนยันอีกครั้ง</Button>
          <Button @click="verifyAndContinue">จำลองยืนยันอีเมลและเริ่มกรอกใบสมัคร</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
