import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse, Doctor } from "@/types";

interface CreateDoctorRequest {
  name: {
    first: string;
    last: string;
  };
  email: string;
  password?: string;
  phone?: string;
}

export const doctorsService = {
  getAll: async (params?: {
    department?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Doctor>> => {
    const response = await api.get<PaginatedResponse<Doctor>>("/doctors", {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Doctor> => {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data.data;
  },

  getCourses: async (id: string) => {
    const response = await api.get(`/doctors/${id}/courses`);
    return response.data.data;
  },

  create: async (data: CreateDoctorRequest): Promise<Doctor> => {
    const response = await api.post<ApiResponse<Doctor>>("/doctors", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateDoctorRequest>,
  ): Promise<Doctor> => {
    const response = await api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/doctors/${id}`);
  },

  // Assign courses to doctor
  assignCourses: async (id: string, courseIds: string[]): Promise<void> => {
    await api.post(`/doctors/${id}/courses`, { courses: courseIds });
  },
};
