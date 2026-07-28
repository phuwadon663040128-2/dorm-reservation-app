<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ExternalLinkIcon,
  Maximize2Icon,
  MinusIcon,
  MoveIcon,
  PlusIcon,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { Skeleton } from '@/components/ui/skeleton'
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

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.5

const imageFailed = ref(false)
const imageLoaded = ref(false)
const viewer = ref<HTMLElement | null>(null)
const zoom = ref(MIN_ZOOM)
const pan = ref({ x: 0, y: 0 })
const pointers = new Map<number, { x: number; y: number }>()
const activePointerCount = ref(0)
const lastPanPoint = ref<{ x: number; y: number } | null>(null)
const pinch = ref<{
  distance: number
  midpoint: { x: number; y: number }
  zoom: number
  pan: { x: number; y: number }
} | null>(null)

const transformStyle = computed(() => ({
  transform: `translate3d(${pan.value.x}px, ${pan.value.y}px, 0) scale(${zoom.value})`,
}))

const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`)
const isPanning = computed(() => activePointerCount.value > 0 && zoom.value > MIN_ZOOM)

function resetViewer() {
  zoom.value = MIN_ZOOM
  pan.value = { x: 0, y: 0 }
  pointers.clear()
  activePointerCount.value = 0
  lastPanPoint.value = null
  pinch.value = null
}

function onImageError() {
  imageLoaded.value = true
  imageFailed.value = true
}

function clampPan(next: { x: number; y: number }, scale = zoom.value) {
  const rect = viewer.value?.getBoundingClientRect()
  if (!rect || scale <= MIN_ZOOM) return { x: 0, y: 0 }
  const maxX = (rect.width * (scale - MIN_ZOOM)) / 2
  const maxY = (rect.height * (scale - MIN_ZOOM)) / 2
  return {
    x: Math.min(maxX, Math.max(-maxX, next.x)),
    y: Math.min(maxY, Math.max(-maxY, next.y)),
  }
}

function setZoom(nextZoom: number, focalPoint = { x: 0, y: 0 }) {
  const previousZoom = zoom.value
  const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
  if (clampedZoom === previousZoom) return

  const ratio = clampedZoom / previousZoom
  zoom.value = clampedZoom
  pan.value = clampPan({
    x: focalPoint.x - (focalPoint.x - pan.value.x) * ratio,
    y: focalPoint.y - (focalPoint.y - pan.value.y) * ratio,
  }, clampedZoom)
}

function zoomIn() {
  setZoom(zoom.value + ZOOM_STEP)
}

function zoomOut() {
  setZoom(zoom.value - ZOOM_STEP)
}

function pointInViewer(clientX: number, clientY: number) {
  const rect = viewer.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return {
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2,
  }
}

function distanceBetween(points: { x: number; y: number }[]) {
  const [first, second] = points
  if (!first || !second) return 0
  return Math.hypot(second.x - first.x, second.y - first.y)
}

function midpointBetween(points: { x: number; y: number }[]) {
  const [first, second] = points
  if (!first || !second) return { x: 0, y: 0 }
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  }
}

function beginPinch() {
  const points = [...pointers.values()].slice(0, 2)
  if (points.length < 2) return
  pinch.value = {
    distance: distanceBetween(points),
    midpoint: midpointBetween(points),
    zoom: zoom.value,
    pan: { ...pan.value },
  }
  lastPanPoint.value = null
}

function onPointerDown(event: PointerEvent) {
  if (!viewer.value) return
  viewer.value.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  activePointerCount.value = pointers.size

  if (pointers.size === 1) {
    lastPanPoint.value = { x: event.clientX, y: event.clientY }
  } else if (pointers.size === 2) {
    beginPinch()
  }
}

function onPointerMove(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointers.size >= 2 && pinch.value) {
    const points = [...pointers.values()].slice(0, 2)
    const currentDistance = distanceBetween(points)
    const currentMidpoint = midpointBetween(points)
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, pinch.value.zoom * (currentDistance / Math.max(1, pinch.value.distance))),
    )
    const ratio = nextZoom / pinch.value.zoom
    const startFocal = pointInViewer(pinch.value.midpoint.x, pinch.value.midpoint.y)
    const midpointDelta = {
      x: currentMidpoint.x - pinch.value.midpoint.x,
      y: currentMidpoint.y - pinch.value.midpoint.y,
    }

    zoom.value = nextZoom
    pan.value = clampPan({
      x: startFocal.x + midpointDelta.x - (startFocal.x - pinch.value.pan.x) * ratio,
      y: startFocal.y + midpointDelta.y - (startFocal.y - pinch.value.pan.y) * ratio,
    }, nextZoom)
    return
  }

  if (pointers.size === 1 && lastPanPoint.value && zoom.value > MIN_ZOOM) {
    pan.value = clampPan({
      x: pan.value.x + event.clientX - lastPanPoint.value.x,
      y: pan.value.y + event.clientY - lastPanPoint.value.y,
    })
    lastPanPoint.value = { x: event.clientX, y: event.clientY }
  }
}

function onPointerEnd(event: PointerEvent) {
  pointers.delete(event.pointerId)
  activePointerCount.value = pointers.size
  if (viewer.value?.hasPointerCapture(event.pointerId)) {
    viewer.value.releasePointerCapture(event.pointerId)
  }

  if (pointers.size === 1) {
    const remaining = [...pointers.values()][0]
    lastPanPoint.value = remaining ? { ...remaining } : null
    pinch.value = null
  } else if (pointers.size === 0) {
    lastPanPoint.value = null
    pinch.value = null
  } else {
    beginPinch()
  }
}

function onWheel(event: WheelEvent) {
  // ปล่อยการเลื่อนปกติไว้ แต่รองรับ pinch-to-zoom ของ trackpad ซึ่งเบราว์เซอร์ส่งมาพร้อม Ctrl
  if (!event.ctrlKey) return
  event.preventDefault()
  const focal = pointInViewer(event.clientX, event.clientY)
  setZoom(zoom.value + (event.deltaY < 0 ? 0.25 : -0.25), focal)
}

function onDoubleClick(event: MouseEvent) {
  if (zoom.value > MIN_ZOOM) {
    resetViewer()
    return
  }
  setZoom(2, pointInViewer(event.clientX, event.clientY))
}

function onViewerKeydown(event: KeyboardEvent) {
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomIn()
    return
  }
  if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    zoomOut()
    return
  }
  if (event.key === '0') {
    event.preventDefault()
    resetViewer()
    return
  }
  if (zoom.value <= MIN_ZOOM) return

  const step = event.shiftKey ? 60 : 24
  const movement: Record<string, { x: number; y: number }> = {
    ArrowLeft: { x: step, y: 0 },
    ArrowRight: { x: -step, y: 0 },
    ArrowUp: { x: 0, y: step },
    ArrowDown: { x: 0, y: -step },
  }
  const delta = movement[event.key]
  if (!delta) return
  event.preventDefault()
  pan.value = clampPan({
    x: pan.value.x + delta.x,
    y: pan.value.y + delta.y,
  })
}

// เปลี่ยนอาคาร/ชั้นหรือเปิด dialog ใหม่ต้องกลับมาเห็นแบบแปลนครบก่อนเสมอ
watch(planUrl, () => {
  imageFailed.value = false
  imageLoaded.value = false
  resetViewer()
})
watch(open, (isOpen) => {
  if (isOpen) {
    imageLoaded.value = false
    resetViewer()
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] gap-3 overflow-y-auto p-3 sm:max-w-4xl sm:gap-4 sm:p-4">
      <DialogHeader>
        <DialogTitle>แผนผังจริง — {{ building?.name }} ชั้น {{ floor }}</DialogTitle>
        <DialogDescription>
          เปิดมาในขนาดพอดีจอเพื่อให้เห็นทั้งชั้น แล้วซูมดูตำแหน่งและเลขห้องได้ตามต้องการ
        </DialogDescription>
      </DialogHeader>

      <div v-if="planUrl && !imageFailed" class="min-w-0 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-2">
          <ButtonGroup aria-label="ควบคุมการซูมแผนผัง">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              :disabled="zoom <= MIN_ZOOM"
              aria-label="ซูมออก"
              @click="zoomOut"
            >
              <MinusIcon aria-hidden="true" />
            </Button>
            <ButtonGroupText as="span" class="min-w-12 justify-center bg-background text-center text-xs font-semibold tabular-nums" aria-live="polite">
              {{ zoomPercent }}
            </ButtonGroupText>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              :disabled="zoom >= MAX_ZOOM"
              aria-label="ซูมเข้า"
              @click="zoomIn"
            >
              <PlusIcon aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              :disabled="zoom === MIN_ZOOM && pan.x === 0 && pan.y === 0"
              aria-label="แสดงแผนผังให้พอดีจอ"
              @click="resetViewer"
            >
              <Maximize2Icon aria-hidden="true" />
            </Button>
          </ButtonGroup>
          <p class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MoveIcon class="size-3.5" aria-hidden="true" />
            บีบนิ้วหรือใช้ปุ่มเพื่อซูม · ลากเพื่อเลื่อน
          </p>
        </div>

        <div
          ref="viewer"
          class="relative flex aspect-[1684/1191] w-full touch-none select-none items-center justify-center overflow-hidden rounded-lg border bg-white"
          :class="isPanning ? 'cursor-grabbing' : zoom > MIN_ZOOM ? 'cursor-grab' : 'cursor-zoom-in'"
          role="region"
          :aria-label="`ตัวดูแผนผังจริง ${building?.name} ชั้น ${floor} ขยาย ${zoomPercent}`"
          :aria-busy="!imageLoaded"
          tabindex="0"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd"
          @wheel="onWheel"
          @dblclick="onDoubleClick"
          @keydown="onViewerKeydown"
        >
          <Skeleton
            v-if="!imageLoaded"
            class="absolute inset-3 rounded-md"
            aria-hidden="true"
          />
          <img
            :src="planUrl"
            :alt="`แผนผังจริง ${building?.name} ชั้น ${floor}`"
            class="pointer-events-none block size-full object-contain transition-opacity will-change-transform motion-reduce:transition-none"
            :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
            :style="transformStyle"
            draggable="false"
            @load="imageLoaded = true"
            @error="onImageError"
          />
          <span v-if="!imageLoaded" class="sr-only" role="status">กำลังโหลดภาพแผนผังจริง</span>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs leading-relaxed text-muted-foreground">
            ภาพนี้ใช้ดูตำแหน่งอ้างอิงเท่านั้น · สถานะว่างล่าสุดให้ยึดจากผังเลือกห้อง
          </p>
          <Button variant="outline" size="sm" as-child>
            <a :href="planUrl" target="_blank" rel="noopener">
              <ExternalLinkIcon aria-hidden="true" /> เปิดภาพเต็ม
            </a>
          </Button>
        </div>
      </div>

      <p v-else class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีแผนผังจริงของชั้นนี้ในระบบ
      </p>
    </DialogContent>
  </Dialog>
</template>
