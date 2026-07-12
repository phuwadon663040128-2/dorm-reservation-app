<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ShieldIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDormStore } from '@/stores/dorm'

const route = useRoute()
const dorm = useDormStore()
const campaign = computed(() => dorm.campaignById(String(route.params.id)))
</script>

<template>
  <div v-if="campaign" class="mx-auto max-w-3xl space-y-6">
    <div class="space-y-2">
      <Badge :variant="campaign.status === 'open' ? 'default' : 'outline'">
        {{ campaign.status === 'open' ? 'เปิดรับสมัคร' : campaign.status === 'upcoming' ? 'ยังไม่เปิด' : 'ปิดรับแล้ว' }}
      </Badge>
      <h1 class="text-2xl font-bold">{{ campaign.name }}</h1>
      <p class="text-muted-foreground">
        รับสมัคร {{ campaign.openDate }} – {{ campaign.closeDate }} · สัญญา{{ campaign.contractPeriod }}
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">เงื่อนไขสำคัญของรอบนี้</CardTitle>
        <CardDescription>
          คำเชิญรูมเมทมีอายุ {{ campaign.invitationHours }} ชม. ·
          {{ campaign.roommateRoomConfirmationRequired
            ? `รูมเมทต้องยืนยันห้องภายใน ${campaign.roomConfirmationMinutes} นาที`
            : 'ไม่ต้องมีการยืนยันห้องรอบสอง' }} ·
          ชำระเงินภายใน {{ campaign.paymentHoldHours }} ชม. หลังห้องถูกล็อก
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul class="list-disc space-y-1.5 pl-5 text-sm">
          <li v-for="note in campaign.policyNotes" :key="note">{{ note }}</li>
        </ul>
      </CardContent>
    </Card>

    <!-- Privacy notice ก่อนเก็บข้อมูล (PDPA §23, doc 14) -->
    <Alert>
      <ShieldIcon aria-hidden="true" />
      <AlertTitle>ประกาศความเป็นส่วนตัว (Privacy Notice)</AlertTitle>
      <AlertDescription>
        ระบบเก็บข้อมูลส่วนบุคคลเท่าที่จำเป็นต่อการสมัคร จอง ชำระเงิน และทำสัญญาหอพัก
        โดยเปิดเผยเฉพาะแก่เจ้าหน้าที่ที่มีสิทธิ์และ workflow ธนาคาร/มหาวิทยาลัยที่เกี่ยวข้องเท่านั้น
        อ่านฉบับเต็มได้ก่อนกดยืนยันใบสมัคร — ติดต่อ {{ campaign.contact }}
      </AlertDescription>
    </Alert>

    <div class="flex flex-wrap gap-3">
      <Button as-child size="lg" :disabled="campaign.status !== 'open'">
        <RouterLink to="/register">เริ่มสมัคร / เข้าสู่ระบบ</RouterLink>
      </Button>
      <Button as-child size="lg" variant="outline">
        <RouterLink to="/rooms">ดูห้องว่างก่อน</RouterLink>
      </Button>
    </div>
  </div>
  <div v-else class="py-16 text-center text-muted-foreground">
    ไม่พบรอบรับสมัครนี้ — <RouterLink to="/" class="text-primary underline">กลับหน้าแรก</RouterLink>
  </div>
</template>
