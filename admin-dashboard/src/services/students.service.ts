import api from "@/lib/axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Student,
  DeviceChangeRequest,
} from "@/types";

export interface PromotionStudent {
  _id: string;
  studentId: string;
  name: { first: string; last: string };
  email: string;
  currentLevel: number;
  nextLevel: number | null;
  nextLevelName: string | null;
  willGraduate: boolean;
  specialization: { _id: string; name: string; code: string } | null;
}

export interface PromotionSummary {
  total: number;
  willPromote: number;
  willGraduate: number;
  currentLevel: number;
}

export interface PromotionResult {
  promoted: Array<{ _id: string; studentId: string; name: { first: string; last: string }; fromLevel: number; toLevel: number }>;
  graduated: Array<{ _id: string; studentId: string; name: { first: string; last: string }; level: number }>;
  failed: Array<{ _id: string; studentId: string; error: string }>;
}

interface CreateStudentRequest {
  name: {
    first: string;
    last: string;
  };
  email: string;
  password?: string;
  studentId: string;
  phone?: string;
  academicInfo: {
    specialization?: string;
    department?: string;
    level: number;
  };
  device?: {
    macAddress: string;
    isVerified?: boolean;
    registeredAt?: Date;
  };
}

interface BulkCreateStudentsRequest {
  students: Omit<CreateStudentRequest, "password">[];
  defaultPassword?: string;
}

export const studentsService = {
  getAll: async (params?: {
    specialization?: string;
    level?: number;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Student>> => {
    const response = await api.get<PaginatedResponse<Student>>("/students", {
      params,
    });
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    levels: Record<number, number>;
  }> => {
    const response = await api.get<
      ApiResponse<{
        total: number;
        levels: Record<number, number>;
      }>
    >("/students/stats");
    return response.data.data;
  },

  getById: async (id: string): Promise<Student> => {
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data.data;
  },

  getAttendance: async (id: string, courseId?: string) => {
    const response = await api.get(`/students/${id}/attendance`, {
      params: { course: courseId },
    });
    return response.data.data;
  },

  getAttendanceSummary: async (id: string) => {
    const response = await api.get(`/students/${id}/attendance-summary`);
    return response.data.data;
  },

  create: async (data: CreateStudentRequest): Promise<Student> => {
    const response = await api.post<ApiResponse<Student>>("/students", data);
    return response.data.data;
  },

  createBulk: async (
    data: BulkCreateStudentsRequest,
  ): Promise<{
    created: number;
    failed: number;
    errors: string[];
  }> => {
    const response = await api.post("/students/bulk", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateStudentRequest>,
  ): Promise<Student> => {
    const response = await api.put<ApiResponse<Student>>(
      `/students/${id}`,
      data,
    );
    return response.data.data;
  },

  // Device management
  getDeviceRequests: async (
    status?: string,
  ): Promise<DeviceChangeRequest[]> => {
    const response = await api.get("/students/device-requests", {
      params: { status },
    });
    return response.data.data;
  },

  approveDeviceChange: async (requestId: string): Promise<void> => {
    await api.post(`/students/device-requests/${requestId}/approve`);
  },

  rejectDeviceChange: async (
    requestId: string,
    reason?: string,
  ): Promise<void> => {
    await api.post(`/students/device-requests/${requestId}/reject`, { reason });
  },

  // ─── Year Promotion ───────────────────────────────────────────────
  getPromotionPreview: async (params: {
    level: number;
    specialization?: string;
  }): Promise<{
    students: PromotionStudent[];
    summary: PromotionSummary;
  }> => {
    const response = await api.get<ApiResponse<{
      students: PromotionStudent[];
      summary: PromotionSummary;
    }>>("/students/promotion-preview", { params });
    return response.data.data;
  },

  promoteStudents: async (data: {
    studentIds: string[];
    clearEnrolledCourses?: boolean;
  }): Promise<PromotionResult> => {
    const response = await api.post<ApiResponse<PromotionResult>>(
      "/students/promote",
      data,
    );
    return response.data.data;
  },
};
