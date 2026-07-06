<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { gsap } from 'gsap'
import type { RoomInfo } from '../types'

const props = defineProps<{
  leftRooms: RoomInfo[]
  rightRooms: RoomInfo[]
  selectedRoomNumber: string | null
  locale: 'th' | 'en'
  selectedFloor: number | string
}>()

const emit = defineEmits<{
  (e: 'selectRoom', room: RoomInfo): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const hoveredRoom = ref<RoomInfo | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)
const tooltipShow = ref(false)

let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let dirLight: THREE.DirectionalLight

// Tracking maps for animations and raycasting
const roomMeshes: { mesh: THREE.Mesh; room: RoomInfo; basePosition: THREE.Vector3 }[] = []
const utilityMeshes: { mesh: THREE.Mesh; nameTh: string; nameEn: string }[] = []
let corridorMesh: THREE.Mesh | null = null
let floorMesh: THREE.Mesh | null = null

let hoveredMesh: THREE.Mesh | null = null
let animationFrameId = 0

// Helper to check room availability
function getRoomAvailability(room: RoomInfo) {
  return room.capacity - room.occupied
}

// Canvas Texture Helper for crisp Room Numbers
function createRoomTextTexture(roomNumber: string, isSelected: boolean, isFull: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Background
  let bgColor = '#10b981' // Available (Emerald)
  let textColor = '#ffffff'
  
  if (isFull) {
    bgColor = '#94a3b8' // Full (Slate 400)
  } else if (isSelected) {
    bgColor = '#ea580c' // Selected (Orange 600)
  }

  // Draw block top background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Border overlay
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 16
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)

  // Draw room number
  ctx.font = 'bold 110px "Bricolage Grotesque", "Figtree", sans-serif'
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(roomNumber, canvas.width / 2, canvas.height / 2 - 10)

  // Subtext (occupied/capacity)
  ctx.font = '55px "Figtree", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  const capText = isSelected ? 'Selected' : (isFull ? 'Full' : 'Available')
  ctx.fillText(capText, canvas.width / 2, canvas.height / 2 + 75)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// Texture Helper for Utilities (Bathroom, Common, Balcony)
function createUtilityTextTexture(text: string, bgColor: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)

  ctx.font = 'bold 70px "Bricolage Grotesque", "Figtree", sans-serif'
  ctx.fillStyle = '#0f172a' // slate 900
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// Main 3D Scene Initialization
function initThree() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  const width = container.clientWidth
  const height = container.clientHeight || 450

  // 1. Scene
  scene = new THREE.Scene()
  scene.background = null // Transparent background to blend with card bg

  // 2. Camera (Isometric Orthographic)
  const aspect = width / height
  const frustumSize = 13
  camera = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    1000
  )
  camera.position.set(15, 14, 15)
  camera.lookAt(0, 0, 0)

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // 4. Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65)
  scene.add(ambientLight)

  dirLight = new THREE.DirectionalLight(0xffffff, 0.75)
  dirLight.position.set(18, 25, 12)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 1024
  dirLight.shadow.mapSize.height = 1024
  dirLight.shadow.bias = -0.0005
  scene.add(dirLight)

  const softBlueLight = new THREE.DirectionalLight(0xbbe2f6, 0.25)
  softBlueLight.position.set(-15, 10, -15)
  scene.add(softBlueLight)

  // 5. Raycaster
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // Build Floor Geometry
  buildFloorPlan()

  // 6. Resize handler
  window.addEventListener('resize', handleResize)

  // 7. Animation Loop
  const animate = () => {
    renderer.render(scene, camera)
    animationFrameId = requestAnimationFrame(animate)
  }
  animate()
}

