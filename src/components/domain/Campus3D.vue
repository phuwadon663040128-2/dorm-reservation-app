<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ArrowLeftIcon, Building2Icon, MousePointerClickIcon, Rotate3dIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/useTheme'
import { CAMPUS_PALETTES, campusArea } from '@/lib/campus3d'
import type { Building3DConfig, CampusPalette, RoadKind } from '@/lib/campus3d'

// ฉากตึก 3 มิติทั้งพื้นที่ (อิงแผนที่จริง): หอที่เลือก = ตึกสีเต็มกดได้ · อีกหอ = ตึกจาง กดเพื่อสลับหอ
// มีถนนมอดินแดง + ถนนภายใน + ป้ายชื่อเหนืออาคาร + ลูกศรทิศเหนือ เพื่อให้เทียบตำแหน่งกับของจริงได้
// flow: กดตึก → กดชั้น → dive → แจ้ง select-floor ให้พาไปแผนผังห้องของชั้นนั้น
const props = defineProps<{
  dormGroupId: string
  availability: Record<string, Record<number, { available: number; total: number }>>
}>()

const emit = defineEmits<{
  (e: 'select-floor', payload: { buildingCode: string; floor: number }): void
  (e: 'switch-dorm', dormGroupId: string): void
}>()

const { theme } = useTheme()
const area = campusArea

const host = ref<HTMLDivElement>()
const mode = ref<'campus' | 'building' | 'diving'>('campus')
const selectedCode = ref<string | null>(null)
const hoverLabel = ref<{ x: number; y: number; text: string; sub: string } | null>(null)

// ---- Three.js state (นอก reactivity) ----
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let raf = 0
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let pickables: THREE.Mesh[] = []
const buildingDetails = new Map<string, THREE.Group>()
const adaptiveLabels: THREE.Sprite[] = []
const disposables: { dispose: () => void }[] = []
let ro: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null
let reduceMotion = false
let sceneInViewport = true
let lastFrameAt = 0

type RenderQuality = 'low' | 'medium' | 'high'
interface RenderProfile {
  quality: RenderQuality
  pixelRatioCap: number
  maxFps: number
  shadows: boolean
  shadowSize: number
  autoRotate: boolean
}

let renderProfile: RenderProfile = {
  quality: 'high',
  pixelRatioCap: 1.75,
  maxFps: 60,
  shadows: true,
  shadowSize: 2048,
  autoRotate: true,
}

function detectRenderProfile(): RenderProfile {
  const device = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  const cores = device.hardwareConcurrency ?? 8
  const memory = device.deviceMemory
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const compactViewport = window.innerWidth < 768

  if (device.connection?.saveData || compactViewport || coarsePointer || cores <= 4 || (memory !== undefined && memory <= 4)) {
    // มือถือปิดเงา/ลด FPS เพื่อประหยัดเครื่อง แต่คงความหนาแน่นพิกเซลและ antialias
    // ให้ขอบตึกกับข้อความบน canvas ไม่แตกบนจอ DPR สูง
    return { quality: 'low', pixelRatioCap: 1.5, maxFps: 30, shadows: false, shadowSize: 512, autoRotate: false }
  }
  if (cores <= 6 || (memory !== undefined && memory <= 8)) {
    return { quality: 'medium', pixelRatioCap: 1.4, maxFps: 45, shadows: true, shadowSize: 1024, autoRotate: true }
  }
  return { quality: 'high', pixelRatioCap: 1.75, maxFps: 60, shadows: true, shadowSize: 2048, autoRotate: true }
}

const desiredPos = new THREE.Vector3()
const desiredTarget = new THREE.Vector3()
let transitioning = false
let diveResolveAt = 0
let diveTarget: { code: string; floor: number } | null = null
let diveEmitted = false
const hoverFloor = { code: '', floor: 0 }
const CLICK_SLOP = 6
let pointerPress: { pointerId: number; x: number; y: number } | null = null
let pointerDragged = false

function pal(): CampusPalette {
  return CAMPUS_PALETTES[theme.value === 'dark' ? 'dark' : 'light']
}

