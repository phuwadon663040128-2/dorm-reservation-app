<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ArrowLeftIcon, Building2Icon, MousePointerClickIcon, Rotate3dIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/useTheme'
import { CAMPUS_PALETTES, campusArea } from '@/lib/campus3d'
import type { Building3DConfig, CampusPalette } from '@/lib/campus3d'

// ฉากตึก 3 มิติทั้งพื้นที่ (อิงแผนที่จริง): หอที่เลือก = ตึกสีเต็มกดได้ · อีกหอ = ตึกจาง กดเพื่อสลับหอ
// มีถนน ถ.ประตูเขียว + ถนนภายใน + ป้ายชื่อบนพื้น + ลูกศรทิศเหนือ เพื่อให้เทียบตำแหน่งกับของจริงได้
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
const disposables: { dispose: () => void }[] = []
let ro: ResizeObserver | null = null

const desiredPos = new THREE.Vector3()
const desiredTarget = new THREE.Vector3()
let transitioning = false
let diveResolveAt = 0
let diveTarget: { code: string; floor: number } | null = null
let diveEmitted = false
const hoverFloor = { code: '', floor: 0 }

function pal(): CampusPalette {
  return CAMPUS_PALETTES[theme.value === 'dark' ? 'dark' : 'light']
}

function isContext(b: Building3DConfig) {
  return b.dormGroupId !== props.dormGroupId
}

function shapeOf(b: Building3DConfig) {
  return area.lShape[b.dormGroupId]!
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
  mesh.position.set(-28, 0.22, 40) // ลานโล่งกลางพื้นที่ ใต้โรงอาหาร มองเห็นจากมุมกล้องเริ่มต้น
  mesh.userData = { decor: true }
  return mesh
}

// ---------- ตึกรูปตัว L หนึ่งหลัง ----------
function addBuilding(root: THREE.Group, b: Building3DConfig, p: CampusPalette, winMatrices: THREE.Matrix4[]) {
  const { main, wing, floorHeight: fh } = shapeOf(b)
  const context = isContext(b)
  const g = new THREE.Group()
  g.position.set(b.x, 0, b.z)
  g.rotation.y = THREE.MathUtils.degToRad(b.rotationY)
  const gWorld = new THREE.Matrix4().compose(
    new THREE.Vector3(b.x, 0, b.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, THREE.MathUtils.degToRad(b.rotationY), 0)),
    new THREE.Vector3(1, 1, 1),
  )

  const gap = 0.18
  const wallMat = new THREE.MeshStandardMaterial({
    color: context ? p.wallContext : p.wall,
    roughness: 0.82,
    metalness: 0.04,
    transparent: context,
    opacity: context ? 0.8 : 1,
  })
  const roofMat = new THREE.MeshStandardMaterial({ color: p.roof, roughness: 0.9, transparent: context, opacity: context ? 0.8 : 1 })
  disposables.push(wallMat, roofMat)

  // ปีกตั้งฉากเกาะปลายปีกหลัก — mirror = สลับไปปลายอีกฝั่ง (ตึกคู่กระจกเงา)
  const wingCx = (b.mirror ? -1 : 1) * (main.w / 2 - wing.w / 2)
  const wings = [
    { w: main.w, d: main.d, cx: 0, cz: 0 },
    { w: wing.w, d: wing.d, cx: wingCx, cz: -(main.d / 2 + wing.d / 2) },
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

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: p.grid, transparent: true, opacity: context ? 0.2 : 0.5 }),
      )
      disposables.push(edges.geometry, edges.material as THREE.Material)
      edges.position.copy(mesh.position)
      edges.userData = { decor: true }
      g.add(edges)

      // ริบบิ้นหน้าต่าง 4 ด้าน — เก็บ matrix ไปทำ InstancedMesh รวม (เฉพาะหอที่เลือก ให้อีกหอดูจาง)
      if (!context) {
        const bandH = (fh - gap) * 0.5
        const faces = [
          { sx: w.w * 0.86, sy: bandH, sz: 0.3, dx: 0, dz: w.d / 2 + 0.05 },
          { sx: w.w * 0.86, sy: bandH, sz: 0.3, dx: 0, dz: -(w.d / 2 + 0.05) },
          { sx: 0.3, sy: bandH, sz: w.d * 0.82, dx: w.w / 2 + 0.05, dz: 0 },
          { sx: 0.3, sy: bandH, sz: w.d * 0.82, dx: -(w.w / 2 + 0.05), dz: 0 },
        ]
        for (const fc of faces) {
          const local = new THREE.Matrix4().compose(
            new THREE.Vector3(w.cx + fc.dx, y, w.cz + fc.dz),
            new THREE.Quaternion(),
            new THREE.Vector3(fc.sx, fc.sy, fc.sz),
          )
          winMatrices.push(new THREE.Matrix4().multiplyMatrices(gWorld, local))
        }
      }
    }
  }

  for (const w of wings) {
    const roofGeo = new THREE.BoxGeometry(w.w + 0.4, 0.5, w.d + 0.4)
    disposables.push(roofGeo)
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.set(w.cx, b.floors * fh + 0.25, w.cz)
    roof.castShadow = !context
    roof.userData = { decor: true }
    g.add(roof)
  }

  root.add(g)

  // ป้ายชื่ออาคารบนพื้นหน้าตึก
  const label = makeGroundText(b.label, 26, p)
  label.position.set(b.x, 0.22, b.z + shapeOf(b).main.d / 2 + 5)
  root.add(label)
}

