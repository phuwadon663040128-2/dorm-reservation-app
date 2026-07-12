<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { UsersIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import HoldCountdown from '@/components/domain/HoldCountdown.vue'
import { invitationStatusLabel, roommateGroupStatusLabel } from '@/lib/labels'
import { users } from '@/fixtures'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const reservation = useReservationStore()

const myGroup = computed(() => reservation.myRoommateGroup)
const myInvitations = computed(() => reservation.myInvitations)

function nameOf(userId: string) {
  return users.find(u => u.id === userId)?.displayName ?? userId
}

function sendInvitation() {
  toast('ต้นแบบ: จะเปิดฟอร์มค้นหาเพื่อนที่โปรไฟล์ครบเพื่อส่งคำเชิญ (อายุ 48 ชม.) — เฟส P3')
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">รูมเมท</h1>
      <p class="text-sm text-muted-foreground">
        กติกา: โปรไฟล์ทั้งคู่ต้องครบ · กลุ่มละไม่เกิน 2 คน · 1 คนมีได้ 1 คำเชิญ/กลุ่มที่ใช้งานอยู่ ·
        ต้องตอบรับคำเชิญก่อนเลือกห้อง
      </p>
    </div>

    <!-- สถานะกลุ่มปัจจุบัน -->
    <Card v-if="myGroup">
      <CardHeader>
        <div class="flex items-center justify-between gap-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <UsersIcon class="size-4" aria-hidden="true" /> กลุ่มของฉัน
          </CardTitle>
          <Badge>{{ roommateGroupStatusLabel[myGroup.status] }}</Badge>
        </div>
        <CardDescription>
          หัวหน้ากลุ่ม (ผู้กดจองห้อง): {{ nameOf(myGroup.leaderId) }}
          <template v-if="myGroup.leaderId === session.currentUser?.id"> — คือคุณ</template>
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <ul class="space-y-1 text-sm">
          <li v-for="m in myGroup.memberIds" :key="m" class="flex items-center gap-2">
            <span class="font-medium">{{ nameOf(m) }}</span>
            <Badge v-if="m === myGroup.leaderId" variant="outline">หัวหน้ากลุ่ม</Badge>
          </li>
        </ul>
        <!-- กรณีรอรูมเมทยืนยันห้อง: แสดง countdown 15 นาที -->
        <template v-if="myGroup.status === 'room_confirmation_pending' && reservation.myReservation?.confirmationDeadline">
          <HoldCountdown
            :expires-at="reservation.myReservation.confirmationDeadline"
            label="รูมเมทต้องยืนยันห้องภายใน"
          />
          <div v-if="session.currentUser?.id !== myGroup.leaderId" class="flex gap-2">
            <Button @click="toast('ต้นแบบ: ยืนยันห้อง — กลุ่มจะเข้าสู่ payment hold 72 ชม. (เฟส P3)')">
              ยืนยันห้อง {{ reservation.myReservation?.roomNumber }}
            </Button>
            <Button variant="outline" @click="toast('ต้นแบบ: ปฏิเสธ — ห้องจะถูกปล่อยคืนทันที (เฟส P3)')">
              ปฏิเสธ
            </Button>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- ยังไม่มีกลุ่ม -->
    <Card v-else>
      <CardContent class="space-y-3 p-6 text-center">
        <p class="font-medium">ยังไม่มีกลุ่มรูมเมท</p>
        <p class="text-sm text-muted-foreground">
          ส่งคำเชิญถึงเพื่อนเพื่อพักคู่ หรือข้ามขั้นตอนนี้หากต้องการเหมาห้องพักคนเดียว
        </p>
        <div class="flex justify-center gap-2">
          <Button :disabled="!session.currentUser?.profileComplete" @click="sendInvitation">
            ส่งคำเชิญรูมเมท
          </Button>
          <Button as-child variant="outline">
            <RouterLink to="/app/rooms">เหมาห้อง — ไปเลือกห้องเลย</RouterLink>
          </Button>
        </div>
        <p v-if="!session.currentUser?.profileComplete" class="text-xs text-destructive">
          ต้องกรอกโปรไฟล์ให้ครบก่อนส่งคำเชิญ
        </p>
      </CardContent>
    </Card>

    <!-- ประวัติคำเชิญ -->
    <Card v-if="myInvitations.length">
      <CardHeader>
        <CardTitle class="text-base">คำเชิญของฉัน</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-2 text-sm">
          <li v-for="inv in myInvitations" :key="inv.id" class="flex flex-wrap items-center justify-between gap-2">
            <span>
              {{ nameOf(inv.leaderId) }} → {{ nameOf(inv.inviteeId) }}
            </span>
            <Badge :variant="inv.status === 'accepted' ? 'secondary' : 'outline'">
              {{ invitationStatusLabel[inv.status] }}
            </Badge>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
