import type { DormGroup } from '@/types'

/** Lightweight public metadata. Keep room inventory in rooms.ts so landing
 * pages do not download hundreds of exact-room records just to render 2 cards. */
export const dormGroups: DormGroup[] = [
  {
    id: 'dorm-8-lang',
    name: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
    shortName: 'วรเรสซิเดนซ์',
    description: 'หอพักในเครือข่ายวรเรสซิเดนซ์ 8 อาคาร เลขห้องเป็นตัวเลขที่ระบุอาคาร/ชั้น/ห้อง มีห้องธรรมดา (พัดลม) ห้องแอร์ และห้องแอร์พิเศษ',
    buildingCount: 8,
    contractLabel: 'สัญญารายปี',
    priceFromPerTerm: 8100,
  },
  {
    id: 'dorm-wor-inter',
    name: 'หอพักวรอินเตอร์',
    shortName: 'วรเรสอินเตอร์',
    description: 'หอพักวรอินเตอร์ 4 อาคาร (A–D) เลขห้องขึ้นต้นด้วยตัวอักษรอาคารตามด้วยชั้น/ห้อง เช่น A101 มีห้องธรรมดา ห้องแอร์ และห้องแอร์พิเศษ',
    buildingCount: 4,
    contractLabel: 'สัญญารายปี',
    priceFromPerTerm: 9000,
  },
]
