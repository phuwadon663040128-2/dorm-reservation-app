<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import type { DateValue } from '@internationalized/date'
import { CalendarDate, fromDate, getLocalTimeZone } from '@internationalized/date'
import {
  AlertCircle,
  ArrowRight,
  Armchair,
  Bath,
  Bed,
  Building,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  DoorOpen,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Headphones,
  Home,
  LayoutGrid,
  Lock,
  LogOut,
  Menu,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Snowflake,
  User,
  Users,
  XCircle,
} from '@lucide/vue'
import nopparatImage from '@/assets/kku_dorm_images/nopparat_9_buildings/01_nopparat_internal_road_assetkku.jpg'
import nopparatOfficeImage from '@/assets/kku_dorm_images/nopparat_9_buildings/02_nopparat_office_front_assetkku.jpeg'
import nopparatCanteenImage from '@/assets/kku_dorm_images/nopparat_9_buildings/06_nopparat_canteen_dormkku.jpg'
import nopparatRoomImage from '@/assets/kku_dorm_images/nopparat_9_buildings/08_nopparat_room_studyinkku.webp'
import woraResidenceImage from '@/assets/kku_dorm_images/wora_residence_8_buildings/02_wora_residence_building_front_assetkku.jpg'
import woraResidenceEntranceImage from '@/assets/kku_dorm_images/wora_residence_8_buildings/01_wora_residence_entrance_road_assetkku.jpg'
import woraResidenceGateImage from '@/assets/kku_dorm_images/wora_residence_8_buildings/03_wora_residence_gate_road_assetkku.jpg'
import woraResidenceCanteenImage from '@/assets/kku_dorm_images/wora_residence_8_buildings/05_wora_residence_canteen_studyinkku.webp'
import woraResidenceStoreImage from '@/assets/kku_dorm_images/wora_residence_8_buildings/06_wora_residence_store_drinks_studyinkku.webp'
import woraInternationalWideImage from '@/assets/kku_dorm_images/wora_international/01_wora_international_wide_entrance_assetkku.jpg'
import woraInternationalImage from '@/assets/kku_dorm_images/wora_international/02_wora_international_sign_assetkku.jpg'
import woraInternationalRoomImage from '@/assets/kku_dorm_images/wora_international/11_wora_inter_room_twin_phanumas.jpg'
import woraInternationalCommonImage from '@/assets/kku_dorm_images/wora_international/14_wora_inter_common_area_phanumas.jpg'
import woraInternationalLaundryImage from '@/assets/kku_dorm_images/wora_international/15_wora_inter_laundry_phanumas.jpg'
import { kkuDormFeeData } from '../../kku_dorm_fee_assets/fees_ui_data'
import personnelCardsData from '../../dorm_kku_ui_assets/data/personnel_cards.json'
import kkuOfficialLogo from '../../kku_emblem_assets/images/official_png/official_logo_th_small_150px.png'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as DatePickerCalendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { Applicant, AuditLog, DormCampaign, DormRooms, RoomInfo } from '@/types'

