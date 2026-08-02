let campus3dModule: Promise<typeof import('@/components/domain/Campus3D.vue')> | undefined

/** เริ่มดาวน์โหลด Three.js ตามเจตนาของผู้ใช้ โดยไม่เพิ่มภาระให้หน้าแรกตั้งแต่เปิดเว็บ */
export function preloadCampus3d() {
  if (!import.meta.client) return undefined
  campus3dModule ??= import('@/components/domain/Campus3D.vue')
  return campus3dModule
}
