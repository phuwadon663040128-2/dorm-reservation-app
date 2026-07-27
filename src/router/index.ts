import { createRouter, createWebHistory } from 'vue-router'
import { toast } from 'vue-sonner'
import { useApplicationStore } from '@/stores/application'
import { usePaymentsStore } from '@/stores/payments'
import { useReservationStore } from '@/stores/reservation'
import { useSessionStore } from '@/stores/session'
import type { StaffSection } from '@/types'

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
        { path: 'announcements', name: 'announcements', component: () => import('@/views/public/AnnouncementsView.vue') },
        { path: 'personnel', name: 'personnel', component: () => import('@/views/public/PersonnelView.vue') },
        { path: 'guide', name: 'guide', component: () => import('@/views/public/GuideView.vue') },
        { path: 'services', name: 'services', component: () => import('@/views/public/ServicesView.vue') },
        { path: 'services/:serviceId', name: 'online-service', component: () => import('@/views/public/OnlineServiceView.vue') },
        { path: 'info/rules', name: 'info-rules', component: () => import('@/views/public/RulesView.vue') },
        { path: 'info/fees', name: 'info-fees', component: () => import('@/views/public/FeesView.vue') },
        { path: 'info/floor-plans', name: 'info-floor-plans', component: () => import('@/views/public/FloorPlansView.vue') },
        { path: 'info/units', name: 'info-units', component: () => import('@/views/public/ServiceUnitsView.vue') },
        { path: 'contact', name: 'contact', component: () => import('@/views/public/ContactView.vue') },
      ],
    },
    {
      path: '/login',
      name: 'login',
      redirect: to => ({
        path: '/',
        query: { ...to.query, auth: 'login' },
      }),
    },
    {
      path: '/register',
      name: 'register',
      redirect: to => {
        const { email, ...query } = to.query
        return {
          path: '/',
          query: { ...query, auth: 'register', ...(email ? { authEmail: email } : {}) },
        }
      },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      redirect: to => {
        const { email, ...query } = to.query
        return {
          path: '/',
          query: { ...query, auth: 'verify', ...(email ? { authEmail: email } : {}) },
        }
      },
    },
    // ---- Applicant portal (เมนูตามเอกสาร 03) ----
    {
      path: '/app',
      component: () => import('@/layouts/ApplicantLayout.vue'),
      meta: { requiresAuth: true, portal: 'applicant' },
      children: [
        { path: '', name: 'app-home', redirect: { name: 'app-rooms' } },
        { path: 'campaigns', name: 'app-campaigns', component: () => import('@/views/applicant/CampaignsView.vue') },
        { path: 'application/:campaignId?', name: 'app-application', component: () => import('@/views/applicant/ApplicationView.vue') },
        { path: 'rooms', name: 'app-rooms', component: () => import('@/views/applicant/RoomsView.vue') },
        { path: 'roommate', name: 'app-roommate', component: () => import('@/views/applicant/RoommateView.vue') },
        { path: 'reservation', name: 'app-reservation', component: () => import('@/views/applicant/ReservationView.vue') },
        { path: 'payments', name: 'app-payments', component: () => import('@/views/applicant/PaymentsView.vue') },
        { path: 'contracts', name: 'app-contracts', component: () => import('@/views/applicant/ContractsView.vue') },
        { path: 'next-steps', name: 'app-next-steps', component: () => import('@/views/applicant/NextStepsView.vue') },
        { path: 'renewal', name: 'app-renewal', component: () => import('@/views/applicant/RenewalView.vue') },
        { path: 'account', redirect: '/app' },
      ],
    },
    // ---- Staff portal (เมนูตามเอกสาร 03) — meta.section ผูกกับส่วนงานที่ผู้ดูแลระบบกำหนดรายคน ----
    {
      path: '/staff',
      component: () => import('@/layouts/StaffLayout.vue'),
      meta: { requiresAuth: true, portal: 'staff' },
      children: [
        { path: '', name: 'staff-dashboard', component: () => import('@/views/staff/DashboardView.vue') },
        { path: 'campaigns', name: 'staff-campaigns', component: () => import('@/views/staff/CampaignsView.vue'), meta: { section: 'overview' } },
        { path: 'rooms', name: 'staff-rooms', component: () => import('@/views/staff/RoomsView.vue'), meta: { section: 'reservation' } },
        { path: 'applicants', name: 'staff-applicants', component: () => import('@/views/staff/ApplicantsView.vue'), meta: { section: 'reservation' } },
        { path: 'groups', name: 'staff-groups', component: () => import('@/views/staff/GroupsView.vue'), meta: { section: 'reservation' } },
        { path: 'holds', name: 'staff-holds', component: () => import('@/views/staff/HoldsView.vue'), meta: { section: 'reservation' } },
        { path: 'reservations/manual', name: 'staff-manual', component: () => import('@/views/staff/ManualReservationView.vue'), meta: { section: 'reservation' } },
        { path: 'obligations', name: 'staff-obligations', component: () => import('@/views/staff/ObligationsView.vue'), meta: { section: 'payment' } },
        { path: 'scb/export', name: 'staff-scb-export', component: () => import('@/views/staff/ScbExportView.vue'), meta: { section: 'payment' } },
        { path: 'scb/pdf-import', name: 'staff-pdf-import', component: () => import('@/views/staff/PdfImportView.vue'), meta: { section: 'payment' } },
        { path: 'scb/results', name: 'staff-results', component: () => import('@/views/staff/ResultsView.vue'), meta: { section: 'payment' } },
        { path: 'contracts', name: 'staff-contracts', component: () => import('@/views/staff/ContractsView.vue'), meta: { section: 'contract' } },
        { path: 'key-handover', name: 'staff-key-handover', component: () => import('@/views/staff/KeyHandoverView.vue'), meta: { section: 'contract' } },
        { path: 'handoff', name: 'staff-handoff', component: () => import('@/views/staff/HandoffView.vue'), meta: { section: 'contract' } },
        { path: 'reports', name: 'staff-reports', component: () => import('@/views/staff/ReportsView.vue'), meta: { section: 'system' } },
        { path: 'audit', name: 'staff-audit', component: () => import('@/views/staff/AuditView.vue'), meta: { section: 'system' } },
        { path: 'settings', name: 'staff-settings', component: () => import('@/views/staff/SettingsView.vue'), meta: { section: 'system' } },
        // ผู้ดูแลระบบเท่านั้น — กำหนดส่วนงานที่เจ้าหน้าที่แต่ละคนเข้าถึงได้
        { path: 'access', name: 'staff-access', component: () => import('@/views/staff/StaffAccessView.vue'), meta: { adminOnly: true } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const session = useSessionStore()
  // modal เข้าสู่ระบบอิง URL เพื่อให้ deep link, ปุ่มย้อนกลับ และ route guard ใช้ flow เดียวกัน
  const authMode = Array.isArray(to.query.auth) ? to.query.auth[0] : to.query.auth
  if (session.isLoggedIn && ['login', 'register', 'verify'].includes(String(authMode))) {
    return { path: session.isStaff ? '/staff' : '/app' }
  }
  if (to.meta.requiresAuth && !session.isLoggedIn) {
    return { path: '/', query: { auth: 'login', redirect: to.fullPath } }
  }
  // แยกพอร์ทัลตามบทบาท — เจ้าหน้าที่เข้า /app ไม่ได้ และผู้สมัครเข้า /staff ไม่ได้
  if (to.meta.portal === 'staff' && session.isLoggedIn && !session.isStaff) {
    return { path: '/app' }
  }
  if (to.meta.portal === 'applicant' && session.isLoggedIn && session.isStaff) {
    return { path: '/staff' }
  }
  // Workflow ผู้สมัคร: เลือกห้องและชำระรายการของตนเองก่อนเปิดใบสมัครครั้งแรก
  if (to.name === 'app-application' && session.currentUser?.role === 'applicant') {
    const application = useApplicationStore()
    if (!application.hasSubmittedApplication(session.currentUser.id)) {
      const reservation = useReservationStore()
      const active = reservation.myReservation
      if (!active) {
        toast.info('ยังเปิดใบสมัครไม่ได้ กรุณาเลือกหอพักและห้องก่อน')
        return { name: 'app-rooms' }
      }
      if (active.holdStatus === 'held_roommate_confirmation') {
        toast.info('ยังเปิดใบสมัครไม่ได้ กรุณาดำเนินการยืนยันห้องกับรูมเมทให้เรียบร้อยก่อน')
        return { name: 'app-roommate' }
      }
      if (
        active.holdStatus === 'held_payment'
        && active.paymentDeadline
        && new Date(active.paymentDeadline).getTime() <= Date.now()
      ) {
        reservation.expireHold(active.id)
        toast.error('หมดเวลาชำระเงินแล้ว กรุณาเลือกห้องใหม่ก่อนกรอกใบสมัคร')
        return { name: 'app-rooms' }
      }

      const payments = usePaymentsStore()
      const ownObligations = payments.myObligations.filter(
        obligation => obligation.reservationGroupId === active.id,
      )
      const ownPaymentComplete = ownObligations.length > 0
        && ownObligations.every(obligation => payments.isPaid(obligation))
      if (!ownPaymentComplete) {
        toast.info('ยังเปิดใบสมัครไม่ได้ กรุณาชำระรายการของคุณให้ครบก่อน')
        return { name: 'app-payments' }
      }
    }
  }
  // หน้าเฉพาะผู้ดูแลระบบ
  if (to.meta.adminOnly && !session.isAdmin) {
    return { path: '/staff' }
  }
  // ส่วนงานที่ผู้ดูแลระบบไม่ได้เปิดให้ — กลับไป Dashboard (ซึ่งเข้าได้เสมอ)
  if (typeof to.meta.section === 'string' && session.isStaff && !session.canAccessSection(to.meta.section as StaffSection)) {
    return { path: '/staff' }
  }
})

export default router