const personnelImages = import.meta.glob('../../dorm_kku_ui_assets/images/personnel/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const structureChartImage = new URL('../../dorm_kku_ui_assets/images/structure/structure-chart.png', import.meta.url).href

type UserRole = 'applicant' | 'admin'
type Locale = 'th' | 'en'
type PageView =
  | 'home'
  | 'dorm8'
  | 'dorm9'
  | 'dormInter'
  | 'organization'
  | 'announcements'
  | 'repair'
  | 'keyService'
  | 'parcel'
  | 'foreignAddress'
  | 'registrationMove'
  | 'rules'
  | 'fees'
  | 'documents'
  | 'dormMap'
  | 'serviceUnits'
  | 'contact'
  | 'reservation'
  | 'receipts'
  | 'staff'

interface TestAccount {
  label: string
  description: string
  username: string
  password: string
  role: UserRole
  appId?: string
  displayName: string
  identifier: string
  unit: string
}

interface DormitoryCard {
  name: string
  nameTh: string
  subtitle: string
  subtitleTh: string
  image: string
  gender: string
  genderTh: string
  roomType: string
  roomTypeTh: string
  availability: string
  availabilityTh: string
  criteria: {
    applicantType: string
    applicantTypeTh: string
    timing: string
    timingTh: string
    slipRequired: string
    slipRequiredTh: string
  }
}

type DormFeeGroup = (typeof kkuDormFeeData.groups)[number]
interface DormFeeRoom {
  room_type: string
  billing_basis: string
  regular_semester_baht: number | null
  special_semester_baht: number | null
  single_annual_baht: number | null
  single_split_per_term_baht: number | null
  two_person_annual_baht: number | null
  two_person_split_per_term_baht: number | null
  water_fee: string
  electricity_fee: string
  damage_deposit: string
}

interface DormDetailContent {
  summaryTh: string
  summaryEn: string
  gallery: string[]
  highlightsTh: string[]
  highlightsEn: string[]
  documents: {
    titleTh: string
    titleEn: string
    href: string
  }[]
}

interface SessionUser {
  role: UserRole
  username: string
  displayName: string
  identifier: string
  unit?: string
  activeAppId?: string
}

const props = withDefaults(defineProps<{
  isLoggedIn?: boolean
  role?: UserRole
  user?: SessionUser | null
  campaigns?: DormCampaign[]
  dormRooms?: DormRooms
  activeApp?: Applicant | null
  applicants?: Applicant[]
  auditLogs?: AuditLog[]
  currentAdminTab?: string
}>(), {
  isLoggedIn: false,
  role: 'applicant',
  user: null,
  campaigns: () => [],
  dormRooms: () => ({}),
  activeApp: null,
  applicants: () => [],
  auditLogs: () => [],
  currentAdminTab: 'dashboard',
})

const emit = defineEmits<{
  (e: 'login', payload: {
    role: UserRole
    username: string
    displayName: string
    identifier: string
    unit: string
    activeAppId?: string
  }): void
  (e: 'logout'): void
  (e: 'update:currentAdminTab', tab: string): void
  (e: 'submitApp', appData: any): void
  (e: 'simulateUniPay'): void
  (e: 'submitManualSlip', slip: { amount: number; date: string; time: string; fileName: string }): void
  (e: 'printTicket'): void
  (e: 'createCampaign', campaign: DormCampaign): void
  (e: 'approveApp', appId: string): void
  (e: 'reuploadApp', payload: { appId: string; reason: string }): void
  (e: 'rejectApp', payload: { appId: string; reason: string }): void
  (e: 'exportData', type: 'residents' | 'payments'): void
  (e: 'showToast', msg: string): void
}>()

const copy = {
  th: {
    brandTitle: 'หอพักในกำกับ มหาวิทยาลัยขอนแก่น',
    brandSubtitle: 'ระบบจัดการจองหอพัก',
    university: 'มหาวิทยาลัยขอนแก่น',
    nav: {
      home: 'หน้าหลัก',
      dormitories: 'หอพัก',
      annualReservation: 'จองประจำปี',
      guidelines: 'แนวทางการจอง',
      announcement: 'ประกาศ',
      contact: 'ติดต่อ',
    },
    myReservation: 'การจองของฉัน',
    staffWorkspace: 'พื้นที่เจ้าหน้าที่',
    roleApplicant: 'ผู้สมัคร',
    roleStaff: 'เจ้าหน้าที่',
    login: 'เข้าสู่ระบบ',
    signUp: 'สมัครใช้งาน',
    logout: 'ออกจากระบบ',
    heroBadge: 'ระบบจองรายปี',
    heroTitleLine1: 'ตรวจสอบหอพักว่างแบบเรียลไทม์',
    heroTitleLine2: 'จองที่พักสำหรับ 1 ปีการศึกษา',
    heroDescription: 'ระบบจองหอพักประจำปีการศึกษา 2569/2570 เลือกห้องที่เหมาะกับคุณและจองสิทธิ์ได้อย่างมั่นใจ',
    availabilityTitle: 'ตรวจสอบหอพักว่าง',
    moveInDate: 'วันที่เข้าพัก',
    moveOutDate: 'วันที่ออก',
    roomType: 'ประเภทห้อง',
    gender: 'กลุ่มผู้พัก',
    allTypes: 'ทุกประเภท',
    airConditioned: 'ห้องปรับอากาศ',
    fanRoom: 'ห้องพัดลม',
    premiumRoom: 'ห้องพรีเมียม',
    allStudents: 'ทั้งหมด',
    femaleOnly: 'โซนหญิง',
    maleOnly: 'โซนชาย',
    international: 'ไทย/ต่างชาติ',
    checkAvailability: 'ตรวจสอบห้องว่าง',
    featuredDormitories: 'หอพักแนะนำ',
    viewAllDormitories: 'ดูหอพักทั้งหมด',
    viewDetails: 'ดูรายละเอียด',
    reservationDetailsTitle: 'รายละเอียดการจอง',
    features: [
      { title: 'อัปเดตเรียลไทม์', description: 'ตรวจสอบห้องว่างล่าสุด' },
      { title: 'พันธมิตร KKU', description: 'ช่องทางทางการของมหาวิทยาลัย' },
      { title: 'พัก 1 ปี', description: 'สัญญาพักรายปี' },
      { title: 'ปลอดภัย', description: 'ขั้นตอนจองที่ตรวจสอบได้' },
    ],
    reservationDetails: [
      {
        title: 'ช่วงเวลาจอง',
        value: '1 พฤษภาคม - 31 พฤษภาคม 2569',
        description: 'ยื่นคำขอจองภายในช่วงเวลาที่กำหนด',
      },
      {
        title: 'ระยะเวลาเข้าพัก',
        value: '1 มิถุนายน 2569 - 31 พฤษภาคม 2570',
        description: 'พักเต็มปีการศึกษา รวม 12 เดือน',
      },
      {
        title: 'ช่องทางชำระเงิน',
        value: 'QR Code, โอนผ่านธนาคาร',
        description: 'รองรับวิธีชำระเงินที่สะดวกและปลอดภัย',
      },
      {
        title: 'ติดต่อและช่วยเหลือ',
        value: '043-009-700',
        description: 'dormitory@kku.ac.th, ศูนย์ช่วยเหลือ KKU',
      },
    ],
    modal: {
      badge: 'เข้าสู่ระบบบัญชี KKU',
      title: 'เข้าสู่ระบบจองหอพัก',
      description: 'เลือกบทบาทเพื่อเข้าสู่ workflow จำลองที่ตรงกับผู้ใช้งาน',
      demoTitle: 'เข้าสู่ระบบด้วยบัญชี KKU',
      demoDescription: 'กรุณาใช้บัญชีที่ได้รับสิทธิ์ในการทดสอบระบบ',
      applicant: 'ผู้สมัคร',
      staff: 'เจ้าหน้าที่',
      studentId: 'รหัสนักศึกษา',
      staffAccount: 'บัญชีเจ้าหน้าที่',
      password: 'รหัสผ่าน',
      enterApplicant: 'เข้าสู่พื้นที่ผู้สมัคร',
      enterStaff: 'เข้าสู่พื้นที่เจ้าหน้าที่',
      demoAccounts: 'บัญชีสำหรับทดสอบ',
    },
    applicantWorkspace: 'พื้นที่ผู้สมัคร',
    staffWorkspaceBadge: 'พื้นที่เจ้าหน้าที่',
    refreshStatus: 'อัปเดตสถานะ',
    applicationForm: 'แบบฟอร์มสมัคร',
    submitApplication: 'ส่งใบสมัคร',
    toast: {
      search: 'กำลังตรวจสอบห้องว่างตามเงื่อนไขที่เลือก',
      applicantOnly: 'กรุณาเข้าสู่ระบบด้วยบัญชีผู้สมัครเพื่อใช้ workflow นี้',
      staffOnly: 'กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่เพื่อเปิด workflow เจ้าหน้าที่',
      missingLogin: 'กรุณากรอกบัญชีและรหัสผ่าน',
      wrongPassword: 'บัญชีหรือรหัสผ่านไม่ถูกต้อง',
      staffNotFound: 'ไม่พบบัญชีเจ้าหน้าที่ในระบบจำลอง',
      signedApplicant: 'เข้าสู่พื้นที่ผู้สมัครแล้ว',
      signedStaff: 'เข้าสู่พื้นที่เจ้าหน้าที่แล้ว',
      missingApplicantForm: 'กรุณากรอกชื่อผู้สมัครและรหัสนักศึกษา',
      missingSlip: 'กรุณากรอกยอดชำระ วันที่ และเวลา',
    },
  },
  en: {
    brandTitle: 'KKU Affiliated Dormitory',
    brandSubtitle: 'Reservation Management System',
    university: 'Khon Kaen University',
    nav: {
      home: 'Home',
      dormitories: 'Dormitories',
      annualReservation: 'Annual Reservation',
      guidelines: 'Guidelines',
      announcement: 'Announcement',
      contact: 'Contact',
    },
    myReservation: 'My Reservation',
    staffWorkspace: 'Staff Workspace',
    roleApplicant: 'Applicant',
    roleStaff: 'Staff',
    login: 'Login',
    signUp: 'Sign Up',
    logout: 'Logout',
    heroBadge: 'A Full-Year Stay Solution',
    heroTitleLine1: 'Live Dormitory Availability',
    heroTitleLine2: 'Reserve Your Home for 1-Year Stay',
    heroDescription: 'Annual Dormitory Reservation for Academic Year 2026/2027. Find your perfect room and secure it for the full year with confidence.',
    availabilityTitle: 'Live Dormitory Availability',
    moveInDate: 'Move-in Date',
    moveOutDate: 'Move-out Date',
    roomType: 'Room Type',
    gender: 'Resident group',
    allTypes: 'All Types',
    airConditioned: 'Air-conditioned',
    fanRoom: 'Fan room',
    premiumRoom: 'Premium room',
    allStudents: 'All',
    femaleOnly: 'Female zone',
    maleOnly: 'Male zone',
    international: 'Thai/International',
    checkAvailability: 'Check Availability',
    featuredDormitories: 'Featured Dormitories',
    viewAllDormitories: 'View all Dormitories',
    viewDetails: 'View Details',
    reservationDetailsTitle: 'Reservation Details',
    features: [
      { title: 'Real-time', description: 'Live availability' },
      { title: 'KKU Partner', description: 'Official channel' },
      { title: '1-Year Stay', description: 'Annual contract' },
      { title: 'Secure Flow', description: 'Safe reservation' },
    ],
    reservationDetails: [
      {
        title: 'Reservation Period',
        value: 'May 1 - May 31, 2026',
        description: 'Submit your reservation within the specified period.',
      },
      {
        title: 'Stay Period',
        value: 'June 1, 2026 - May 31, 2027',
        description: 'Full academic year stay, 12 months.',
      },
      {
        title: 'Payment Methods',
        value: 'QR Code Payment, Bank Transfer',
        description: 'Secure and convenient payment options.',
      },
      {
        title: 'Contact & Support',
        value: '043-009-700',
        description: 'dormitory@kku.ac.th, Help Center KKU.',
      },
    ],
    modal: {
      badge: 'KKU Account Access',
      title: 'Login to Reservation System',
      description: 'Select a role to enter the matching mock-up workflow.',
      demoTitle: 'KKU SSO account',
      demoDescription: 'Use an authorized account to access the mock workflow.',
      applicant: 'Applicant',
      staff: 'Staff',
      studentId: 'Student ID',
      staffAccount: 'Staff account',
      password: 'Password',
      enterApplicant: 'Enter Applicant Workspace',
      enterStaff: 'Enter Staff Workspace',
      demoAccounts: 'Demo accounts',
    },
    applicantWorkspace: 'Applicant Workspace',
    staffWorkspaceBadge: 'Staff Workspace',
    refreshStatus: 'Refresh status',
    applicationForm: 'Application form',
    submitApplication: 'Submit application',
    toast: {
      search: 'Searching availability for the selected criteria.',
      applicantOnly: 'Please sign in as an applicant to use this workflow.',
      staffOnly: 'Please sign in as dormitory staff to open staff workflow.',
      missingLogin: 'Please enter your account and password.',
      wrongPassword: 'Incorrect account or password.',
      staffNotFound: 'Staff account was not found in this mock system.',
      signedApplicant: 'Signed in to applicant workspace.',
      signedStaff: 'Signed in to staff workspace.',
      missingApplicantForm: 'Please fill in applicant name and student ID.',
      missingSlip: 'Please fill in payment amount, date, and time.',
    },
  },
} as const

const loginModalOpen = ref(false)
const locale = ref<Locale>('th')
const loginRole = ref<UserRole>('applicant')
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const defaultCalendarDate = fromDate(new Date(), getLocalTimeZone())
const minCalendarDate = new CalendarDate(1925, 1, 1)
const maxCalendarDate = new CalendarDate(2035, 1, 1)
const defaultCalendarDateText = defaultCalendarDate.toString().slice(0, 10)
const moveInDate = ref(defaultCalendarDateText)
const moveOutDate = ref(defaultCalendarDateText)
const moveInDateValue = ref(defaultCalendarDate) as Ref<DateValue>
const moveOutDateValue = ref(defaultCalendarDate) as Ref<DateValue>
const roomType = ref('all')
const gender = ref('all')
const currentPage = ref<PageView>('home')
const activePortal = ref<'home' | 'applicant' | 'staff'>('home')
const simulatedProgressStep = ref<number | null>(null)
const bookingDraftMode = ref(false)
const selectedDorm = ref<DormitoryCard | null>(null)
const selectedFloor = ref('')
const manualSlip = ref({
  amount: '',
  date: '',
  time: '',
  fileName: 'manual_transfer_receipt.png',
})
const profileEditMode = ref(false)
const uniPayDialogOpen = ref(false)
const uniPayProcessing = ref(false)
const uniPaySuccess = ref(false)
const applicantForm = ref({
  name: '',
  studentId: '',
  phone: '',
  email: '',
  faculty: '',
  gender: 'Female',
  applicantType: 'General Student',
  roomType: '',
  roomNumber: '',
})
const selectedStaffApp = ref<Applicant | null>(null)
const staffReviewOpen = ref(false)
const staffActionReason = ref('')
const campaignDraft = ref({
  name: 'Special Reservation Round',
  description: 'Additional reservation round for affiliated dormitories.',
  openDate: '2026-07-05',
  closeDate: '2026-07-20',
  requiredAmount: 3000,
})

const dormMenuItems = [
  { page: 'dorm8' as PageView, th: 'หอพักวรเรสซิเดนซ์ 8 หลัง', en: 'Wora Residence 8' },
  { page: 'dorm9' as PageView, th: 'หอพักนพรัตน์ 9 หลัง', en: 'Nopparat 9' },
  { page: 'dormInter' as PageView, th: 'หอพักวรอินเตอร์', en: 'Wora International' },
]

const onlineServiceItems = [
  { page: 'repair' as PageView, th: 'แจ้งซ่อมออนไลน์', en: 'Online repair request' },
  { page: 'keyService' as PageView, th: 'บริการรับกุญแจสำรอง', en: 'Spare key service' },
  { page: 'parcel' as PageView, th: 'แจ้งรับพัสดุ ไปรษณีย์ไทย', en: 'Thailand Post parcel pickup' },
  { page: 'foreignAddress' as PageView, th: 'แจ้งที่อยู่สำหรับนักศึกษาต่างชาติ', en: 'Foreign student address report' },
  { page: 'registrationMove' as PageView, th: 'ย้ายทะเบียนเข้า-ออกมหาวิทยาลัย', en: 'House registration transfer' },
]

const dormInfoItems = [
  { page: 'rules' as PageView, th: 'กฎของหอพักนักศึกษา', en: 'Dormitory rules' },
  { page: 'fees' as PageView, th: 'อัตราค่าธรรมเนียมหอพัก', en: 'Dormitory fees' },
  { page: 'documents' as PageView, th: 'ดาวน์โหลดเอกสาร', en: 'Document downloads' },
  { page: 'dormMap' as PageView, th: 'แผนผังหอพักนักศึกษา', en: 'Dormitory map' },
  { page: 'serviceUnits' as PageView, th: 'ติดต่อหน่วยบริการหอพัก', en: 'Contact dormitory service units' },
]

const staffTabs = [
  { value: 'dashboard', th: 'แดชบอร์ด', en: 'Dashboard' },
  { value: 'campaigns', th: 'รอบจอง', en: 'Campaigns' },
  { value: 'applications', th: 'ใบสมัคร', en: 'Applications' },
  { value: 'rooms', th: 'ห้องว่าง', en: 'Rooms' },
  { value: 'reports', th: 'รายงาน', en: 'Reports' },
]

const testAccounts: TestAccount[] = [
  {
    label: 'สมศรี ดีเลิศ',
    description: 'Applicant - slip verification',
    username: '653020222-3',
    password: 'password',
    role: 'applicant',
    appId: 'APP-001095',
    displayName: 'นางสาวสมศรี ดีเลิศ',
    identifier: '653020222-3',
    unit: 'คณะแพทยศาสตร์',
  },
  {
    label: 'สมชาย รักดี',
    description: 'Applicant - confirmed reservation',
    username: '643020111-2',
    password: 'password',
    role: 'applicant',
    appId: 'APP-001042',
    displayName: 'นายสมชาย รักดี',
    identifier: '643020111-2',
    unit: 'คณะวิศวกรรมศาสตร์',
  },
  {
    label: 'กัญญา พรหมดี',
    description: 'Applicant - waiting for payment',
    username: '643020444-1',
    password: 'password',
    role: 'applicant',
    appId: 'APP-001150',
    displayName: 'นางสาวกัญญา พรหมดี',
    identifier: '643020444-1',
    unit: 'คณะมนุษยศาสตร์และสังคมศาสตร์',
  },
  {
    label: 'Dorm Operations',
    description: 'Staff workspace',
    username: 'staff.dorm',
    password: 'password',
    role: 'admin',
    displayName: 'เจ้าหน้าที่ฝ่ายหอพัก',
    identifier: 'STAFF-DORM-001',
    unit: 'กองบริการหอพักนักศึกษา',
  },
]

const featureCardIcons = [
  {
    icon: Headphones,
  },
  {
    icon: Building,
  },
  {
    icon: Calendar,
  },
  {
    icon: ShieldCheck,
  },
]

const dormitories: DormitoryCard[] = [
  {
    name: 'Nopparat 9',
    nameTh: 'หอพักนพรัตน์ / หอ 9 หลัง',
    subtitle: 'Nopparat Dormitory',
    image: nopparatImage,
    subtitleTh: 'หอพักนพรัตน์',
    gender: 'Male and female buildings',
    genderTh: 'ชาย 4 หลัง / หญิง 5 หลัง',
    roomType: 'Air-conditioned',
    roomTypeTh: 'ห้องปรับอากาศ',
    availability: 'Rooms Available',
    availabilityTh: 'มีห้องว่าง',
    criteria: {
      applicantType: 'General Applicant',
      applicantTypeTh: 'ผู้สมัครทั่วไป',
      timing: 'Before deadline',
      timingTh: 'ชำระก่อนกำหนด',
      slipRequired: 'Slip required',
      slipRequiredTh: 'ต้องแนบหลักฐานชำระเงิน',
    },
  },
  {
    name: 'Wora International',
    nameTh: 'หอพักวรอินเตอร์',
    subtitle: 'International Dormitory',
    image: woraInternationalImage,
    subtitleTh: 'หอพักนานาชาติ',
    gender: 'Female A-C / Male D',
    genderTh: 'หญิง A-C / ชาย D',
    roomType: 'Premium AC rooms',
    roomTypeTh: 'ห้องปรับอากาศพรีเมียม',
    availability: 'Limited Rooms',
    availabilityTh: 'ห้องว่างจำกัด',
    criteria: {
      applicantType: 'Thai and International Students',
      applicantTypeTh: 'นักศึกษาไทยและต่างชาติ',
      timing: 'Pay when applying',
      timingTh: 'ชำระเมื่อสมัคร',
      slipRequired: 'Slip required',
      slipRequiredTh: 'ต้องแนบหลักฐานชำระเงิน',
    },
  },
  {
    name: 'Wora Residence 8',
    nameTh: 'วรเรสซิเดนซ์ / หอ 8 หลัง',
    subtitle: 'Wora Residence',
    image: woraResidenceEntranceImage,
    subtitleTh: 'วรเรสซิเดนซ์',
    gender: 'Male and female buildings',
    genderTh: 'ชาย 2 หลัง / หญิง 6 หลัง',
    roomType: 'Fan and AC rooms',
    roomTypeTh: 'ห้องพัดลมและปรับอากาศ',
    availability: 'Rooms Available',
    availabilityTh: 'มีห้องว่าง',
    criteria: {
      applicantType: 'General Applicant',
      applicantTypeTh: 'ผู้สมัครทั่วไป',
      timing: 'Pay when applying',
      timingTh: 'ชำระเมื่อสมัคร',
      slipRequired: 'Slip required',
      slipRequiredTh: 'ต้องแนบหลักฐานชำระเงิน',
    },
  },
]

const dormDetailContent: Record<string, DormDetailContent> = {
  'dorm-9': {
    summaryTh: 'หอพักนพรัตน์ หรือหอพัก 9 หลัง เป็นกลุ่มหอพักในกำกับมหาวิทยาลัย รองรับทั้งอาคารชายและหญิง เหมาะกับนักศึกษาที่ต้องการหอพักใกล้พื้นที่บริการหลักของมหาวิทยาลัย มีห้องธรรมดา ห้องปรับอากาศ และห้องปรับอากาศพิเศษ',
    summaryEn: 'Nopparat 9 is an affiliated dormitory group with male and female buildings, standard rooms, air-conditioned rooms, and special air-conditioned rooms.',
    gallery: [nopparatImage, nopparatOfficeImage, nopparatRoomImage, nopparatCanteenImage],
    highlightsTh: ['อาคารรวม 9 หลัง', 'หอพักชาย 4 หลัง / หอพักหญิง 5 หลัง', 'คิดค่าธรรมเนียมรายภาคการศึกษา', 'มีห้องอ่านหนังสือ ตู้กดน้ำ และพื้นที่บริการประจำหอ'],
    highlightsEn: ['9 buildings', '4 male buildings / 5 female buildings', 'Semester-based fee model', 'Study areas, water dispensers, and dorm service points'],
    documents: [
      { titleTh: 'กฎของหอพักนักศึกษา', titleEn: 'Dormitory rules', href: '/dorm-documents/dorm-rules.pdf' },
      { titleTh: 'คู่มือจองหอพักออนไลน์', titleEn: 'Online reservation guide', href: '/dorm-documents/online-reservation-guide.pdf' },
      { titleTh: 'แผนผังบริเวณหอพักนักศึกษา', titleEn: 'Dormitory map', href: '/dorm-documents/dormitory-map.pdf' },
    ],
  },
  'dorm-8': {
    summaryTh: 'หอพักวรเรสซิเดนซ์ 8 หลัง เป็นหอพักสวัสดิการนักศึกษาในกำกับมหาวิทยาลัย แบ่งเป็นหอพักชาย 2 หลังและหอพักหญิง 6 หลัง มีห้องพัดลม ห้องปรับอากาศ และห้องปรับอากาศภาคพิเศษ รูปแบบค่าธรรมเนียมเป็นรายปีพร้อมทางเลือกแบ่งชำระตามภาคการศึกษา',
    summaryEn: 'Wora Residence 8 is an affiliated welfare dormitory with 2 male buildings and 6 female buildings, fan rooms, air-conditioned rooms, and special AC rooms. Fees are annual with split-payment options.',
    gallery: [woraResidenceEntranceImage, woraResidenceImage, woraResidenceGateImage, woraResidenceCanteenImage, woraResidenceStoreImage],
    highlightsTh: ['อาคารรวม 8 หลัง', 'หอพักชาย 2 หลัง / หอพักหญิง 6 หลัง', 'รองรับห้องพัดลมและห้องปรับอากาศ', 'มีโรงอาหาร ร้านค้า และสำนักงานบริการประจำหอ'],
    highlightsEn: ['8 buildings', '2 male buildings / 6 female buildings', 'Fan and AC room options', 'Canteen, shops, and dorm service office'],
    documents: [
      { titleTh: 'ข้อตกลงการบริหารจัดการหอพักสวัสดิการนักศึกษา 8 หลัง', titleEn: 'Wora Residence 8 management agreement', href: '/dorm-documents/wora-residence-8-agreement.pdf' },
      { titleTh: 'กฎของหอพักนักศึกษา', titleEn: 'Dormitory rules', href: '/dorm-documents/dorm-rules.pdf' },
      { titleTh: 'แผนผังบริเวณหอพักนักศึกษา', titleEn: 'Dormitory map', href: '/dorm-documents/dormitory-map.pdf' },
    ],
  },
  'dorm-inter': {
    summaryTh: 'หอพักวรอินเตอร์เป็นหอพักสวัสดิการนักศึกษา 4 หลังในกำกับมหาวิทยาลัย แบ่งเป็นหอพักหญิง A, B, C และหอพักชาย D รองรับนักศึกษาไทยและนักศึกษาต่างชาติ พร้อมพื้นที่ส่วนกลาง ห้องอ่านหนังสือ และบริการซักรีด',
    summaryEn: 'Wora International is a 4-building affiliated dormitory with female buildings A, B, C and male building D. It serves Thai and international students with common areas, study rooms, and laundry services.',
    gallery: [woraInternationalImage, woraInternationalWideImage, woraInternationalRoomImage, woraInternationalCommonImage, woraInternationalLaundryImage],
    highlightsTh: ['อาคารรวม 4 หลัง', 'หอพักหญิง A-C / หอพักชาย D', 'รองรับนักศึกษาไทยและต่างชาติ', 'มีพื้นที่ส่วนกลาง ห้องอ่านหนังสือ และบริการซักรีด'],
    highlightsEn: ['4 buildings', 'Female A-C / Male D', 'Thai and international students', 'Common areas, study room, and laundry service'],
    documents: [
      { titleTh: 'กฎของหอพักนักศึกษา', titleEn: 'Dormitory rules', href: '/dorm-documents/dorm-rules.pdf' },
      { titleTh: 'คู่มือจองหอพักออนไลน์', titleEn: 'Online reservation guide', href: '/dorm-documents/online-reservation-guide.pdf' },
      { titleTh: 'แผนผังบริเวณหอพักนักศึกษา', titleEn: 'Dormitory map', href: '/dorm-documents/dormitory-map.pdf' },
    ],
  },
}

const announcementItems = [
  {
    title: 'ประกาศผลการคัดเลือกที่ปรึกษาหอพักนักศึกษา ประจำปีการศึกษา 2569',
    date: '10/04/2569',
    highlight: true,
  },
  {
    title: 'รายชื่อผู้มีสิทธิ์เข้ารับการคัดเลือกเป็นที่ปรึกษาหอพักนักศึกษา',
    date: '09/03/2569',
    highlight: true,
  },
  {
    title: 'รับสมัครที่ปรึกษาหอพักนักศึกษา ประจำปี 2569',
    date: '10/04/2569',
  },
  {
    title: 'รายชื่อนักศึกษาผู้มีคุณสมบัติได้รับสิทธิ์เข้าพักในหอพักนักศึกษาส่วนกลาง',
    date: '05/03/2569',
  },
  {
    title: 'ประกาศรายชื่อผู้ผ่านการคัดเลือกเข้าพักในหอพักนักศึกษาส่วนกลาง',
    date: '06/02/2569',
  },
  {
    title: 'การบริหารหอพักนักศึกษา ภาคการศึกษาพิเศษ ประจำปีการศึกษา 2568',
    date: '29/01/2569',
  },
]

const documentItems = [
  'ใบคำร้องทั่วไป',
  'ใบสมัครเข้าพักในหอพักนักศึกษา สำหรับนักศึกษาใหม่',
  'ใบสมัครเข้าพักในหอพักนักศึกษา สำหรับนักศึกษาชั้นปีที่ 2 ขึ้นไป',
  'ใบสมัครเข้าพักในหอพักนักศึกษา สำหรับภาคการศึกษาพิเศษ',
  'ใบคำร้องขอสละสิทธิ์การเข้าพักในหอพัก',
  'ใบสมัครที่ปรึกษาหอพักนักศึกษา',
  'แบบรายงานผลการปฏิบัติงานที่ปรึกษาหอพัก',
  'แบบตรวจเยี่ยมหอพักนักศึกษา',
  'แบบประเมินความสะอาด',
  'แบบขออนุญาตใช้รถยนต์กองบริการหอพักนักศึกษา',
  'ใบยืมวัสดุ - ครุภัณฑ์',
]

const officialDocumentLinks = [
  { titleTh: 'กฎของหอพักนักศึกษา', titleEn: 'Dormitory rules', href: '/dorm-documents/dorm-rules.pdf' },
  { titleTh: 'ข้อตกลงการบริหารจัดการหอพักสวัสดิการนักศึกษา 8 หลัง', titleEn: 'Wora Residence 8 agreement', href: '/dorm-documents/wora-residence-8-agreement.pdf' },
  { titleTh: 'คู่มือจองหอพักออนไลน์', titleEn: 'Online reservation guide', href: '/dorm-documents/online-reservation-guide.pdf' },
  { titleTh: 'แผนผังบริเวณหอพักนักศึกษา', titleEn: 'Dormitory map', href: '/dorm-documents/dormitory-map.pdf' },
]

const contactRows = [
  { unit: 'ผู้อำนวยการกองบริการหอพักนักศึกษา', detail: 'สำนักงานกองบริการหอพักนักศึกษา', phone: '44820' },
  { unit: 'หน่วยอำนวยการ', detail: 'สำนักงานกองบริการหอพักนักศึกษา', phone: '44822, 42799' },
  { unit: 'หน่วยพัฒนาคุณภาพ', detail: 'สำนักงานกองบริการหอพักนักศึกษา', phone: '44821' },
  { unit: 'หน่วยบริการหอพักที่ 1', detail: 'ดูแลหอพักหญิงที่ 2, 3, 4, 26', phone: '42791' },
  { unit: 'หน่วยบริการหอพักที่ 2', detail: 'ดูแลหอพักหญิงที่ 13, 14, 19, 20', phone: '42792' },
  { unit: 'หน่วยบริการหอพักที่ 3', detail: 'ดูแลหอพักหญิงที่ 1, 17, 18', phone: '42793' },
  { unit: 'หน่วยบริการหอพักที่ 4', detail: 'ดูแลหอพักหญิงที่ 21, 23, 24, 25', phone: '42794' },
  { unit: 'หน่วยบริการหอพักที่ 5', detail: 'ดูแลหอพักชายที่ 5, 7, 8, 9, 10, 22', phone: '42795' },
  { unit: 'หน่วยบริการหอพักที่ 6', detail: 'ดูแลหอพักชายที่ 11, 12, 15, 16, 27', phone: '42796' },
]

const serviceCards = [
  { title: 'สำนักงานหอพักนพรัตน์', subtitle: 'หอพัก 9 หลัง', phone: '081-5469337, 043-203145' },
  { title: 'สำนักงานหอพักสวัสดิการนักศึกษา', subtitle: 'หอพัก 8 หลัง / วรเรสซิเดนซ์', phone: '086-4599211' },
  { title: 'สำนักงานหอพักวรอินเตอร์', subtitle: 'หออินเตอร์', phone: '086-4600173' },
]

const personnelGroups = (personnelCardsData.profiles as Array<{
  section: string
  name: string
  position: string
  email: string
  image_path: string
}>).reduce<Array<{
  title: string
  people: Array<{ name: string; role: string; email: string; image: string }>
}>>((groups, profile) => {
  const group = groups.find(item => item.title === profile.section)
    || groups[groups.push({ title: profile.section, people: [] }) - 1]
  group.people.push({
    name: profile.name,
    role: profile.position,
    email: profile.email,
    image: profile.image_path.split('/').pop() || '',
  })
  return groups
}, [])

const t = computed(() => copy[locale.value])
const usernameLabel = computed(() => loginRole.value === 'admin' ? t.value.modal.staffAccount : t.value.modal.studentId)
const usernamePlaceholder = computed(() => loginRole.value === 'admin' ? 'staff.dorm' : '653020XXX-X')
const featureCards = computed(() => featureCardIcons.map((item, index) => ({
  ...item,
  ...t.value.features[index],
})))
const localizedReservationDetails = computed(() => t.value.reservationDetails.map((detail, index) => ({
  ...detail,
  icon: [Calendar, Home, CreditCard, Headphones][index],
})))
const currentStaffTab = computed({
  get: () => props.currentAdminTab || 'dashboard',
  set: (tab: string) => emit('update:currentAdminTab', tab),
})
const activeCampaigns = computed(() => props.campaigns.filter(campaign => campaign.status === 'open'))
const selectedDormId = computed(() => getDormId(selectedDorm.value || dormitories[0]))
const selectedCampaign = computed(() => props.campaigns.find(campaign => campaign.id === selectedDormId.value) || null)
const selectedRoomTypes = computed(() => selectedCampaign.value?.roomTypes || [])
const selectedDormRooms = computed(() => props.dormRooms[selectedDormId.value] || null)
const availableFloors = computed(() => selectedDormRooms.value?.floors.map(floor => String(floor.floor)) || [])
const selectedFloorRooms = computed(() => {
  const floor = selectedDormRooms.value?.floors.find(item => String(item.floor) === selectedFloor.value)
    || selectedDormRooms.value?.floors[0]
  return floor?.rooms || []
})
const visibleFloorRooms = computed(() => {
  if (!applicantForm.value.roomType) return selectedFloorRooms.value
  return selectedFloorRooms.value.filter(room => room.type === applicantForm.value.roomType)
})
const visibleFloorAvailability = computed(() => {
  const capacity = visibleFloorRooms.value.reduce((sum, room) => sum + room.capacity, 0)
  const occupied = visibleFloorRooms.value.reduce((sum, room) => sum + room.occupied, 0)
  return { capacity, occupied, available: capacity - occupied }
})
const floorPlanLeftRooms = computed(() => visibleFloorRooms.value.filter((_, index) => index % 2 === 0))
const floorPlanRightRooms = computed(() => visibleFloorRooms.value.filter((_, index) => index % 2 === 1))
const selectedApplicantRoom = computed(() => {
  if (!applicantForm.value.roomNumber) return null
  return selectedFloorRooms.value.find(room => room.number === applicantForm.value.roomNumber) || null
})
const selectedDormDetail = computed(() => selectedDormId.value ? dormDetailContent[selectedDormId.value] : null)
const selectedRoomGallery = computed(() => selectedDormDetail.value?.gallery.slice(0, 4) || [])
const activePaymentCampaign = computed(() => {
  if (!props.activeApp?.dormId) return null
  return props.campaigns.find(campaign => campaign.id === props.activeApp?.dormId) || null
})
const selectedPaymentAmount = computed(() => activePaymentCampaign.value?.requiredAmount || selectedCampaign.value?.requiredAmount || 3000)

watch(selectedDormId, () => {
  selectedFloor.value = availableFloors.value[0] || ''
  const roomTypeNames = selectedRoomTypes.value.map(type => type.name)
  if (applicantForm.value.roomType && !roomTypeNames.includes(applicantForm.value.roomType)) {
    applicantForm.value.roomType = ''
  }
  applicantForm.value.roomNumber = ''
}, { immediate: true })

watch(() => applicantForm.value.roomType, () => {
  const stillValid = selectedFloorRooms.value.some(room => (
    room.number === applicantForm.value.roomNumber
    && (!applicantForm.value.roomType || room.type === applicantForm.value.roomType)
  ))
  if (!stillValid) applicantForm.value.roomNumber = ''
})

watch(selectedFloor, () => {
  const stillOnFloor = visibleFloorRooms.value.some(room => room.number === applicantForm.value.roomNumber)
  if (!stillOnFloor) applicantForm.value.roomNumber = ''
})
watch(() => props.activeApp?.id, () => {
  if (!props.activeApp || bookingDraftMode.value) return
  setSelectedDormById(props.activeApp.dormId)
  applicantForm.value.name = props.activeApp.name
  applicantForm.value.studentId = props.activeApp.studentId
  applicantForm.value.phone = props.activeApp.phone
  applicantForm.value.email = props.activeApp.email
  applicantForm.value.faculty = props.activeApp.faculty
  applicantForm.value.gender = props.activeApp.gender || applicantForm.value.gender
  applicantForm.value.applicantType = props.activeApp.applicantType || applicantForm.value.applicantType
  applicantForm.value.roomType = props.activeApp.roomType || applicantForm.value.roomType
  applicantForm.value.roomNumber = props.activeApp.roomNumber || applicantForm.value.roomNumber
}, { immediate: true })
const applicantStepIndex = computed(() => {
  if (bookingDraftMode.value) return 1
  if (!props.activeApp) return 1
  if (props.activeApp.status === 'Submitted') return 2
  if (props.activeApp.status === 'Staff Verifying' || props.activeApp.status === 'Need Re-upload') return 3
  if (props.activeApp.status === 'Confirmed') return 4
  return 3
})
const displayApplicantStepIndex = computed(() => simulatedProgressStep.value || applicantStepIndex.value)
const applicantSteps = computed(() => {
  const current = displayApplicantStepIndex.value
  const labels = locale.value === 'th'
    ? ['เลือกห้อง', 'ชำระเงิน', 'ตรวจสอบ', 'ยืนยันสิทธิ์']
    : ['Select room', 'Payment', 'Staff Review', 'Confirmation']
  return labels.map((label, index) => ({
    label,
    done: index + 1 < current,
    active: index + 1 === current,
  }))
})
const applicantStatusCopy = computed(() => {
  if (locale.value === 'th') {
    if (bookingDraftMode.value) return 'เลือกห้องว่างจากผังชั้น ระบบจะดึงข้อมูลผู้สมัครจากบัญชี KKU ให้อัตโนมัติ'
    if (!props.activeApp) return 'เลือกห้องว่างจากผังชั้นเพื่อเริ่มการจองประจำปี'
    if (displayApplicantStepIndex.value >= 4 || props.activeApp.status === 'Confirmed') return 'ยืนยันสิทธิ์การจองสำเร็จ สามารถพิมพ์เอกสารการจองได้'
    if (props.activeApp.status === 'Submitted') return 'ตรวจสอบข้อมูลผู้สมัครและดำเนินการชำระเงินเพื่อจองสิทธิ์'
    if (props.activeApp.status === 'Staff Verifying') return 'เจ้าหน้าที่กำลังตรวจสอบหลักฐานการชำระเงิน'
    if (props.activeApp.status === 'Need Re-upload') return 'เจ้าหน้าที่ขอให้ส่งหลักฐานการชำระเงินใหม่'
    return 'ใบสมัครถูกปฏิเสธ กรุณาติดต่อหน่วยบริการหอพัก'
  }
  if (bookingDraftMode.value) return 'Choose an available room from the floor plan. Applicant details are pulled from the KKU account.'
  if (!props.activeApp) return 'Choose an available room from the floor plan to start the annual reservation.'
  if (displayApplicantStepIndex.value >= 4 || props.activeApp.status === 'Confirmed') return 'Reservation confirmed. You can print the reservation ticket.'
  if (props.activeApp.status === 'Submitted') return 'Review applicant details and complete payment to reserve the room.'
  if (props.activeApp.status === 'Staff Verifying') return 'Payment evidence is being reviewed by dormitory staff.'
  if (props.activeApp.status === 'Need Re-upload') return 'Staff requested a new payment slip. Please upload a clearer receipt.'
  return 'Application was rejected. Please contact dormitory support.'
})
const staffStats = computed(() => {
  const total = props.applicants.length
  const waitingPayment = props.applicants.filter(app => app.status === 'Submitted').length
  const verifying = props.applicants.filter(app => app.status === 'Staff Verifying' || app.status === 'Need Re-upload').length
  const confirmed = props.applicants.filter(app => app.status === 'Confirmed').length
  return { total, waitingPayment, verifying, confirmed }
})
const occupancySummary = computed(() => {
  const rooms = Object.values(props.dormRooms).flatMap(dorm => dorm.floors.flatMap(floor => floor.rooms))
  const capacity = rooms.reduce((sum, room) => sum + room.capacity, 0)
  const occupied = rooms.reduce((sum, room) => sum + room.occupied, 0)
  const rate = capacity ? Math.round((occupied / capacity) * 100) : 0
  return { rooms: rooms.length, capacity, occupied, available: capacity - occupied, rate }
})
const userInitial = computed(() => {
  if (!props.user?.displayName) return props.role === 'admin' ? 'ST' : 'KK'
  return props.user.displayName.slice(0, 2).toUpperCase()
})
const currentDormPage = computed(() => {
  if (currentPage.value === 'dorm8') return dormitories.find(dorm => dorm.name === 'Wora Residence 8') || null
  if (currentPage.value === 'dorm9') return dormitories.find(dorm => dorm.name === 'Nopparat 9') || null
  if (currentPage.value === 'dormInter') return dormitories.find(dorm => dorm.name === 'Wora International') || null
  return null
})
const currentDormId = computed(() => currentDormPage.value ? getDormId(currentDormPage.value) : '')
const currentDormDetail = computed(() => currentDormId.value ? dormDetailContent[currentDormId.value] : null)
const currentDormCampaign = computed(() => currentDormId.value ? props.campaigns.find(campaign => campaign.id === currentDormId.value) || null : null)
const currentDormFeeGroup = computed<DormFeeGroup | null>(() => {
  const feeGroupMap: Record<string, string> = {
    'dorm-9': 'noppharat_9',
    'dorm-8': 'wora_residence_8',
    'dorm-inter': 'wora_inter_4',
  }
  const feeGroupId = feeGroupMap[currentDormId.value]
  return kkuDormFeeData.groups.find(group => group.id === feeGroupId) || null
})
const currentDormFeeRows = computed(() => currentDormFeeGroup.value?.rooms || [])
const currentDormRoomsSummary = computed(() => {
  const dorm = currentDormId.value ? props.dormRooms[currentDormId.value] : null
  const rooms = dorm?.floors.flatMap(floor => floor.rooms) || []
  const capacity = rooms.reduce((sum, room) => sum + room.capacity, 0)
  const occupied = rooms.reduce((sum, room) => sum + room.occupied, 0)
  return {
    floors: dorm?.floors.length || 0,
    rooms: rooms.length,
    capacity,
    occupied,
    available: capacity - occupied,
  }
})
const currentDormHighlights = computed(() => {
  if (!currentDormDetail.value) return []
  return locale.value === 'th' ? currentDormDetail.value.highlightsTh : currentDormDetail.value.highlightsEn
})
const isOnlineServicePage = computed(() => onlineServiceItems.some(item => item.page === currentPage.value))
const isDormInfoPage = computed(() => dormInfoItems.some(item => item.page === currentPage.value))

function openLoginModal(role: UserRole = 'applicant') {
  loginRole.value = role
  loginModalOpen.value = true
}

function setLocale(nextLocale: Locale) {
  locale.value = nextLocale
}

function menuText(item: { th: string; en: string }) {
  return locale.value === 'th' ? item.th : item.en
}

function groupLabel(key: 'dormitories' | 'onlineServices' | 'dormInfo') {
  const labels = {
    dormitories: { th: 'หอพัก', en: 'Dormitories' },
    onlineServices: { th: 'บริการออนไลน์', en: 'Online Services' },
    dormInfo: { th: 'ข้อมูลเกี่ยวกับหอพักนักศึกษา', en: 'Dormitory Information' },
  }
  return menuText(labels[key])
}

function staffTabLabel(tab: { th: string; en: string }) {
  return menuText(tab)
}

function statusLabel(status: Applicant['status']) {
  const labels: Record<Applicant['status'], { th: string; en: string }> = {
    Submitted: { th: 'รอชำระเงิน', en: 'Submitted' },
    'Staff Verifying': { th: 'รอตรวจสอบ', en: 'Staff Verifying' },
    'Need Re-upload': { th: 'ขอสลิปใหม่', en: 'Need Re-upload' },
    Confirmed: { th: 'ยืนยันแล้ว', en: 'Confirmed' },
    Rejected: { th: 'ไม่ผ่านเงื่อนไข', en: 'Rejected' },
  }
  return menuText(labels[status])
}

function staffStatLabel(key: 'total' | 'payment' | 'review' | 'confirmed') {
  const labels = {
    total: { th: 'ใบสมัครทั้งหมด', en: 'Total applications' },
    payment: { th: 'รอชำระเงิน', en: 'Waiting payment' },
    review: { th: 'รอตรวจสอบ', en: 'Needs staff review' },
    confirmed: { th: 'ยืนยันแล้ว', en: 'Confirmed' },
  }
  return menuText(labels[key])
}

function availabilityRoomTypeLabel() {
  const labels: Record<string, string> = {
    all: t.value.allTypes,
    'air-conditioned': t.value.airConditioned,
    'fan-room': t.value.fanRoom,
    'premium-room': t.value.premiumRoom,
  }
  return labels[roomType.value] || t.value.allTypes
}

function availabilityGenderLabel() {
  const labels: Record<string, string> = {
    all: t.value.allStudents,
    'female-only': t.value.femaleOnly,
    'male-only': t.value.maleOnly,
    international: t.value.international,
  }
  return labels[gender.value] || t.value.allStudents
}

function localizedRoomTypeName(name: string) {
  if (locale.value === 'th') return name
  if (name.includes('พรีเมียม')) return 'Premium single AC room'
  if (name.includes('เตียงเดี่ยว')) return 'Single AC room'
  if (name.includes('พัดลม')) return 'Twin fan room'
  if (name.includes('เตียงคู่')) return 'Twin AC room'
  return name
}

function applicantRoomTypeLabel() {
  return applicantForm.value.roomType
    ? localizedRoomTypeName(applicantForm.value.roomType)
    : (locale.value === 'th' ? 'เลือกประเภทห้อง' : 'Select room type')
}

function applicantGenderLabel() {
  const labels: Record<string, { th: string; en: string }> = {
    Female: { th: 'หญิง', en: 'Female' },
    Male: { th: 'ชาย', en: 'Male' },
    Other: { th: 'อื่น ๆ', en: 'Other' },
  }
  return menuText(labels[applicantForm.value.gender] || labels.Female)
}

function applicantTypeLabel() {
  const labels: Record<string, { th: string; en: string }> = {
    'General Student': { th: 'นักศึกษาทั่วไป', en: 'General Student' },
    'New First-Year': { th: 'นักศึกษาใหม่', en: 'New First-Year' },
    'Current Resident': { th: 'นักศึกษาหอพักเดิม', en: 'Current Resident' },
    'International Student': { th: 'นักศึกษาต่างชาติ', en: 'International Student' },
  }
  return menuText(labels[applicantForm.value.applicantType] || labels['General Student'])
}

function floorLabel() {
  if (!selectedFloor.value) return locale.value === 'th' ? 'เลือกชั้น' : 'Select floor'
  return locale.value === 'th' ? `ชั้น ${selectedFloor.value}` : `Floor ${selectedFloor.value}`
}

function selectedDormLabel() {
  return dormName(selectedDorm.value || dormitories[0])
}

function dateValueToDateString(value: DateValue | string) {
  return value.toString().slice(0, 10)
}

function formatDateButton(value: string) {
  if (!value) return locale.value === 'th' ? 'เลือกวันที่' : 'Select date'
  const [year, month, day] = dateValueToDateString(value).split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat(locale.value === 'th' ? 'th-TH' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function setAvailabilityDate(field: 'moveIn' | 'moveOut', value: DateValue | undefined) {
  if (!value) return
  const formatted = dateValueToDateString(value)
  if (field === 'moveIn') {
    moveInDateValue.value = value
    moveInDate.value = formatted
    return
  }
  moveOutDateValue.value = value
  moveOutDate.value = formatted
}

function setSelectedDormById(dormId: string) {
  const dorm = dormitories.find(item => getDormId(item) === dormId)
  if (dorm) selectedDorm.value = dorm
}

function roomAvailability(room: RoomInfo) {
  return room.capacity - room.occupied
}

function roomProgress(room: RoomInfo) {
  return room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0
}

function isSelectedApplicantRoom(room: RoomInfo) {
  return applicantForm.value.roomNumber === room.number
}

function roomPlanClass(room: RoomInfo) {
  if (roomAvailability(room) <= 0) {
    return 'cursor-not-allowed border-muted bg-muted/40 text-muted-foreground opacity-70'
  }
  if (isSelectedApplicantRoom(room)) {
    return 'border-primary/70 bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/25'
  }
  return 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
}

function roomPlanPillClass(room: RoomInfo) {
  if (roomAvailability(room) <= 0) return 'bg-muted text-muted-foreground ring-border'
  if (isSelectedApplicantRoom(room)) return 'bg-primary text-primary-foreground ring-primary'
  return 'bg-background text-foreground ring-border'
}

function roomPlanBarClass(room: RoomInfo) {
  if (roomAvailability(room) <= 0) return 'bg-muted-foreground/45'
  if (isSelectedApplicantRoom(room)) return 'bg-primary'
  return 'bg-primary/70'
}

function roomPlanStatusLabel(room: RoomInfo) {
  if (roomAvailability(room) <= 0) return locale.value === 'th' ? 'เต็ม' : 'Full'
  if (isSelectedApplicantRoom(room)) return locale.value === 'th' ? 'เลือกแล้ว' : 'Selected'
  return locale.value === 'th' ? 'ว่าง' : 'Available'
}

function chooseApplicantRoom(room: RoomInfo) {
  if (roomAvailability(room) <= 0) return
  applicantForm.value.roomType = room.type
  applicantForm.value.roomNumber = room.number
}

function hydrateApplicantFormFromSession() {
  if (!props.user) return
  applicantForm.value.name ||= props.user.displayName
  applicantForm.value.studentId ||= props.user.identifier
  applicantForm.value.email ||= `${props.user.identifier}@kku.ac.th`
  applicantForm.value.faculty ||= props.user.unit || 'Khon Kaen University'
}

function openUniPayDialog() {
  uniPaySuccess.value = false
  uniPayProcessing.value = false
  uniPayDialogOpen.value = true
}

function confirmUniPayPayment() {
  if (uniPayProcessing.value || uniPaySuccess.value) return
  uniPayProcessing.value = true
  window.setTimeout(() => {
    uniPayProcessing.value = false
    uniPaySuccess.value = true
  }, 900)
}

function finishUniPayStatusUpdate() {
  if (!uniPaySuccess.value) return
  emit('simulateUniPay')
  uniPayDialogOpen.value = false
}

function goToPage(page: PageView) {
  currentPage.value = page
  activePortal.value = page === 'reservation' || page === 'receipts' ? 'applicant' : page === 'staff' ? 'staff' : 'home'
  if (page === 'reservation' || page === 'receipts') {
    bookingDraftMode.value = false
    simulatedProgressStep.value = null
  }
  if (page === 'reservation' && !props.isLoggedIn) openLoginModal('applicant')
  if (page === 'receipts' && (!props.isLoggedIn || props.role !== 'applicant')) openLoginModal('applicant')
  if (page === 'staff' && !props.isLoggedIn) openLoginModal('admin')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function personnelImage(fileName: string) {
  return personnelImages[`../../dorm_kku_ui_assets/images/personnel/${fileName}`] || ''
}

function pageTitle(page: PageView) {
  const allItems = [...dormMenuItems, ...onlineServiceItems, ...dormInfoItems]
  const found = allItems.find(item => item.page === page)
  if (found) return menuText(found)
  const labels: Record<PageView, { th: string; en: string }> = {
    home: { th: 'หน้าหลัก', en: 'Home' },
    dorm8: { th: 'หอพักวรเรสซิเดนซ์ 8 หลัง', en: 'Wora Residence 8' },
    dorm9: { th: 'หอพักนพรัตน์ 9 หลัง', en: 'Nopparat 9' },
    dormInter: { th: 'หอพักวรอินเตอร์', en: 'Wora International' },
    organization: { th: 'โครงสร้างบุคลากร', en: 'Organization' },
    announcements: { th: 'ประกาศ', en: 'Announcements' },
    repair: { th: 'แจ้งซ่อมออนไลน์', en: 'Online repair request' },
    keyService: { th: 'บริการรับกุญแจสำรอง', en: 'Spare key service' },
    parcel: { th: 'แจ้งรับพัสดุ ไปรษณีย์ไทย', en: 'Thailand Post parcel pickup' },
    foreignAddress: { th: 'แจ้งที่อยู่สำหรับนักศึกษาต่างชาติ', en: 'Foreign student address report' },
    registrationMove: { th: 'ย้ายทะเบียนเข้า-ออกมหาวิทยาลัย', en: 'House registration transfer' },
    rules: { th: 'กฎของหอพักนักศึกษา', en: 'Dormitory rules' },
    fees: { th: 'อัตราค่าธรรมเนียมหอพัก', en: 'Dormitory fees' },
    documents: { th: 'ดาวน์โหลดเอกสาร', en: 'Document downloads' },
    dormMap: { th: 'แผนผังหอพักนักศึกษา', en: 'Dormitory map' },
    serviceUnits: { th: 'ติดต่อหน่วยบริการหอพัก', en: 'Contact dormitory service units' },
    contact: { th: 'ติดต่อ', en: 'Contact' },
    reservation: { th: 'การจองของฉัน', en: 'My Reservation' },
    receipts: { th: 'ใบเสร็จย้อนหลัง', en: 'Receipt history' },
    staff: { th: 'พื้นที่เจ้าหน้าที่', en: 'Staff Workspace' },
  }
  return menuText(labels[page])
}

function dormName(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.nameTh : dorm.name
}

function dormSubtitle(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.subtitleTh : dorm.subtitle
}

function dormGender(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.genderTh : dorm.gender
}

function dormRoomType(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.roomTypeTh : dorm.roomType
}

function dormAvailability(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.availabilityTh : dorm.availability
}

function dormApplicantType(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.criteria.applicantTypeTh : dorm.criteria.applicantType
}

function dormPaymentTiming(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.criteria.timingTh : dorm.criteria.timing
}

function dormSlipRequirement(dorm: DormitoryCard) {
  return locale.value === 'th' ? dorm.criteria.slipRequiredTh : dorm.criteria.slipRequired
}

function getDormId(dorm: DormitoryCard) {
  if (dorm.name.includes('Nopparat')) return 'dorm-9'
  if (dorm.name.includes('International')) return 'dorm-inter'
  return 'dorm-8'
}

function getDormPage(dorm: DormitoryCard): PageView {
  if (dorm.name.includes('Nopparat')) return 'dorm9'
  if (dorm.name.includes('International')) return 'dormInter'
  return 'dorm8'
}

function openDormDetails(dorm: DormitoryCard) {
  selectedDorm.value = dorm
  bookingDraftMode.value = false
  simulatedProgressStep.value = null
  activePortal.value = 'home'
  currentPage.value = getDormPage(dorm)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function dormDetailSummary(detail: DormDetailContent) {
  return locale.value === 'th' ? detail.summaryTh : detail.summaryEn
}

function dormDocumentTitle(document: DormDetailContent['documents'][number]) {
  return locale.value === 'th' ? document.titleTh : document.titleEn
}

function officialDocumentTitle(document: (typeof officialDocumentLinks)[number]) {
  return locale.value === 'th' ? document.titleTh : document.titleEn
}

function baht(value: number | null | undefined) {
  return value ? `${money(value)} ${locale.value === 'th' ? 'บาท' : 'THB'}` : '-'
}

function feePrimaryValue(row: DormFeeRoom) {
  if (row.regular_semester_baht) return baht(row.regular_semester_baht)
  return baht(row.two_person_annual_baht || row.single_annual_baht)
}

function feeSecondaryValue(row: DormFeeRoom) {
  if (row.special_semester_baht) return baht(row.special_semester_baht)
  return baht(row.two_person_split_per_term_baht || row.single_split_per_term_baht)
}

function scrollToSection(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 80)
}

function openApplicantWorkflow(dorm?: DormitoryCard, options: { fresh?: boolean } = {}) {
  selectedDorm.value = dorm || selectedDorm.value || dormitories[0]
  bookingDraftMode.value = Boolean(options.fresh)
  simulatedProgressStep.value = options.fresh ? 1 : null
  activePortal.value = 'applicant'
  currentPage.value = 'reservation'

  if (!props.isLoggedIn) {
    openLoginModal('applicant')
    return
  }

  if (props.role !== 'applicant') {
    emit('showToast', t.value.toast.applicantOnly)
    return
  }

  hydrateApplicantFormFromSession()
  scrollToSection('applicant-workflow')
}

function logout() {
  currentPage.value = 'home'
  activePortal.value = 'home'
  simulatedProgressStep.value = null
  bookingDraftMode.value = false
  selectedDorm.value = null
  selectedStaffApp.value = null
  staffReviewOpen.value = false
  uniPayDialogOpen.value = false
  uniPayProcessing.value = false
  uniPaySuccess.value = false
  profileEditMode.value = false
  emit('logout')
}

function advanceApplicantProgress() {
  simulatedProgressStep.value = Math.min(4, (simulatedProgressStep.value || applicantStepIndex.value) + 1)
  emit('showToast', locale.value === 'th' ? 'จำลองการอัปเดตสถานะเรียบร้อย' : 'Mock status updated.')
}

function handleAvailabilityCheck() {
  emit('showToast', t.value.toast.search)
  openApplicantWorkflow(selectedDorm.value || dormitories[0], { fresh: true })
}

function statusClass(status: Applicant['status']) {
  if (status === 'Confirmed') return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (status === 'Staff Verifying') return 'bg-amber-50 text-amber-700 ring-amber-200'
  if (status === 'Need Re-upload') return 'bg-orange-50 text-orange-700 ring-orange-200'
  if (status === 'Rejected') return 'bg-red-50 text-red-700 ring-red-200'
  return 'bg-muted text-muted-foreground ring-border'
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function submitApplicantApplication() {
  hydrateApplicantFormFromSession()
  const dorm = selectedDorm.value || dormitories[0]
  const campaign = selectedCampaign.value
  const room = selectedApplicantRoom.value
  const roomTypeName = room?.type || applicantForm.value.roomType || selectedRoomTypes.value[0]?.name || dorm.roomType

  if (!room) {
    emit('showToast', locale.value === 'th' ? 'กรุณาเลือกห้องจากผังชั้นก่อนจอง' : 'Please choose a room from the floor plan first.')
    return
  }

  if (!applicantForm.value.name || !applicantForm.value.studentId) {
    emit('showToast', t.value.toast.missingApplicantForm)
    return
  }

  emit('submitApp', {
    name: applicantForm.value.name,
    studentId: applicantForm.value.studentId,
    phone: applicantForm.value.phone || '0800000000',
    email: applicantForm.value.email || `${applicantForm.value.studentId}@kku.ac.th`,
    faculty: applicantForm.value.faculty || 'Khon Kaen University',
    gender: applicantForm.value.gender,
    dormId: getDormId(dorm),
    dormName: campaign?.name || dormName(dorm),
    roomType: roomTypeName,
    roomNumber: room.number,
    applicantType: applicantForm.value.applicantType,
    docFile: 'student_card.pdf',
  })
  bookingDraftMode.value = false
  simulatedProgressStep.value = null
  profileEditMode.value = false
}

function submitManualPayment() {
  if (!manualSlip.value.amount || !manualSlip.value.date || !manualSlip.value.time) {
    emit('showToast', t.value.toast.missingSlip)
    return
  }

  emit('submitManualSlip', {
    amount: Number(manualSlip.value.amount),
    date: manualSlip.value.date,
    time: manualSlip.value.time,
    fileName: manualSlip.value.fileName || 'manual_transfer_receipt.png',
  })
}

function openStaffApplication(app: Applicant) {
  selectedStaffApp.value = app
  staffActionReason.value = app.rejectReason || ''
  staffReviewOpen.value = true
}

function approveSelectedApp() {
  if (!selectedStaffApp.value) return
  emit('approveApp', selectedStaffApp.value.id)
  staffReviewOpen.value = false
}

function reuploadSelectedApp() {
  if (!selectedStaffApp.value) return
  emit('reuploadApp', {
    appId: selectedStaffApp.value.id,
    reason: staffActionReason.value || 'Please upload a clearer payment receipt.',
  })
  staffReviewOpen.value = false
}

function rejectSelectedApp() {
  if (!selectedStaffApp.value) return
  emit('rejectApp', {
    appId: selectedStaffApp.value.id,
    reason: staffActionReason.value || 'Reservation conditions were not met.',
  })
  staffReviewOpen.value = false
}

function createCampaignFromDraft() {
  const now = Date.now()
  emit('createCampaign', {
    id: `campaign-${now}`,
    name: campaignDraft.value.name,
    type: 'Affiliated dormitory',
    status: 'open',
    description: campaignDraft.value.description,
    openDate: campaignDraft.value.openDate,
    closeDate: campaignDraft.value.closeDate,
    requiredAmount: campaignDraft.value.requiredAmount,
    rules: 'Mock campaign created from the new staff workflow.',
    paymentRequirement: 'Reservation deposit',
    facilities: ['WiFi', 'CCTV', 'Laundry'],
    roomTypes: [
      {
        name: 'Standard AC room',
        price: campaignDraft.value.requiredAmount,
        capacity: 20,
        active: 20,
      },
    ],
  })
}

function handleLogin() {
  const cleanUsername = username.value.trim()
  const authUsername = loginRole.value === 'admin' && cleanUsername === 'admin' ? 'staff.dorm' : cleanUsername

  if (!cleanUsername || !password.value) {
    emit('showToast', t.value.toast.missingLogin)
    return
  }

  const matchingAcc = testAccounts.find(acc => acc.username === authUsername && acc.password === password.value)

  if (!matchingAcc) {
    emit('showToast', t.value.toast.wrongPassword)
    return
  }

  const account: TestAccount = matchingAcc
  /*
    label: 'New student account',
    description: 'Applicant',
    username: cleanUsername,
    password: password.value,
    role: 'applicant',
    displayName: 'นักศึกษา มข.',
    identifier: cleanUsername,
    unit: 'Khon Kaen University',
  }
  */

  loginModalOpen.value = false
  simulatedProgressStep.value = null
  if (account.role === 'applicant') {
    applicantForm.value.name ||= account.displayName
    applicantForm.value.studentId ||= account.identifier
    applicantForm.value.email ||= `${account.identifier}@kku.ac.th`
    applicantForm.value.faculty ||= account.unit
  }
  emit('login', {
    role: account.role,
    username: account.username,
    displayName: account.displayName,
    identifier: account.identifier,
    unit: account.unit,
    activeAppId: account.appId,
  })
  emit('showToast', account.role === 'admin' ? t.value.toast.signedStaff : t.value.toast.signedApplicant)
  if (activePortal.value === 'applicant' && account.role === 'applicant') scrollToSection('applicant-workflow')
  if (activePortal.value === 'staff' && account.role === 'admin') scrollToSection('staff-workflow')
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-5 lg:px-8">
        <button class="flex min-w-0 items-center gap-2.5 text-left" type="button">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-background bg-background p-1">
            <img :src="kkuOfficialLogo" alt="Khon Kaen University logo" class="max-h-8 w-auto object-contain">
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-bold uppercase leading-tight tracking-wide text-primary">
              {{ t.brandTitle }}
            </span>
            <span class="block truncate text-xs font-medium text-foreground">
              {{ t.brandSubtitle }}
            </span>
            <span class="block truncate text-[10px] text-muted-foreground">
              {{ t.university }}
            </span>
          </span>
        </button>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <Button type="button" variant="ghost" size="sm" class="h-8 px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground" :class="currentPage === 'home' ? 'bg-muted text-foreground' : ''" @click="goToPage('home')">
            {{ t.nav.home }}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button type="button" variant="ghost" size="sm" class="h-8 px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground" :class="['dorm8', 'dorm9', 'dormInter'].includes(currentPage) ? 'bg-muted text-foreground' : ''">
                {{ t.nav.dormitories }}
                <ChevronDown class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="min-w-72 p-2">
              <DropdownMenuItem v-for="item in dormMenuItems" :key="item.page" class="h-10 cursor-pointer rounded-md text-sm font-medium" @click="goToPage(item.page)">
                {{ menuText(item) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" variant="ghost" size="sm" class="h-8 px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground" :class="currentPage === 'announcements' ? 'bg-muted text-foreground' : ''" @click="goToPage('announcements')">
            {{ pageTitle('announcements') }}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button type="button" variant="ghost" size="sm" class="h-8 px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground" :class="onlineServiceItems.some(item => item.page === currentPage) ? 'bg-muted text-foreground' : ''">
                {{ groupLabel('onlineServices') }}
                <ChevronDown class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="min-w-[22rem] p-2">
              <DropdownMenuItem v-for="item in onlineServiceItems" :key="item.page" class="h-10 cursor-pointer rounded-md text-sm font-medium" @click="goToPage(item.page)">
                {{ menuText(item) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button type="button" variant="ghost" size="sm" class="h-8 px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground" :class="dormInfoItems.some(item => item.page === currentPage) ? 'bg-muted text-foreground' : ''">
                {{ groupLabel('dormInfo') }}
                <ChevronDown class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="min-w-[21rem] p-2">
              <DropdownMenuItem v-for="item in dormInfoItems" :key="item.page" class="h-10 cursor-pointer rounded-md text-sm font-medium" @click="goToPage(item.page)">
                {{ menuText(item) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" variant="ghost" size="sm" class="h-8 px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground" :class="currentPage === 'organization' ? 'bg-muted text-foreground' : ''" @click="goToPage('organization')">
            {{ pageTitle('organization') }}
          </Button>

        </nav>

        <div class="flex items-center gap-2">
          <DropdownMenu v-if="!props.isLoggedIn">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="hidden gap-1 sm:inline-flex">
                <Globe class="size-4" />
                {{ locale === 'th' ? 'TH' : 'EN' }}
                <ChevronDown class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="setLocale('th')">ไทย</DropdownMenuItem>
              <DropdownMenuItem @click="setLocale('en')">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <template v-if="props.isLoggedIn && props.user">
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="hidden h-11 gap-2 rounded-lg border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary/45 hover:bg-primary/10 hover:text-primary sm:inline-flex"
              :class="currentPage === (props.role === 'admin' ? 'staff' : 'reservation') ? 'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''"
              @click="goToPage(props.role === 'admin' ? 'staff' : 'reservation')"
            >
              <span
                class="flex size-6 items-center justify-center rounded-md bg-primary/10"
                :class="currentPage === (props.role === 'admin' ? 'staff' : 'reservation') ? 'bg-primary-foreground/15' : ''"
              >
                <ClipboardList class="size-3.5" />
              </span>
              {{ props.role === 'admin' ? t.staffWorkspace : t.myReservation }}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-11 gap-2 rounded-lg border bg-card px-1.5 hover:bg-muted sm:px-2.5">
                  <Avatar class="size-9">
                    <AvatarFallback class="bg-foreground text-xs font-semibold text-background">
                      {{ userInitial }}
                    </AvatarFallback>
                  </Avatar>
                  <span class="hidden min-w-0 text-left leading-tight lg:block">
                    <span class="block max-w-32 truncate text-xs font-semibold">{{ props.user.identifier }}</span>
                    <span class="block truncate text-[11px] text-muted-foreground">{{ props.role === 'admin' ? t.roleStaff : t.roleApplicant }}</span>
                  </span>
                  <ChevronDown class="hidden size-3.5 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-72 p-1.5">
                <DropdownMenuLabel class="p-2">
                  <div class="flex items-start gap-2.5">
                    <Avatar class="size-9">
                      <AvatarFallback class="bg-foreground text-sm font-semibold text-background">
                        {{ userInitial }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0">
                      <span class="block truncate text-sm font-semibold">{{ props.user.displayName }}</span>
                      <span class="block truncate text-xs font-normal text-muted-foreground">{{ props.user.identifier }}</span>
                      <Badge variant="secondary" class="mt-1.5 text-[11px] text-primary">
                        {{ props.role === 'admin' ? t.roleStaff : t.roleApplicant }}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="h-9 cursor-pointer rounded-md text-[13px] font-medium" @click="goToPage(props.role === 'admin' ? 'staff' : 'reservation')">
                  <ClipboardList class="size-4" />
                  {{ props.role === 'admin' ? t.staffWorkspace : t.myReservation }}
                </DropdownMenuItem>
                <DropdownMenuItem v-if="props.role === 'applicant'" class="h-9 cursor-pointer rounded-md text-[13px] font-medium" @click="goToPage('receipts')">
                  <CreditCard class="size-4" />
                  {{ pageTitle('receipts') }}
                </DropdownMenuItem>
                <DropdownMenuItem class="h-9 cursor-pointer rounded-md text-[13px] font-medium" @click="goToPage('serviceUnits')">
                  <Headphones class="size-4" />
                  {{ pageTitle('serviceUnits') }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div class="p-1.5">
                  <p class="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <Globe class="size-3.5" />
                    {{ locale === 'th' ? 'ภาษาแสดงผล' : 'Display language' }}
                  </p>
                  <div class="relative grid h-8 grid-cols-2 overflow-hidden rounded-lg border bg-muted p-0.5">
                    <span
                      class="absolute inset-y-0.5 w-[calc(50%-0.125rem)] rounded-md bg-background shadow-sm transition-transform"
                      :class="locale === 'en' ? 'translate-x-full' : 'translate-x-0'"
                    />
                    <button
                      type="button"
                      class="relative z-10 inline-flex items-center justify-center gap-1 rounded-md text-xs font-semibold transition-colors"
                      :class="locale === 'th' ? 'text-primary' : 'text-muted-foreground'"
                      @click="setLocale('th')"
                    >
                      ไทย
                      <Check v-if="locale === 'th'" class="size-3.5" />
                    </button>
                    <button
                      type="button"
                      class="relative z-10 inline-flex items-center justify-center gap-1 rounded-md text-xs font-semibold transition-colors"
                      :class="locale === 'en' ? 'text-primary' : 'text-muted-foreground'"
                      @click="setLocale('en')"
                    >
                      English
                      <Check v-if="locale === 'en'" class="size-3.5" />
                    </button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="h-9 cursor-pointer rounded-md text-[13px] text-primary focus:text-primary" @click="logout">
                  <LogOut class="size-4" />
                  {{ t.logout }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </template>
          <template v-else>
            <Button variant="outline" size="sm" class="hidden border-primary/30 text-primary hover:bg-primary/10 lg:inline-flex" @click="openLoginModal('applicant')">
              <User class="size-4" />
              {{ t.login }}
            </Button>
            <Button size="sm" class="hidden shadow-sm lg:inline-flex" @click="openLoginModal('applicant')">
              <User class="size-4" />
              {{ t.signUp }}
            </Button>

            <Button variant="ghost" size="icon" class="sm:hidden" @click="openLoginModal('applicant')">
              <User class="size-5" />
            </Button>
          </template>

          <Sheet>
            <SheetTrigger as-child>
              <Button variant="outline" size="icon" class="lg:hidden">
                <Menu class="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" class="w-80">
              <SheetHeader>
                <SheetTitle>{{ t.brandTitle }}</SheetTitle>
                <SheetDescription>{{ t.brandSubtitle }}</SheetDescription>
              </SheetHeader>
              <div class="mt-6 grid gap-2">
                <Button variant="ghost" class="justify-start" @click="goToPage('home')">{{ t.nav.home }}</Button>
                <Button variant="ghost" class="justify-start" @click="goToPage('organization')">{{ pageTitle('organization') }}</Button>
                <Button variant="ghost" class="justify-start" @click="goToPage('announcements')">{{ pageTitle('announcements') }}</Button>
                <Separator class="my-2" />
                <p class="px-4 text-xs font-semibold text-muted-foreground">{{ groupLabel('dormitories') }}</p>
                <Button v-for="item in dormMenuItems" :key="item.page" variant="ghost" class="justify-start" @click="goToPage(item.page)">
                  {{ menuText(item) }}
                </Button>

                <Separator class="my-2" />
                <p class="px-4 text-xs font-semibold text-muted-foreground">{{ groupLabel('onlineServices') }}</p>
                <Button v-for="item in onlineServiceItems" :key="item.page" variant="ghost" class="justify-start whitespace-normal text-left" @click="goToPage(item.page)">
                  {{ menuText(item) }}
                </Button>

                <Separator class="my-2" />
                <p class="px-4 text-xs font-semibold text-muted-foreground">{{ groupLabel('dormInfo') }}</p>
                <Button v-for="item in dormInfoItems" :key="item.page" variant="ghost" class="justify-start whitespace-normal text-left" @click="goToPage(item.page)">
                  {{ menuText(item) }}
                </Button>

                <Button v-if="props.isLoggedIn && props.role === 'applicant'" variant="ghost" class="justify-start" @click="goToPage('reservation')">
                  {{ t.myReservation }}
                </Button>
                <Button v-if="props.isLoggedIn && props.role === 'admin'" variant="ghost" class="justify-start" @click="goToPage('staff')">
                  {{ t.staffWorkspace }}
                </Button>
              </div>
              <Separator class="my-6" />
              <div v-if="props.isLoggedIn && props.user" class="grid gap-3">
                <div class="rounded-lg border bg-card p-3">
                  <p class="text-sm font-semibold">{{ props.user.displayName }}</p>
                  <p class="text-xs text-muted-foreground">{{ props.user.identifier }}</p>
                </div>
                <Button variant="outline" class="justify-start border-primary/30 text-primary hover:bg-primary/10" @click="logout">
                  <LogOut class="size-4" />
                  {{ t.logout }}
                </Button>
              </div>
              <div v-else class="grid gap-2">
                <Button variant="outline" class="justify-start border-primary/30 text-primary hover:bg-primary/10" @click="openLoginModal('applicant')">
                  <User class="size-4" />
                  {{ t.login }}: {{ t.roleApplicant }}
                </Button>
                <Button class="justify-start" @click="openLoginModal('admin')">
                  <ShieldCheck class="size-4" />
                  {{ t.roleStaff }}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <main>
      <template v-if="currentPage === 'home'">
      <section class="relative overflow-hidden border-b bg-[#fbf6f2]">
        <div class="absolute inset-y-0 right-0 hidden w-[56%] lg:block">
          <img
            :src="woraInternationalImage"
            alt="Wora International dormitory"
            class="size-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-r from-[#fbf6f2] via-[#fbf6f2]/72 to-transparent" />
        </div>

        <div class="relative mx-auto max-w-screen-2xl px-4 py-8 sm:px-5 lg:min-h-[500px] lg:px-8 lg:py-10">
          <div class="max-w-[1120px]">
            <Badge variant="secondary" class="mb-4 w-fit text-primary">
              {{ t.heroBadge }}
            </Badge>
            <h1 class="max-w-[820px] text-[2rem] font-bold leading-tight tracking-normal text-foreground sm:text-[2.45rem] lg:text-[2.35rem] xl:text-[2.55rem] 2xl:text-[2.8rem]">
              {{ t.heroTitleLine1 }}
              <span class="block text-primary lg:whitespace-nowrap">{{ t.heroTitleLine2 }}</span>
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              {{ t.heroDescription }}
            </p>

            <div class="relative -mx-4 mt-6 h-48 overflow-hidden border-y sm:-mx-5 sm:h-64 lg:hidden">
              <img
                :src="woraInternationalImage"
                alt="Wora International dormitory"
                class="size-full object-cover"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
            </div>

            <Card class="mt-6 max-w-[1120px] gap-0 rounded-lg py-0 shadow-lg">
              <CardHeader class="px-6 pb-3 pt-5">
                <CardTitle class="flex items-center gap-2 text-base">
                  <span class="size-2 rounded-full bg-primary" />
                  {{ t.availabilityTitle }}
                </CardTitle>
              </CardHeader>
              <CardContent class="px-6 pb-6">
                <form class="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(9.5rem,1fr)_minmax(9.5rem,1fr)_minmax(10.5rem,1fr)_minmax(10.5rem,1fr)_minmax(10rem,10rem)] 2xl:grid-cols-[minmax(10.5rem,1fr)_minmax(10.5rem,1fr)_minmax(11.5rem,1fr)_minmax(11.5rem,1fr)_minmax(10.5rem,10.5rem)]" @submit.prevent="handleAvailabilityCheck">
                  <Field>
                    <FieldLabel for="move-in-date" class="text-xs">{{ t.moveInDate }}</FieldLabel>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          id="move-in-date"
                          type="button"
                          variant="outline"
                          class="h-10 w-full justify-start gap-2 bg-card px-3 text-left text-sm font-normal hover:bg-card"
                          :class="!moveInDate ? 'text-muted-foreground' : ''"
                        >
                          <Calendar class="size-4" />
                          <span class="truncate">{{ formatDateButton(moveInDate) }}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" class="z-50 w-auto p-0">
                        <DatePickerCalendar
                          v-model="moveInDateValue"
                          class="rounded-md border shadow-sm"
                          initial-focus
                          layout="month-and-year"
                          :min-value="minCalendarDate"
                          :max-value="maxCalendarDate"
                          @update:model-value="value => setAvailabilityDate('moveIn', value)"
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <FieldLabel for="move-out-date" class="text-xs">{{ t.moveOutDate }}</FieldLabel>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          id="move-out-date"
                          type="button"
                          variant="outline"
                          class="h-10 w-full justify-start gap-2 bg-card px-3 text-left text-sm font-normal hover:bg-card"
                          :class="!moveOutDate ? 'text-muted-foreground' : ''"
                        >
                          <Calendar class="size-4" />
                          <span class="truncate">{{ formatDateButton(moveOutDate) }}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" class="z-50 w-auto p-0">
                        <DatePickerCalendar
                          v-model="moveOutDateValue"
                          class="rounded-md border shadow-sm"
                          initial-focus
                          layout="month-and-year"
                          :min-value="minCalendarDate"
                          :max-value="maxCalendarDate"
                          @update:model-value="value => setAvailabilityDate('moveOut', value)"
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <FieldLabel class="text-xs">{{ t.roomType }}</FieldLabel>
                    <Select v-model="roomType">
                      <SelectTrigger class="h-10 w-full min-w-0">
                        <Bed class="size-4 text-muted-foreground" />
                        <span class="truncate">{{ availabilityRoomTypeLabel() }}</span>
                      </SelectTrigger>
                      <SelectContent position="popper" align="start" class="w-(--reka-select-trigger-width) min-w-(--reka-select-trigger-width)">
                        <SelectItem value="all">{{ t.allTypes }}</SelectItem>
                        <SelectItem value="air-conditioned">{{ t.airConditioned }}</SelectItem>
                        <SelectItem value="fan-room">{{ t.fanRoom }}</SelectItem>
                        <SelectItem value="premium-room">{{ t.premiumRoom }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel class="text-xs">{{ t.gender }}</FieldLabel>
                    <Select v-model="gender">
                      <SelectTrigger class="h-10 w-full min-w-0">
                        <Users class="size-4 text-muted-foreground" />
                        <span class="truncate">{{ availabilityGenderLabel() }}</span>
                      </SelectTrigger>
                      <SelectContent position="popper" align="end" class="w-(--reka-select-trigger-width) min-w-(--reka-select-trigger-width)">
                        <SelectItem value="all">{{ t.allStudents }}</SelectItem>
                        <SelectItem value="female-only">{{ t.femaleOnly }}</SelectItem>
                        <SelectItem value="male-only">{{ t.maleOnly }}</SelectItem>
                        <SelectItem value="international">{{ t.international }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <div class="flex min-w-0 items-end md:col-span-2 xl:col-span-1 xl:justify-end">
                    <Button type="submit" class="h-10 w-full min-w-0 overflow-hidden whitespace-nowrap px-2.5 text-[12px] font-semibold">
                      <Search class="size-4 shrink-0" />
                      <span class="truncate">{{ t.checkAvailability }}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card class="mt-4 max-w-[1120px] gap-0 rounded-lg py-0 shadow-sm">
              <CardContent class="grid gap-0 p-0 sm:grid-cols-2 xl:grid-cols-4">
                <div
                  v-for="item in featureCards"
                  :key="item.title"
                  class="flex min-w-0 items-center gap-2.5 border-b p-3 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
                >
                  <div class="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
                    <component :is="item.icon" class="size-[1.125rem]" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[13px] font-semibold leading-tight">{{ item.title }}</p>
                    <p class="mt-0.5 text-[11px] leading-tight text-muted-foreground">{{ item.description }}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-3 flex items-center justify-between gap-4">
          <h2 class="text-xl font-bold tracking-normal">{{ t.featuredDormitories }}</h2>
          <Button variant="ghost" class="hidden text-primary sm:inline-flex">
            {{ t.viewAllDormitories }}
            <ArrowRight class="size-4" />
          </Button>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="dorm in dormitories" :key="dorm.name" class="gap-0 overflow-hidden rounded-lg py-0 shadow-sm">
            <div class="h-40 overflow-hidden bg-muted sm:h-44 xl:h-[10.5rem]">
              <img :src="dorm.image" :alt="dormName(dorm)" class="size-full object-cover">
            </div>
            <CardContent class="grid min-h-[11rem] gap-3 p-4">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate text-base font-semibold">{{ dormName(dorm) }}</h3>
                    <p class="truncate text-xs text-muted-foreground">{{ dormSubtitle(dorm) }}</p>
                  </div>
                  <Badge variant="secondary" class="shrink-0 text-[11px] text-primary">{{ dormAvailability(dorm) }}</Badge>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  <span class="inline-flex items-center gap-1.5">
                    <Users class="size-4 text-primary" />
                    {{ dormApplicantType(dorm) }}
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <CreditCard class="size-4 text-primary" />
                    {{ dormPaymentTiming(dorm) }}
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <FileText class="size-4 text-primary" />
                    {{ dormSlipRequirement(dorm) }}
                  </span>
                </div>
              </div>
              <Button variant="outline" class="mt-auto h-10 w-full border-primary/30 text-sm font-semibold text-primary hover:bg-primary/10" @click="openDormDetails(dorm)">
                {{ t.viewDetails }}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section class="mx-auto max-w-screen-2xl px-4 pb-8 sm:px-5 lg:px-8">
        <h2 class="mb-3 text-xl font-bold tracking-normal">{{ t.reservationDetailsTitle }}</h2>
        <Card class="gap-0 rounded-lg py-0 shadow-sm">
          <CardContent class="grid gap-0 p-0 md:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="detail in localizedReservationDetails"
              :key="detail.title"
              class="flex gap-3 border-b p-4 last:border-b-0 md:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
            >
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
                <component :is="detail.icon" class="size-5" />
              </div>
              <div class="min-w-0">
                <p class="text-[13px] font-semibold">{{ detail.title }}</p>
                <p class="mt-1 text-[13px] font-semibold text-primary">{{ detail.value }}</p>
                <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ detail.description }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      </template>

      <section v-else-if="currentDormPage" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" class="mb-2 text-primary">{{ groupLabel('dormitories') }}</Badge>
            <h1 class="text-2xl font-bold tracking-normal sm:text-3xl">{{ dormName(currentDormPage) }}</h1>
            <p class="mt-1 text-sm text-muted-foreground">{{ dormSubtitle(currentDormPage) }}</p>
          </div>
          <Button class="h-11 px-5 text-sm font-semibold" @click="openApplicantWorkflow(currentDormPage, { fresh: true })">
            <ClipboardList class="size-4" />
            {{ locale === 'th' ? 'เริ่มจองหอนี้' : 'Start reservation' }}
          </Button>
        </div>

        <div class="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.92fr)]">
          <Card class="h-full gap-0 overflow-hidden rounded-lg py-0 shadow-sm">
            <div class="relative h-72 overflow-hidden bg-muted sm:h-80">
              <img :src="currentDormPage.image" :alt="dormName(currentDormPage)" class="size-full object-cover">
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-5 text-white">
                <Badge class="mb-3 bg-white/95 text-primary hover:bg-white">{{ dormAvailability(currentDormPage) }}</Badge>
                <p class="text-xl font-bold">{{ dormName(currentDormPage) }}</p>
                <p class="text-sm text-white/80">{{ dormSubtitle(currentDormPage) }}</p>
              </div>
            </div>
            <CardContent class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div class="rounded-lg border bg-background p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ห้องว่าง' : 'Available' }}</p>
                <p class="mt-1 text-2xl font-bold">{{ currentDormRoomsSummary.available }}</p>
              </div>
              <div class="rounded-lg border bg-background p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'จำนวนชั้น' : 'Floors' }}</p>
                <p class="mt-1 text-2xl font-bold">{{ currentDormRoomsSummary.floors }}</p>
              </div>
              <div class="rounded-lg border bg-background p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ความจุรวม' : 'Capacity' }}</p>
                <p class="mt-1 text-2xl font-bold">{{ currentDormRoomsSummary.capacity }}</p>
              </div>
              <div class="rounded-lg border bg-background p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ประเภทผู้พัก' : 'Residents' }}</p>
                <p class="mt-1 text-sm font-semibold leading-5">{{ dormGender(currentDormPage) }}</p>
              </div>
            </CardContent>
          </Card>

          <Card class="h-full gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-5 pb-2 pt-5">
              <CardTitle>{{ locale === 'th' ? 'รายละเอียดหอพัก' : 'Dormitory details' }}</CardTitle>
            </CardHeader>
            <CardContent class="grid gap-3 px-5 pb-5">
              <p v-if="currentDormDetail" class="text-sm leading-6 text-muted-foreground">
                {{ dormDetailSummary(currentDormDetail) }}
              </p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div v-for="item in currentDormHighlights" :key="item" class="flex items-start gap-2 rounded-lg border p-3 text-sm">
                  <Check class="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{{ item }}</span>
                </div>
                <div class="flex items-start gap-2 rounded-lg border p-3 text-sm">
                  <Users class="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{{ dormGender(currentDormPage) }}</span>
                </div>
                <div class="flex items-start gap-2 rounded-lg border p-3 text-sm">
                  <Snowflake class="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{{ dormRoomType(currentDormPage) }}</span>
                </div>
              </div>
              <div class="rounded-lg border p-4">
                <p class="text-sm font-semibold">{{ locale === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Facilities' }}</p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ locale === 'th' ? 'WiFi, ระบบรักษาความปลอดภัย, พื้นที่อ่านหนังสือ, เครื่องซักผ้า และสำนักงานบริการประจำหอ' : 'WiFi, security system, study areas, laundry service, and dormitory service office.' }}
                </p>
              </div>
              <div class="rounded-lg border p-4">
                <p class="text-sm font-semibold">{{ locale === 'th' ? 'รอบการจอง' : 'Reservation round' }}</p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ locale === 'th' ? 'เปิดรับจองประจำปีตามประกาศของกองบริการหอพักนักศึกษา' : 'Annual reservations open according to the Dormitory Service Division announcement.' }}
                </p>
              </div>
              <Button class="h-11 w-full text-sm font-semibold" @click="openApplicantWorkflow(currentDormPage, { fresh: true })">
                <ClipboardList class="size-4" />
                {{ locale === 'th' ? 'เริ่มจองหอนี้' : 'Start reservation' }}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.92fr)]">
          <Card v-if="currentDormDetail" class="h-full gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-5 pb-2 pt-5">
              <CardTitle>{{ locale === 'th' ? 'รูปภาพหอพักและพื้นที่ใช้งาน' : 'Dormitory photos and facilities' }}</CardTitle>
            </CardHeader>
            <CardContent class="grid gap-3 px-5 pb-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              <div
                v-for="(image, index) in currentDormDetail.gallery"
                :key="`${currentDormPage.name}-${index}`"
                class="aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
              >
                <img :src="image" :alt="`${currentDormPage.name} ${index + 1}`" class="size-full object-cover">
              </div>
            </CardContent>
          </Card>

          <Card class="h-full gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-5 pb-2 pt-5">
              <CardTitle>{{ locale === 'th' ? 'ข้อมูลจากรอบจอง' : 'Reservation round' }}</CardTitle>
            </CardHeader>
            <CardContent class="grid gap-3 px-5 pb-5 text-sm">
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ช่วงรับสมัคร' : 'Application period' }}</p>
                <p class="mt-1 font-semibold">{{ currentDormCampaign?.openDate || '2026-06-01' }} - {{ currentDormCampaign?.closeDate || '2026-07-31' }}</p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ยอดชำระเริ่มต้น' : 'Initial payment' }}</p>
                <p class="mt-1 font-semibold text-primary">{{ money(currentDormCampaign?.requiredAmount || 3000) }} THB</p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ติดต่อ' : 'Contact' }}</p>
                <p class="mt-1 font-semibold">{{ currentDormFeeGroup?.contact.join(', ') || '043-009-700' }}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card class="mt-5 gap-0 rounded-lg py-0 shadow-sm">
          <CardHeader class="px-5 pb-2 pt-5">
            <CardTitle>{{ locale === 'th' ? 'อัตราค่าธรรมเนียม' : 'Dormitory fees' }}</CardTitle>
          </CardHeader>
          <CardContent class="px-0 pb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ locale === 'th' ? 'ประเภทห้อง' : 'Room type' }}</TableHead>
                  <TableHead>{{ locale === 'th' ? 'อัตราหลัก' : 'Primary rate' }}</TableHead>
                  <TableHead>{{ locale === 'th' ? 'อัตราแบ่งชำระ/ภาคพิเศษ' : 'Split or special rate' }}</TableHead>
                  <TableHead>{{ locale === 'th' ? 'ค่าน้ำ' : 'Water' }}</TableHead>
                  <TableHead>{{ locale === 'th' ? 'ค่าไฟ' : 'Electricity' }}</TableHead>
                  <TableHead>{{ locale === 'th' ? 'ประกัน' : 'Deposit' }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row in currentDormFeeRows" :key="row.room_type">
                  <TableCell class="font-medium">{{ row.room_type }}</TableCell>
                  <TableCell>{{ feePrimaryValue(row) }}</TableCell>
                  <TableCell>{{ feeSecondaryValue(row) }}</TableCell>
                  <TableCell>{{ row.water_fee }}</TableCell>
                  <TableCell>{{ row.electricity_fee }}</TableCell>
                  <TableCell>{{ row.damage_deposit }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card v-if="currentDormDetail" class="mt-5 gap-0 rounded-lg py-0 shadow-sm">
          <CardHeader class="px-5 pb-2 pt-5">
            <CardTitle>{{ locale === 'th' ? 'เอกสารประกอบ' : 'Related documents' }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-3 px-5 pb-5 md:grid-cols-3">
            <a
              v-for="document in currentDormDetail.documents"
              :key="document.href"
              :href="document.href"
              target="_blank"
              rel="noreferrer"
              class="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <FileText class="size-4 shrink-0 text-primary" />
              <span>{{ dormDocumentTitle(document) }}</span>
            </a>
          </CardContent>
        </Card>
      </section>

      <section v-else-if="currentPage === 'organization'" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5">
          <Badge variant="secondary" class="mb-2 text-primary">{{ locale === 'th' ? 'โครงสร้างขึ้นก่อน ตามด้วยรายชื่อบุคลากร' : 'Structure first, followed by personnel directory' }}</Badge>
          <h1 class="text-2xl font-bold tracking-normal">{{ locale === 'th' ? 'โครงสร้างบุคลากรกองบริการหอพักนักศึกษา' : 'Student Dormitory Service Personnel Structure' }}</h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ locale === 'th' ? 'ข้อมูลบุคลากรจากชุดไฟล์ `dorm_kku_ui_assets` นำมาจัดวางใหม่ให้เข้ากับ UI ปัจจุบัน' : 'Personnel assets from `dorm_kku_ui_assets` are arranged into the current interface.' }}</p>
        </div>

        <Card class="mx-auto mb-5 max-w-6xl gap-0 overflow-hidden rounded-lg py-0 shadow-sm">
          <CardContent class="space-y-4 p-4 sm:p-5">
            <div class="mx-auto grid w-full max-w-4xl gap-4">
              <img :src="structureChartImage" alt="โครงสร้างกองบริการหอพักนักศึกษา" class="max-h-[430px] w-full rounded-lg border bg-muted object-contain">
              <div class="overflow-hidden rounded-lg border bg-card">
                <img :src="personnelImage('00-personnel-banner.png')" alt="บุคลากรกองบริการหอพักนักศึกษา" class="aspect-[1200/472] w-full object-contain">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg border p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'กลุ่มงาน' : 'Groups' }}</p>
                  <p class="mt-1 text-xl font-bold">{{ personnelGroups.length }}</p>
                </div>
                <div class="rounded-lg border p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'บุคลากร' : 'Personnel' }}</p>
                  <p class="mt-1 text-xl font-bold">{{ personnelGroups.reduce((sum, group) => sum + group.people.length, 0) }}</p>
                </div>
              </div>
              <p class="rounded-lg border p-3 text-xs leading-5 text-muted-foreground">
                {{ locale === 'th' ? 'จัดเรียงจากโครงสร้างหน่วยงานก่อน แล้วตามด้วยรายชื่อบุคลากรครบทุกหมวดจากไฟล์ข้อมูลที่แนบมา' : 'The structure chart is shown first, followed by every personnel profile from the provided asset data.' }}
              </p>
            </div>
          </CardContent>
        </Card>

        <div class="grid gap-4">
          <Card v-for="group in personnelGroups" :key="group.title" class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <div class="flex items-center justify-between gap-3">
                <CardTitle class="text-base">{{ group.title }}</CardTitle>
                <Badge variant="secondary" class="text-primary">{{ group.people.length }} {{ locale === 'th' ? 'คน' : 'people' }}</Badge>
              </div>
            </CardHeader>
            <CardContent class="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
              <div v-for="person in group.people" :key="`${group.title}-${person.email}-${person.image}`" class="rounded-lg border bg-card p-2.5 shadow-sm">
                <div class="aspect-[3/4] overflow-hidden rounded-md bg-muted">
                  <img :src="personnelImage(person.image)" :alt="person.name" class="size-full object-cover">
                </div>
                <p class="mt-2 text-sm font-semibold">{{ person.name }}</p>
                <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ person.role }}</p>
                <p class="mt-1 text-[11px] text-primary">{{ person.email }}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section v-else-if="currentPage === 'announcements'" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" class="mb-2 text-primary">{{ locale === 'th' ? 'ประกาศ/ข่าวสารสำคัญ' : 'Announcements and important news' }}</Badge>
            <h1 class="text-2xl font-bold tracking-normal">{{ locale === 'th' ? 'ประกาศข่าวสำคัญ' : 'Important Announcements' }}</h1>
          </div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <Card v-for="item in announcementItems" :key="item.title" class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="p-4">
              <Badge v-if="item.highlight" variant="secondary" class="mb-3 text-primary">{{ locale === 'th' ? 'ข่าวสำคัญ' : 'Important' }}</Badge>
              <h2 class="text-base font-semibold leading-6 text-primary">{{ item.title }}</h2>
              <p class="mt-2 text-sm text-muted-foreground">{{ item.date }}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section v-else-if="currentPage === 'documents'" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5">
          <Badge variant="secondary" class="mb-2 text-primary">{{ pageTitle('documents') }}</Badge>
          <h1 class="text-2xl font-bold tracking-normal">{{ locale === 'th' ? 'แบบฟอร์มและเอกสารหอพัก' : 'Dormitory forms and documents' }}</h1>
        </div>
        <Card class="gap-0 rounded-lg py-0 shadow-sm">
          <CardContent class="p-5">
            <div class="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <a
                v-for="document in officialDocumentLinks"
                :key="document.href"
                :href="document.href"
                target="_blank"
                rel="noreferrer"
                class="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <FileText class="size-4 shrink-0 text-primary" />
                <span>{{ officialDocumentTitle(document) }}</span>
              </a>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <Button v-for="item in documentItems" :key="item" variant="outline" class="h-auto justify-start whitespace-normal py-3 text-left">
                <Download class="size-4 text-primary" />
                {{ item }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section v-else-if="currentPage === 'contact' || currentPage === 'serviceUnits'" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5">
          <Badge variant="secondary" class="mb-2 text-primary">{{ pageTitle(currentPage) }}</Badge>
          <h1 class="text-2xl font-bold tracking-normal">{{ locale === 'th' ? 'ติดต่อกองบริการหอพักนักศึกษา' : 'Contact Student Dormitory Service Division' }}</h1>
          <p class="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            {{ locale === 'th' ? '123 หมู่ 16 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมือง จังหวัดขอนแก่น 40002 โทร. 043-202841 เวลาทำการ 08.30 - 16.30 น.' : '123 Moo 16 Mittraphap Road, Nai Mueang, Mueang, Khon Kaen 40002. Tel. 043-202841. Office hours 08:30 - 16:30.' }}
          </p>
        </div>

        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="px-0 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{{ locale === 'th' ? 'หน่วยหอพัก' : 'Service unit' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'รายละเอียด' : 'Details' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'หมายเลข' : 'Extension' }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in contactRows" :key="row.unit">
                    <TableCell class="font-medium">{{ row.unit }}</TableCell>
                    <TableCell>{{ row.detail }}</TableCell>
                    <TableCell>{{ row.phone }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div class="grid gap-3">
            <Card v-for="item in serviceCards" :key="item.title" class="gap-0 rounded-lg py-0 shadow-sm">
              <CardContent class="p-4">
                <p class="font-semibold">{{ item.title }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ item.subtitle }}</p>
                <p class="mt-3 text-sm font-semibold text-primary">{{ item.phone }}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section v-else-if="isOnlineServicePage" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5">
          <Badge variant="secondary" class="mb-2 text-primary">{{ groupLabel('onlineServices') }}</Badge>
          <h1 class="text-2xl font-bold tracking-normal">{{ pageTitle(currentPage) }}</h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ locale === 'th' ? 'หน้านี้เป็น template สำหรับเชื่อมต่อ workflow จริงในขั้นถัดไป' : 'This template is ready to connect to the real workflow in a later step.' }}</p>
        </div>
        <Card class="gap-0 rounded-lg py-0 shadow-sm">
          <CardContent class="grid gap-4 p-5 md:grid-cols-2">
            <Field>
              <FieldLabel>{{ locale === 'th' ? 'รหัสนักศึกษา / รหัสผู้ใช้งาน' : 'Student ID / user ID' }}</FieldLabel>
              <Input :placeholder="locale === 'th' ? 'กรอกรหัสผู้ใช้งาน' : 'Enter user ID'" />
            </Field>
            <Field>
              <FieldLabel>{{ locale === 'th' ? 'เบอร์ติดต่อ' : 'Phone number' }}</FieldLabel>
              <Input placeholder="08X-XXX-XXXX" />
            </Field>
            <Field class="md:col-span-2">
              <FieldLabel>{{ locale === 'th' ? 'รายละเอียดคำขอ' : 'Request details' }}</FieldLabel>
              <Textarea :placeholder="locale === 'th' ? 'ระบุรายละเอียดสำหรับเจ้าหน้าที่' : 'Enter details for dormitory staff'" />
            </Field>
            <Button class="md:w-fit">
              <FileText class="size-4" />
              {{ locale === 'th' ? 'ส่งคำขอ' : 'Submit request' }}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section v-else-if="isDormInfoPage" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5">
          <Badge variant="secondary" class="mb-2 text-primary">{{ groupLabel('dormInfo') }}</Badge>
          <h1 class="text-2xl font-bold tracking-normal">{{ pageTitle(currentPage) }}</h1>
        </div>
        <Card class="gap-0 rounded-lg py-0 shadow-sm">
          <CardContent class="grid gap-4 p-5 md:grid-cols-3">
            <div v-if="currentPage === 'fees'" class="md:col-span-3">
              <div class="grid gap-4 lg:grid-cols-3">
                <Card v-for="group in kkuDormFeeData.groups" :key="group.id" class="gap-0 rounded-lg py-0 shadow-sm">
                  <CardHeader class="px-4 pb-2 pt-4">
                    <CardTitle class="text-base">{{ group.name }}</CardTitle>
                  </CardHeader>
                  <CardContent class="grid gap-3 px-4 pb-4">
                    <div v-for="room in group.rooms" :key="`${group.id}-${room.room_type}`" class="rounded-lg border p-3 text-sm">
                      <p class="font-semibold">{{ room.room_type }}</p>
                      <p class="mt-1 text-primary">{{ feePrimaryValue(room) }}</p>
                      <p class="mt-1 text-xs text-muted-foreground">{{ room.billing_basis }}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div v-if="currentPage === 'rules' || currentPage === 'dormMap'" class="grid gap-3 md:col-span-3 md:grid-cols-2">
              <a
                v-for="document in officialDocumentLinks.filter(item => currentPage === 'rules' ? item.href.includes('rules') || item.href.includes('agreement') : item.href.includes('map'))"
                :key="document.href"
                :href="document.href"
                target="_blank"
                rel="noreferrer"
                class="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <FileText class="size-4 shrink-0 text-primary" />
                <span>{{ officialDocumentTitle(document) }}</span>
              </a>
            </div>

            <div v-if="!['fees', 'rules', 'dormMap'].includes(currentPage)" class="rounded-lg border p-4">
              <p class="font-semibold">{{ locale === 'th' ? 'ข้อมูลอยู่ระหว่างจัดเตรียม' : 'Content in preparation' }}</p>
              <p class="mt-2 text-sm text-muted-foreground">{{ locale === 'th' ? 'พื้นที่นี้เว้นไว้สำหรับนำข้อมูลจริงมาเติมตามเมนูที่เลือก' : 'This area is reserved for the real content of the selected menu.' }}</p>
            </div>
            <div v-if="!['fees', 'rules', 'dormMap'].includes(currentPage)" class="rounded-lg border p-4">
              <p class="font-semibold">{{ locale === 'th' ? 'รองรับไฟล์และประกาศ' : 'Supports files and announcements' }}</p>
              <p class="mt-2 text-sm text-muted-foreground">{{ locale === 'th' ? 'สามารถเชื่อมต่อ PDF, ตารางค่าธรรมเนียม หรือแผนผังหอพักได้ในขั้นถัดไป' : 'PDF files, fee tables, and dormitory maps can be connected here.' }}</p>
            </div>
            <div v-if="!['fees', 'rules', 'dormMap'].includes(currentPage)" class="rounded-lg border p-4">
              <p class="font-semibold">{{ locale === 'th' ? 'ออกแบบด้วย shadcn-vue' : 'Designed with shadcn-vue' }}</p>
              <p class="mt-2 text-sm text-muted-foreground">{{ locale === 'th' ? 'ใช้ Card, Button, Table และ Form components เป็นหลัก' : 'Built primarily with Card, Button, Table, and Form components.' }}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section v-else-if="currentPage === 'receipts'" class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-5 lg:px-8">
        <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" class="mb-2 text-primary">{{ t.applicantWorkspace }}</Badge>
            <h1 class="text-2xl font-bold tracking-normal">{{ pageTitle('receipts') }}</h1>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ locale === 'th' ? 'ตรวจสอบรายการชำระเงินและเอกสารย้อนหลังจาก workflow การจอง' : 'Review payment records and receipts from the reservation workflow.' }}
            </p>
          </div>
          <Button variant="outline" class="border-primary/30 text-primary hover:bg-primary/10" @click="goToPage('reservation')">
            <ClipboardList class="size-4" />
            {{ t.myReservation }}
          </Button>
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-5 pb-2 pt-5">
              <CardTitle class="text-base">{{ locale === 'th' ? 'รายการใบเสร็จ' : 'Receipt records' }}</CardTitle>
            </CardHeader>
            <CardContent class="px-0 pb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{{ locale === 'th' ? 'เลขที่ใบสมัคร' : 'Application' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'หอพัก' : 'Dormitory' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'วันที่ชำระ' : 'Payment date' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'ยอดชำระ' : 'Amount' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'สถานะ' : 'Status' }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="props.activeApp && props.activeApp.amountPaid > 0">
                    <TableCell class="font-medium">{{ props.activeApp.id }}</TableCell>
                    <TableCell>{{ props.activeApp.dormName }}</TableCell>
                    <TableCell>{{ props.activeApp.paymentDate || '-' }}</TableCell>
                    <TableCell>{{ money(props.activeApp.amountPaid) }} THB</TableCell>
                    <TableCell>
                      <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1" :class="statusClass(props.activeApp.status)">
                        {{ statusLabel(props.activeApp.status) }}
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow v-else>
                    <TableCell colspan="5" class="py-8 text-center text-sm text-muted-foreground">
                      {{ locale === 'th' ? 'ยังไม่มีรายการชำระเงินในบัญชีนี้' : 'No payment records are available for this account.' }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-5 pb-2 pt-5">
              <CardTitle class="text-base">{{ locale === 'th' ? 'สรุปการชำระเงินล่าสุด' : 'Latest payment summary' }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 px-5 pb-5 text-sm">
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ผู้ชำระ' : 'Payer' }}</p>
                <p class="mt-1 font-semibold">{{ props.user?.displayName || '-' }}</p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'วิธีชำระเงิน' : 'Method' }}</p>
                <p class="mt-1 font-semibold">{{ props.activeApp?.paymentMethod || (locale === 'th' ? 'รอดำเนินการ' : 'Pending') }}</p>
              </div>
              <Button class="w-full" :disabled="!props.activeApp || props.activeApp.amountPaid <= 0" @click="emit('printTicket')">
                <Download class="size-4" />
                {{ locale === 'th' ? 'ดาวน์โหลดใบเสร็จ' : 'Download receipt' }}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        v-if="props.isLoggedIn && props.role === 'applicant' && activePortal === 'applicant' && currentPage === 'reservation'"
        id="applicant-workflow"
        class="mx-auto max-w-screen-2xl scroll-mt-20 px-4 pb-8 sm:px-5 lg:px-8"
      >
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" class="mb-2 w-fit text-primary">{{ t.applicantWorkspace }}</Badge>
            <h2 class="text-2xl font-bold tracking-normal">{{ locale === 'th' ? 'ขั้นตอนการจองหอพักประจำปี' : 'Annual dormitory reservation workflow' }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{{ applicantStatusCopy }}</p>
          </div>
          <Button v-if="props.activeApp && !bookingDraftMode" variant="outline" class="border-primary/30 text-primary hover:bg-primary/10" @click="advanceApplicantProgress">
            <ClipboardList class="size-4" />
            {{ t.refreshStatus }}
          </Button>
        </div>

        <div class="grid gap-3 md:grid-cols-4">
          <Card v-for="(step, index) in applicantSteps" :key="step.label" class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="flex items-center gap-3 p-4">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1"
                :class="step.done || step.active ? 'bg-primary text-primary-foreground ring-primary/20' : 'bg-background text-muted-foreground ring-border'"
              >
                <Check v-if="step.done" class="size-4" />
                <span v-else>{{ index + 1 }}</span>
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ step.label }}</p>
                <p class="truncate text-xs text-muted-foreground">
                  {{ step.active ? (locale === 'th' ? 'ขั้นตอนปัจจุบัน' : 'Current step') : step.done ? (locale === 'th' ? 'เสร็จสิ้น' : 'Completed') : (locale === 'th' ? 'รอดำเนินการ' : 'Pending') }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-if="!props.activeApp || bookingDraftMode" class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.45fr)]">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle class="text-lg">{{ locale === 'th' ? 'เลือกห้องจากผังชั้น' : 'Select a room from the floor plan' }}</CardTitle>
                  <p class="mt-1 text-sm text-muted-foreground">
                    {{ locale === 'th' ? 'สถานะแรกใช้ข้อมูลจากบัญชี KKU และให้ผู้สมัครเลือกห้องที่ต้องการก่อนเข้าสู่ขั้นชำระเงิน' : 'The first step uses KKU account data and lets the applicant choose a room before payment.' }}
                  </p>
                </div>
                <Badge variant="secondary" class="w-fit text-primary">
                  {{ visibleFloorAvailability.available }}/{{ visibleFloorAvailability.capacity }} {{ locale === 'th' ? 'ที่ว่าง' : 'slots available' }}
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="space-y-4 px-4 pb-4">
              <div class="grid gap-3 md:grid-cols-4">
                <Field class="md:col-span-2">
                  <FieldLabel class="text-xs">{{ locale === 'th' ? 'หอพัก' : 'Dormitory' }}</FieldLabel>
                  <Select :model-value="selectedDormId" @update:model-value="value => setSelectedDormById(String(value))">
                    <SelectTrigger class="h-11 w-full min-w-0 bg-background">
                      <Building class="size-4 text-muted-foreground" />
                      <span class="truncate">{{ selectedDormLabel() }}</span>
                    </SelectTrigger>
                    <SelectContent position="popper" align="start" class="z-50 w-[var(--reka-select-trigger-width)] min-w-[18rem]">
                      <SelectItem v-for="dorm in dormitories" :key="getDormId(dorm)" :value="getDormId(dorm)">
                        {{ dormName(dorm) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel class="text-xs">{{ locale === 'th' ? 'ชั้น' : 'Floor' }}</FieldLabel>
                  <Select v-model="selectedFloor">
                    <SelectTrigger class="h-11 w-full bg-background">
                      <Home class="size-4 text-muted-foreground" />
                      <span class="truncate">{{ floorLabel() }}</span>
                    </SelectTrigger>
                    <SelectContent position="popper" align="start" class="z-50 w-[var(--reka-select-trigger-width)]">
                      <SelectItem v-for="floor in availableFloors" :key="floor" :value="floor">
                        {{ locale === 'th' ? `ชั้น ${floor}` : `Floor ${floor}` }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel class="text-xs">{{ t.roomType }}</FieldLabel>
                  <Select v-model="applicantForm.roomType">
                    <SelectTrigger class="h-11 w-full min-w-0 overflow-hidden bg-background">
                      <Bed class="size-4 text-muted-foreground" />
                      <span class="truncate">{{ applicantRoomTypeLabel() }}</span>
                    </SelectTrigger>
                    <SelectContent position="popper" align="start" class="z-50 w-[var(--reka-select-trigger-width)] min-w-80 max-w-[calc(100vw-2rem)]">
                      <SelectItem v-for="type in selectedRoomTypes" :key="type.name" :value="type.name" class="whitespace-normal py-2">
                        {{ localizedRoomTypeName(type.name) }} - {{ money(type.price) }} THB
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div class="rounded-lg border bg-background p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ห้องในชั้นนี้' : 'Rooms on floor' }}</p>
                  <p class="mt-1 text-2xl font-bold">{{ visibleFloorRooms.length }}</p>
                </div>
                <div class="rounded-lg border bg-background p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ยังว่าง' : 'Available' }}</p>
                  <p class="mt-1 text-2xl font-bold">{{ visibleFloorAvailability.available }}</p>
                </div>
                <div class="rounded-lg border bg-background p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ยอดชำระเริ่มต้น' : 'Initial payment' }}</p>
                  <p class="mt-1 text-2xl font-bold">{{ money(selectedPaymentAmount) }}</p>
                </div>
                <div class="rounded-lg border bg-background p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ห้องที่เลือก' : 'Selected room' }}</p>
                  <p class="mt-1 text-2xl font-bold">{{ selectedApplicantRoom?.number || '-' }}</p>
                </div>
              </div>

              <div v-if="visibleFloorRooms.length" class="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div class="inline-flex items-center gap-2 text-sm font-semibold">
                    <LayoutGrid class="size-4 text-primary" />
                    {{ locale === 'th' ? 'ผังห้องในชั้นที่เลือก' : 'Selected floor plan' }}
                  </div>
                  <div class="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    <span class="inline-flex items-center gap-1 rounded-full border bg-emerald-50 px-2 py-1 text-emerald-700">
                      <span class="size-2 rounded-full bg-emerald-500" />
                      {{ locale === 'th' ? 'ว่าง' : 'Available' }}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full border bg-primary/10 px-2 py-1 text-primary">
                      <span class="size-2 rounded-full bg-primary" />
                      {{ locale === 'th' ? 'เลือกแล้ว' : 'Selected' }}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-1">
                      <span class="size-2 rounded-full bg-muted-foreground/50" />
                      {{ locale === 'th' ? 'เต็ม' : 'Full' }}
                    </span>
                  </div>
                </div>

                <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)]">
                  <div class="grid content-start gap-2">
                    <button
                      v-for="room in floorPlanLeftRooms"
                      :key="`${selectedDormId}-${selectedFloor}-left-${room.number}`"
                      type="button"
                      :disabled="roomAvailability(room) <= 0"
                      class="min-h-24 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      :class="roomPlanClass(room)"
                      @click="chooseApplicantRoom(room)"
                    >
                      <span class="flex items-start justify-between gap-2">
                        <span>
                          <span class="flex items-center gap-1.5 text-base font-bold">
                            <Users class="size-4 text-primary" />
                            {{ locale === 'th' ? `ห้อง ${room.number}` : `Room ${room.number}` }}
                          </span>
                          <span class="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{{ localizedRoomTypeName(room.type) }}</span>
                        </span>
                        <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1" :class="roomPlanPillClass(room)">
                          {{ roomAvailability(room) }}/{{ room.capacity }}
                        </span>
                      </span>
                      <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div class="h-full rounded-full" :class="roomPlanBarClass(room)" :style="{ width: `${roomProgress(room)}%` }" />
                      </div>
                      <span class="mt-2 inline-flex text-xs font-medium text-muted-foreground">{{ roomPlanStatusLabel(room) }}</span>
                    </button>
                    <div class="flex min-h-20 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800">
                      {{ locale === 'th' ? 'ระเบียง' : 'Balcony' }}
                    </div>
                  </div>

                  <div class="flex min-h-[28rem] flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-2 py-4 text-slate-700 shadow-inner">
                    <DoorOpen class="size-5 text-slate-500" />
                    <div class="flex flex-1 flex-col items-center justify-center gap-2">
                      <Route class="size-3.5 text-slate-500" />
                      <span class="whitespace-nowrap text-[11px] font-semibold leading-none tracking-normal">
                        {{ locale === 'th' ? 'ทางเดิน' : 'Corridor' }}
                      </span>
                    </div>
                    <Badge variant="outline" class="bg-white text-[10px] text-slate-700">{{ floorLabel() }}</Badge>
                  </div>

                  <div class="grid content-start gap-2">
                    <button
                      v-for="room in floorPlanRightRooms"
                      :key="`${selectedDormId}-${selectedFloor}-right-${room.number}`"
                      type="button"
                      :disabled="roomAvailability(room) <= 0"
                      class="min-h-24 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      :class="roomPlanClass(room)"
                      @click="chooseApplicantRoom(room)"
                    >
                      <span class="flex items-start justify-between gap-2">
                        <span>
                          <span class="flex items-center gap-1.5 text-base font-bold">
                            <Users class="size-4 text-primary" />
                            {{ locale === 'th' ? `ห้อง ${room.number}` : `Room ${room.number}` }}
                          </span>
                          <span class="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{{ localizedRoomTypeName(room.type) }}</span>
                        </span>
                        <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1" :class="roomPlanPillClass(room)">
                          {{ roomAvailability(room) }}/{{ room.capacity }}
                        </span>
                      </span>
                      <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div class="h-full rounded-full" :class="roomPlanBarClass(room)" :style="{ width: `${roomProgress(room)}%` }" />
                      </div>
                      <span class="mt-2 inline-flex text-xs font-medium text-muted-foreground">{{ roomPlanStatusLabel(room) }}</span>
                    </button>
                    <div class="grid gap-2 sm:grid-cols-2">
                      <div class="flex min-h-20 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-800">
                        <Bath class="size-4" />
                        {{ locale === 'th' ? 'ห้องน้ำ' : 'Bathroom' }}
                      </div>
                      <div class="flex min-h-20 items-center justify-center gap-2 rounded-lg border border-dashed bg-background px-3 text-center text-sm font-semibold">
                        <Armchair class="size-4 text-primary" />
                        {{ locale === 'th' ? 'ห้องส่วนรวม' : 'Common room' }}
                      </div>
                    </div>
                    <div class="flex min-h-16 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800">
                      {{ locale === 'th' ? 'ระเบียง / จุดพักคอย' : 'Balcony / waiting area' }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                {{ locale === 'th' ? 'ไม่พบห้องในเงื่อนไขนี้ ลองเปลี่ยนประเภทห้องหรือชั้น' : 'No rooms match this filter. Try another type or floor.' }}
              </div>
            </CardContent>
          </Card>

          <Card class="gap-0 overflow-hidden rounded-lg py-0 shadow-sm">
            <div class="relative h-44 bg-muted">
              <img :src="(selectedDorm || dormitories[0]).image" :alt="dormName(selectedDorm || dormitories[0])" class="size-full object-cover">
              <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <div class="absolute inset-x-0 bottom-0 p-4 text-white">
                <p class="text-sm font-medium text-white/80">{{ locale === 'th' ? 'รายละเอียดห้องที่เลือก' : 'Selected room details' }}</p>
                <p class="truncate text-xl font-bold">{{ selectedApplicantRoom ? (locale === 'th' ? `ห้อง ${selectedApplicantRoom.number}` : `Room ${selectedApplicantRoom.number}`) : dormName(selectedDorm || dormitories[0]) }}</p>
              </div>
            </div>
            <CardContent class="space-y-4 px-4 pb-4 pt-4">
              <div v-if="selectedApplicantRoom" class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-lg border p-3">
                    <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ที่ว่างในห้อง' : 'Available slots' }}</p>
                    <p class="mt-1 text-2xl font-bold">{{ roomAvailability(selectedApplicantRoom) }}/{{ selectedApplicantRoom.capacity }}</p>
                  </div>
                  <div class="rounded-lg border p-3">
                    <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ยอดชำระเริ่มต้น' : 'Initial payment' }}</p>
                    <p class="mt-1 text-2xl font-bold">{{ money(selectedPaymentAmount) }}</p>
                  </div>
                </div>

                <div class="rounded-lg border p-3 text-sm">
                  <p class="font-semibold">{{ localizedRoomTypeName(selectedApplicantRoom.type) }}</p>
                  <p class="mt-1 text-muted-foreground">
                    {{ locale === 'th' ? 'ระบบจะใช้ข้อมูลบัญชี KKU เพื่อสร้างใบจอง และนำคุณไปขั้นตรวจสอบข้อมูล/ชำระเงิน' : 'The system will use KKU account data to create the reservation and continue to payment review.' }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div v-for="(image, index) in selectedRoomGallery" :key="`selected-room-${index}`" class="aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                    <img :src="image" :alt="`${selectedDormLabel()} ${index + 1}`" class="size-full object-cover">
                  </div>
                </div>

                <Button class="h-11 w-full text-sm font-semibold" @click="submitApplicantApplication">
                  <ClipboardList class="size-4" />
                  {{ locale === 'th' ? `จองห้อง ${selectedApplicantRoom.number}` : `Reserve room ${selectedApplicantRoom.number}` }}
                </Button>
              </div>

              <div v-else class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p class="font-semibold text-foreground">{{ locale === 'th' ? 'ยังไม่ได้เลือกห้อง' : 'No room selected' }}</p>
                <p class="mt-1">{{ locale === 'th' ? 'กดบล็อกห้องว่างในผังชั้นเพื่อดูรายละเอียดและเริ่มจอง' : 'Select an available room block in the floor plan to see details and reserve it.' }}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          v-else-if="props.activeApp.status === 'Submitted' || props.activeApp.status === 'Need Re-upload'"
          class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.48fr)]"
        >
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle class="text-base">{{ locale === 'th' ? 'ตรวจสอบข้อมูลผู้สมัคร' : 'Review applicant information' }}</CardTitle>
                  <p class="mt-1 text-sm text-muted-foreground">
                    {{ locale === 'th' ? 'ข้อมูลส่วนใหญ่ดึงจากบัญชี KKU หากข้อมูลติดต่อไม่ถูกต้องสามารถแก้ไขก่อนชำระเงินได้' : 'Most fields are pulled from the KKU account. Contact details can be edited before payment.' }}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  class="border-primary/30 text-primary hover:bg-primary/10"
                  @click="profileEditMode = !profileEditMode"
                >
                  <FileText class="size-4" />
                  {{ profileEditMode ? (locale === 'th' ? 'บันทึกข้อมูล' : 'Save details') : (locale === 'th' ? 'แก้ไขข้อมูล' : 'Edit details') }}
                </Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-4 px-4 pb-4">
              <div class="grid gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel class="text-xs">{{ locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full name' }}</FieldLabel>
                  <Input v-model="applicantForm.name" :disabled="!profileEditMode" />
                </Field>
                <Field>
                  <FieldLabel class="text-xs">{{ t.modal.studentId }}</FieldLabel>
                  <Input v-model="applicantForm.studentId" disabled />
                </Field>
                <Field>
                  <FieldLabel class="text-xs">{{ locale === 'th' ? 'คณะ/วิทยาลัย' : 'Faculty' }}</FieldLabel>
                  <Input v-model="applicantForm.faculty" :disabled="!profileEditMode" />
                </Field>
                <Field>
                  <FieldLabel class="text-xs">{{ locale === 'th' ? 'เบอร์ติดต่อ' : 'Phone' }}</FieldLabel>
                  <Input v-model="applicantForm.phone" :disabled="!profileEditMode" placeholder="08X-XXX-XXXX" />
                </Field>
                <Field>
                  <FieldLabel class="text-xs">{{ locale === 'th' ? 'อีเมล KKU' : 'KKU Email' }}</FieldLabel>
                  <Input v-model="applicantForm.email" disabled />
                </Field>
                <Field>
                  <FieldLabel class="text-xs">{{ t.gender }}</FieldLabel>
                  <Select v-model="applicantForm.gender" :disabled="!profileEditMode">
                    <SelectTrigger class="w-full bg-background">
                      <span class="truncate">{{ applicantGenderLabel() }}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">{{ locale === 'th' ? 'หญิง' : 'Female' }}</SelectItem>
                      <SelectItem value="Male">{{ locale === 'th' ? 'ชาย' : 'Male' }}</SelectItem>
                      <SelectItem value="Other">{{ locale === 'th' ? 'อื่น ๆ' : 'Other' }}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field class="md:col-span-2">
                  <FieldLabel class="text-xs">{{ locale === 'th' ? 'ประเภทผู้สมัคร' : 'Applicant type' }}</FieldLabel>
                  <Select v-model="applicantForm.applicantType" :disabled="!profileEditMode">
                    <SelectTrigger class="w-full bg-background">
                      <span class="truncate">{{ applicantTypeLabel() }}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Student">{{ locale === 'th' ? 'นักศึกษาทั่วไป' : 'General Student' }}</SelectItem>
                      <SelectItem value="New First-Year">{{ locale === 'th' ? 'นักศึกษาใหม่' : 'New First-Year' }}</SelectItem>
                      <SelectItem value="Current Resident">{{ locale === 'th' ? 'นักศึกษาหอพักเดิม' : 'Current Resident' }}</SelectItem>
                      <SelectItem value="International Student">{{ locale === 'th' ? 'นักศึกษาต่างชาติ' : 'International Student' }}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-lg border bg-muted/20 p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'หอพัก' : 'Dormitory' }}</p>
                  <p class="mt-1 font-semibold">{{ props.activeApp.dormName }}</p>
                </div>
                <div class="rounded-lg border bg-muted/20 p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ห้อง' : 'Room' }}</p>
                  <p class="mt-1 font-semibold">{{ props.activeApp.roomNumber || applicantForm.roomNumber }}</p>
                </div>
                <div class="rounded-lg border bg-muted/20 p-3">
                  <p class="text-xs text-muted-foreground">{{ locale === 'th' ? 'ประเภทห้อง' : 'Room type' }}</p>
                  <p class="mt-1 line-clamp-2 font-semibold">{{ localizedRoomTypeName(props.activeApp.roomType || applicantForm.roomType) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="gap-0 overflow-hidden rounded-lg py-0 shadow-sm">
            <div class="relative h-36 bg-muted">
              <img :src="(selectedDorm || dormitories[0]).image" :alt="selectedDormLabel()" class="size-full object-cover">
              <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <div class="absolute inset-x-0 bottom-0 p-4 text-white">
                <p class="text-sm font-medium text-white/80">{{ locale === 'th' ? 'ขั้นตอนชำระเงิน' : 'Payment step' }}</p>
                <p class="truncate text-lg font-bold">{{ props.activeApp.id }}</p>
              </div>
            </div>
            <CardContent class="space-y-4 px-4 pb-4 pt-4">
              <div class="rounded-lg border p-4">
                <div class="flex items-start gap-3">
                  <CreditCard class="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p class="font-semibold">{{ locale === 'th' ? 'ยอดที่ต้องชำระเพื่อจองสิทธิ์' : 'Reservation payment amount' }}</p>
                    <p class="mt-1 text-3xl font-bold text-primary">{{ money(selectedPaymentAmount) }} THB</p>
                    <p class="mt-1 text-sm text-muted-foreground">
                      {{ locale === 'th' ? 'จำลองชำระผ่าน UniPay หรือส่งสลิปโอนเงินสำหรับทดสอบ workflow' : 'Use the UniPay simulation or submit a manual transfer slip for the workflow demo.' }}
                    </p>
                  </div>
                </div>
              </div>

              <Button class="h-11 w-full text-sm font-semibold" @click="openUniPayDialog">
                <CreditCard class="size-4" />
                {{ locale === 'th' ? 'ชำระผ่าน UniPay' : 'Pay with UniPay' }}
              </Button>

              <form class="rounded-lg border p-4" @submit.prevent="submitManualPayment">
                <p class="font-semibold">{{ locale === 'th' ? 'อัปโหลดสลิปโอนเงิน' : 'Manual transfer slip' }}</p>
                <div class="mt-3 grid gap-3">
                  <Input v-model="manualSlip.amount" type="number" :placeholder="locale === 'th' ? 'ยอดชำระ' : 'Amount'" />
                  <div class="grid grid-cols-2 gap-2">
                    <Input v-model="manualSlip.date" type="date" />
                    <Input v-model="manualSlip.time" type="time" />
                  </div>
                  <Input v-model="manualSlip.fileName" :placeholder="locale === 'th' ? 'ชื่อไฟล์สลิป' : 'receipt file name'" />
                  <Button type="submit" variant="outline" class="border-primary/30 text-primary hover:bg-primary/10">
                    {{ locale === 'th' ? 'ส่งสลิป' : 'Submit slip' }}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div v-else class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle class="text-base">{{ locale === 'th' ? 'ติดตามใบสมัคร' : 'Application tracking' }}</CardTitle>
                  <p class="mt-1 text-sm text-muted-foreground">{{ props.activeApp.id }} / {{ props.activeApp.dormName }}</p>
                </div>
                <span class="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ring-1" :class="statusClass(props.activeApp.status)">
                  {{ statusLabel(props.activeApp.status) }}
                </span>
              </div>
            </CardHeader>
            <CardContent class="space-y-4 px-4 pb-4">
              <div class="rounded-lg border p-4">
                <div class="flex items-start gap-3">
                  <AlertCircle class="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p class="font-semibold">{{ applicantStatusCopy }}</p>
                    <p v-if="props.activeApp.rejectReason" class="mt-1 text-sm text-muted-foreground">{{ props.activeApp.rejectReason }}</p>
                  </div>
                </div>
              </div>

              <div v-if="props.activeApp.status === 'Confirmed'" class="rounded-lg border p-4">
                <p class="font-semibold">{{ locale === 'th' ? 'ยืนยันสิทธิ์การจองแล้ว' : 'Reservation confirmed' }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ locale === 'th' ? 'ดาวน์โหลดหรือพิมพ์เอกสารจำลองสำหรับวันเข้าพัก' : 'Download or print the mock reservation ticket for check-in.' }}</p>
                <Button class="mt-4" @click="emit('printTicket')">
                  <Download class="size-4" />
                  {{ locale === 'th' ? 'พิมพ์เอกสาร' : 'Print ticket' }}
                </Button>
              </div>
              <div v-else class="rounded-lg border p-4">
                <p class="font-semibold">{{ locale === 'th' ? 'รอเจ้าหน้าที่ดำเนินการ' : 'Waiting for staff action' }}</p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ locale === 'th' ? 'ระบบจำลองส่งรายการนี้เข้าสู่คิวเจ้าหน้าที่เพื่อตรวจสอบและยืนยันสิทธิ์' : 'This mock item has been sent to the staff queue for review and confirmation.' }}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">{{ locale === 'th' ? 'สรุปข้อมูลผู้สมัคร' : 'Applicant summary' }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 px-4 pb-4 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">{{ locale === 'th' ? 'ชื่อ' : 'Name' }}</span>
                <span class="text-right font-semibold">{{ props.activeApp.name }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">{{ locale === 'th' ? 'รหัสนักศึกษา' : 'Student ID' }}</span>
                <span class="font-semibold">{{ props.activeApp.studentId }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">{{ locale === 'th' ? 'ห้อง' : 'Room' }}</span>
                <span class="font-semibold">{{ props.activeApp.roomNumber || (locale === 'th' ? 'รอจัดสรร' : 'Pending') }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">{{ locale === 'th' ? 'ประเภทห้อง' : 'Room type' }}</span>
                <span class="max-w-56 text-right font-semibold">{{ props.activeApp.roomType }}</span>
              </div>
              <Separator />
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">{{ locale === 'th' ? 'วิธีชำระเงิน' : 'Payment' }}</span>
                <span class="font-semibold">{{ props.activeApp.paymentMethod || (locale === 'th' ? 'รอดำเนินการ' : 'Pending') }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">{{ locale === 'th' ? 'ยอดชำระ' : 'Amount' }}</span>
                <span class="font-semibold">{{ money(props.activeApp.amountPaid) }} THB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        v-if="props.isLoggedIn && props.role === 'admin' && activePortal === 'staff'"
        id="staff-workflow"
        class="mx-auto max-w-screen-2xl scroll-mt-20 px-4 pb-10 sm:px-5 lg:px-8"
      >
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" class="mb-2 w-fit text-primary">{{ t.staffWorkspaceBadge }}</Badge>
            <h2 class="text-2xl font-bold tracking-normal">{{ locale === 'th' ? 'workflow การจัดการหอพักสำหรับเจ้าหน้าที่' : 'Dormitory operations workflow' }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{{ locale === 'th' ? 'ตรวจใบสมัคร ยืนยันหลักฐานชำระเงิน จัดการรอบจอง และส่งออกรายงาน' : 'Review applications, confirm payment evidence, manage campaigns, and export reports.' }}</p>
          </div>
          <Tabs v-model="currentStaffTab" class="w-full sm:w-auto">
            <TabsList class="grid h-11 w-full grid-cols-5 sm:w-auto">
              <TabsTrigger
                v-for="tab in staffTabs"
                :key="tab.value"
                :value="tab.value"
                class="px-3 text-sm font-semibold"
              >
                {{ staffTabLabel(tab) }}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="p-4">
              <FileText class="mb-8 size-5 text-muted-foreground" />
              <p class="text-3xl font-bold">{{ staffStats.total }}</p>
              <p class="text-sm text-muted-foreground">{{ staffStatLabel('total') }}</p>
            </CardContent>
          </Card>
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="p-4">
              <CreditCard class="mb-8 size-5 text-muted-foreground" />
              <p class="text-3xl font-bold">{{ staffStats.waitingPayment }}</p>
              <p class="text-sm text-muted-foreground">{{ staffStatLabel('payment') }}</p>
            </CardContent>
          </Card>
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="p-4">
              <AlertCircle class="mb-8 size-5 text-muted-foreground" />
              <p class="text-3xl font-bold">{{ staffStats.verifying }}</p>
              <p class="text-sm text-muted-foreground">{{ staffStatLabel('review') }}</p>
            </CardContent>
          </Card>
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="p-4">
              <Check class="mb-8 size-5 text-muted-foreground" />
              <p class="text-3xl font-bold">{{ staffStats.confirmed }}</p>
              <p class="text-sm text-muted-foreground">{{ staffStatLabel('confirmed') }}</p>
            </CardContent>
          </Card>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="flex items-start gap-3 p-4">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-primary">
                <AlertCircle class="size-5" />
              </span>
              <div>
                <p class="font-semibold">{{ locale === 'th' ? 'คิวตรวจหลักฐาน' : 'Evidence review queue' }}</p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ locale === 'th' ? `${staffStats.verifying} รายการรอเจ้าหน้าที่ตรวจสอบ` : `${staffStats.verifying} applications need staff review` }}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="flex items-start gap-3 p-4">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-primary">
                <Calendar class="size-5" />
              </span>
              <div>
                <p class="font-semibold">{{ locale === 'th' ? 'รอบจองที่เปิดอยู่' : 'Open campaigns' }}</p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ locale === 'th' ? `${activeCampaigns.length} รอบจองพร้อมรับใบสมัคร` : `${activeCampaigns.length} campaigns are accepting applications` }}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardContent class="flex items-start gap-3 p-4">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-primary">
                <Download class="size-5" />
              </span>
              <div>
                <p class="font-semibold">{{ locale === 'th' ? 'รายงานพร้อมส่งออก' : 'Export-ready reports' }}</p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ locale === 'th' ? 'ดาวน์โหลดรายชื่อผู้พักและรายงานชำระเงินได้จากแท็บรายงาน' : 'Resident and payment CSV exports are available in Reports.' }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-if="currentStaffTab === 'dashboard' || currentStaffTab === 'applications'" class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">
                {{ currentStaffTab === 'dashboard'
                  ? (locale === 'th' ? 'ใบสมัครล่าสุด' : 'Latest applications')
                  : (locale === 'th' ? 'ใบสมัครทั้งหมด' : 'All applications') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="px-0 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{{ locale === 'th' ? 'รหัส' : 'Code' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'ผู้สมัคร' : 'Applicant' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'หอพัก' : 'Dormitory' }}</TableHead>
                    <TableHead>{{ locale === 'th' ? 'สถานะ' : 'Status' }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="app in (currentStaffTab === 'dashboard' ? props.applicants.slice(0, 5) : props.applicants)"
                    :key="app.id"
                    class="cursor-pointer"
                    @click="openStaffApplication(app)"
                  >
                    <TableCell class="font-medium">{{ app.id }}</TableCell>
                    <TableCell>
                      <div class="font-medium">{{ app.name }}</div>
                      <div class="text-xs text-muted-foreground">{{ app.studentId }}</div>
                    </TableCell>
                    <TableCell class="max-w-72 truncate">{{ app.dormName }}</TableCell>
                    <TableCell>
                      <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1" :class="statusClass(app.status)">
                        {{ statusLabel(app.status) }}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">{{ locale === 'th' ? 'ภาพรวมโควตา' : 'Quota overview' }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4 px-4 pb-4">
              <div>
                <div class="mb-2 flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">{{ locale === 'th' ? 'อัตราการเข้าพัก' : 'Occupancy rate' }}</span>
                  <span class="font-semibold">{{ occupancySummary.rate }}%</span>
                </div>
                <Progress :model-value="occupancySummary.rate" />
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-lg border p-3">
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'ใช้แล้ว' : 'Occupied' }}</p>
                  <p class="text-xl font-bold">{{ occupancySummary.occupied }}</p>
                </div>
                <div class="rounded-lg border p-3">
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'คงเหลือ' : 'Available' }}</p>
                  <p class="text-xl font-bold">{{ occupancySummary.available }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-else-if="currentStaffTab === 'campaigns'" class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">{{ locale === 'th' ? 'สร้างรอบจองใหม่' : 'Create reservation campaign' }}</CardTitle>
            </CardHeader>
            <CardContent class="grid gap-3 px-4 pb-4">
              <Input v-model="campaignDraft.name" :placeholder="locale === 'th' ? 'ชื่อรอบจอง' : 'Campaign name'" />
              <Textarea v-model="campaignDraft.description" :placeholder="locale === 'th' ? 'รายละเอียดรอบจอง' : 'Campaign description'" />
              <div class="grid grid-cols-2 gap-2">
                <Input v-model="campaignDraft.openDate" type="date" />
                <Input v-model="campaignDraft.closeDate" type="date" />
              </div>
              <Input v-model.number="campaignDraft.requiredAmount" type="number" :placeholder="locale === 'th' ? 'ยอดชำระเริ่มต้น' : 'Required amount'" />
              <Button @click="createCampaignFromDraft">
                <Plus class="size-4" />
                {{ locale === 'th' ? 'สร้างรอบจอง' : 'Create campaign' }}
              </Button>
            </CardContent>
          </Card>

          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">{{ locale === 'th' ? 'รอบจองที่เปิดอยู่' : 'Open campaigns' }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 px-4 pb-4">
              <div v-for="campaign in activeCampaigns" :key="campaign.id" class="rounded-lg border p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold">{{ campaign.name }}</p>
                    <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ campaign.description }}</p>
                  </div>
                  <Badge variant="secondary" class="text-primary">
                    {{ campaign.status === 'open'
                      ? (locale === 'th' ? 'เปิดรับสมัคร' : 'Open')
                      : (locale === 'th' ? 'ปิดรอบจอง' : 'Closed') }}
                  </Badge>
                </div>
                <p class="mt-3 text-sm text-muted-foreground">{{ campaign.openDate }} - {{ campaign.closeDate }}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-else-if="currentStaffTab === 'rooms'" class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="campaign in props.campaigns" :key="campaign.id" class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">{{ campaign.name }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 px-4 pb-4">
              <div v-for="type in campaign.roomTypes" :key="type.name" class="rounded-lg border p-3">
                <div class="flex items-start justify-between gap-3">
                  <p class="font-medium">{{ type.name }}</p>
                  <Badge variant="secondary">{{ type.active }}/{{ type.capacity }}</Badge>
                </div>
                <p class="mt-2 text-sm text-muted-foreground">{{ money(type.price) }} THB</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-else-if="currentStaffTab === 'reports'" class="mt-4 grid gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">{{ locale === 'th' ? 'ส่งออกรายงาน' : 'Exports' }}</CardTitle>
            </CardHeader>
            <CardContent class="grid gap-3 px-4 pb-4">
              <Button variant="outline" class="justify-start" @click="emit('exportData', 'residents')">
                <Download class="size-4" />
                {{ locale === 'th' ? 'รายชื่อผู้พักที่ยืนยันแล้ว CSV' : 'Confirmed residents CSV' }}
              </Button>
              <Button variant="outline" class="justify-start" @click="emit('exportData', 'payments')">
                <Download class="size-4" />
                {{ locale === 'th' ? 'รายงานการชำระเงิน CSV' : 'Payment report CSV' }}
              </Button>
            </CardContent>
          </Card>

          <Card class="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader class="px-4 pb-2 pt-4">
              <CardTitle class="text-base">{{ locale === 'th' ? 'ประวัติการดำเนินการ' : 'Audit log' }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 px-4 pb-4">
              <div v-for="log in props.auditLogs.slice(0, 8)" :key="`${log.timestamp}-${log.detail}`" class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">{{ log.timestamp }}</p>
                <p class="mt-1 text-sm">{{ log.detail }}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>

    <Dialog v-model:open="uniPayDialogOpen">
      <DialogContent class="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{{ locale === 'th' ? 'จำลองการชำระเงิน UniPay' : 'UniPay payment simulation' }}</DialogTitle>
          <DialogDescription>
            {{ locale === 'th' ? 'หน้าจอนี้จำลองการชำระเงินเพื่อทดสอบ workflow เท่านั้น' : 'This modal simulates payment for workflow testing only.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="rounded-lg border bg-muted/20 p-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm text-muted-foreground">{{ locale === 'th' ? 'เลขที่ใบสมัคร' : 'Application ID' }}</p>
                <p class="mt-1 font-semibold">{{ props.activeApp?.id || '-' }}</p>
              </div>
              <Badge variant="secondary" class="text-primary">UniPay</Badge>
            </div>
            <Separator class="my-3" />
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-sm text-muted-foreground">{{ locale === 'th' ? 'ยอดชำระ' : 'Amount' }}</p>
                <p class="mt-1 text-2xl font-bold text-primary">{{ money(selectedPaymentAmount) }} THB</p>
              </div>
              <CreditCard class="size-8 text-primary" />
            </div>
          </div>

          <div v-if="uniPayProcessing" class="rounded-lg border p-4 text-center">
            <div class="mx-auto size-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p class="mt-3 font-semibold">{{ locale === 'th' ? 'กำลังตรวจสอบการชำระเงิน' : 'Verifying payment' }}</p>
            <p class="mt-1 text-sm text-muted-foreground">{{ locale === 'th' ? 'กรุณารอสักครู่ ระบบกำลังจำลองการตอบกลับจาก UniPay' : 'Please wait while the mock UniPay response is processed.' }}</p>
          </div>

          <div v-else-if="uniPaySuccess" class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div class="flex items-start gap-3">
              <Check class="mt-0.5 size-5 shrink-0" />
              <div>
                <p class="font-semibold">{{ locale === 'th' ? 'ชำระเงินสำเร็จ' : 'Payment successful' }}</p>
                <p class="mt-1 text-sm">{{ locale === 'th' ? 'กดอัปเดตสถานะเพื่อส่งใบสมัครเข้าสู่ขั้นเจ้าหน้าที่ตรวจสอบ' : 'Update the status to send this application to staff review.' }}</p>
              </div>
            </div>
          </div>

          <div v-else class="rounded-lg border p-4">
            <p class="font-semibold">{{ locale === 'th' ? 'พร้อมจำลองการชำระเงิน' : 'Ready to simulate payment' }}</p>
            <p class="mt-1 text-sm text-muted-foreground">{{ locale === 'th' ? 'เมื่อกดยืนยัน ระบบจะหมุนสักครู่ก่อนแสดงผลชำระสำเร็จ' : 'After confirming, the system will briefly process before showing success.' }}</p>
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" :disabled="uniPayProcessing" @click="uniPayDialogOpen = false">
              {{ locale === 'th' ? 'ปิด' : 'Close' }}
            </Button>
            <Button v-if="!uniPaySuccess" :disabled="uniPayProcessing" @click="confirmUniPayPayment">
              <CreditCard class="size-4" />
              {{ locale === 'th' ? 'จำลองชำระเงิน' : 'Simulate payment' }}
            </Button>
            <Button v-else @click="finishUniPayStatusUpdate">
              <ClipboardList class="size-4" />
              {{ locale === 'th' ? 'อัปเดตสถานะ' : 'Update status' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="staffReviewOpen">
      <DialogContent class="max-h-[calc(100vh-1.5rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{{ locale === 'th' ? 'ตรวจสอบใบสมัคร' : 'Application review' }}</DialogTitle>
          <DialogDescription v-if="selectedStaffApp">
            {{ selectedStaffApp.id }} / {{ selectedStaffApp.name }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedStaffApp" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <div class="grid gap-4">
            <div class="rounded-lg border p-4">
              <div class="mb-3 flex items-center gap-2">
                <User class="size-4 text-primary" />
                <p class="font-semibold">{{ locale === 'th' ? 'ข้อมูลผู้สมัคร' : 'Applicant information' }}</p>
              </div>
              <div class="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'ชื่อ' : 'Name' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.name }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'รหัสนักศึกษา' : 'Student ID' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.studentId }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'คณะ/วิทยาลัย' : 'Faculty' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.faculty }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'ติดต่อ' : 'Contact' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.phone }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border p-4">
              <div class="mb-3 flex items-center gap-2">
                <Bed class="size-4 text-primary" />
                <p class="font-semibold">{{ locale === 'th' ? 'รายละเอียดการจอง' : 'Reservation details' }}</p>
              </div>
              <div class="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'หอพัก' : 'Dormitory' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.dormName }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'ห้อง' : 'Room' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.roomNumber || (locale === 'th' ? 'รอจัดสรร' : 'Pending') }}</p>
                </div>
                <div class="sm:col-span-2">
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'ประเภทห้อง' : 'Room type' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.roomType }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'ประเภทผู้สมัคร' : 'Applicant type' }}</p>
                  <p class="font-medium">{{ selectedStaffApp.applicantType }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground">{{ locale === 'th' ? 'สถานะ' : 'Status' }}</p>
                  <span class="mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1" :class="statusClass(selectedStaffApp.status)">
                    {{ statusLabel(selectedStaffApp.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4">
            <div class="rounded-lg border p-4">
              <div class="mb-3 flex items-center gap-2">
                <CreditCard class="size-4 text-primary" />
                <p class="font-semibold">{{ locale === 'th' ? 'หลักฐานการชำระเงิน' : 'Payment evidence' }}</p>
              </div>
              <div class="rounded-lg border bg-muted/40 p-4">
                <p class="text-sm font-medium">{{ selectedStaffApp.slipFile || (locale === 'th' ? 'ยังไม่มีไฟล์สลิป' : 'No payment slip uploaded') }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ selectedStaffApp.paymentMethod || (locale === 'th' ? 'รอหลักฐานการชำระเงิน' : 'Pending payment') }}
                  <span v-if="selectedStaffApp.paymentDate">/ {{ selectedStaffApp.paymentDate }} {{ selectedStaffApp.paymentTime }}</span>
                </p>
                <p class="mt-4 text-2xl font-bold">{{ money(selectedStaffApp.amountPaid) }} THB</p>
              </div>
            </div>

            <div class="rounded-lg border p-4">
              <Field>
                <FieldLabel class="text-xs">{{ locale === 'th' ? 'เหตุผล / บันทึกเจ้าหน้าที่' : 'Reason / staff note' }}</FieldLabel>
                <Textarea
                  v-model="staffActionReason"
                  :placeholder="locale === 'th' ? 'ระบุเหตุผลเมื่อขอให้ส่งใหม่หรือไม่อนุมัติใบสมัคร' : 'Add a reason when sending back or rejecting the application.'"
                />
              </Field>
              <div class="mt-4 grid gap-2 sm:grid-cols-3">
                <Button @click="approveSelectedApp">
                  <Check class="size-4" />
                  {{ locale === 'th' ? 'อนุมัติ' : 'Approve' }}
                </Button>
                <Button variant="outline" class="border-primary/30 text-primary hover:bg-primary/10" @click="reuploadSelectedApp">
                  <AlertCircle class="size-4" />
                  {{ locale === 'th' ? 'ขอสลิปใหม่' : 'Re-upload' }}
                </Button>
                <Button variant="outline" class="border-red-200 text-red-700 hover:bg-red-50" @click="rejectSelectedApp">
                  <XCircle class="size-4" />
                  {{ locale === 'th' ? 'ไม่อนุมัติ' : 'Reject' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="loginModalOpen">
      <DialogContent class="max-h-[calc(100vh-1.5rem)] overflow-y-auto p-0 sm:max-w-[520px]">
        <div class="relative h-24 overflow-hidden bg-muted">
          <img :src="woraResidenceImage" alt="KKU affiliated dormitory" class="size-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div class="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 text-white">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/15 backdrop-blur">
              <Building class="size-5" />
            </div>
            <div class="min-w-0 pb-0.5">
              <p class="truncate text-xs font-medium uppercase tracking-wide text-white/80">{{ t.brandTitle }}</p>
              <p class="truncate text-sm font-semibold">{{ t.brandSubtitle }}</p>
            </div>
          </div>
        </div>

        <div class="p-5">
          <DialogHeader class="pr-7 text-left">
            <Badge variant="secondary" class="mb-2 w-fit text-primary">{{ t.modal.badge }}</Badge>
            <DialogTitle class="text-xl">{{ t.modal.title }}</DialogTitle>
            <DialogDescription>
              {{ t.modal.description }}
            </DialogDescription>
          </DialogHeader>

          <div class="mt-4 flex gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <ShieldCheck class="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p class="font-medium">{{ t.modal.demoTitle }}</p>
              <p class="text-xs text-muted-foreground">{{ t.modal.demoDescription }}</p>
            </div>
          </div>

          <Tabs v-model="loginRole" class="mt-4 w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="applicant">{{ t.modal.applicant }}</TabsTrigger>
              <TabsTrigger value="admin">{{ t.modal.staff }}</TabsTrigger>
            </TabsList>

            <TabsContent value="applicant" class="mt-4">
              <form class="space-y-3" @submit.prevent="handleLogin">
                <Field>
                  <FieldLabel for="username-applicant" class="text-xs">{{ usernameLabel }}</FieldLabel>
                  <div class="relative">
                    <User class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username-applicant"
                      v-model="username"
                      type="text"
                      :placeholder="usernamePlaceholder"
                      class="pl-9"
                      autocomplete="username"
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel for="password-applicant" class="text-xs">{{ t.modal.password }}</FieldLabel>
                  <div class="relative">
                    <Lock class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-applicant"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="••••••••"
                      class="pl-9 pr-10"
                      autocomplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      class="absolute right-1 top-1/2 -translate-y-1/2"
                      @click="showPassword = !showPassword"
                    >
                      <component :is="showPassword ? EyeOff : Eye" class="size-4" />
                    </Button>
                  </div>
                </Field>

                <Button type="submit" class="w-full">
                  {{ t.modal.enterApplicant }}
                  <ArrowRight class="size-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" class="mt-4">
              <form class="space-y-3" @submit.prevent="handleLogin">
                <Field>
                  <FieldLabel for="username-admin" class="text-xs">{{ usernameLabel }}</FieldLabel>
                  <div class="relative">
                    <User class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username-admin"
                      v-model="username"
                      type="text"
                      :placeholder="usernamePlaceholder"
                      class="pl-9"
                      autocomplete="username"
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel for="password-admin" class="text-xs">{{ t.modal.password }}</FieldLabel>
                  <div class="relative">
                    <Lock class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-admin"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="••••••••"
                      class="pl-9 pr-10"
                      autocomplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      class="absolute right-1 top-1/2 -translate-y-1/2"
                      @click="showPassword = !showPassword"
                    >
                      <component :is="showPassword ? EyeOff : Eye" class="size-4" />
                    </Button>
                  </div>
                </Field>

                <Button type="submit" class="w-full">
                  {{ t.modal.enterStaff }}
                  <ArrowRight class="size-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator class="my-4" />

          <p class="text-center text-xs leading-5 text-muted-foreground">
            {{ locale === 'th' ? 'ระบบจะเปิดพื้นที่ทำงานตามสิทธิ์ของบัญชีที่เข้าสู่ระบบ' : 'The system opens the workspace based on the signed-in account permission.' }}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
