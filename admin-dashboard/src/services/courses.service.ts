import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse, Course } from "@/types";

interface CreateCourseRequest {
  name: string;
  code: string;
  department: string;
  doctor: string;
  level: number;
  semester: string;
  specialization?: string;
}

export const coursesService = {
  getAll: async (params?: {
    department?: string;
    doctor?: string;
    level?: number;
    semester?: number;
    academicYear?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Course>> => {
    const response = await api.get<PaginatedResponse<Course>>("/courses", {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Course> => {
    const response = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data.data;
  },

  getStudents: async (id: string) => {
    const response = await api.get(`/courses/${id}/students`);
    return response.data.data;
  },

  getLectures: async (id: string) => {
    const response = await api.get(`/courses/${id}/lectures`);
    return response.data.data;
  },

  getAttendanceStats: async (id: string) => {
    const response = await api.get(`/courses/${id}/attendance-stats`);
    return response.data.data;
  },

  create: async (data: CreateCourseRequest): Promise<Course> => {
    const response = await api.post<ApiResponse<Course>>("/courses", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateCourseRequest>,
  ): Promise<Course> => {
    const response = await api.put<ApiResponse<Course>>(`/courses/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  // Enroll students
  enrollStudents: async (id: string, studentIds: string[]): Promise<void> => {
    await api.post(`/courses/${id}/enroll`, { students: studentIds });
  },

  // Unenroll students
  unenrollStudents: async (id: string, studentIds: string[]): Promise<void> => {
    await api.post(`/courses/${id}/unenroll`, { students: studentIds });
  },

  // Bulk enroll by level
  enrollByLevel: async (
    id: string,
    level: number,
  ): Promise<{ enrolled: number }> => {
    const response = await api.post(`/courses/${id}/enroll-by-level`, {
      level,
    });
    return response.data.data;
  },
};