function makeTree(x: number, z: number, s: number, p: CampusPalette) {
  const grp = new THREE.Group()
  const trunkGeo = new THREE.CylinderGeometry(0.3 * s, 0.4 * s, 2.2 * s, 6)
  const leafGeo = new THREE.ConeGeometry(2 * s, 4.5 * s, 8)
  const trunkMat = new THREE.MeshStandardMaterial({ color: p.trunk, roughness: 1 })
  const leafMat = new THREE.MeshStandardMaterial({ color: p.tree, roughness: 0.9 })
  disposables.push(trunkGeo, leafGeo, trunkMat, leafMat)
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.y = 1.1 * s
  const leaf = new THREE.Mesh(leafGeo, leafMat)
  leaf.position.y = 4 * s
  leaf.castShadow = true
  grp.add(trunk, leaf)
  grp.position.set(x, 0, z)
  grp.userData = { decor: true }
  return grp
}

// ---------- ถนน + เส้นแบ่งเลน ----------
function addRoads(root: THREE.Group, p: CampusPalette) {
  const roadMat = new THREE.MeshStandardMaterial({ color: p.road, roughness: 1 })
  const lineMat = new THREE.MeshBasicMaterial({ color: p.roadLine })
  disposables.push(roadMat, lineMat)
  const width = 7
  for (const r of area.roads) {
    const horizontal = r.axis === 'x'
    const geo = new THREE.BoxGeometry(horizontal ? r.length : width, 0.12, horizontal ? width : r.length)
    disposables.push(geo)
    const mesh = new THREE.Mesh(geo, roadMat)
    mesh.position.set(r.x, 0.06, r.z)
    mesh.receiveShadow = true
    mesh.userData = { decor: true }
    root.add(mesh)

    // เส้นประกลางถนน
    const dashCount = Math.floor(r.length / 7)
    for (let i = 0; i < dashCount; i++) {
      const t = -r.length / 2 + 4 + i * 7
      const dashGeo = new THREE.BoxGeometry(horizontal ? 3 : 0.45, 0.13, horizontal ? 0.45 : 3)
      disposables.push(dashGeo)
      const dash = new THREE.Mesh(dashGeo, lineMat)
      dash.position.set(horizontal ? r.x + t : r.x, 0.13, horizontal ? r.z : r.z + t)
      dash.userData = { decor: true }
      root.add(dash)
    }

    if (r.name) {
      const label = makeGroundText(r.name, 34, p, horizontal ? 0 : -Math.PI / 2)
      label.position.set(
        horizontal ? r.x - r.length / 4 : r.x + 9,
        0.24,
        horizontal ? r.z + 8.5 : r.z - r.length / 5,
      )
      root.add(label)
    }
  }
}