// Build 3D elements dynamically from props
function buildFloorPlan() {
  // Clear previous meshes
  roomMeshes.forEach(item => scene.remove(item.mesh))
  roomMeshes.length = 0
  utilityMeshes.forEach(item => scene.remove(item.mesh))
  utilityMeshes.length = 0
  if (corridorMesh) scene.remove(corridorMesh)
  if (floorMesh) scene.remove(floorMesh)

  const maxItems = Math.max(props.leftRooms.length, props.rightRooms.length)
  const zSpacing = 2.4
  const startZ = -((maxItems) / 2) * zSpacing + 0.5
  
  // A. Corridor (Middle path)
  const corridorLength = (maxItems + 3) * zSpacing
  const corridorGeo = new THREE.BoxGeometry(1.6, 0.05, corridorLength)
  const corridorMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // slate 200
    roughness: 0.8,
    metalness: 0.1
  })
  corridorMesh = new THREE.Mesh(corridorGeo, corridorMat)
  corridorMesh.position.set(0, 0.025, (maxItems * zSpacing) / 4 - 0.5)
  corridorMesh.receiveShadow = true
  scene.add(corridorMesh)

  // B. Base floor slab (Main foundation)
  const floorGeo = new THREE.BoxGeometry(8.2, 0.05, corridorLength + 0.4)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // slate 50
    roughness: 0.9,
    metalness: 0.0
  })
  floorMesh = new THREE.Mesh(floorGeo, floorMat)
  floorMesh.position.set(0, 0, (maxItems * zSpacing) / 4 - 0.5)
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  // C. Left Rooms
  props.leftRooms.forEach((room, index) => {
    const isSelected = props.selectedRoomNumber === room.number
    const isFull = getRoomAvailability(room) <= 0
    const zPos = startZ + index * zSpacing

    const roomGeo = new THREE.BoxGeometry(2.6, 0.35, 2.0)
    
    // Side color
    let sideColor = 0x34d399 // emerald 400
    if (isFull) sideColor = 0xcbd5e1 // slate 300
    else if (isSelected) sideColor = 0xf97316 // orange 500

    const sideMat = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.5,
      metalness: 0.1
    })

    const textTex = createRoomTextTexture(room.number, isSelected, isFull)
    const topMat = new THREE.MeshStandardMaterial({
      map: textTex,
      roughness: 0.5,
      metalness: 0.1
    })

    const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
    const mesh = new THREE.Mesh(roomGeo, materials)
    mesh.position.set(-2.2, -3.0, zPos) // Set low for animation entrance
    mesh.castShadow = true
    mesh.receiveShadow = true

    const basePosition = new THREE.Vector3(-2.2, 0.2, zPos)
    scene.add(mesh)
    roomMeshes.push({ mesh, room, basePosition })

    // Entrance Animation (Elastic rise)
    gsap.to(mesh.position, {
      y: 0.2,
      duration: 0.9,
      delay: index * 0.08,
      ease: 'back.out(1.2)'
    })
  })

  // Balcony Left
  const leftBalconyIndex = props.leftRooms.length
  const zPosBalconyLeft = startZ + leftBalconyIndex * zSpacing
  const balconyLeftGeo = new THREE.BoxGeometry(2.6, 0.2, 2.0)
  const balconyLeftTex = createUtilityTextTexture(props.locale === 'th' ? 'ระเบียง' : 'Balcony', '#fef3c7') // amber 100
  const balconyLeftMat = new THREE.MeshStandardMaterial({
    map: balconyLeftTex,
    roughness: 0.8
  })
  const balconyLeftMesh = new THREE.Mesh(balconyLeftGeo, balconyLeftMat)
  balconyLeftMesh.position.set(-2.2, -3.0, zPosBalconyLeft)
  balconyLeftMesh.castShadow = true
  scene.add(balconyLeftMesh)
  utilityMeshes.push({ mesh: balconyLeftMesh, nameTh: 'ระเบียง', nameEn: 'Balcony' })
  gsap.to(balconyLeftMesh.position, {
    y: 0.125,
    duration: 0.9,
    delay: leftBalconyIndex * 0.08,
    ease: 'back.out(1.2)'
  })

  // D. Right Rooms
  props.rightRooms.forEach((room, index) => {
    const isSelected = props.selectedRoomNumber === room.number
    const isFull = getRoomAvailability(room) <= 0
    const zPos = startZ + index * zSpacing

    const roomGeo = new THREE.BoxGeometry(2.6, 0.35, 2.0)
    
    let sideColor = 0x34d399 // emerald 400
    if (isFull) sideColor = 0xcbd5e1
    else if (isSelected) sideColor = 0xf97316

    const sideMat = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.5,
      metalness: 0.1
    })

    const textTex = createRoomTextTexture(room.number, isSelected, isFull)
    const topMat = new THREE.MeshStandardMaterial({
      map: textTex,
      roughness: 0.5,
      metalness: 0.1
    })

    const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
    const mesh = new THREE.Mesh(roomGeo, materials)
    mesh.position.set(2.2, -3.0, zPos) // Set low for animation entrance
    mesh.castShadow = true
    mesh.receiveShadow = true

    const basePosition = new THREE.Vector3(2.2, 0.2, zPos)
    scene.add(mesh)
    roomMeshes.push({ mesh, room, basePosition })

    // Entrance Animation
    gsap.to(mesh.position, {
      y: 0.2,
      duration: 0.9,
      delay: index * 0.08,
      ease: 'back.out(1.2)'
    })
  })

  // Right side utilities
  const rightBaseIndex = props.rightRooms.length
  
  // Bathroom
  const zPosBath = startZ + rightBaseIndex * zSpacing
  const bathGeo = new THREE.BoxGeometry(2.6, 0.2, 2.0)
  const bathTex = createUtilityTextTexture(props.locale === 'th' ? 'ห้องน้ำ' : 'Bathroom', '#e0f2fe') // sky 100
  const bathMat = new THREE.MeshStandardMaterial({
    map: bathTex,
    roughness: 0.8
  })
  const bathMesh = new THREE.Mesh(bathGeo, bathMat)
  bathMesh.position.set(2.2, -3.0, zPosBath)
  bathMesh.castShadow = true
  scene.add(bathMesh)
  utilityMeshes.push({ mesh: bathMesh, nameTh: 'ห้องน้ำ', nameEn: 'Bathroom' })
  gsap.to(bathMesh.position, {
    y: 0.125,
    duration: 0.9,
    delay: rightBaseIndex * 0.08,
    ease: 'back.out(1.2)'
  })

  // Common Room
  const zPosCommon = startZ + (rightBaseIndex + 1) * zSpacing
  const commonGeo = new THREE.BoxGeometry(2.6, 0.2, 2.0)
  const commonTex = createUtilityTextTexture(props.locale === 'th' ? 'ห้องส่วนรวม' : 'Common Room', '#f1f5f9') // slate 100
  const commonMat = new THREE.MeshStandardMaterial({
    map: commonTex,
    roughness: 0.8
  })
  const commonMesh = new THREE.Mesh(commonGeo, commonMat)
  commonMesh.position.set(2.2, -3.0, zPosCommon)
  commonMesh.castShadow = true
  scene.add(commonMesh)
  utilityMeshes.push({ mesh: commonMesh, nameTh: 'ห้องส่วนรวม', nameEn: 'Common Room' })
  gsap.to(commonMesh.position, {
    y: 0.125,
    duration: 0.9,
    delay: (rightBaseIndex + 1) * 0.08,
    ease: 'back.out(1.2)'
  })

  // Balcony Right
  const zPosBalconyRight = startZ + (rightBaseIndex + 2) * zSpacing
  const balconyRightGeo = new THREE.BoxGeometry(2.6, 0.2, 2.0)
  const balconyRightTex = createUtilityTextTexture(props.locale === 'th' ? 'ระเบียงพักคอย' : 'Balcony Area', '#fef3c7') // amber 100
  const balconyRightMat = new THREE.MeshStandardMaterial({
    map: balconyRightTex,
    roughness: 0.8
  })
  const balconyRightMesh = new THREE.Mesh(balconyRightGeo, balconyRightMat)
  balconyRightMesh.position.set(2.2, -3.0, zPosBalconyRight)
  balconyRightMesh.castShadow = true
  scene.add(balconyRightMesh)
  utilityMeshes.push({ mesh: balconyRightMesh, nameTh: 'ระเบียงพักคอย', nameEn: 'Balcony Area' })
  gsap.to(balconyRightMesh.position, {
    y: 0.125,
    duration: 0.9,
    delay: (rightBaseIndex + 2) * 0.08,
    ease: 'back.out(1.2)'
  })

  // Adjust Camera center based on layout depth
  const midZ = (startZ + (maxItems + 1) * zSpacing) / 2
  camera.lookAt(0, 0, midZ)
  dirLight.position.set(18, 25, midZ + 5)
}

