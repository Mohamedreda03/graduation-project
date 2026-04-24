// API Types for Smart Attendance System

// ============ Common ============
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============ Auth ============
export interface LoginRequest {
  email: string;
  password: string;
}

// For web: tokens are in httpOnly cookies (not in response)
// For mobile: tokens are in response body
export interface LoginResponse {
  user: User;
  accessToken?: string; // Optional - only for mobile
  refreshToken?: string; // Optional - only for mobile
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============ User ============
export type UserRole = "student" | "doctor" | "admin";

export interface UserName {
  first: string;
  last: string;
}

export interface AcademicInfo {
  department?: Department | string;
  level?: number;
  specialization?: string;
  enrolledCourses?: string[];
}

export interface User {
  _id: string;
  name: UserName | string;
  fullName?: string;
  email: string;
  role: UserRole;
  studentId?: string;
  phone?: string;
  academicInfo?: AcademicInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceInfo {
  deviceId: string;
  fingerprint: string;
  macAddress: string;
  deviceName?: string;
  registeredAt?: string;
  isVerified: boolean;
}

export interface DeviceChangeRequest {
  _id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNote?: string;
}

export interface Student extends User {
  role: "student";
  studentId: string;
  academicInfo: AcademicInfo;
  device?: DeviceInfo;
  deviceChangeRequest?: DeviceChangeRequest;
}

export interface Doctor extends User {
  role: "doctor";
}

// ============ Department ============
export interface Department {
  _id: string;
  name: string;
  code: string;
  faculty: string;
  description?: string;
  headOfDepartment?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  faculty: string;
  description?: string;
}

// ============ Hall ============
export interface AccessPoint {
  ssid?: string;
  ipRange?: string;
  apIdentifier?: string;
  apiKey?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Hall {
  _id: string;
  name: string;
  building: string;
  capacity?: number;
  accessPoint?: AccessPoint;
  createdAt: string;
}

export interface CreateHallRequest {
  name: string;
  building: string;
  capacity?: number;
  accessPoint?: {
    ssid?: string;
    ipRange?: string;
    apIdentifier?: string;
  };
}

// ============ Course ============
export interface Course {
  _id: string;
  name: string;
  code: string;
  department: Department | string;
  doctor: Doctor | string;
  level: number;
  specialization?: string;
  semester: string;
  students: string[];
  isActive: boolean;
  createdAt: string;
  creditHours?: number;
  type?: string;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  department: string;
  doctor: string;
  level: number;
  semester: string;
  specialization?: string;
}

// ============ Lecture ============
export type LectureStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";
export type LectureType = "lecture" | "section" | "lab";

export interface Lecture {
  _id: string;
  course: Course | string;
  hall: Hall | string;
  doctor?: Doctor | string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date?: string;
  type: LectureType;
  lectureType: LectureType;
  status: LectureStatus;
  weekPattern: "weekly" | "odd" | "even";
  isActive: boolean;
  createdAt: string;
}

export interface CreateLectureRequest {
  course: string;
  hall: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  lectureType?: "lecture" | "section" | "lab";
  weekPattern?: "weekly" | "odd" | "even";
}

// ============ Attendance ============
export interface AttendanceSession {
  checkIn: string;
  checkOut?: string;
  duration?: number;
}

export interface AttendanceRecord {
  _id: string;
  student: Student | string;
  course: Course | string;
  lecture: Lecture | string;
  hall: Hall | string;
  date: string;
  status: "in-progress" | "present" | "absent" | "late" | "excused";
  sessions: AttendanceSession[];
  checkInTime?: string;
  checkOutTime?: string;
  totalPresenceTime: number;
  presencePercentage: number;
  isFinalized: boolean;
  createdAt: string;
}

// ============ Connection Log ============
export interface ConnectionLog {
  _id: string;
  macAddress: string;
  accessPoint: {
    macAddress: string;
    hall: Hall | string;
  };
  student?: Student | string;
  eventType: "device-connected" | "device-disconnected";
  timestamp: string;
  processed: boolean;
  processingResult?: string;
}

// ============ Settings ============
export interface Setting {
  key: string;
  value: number | string | boolean;
  description?: string;
  updatedAt: string;
}

// ============ Dashboard Stats ============
export interface DashboardStats {
  totalStudents: number;
  totalDoctors: number;
  totalCourses: number;
  totalHalls: number;
  todayLectures: number;
  activeStudents: number;
  pendingDeviceRequests: number;
}
