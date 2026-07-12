import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ReservationGroup, RoommateGroup, RoommateInvitation } from '@/types'
import { reservationGroups as resvFixtures, roommateGroups as groupFixtures, roommateInvitations as invitationFixtures } from '@/fixtures'
import { useSessionStore } from './session'

export const useReservationStore = defineStore('reservation', () => {
  const invitations = ref<RoommateInvitation[]>(invitationFixtures)
  const roommateGroups = ref<RoommateGroup[]>(groupFixtures)
  const reservationGroups = ref<ReservationGroup[]>(resvFixtures)

  const session = useSessionStore()

  // group/การจองของผู้ใช้ปัจจุบัน (applicant)
  const myRoommateGroup = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return undefined
    return roommateGroups.value.find(
      g => g.memberIds.includes(uid) && !['cancelled', 'replaced'].includes(g.status),
    )
  })

  const myReservation = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return undefined
    return reservationGroups.value.find(
      r => r.memberIds.includes(uid) && !['released', 'expired', 'cancelled'].includes(r.holdStatus),
    )
  })

  const myInvitations = computed(() => {
    const uid = session.currentUser?.id
    if (!uid) return []
    return invitations.value.filter(i => i.leaderId === uid || i.inviteeId === uid)
  })

  function reservationById(id: string) {
    return reservationGroups.value.find(r => r.id === id)
  }

  // คิวฝั่ง staff
  const activeHolds = computed(() =>
    reservationGroups.value.filter(r =>
      ['held_roommate_confirmation', 'held_payment'].includes(r.holdStatus),
    ),
  )

  const confirmedReservations = computed(() =>
    reservationGroups.value.filter(r => r.holdStatus === 'confirmed'),
  )

  return {
    invitations,
    roommateGroups,
    reservationGroups,
    myRoommateGroup,
    myReservation,
    myInvitations,
    reservationById,
    activeHolds,
    confirmedReservations,
  }
})
