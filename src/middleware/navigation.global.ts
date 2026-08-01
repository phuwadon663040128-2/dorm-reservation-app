import { useSessionStore } from '@/stores/session'
import type { StaffSection } from '@/types'

export default defineNuxtRouteMiddleware(async (to) => {
  // Redirects that do not depend on the browser-only mock session must also run
  // during SSR. Otherwise Nuxt renders one route on the server and hydrates a
  // different route in the browser (for example /login -> /?auth=login).
  if (to.meta.notFound === true) return navigateTo('/', { replace: true })

  const authRedirect = to.meta.authRedirect
  if (authRedirect === 'login') {
    return navigateTo({ path: '/', query: { ...to.query, auth: 'login' } }, { replace: true })
  }
  if (authRedirect === 'register' || authRedirect === 'verify') {
    const { email, ...query } = to.query
    const authEmail = Array.isArray(email) ? email[0] : email
    return navigateTo({
      path: '/',
      query: {
        ...query,
        auth: authRedirect,
        ...(typeof authEmail === 'string' ? { authEmail } : {}),
      },
    }, { replace: true })
  }

  // mock-up นี้เก็บ session ในเบราว์เซอร์ จึงตรวจ navigation ที่เหลือ
  // หลัง Nuxt hydrate ฝั่ง client เท่านั้น
  if (import.meta.server) return

  const session = useSessionStore()
  const router = useRouter()

  // หลังเข้าสู่ระบบให้การเลือกห้องมี source of truth เดียว เพื่อคงหอ/ห้องที่เลือกไว้
  if (to.name === 'public-rooms' && session.currentUser?.role === 'applicant') {
    const redirect = Array.isArray(to.query.redirect) ? to.query.redirect[0] : to.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      const resolvedRedirect = router.resolve(redirect)
      if (resolvedRedirect.name === 'app-rooms') {
        return navigateTo({
          name: 'app-rooms',
          query: resolvedRedirect.query,
          hash: resolvedRedirect.hash,
        }, { replace: true })
      }
    }

    const roomQuery = { ...to.query }
    delete roomQuery.auth
    delete roomQuery.redirect
    delete roomQuery.reset
    delete roomQuery.authEmail
    return navigateTo({
      name: 'app-rooms',
      query: roomQuery,
      hash: to.hash,
    }, { replace: true })
  }

  const authMode = Array.isArray(to.query.auth) ? to.query.auth[0] : to.query.auth
  if (session.isLoggedIn && ['login', 'register', 'verify'].includes(String(authMode))) {
    return navigateTo(session.isStaff ? '/staff' : '/app', { replace: true })
  }
  if (to.meta.requiresAuth === true && !session.isLoggedIn) {
    return navigateTo({ path: '/', query: { auth: 'login', redirect: to.fullPath } }, { replace: true })
  }
  if (to.meta.portal === 'staff' && session.isLoggedIn && !session.isStaff) {
    return navigateTo('/app', { replace: true })
  }
  if (to.meta.portal === 'applicant' && session.isLoggedIn && session.isStaff) {
    return navigateTo('/staff', { replace: true })
  }
  if (to.meta.applicantHome === true) {
    return navigateTo('/app/rooms', { replace: true })
  }

  // Workflow ผู้สมัคร: เลือกห้องและชำระรายการของตนเองก่อนเปิดใบสมัครครั้งแรก
  if (to.name === 'app-application' && session.currentUser?.role === 'applicant') {
    // These workflow stores pull in most reservation/payment fixtures. Loading
    // them only on this guarded route keeps every public and unrelated page lean.
    const [
      { toast },
      { useApplicationStore },
      { usePaymentsStore },
      { useReservationStore },
    ] = await Promise.all([
      import('vue-sonner'),
      import('@/stores/application'),
      import('@/stores/payments'),
      import('@/stores/reservation'),
    ])
    const application = useApplicationStore()
    if (!application.hasSubmittedApplication(session.currentUser.id)) {
      const reservation = useReservationStore()
      const active = reservation.myReservation
      if (!active) {
        toast.info('ยังเปิดใบสมัครไม่ได้ กรุณาเลือกหอพักและห้องก่อน')
        return navigateTo('/app/rooms')
      }
      if (active.holdStatus === 'held_roommate_confirmation') {
        toast.info('ยังเปิดใบสมัครไม่ได้ กรุณาดำเนินการยืนยันห้องกับรูมเมทให้เรียบร้อยก่อน')
        return navigateTo('/app/roommate')
      }
      if (
        active.holdStatus === 'held_payment'
        && active.paymentDeadline
        && new Date(active.paymentDeadline).getTime() <= Date.now()
      ) {
        reservation.expireHold(active.id)
        toast.error('หมดเวลาชำระเงินแล้ว กรุณาเลือกห้องใหม่ก่อนกรอกใบสมัคร')
        return navigateTo('/app/rooms')
      }

      const payments = usePaymentsStore()
      const ownObligations = payments.myObligations.filter(
        obligation => obligation.reservationGroupId === active.id,
      )
      const ownPaymentComplete = ownObligations.length > 0
        && ownObligations.every(obligation => payments.isPaid(obligation))
      if (!ownPaymentComplete) {
        toast.info('ยังเปิดใบสมัครไม่ได้ กรุณาชำระรายการของคุณให้ครบก่อน')
        return navigateTo('/app/payments')
      }
    }
  }

  if (to.meta.adminOnly === true && !session.isAdmin) {
    return navigateTo('/staff', { replace: true })
  }
  if (
    typeof to.meta.section === 'string'
    && session.isStaff
    && !session.canAccessSection(to.meta.section as StaffSection)
  ) {
    return navigateTo('/staff', { replace: true })
  }
})
