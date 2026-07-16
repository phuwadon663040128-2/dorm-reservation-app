<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ExternalLinkIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { realPlanUrl } from '@/lib/floorPlan'
import type { Building } from '@/types'

// Modal แสดงผังจริงของ หอ/ชั้น ที่ผู้สมัครกำลังดู (รูปแปลงจาก PDF ต้นฉบับ)
const props = defineProps<{ building: Building | null; floor: number | null }>()
const open = defineModel<boolean>('open', { required: true })

const planUrl = computed(() =>
  props.building && props.floor !== null ? realPlanUrl(props.building, props.floor) : '',
)

// รีเซ็ตสถานะรูปเมื่อเปลี่ยนหอ/ชั้น
const imageFailed = ref(false)
watch(planUrl, () => { imageFailed.value = false })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>ผังจริง — {{ building?.name }} ชั้น {{ floor }}</DialogTitle>
        <DialogDescription>
          ผังห้องตามแบบแปลนจริงของอาคาร ใช้ดูตำแหน่งและทิศทางห้องประกอบการเลือก
        </DialogDescription>
      </DialogHeader>

      <div v-if="planUrl && !imageFailed" class="space-y-2">
        <div class="overflow-auto rounded-lg border bg-white">
          <img
            :src="planUrl"
            :alt="`ผังจริง ${building?.name} ชั้น ${floor}`"
            class="w-full min-w-160 object-contain"
            @error="imageFailed = true"
          />
        </div>
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs text-muted-foreground">เลื่อน/ซูมรูปได้ — สถานะว่างล่าสุดดูจากผังเลือกห้อง</p>
          <Button variant="outline" size="sm" as-child>
            <a :href="planUrl" target="_blank" rel="noopener">
              <ExternalLinkIcon aria-hidden="true" /> เปิดภาพเต็ม
            </a>
          </Button>
        </div>
      </div>

      <p v-else class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีผังจริงของชั้นนี้ในระบบ
      </p>
    </DialogContent>
  </Dialog>
</template>