// ---------- สร้างฉากทั้งหมด ----------
function buildScene() {
  if (!renderer) return
  const p = pal()

  disposables.forEach(d => d.dispose())
  disposables.length = 0
  pickables = []

  scene = new THREE.Scene()
  scene.background = new THREE.Color(p.background)
  scene.fog = new THREE.Fog(p.fog, 230, 520)

  const hemi = new THREE.HemisphereLight(p.hemiSky, p.hemiGround, 1.1)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(p.sun, p.sunIntensity)
  sun.position.set(80, 130, 70)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 450
  const sBound = 190
  sun.shadow.camera.left = -sBound
  sun.shadow.camera.right = sBound
  sun.shadow.camera.top = sBound
  sun.shadow.camera.bottom = -sBound
  sun.shadow.bias = -0.0004
  scene.add(sun)

  const groundGeo = new THREE.PlaneGeometry(720, 720)
  const groundMat = new THREE.MeshStandardMaterial({ color: p.ground, roughness: 1 })
  disposables.push(groundGeo, groundMat)
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  const grid = new THREE.GridHelper(720, 72, p.grid, p.grid)
  ;(grid.material as THREE.Material).opacity = 0.22
  ;(grid.material as THREE.Material).transparent = true
  grid.position.y = 0.02
  scene.add(grid)

  const root = new THREE.Group()
  scene.add(root)

  addRoads(root, p)
  root.add(makeNorthArrow(p))

  const winMatrices: THREE.Matrix4[] = []
  for (const b of area.buildings) addBuilding(root, b, p, winMatrices)

  const winGeo = new THREE.BoxGeometry(1, 1, 1)
  const winMat = new THREE.MeshStandardMaterial({
    color: p.glass,
    roughness: 0.25,
    metalness: 0.1,
    emissive: new THREE.Color(p.glassEmissive),
    emissiveIntensity: p.glassEmissiveIntensity,
  })
  disposables.push(winGeo, winMat)
  const windows = new THREE.InstancedMesh(winGeo, winMat, winMatrices.length)
  winMatrices.forEach((m, i) => windows.setMatrixAt(i, m))
  windows.instanceMatrix.needsUpdate = true
  windows.userData = { decor: true }
  scene.add(windows)

  const extraMat = new THREE.MeshStandardMaterial({ color: p.extra, roughness: 0.9 })
  disposables.push(extraMat)
  for (const ex of area.extras) {
    const geo = new THREE.BoxGeometry(ex.w, ex.h, ex.d)
    disposables.push(geo)
    const mesh = new THREE.Mesh(geo, extraMat)
    mesh.position.set(ex.x, ex.h / 2, ex.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { decor: true }
    scene.add(mesh)
    const label = makeGroundText(ex.label, 22, p)
    label.position.set(ex.x, 0.22, ex.z + ex.d / 2 + 4)
    scene.add(label)
  }

  for (const t of area.trees) scene.add(makeTree(t.x, t.z, t.s, p))

  applyHighlight()
  setCameraForMode(mode.value === 'building' ? 'building' : 'campus', true)
}

// ---------- ไฮไลต์ตามสถานะ ----------
function applyHighlight() {
  const p = pal()
  const accent = new THREE.Color(p.accent)
  for (const m of pickables) {
    const { buildingCode: code, floor, context } = m.userData as { buildingCode: string; floor: number; context: boolean }
    const mat = m.material as THREE.MeshStandardMaterial
    if (context) {
      // ตึกของอีกหอ — จางลงอีกเมื่อกำลังโฟกัสตึกของหอที่เลือก
      mat.transparent = true
      mat.opacity = selectedCode.value ? 0.25 : 0.8
      mat.emissiveIntensity = 0
      continue
    }
    const dimOther = selectedCode.value !== null && selectedCode.value !== code
    mat.transparent = dimOther
    mat.opacity = dimOther ? 0.15 : 1
    const hasData = !!props.availability[code]?.[floor]
    mat.emissive.set(accent)
    mat.emissiveIntensity = hoverFloor.code === code && hoverFloor.floor === floor ? 0.5 : 0
    mat.color.set(hasData ? p.wall : p.roof)
  }
}

// ---------- กล้อง ----------
function buildingOf(code: string) {
  return area.buildings.find(x => x.code === code)!
}

function buildingCenter(code: string): THREE.Vector3 {
  const b = buildingOf(code)
  return new THREE.Vector3(b.x, (b.floors * shapeOf(b).floorHeight) / 2, b.z)
}

function setCameraForMode(m: 'campus' | 'building', instant = false) {
  const focus = area.focus[props.dormGroupId]!
  if (m === 'campus') {
    desiredPos.set(focus.x + focus.radius * 0.62, focus.radius * 0.7, focus.z + focus.radius * 0.88)
    desiredTarget.set(focus.x, 6, focus.z)
  } else if (selectedCode.value) {
    const c = buildingCenter(selectedCode.value)
    desiredPos.set(c.x + 40, c.y + 38, c.z + 56)
    desiredTarget.copy(c)
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
      const mat = m.material as THREE.MeshStandardMaterial
      mat.transparent = true
      mat.opacity = 0.05
    }
  }
  mode.value = 'diving'
  diveTarget = { code, floor }
  diveEmitted = false
  if (controls) controls.enabled = false
  desiredPos.set(b.x, floorY + 48, b.z + 0.01)
  desiredTarget.set(b.x, floorY, b.z)
  transitioning = true
  diveResolveAt = performance.now() + 850
}

