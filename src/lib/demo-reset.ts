const DEMO_SESSION_KEYS = [
  'dorm-demo-session-user',
  'dorm-demo-staff-sections',
  'dorm-demo-custom-user',
  'dorm-demo-pending-email',
]

/**
 * เริ่ม prototype ใหม่จาก fixture เดิมทั้งหมด โดยคงการตั้งค่าธีมของผู้ใช้ไว้
 * การ reload ทำให้ Pinia stores ที่เป็น in-memory กลับสู่ข้อมูลตั้งต้นพร้อมกัน
 */
export function resetDemoData() {
  for (const key of DEMO_SESSION_KEYS) sessionStorage.removeItem(key)
  window.location.assign('/login?reset=1')
}
