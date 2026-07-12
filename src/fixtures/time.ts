// เวลาแบบ relative จากตอนเปิดแอป เพื่อให้ countdown ใน prototype เดินจริงเสมอ
const base = Date.now()

export function inMinutes(n: number): string {
  return new Date(base + n * 60_000).toISOString()
}

export function inHours(n: number): string {
  return new Date(base + n * 3_600_000).toISOString()
}

export function agoHours(n: number): string {
  return new Date(base - n * 3_600_000).toISOString()
}
