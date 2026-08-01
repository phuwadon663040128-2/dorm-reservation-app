import { computed, onMounted, toValue, type MaybeRefOrGetter } from 'vue'

let clientTimer: number | undefined
let clientTimerPending = false

/**
 * Countdown จากเวลา ISO เป้าหมาย — ใช้ทั้ง hold ยืนยันห้อง 15 นาที และ payment hold 72 ชม.
 * ใน production ต้อง sync เวลากับ server และ refresh เมื่อ stale (doc 17 state matrix);
 * prototype นี้ใช้เวลาเครื่องแทน server clock
 */
export function useCountdown(target: MaybeRefOrGetter<string | undefined>) {
  // Nuxt serializes this initial value into the hydration payload, so SSR and
  // the browser render the exact same countdown text. Every countdown shares
  // one clock instead of creating one interval per room tile.
  const now = useState<number>('dorm-countdown-clock', () => Date.now())

  onMounted(() => {
    if (clientTimer !== undefined || clientTimerPending) return
    clientTimerPending = true
    window.requestAnimationFrame(() => {
      now.value = Date.now()
      clientTimer = window.setInterval(() => {
        now.value = Date.now()
      }, 1000)
      clientTimerPending = false
    })
  })

  const remainingMs = computed(() => {
    const t = toValue(target)
    if (!t) return 0
    return Math.max(0, new Date(t).getTime() - now.value)
  })

  const expired = computed(() => {
    const t = toValue(target)
    return t !== undefined && remainingMs.value <= 0
  })

  const display = computed(() => {
    const ms = remainingMs.value
    if (ms <= 0) return 'หมดเวลา'
    const totalSec = Math.floor(ms / 1000)
    const days = Math.floor(totalSec / 86400)
    const hours = Math.floor((totalSec % 86400) / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    if (days > 0) return `${days} วัน ${hours} ชม. ${minutes} นาที`
    if (hours > 0) return `${hours} ชม. ${minutes} นาที`
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} นาที`
  })

  return { remainingMs, expired, display }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (clientTimer !== undefined) window.clearInterval(clientTimer)
    clientTimer = undefined
    clientTimerPending = false
  })
}
