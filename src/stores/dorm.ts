import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Building, Campaign, DormGroup, Room } from '@/types'
import { campaigns as campaignFixtures } from '@/fixtures/campaigns'
import { dormGroups as dormGroupFixtures } from '@/fixtures/dorm-groups'
import { buildings as buildingFixtures, rooms as roomFixtures } from '@/fixtures/rooms'

export const useDormStore = defineStore('dorm', () => {
  // Fixtures are immutable module data, not per-request state. Exposing them as
  // computed values keeps Nuxt from serializing the full room inventory into
  // every SSR payload. Only a tiny revision counter is hydrated after mutations.
  const roomRevision = ref(0)
  const dormGroups = computed<DormGroup[]>(() => dormGroupFixtures)
  const buildings = computed<Building[]>(() => buildingFixtures)
  const campaigns = computed<Campaign[]>(() => campaignFixtures)
  const rooms = computed<Room[]>(() => {
    void roomRevision.value
    return roomFixtures
  })

  const openCampaigns = computed(() => campaigns.value.filter(c => c.status === 'open'))

  function campaignById(id: string) {
    return campaigns.value.find(c => c.id === id)
  }

  function buildingsOf(dormGroupId: string) {
    return buildings.value.filter(b => b.dormGroupId === dormGroupId)
  }

  function roomsOf(buildingId: string, floor?: number) {
    return rooms.value.filter(r => r.buildingId === buildingId && (floor === undefined || r.floor === floor))
  }

  function roomByNumber(number: string) {
    return rooms.value.find(r => r.number === number)
  }

  // summary คำนวณจาก exact rooms เสมอ — ไม่ใช่โควตาแยก (backlog: availability summary)
  const availabilitySummary = computed(() => {
    const total = rooms.value.length
    const count = (status: Room['publicStatus']) => rooms.value.filter(r => r.publicStatus === status).length
    return {
      total,
      available: count('available'),
      temporarilyHeld: count('temporarily_held'),
      reserved: count('reserved'),
      unavailable: count('unavailable'),
    }
  })

  /** อัปเดตสถานะห้องฝั่ง client (จำลองพฤติกรรม server ใน prototype) */
  function setRoomStatus(number: string, status: Room['publicStatus'], holdExpiresAt?: string) {
    const room = rooms.value.find(r => r.number === number)
    if (!room) return
    room.publicStatus = status
    room.holdExpiresAt = holdExpiresAt
    roomRevision.value += 1
  }

  return {
    dormGroups,
    buildings,
    rooms,
    campaigns,
    openCampaigns,
    campaignById,
    buildingsOf,
    roomsOf,
    roomByNumber,
    availabilitySummary,
    setRoomStatus,
  }
})
