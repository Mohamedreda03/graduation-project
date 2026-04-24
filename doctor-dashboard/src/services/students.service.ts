import api from "@/lib/axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Student,
  DeviceChangeRequest,
} from "@/types";

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
    department: string;
    level: number;
    specialization?: string;
  };
}

interface BulkCreateStudentsRequest {
  students: Omit<CreateStudentRequest, "password">[];
  defaultPassword?: string;
}

export const studentsService = {
  getAll: async (params?: {
    department?: string;
    level?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Student>> => {
    const response = await api.get<PaginatedResponse<Student>>("/students", {
      params,
    });
    return response.data;
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
};
