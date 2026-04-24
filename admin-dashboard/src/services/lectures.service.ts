import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse, Lecture } from "@/types";

interface CreateLectureRequest {
  course: string;
  hall: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string;
  lectureType?: "lecture" | "section" | "lab";
  weekPattern?: "weekly" | "odd" | "even";
}

interface ScheduleLectureRequest extends CreateLectureRequest {
  startDate: string;
  endDate: string;
}

export const lecturesService = {
  getAll: async (params?: {
    course?: string;
    hall?: string;
    doctor?: string;
    dayOfWeek?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Lecture>> => {
    const response = await api.get<PaginatedResponse<Lecture>>("/lectures", {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Lecture> => {
    const response = await api.get<ApiResponse<Lecture>>(`/lectures/${id}`);
    return response.data.data;
  },

  getToday: async () => {
    const response = await api.get("/lectures/today");
    return response.data.data;
  },

  getByDate: async (date: string) => {
    const response = await api.get("/lectures/by-date", { params: { date } });
    return response.data.data;
  },

  getWeekSchedule: async (courseId?: string, hallId?: string) => {
    const response = await api.get("/lectures/week-schedule", {
      params: { course: courseId, hall: hallId },
    });
    return response.data.data;
  },

  create: async (data: CreateLectureRequest): Promise<Lecture> => {
    const response = await api.post<ApiResponse<Lecture>>("/lectures", data);
    return response.data.data;
  },

  // Schedule recurring lectures
  scheduleRecurring: async (
    data: ScheduleLectureRequest,
  ): Promise<{ created: number }> => {
    const response = await api.post("/lectures/schedule", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateLectureRequest>,
  ): Promise<Lecture> => {
    const response = await api.put<ApiResponse<Lecture>>(
      `/lectures/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/lectures/${id}`);
  },

  // Manual lecture control
  startLecture: async (id: string): Promise<Lecture> => {
    const response = await api.post<ApiResponse<Lecture>>(
      `/lectures/${id}/start`,
    );
    return response.data.data;
  },

  endLecture: async (id: string): Promise<Lecture> => {
    const response = await api.post<ApiResponse<Lecture>>(
      `/lectures/${id}/end`,
    );
    return response.data.data;
  },

  cancelLecture: async (id: string, reason?: string): Promise<void> => {
    await api.post(`/lectures/${id}/cancel`, { reason });
  },
};