// Mouse movement raycasting
function handlePointerMove(e: PointerEvent) {
  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const targets = roomMeshes.map(item => item.mesh)
  const intersects = raycaster.intersectObjects(targets)

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object as THREE.Mesh
    const hitItem = roomMeshes.find(item => item.mesh === hitMesh)

    if (hitItem) {
      document.body.style.cursor = getRoomAvailability(hitItem.room) > 0 ? 'pointer' : 'not-allowed'
      hoveredRoom.value = hitItem.room
      
      // Position tooltip slightly offset from mouse pointer
      tooltipX.value = e.clientX - rect.left + 15
      tooltipY.value = e.clientY - rect.top + 15
      tooltipShow.value = true

      if (hoveredMesh !== hitMesh) {
        // Reset previous mesh
        resetHoveredMesh()

        // Highlight new hovered mesh
        hoveredMesh = hitMesh
        gsap.to(hitMesh.position, {
          y: 0.5, // float higher
          duration: 0.35,
          ease: 'power2.out'
        })
        gsap.to(hitMesh.scale, {
          x: 1.05,
          z: 1.05,
          duration: 0.35,
          ease: 'power2.out'
        })
      }
    }
  } else {
    // Check if hitting utilities for a generic tooltip
    const utilTargets = utilityMeshes.map(item => item.mesh)
    const utilIntersects = raycaster.intersectObjects(utilTargets)
    
    if (utilIntersects.length > 0) {
      document.body.style.cursor = 'default'
      const hitMesh = utilIntersects[0].object as THREE.Mesh
      const hitUtil = utilityMeshes.find(item => item.mesh === hitMesh)
      if (hitUtil) {
        hoveredRoom.value = {
          number: props.locale === 'th' ? hitUtil.nameTh : hitUtil.nameEn,
          type: 'Utility',
          capacity: 0,
          occupied: 0
        } as any
        tooltipX.value = e.clientX - rect.left + 15
        tooltipY.value = e.clientY - rect.top + 15
        tooltipShow.value = true
      }
    } else {
      document.body.style.cursor = 'default'
      tooltipShow.value = false
      resetHoveredMesh()
    }
  }
}

