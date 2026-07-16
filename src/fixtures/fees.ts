// อัตราค่าธรรมเนียมหอพักในกำกับ — ข้อมูลจริงจากประกาศ (reference/data-packs/kku_dorm_fee_assets)
export interface FeeRoomRow {
  roomType: string
  billingBasis: string
  regularSemester?: number | null
  specialSemester?: number | null
  singleAnnual?: number | null
  singleSplitPerTerm?: number | null
  twoPersonAnnual?: number | null
  twoPersonSplitPerTerm?: number | null
  waterFee: string
  electricityFee: string
  damageDeposit: string
  keyDeposit: string
  notes?: string
}

export interface FeeGroup {
  id: string
  name: string
  category: string
  buildingCount: number
  genderSplit: string
  contact: string[]
  feeModel: string
  rooms: FeeRoomRow[]
}

export const feeAcademicYear = "2568"

export const feeGroups: FeeGroup[] = [
  {
    id: "wora_residence_8",
    name: "หอพักสวัสดิการนักศึกษา (8 หลัง) / หอพักเคเคยู-วรเรสซิเดนซ์",
    category: "หอพักในกำกับมหาวิทยาลัย",
    buildingCount: 8,
    genderSplit: "หอพักชาย 2 หอพัก และหอพักหญิง 6 หอพัก",
    contact: ["043-204303-4", "086-4599211"],
    feeModel: "เหมาจ่ายรายปี แสดงทั้งพักคนเดียวและพักห้องละ 2 คน พร้อมแบ่งจ่าย 2 ภาค",
    rooms: [
      {"roomType": "ห้องพัดลม", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 32400, "singleSplitPerTerm": 16200, "twoPersonAnnual": 16200, "twoPersonSplitPerTerm": 8100, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "2,800 บาทต่อห้อง", "keyDeposit": "ไม่มี"},
      {"roomType": "ห้องปรับอากาศ", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 48000, "singleSplitPerTerm": 24000, "twoPersonAnnual": 24000, "twoPersonSplitPerTerm": 12000, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "2,800 บาทต่อห้อง", "keyDeposit": "ไม่มี"},
      {"roomType": "ห้องปรับอากาศภาคพิเศษ", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 54000, "singleSplitPerTerm": 27000, "twoPersonAnnual": 27000, "twoPersonSplitPerTerm": 13500, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "2,800 บาทต่อห้อง", "keyDeposit": "ไม่มี"},
      {"roomType": "ห้องพักปรับ garden", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 60000, "singleSplitPerTerm": 30000, "twoPersonAnnual": 30000, "twoPersonSplitPerTerm": 15000, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "2,800 บาทต่อห้อง", "keyDeposit": "ไม่มี"},
    ],
  },
  {
    id: "wora_inter_4",
    name: "หอพักสวัสดิการนักศึกษา (4 หลัง) / หอพักเคเคยู-วรอินเตอร์",
    category: "หอพักในกำกับมหาวิทยาลัย",
    buildingCount: 4,
    genderSplit: "หอพักหญิง 3 หอพัก ได้แก่ A, B, C และหอพักชาย 1 หอพัก ได้แก่ D",
    contact: ["086-4600173"],
    feeModel: "เหมาจ่ายรายปี แสดงทั้งพักคนเดียวและพักห้องละ 2 คน พร้อมแบ่งจ่าย 2 ภาค",
    rooms: [
      {"roomType": "ห้องพัดลม", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 36000, "singleSplitPerTerm": 18000, "twoPersonAnnual": 18200, "twoPersonSplitPerTerm": 9000, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "3,000 บาทต่อห้อง", "keyDeposit": "ไม่มี", "notes": "ตามเอกสาร PDF ระบุพักห้องละ 2 คน อัตราต่อปี 18,200 บาท และแบ่งจ่าย 2 ภาค 9,000 บาท ซึ่งยอดรายปีกับยอดแบ่งจ่ายรวมกันไม่เท่ากัน จึงคงค่าตามต้นฉบับไว้"},
      {"roomType": "ห้องปรับอากาศ", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 52800, "singleSplitPerTerm": 26400, "twoPersonAnnual": 26400, "twoPersonSplitPerTerm": 13200, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "3,000 บาทต่อห้อง", "keyDeposit": "ไม่มี"},
      {"roomType": "ห้องปรับอากาศภาคพิเศษ", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 66000, "singleSplitPerTerm": 33000, "twoPersonAnnual": 33000, "twoPersonSplitPerTerm": 16500, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "3,000 บาทต่อห้อง", "keyDeposit": "ไม่มี"},
      {"roomType": "ห้องพักปรับ garden", "billingBasis": "เหมาจ่ายรายปี/แบ่งจ่าย 2 ภาค", "regularSemester": null, "specialSemester": null, "singleAnnual": 76400, "singleSplitPerTerm": 37200, "twoPersonAnnual": 37200, "twoPersonSplitPerTerm": 18600, "waterFee": "หน่วยละ 9.35 บาท", "electricityFee": "หน่วยละ 3.28 บาท", "damageDeposit": "3,000 บาทต่อห้อง", "keyDeposit": "ไม่มี", "notes": "ตามเอกสาร PDF ระบุเหมาจ่ายพักคนเดียวต่อปี 76,400 บาท และแบ่งจ่าย 2 ภาค 37,200 บาท ซึ่งยอดรายปีกับยอดแบ่งจ่ายรวมกันไม่เท่ากัน จึงคงค่าตามต้นฉบับไว้"},
    ],
  },
]
