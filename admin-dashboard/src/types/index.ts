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
export type AdminRole = "super_admin" | "dean" | "student_affairs" | "head_of_department";

export interface UserName {
  first: string;
  last: string;
}

export interface AcademicInfo {
  specialization?: Specialization | string;
  department?: string;
  level?: number;
  enrolledCourses?: string[];
}

export interface User {
  _id: string;
  name: UserName | string;
  fullName?: string;
  email: string;
  role: UserRole;
  adminRole?: AdminRole;
  department?: Specialization | string;
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

// ============ Specialization ============
export interface Level {
  level: number;
  name: string;
  hasDepartments: boolean;
  sectionsCount: number;
}

export interface Specialization {
  _id: string;
  name: string;
  code: string;
  departments: string[];
  levels?: Level[];
  description?: string;
  headOfSpecialization?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSpecializationRequest {
  name: string;
  code: string;
  departments: string[];
  levels: Level[];
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
    apiKey?: string;
  };
}

// ============ Course ============
export interface Course {
  _id: string;
  name: string;
  code: string;
  specialization: Specialization | string;
  departments?: string[];
  doctor: Doctor | string;
  level: number;
  semester: string[];
  students: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  specialization: string;
  departments?: string[];
  doctor: string;
  level: number;
  semester: string[];
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
  doctor?: Doctor | User | string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date?: string;
  type: LectureType;
  lectureType: LectureType;
  status: LectureStatus;
  weekPattern: "weekly" | "odd" | "even";
  level?: number;
  specialization?: string;
  section?: string;
  isActive: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  createdAt: string;
}

export interface CreateLectureRequest {
  course: string;
  hall: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  lectureType?: "lecture" | "section" | "lab";
  section?: string;
  weekPattern?: "weekly" | "odd" | "even";
  semester?: string;
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
  status: "in-progress" | "present" | "absent";
  sessions: AttendanceSession[];
  checkInTime?: string;
  checkOutTime?: string;
  totalPresenceTime: number;
  presencePercentage: number;
  isFinalized: boolean;
  lectureStartTime?: string;
  lectureEndTime?: string;
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