// คำอธิบายสีถนน (มุมล่างซ้าย) — อิงสีจริงของธีมปัจจุบัน
const roadLegend = computed(() => {
  const p = pal()
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`
  return [
    { color: hex(p.roadMain), label: 'ถนนมอดินแดง' },
    { color: hex(p.road), label: 'ถนนภายในหอพัก' },
  ]
})

function isContext(b: Building3DConfig) {
  return b.dormGroupId !== props.dormGroupId
}

function shapeOf(b: Building3DConfig) {
  return area.lShape[b.dormGroupId]!
}

function buildingColor(b: Building3DConfig, p: CampusPalette) {
  const colors = area.dormColors[b.dormGroupId]
  if (!colors) return p.wall
  return theme.value === 'dark' ? colors.colorDark : colors.colorLight
}

function mixColor(a: number, b: number, amount: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), amount)
}

function boxMatrix(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  rotationY = 0,
) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0)),
    new THREE.Vector3(sx, sy, sz),
  )
}

function addInstancedBoxes(
  parent: THREE.Object3D,
  matrices: THREE.Matrix4[],
  material: THREE.Material,
  options: { castShadow?: boolean; receiveShadow?: boolean } = {},
) {
  if (!matrices.length) return null
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length)
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
  mesh.instanceMatrix.needsUpdate = true
  mesh.castShadow = options.castShadow ?? false
  mesh.receiveShadow = options.receiveShadow ?? false
  mesh.userData = { decor: true }
  disposables.push(geometry)
  parent.add(mesh)
  return mesh
}

function textureAnisotropy() {
  return renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4
}

function makeSurfaceTexture(seedStart: number, density = 1300) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f4f4f2'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let seed = seedStart >>> 0
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  for (let i = 0; i < density; i++) {
    const value = Math.round(35 + random() * 75)
    ctx.fillStyle = `rgba(${value}, ${value}, ${value}, ${0.018 + random() * 0.045})`
    const radius = 0.25 + random() * 1.25
    ctx.beginPath()
    ctx.arc(random() * 512, random() * 512, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(45, 45, 45, ${0.018 + random() * 0.025})`
    ctx.beginPath()
    ctx.ellipse(random() * 512, random() * 512, 12 + random() * 45, 5 + random() * 18, random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = textureAnisotropy()
  disposables.push(texture)
  return texture
}

function makeSkyDome(p: CampusPalette) {
  const isDark = theme.value === 'dark'
  const geometry = new THREE.SphereGeometry(590, 28, 16)
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(isDark ? 0x06101e : 0xb9d2df) },
      horizonColor: { value: new THREE.Color(p.background) },
      offset: { value: 22 },
      exponent: { value: isDark ? 0.7 : 0.52 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float blend = pow(max(h, 0.0), exponent);
        gl_FragColor = vec4(mix(horizonColor, topColor, blend), 1.0);
      }
    `,
  })
  disposables.push(geometry, material)
  const sky = new THREE.Mesh(geometry, material)
  sky.userData = { decor: true }
  return sky
}

// ---------- ป้ายข้อความวางราบบนพื้น ----------
function makeGroundText(text: string, widthMeters: number, p: CampusPalette, rotateZ = 0) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.font = 'bold 58px "Noto Sans Thai", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = p.labelText
  ctx.fillText(text, 256, 70)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const geo = new THREE.PlaneGeometry(widthMeters, widthMeters / 4)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  disposables.push(tex, geo, mat)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.rotation.z = rotateZ
  mesh.position.y = 0.22
  mesh.userData = { decor: true }
  return mesh
}

// ชื่อสถานที่โปร่งใสเหนือพื้นที่ — ไม่มีกรอบหรือพื้นป้าย และหันเข้ากล้องเสมอ
function makeFloatingText(text: string, widthMeters: number, p: CampusPalette) {
  const canvas = document.createElement('canvas')
  canvas.width = 1536
  canvas.height = 288
  const ctx = canvas.getContext('2d')!
  const isDark = theme.value === 'dark'

  ctx.font = '900 198px "Noto Sans Thai", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = isDark ? 'rgba(10, 19, 34, 0.96)' : 'rgba(255, 252, 247, 0.96)'
  ctx.lineWidth = 36
  ctx.fillStyle = p.labelText
  ctx.strokeText(text, 768, 150, 1440)
  ctx.fillText(text, 768, 150, 1440)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.08,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  disposables.push(tex, mat)
  const sprite = new THREE.Sprite(mat)
  sprite.center.set(0.5, 0)
  sprite.scale.set(widthMeters, widthMeters / 4, 1)
  sprite.renderOrder = 100
  sprite.userData = {
    decor: true,
    adaptiveLabel: true,
    labelKind: 'facility',
    baseWidth: widthMeters,
    baseHeight: widthMeters / 4,
  }
  adaptiveLabels.push(sprite)
  return sprite
}

// รหัสอาคารโปร่งใสตั้งชิดหลังคา ไม่มีกรอบหรือพื้นป้าย และหันเข้ากล้องเสมอ
function makeBuildingText(code: string, buildingHeight: number, p: CampusPalette) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  const isDark = theme.value === 'dark'
  const fill = p.labelText
  const outline = isDark ? 'rgba(10, 19, 34, 0.96)' : 'rgba(255, 252, 247, 0.96)'

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = outline
  ctx.fillStyle = fill
  ctx.font = '900 720px "Noto Sans Thai", sans-serif'
  ctx.lineWidth = 60
  ctx.strokeText(code, 512, 540)
  ctx.fillText(code, 512, 540)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.08,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  })
  disposables.push(tex, mat)
  const sprite = new THREE.Sprite(mat)
  const markSize = Math.min(13, Math.max(10, buildingHeight * 0.55))
  sprite.center.set(0.5, 0)
  sprite.scale.set(markSize, markSize, 1)
  sprite.renderOrder = 101
  sprite.userData = {
    decor: true,
    adaptiveLabel: true,
    labelKind: 'building',
    baseWidth: markSize,
    baseHeight: markSize,
  }
  adaptiveLabels.push(sprite)
  return sprite
}

function updateAdaptiveLabels() {
  if (!camera) return
  const worldPosition = new THREE.Vector3()
  for (const label of adaptiveLabels) {
    label.getWorldPosition(worldPosition)
    const distance = camera.position.distanceTo(worldPosition)
    const facility = label.userData.labelKind === 'facility'
    const referenceDistance = facility ? 145 : 120
    const minScale = facility ? 0.24 : 0.38
    const scale = THREE.MathUtils.clamp(distance / referenceDistance, minScale, 1)
    label.scale.set(
      label.userData.baseWidth * scale,
      label.userData.baseHeight * scale,
      1,
    )
    const material = label.material as THREE.SpriteMaterial
    material.opacity = facility && distance < 58
      ? THREE.MathUtils.clamp(0.5 + distance / 130, 0.62, 0.92)
      : 1
  }
}

// ผิวสนามปูนเก่า: ฐานขาวหม่น มีคราบด่าง จุดคล้ำ และรอยเส้นบางแบบ deterministic
function makeWeatheredConcreteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let seed = 0x8a31d5
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }

  // คราบกว้างที่ค่อย ๆ จางเข้ากับเนื้อปูน
  ctx.save()
  ctx.filter = 'blur(10px)'
  for (let i = 0; i < 38; i++) {
    const gray = Math.round(45 + random() * 65)
    ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${0.025 + random() * 0.06})`
    ctx.beginPath()
    ctx.ellipse(
      random() * canvas.width,
      random() * canvas.height,
      10 + random() * 48,
      7 + random() * 32,
      random() * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.restore()

  // เม็ดดำเล็ก ๆ จากผิวปูนที่ผ่านการใช้งาน
  for (let i = 0; i < 850; i++) {
    const gray = Math.round(35 + random() * 80)
    ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${0.035 + random() * 0.13})`
    ctx.beginPath()
    ctx.arc(random() * canvas.width, random() * canvas.height, 0.35 + random() * 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // รอยเส้นบาง ไม่เข้มจนดูเหมือนสนามแตกร้าวรุนแรง
  ctx.lineCap = 'round'
  for (let i = 0; i < 11; i++) {
    let x = random() * canvas.width
    let y = random() * canvas.height
    ctx.strokeStyle = `rgba(45, 45, 45, ${0.045 + random() * 0.055})`
    ctx.lineWidth = 0.7 + random() * 1.1
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let p = 0; p < 4; p++) {
      x += (random() - 0.5) * 34
      y += (random() - 0.5) * 34
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1.8, 1.2)
  tex.anisotropy = 4
  disposables.push(tex)
  return tex
}

// ลูกศรทิศเหนือบนพื้น (หมุนไปพร้อมฉาก — ชี้ทิศถูกเสมอ)
function makeNorthArrow(p: CampusPalette) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const accent = '#' + p.accent.toString(16).padStart(6, '0')
  ctx.strokeStyle = accent
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(128, 128, 96, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.moveTo(128, 40)
  ctx.lineTo(158, 128)
  ctx.lineTo(128, 108)
  ctx.lineTo(98, 128)
  ctx.closePath()
  ctx.fill()
  ctx.font = 'bold 54px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('N', 128, 196)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const geo = new THREE.PlaneGeometry(16, 16)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  disposables.push(tex, geo, mat)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(-20, 0.22, 46) // ลานโล่งด้านใต้ของโซนกลาง ไม่ทับอาคารใด
  mesh.userData = { decor: true }
  return mesh
}

// ---------- ตึกรูปตัว L หนึ่งหลัง ----------
function addBuilding(root: THREE.Group, b: Building3DConfig, p: CampusPalette) {
  const { main, wing, floorHeight: fh } = shapeOf(b)
  const context = isContext(b)
  const g = new THREE.Group()
  g.position.set(b.x, 0, b.z)
  g.rotation.y = THREE.MathUtils.degToRad(b.rotationY)

  const gap = 0.18
  const dormColor = buildingColor(b, p)
  const wallMat = new THREE.MeshStandardMaterial({
    color: dormColor,
    roughness: 0.88,
    metalness: 0.025,
    transparent: context,
    opacity: context ? 0.8 : 1,
  })
  disposables.push(wallMat)

  // ปีกตั้งฉากเกาะปลายปีกหลัก — mirror = สลับไปปลายอีกฝั่ง (ตึกคู่กระจกเงา)
  const wingCx = (b.mirror ? -1 : 1) * (main.w / 2 - wing.w / 2)
  const wings = [
    { w: main.w, d: main.d, cx: 0, cz: 0, isMain: true },
    { w: wing.w, d: wing.d, cx: wingCx, cz: -(main.d / 2 + wing.d / 2), isMain: false },
  ]

  for (let f = 0; f < b.floors; f++) {
    const y = f * fh + fh / 2
    for (const w of wings) {
      const geo = new THREE.BoxGeometry(w.w, fh - gap, w.d)
      disposables.push(geo)
      const mesh = new THREE.Mesh(geo, wallMat.clone())
      disposables.push(mesh.material as THREE.Material)
      mesh.position.set(w.cx, y, w.cz)
      mesh.castShadow = !context
      mesh.receiveShadow = true
      mesh.userData = { buildingCode: b.code, floor: f + 1, dormGroupId: b.dormGroupId, context }
      g.add(mesh)
      pickables.push(mesh)
    }
  }

  const buildingHeight = b.floors * fh
  const decor = new THREE.Group()
  decor.name = `details-${b.code}`
  decor.userData = { decor: true, buildingCode: b.code, context }

  const roofColor = mixColor(dormColor, p.roof, context ? 0.35 : 0.48)
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColor,
    roughness: 0.92,
    transparent: context,
    opacity: context ? 0.72 : 1,
  })
  const roofMatrices: THREE.Matrix4[] = []
  for (const w of wings) {
    roofMatrices.push(boxMatrix(w.cx, buildingHeight + 0.22, w.cz, w.w + 0.5, 0.44, w.d + 0.5))
    roofMatrices.push(
      boxMatrix(w.cx, buildingHeight + 0.82, w.cz + w.d / 2, w.w + 0.6, 1.15, 0.34),
      boxMatrix(w.cx, buildingHeight + 0.82, w.cz - w.d / 2, w.w + 0.6, 1.15, 0.34),
      boxMatrix(w.cx + w.w / 2, buildingHeight + 0.82, w.cz, 0.34, 1.15, w.d),
      boxMatrix(w.cx - w.w / 2, buildingHeight + 0.82, w.cz, 0.34, 1.15, w.d),
    )
  }
  disposables.push(roofMat)
  addInstancedBoxes(decor, roofMatrices, roofMat, { castShadow: !context, receiveShadow: true })

  if (!context) {
    const trimMat = new THREE.MeshStandardMaterial({
      color: mixColor(dormColor, p.facadeTrim, 0.52),
      roughness: 0.78,
    })
    const baseMat = new THREE.MeshStandardMaterial({ color: p.facadeBase, roughness: 0.94 })
    const frameMat = new THREE.MeshStandardMaterial({ color: p.glassFrame, roughness: 0.55, metalness: 0.12 })
    const glassMat = new THREE.MeshStandardMaterial({
      color: p.glass,
      roughness: 0.18,
      metalness: 0.16,
    })
    const litGlassMat = new THREE.MeshStandardMaterial({
      color: theme.value === 'dark' ? 0x6a4c32 : p.glass,
      roughness: 0.2,
      metalness: 0.08,
      emissive: new THREE.Color(p.glassEmissive),
      emissiveIntensity: theme.value === 'dark' ? 1.05 : 0,
    })
    const metalMat = new THREE.MeshStandardMaterial({ color: p.metal, roughness: 0.56, metalness: 0.42 })
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: p.glassFrame, roughness: 0.62, metalness: 0.25 })
    const panelMat = new THREE.MeshStandardMaterial({ color: theme.value === 'dark' ? 0x16283a : 0x294c5d, roughness: 0.3, metalness: 0.35 })
    disposables.push(trimMat, baseMat, frameMat, glassMat, litGlassMat, metalMat, darkMetalMat, panelMat)

    const trimMatrices: THREE.Matrix4[] = []
    const baseMatrices: THREE.Matrix4[] = []
    const frameMatrices: THREE.Matrix4[] = []
    const glassMatrices: THREE.Matrix4[] = []
    const litGlassMatrices: THREE.Matrix4[] = []
    const shadeMatrices: THREE.Matrix4[] = []
    const mullionMatrices: THREE.Matrix4[] = []
    const airconMatrices: THREE.Matrix4[] = []

    const windowSeed = Array.from(b.code).reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
    const selectGlassPool = (floor: number, index: number, side: number, wingIndex: number) =>
      theme.value === 'dark' && (windowSeed + floor * 17 + index * 7 + side * 11 + wingIndex * 23) % 5 === 0
        ? litGlassMatrices
        : glassMatrices

    const addWindowOnZ = (
      x: number,
      y: number,
      z: number,
      outward: number,
      floor: number,
      index: number,
      side: number,
      wingIndex: number,
    ) => {
      frameMatrices.push(boxMatrix(x, y, z, 2.5, 1.62, 0.18))
      selectGlassPool(floor, index, side, wingIndex).push(boxMatrix(x, y, z + outward * 0.11, 2.08, 1.27, 0.12))
      mullionMatrices.push(boxMatrix(x, y, z + outward * 0.2, 0.08, 1.26, 0.08))
      shadeMatrices.push(boxMatrix(x, y + 0.97, z + outward * 0.2, 2.75, 0.13, 0.55))
    }

    const addWindowOnX = (
      x: number,
      y: number,
      z: number,
      outward: number,
      floor: number,
      index: number,
      side: number,
      wingIndex: number,
    ) => {
      frameMatrices.push(boxMatrix(x, y, z, 0.18, 1.62, 2.5))
      selectGlassPool(floor, index, side, wingIndex).push(boxMatrix(x + outward * 0.11, y, z, 0.12, 1.27, 2.08))
      mullionMatrices.push(boxMatrix(x + outward * 0.2, y, z, 0.08, 1.26, 0.08))
      shadeMatrices.push(boxMatrix(x + outward * 0.2, y + 0.97, z, 0.55, 0.13, 2.75))
    }

    wings.forEach((w, wingIndex) => {
      baseMatrices.push(boxMatrix(w.cx, 0.23, w.cz, w.w + 0.7, 0.46, w.d + 0.7))

      for (let level = 1; level < b.floors; level++) {
        const y = level * fh
        trimMatrices.push(
          boxMatrix(w.cx, y, w.cz + w.d / 2 + 0.08, w.w + 0.35, 0.18, 0.3),
          boxMatrix(w.cx, y, w.cz - w.d / 2 - 0.08, w.w + 0.35, 0.18, 0.3),
          boxMatrix(w.cx + w.w / 2 + 0.08, y, w.cz, 0.3, 0.18, w.d),
          boxMatrix(w.cx - w.w / 2 - 0.08, y, w.cz, 0.3, 0.18, w.d),
        )
      }

      for (const xSide of [-1, 1]) {
        for (const zSide of [-1, 1]) {
          trimMatrices.push(boxMatrix(
            w.cx + xSide * (w.w / 2 + 0.08),
            buildingHeight / 2,
            w.cz + zSide * (w.d / 2 + 0.08),
            0.34,
            buildingHeight,
            0.34,
          ))
        }
      }

      const xCount = Math.max(2, Math.floor((w.w - 2) / 4.7))
      const zCount = Math.max(2, Math.floor((w.d - 2) / 4.8))
      for (let floor = 0; floor < b.floors; floor++) {
        const y = floor * fh + 1.72
        for (let i = 0; i < xCount; i++) {
          const x = w.cx - w.w / 2 + ((i + 1) * w.w) / (xCount + 1)
          addWindowOnZ(x, y, w.cz + w.d / 2 + 0.11, 1, floor, i, 0, wingIndex)
          const behindWing = w.isMain && Math.abs(x - wingCx) < wing.w / 2 + 1.1
          if (!behindWing) addWindowOnZ(x, y, w.cz - w.d / 2 - 0.11, -1, floor, i, 1, wingIndex)
          if (w.isMain && i % 3 === 1) {
            airconMatrices.push(boxMatrix(x + 1.35, y - 0.43, w.cz - w.d / 2 - 0.42, 0.8, 0.58, 0.52))
          }
        }
        for (let i = 0; i < zCount; i++) {
          const z = w.cz - w.d / 2 + ((i + 1) * w.d) / (zCount + 1)
          addWindowOnX(w.cx + w.w / 2 + 0.11, y, z, 1, floor, i, 2, wingIndex)
          addWindowOnX(w.cx - w.w / 2 - 0.11, y, z, -1, floor, i, 3, wingIndex)
        }
      }
    })

    // ทางเข้า: ประตูกระจก กันสาด เสา และขั้นบันไดอยู่ด้านหน้าปีกหลัก
    const entranceZ = main.d / 2 + 0.18
    frameMatrices.push(boxMatrix(0, 1.42, entranceZ, 3.7, 2.65, 0.22))
    glassMatrices.push(
      boxMatrix(-0.86, 1.42, entranceZ + 0.14, 1.45, 2.25, 0.12),
      boxMatrix(0.86, 1.42, entranceZ + 0.14, 1.45, 2.25, 0.12),
    )
    mullionMatrices.push(boxMatrix(0, 1.42, entranceZ + 0.24, 0.1, 2.3, 0.1))
    shadeMatrices.push(
      boxMatrix(0, 3.05, entranceZ + 1.05, 6.2, 0.24, 2.3),
      boxMatrix(-2.55, 1.62, entranceZ + 1.7, 0.18, 2.86, 0.18),
      boxMatrix(2.55, 1.62, entranceZ + 1.7, 0.18, 2.86, 0.18),
    )
    for (let step = 0; step < 3; step++) {
      baseMatrices.push(boxMatrix(0, 0.09 + step * 0.09, entranceZ + 0.7 + step * 0.38, 5.1 - step * 0.45, 0.18, 0.72))
    }

    // ช่องบันไดสูงที่ปลายปีกช่วยให้มวลอาคารไม่เป็นกล่องเรียบ
    const stairZ = -(main.d / 2 + wing.d) - 0.16
    frameMatrices.push(boxMatrix(wingCx, buildingHeight / 2, stairZ, wing.w * 0.42, buildingHeight - 0.8, 0.22))
    for (let floor = 0; floor < b.floors; floor++) {
      const y = floor * fh + fh / 2
      glassMatrices.push(boxMatrix(wingCx, y, stairZ - 0.14, wing.w * 0.34, fh * 0.6, 0.12))
      mullionMatrices.push(boxMatrix(wingCx, y, stairZ - 0.22, 0.1, fh * 0.58, 0.08))
    }

    addInstancedBoxes(decor, baseMatrices, baseMat, { receiveShadow: true })
    addInstancedBoxes(decor, trimMatrices, trimMat, { receiveShadow: true })
    addInstancedBoxes(decor, frameMatrices, frameMat)
    addInstancedBoxes(decor, glassMatrices, glassMat)
    addInstancedBoxes(decor, litGlassMatrices, litGlassMat)
    addInstancedBoxes(decor, shadeMatrices, trimMat)
    addInstancedBoxes(decor, mullionMatrices, metalMat)
    addInstancedBoxes(decor, airconMatrices, darkMetalMat)

    // ห้องบันได ถังน้ำ โซลาร์ และช่องระบายอากาศบนดาดฟ้า
    const roofHouseGeo = new THREE.BoxGeometry(5.4, 2.3, 4.2)
    const roofHouse = new THREE.Mesh(roofHouseGeo, trimMat)
    roofHouse.position.set(-wingCx * 0.45, buildingHeight + 1.55, -1.2)
    roofHouse.castShadow = true
    roofHouse.receiveShadow = true
    roofHouse.userData = { decor: true }
    disposables.push(roofHouseGeo)
    decor.add(roofHouse)

    const tankGeo = new THREE.CylinderGeometry(1.2, 1.35, 1.8, 14)
    const tank = new THREE.Mesh(tankGeo, metalMat)
    tank.position.set(wingCx, buildingHeight + 1.45, -(main.d / 2 + wing.d) + 4.2)
    tank.castShadow = true
    tank.userData = { decor: true }
    disposables.push(tankGeo)
    decor.add(tank)

    for (let i = 0; i < 2; i++) {
      const panelGeo = new THREE.BoxGeometry(4.2, 0.16, 2.1)
      const panel = new THREE.Mesh(panelGeo, panelMat)
      panel.position.set(-6 + i * 4.8, buildingHeight + 0.78, 1.9)
      panel.rotation.x = -0.16
      panel.castShadow = true
      panel.userData = { decor: true }
      disposables.push(panelGeo)
      decor.add(panel)
    }
  }

  const label = makeBuildingText(b.code, buildingHeight, p)
  label.position.set(0, buildingHeight + (context ? 2 : 3.1), -wing.d * 0.22)
  decor.add(label)
  buildingDetails.set(b.code, decor)
  g.add(decor)

  root.add(g)
}

function makeTree(x: number, z: number, s: number, p: CampusPalette) {
  const grp = new THREE.Group()
  const trunkGeo = new THREE.CylinderGeometry(0.24 * s, 0.38 * s, 3.1 * s, 8)
  const crownGeo = new THREE.IcosahedronGeometry(1.75 * s, 1)
  const planterGeo = new THREE.CylinderGeometry(1.1 * s, 1.22 * s, 0.38 * s, 12)
  const trunkMat = new THREE.MeshStandardMaterial({ color: p.trunk, roughness: 1 })
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: mixColor(p.tree, p.shrub, 0.18), roughness: 0.94 }),
    new THREE.MeshStandardMaterial({ color: p.tree, roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: mixColor(p.tree, p.hemiSky, 0.12), roughness: 0.94 }),
  ]
  const planterMat = new THREE.MeshStandardMaterial({ color: p.curb, roughness: 0.95 })
  disposables.push(trunkGeo, crownGeo, planterGeo, trunkMat, planterMat, ...leafMats)
  const planter = new THREE.Mesh(planterGeo, planterMat)
  planter.position.y = 0.19 * s
  planter.receiveShadow = true
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.y = 1.55 * s
  trunk.castShadow = true
  grp.add(planter, trunk)

  const crownPositions = [
    [-0.65, 3.7, 0.15, 1],
    [0.7, 3.85, 0.15, 0.92],
    [0, 4.75, -0.1, 1.05],
  ] as const
  crownPositions.forEach(([cx, cy, cz, scale], index) => {
    const crown = new THREE.Mesh(crownGeo, leafMats[index]!)
    crown.position.set(cx * s, cy * s, cz * s)
    crown.scale.set(scale, scale * 0.9, scale)
    crown.rotation.set(index * 0.21, index * 0.73, index * 0.13)
    crown.castShadow = true
    crown.receiveShadow = true
    grp.add(crown)
  })
  grp.position.set(x, 0, z)
  grp.userData = { decor: true }
  return grp
}

// ---------- ถนนมอดินแดง + ถนนภายในหอพัก ----------
function addRoads(root: THREE.Group, p: CampusPalette) {
  const lineMat = new THREE.MeshBasicMaterial({ color: p.roadLine })
  const edgeMat = new THREE.MeshBasicMaterial({ color: p.roadLine, transparent: true, opacity: 0.72 })
  const shoulderMat = new THREE.MeshStandardMaterial({ color: p.roadShoulder, roughness: 1 })
  const pavementMat = new THREE.MeshStandardMaterial({ color: p.pavement, roughness: 0.97 })
  const curbMat = new THREE.MeshStandardMaterial({ color: p.curb, roughness: 0.92 })
  const drainMat = new THREE.MeshStandardMaterial({ color: p.metal, roughness: 0.58, metalness: 0.52 })
  const mainRoadMap = makeSurfaceTexture(0x1a3f92, 1800)
  const internalRoadMap = makeSurfaceTexture(0x7b215d, 1400)
  mainRoadMap.repeat.set(20, 2)
  internalRoadMap.repeat.set(12, 2)
  disposables.push(lineMat, edgeMat, shoulderMat, pavementMat, curbMat, drainMat)

  const style: Record<RoadKind, { width: number; color: number; dashLength: number; dashGap: number; edges: boolean }> = {
    main: { width: 9, color: p.roadMain, dashLength: 4.2, dashGap: 4.8, edges: true },
    internal: { width: 6, color: p.road, dashLength: 2.8, dashGap: 4.2, edges: false },
  }
  const mats = Object.fromEntries(
    (Object.keys(style) as RoadKind[]).map((k) => {
      const m = new THREE.MeshStandardMaterial({
        color: style[k].color,
        roughness: 0.97,
        metalness: 0.01,
        map: k === 'main' ? mainRoadMap : internalRoadMap,
      })
      disposables.push(m)
      return [k, m]
    }),
  ) as Record<RoadKind, THREE.MeshStandardMaterial>

  const dashMatrices: THREE.Matrix4[] = []
  const edgeMatrices: THREE.Matrix4[] = []
  const curbMatrices: THREE.Matrix4[] = []
  const pavementMatrices: THREE.Matrix4[] = []
  const drainMatrices: THREE.Matrix4[] = []

  for (const r of area.roads) {
    const st = style[r.kind]
    const horizontal = r.axis === 'x'

    // ไหล่ทางช่วยแยกพื้นถนนออกจากพื้นผังโดยไม่ใช้สีฉูดฉาด
    const shoulderGeo = new THREE.BoxGeometry(
      horizontal ? r.length + 1.2 : st.width + 1.2,
      0.08,
      horizontal ? st.width + 1.2 : r.length + 1.2,
    )
    disposables.push(shoulderGeo)
    const shoulder = new THREE.Mesh(shoulderGeo, shoulderMat)
    shoulder.position.set(r.x, horizontal ? 0.044 : 0.04, r.z)
    shoulder.receiveShadow = true
    shoulder.userData = { decor: true }
    root.add(shoulder)

    const geo = new THREE.BoxGeometry(horizontal ? r.length : st.width, 0.12, horizontal ? st.width : r.length)
    disposables.push(geo)
    const mesh = new THREE.Mesh(geo, mats[r.kind])
    // แนวนอนสูงกว่าแนวตั้งเล็กน้อย ป้องกัน z-fighting ตรงทางแยก
    const roadY = r.kind === 'main' ? 0.105 : horizontal ? 0.112 : 0.106
    mesh.position.set(r.x, roadY, r.z)
    mesh.receiveShadow = true
    mesh.userData = { decor: true }
    root.add(mesh)

    // เส้นประกลางถนน คำนวณให้สมมาตรจากกึ่งกลางแต่ละช่วง
    const dashStep = st.dashLength + st.dashGap
    const dashCount = Math.max(1, Math.floor((r.length - 4) / dashStep))
    const dashStart = -((dashCount - 1) * dashStep) / 2
    for (let i = 0; i < dashCount; i++) {
      const t = dashStart + i * dashStep
      dashMatrices.push(boxMatrix(
        horizontal ? r.x + t : r.x,
        roadY + 0.071,
        horizontal ? r.z : r.z + t,
        horizontal ? st.dashLength : 0.28,
        0.025,
        horizontal ? 0.28 : st.dashLength,
      ))
    }

    // ทางเท้าและขอบคันหินทั้งสองด้าน ช่วยแยกถนนออกจากลานอาคาร
    for (const side of [-1, 1]) {
      const curbOffset = side * (st.width / 2 + 0.48)
      const pavementOffset = side * (st.width / 2 + 1.34)
      curbMatrices.push(boxMatrix(
        horizontal ? r.x : r.x + curbOffset,
        0.19,
        horizontal ? r.z + curbOffset : r.z,
        horizontal ? r.length + 0.5 : 0.28,
        0.28,
        horizontal ? 0.28 : r.length + 0.5,
      ))
      pavementMatrices.push(boxMatrix(
        horizontal ? r.x : r.x + pavementOffset,
        0.115,
        horizontal ? r.z + pavementOffset : r.z,
        horizontal ? r.length : 1.45,
        0.2,
        horizontal ? 1.45 : r.length,
      ))
    }

    // ถนนมอดินแดงมีเส้นขอบสองข้าง ช่วยให้ถนนหลักอ่านง่ายขึ้นจากมุมสูง
    if (st.edges) {
      const edgeLength = Math.max(1, r.length - 1.4)
      for (const side of [-1, 1]) {
        const sideOffset = side * (st.width / 2 - 0.4)
        edgeMatrices.push(boxMatrix(
          horizontal ? r.x : r.x + sideOffset,
          roadY + 0.07,
          horizontal ? r.z + sideOffset : r.z,
          horizontal ? edgeLength : 0.18,
          0.022,
          horizontal ? 0.18 : edgeLength,
        ))
      }
    }

    if (r.name) {
      // แสดงชื่อถนน 3 จุด โดยแบ่งระยะตามแนวถนนเท่า ๆ กัน
      for (const offset of [-r.length / 3, 0, r.length / 3]) {
        const label = makeGroundText(r.name, 40, p, horizontal ? 0 : -Math.PI / 2)
        label.position.set(
          horizontal ? r.x + offset : r.x + 10,
          0.24,
          horizontal ? r.z + 9.5 : r.z + offset,
        )
        root.add(label)
      }
    }
  }

  // ทางม้าลายตรงจุดที่ถนนภายในเชื่อมถนนมอดินแดง
  for (const crossingX of [-57, -8, 68, 143]) {
    for (let stripe = 0; stripe < 6; stripe++) {
      dashMatrices.push(boxMatrix(crossingX - 2.25 + stripe * 0.9, 0.195, 58, 0.48, 0.03, 7.25))
    }
    drainMatrices.push(
      boxMatrix(crossingX - 3.45, 0.205, 52.9, 1.45, 0.08, 0.4),
      boxMatrix(crossingX + 3.45, 0.205, 63.1, 1.45, 0.08, 0.4),
    )
  }

  addInstancedBoxes(root, pavementMatrices, pavementMat, { receiveShadow: true })
  addInstancedBoxes(root, curbMatrices, curbMat, { receiveShadow: true })
  addInstancedBoxes(root, dashMatrices, lineMat)
  addInstancedBoxes(root, edgeMatrices, edgeMat)
  addInstancedBoxes(root, drainMatrices, drainMat)
}

function addBox(
  parent: THREE.Object3D,
  material: THREE.Material,
  size: [number, number, number],
  position: [number, number, number],
  options: { castShadow?: boolean; receiveShadow?: boolean; rotation?: [number, number, number] } = {},
) {
  const geometry = new THREE.BoxGeometry(...size)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  if (options.rotation) mesh.rotation.set(...options.rotation)
  mesh.castShadow = options.castShadow ?? false
  mesh.receiveShadow = options.receiveShadow ?? false
  mesh.userData = { decor: true }
  disposables.push(geometry)
  parent.add(mesh)
  return mesh
}

function addFacility(root: THREE.Group, ex: (typeof area.extras)[number], p: CampusPalette) {
  const group = new THREE.Group()
  group.position.set(ex.x, 0, ex.z)
  group.userData = { decor: true, facility: ex.kind }

  const facilityColor = theme.value === 'dark' ? ex.colorDark : ex.colorLight
  const surfaceMap = ex.flat ? makeWeatheredConcreteTexture() : undefined
  const bodyMat = new THREE.MeshStandardMaterial({
    color: facilityColor,
    roughness: ex.flat ? 1 : 0.87,
    ...(surfaceMap ? { map: surfaceMap } : {}),
  })
  const trimMat = new THREE.MeshStandardMaterial({
    color: mixColor(facilityColor, p.facadeTrim, 0.58),
    roughness: 0.78,
  })
  const frameMat = new THREE.MeshStandardMaterial({ color: p.glassFrame, roughness: 0.55, metalness: 0.18 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: p.glass,
    roughness: 0.2,
    metalness: 0.16,
    emissive: new THREE.Color(p.glassEmissive),
    emissiveIntensity: theme.value === 'dark' ? 0.62 : 0,
  })
  const metalMat = new THREE.MeshStandardMaterial({ color: p.metal, roughness: 0.58, metalness: 0.4 })
  const darkMat = new THREE.MeshStandardMaterial({ color: p.facadeBase, roughness: 0.78 })
  disposables.push(bodyMat, trimMat, frameMat, glassMat, metalMat, darkMat)

  if (ex.kind === 'court') {
    addBox(group, bodyMat, [ex.w, ex.h, ex.d], [0, ex.h / 2, 0], { receiveShadow: true })
    const lineMat = new THREE.MeshBasicMaterial({
      color: theme.value === 'dark' ? 0x9ba3aa : 0xf1eee5,
      transparent: true,
      opacity: theme.value === 'dark' ? 0.5 : 0.72,
      depthWrite: false,
    })
    const patchMat = new THREE.MeshBasicMaterial({
      color: theme.value === 'dark' ? 0x27292b : 0x777671,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    })
    disposables.push(lineMat, patchMat)
    const lineY = ex.h + 0.028
    addBox(group, lineMat, [ex.w - 1.5, 0.035, 0.18], [0, lineY, ex.d / 2 - 0.75])
    addBox(group, lineMat, [ex.w - 1.5, 0.035, 0.18], [0, lineY, -ex.d / 2 + 0.75])
    addBox(group, lineMat, [0.18, 0.035, ex.d - 1.5], [ex.w / 2 - 0.75, lineY, 0])
    addBox(group, lineMat, [0.18, 0.035, ex.d - 1.5], [-ex.w / 2 + 0.75, lineY, 0])
    addBox(group, lineMat, [0.16, 0.038, ex.d - 1.5], [0, lineY + 0.002, 0])
    const ringGeo = new THREE.RingGeometry(3.25, 3.48, 64)
    const ring = new THREE.Mesh(ringGeo, lineMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = lineY + 0.008
    ring.userData = { decor: true }
    disposables.push(ringGeo)
    group.add(ring)
    addBox(group, patchMat, [7.5, 0.02, 2.4], [-8.5, lineY + 0.002, 3.2], { rotation: [0, 0.18, 0] })
    addBox(group, patchMat, [5.2, 0.02, 3.1], [10.8, lineY + 0.002, -2.7], { rotation: [0, -0.22, 0] })

    const borderMatrices = [
      boxMatrix(0, 0.22, ex.d / 2 + 0.32, ex.w + 0.8, 0.34, 0.34),
      boxMatrix(0, 0.22, -ex.d / 2 - 0.32, ex.w + 0.8, 0.34, 0.34),
      boxMatrix(ex.w / 2 + 0.32, 0.22, 0, 0.34, 0.34, ex.d),
      boxMatrix(-ex.w / 2 - 0.32, 0.22, 0, 0.34, 0.34, ex.d),
    ]
    addInstancedBoxes(group, borderMatrices, trimMat, { receiveShadow: true })
  } else {
    const market = ex.kind === 'market'
    const bodyHeight = market ? 1.05 : ex.h
    addBox(group, bodyMat, [ex.w, bodyHeight, ex.d], [0, bodyHeight / 2, 0], {
      castShadow: true,
      receiveShadow: true,
    })
    addBox(group, trimMat, [ex.w + 0.7, 0.35, ex.d + 0.7], [0, 0.18, 0], { receiveShadow: true })
    addBox(group, trimMat, [ex.w + 0.9, 0.36, ex.d + 1], [0, ex.h + 0.18, 0], {
      castShadow: true,
      receiveShadow: true,
    })

    const frontZ = ex.d / 2 + 0.08
    if (ex.kind === 'clinic' || ex.kind === 'office') {
      const windowCount = ex.kind === 'clinic' ? 5 : 2
      const gap = ex.w / (windowCount + 1)
      for (let i = 0; i < windowCount; i++) {
        const x = -ex.w / 2 + gap * (i + 1)
        if (Math.abs(x) < 2.4) continue
        addBox(group, frameMat, [3, 1.75, 0.2], [x, ex.h * 0.58, frontZ])
        addBox(group, glassMat, [2.55, 1.35, 0.12], [x, ex.h * 0.58, frontZ + 0.14])
        addBox(group, trimMat, [3.3, 0.14, 0.6], [x, ex.h * 0.58 + 1.05, frontZ + 0.18])
      }
      addBox(group, frameMat, [3.45, 2.75, 0.24], [0, 1.55, frontZ])
      addBox(group, glassMat, [1.35, 2.35, 0.12], [-0.78, 1.55, frontZ + 0.15])
      addBox(group, glassMat, [1.35, 2.35, 0.12], [0.78, 1.55, frontZ + 0.15])
      addBox(group, trimMat, [5.8, 0.24, 2.2], [0, 3.25, frontZ + 0.9], { castShadow: true })
      addBox(group, metalMat, [0.16, 2.7, 0.16], [-2.3, 1.7, frontZ + 1.65])
      addBox(group, metalMat, [0.16, 2.7, 0.16], [2.3, 1.7, frontZ + 1.65])

      if (ex.kind === 'clinic') {
        addBox(group, trimMat, [0.6, 2.25, 0.22], [-ex.w * 0.36, 2.35, frontZ + 0.18])
        addBox(group, trimMat, [2.25, 0.6, 0.22], [-ex.w * 0.36, 2.35, frontZ + 0.18])
        const ramp = addBox(group, p.curb === p.facadeBase ? trimMat : bodyMat, [5.2, 0.18, 2.8], [4.8, 0.18, frontZ + 1.25])
        ramp.rotation.x = -0.035
        addBox(group, metalMat, [0.1, 0.8, 2.8], [2.35, 0.75, frontZ + 1.25])
        addBox(group, metalMat, [0.1, 0.8, 2.8], [7.25, 0.75, frontZ + 1.25])
      }
    } else if (ex.kind === 'cafeteria') {
      addBox(group, darkMat, [ex.w * 0.86, ex.h * 0.56, 0.22], [0, ex.h * 0.46, frontZ + 0.04])
      const columnMatrices: THREE.Matrix4[] = []
      for (let i = 0; i < 6; i++) {
        const x = -ex.w * 0.42 + (i * ex.w * 0.84) / 5
        columnMatrices.push(boxMatrix(x, ex.h * 0.46, frontZ + 0.22, 0.38, ex.h * 0.72, 0.38))
      }
      addInstancedBoxes(group, columnMatrices, trimMat, { castShadow: true })
      addBox(group, trimMat, [ex.w + 2.2, 0.28, 2.4], [0, ex.h * 0.78, frontZ + 1.05], { castShadow: true })

      const tableMatrices: THREE.Matrix4[] = []
      const benchMatrices: THREE.Matrix4[] = []
      for (const x of [-11, -4, 4, 11]) {
        tableMatrices.push(boxMatrix(x, 1.05, ex.d / 2 - 2.5, 3.2, 0.16, 1.25))
        tableMatrices.push(boxMatrix(x, 0.53, ex.d / 2 - 2.5, 0.22, 0.92, 0.22))
        benchMatrices.push(
          boxMatrix(x, 0.58, ex.d / 2 - 3.5, 3.1, 0.16, 0.45),
          boxMatrix(x, 0.58, ex.d / 2 - 1.5, 3.1, 0.16, 0.45),
        )
      }
      addInstancedBoxes(group, tableMatrices, metalMat)
      addInstancedBoxes(group, benchMatrices, trimMat)

      const ventGeo = new THREE.CylinderGeometry(0.55, 0.7, 1.5, 10)
      disposables.push(ventGeo)
      for (const x of [-8, 0, 8]) {
        const vent = new THREE.Mesh(ventGeo, metalMat)
        vent.position.set(x, ex.h + 1.05, 0)
        vent.castShadow = true
        vent.userData = { decor: true }
        group.add(vent)
      }
    } else if (market) {
      const postMatrices: THREE.Matrix4[] = []
      const stallMatrices: THREE.Matrix4[] = []
      for (const x of [-8.5, -4.25, 0, 4.25, 8.5]) {
        postMatrices.push(boxMatrix(x, ex.h / 2, -ex.d / 2 + 0.35, 0.22, ex.h, 0.22))
        postMatrices.push(boxMatrix(x, ex.h / 2, ex.d / 2 - 0.35, 0.22, ex.h, 0.22))
      }
      for (const x of [-6.4, -2.15, 2.15, 6.4]) {
        stallMatrices.push(
          boxMatrix(x, 1.05, 0, 3.55, 1.55, 2.7),
          boxMatrix(x, 2.25, 1.55, 3.9, 0.18, 1.15),
        )
      }
      addInstancedBoxes(group, postMatrices, metalMat, { castShadow: true })
      addInstancedBoxes(group, stallMatrices, trimMat, { receiveShadow: true })
      const bulbMat = new THREE.MeshStandardMaterial({
        color: p.lampGlow,
        emissive: new THREE.Color(p.lampGlow),
        emissiveIntensity: theme.value === 'dark' ? 1.8 : 0.12,
      })
      const bulbGeo = new THREE.SphereGeometry(0.18, 10, 8)
      disposables.push(bulbMat, bulbGeo)
      for (const x of [-6.4, -2.15, 2.15, 6.4]) {
        const bulb = new THREE.Mesh(bulbGeo, bulbMat)
        bulb.position.set(x, ex.h - 0.35, 0)
        bulb.userData = { decor: true }
        group.add(bulb)
      }
    }
  }

  root.add(group)
  const labelWidth = ex.flat ? 20 : Math.min(44, Math.max(32, Array.from(ex.label).length * 1.55))
  const label = makeFloatingText(ex.label, labelWidth, p)
  label.position.set(ex.x, ex.flat ? ex.h + 0.8 : ex.h + 1.45, ex.z)
  root.add(label)
}

function makeInterOfficeSignTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 384
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f7f5ef'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#9a542d'
  ctx.font = '800 112px "Noto Sans", sans-serif'
  ctx.fillText('KKU - WORA', 512, 145)
  ctx.font = '700 63px "Noto Sans", sans-serif'
  ctx.fillText('International Dormitory', 512, 255)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = textureAnisotropy()
  disposables.push(texture)
  return texture
}

// สำนักงานจริงหน้าหออินเตอร์ — อิงภาพหน้างาน: อาคารขาว 2 ชั้น หลังคายื่น ระแนง และกรอบป้ายหน้าอาคาร
function addInterOffice(root: THREE.Group, p: CampusPalette) {
  const config = area.interOffice
  const group = new THREE.Group()
  group.position.set(config.x, 0, config.z)
  group.rotation.y = THREE.MathUtils.degToRad(config.rotationY)
  group.userData = { decor: true, facility: 'inter-office' }

  const dark = theme.value === 'dark'
  const wallMat = new THREE.MeshStandardMaterial({ color: dark ? 0xb8c0ca : 0xf2f0e9, roughness: 0.84 })
  const whiteMat = new THREE.MeshStandardMaterial({ color: dark ? 0xd1d5db : 0xfffdf8, roughness: 0.8 })
  const frameMat = new THREE.MeshStandardMaterial({ color: dark ? 0x313946 : 0x555a5e, roughness: 0.52, metalness: 0.32 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: dark ? 0x28445a : 0x8ba5b0,
    roughness: 0.16,
    metalness: 0.15,
    emissive: new THREE.Color(dark ? 0x20384b : 0x000000),
    emissiveIntensity: dark ? 0.75 : 0,
  })
  const roofMat = new THREE.MeshStandardMaterial({ color: dark ? 0x3d4653 : 0xd7d5cf, roughness: 0.72, metalness: 0.08 })
  const planterMat = new THREE.MeshStandardMaterial({ color: p.curb, roughness: 0.96 })
  disposables.push(wallMat, whiteMat, frameMat, glassMat, roofMat, planterMat)

  const floorHeight = config.floorHeight
  addBox(group, wallMat, [config.w, floorHeight - 0.15, config.d], [0, floorHeight / 2, 0], { castShadow: true, receiveShadow: true })
  addBox(group, whiteMat, [config.w, floorHeight - 0.15, config.d * 0.9], [0, floorHeight * 1.5, -0.25], { castShadow: true, receiveShadow: true })
  addBox(group, roofMat, [config.w + 1.8, 0.28, config.d + 0.6], [0, floorHeight * 2 + 0.18, 0], { castShadow: true, receiveShadow: true })
  addBox(group, roofMat, [config.w + 0.5, 0.2, config.d + 0.45], [0, floorHeight + 0.05, -0.05], { receiveShadow: true })
  addBox(group, roofMat, [config.w + 3.2, 0.18, 1.2], [1.3, floorHeight - 0.18, config.d / 2 + 0.55], { castShadow: true })

  const frontZ = config.d / 2 + 0.08
  const windowFrames: THREE.Matrix4[] = []
  const windowGlass: THREE.Matrix4[] = []
  const louverMatrices: THREE.Matrix4[] = []
  for (let index = 0; index < 6; index++) {
    const x = -config.w / 2 + 2.05 + index * 2.75
    windowFrames.push(boxMatrix(x, floorHeight * 1.52, frontZ, 2.2, 1.65, 0.18))
    windowGlass.push(boxMatrix(x, floorHeight * 1.52, frontZ + 0.11, 1.84, 1.32, 0.08))
    if (index % 2 === 0) {
      for (let slat = -3; slat <= 3; slat++) {
        louverMatrices.push(boxMatrix(x + slat * 0.22, floorHeight * 1.52, frontZ + 0.19, 0.08, 1.48, 0.1))
      }
    }
  }
  addInstancedBoxes(group, windowFrames, frameMat)
  addInstancedBoxes(group, windowGlass, glassMat)
  addInstancedBoxes(group, louverMatrices, frameMat)

  addBox(group, frameMat, [4.6, 2.55, 0.2], [4.5, 1.45, frontZ + 0.05])
  addBox(group, glassMat, [2.05, 2.2, 0.1], [3.38, 1.45, frontZ + 0.18])
  addBox(group, glassMat, [2.05, 2.2, 0.1], [5.62, 1.45, frontZ + 0.18])
  for (const x of [-3.2, 2.3, 7.8]) {
    addBox(group, frameMat, [0.13, 2.75, 0.13], [x, 1.38, config.d / 2 + 0.6])
  }

  const signCenterX = -5.2
  const signZ = config.d / 2 + 0.48
  const signWidth = 10.2
  const signHeight = 3.15
  addBox(group, roofMat, [0.42, signHeight + 1, 0.52], [signCenterX - signWidth / 2, 2.05, signZ], { castShadow: true })
  addBox(group, roofMat, [signWidth + 0.45, 0.42, 0.52], [signCenterX, signHeight + 0.35, signZ], { castShadow: true })
  addBox(group, roofMat, [signWidth + 0.45, 0.42, 0.52], [signCenterX, 0.3, signZ], { receiveShadow: true })
  addBox(group, roofMat, [0.42, signHeight + 1, 0.52], [signCenterX + signWidth / 2, 2.05, signZ], { castShadow: true })

  const signGeometry = new THREE.PlaneGeometry(signWidth - 1.25, signHeight - 0.95)
  const signMaterial = new THREE.MeshBasicMaterial({ map: makeInterOfficeSignTexture(), toneMapped: false })
  const sign = new THREE.Mesh(signGeometry, signMaterial)
  sign.position.set(signCenterX, 1.95, signZ + 0.29)
  sign.userData = { decor: true }
  disposables.push(signGeometry, signMaterial)
  group.add(sign)

  const planterMatrices = [
    boxMatrix(-0.6, 0.32, config.d / 2 + 1.12, 1.4, 0.62, 1.2),
    boxMatrix(8.1, 0.32, config.d / 2 + 1.12, 1.4, 0.62, 1.2),
  ]
  addInstancedBoxes(group, planterMatrices, planterMat, { receiveShadow: true })
  root.add(group)

  const label = makeFloatingText('สำนักงานหออินเตอร์', 22, p)
  label.position.set(config.x, floorHeight * 2 + 1.4, config.z)
  root.add(label)
}

function addParkingLots(root: THREE.Group, p: CampusPalette) {
  const asphaltMap = makeSurfaceTexture(0x9071b4, 900)
  asphaltMap.repeat.set(8, 2)
  const asphaltMat = new THREE.MeshStandardMaterial({ color: p.road, roughness: 0.98, map: asphaltMap })
  const lineMat = new THREE.MeshBasicMaterial({ color: p.roadLine, transparent: true, opacity: 0.72 })
  const curbMat = new THREE.MeshStandardMaterial({ color: p.curb, roughness: 0.94 })
  const carMats = [
    new THREE.MeshStandardMaterial({ color: 0xe7e7e3, roughness: 0.48, metalness: 0.24 }),
    new THREE.MeshStandardMaterial({ color: 0x777d82, roughness: 0.45, metalness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: 0x32383e, roughness: 0.5, metalness: 0.22 }),
    new THREE.MeshStandardMaterial({ color: 0xa75835, roughness: 0.52, metalness: 0.18 }),
  ]
  const carGlassMat = new THREE.MeshStandardMaterial({ color: p.glassFrame, roughness: 0.18, metalness: 0.24 })
  disposables.push(asphaltMat, lineMat, curbMat, ...carMats, carGlassMat)

  area.parkingLots.forEach((lot, lotIndex) => {
    const group = new THREE.Group()
    group.position.set(lot.x, 0, lot.z)
    group.rotation.y = THREE.MathUtils.degToRad(lot.rotationY ?? 0)
    group.userData = { decor: true, parking: true }
    addBox(group, curbMat, [lot.w + 0.8, 0.12, lot.d + 0.8], [0, 0.08, 0], { receiveShadow: true })
    addBox(group, asphaltMat, [lot.w, 0.13, lot.d], [0, 0.16, 0], { receiveShadow: true })

    const spaceWidth = lot.w / lot.spaces
    const stripeMatrices: THREE.Matrix4[] = []
    for (let i = 0; i <= lot.spaces; i++) {
      stripeMatrices.push(boxMatrix(-lot.w / 2 + i * spaceWidth, 0.24, 0, 0.1, 0.025, lot.d - 0.8))
    }
    addInstancedBoxes(group, stripeMatrices, lineMat)

    for (let index = 0; index < lot.spaces; index++) {
      if ((index + lotIndex * 2) % 3 === 1) continue
      const x = -lot.w / 2 + spaceWidth * (index + 0.5)
      const carLength = Math.min(4.1, lot.d - 0.9)
      const carWidth = Math.min(2.05, spaceWidth * 0.68)
      const carMat = carMats[(index + lotIndex) % carMats.length]!
      addBox(group, carMat, [carWidth, 0.62, carLength], [x, 0.56, 0], { castShadow: true })
      addBox(group, carGlassMat, [carWidth * 0.78, 0.48, carLength * 0.46], [x, 1.02, -0.15], { castShadow: true })
    }
    root.add(group)
  })
}

function addEnvironmentalContext(root: THREE.Group, p: CampusPalette) {
  const fenceMat = new THREE.MeshStandardMaterial({ color: p.metal, roughness: 0.55, metalness: 0.35 })
  disposables.push(fenceMat)

  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.36, 3.2, 7)
  const crownGeo = new THREE.IcosahedronGeometry(1.8, 1)
  const trunkMat = new THREE.MeshStandardMaterial({ color: p.trunk, roughness: 1 })
  const crownMat = new THREE.MeshStandardMaterial({ color: mixColor(p.tree, p.shrub, 0.12), roughness: 0.96 })
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, area.contextTrees.length)
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, area.contextTrees.length)
  area.contextTrees.forEach((tree, index) => {
    trunks.setMatrixAt(index, boxMatrix(tree.x, 1.6 * tree.s, tree.z, tree.s, tree.s, tree.s))
    crowns.setMatrixAt(index, new THREE.Matrix4().compose(
      new THREE.Vector3(tree.x, 4.25 * tree.s, tree.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(index * 0.07, index * 0.31, index * 0.11)),
      new THREE.Vector3(1.18 * tree.s, tree.s, 1.12 * tree.s),
    ))
  })
  trunks.instanceMatrix.needsUpdate = true
  crowns.instanceMatrix.needsUpdate = true
  trunks.castShadow = true
  crowns.castShadow = true
  crowns.receiveShadow = true
  trunks.userData = { decor: true }
  crowns.userData = { decor: true }
  disposables.push(trunkGeo, crownGeo, trunkMat, crownMat)
  root.add(trunks, crowns)

  const fencePosts: THREE.Matrix4[] = []
  const fenceRails: THREE.Matrix4[] = []
  for (const fence of area.fences) {
    const horizontal = fence.axis === 'x'
    for (let offset = -fence.length / 2; offset <= fence.length / 2; offset += 4) {
      fencePosts.push(boxMatrix(horizontal ? fence.x + offset : fence.x, 0.9, horizontal ? fence.z : fence.z + offset, 0.11, 1.8, 0.11))
    }
    for (const y of [0.55, 1.25]) {
      fenceRails.push(boxMatrix(fence.x, y, fence.z, horizontal ? fence.length : 0.1, 0.1, horizontal ? 0.1 : fence.length))
    }
  }
  addInstancedBoxes(root, fencePosts, fenceMat)
  addInstancedBoxes(root, fenceRails, fenceMat)
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
  gradient.addColorStop(0, 'rgba(255, 226, 158, 0.95)')
  gradient.addColorStop(0.28, 'rgba(255, 196, 103, 0.42)')
  gradient.addColorStop(1, 'rgba(255, 183, 80, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  disposables.push(texture)
  return texture
}

function addLandscape(root: THREE.Group, p: CampusPalette) {
  const poleMat = new THREE.MeshStandardMaterial({ color: p.metal, roughness: 0.52, metalness: 0.48 })
  const bulbMat = new THREE.MeshStandardMaterial({
    color: p.lampGlow,
    emissive: new THREE.Color(p.lampGlow),
    emissiveIntensity: theme.value === 'dark' ? 2.2 : 0.08,
    roughness: 0.25,
  })
  const benchMat = new THREE.MeshStandardMaterial({ color: theme.value === 'dark' ? 0x67513d : 0x8f6e4f, roughness: 0.82 })
  const shrubMat = new THREE.MeshStandardMaterial({ color: p.shrub, roughness: 0.96 })
  const binMat = new THREE.MeshStandardMaterial({ color: p.glassFrame, roughness: 0.66, metalness: 0.22 })
  disposables.push(poleMat, bulbMat, benchMat, shrubMat, binMat)

  const poleGeo = new THREE.CylinderGeometry(0.09, 0.14, 1, 8)
  const bulbGeo = new THREE.SphereGeometry(0.28, 12, 9)
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, area.lamps.length)
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, area.lamps.length)
  area.lamps.forEach((lamp, index) => {
    const height = 5.2 * lamp.scale
    poles.setMatrixAt(index, boxMatrix(lamp.x, height / 2, lamp.z, lamp.scale, height, lamp.scale))
    bulbs.setMatrixAt(index, boxMatrix(lamp.x, height + 0.08, lamp.z, lamp.scale, lamp.scale, lamp.scale))
  })
  poles.instanceMatrix.needsUpdate = true
  bulbs.instanceMatrix.needsUpdate = true
  poles.castShadow = true
  poles.userData = { decor: true }
  bulbs.userData = { decor: true }
  disposables.push(poleGeo, bulbGeo)
  root.add(poles, bulbs)

  const armMatrices = area.lamps.map(lamp => boxMatrix(lamp.x, 4.86 * lamp.scale, lamp.z, 1.25 * lamp.scale, 0.12, 0.12, THREE.MathUtils.degToRad(lamp.rotationY)))
  addInstancedBoxes(root, armMatrices, poleMat)

  if (theme.value === 'dark') {
    const glowTexture = makeGlowTexture()
    const glowMaterial = new THREE.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    disposables.push(glowMaterial)
    area.lamps.forEach((lamp, index) => {
      const glow = new THREE.Sprite(glowMaterial)
      glow.position.set(lamp.x, 5.3 * lamp.scale, lamp.z)
      glow.scale.set(5.5, 5.5, 1)
      glow.renderOrder = 5
      glow.userData = { decor: true }
      root.add(glow)
      if ([2, 6, 10, 14].includes(index)) {
        const light = new THREE.PointLight(p.lampGlow, 7, 28, 2)
        light.position.copy(glow.position)
        root.add(light)
      }
    })
  }

  const seatMatrices: THREE.Matrix4[] = []
  const legMatrices: THREE.Matrix4[] = []
  const binMatrices: THREE.Matrix4[] = []
  area.benches.forEach((bench, index) => {
    const angle = THREE.MathUtils.degToRad(bench.rotationY)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const localToWorld = (localX: number, localZ: number) => ({
      x: bench.x + cos * localX + sin * localZ,
      z: bench.z - sin * localX + cos * localZ,
    })
    seatMatrices.push(boxMatrix(bench.x, 0.72 * bench.scale, bench.z, 3.4 * bench.scale, 0.18, 0.72 * bench.scale, angle))
    const back = localToWorld(0, -0.42 * bench.scale)
    seatMatrices.push(boxMatrix(back.x, 1.28 * bench.scale, back.z, 3.4 * bench.scale, 1.05 * bench.scale, 0.16, angle))
    for (const side of [-1, 1]) {
      const leg = localToWorld(side * 1.25 * bench.scale, 0)
      legMatrices.push(boxMatrix(leg.x, 0.35 * bench.scale, leg.z, 0.18, 0.7 * bench.scale, 0.5 * bench.scale, angle))
    }
    if (index % 2 === 0) {
      const bin = localToWorld(2.25 * bench.scale, 0)
      binMatrices.push(boxMatrix(bin.x, 0.58, bin.z, 0.62, 1.16, 0.62, angle))
    }
  })
  addInstancedBoxes(root, seatMatrices, benchMat, { castShadow: true })
  addInstancedBoxes(root, legMatrices, poleMat)
  addInstancedBoxes(root, binMatrices, binMat)

  const shrubGeo = new THREE.IcosahedronGeometry(1, 1)
  const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, area.shrubs.length)
  area.shrubs.forEach((shrub, index) => {
    const scale = shrub.scale
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(shrub.x, 0.62 * scale, shrub.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, THREE.MathUtils.degToRad(shrub.rotationY), 0)),
      new THREE.Vector3(1.2 * scale, 0.72 * scale, scale),
    )
    shrubs.setMatrixAt(index, matrix)
  })
  shrubs.instanceMatrix.needsUpdate = true
  shrubs.castShadow = true
  shrubs.receiveShadow = true
  shrubs.userData = { decor: true }
  disposables.push(shrubGeo)
  root.add(shrubs)
}

// ---------- สร้างฉากทั้งหมด ----------
function buildScene() {
  if (!renderer) return
  const p = pal()

  disposables.forEach(d => d.dispose())
  disposables.length = 0
  pickables = []
  buildingDetails.clear()
  adaptiveLabels.length = 0

  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = theme.value === 'dark' ? 1.08 : 1.03
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  scene.background = new THREE.Color(p.background)
  scene.fog = new THREE.Fog(p.fog, 245, 545)
  scene.add(makeSkyDome(p))

  const hemi = new THREE.HemisphereLight(p.hemiSky, p.hemiGround, theme.value === 'dark' ? 1.18 : 1.05)
  scene.add(hemi)
  if (theme.value === 'dark') {
    // Soft moon/facade fill keeps the dorm mass readable without casting more shadows.
    scene.add(new THREE.AmbientLight(0x91a8cc, 0.34))
    const facadeFill = new THREE.DirectionalLight(0xffd7ad, 0.42)
    facadeFill.position.set(-90, 55, 120)
    scene.add(facadeFill)

    // Two localized pools brighten the active residential clusters on medium/high devices.
    if (renderProfile.quality !== 'low') {
      for (const [x, z] of [[-32, 10], [105, 8]] as const) {
        const dormLight = new THREE.PointLight(0xffd3a0, 115, 115, 1.65)
        dormLight.position.set(x, 30, z + 30)
        scene.add(dormLight)
      }
    }
  }
  const sun = new THREE.DirectionalLight(p.sun, p.sunIntensity)
  sun.position.set(80, 130, 70)
  sun.castShadow = renderProfile.shadows
  sun.shadow.mapSize.set(renderProfile.shadowSize, renderProfile.shadowSize)
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 450
  const sBound = 190
  sun.shadow.camera.left = -sBound
  sun.shadow.camera.right = sBound
  sun.shadow.camera.top = sBound
  sun.shadow.camera.bottom = -sBound
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.035
  scene.add(sun)

  const groundMap = makeSurfaceTexture(0x4ca92d, 1700)
  groundMap.repeat.set(22, 22)
  const groundGeo = new THREE.PlaneGeometry(720, 720)
  const groundMat = new THREE.MeshStandardMaterial({ color: p.ground, roughness: 1, map: groundMap })
  disposables.push(groundGeo, groundMat)
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  const grid = new THREE.GridHelper(720, 72, p.grid, p.grid)
  ;(grid.material as THREE.Material).opacity = 0.075
  ;(grid.material as THREE.Material).transparent = true
  grid.position.y = 0.02
  disposables.push(grid.geometry, grid.material as THREE.Material)
  scene.add(grid)

  const root = new THREE.Group()
  scene.add(root)

  addRoads(root, p)
  root.add(makeNorthArrow(p))
  addEnvironmentalContext(root, p)
  addParkingLots(root, p)

  for (const b of area.buildings) addBuilding(root, b, p)
  for (const ex of area.extras) addFacility(root, ex, p)
  addInterOffice(root, p)

  for (const t of area.trees) scene.add(makeTree(t.x, t.z, t.s, p))
  addLandscape(root, p)

  applyHighlight()
  setCameraForMode(mode.value === 'building' ? 'building' : 'campus', true)
  renderer.shadowMap.needsUpdate = renderProfile.shadows
}

// ---------- ไฮไลต์ตามสถานะ ----------
// three.js ฝัง define OPAQUE ลงใน shader ตอน compile ครั้งแรกถ้า material ไม่โปร่งใส
// การสลับ mat.transparent ภายหลังจึงต้องสั่ง recompile (needsUpdate) ไม่งั้น shader เดิม
// จะบังคับ alpha = 1 ทำให้ตึกไม่จางแม้ตั้ง opacity แล้ว (อาการ: ต้องสลับธีมก่อนถึงจะจาง)
function setFade(mat: THREE.MeshStandardMaterial, transparent: boolean, opacity: number) {
  if (mat.transparent !== transparent) {
    mat.transparent = transparent
    mat.needsUpdate = true
  }
  mat.opacity = opacity
}

function applyHighlight() {
  const p = pal()
  const accent = new THREE.Color(p.accent)
  for (const m of pickables) {
    const { buildingCode: code, floor, context } = m.userData as { buildingCode: string; floor: number; context: boolean }
    const mat = m.material as THREE.MeshStandardMaterial
    if (context) {
      // ตึกของอีกหอ — จางลงอีกเมื่อกำลังโฟกัสตึกของหอที่เลือก
      setFade(mat, true, selectedCode.value ? 0.25 : 0.8)
      if (theme.value === 'dark') {
        mat.emissive.set(mixColor(buildingColor(buildingOf(code), p), p.hemiSky, 0.22))
        mat.emissiveIntensity = 0.055
      } else {
        mat.emissiveIntensity = 0
      }
      continue
    }
    const dimOther = selectedCode.value !== null && selectedCode.value !== code
    setFade(mat, dimOther, dimOther ? 0.15 : 1)
    const hovered = hoverFloor.code === code && hoverFloor.floor === floor
    if (theme.value === 'dark' && !hovered) {
      mat.emissive.set(mixColor(buildingColor(buildingOf(code), p), p.lampGlow, 0.18))
      mat.emissiveIntensity = dimOther ? 0.035 : 0.115
    } else {
      mat.emissive.set(accent)
      mat.emissiveIntensity = hovered ? 0.5 : 0
    }
    mat.color.set(buildingColor(buildingOf(code), p))
  }

  for (const [code, details] of buildingDetails) {
    const selected = selectedCode.value
    details.visible = mode.value !== 'diving' && (selected === null || selected === code)
  }
}

// ---------- กล้อง ----------
function buildingOf(code: string) {
  return area.buildings.find(x => x.code === code)!
}

function buildingCenter(code: string): THREE.Vector3 {
  const b = buildingOf(code)
  const shape = shapeOf(b)
  const center = new THREE.Vector3(0, (b.floors * shape.floorHeight) / 2, -shape.wing.d / 2)
  center.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(b.rotationY))
  return center.add(new THREE.Vector3(b.x, 0, b.z))
}

function setCameraForMode(m: 'campus' | 'building', instant = false) {
  const focus = area.focus[props.dormGroupId]!
  if (m === 'campus') {
    desiredPos.set(focus.x + focus.radius * 0.62, focus.radius * 0.7, focus.z + focus.radius * 0.88)
    desiredTarget.set(focus.x, 6, focus.z)
    if (controls) {
      controls.enabled = true
      controls.minDistance = 70
      controls.maxDistance = 360
    }
  } else if (selectedCode.value) {
    const b = buildingOf(selectedCode.value)
    const shape = shapeOf(b)
    const c = buildingCenter(selectedCode.value)
    const halfVerticalFov = THREE.MathUtils.degToRad(camera?.fov ?? 45) / 2
    const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * (camera?.aspect ?? 1))
    const limitingHalfFov = Math.min(halfVerticalFov, halfHorizontalFov)
    const boundRadius = Math.hypot(
      shape.main.w / 2,
      (shape.main.d + shape.wing.d) / 2,
      (b.floors * shape.floorHeight) / 2,
    )
    // Keep enough breathing room around the whole L-shaped building.  The old
    // radius was technically outside the mesh, but was close enough that an
    // immediate orbit could put the near face across almost the whole screen.
    const viewDistance = Math.max(132, (boundRadius / Math.sin(limitingHalfFov)) * 1.42)
    const viewDirection = new THREE.Vector3(0.48, 0.46, 0.75).normalize()
    desiredPos.copy(c).addScaledVector(viewDirection, viewDistance)
    desiredTarget.copy(c)
    if (controls) {
      controls.enabled = true
      controls.minDistance = Math.max(boundRadius * 2.8, viewDistance * 0.72)
      controls.maxDistance = Math.max(260, viewDistance * 2.8)
    }
  }
  transitioning = true
  if (instant && camera && controls) {
    camera.position.copy(desiredPos)
    controls.target.copy(desiredTarget)
    controls.update()
    transitioning = false
  }
}

function dive(code: string, floor: number) {
  const b = buildingOf(code)
  const fh = shapeOf(b).floorHeight
  const floorY = (floor - 1) * fh + fh / 2
  for (const m of pickables) {
    const u = m.userData as { buildingCode: string; floor: number }
    if (u.buildingCode === code && u.floor > floor) {
      setFade(m.material as THREE.MeshStandardMaterial, true, 0.05)
    }
  }
  mode.value = 'diving'
  diveTarget = { code, floor }
  diveEmitted = false
  applyHighlight()
  if (controls) controls.enabled = false
  desiredPos.set(b.x, floorY + 48, b.z + 0.01)
  desiredTarget.set(b.x, floorY, b.z)
  transitioning = true
  diveResolveAt = performance.now() + 850
}

// ---------- pointer ----------
function updatePointer(e: Pick<PointerEvent, 'clientX' | 'clientY'>) {
  const rect = renderer!.domElement.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}

function pick() {
  if (!camera) return null
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(pickables, false)
  if (!hits.length) return null
  return hits[0]!.object.userData as { buildingCode: string; floor: number; dormGroupId: string; context: boolean }
}

function onMove(e: PointerEvent) {
  if (pointerPress?.pointerId === e.pointerId && Math.hypot(e.clientX - pointerPress.x, e.clientY - pointerPress.y) > CLICK_SLOP) {
    pointerDragged = true
  }
  if (mode.value === 'diving' || !renderer) return
  updatePointer(e)
  const hit = pick()
  const el = renderer.domElement
  if (!hit) {
    hoverFloor.code = ''
    hoverFloor.floor = 0
    hoverLabel.value = null
    el.style.cursor = 'grab'
    applyHighlight()
    return
  }
  const b = buildingOf(hit.buildingCode)
  if (hit.context) {
    hoverFloor.code = ''
    hoverFloor.floor = 0
    hoverLabel.value = {
      x: e.clientX, y: e.clientY,
      text: area.dormNames[hit.dormGroupId] ?? '',
      sub: 'กดเพื่อสลับไปดูหอนี้',
    }
  } else if (mode.value === 'building' && hit.buildingCode === selectedCode.value) {
    hoverFloor.code = hit.buildingCode
    hoverFloor.floor = hit.floor
    const info = props.availability[hit.buildingCode]?.[hit.floor]
    hoverLabel.value = {
      x: e.clientX, y: e.clientY,
      text: `ชั้น ${hit.floor}`,
      sub: info ? `ว่าง ${info.available} จาก ${info.total} ห้อง · กดเพื่อดูแผนผัง` : 'ยังไม่มีข้อมูลห้องชั้นนี้',
    }
  } else {
    hoverFloor.code = ''
    hoverFloor.floor = 0
    const hasAny = !!props.availability[hit.buildingCode]
    hoverLabel.value = {
      x: e.clientX, y: e.clientY,
      text: b.label,
      sub: hasAny ? `${b.floors} ชั้น · กดเพื่อเลือก` : `${b.floors} ชั้น · ยังไม่เปิดข้อมูลห้อง`,
    }
  }
  el.style.cursor = 'pointer'
  applyHighlight()
}

function activatePickedObject() {
  if (mode.value === 'diving') return
  const hit = pick()
  if (!hit) return
  if (hit.context) {
    emit('switch-dorm', hit.dormGroupId)
    return
  }
  if (mode.value === 'campus') {
    selectedCode.value = hit.buildingCode
    mode.value = 'building'
    hoverLabel.value = null
    applyHighlight()
    setCameraForMode('building')
  } else if (mode.value === 'building') {
    if (hit.buildingCode !== selectedCode.value) {
      selectedCode.value = hit.buildingCode
      applyHighlight()
      setCameraForMode('building')
      return
    }
    if (!props.availability[hit.buildingCode]?.[hit.floor]) return
    hoverLabel.value = null
    dive(hit.buildingCode, hit.floor)
  }
}

function onPointerDown(e: PointerEvent) {
  if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
  pointerPress = { pointerId: e.pointerId, x: e.clientX, y: e.clientY }
  pointerDragged = false
}

function onPointerUp(e: PointerEvent) {
  const shouldActivate = pointerPress?.pointerId === e.pointerId && !pointerDragged
  pointerPress = null
  pointerDragged = false
  if (!shouldActivate || mode.value === 'diving' || !renderer) return
  updatePointer(e)
  activatePickedObject()
}

function onPointerCancel() {
  pointerPress = null
  pointerDragged = false
}

function onControlsStart() {
  if (mode.value === 'diving') return

  // A user often starts dragging as soon as they click a building.  OrbitControls
  // used to cancel the camera tween at that intermediate point, which could leave
  // the camera almost touching (or visually inside) the building.  Finish the
  // focus transition first so the drag always begins from a safe orbit radius.
  if (transitioning && camera && controls) {
    camera.position.copy(desiredPos)
    controls.target.copy(desiredTarget)
    controls.update()
  }
  transitioning = false
}

function backToCampus() {
  diveTarget = null
  diveEmitted = false
  diveResolveAt = 0
  if (controls) controls.enabled = true
  selectedCode.value = null
  mode.value = 'campus'
  hoverLabel.value = null
  applyHighlight()
  setCameraForMode('campus')
}

// ---------- ลูปเรนเดอร์ ----------
function tick(now = performance.now()) {
  raf = requestAnimationFrame(tick)
  if (!renderer || !scene || !camera || !controls) return
  if (document.hidden || !sceneInViewport) return

  if (renderProfile.maxFps < 60) {
    const frameInterval = 1000 / renderProfile.maxFps
    if (now - lastFrameAt + 0.5 < frameInterval) return
    lastFrameAt = now
  }

  if (transitioning) {
    camera.position.lerp(desiredPos, 0.08)
    controls.target.lerp(desiredTarget, 0.08)
    if (camera.position.distanceTo(desiredPos) < 0.6 && mode.value !== 'diving') transitioning = false
  }

  controls.autoRotate = mode.value === 'campus' && !transitioning && !reduceMotion && renderProfile.autoRotate
  controls.update()
  updateAdaptiveLabels()

  if (mode.value === 'diving' && !diveEmitted && diveTarget && performance.now() >= diveResolveAt) {
    diveEmitted = true
    emit('select-floor', { buildingCode: diveTarget.code, floor: diveTarget.floor })
  }

  renderer.render(scene, camera)
}

function resize() {
  if (!renderer || !camera || !host.value) return
  const w = host.value.clientWidth
  const h = host.value.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

onMounted(() => {
  if (!host.value) return
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  renderProfile = detectRenderProfile()
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, renderProfile.pixelRatioCap))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.shadowMap.enabled = renderProfile.shadows
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.domElement.dataset.renderQuality = renderProfile.quality
  renderer.domElement.dataset.maxFps = String(renderProfile.maxFps)
  renderer.domElement.dataset.pixelRatio = String(Math.min(window.devicePixelRatio || 1, renderProfile.pixelRatioCap))
  renderer.domElement.dataset.shadows = String(renderProfile.shadows)
  host.value.appendChild(renderer.domElement)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.cursor = 'grab'

  camera = new THREE.PerspectiveCamera(45, 1, 0.5, 1200)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 30
  controls.maxDistance = 320
  controls.maxPolarAngle = Math.PI / 2.15
  controls.autoRotateSpeed = 0.55
  controls.addEventListener('start', onControlsStart)

  resize()
  buildScene()
  tick()

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointercancel', onPointerCancel)
  ro = new ResizeObserver(resize)
  ro.observe(host.value)
  visibilityObserver = new IntersectionObserver(([entry]) => {
    sceneInViewport = entry?.isIntersecting ?? true
    if (sceneInViewport) lastFrameAt = 0
  }, { rootMargin: '120px' })
  visibilityObserver.observe(host.value)

  // hook สำหรับทดสอบอัตโนมัติเท่านั้น (เฉพาะ dev)
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__campus3d = {
      focus: (code: string) => {
        selectedCode.value = code
        mode.value = 'building'
        applyHighlight()
        setCameraForMode('building')
      },
      dive: (code: string, floor: number) => {
        selectedCode.value = code
        mode.value = 'building'
        applyHighlight()
        dive(code, floor)
      },
      metrics: () => ({
        profile: { ...renderProfile },
        pixelRatio: renderer?.getPixelRatio(),
        render: renderer ? { ...renderer.info.render } : null,
        memory: renderer ? { ...renderer.info.memory } : null,
      }),
    }
  }
})

// เปลี่ยนหอ = โฟกัสกล้องใหม่ + สลับตึกจาง/เต็ม (สร้างฉากใหม่ให้ริบบิ้นหน้าต่างย้ายหอ)
watch(() => props.dormGroupId, () => {
  diveTarget = null
  diveEmitted = false
  diveResolveAt = 0
  if (controls) controls.enabled = true
  selectedCode.value = null
  mode.value = 'campus'
  hoverLabel.value = null
  buildScene()
})

watch(theme, () => buildScene())

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  visibilityObserver?.disconnect()
  renderer?.domElement.removeEventListener('pointerdown', onPointerDown)
  renderer?.domElement.removeEventListener('pointermove', onMove)
  renderer?.domElement.removeEventListener('pointerup', onPointerUp)
  renderer?.domElement.removeEventListener('pointercancel', onPointerCancel)
  controls?.removeEventListener('start', onControlsStart)
  controls?.dispose()
  disposables.forEach(d => d.dispose())
  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null
  scene = null
})

const headerLabel = computed(() =>
  mode.value === 'campus'
    ? area.dormNames[props.dormGroupId]
    : area.buildings.find(b => b.code === selectedCode.value)?.label ?? '',
)
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border bg-card">
    <div ref="host" class="h-[58svh] min-h-105 w-full sm:h-[62vh]" />

    <!-- แถบสถานะ/คำแนะนำ ซ้ายบน -->
    <div class="pointer-events-none absolute left-2 right-2 top-2 flex flex-col gap-1.5 sm:left-3 sm:right-auto sm:top-3 sm:max-w-[70%] sm:gap-2">
      <div class="pointer-events-auto flex w-fit max-w-full items-center gap-2 rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
        <Building2Icon class="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span class="truncate text-sm font-semibold">{{ headerLabel }}</span>
      </div>
      <p class="w-fit max-w-full rounded-lg border bg-background/92 px-2.5 py-1.5 text-xs leading-relaxed text-foreground shadow-sm backdrop-blur sm:border-0 sm:bg-background/75 sm:py-1 sm:text-muted-foreground sm:shadow-none">
        <template v-if="mode === 'campus'">
          <MousePointerClickIcon class="mb-0.5 mr-1 inline size-3" aria-hidden="true" />กดที่ตึกเพื่อเลือกอาคาร · ลากหมุนดูรอบ · ตึกจางคืออีกหอ กดเพื่อสลับ
        </template>
        <template v-else-if="mode === 'building'">
          <MousePointerClickIcon class="mb-0.5 mr-1 inline size-3" aria-hidden="true" />กดที่ "ชั้น" บนตึกเพื่อเปิดแผนผังห้องของชั้นนั้น
        </template>
        <template v-else>กำลังเข้าสู่แผนผังห้อง…</template>
      </p>
    </div>

    <!-- ปุ่มย้อนกลับ ขวาบน -->
    <div class="absolute right-3 top-3 flex gap-2">
      <Button v-if="mode !== 'campus'" size="sm" variant="secondary" class="shadow-sm" @click="backToCampus">
        <ArrowLeftIcon aria-hidden="true" /> ดูทุกอาคาร
      </Button>
    </div>

    <!-- ป้ายลอยตามเมาส์ -->
    <div
      v-if="hoverLabel"
      class="pointer-events-none fixed z-50 -translate-x-1/2 translate-y-[-130%] rounded-lg border bg-popover px-2.5 py-1.5 text-center shadow-md"
      :style="{ left: hoverLabel.x + 'px', top: hoverLabel.y + 'px' }"
    >
      <p class="text-sm font-semibold leading-tight">{{ hoverLabel.text }}</p>
      <p class="text-xs text-muted-foreground">{{ hoverLabel.sub }}</p>
    </div>

    <!-- คำอธิบายประเภทถนน ล่างซ้าย -->
    <div class="pointer-events-none absolute bottom-3 left-3 hidden space-y-1 rounded-xl border bg-background/85 px-3 py-2 backdrop-blur sm:block">
      <p
        v-for="item in roadLegend"
        :key="item.label"
        class="flex items-center gap-2 text-[11px] leading-tight text-muted-foreground"
      >
        <span class="inline-block h-1.5 w-5 shrink-0 rounded-full border border-black/10 dark:border-white/10" :style="{ background: item.color }" />
        {{ item.label }}
      </p>
    </div>

    <div class="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full border bg-background/90 px-2.5 py-1 text-[11px] text-foreground shadow-sm backdrop-blur sm:bottom-3 sm:right-3 sm:border-0 sm:bg-background/70 sm:text-muted-foreground sm:shadow-none">
      <Rotate3dIcon class="size-3.5" aria-hidden="true" /> มุมมอง 3 มิติ · ผังอิงแผนที่จริง
    </div>
  </div>
</template>
