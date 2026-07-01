export interface RoomType {
  name: string;
  price: number;
  capacity: number;
  active: number;
}

export interface DormCampaign {
  id: string;
  name: string;
  type: string;
  status: 'open' | 'closed';
  description: string;
  openDate: string;
  closeDate: string;
  roomTypes: RoomType[];
  rules: string;
  paymentRequirement: string;
  requiredAmount: number;
  facilities: string[];
}

export interface RoomInfo {
  number: string;
  capacity: number;
  occupied: number;
  type: string;
}

export interface FloorInfo {
  floor: number;
  rooms: RoomInfo[];
}

export interface DormRooms {
  [dormId: string]: {
    floors: FloorInfo[];
  };
}

export interface Applicant {
  id: string;
  name: string;
  studentId: string;
  phone: string;
  email: string;
  faculty: string;
  gender: string;
  dormId: string;
  dormName: string;
  roomType: string;
  roomNumber: string;
  applicantType: string;
  status: 'Submitted' | 'Staff Verifying' | 'Confirmed' | 'Need Re-upload' | 'Rejected';
  amountPaid: number;
  paymentDate: string;
  paymentTime: string;
  slipFile: string;
  docFile: string;
  paymentMethod: string;
  rejectReason: string;
}

export interface AuditLog {
  timestamp: string;
  detail: string;
}