function resetHoveredMesh() {
  if (hoveredMesh) {
    const item = roomMeshes.find(i => i.mesh === hoveredMesh)
    if (item) {
      gsap.to(hoveredMesh.position, {
        y: item.basePosition.y, // back to default
        duration: 0.35,
        ease: 'power2.out'
      })
      gsap.to(hoveredMesh.scale, {
        x: 1.0,
        z: 1.0,
        duration: 0.35,
        ease: 'power2.out'
      })
    }
    hoveredMesh = null
  }
}

// Raycasting clicks
function handlePointerDown(e: PointerEvent) {
  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const targets = roomMeshes.map(item => item.mesh)
  const intersects = raycaster.intersectObjects(targets)

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object as THREE.Mesh
    const hitItem = roomMeshes.find(item => item.mesh === hitMesh)

    if (hitItem && getRoomAvailability(hitItem.room) > 0) {
      // Squish animation on click
      gsap.timeline()
        .to(hitMesh.scale, { y: 0.15, duration: 0.1, ease: 'power2.out' })
        .to(hitMesh.scale, { y: 1.0, duration: 0.25, ease: 'back.out(2)' })

      emit('selectRoom', hitItem.room)
    }
  }
}

function handleResize() {
  const container = containerRef.value
  if (!container || !renderer || !camera) return

  const width = container.clientWidth
  const height = container.clientHeight || 450

  const aspect = width / height
  const frustumSize = 13
  camera.left = -frustumSize * aspect / 2
  camera.right = frustumSize * aspect / 2
  camera.top = frustumSize / 2
  camera.bottom = -frustumSize / 2
  camera.updateProjectionMatrix()

  renderer.setSize(width, height, false)
}