// ---------- pointer ----------
function updatePointer(e: PointerEvent) {
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

function onClick() {
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

function backToCampus() {
  selectedCode.value = null
  mode.value = 'campus'
  hoverLabel.value = null
  applyHighlight()
  setCameraForMode('campus')
}

// ---------- ลูปเรนเดอร์ ----------
function tick() {
  raf = requestAnimationFrame(tick)
  if (!renderer || !scene || !camera || !controls) return

  if (transitioning) {
    camera.position.lerp(desiredPos, 0.08)
    controls.target.lerp(desiredTarget, 0.08)
    if (camera.position.distanceTo(desiredPos) < 0.6 && mode.value !== 'diving') transitioning = false
  }

  controls.autoRotate = mode.value === 'campus' && !transitioning
  controls.update()

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
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
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

  buildScene()
  resize()
  tick()

  renderer.domElement.addEventListener('pointermove', onMove)
  renderer.domElement.addEventListener('click', onClick)
  ro = new ResizeObserver(resize)
  ro.observe(host.value)

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
    }
  }
})

// เปลี่ยนหอ = โฟกัสกล้องใหม่ + สลับตึกจาง/เต็ม (สร้างฉากใหม่ให้ริบบิ้นหน้าต่างย้ายหอ)
watch(() => props.dormGroupId, () => {
  selectedCode.value = null
  mode.value = 'campus'
  hoverLabel.value = null
  buildScene()
})

watch(theme, () => buildScene())

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  renderer?.domElement.removeEventListener('pointermove', onMove)
  renderer?.domElement.removeEventListener('click', onClick)
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
    <div ref="host" class="h-[62vh] min-h-105 w-full" />

    <!-- แถบสถานะ/คำแนะนำ ซ้ายบน -->
    <div class="pointer-events-none absolute left-3 top-3 flex max-w-[70%] flex-col gap-2">
      <div class="pointer-events-auto flex items-center gap-2 rounded-xl border bg-background/85 px-3 py-2 shadow-sm backdrop-blur">
        <Building2Icon class="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span class="text-sm font-semibold">{{ headerLabel }}</span>
      </div>
      <p class="rounded-lg bg-background/70 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
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

    <div class="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
      <Rotate3dIcon class="size-3.5" aria-hidden="true" /> มุมมอง 3 มิติ · ผังอิงแผนที่จริง
    </div>
  </div>
</template>
