import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ---- Public ----
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        { path: '', name: 'landing', component: () => import('@/views/public/LandingView.vue') },
        { path: 'campaigns/:id', name: 'campaign', component: () => import('@/views/public/CampaignView.vue') },
        { path: 'rooms', name: 'public-rooms', component: () => import('@/views/public/RoomBrowserView.vue') },
        { path: 'login', name: 'login', component: () => import('@/views/public/LoginView.vue') },
        { path: 'register', name: 'register', component: () => import('@/views/public/RegisterView.vue') },
        { path: 'verify-email', name: 'verify-email', component: () => import('@/views/public/VerifyEmailView.vue') },
      ],
    },
    // ---- Applicant portal (เมนูตามเอกสาร 03) ----
    {
      path: '/app',
      component: () => import('@/layouts/ApplicantLayout.vue'),
      meta: { requiresAuth: true, portal: 'applicant' },
      children: [
        { path: '', name: 'app-home', component: () => import('@/views/applicant/HomeView.vue') },
        { path: 'campaigns', name: 'app-campaigns', component: () => import('@/views/applicant/CampaignsView.vue') },
        { path: 'rooms', name: 'app-rooms', component: () => import('@/views/applicant/RoomsView.vue') },
        { path: 'roommate', name: 'app-roommate', component: () => import('@/views/applicant/RoommateView.vue') },
        { path: 'reservation', name: 'app-reservation', component: () => import('@/views/applicant/ReservationView.vue') },
        { path: 'payments', name: 'app-payments', component: () => import('@/views/applicant/PaymentsView.vue') },
        { path: 'contracts', name: 'app-contracts', component: () => import('@/views/applicant/ContractsView.vue') },
        { path: 'next-steps', name: 'app-next-steps', component: () => import('@/views/applicant/NextStepsView.vue') },
        { path: 'renewal', name: 'app-renewal', component: () => import('@/views/applicant/RenewalView.vue') },
        { path: 'account', name: 'app-account', component: () => import('@/views/applicant/AccountView.vue') },
      ],
    },
    // ---- Staff portal (เมนูตามเอกสาร 03) ----
    {
      path: '/staff',
      component: () => import('@/layouts/StaffLayout.vue'),
      meta: { requiresAuth: true, portal: 'staff' },
      children: [
        { path: '', name: 'staff-dashboard', component: () => import('@/views/staff/DashboardView.vue') },
        { path: 'campaigns', name: 'staff-campaigns', component: () => import('@/views/staff/CampaignsView.vue') },
        { path: 'rooms', name: 'staff-rooms', component: () => import('@/views/staff/RoomsView.vue') },
        { path: 'applicants', name: 'staff-applicants', component: () => import('@/views/staff/ApplicantsView.vue') },
        { path: 'groups', name: 'staff-groups', component: () => import('@/views/staff/GroupsView.vue') },
        { path: 'holds', name: 'staff-holds', component: () => import('@/views/staff/HoldsView.vue') },
        { path: 'reservations/manual', name: 'staff-manual', component: () => import('@/views/staff/ManualReservationView.vue') },
        { path: 'obligations', name: 'staff-obligations', component: () => import('@/views/staff/ObligationsView.vue') },
        { path: 'scb/export', name: 'staff-scb-export', component: () => import('@/views/staff/ScbExportView.vue') },
        { path: 'scb/pdf-import', name: 'staff-pdf-import', component: () => import('@/views/staff/PdfImportView.vue') },
        { path: 'scb/results', name: 'staff-results', component: () => import('@/views/staff/ResultsView.vue') },
        { path: 'contracts', name: 'staff-contracts', component: () => import('@/views/staff/ContractsView.vue') },
        { path: 'key-handover', name: 'staff-key-handover', component: () => import('@/views/staff/KeyHandoverView.vue') },
        { path: 'handoff', name: 'staff-handoff', component: () => import('@/views/staff/HandoffView.vue') },
        { path: 'reports', name: 'staff-reports', component: () => import('@/views/staff/ReportsView.vue') },
        { path: 'audit', name: 'staff-audit', component: () => import('@/views/staff/AuditView.vue') },
        { path: 'settings', name: 'staff-settings', component: () => import('@/views/staff/SettingsView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (to.meta.requiresAuth && !session.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  // แยกพอร์ทัลตามบทบาท — เจ้าหน้าที่เข้า /app ไม่ได้ และผู้สมัครเข้า /staff ไม่ได้
  if (to.meta.portal === 'staff' && session.isLoggedIn && !session.isStaff) {
    return { path: '/app' }
  }
  if (to.meta.portal === 'applicant' && session.isLoggedIn && session.isStaff) {
    return { path: '/staff' }
  }
})

export default router
