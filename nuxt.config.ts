import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const viewFile = (path: string) => fileURLToPath(new URL(`./src/views/${path}`, import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2026-07-31',
  srcDir: 'src/',
  // Public pages are server-rendered so useful content and the LCP image do not
  // wait for the client bundle. Authenticated mock portals still depend on
  // sessionStorage until the backend session is connected, so keep those SPA-only.
  ssr: true,
  pages: true,
  components: [
    // Register only the heavy room browser so Nuxt can server-render it while
    // deferring its client code/hydration until the browser is idle.
    { path: '~/components/domain', pattern: 'RoomBrowser.vue', pathPrefix: false },
  ],
  sourcemap: { client: false, server: false },
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/style.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      title: 'ระบบจองหอพักในกำกับ มข.',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content: 'ระบบสมัครและจองหอพักในกำกับมหาวิทยาลัยขอนแก่น ตรวจสอบห้องว่าง เลือกห้อง และติดตามสถานะการสมัครออนไลน์',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png?v=2' },
      ],
      script: [
        {
          // Apply the saved theme before CSS paints to prevent a light/dark flash.
          innerHTML: "(()=>{try{const t=localStorage.getItem('dorm-theme');const d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)}catch{}})()",
        },
      ],
    },
  },
  routeRules: {
    '/app': { ssr: false },
    '/app/**': { ssr: false },
    '/staff': { ssr: false },
    '/staff/**': { ssr: false },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/personnel/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/plans/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/favicon.png': { headers: { 'cache-control': 'public, max-age=604800' } },
  },
  // Vercel/CDN handles HTTP compression at the edge. Pre-compressing every
  // floor-plan asset here made local builds needlessly expensive.
  nitro: {
    compressPublicAssets: false,
    plugins: [fileURLToPath(new URL('./src/server/plugins/resource-hints.ts', import.meta.url))],
    // Server code is never shipped to the browser. Leaving it readable avoids
    // an expensive second minification pass across every mock route.
    minify: false,
    sourceMap: false,
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      modulePreload: { polyfill: false },
      chunkSizeWarningLimit: 700,
    },
  },
  hooks: {
    'pages:extend'(pages) {
      pages.push(
        // หน้าสาธารณะคงชื่อ route เดิมไว้ เพื่อให้ลิงก์และสถานะ active ใน mock-up ทำงานต่อเนื่อง
        { name: 'landing', path: '/', file: viewFile('public/LandingView.vue'), meta: { layout: 'public' } },
        { name: 'campaign', path: '/campaigns/:id', file: viewFile('public/CampaignView.vue'), meta: { layout: 'public' } },
        { name: 'public-rooms', path: '/rooms', file: viewFile('public/RoomBrowserView.vue'), meta: { layout: 'public' } },
        { name: 'announcements', path: '/announcements', file: viewFile('public/AnnouncementsView.vue'), meta: { layout: 'public' } },
        { name: 'personnel', path: '/personnel', file: viewFile('public/PersonnelView.vue'), meta: { layout: 'public' } },
        { name: 'guide', path: '/guide', file: viewFile('public/GuideView.vue'), meta: { layout: 'public' } },
        { name: 'services', path: '/services', file: viewFile('public/ServicesView.vue'), meta: { layout: 'public' } },
        { name: 'online-service', path: '/services/:serviceId', file: viewFile('public/OnlineServiceView.vue'), meta: { layout: 'public' } },
        { name: 'info-rules', path: '/info/rules', file: viewFile('public/RulesView.vue'), meta: { layout: 'public' } },
        { name: 'info-fees', path: '/info/fees', file: viewFile('public/FeesView.vue'), meta: { layout: 'public' } },
        { name: 'info-floor-plans', path: '/info/floor-plans', file: viewFile('public/FloorPlansView.vue'), meta: { layout: 'public' } },
        { name: 'info-units', path: '/info/units', file: viewFile('public/ServiceUnitsView.vue'), meta: { layout: 'public' } },
        { name: 'contact', path: '/contact', file: viewFile('public/ContactView.vue'), meta: { layout: 'public' } },

        // เส้นทาง auth ยังแสดง login เป็น modal บนหน้าหลักเหมือนเดิม โดย middleware แปลง query ให้
        { name: 'login', path: '/login', file: viewFile('public/LandingView.vue'), meta: { layout: 'public', authRedirect: 'login' } },
        { name: 'register', path: '/register', file: viewFile('public/LandingView.vue'), meta: { layout: 'public', authRedirect: 'register' } },
        { name: 'verify-email', path: '/verify-email', file: viewFile('public/LandingView.vue'), meta: { layout: 'public', authRedirect: 'verify' } },

        // พอร์ทัลผู้สมัคร
        { name: 'app-home', path: '/app', file: viewFile('applicant/HomeView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant', applicantHome: true } },
        { name: 'app-campaigns', path: '/app/campaigns', file: viewFile('applicant/CampaignsView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-application', path: '/app/application/:campaignId?', file: viewFile('applicant/ApplicationView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-rooms', path: '/app/rooms', file: viewFile('applicant/RoomsView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-roommate', path: '/app/roommate', file: viewFile('applicant/RoommateView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-reservation', path: '/app/reservation', file: viewFile('applicant/ReservationView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-payments', path: '/app/payments', file: viewFile('applicant/PaymentsView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-contracts', path: '/app/contracts', file: viewFile('applicant/ContractsView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-next-steps', path: '/app/next-steps', file: viewFile('applicant/NextStepsView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-renewal', path: '/app/renewal', file: viewFile('applicant/RenewalView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant' } },
        { name: 'app-account', path: '/app/account', file: viewFile('applicant/HomeView.vue'), meta: { layout: 'applicant', requiresAuth: true, portal: 'applicant', applicantHome: true } },

        // พอร์ทัลเจ้าหน้าที่ — section ใช้ตรวจสิทธิ์รายส่วนงานใน middleware
        { name: 'staff-dashboard', path: '/staff', file: viewFile('staff/DashboardView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff' } },
        { name: 'staff-campaigns', path: '/staff/campaigns', file: viewFile('staff/CampaignsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'overview' } },
        { name: 'staff-rooms', path: '/staff/rooms', file: viewFile('staff/RoomsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'reservation' } },
        { name: 'staff-applicants', path: '/staff/applicants', file: viewFile('staff/ApplicantsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'reservation' } },
        { name: 'staff-groups', path: '/staff/groups', file: viewFile('staff/GroupsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'reservation' } },
        { name: 'staff-holds', path: '/staff/holds', file: viewFile('staff/HoldsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'reservation' } },
        { name: 'staff-manual', path: '/staff/reservations/manual', file: viewFile('staff/ManualReservationView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'reservation' } },
        { name: 'staff-obligations', path: '/staff/obligations', file: viewFile('staff/ObligationsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'payment' } },
        { name: 'staff-scb-export', path: '/staff/scb/export', file: viewFile('staff/ScbExportView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'payment' } },
        { name: 'staff-pdf-import', path: '/staff/scb/pdf-import', file: viewFile('staff/PdfImportView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'payment' } },
        { name: 'staff-results', path: '/staff/scb/results', file: viewFile('staff/ResultsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'payment' } },
        { name: 'staff-contracts', path: '/staff/contracts', file: viewFile('staff/ContractsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'contract' } },
        { name: 'staff-key-handover', path: '/staff/key-handover', file: viewFile('staff/KeyHandoverView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'contract' } },
        { name: 'staff-handoff', path: '/staff/handoff', file: viewFile('staff/HandoffView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'contract' } },
        { name: 'staff-reports', path: '/staff/reports', file: viewFile('staff/ReportsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'system' } },
        { name: 'staff-audit', path: '/staff/audit', file: viewFile('staff/AuditView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'system' } },
        { name: 'staff-settings', path: '/staff/settings', file: viewFile('staff/SettingsView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', section: 'system' } },
        { name: 'staff-access', path: '/staff/access', file: viewFile('staff/StaffAccessView.vue'), meta: { layout: 'staff', requiresAuth: true, portal: 'staff', adminOnly: true } },

        { name: 'not-found', path: '/:pathMatch(.*)*', file: viewFile('public/LandingView.vue'), meta: { layout: 'public', notFound: true } },
      )
    },
  },
})
