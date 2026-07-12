<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { MailCheckIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
</script>

<template>
  <div class="mx-auto max-w-md">
    <Card>
      <CardContent class="space-y-4 p-8 text-center">
        <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheckIcon class="size-6" aria-hidden="true" />
        </div>
        <h1 class="text-xl font-bold">ตรวจสอบอีเมลของคุณ</h1>
        <p class="text-sm text-muted-foreground">
          เราส่งลิงก์ยืนยันไปที่อีเมลที่คุณสมัครไว้ — ต้องยืนยันอีเมลก่อนจึงจะส่งใบสมัคร
          เชิญรูมเมท หรือจองห้องได้ (บันทึกร่างข้อมูลไว้ให้ระหว่างรอ)
        </p>
        <div class="flex flex-col gap-2">
          <Button variant="outline" @click="toast('ต้นแบบ: ส่งอีเมลยืนยันใหม่แล้ว')">ส่งอีเมลยืนยันอีกครั้ง</Button>
          <Button as-child>
            <RouterLink to="/login">ยืนยันแล้ว — เข้าสู่ระบบ</RouterLink>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
