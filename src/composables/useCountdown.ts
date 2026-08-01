import { computed, onMounted, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Countdown จากเวลา ISO เป้าหมาย — ใช้ทั้ง hold ยืนยันห้อง 15 นาที และ payment hold 72 ชม.
 * ใน production ต้อง sync เวลากับ server และ refresh เมื่อ stale (doc 17 state matrix);
 * prototype นี้ใช้เวลาเครื่องแทน server clock
 */
export function useCountdown(target: MaybeRefOrGetter<string | undefined>) {
  const now = ref(Date.now())
  let timer: number | undefined
  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })
  onScopeDispose(() => {
    if (timer !== undefined) window.clearInterval(timer)
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
