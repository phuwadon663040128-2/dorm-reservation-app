import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Building, Campaign, DormGroup, Room } from '@/types'
import { buildings as buildingFixtures, campaigns as campaignFixtures, dormGroups as dormGroupFixtures, rooms as roomFixtures } from '@/fixtures'

export const useDormStore = defineStore('dorm', () => {
  const dormGroups = ref<DormGroup[]>(dormGroupFixtures)
  const buildings = ref<Building[]>(buildingFixtures)
  const rooms = ref<Room[]>(roomFixtures)
  const campaigns = ref<Campaign[]>(campaignFixtures)

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
