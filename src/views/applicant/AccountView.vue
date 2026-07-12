<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { BadgeCheckIcon, LinkIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const user = computed(() => session.currentUser)
</script>

<template>
  <div v-if="user" class="space-y-5">
    <h1 class="text-2xl font-bold">บัญชีของฉัน</h1>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">ข้อมูลโปรไฟล์</CardTitle>
        <CardDescription>
          โปรไฟล์ต้องครบถ้วนก่อนเชิญรูมเมทหรือจองห้อง
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-2 text-sm">
        <div class="flex justify-between gap-2"><span class="text-muted-foreground">ชื่อ-สกุล</span><span class="font-medium">{{ user.displayName }}</span></div>
        <div class="flex justify-between gap-2">
          <span class="text-muted-foreground">อีเมล</span>
          <span class="flex items-center gap-1 font-medium">
            {{ user.email }}
            <BadgeCheckIcon v-if="user.emailVerified" class="size-4 text-emerald-600" aria-hidden="true" />
          </span>
        </div>
        <div class="flex justify-between gap-2"><span class="text-muted-foreground">รหัสนักศึกษา</span><span class="font-medium">{{ user.studentId ?? 'ยังไม่ระบุ (ไม่บังคับ)' }}</span></div>
        <div class="flex justify-between gap-2"><span class="text-muted-foreground">เบอร์โทร</span><span class="font-medium">{{ user.phone ?? 'ยังไม่ระบุ' }}</span></div>
        <div class="flex justify-between gap-2">
          <span class="text-muted-foreground">ความครบถ้วนของโปรไฟล์</span>
          <Badge :variant="user.profileComplete ? 'secondary' : 'destructive'">
            {{ user.profileComplete ? 'ครบถ้วน' : 'ยังไม่ครบ' }}
          </Badge>
        </div>
        <Button v-if="!user.profileComplete" class="mt-2 w-full" @click="toast('ต้นแบบ: เปิดฟอร์มกรอกข้อมูลที่ขาด (เฟส P1)')">
          กรอกข้อมูลที่ขาด
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <LinkIcon class="size-4" aria-hidden="true" /> บัญชี KKU SSO
          <Badge variant="outline">ไม่บังคับ</Badge>
        </CardTitle>
        <CardDescription>
          การผูกบัญชี KKU ไม่มีผลต่อการจอง ชำระเงิน ลงนามสัญญา หรือรับกุญแจ —
          ผูกภายหลังได้โดยข้อมูลใบสมัคร/การจอง/สัญญาเดิมไม่เปลี่ยน
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between gap-2">
          <Badge :variant="user.kkuSsoLinked ? 'secondary' : 'outline'">
            {{ user.kkuSsoLinked ? 'ผูกบัญชีแล้ว' : 'ยังไม่ผูกบัญชี' }}
          </Badge>
          <Button
            v-if="!user.kkuSsoLinked"
            variant="outline"
            size="sm"
            @click="toast('ต้นแบบ: ไปหน้า KKU SSO เพื่อผูกบัญชี — หากข้อมูลไม่ตรงจะเข้าสู่การตรวจสอบโดยเจ้าหน้าที่')"
          >
            ผูกบัญชี KKU
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
