const DEMO_STORAGE_KEYS = [
  'dorm-demo-session-user',
  'dorm-demo-staff-sections',
  'dorm-demo-custom-user',
  'dorm-demo-pending-email',
  'dorm-demo-pending-password',
  'dorm-demo-custom-password',
]

function clearDemoStorage() {
  for (const key of DEMO_STORAGE_KEYS) sessionStorage.removeItem(key)
}

/**
 * เริ่ม prototype ใหม่จาก fixture เดิมทั้งหมด โดยคงการตั้งค่าธีมของผู้ใช้ไว้
 * การ reload ทำให้ Pinia stores ที่เป็น in-memory กลับสู่ข้อมูลตั้งต้นพร้อมกัน
 */
export function resetDemoData() {
  clearDemoStorage()
  window.location.assign('/?auth=login&reset=1')
}

/**
 * ออกจากระบบพร้อมคืน mock stores ทุกชุดเป็นค่าเริ่มต้น โดยไม่เปิดหน้าต่างเข้าสู่ระบบซ้ำ
 * การ reload ทำให้ state ใน Pinia ที่ยังอยู่ในหน่วยความจำถูกสร้างใหม่จาก fixture ด้วย
 */
export function logoutAndResetDemoData() {
  clearDemoStorage()
  window.location.assign('/')
}