onMounted(() => {
  nextTick(() => {
    initThree()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationFrameId)
  if (renderer) renderer.dispose()
  roomMeshes.forEach(item => {
    if (Array.isArray(item.mesh.material)) {
      item.mesh.material.forEach(m => m.dispose())
    } else {
      item.mesh.material.dispose()
    }
    item.mesh.geometry.dispose()
  })
  utilityMeshes.forEach(item => {
    if (Array.isArray(item.mesh.material)) {
      item.mesh.material.forEach(m => m.dispose())
    } else {
      item.mesh.material.dispose()
    }
    item.mesh.geometry.dispose()
  })
})

// Redraw floor when floor, dorm, room data, or selections change
watch(() => [props.leftRooms, props.rightRooms, props.selectedRoomNumber, props.locale, props.selectedFloor], () => {
  if (renderer) {
    buildFloorPlan()
  }
}, { deep: true })
</script>

<template>
  <div ref="containerRef" class="relative w-full h-[400px] sm:h-[450px] bg-slate-50/50 rounded-2xl border overflow-hidden select-none">
    
    <!-- Floor Label Indicator overlay -->
    <div class="absolute top-4 left-4 bg-white/80 border text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur z-10 shadow-sm text-slate-800 tracking-wide uppercase">
      Floor {{ selectedFloor }}
    </div>

    <!-- 3D Canvas element -->
    <canvas 
      ref="canvasRef" 
      class="w-full h-full block cursor-default"
      @pointermove="handlePointerMove"
      @pointerdown="handlePointerDown"
    />

    <!-- Interactive HTML Tooltip Overlay -->
    <div 
      v-if="tooltipShow && hoveredRoom"
      class="absolute pointer-events-none bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 z-20 flex flex-col gap-1 text-slate-800 transition-all duration-75"
      :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
    >
      <div class="font-bold text-sm text-slate-900">
        {{ hoveredRoom.type === 'Utility' ? hoveredRoom.number : (locale === 'th' ? `ห้อง ${hoveredRoom.number}` : `Room ${hoveredRoom.number}`) }}
      </div>
      <template v-if="hoveredRoom.type !== 'Utility'">
        <div class="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[200px]">
          {{ hoveredRoom.type }}
        </div>
        <div class="h-px bg-slate-100 my-1.5" />
        <div class="flex items-center justify-between gap-6 text-[11px]">
          <span class="text-slate-500">{{ locale === 'th' ? 'สถานะ' : 'Status' }}</span>
          <span 
            class="font-bold px-2 py-0.5 rounded-full"
            :class="getRoomAvailability(hoveredRoom) <= 0 ? 'bg-rose-50 text-rose-700' : (selectedRoomNumber === hoveredRoom.number ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-700')"
          >
            {{ getRoomAvailability(hoveredRoom) <= 0 ? (locale === 'th' ? 'เต็ม' : 'Full') : (selectedRoomNumber === hoveredRoom.number ? (locale === 'th' ? 'เลือกอยู่' : 'Selected') : (locale === 'th' ? 'ว่าง' : 'Available')) }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-6 text-[11px] mt-1">
          <span class="text-slate-500">{{ locale === 'th' ? 'ว่าง/ทั้งหมด' : 'Beds Available' }}</span>
          <span class="font-semibold text-slate-800">{{ getRoomAvailability(hoveredRoom) }}/{{ hoveredRoom.capacity }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hover-ripple {
  pointer-events: none;
}
</style>
