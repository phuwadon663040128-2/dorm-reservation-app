<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import heroDay from './assets/hero-day.png'
import heroNight from './assets/hero-night.png'
import woraResidence from './assets/wora-residence.png'
import woraInternational from './assets/wora-international.png'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'kku-dorm-theme'
const theme = ref<Theme>('dark')
const mobileNavOpen = ref(false)
const dorm = ref('หอพักทั้งหมด')
const roomType = ref('ห้องแอร์ธรรมดา')
const gender = ref('ชาย')

let mediaQuery: MediaQueryList | undefined

const isDark = computed(() => theme.value === 'dark')
const heroImage = computed(() => (isDark.value ? heroNight : heroDay))

const applyTheme = (nextTheme: Theme) => {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  document.documentElement.style.colorScheme = nextTheme
}

const toggleTheme = () => {
  const nextTheme: Theme = isDark.value ? 'light' : 'dark'
  localStorage.setItem(STORAGE_KEY, nextTheme)
  applyTheme(nextTheme)
}

const handleSystemTheme = (event: MediaQueryListEvent) => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    applyTheme(event.matches ? 'dark' : 'light')
  }
}

const handleSearch = () => {
  const query = new URLSearchParams({
    dorm: dorm.value,
    roomType: roomType.value,
    gender: gender.value,
  })

  window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`)
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  applyTheme(saved ?? (mediaQuery.matches ? 'dark' : 'light'))
  mediaQuery.addEventListener('change', handleSystemTheme)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', handleSystemTheme)
})
</script>

<template>
  <div class="dorm-page" :data-theme="theme">
    <header class="site-header">
      <a class="brand" href="#" aria-label="กลับหน้าหลัก">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M24 4 37 11v26H11V11L24 4Z" fill="currentColor" opacity=".18" />
            <path d="M18 36V20h12v16M15 15h18M21 20v16M27 20v16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-copy">
          <strong>หอพักในกำกับ มหาวิทยาลัยขอนแก่น</strong>
          <small>ระบบจัดการจองหอพัก</small>
        </span>
      </a>

      <button
        class="mobile-menu-button"
        type="button"
        :aria-expanded="mobileNavOpen"
        aria-label="เปิดหรือปิดเมนู"
        @click="mobileNavOpen = !mobileNavOpen"
      >
        <span />
        <span />
        <span />
      </button>

      <nav class="main-nav" :class="{ 'is-open': mobileNavOpen }" aria-label="เมนูหลัก">
        <a class="is-active" href="#">หน้าหลัก</a>
        <a href="#recommended">หอพัก</a>
        <a href="#announcements">ประกาศ</a>
        <a href="#services">บริการออนไลน์</a>
        <a href="#about">ข้อมูลเกี่ยวกับหอพักนักศึกษา</a>
        <a href="#structure">โครงสร้างบุคลากร</a>
      </nav>

      <div class="header-actions">
        <button
          class="theme-toggle"
          type="button"
          :aria-label="isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'"
          :aria-pressed="isDark"
          @click="toggleTheme"
        >
          <svg v-if="isDark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20.4 15.2A8 8 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          </svg>
          <span>{{ isDark ? 'Light' : 'Dark' }}</span>
        </button>

        <button class="language-button" type="button" aria-label="เลือกภาษา">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
            <path d="M3.5 12h17M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21M12 3C9.5 5.5 8.2 8.5 8.2 12s1.3 6.5 3.8 9" stroke="currentColor" stroke-width="1.7" />
          </svg>
          <span>TH</span>
        </button>
        <button class="login-button" type="button">เข้าสู่ระบบ</button>
      </div>
    </header>

    <main>
      <section class="hero-section" aria-labelledby="hero-title">
        <img class="hero-image" :src="heroImage" alt="อาคารหอพักวรานานาชาติ มหาวิทยาลัยขอนแก่น" />
        <div class="hero-overlay" />

        <div class="hero-content page-container">
          <div class="booking-status">
            <span class="status-dot" aria-hidden="true" />
            เปิดให้จอง · 1–31 พฤษภาคม 2569
          </div>

          <h1 id="hero-title">
            ตรวจสอบหอพักว่างแบบเรียลไทม์
            <span>จองที่พักสำหรับ 1 ปีการศึกษา</span>
          </h1>

          <p class="hero-description">
            ระบบรับสมัครและจองหอพักในกำกับ มหาวิทยาลัยขอนแก่น รองรับการเลือกห้องเป็นรายห้อง
            จับคู่รูมเมท เหมาห้อง ชำระเงินผ่านแบบฟอร์มธนาคารอย่างเป็นทางการ
            และติดตามสัญญาจนถึงวันรับกุญแจ
          </p>

          <form class="search-panel" @submit.prevent="handleSearch">
            <label class="search-field">
              <span>หอพัก</span>
              <select v-model="dorm">
                <option>หอพักทั้งหมด</option>
                <option>วรเรสซิเดนซ์</option>
                <option>วรเรสอินเตอร์</option>
              </select>
            </label>

            <label class="search-field">
              <span>ประเภทห้อง</span>
              <select v-model="roomType">
                <option>ห้องแอร์ธรรมดา</option>
                <option>ห้องพัดลม</option>
                <option>ห้องเดี่ยว</option>
                <option>ห้องคู่</option>
              </select>
            </label>

            <label class="search-field">
              <span>เพศ</span>
              <select v-model="gender">
                <option>ชาย</option>
                <option>หญิง</option>
                <option>ทั้งหมด</option>
              </select>
            </label>

            <button class="search-button" type="submit">
              ค้นหาห้อง
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      <section id="recommended" class="recommended-section page-container" aria-labelledby="recommended-title">
        <div class="section-heading">
          <h2 id="recommended-title">หอพัก</h2>
          <a href="#all-dorms">
            ดูตึกทั้งหมด
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="content-grid">
          <div class="dorm-grid">
            <article class="dorm-card">
              <img :src="woraResidence" alt="ทางเข้าหอพักวรเรสซิเดนซ์" />
              <div class="dorm-card-overlay" />
              <div class="dorm-card-content">
                <div>
                  <h3>วรเรสซิเดนซ์</h3>
                  <p>8 ตึก · สัญญารายปี</p>
                </div>
                <div class="dorm-card-footer">
                  <strong>เริ่มต้นที่ ฿8,100 / ภาคการศึกษา</strong>
                  <button type="button" aria-label="ดูรายละเอียดวรเรสซิเดนซ์">→</button>
                </div>
              </div>
            </article>

            <article class="dorm-card">
              <img :src="woraInternational" alt="อาคารหอพักวรเรสอินเตอร์" />
              <div class="dorm-card-overlay" />
              <div class="dorm-card-content">
                <div>
                  <h3>วรเรสอินเตอร์</h3>
                  <p>4 ตึก · สัญญารายปี</p>
                </div>
                <div class="dorm-card-footer">
                  <strong>เริ่มต้นที่ ฿9,000 / ภาคการศึกษา</strong>
                  <button type="button" aria-label="ดูรายละเอียดวรเรสอินเตอร์">→</button>
                </div>
              </div>
            </article>
          </div>

          <aside class="booking-steps" aria-labelledby="steps-title">
            <h2 id="steps-title">ขั้นตอนการจอง</h2>

            <ol>
              <li>
                <span class="step-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="m14.5 9.5-5 5M16.5 7.5l.8-.8a3 3 0 1 1 4.2 4.2l-6.3 6.3a3 3 0 0 1-4.2 0l-.5-.5M7.5 16.5l-.8.8a3 3 0 1 1-4.2-4.2l6.3-6.3a3 3 0 0 1 4.2 0l.5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </span>
                <div>
                  <h3>1. จับคู่รูมเมทหรือเลือกเหมาห้อง</h3>
                  <p>ส่งคำเชิญรูมเมท (มีอายุ 48 ชม.) หรือเลือกพักคนเดียวแบบเหมาห้อง</p>
                </div>
              </li>

              <li>
                <span class="step-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.8" />
                    <path d="M7 3v5M17 3v5M3.5 10h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </span>
                <div>
                  <h3>2. เลือกห้องจริงรายห้อง</h3>
                  <p>เลือกหอพัก → ชั้น → ห้อง เห็นสถานะว่างหรือถูกจองชั่วคราวแบบเรียลไทม์</p>
                </div>
              </li>

              <li>
                <span class="step-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8" />
                    <circle cx="17" cy="9" r="2.5" stroke="currentColor" stroke-width="1.8" />
                    <path d="M3.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6M14 15c3.7 0 5.7 1.7 6 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </span>
                <div>
                  <h3>3. ยืนยันรูมเมทหรือเลือกเหมาห้อง</h3>
                  <p>ชำระผ่านแบบฟอร์ม QR ทางการของธนาคารภายใน 72 ชม. แล้วสถานะสัญญาประจำปี</p>
                </div>
              </li>
            </ol>
          </aside>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="page-container footer-content">
        <div class="footer-brand">
          <strong>หอพักในกำกับ มหาวิทยาลัยขอนแก่น</strong>
          <span>ฝ่ายกิจการนักศึกษา มหาวิทยาลัยขอนแก่น</span>
        </div>
        <p>043-204-303 · dormitory@kku.ac.th · 09:00–16:30</p>
      </div>
    </footer>
  </div>
</template>
