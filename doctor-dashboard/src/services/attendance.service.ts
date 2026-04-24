import api from "@/lib/axios";
import type { AttendanceRecord } from "@/types";

interface AttendanceQuery {
  lecture?: string;
  course?: string;
  student?: string;
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface AttendanceStats {
  totalLectures: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

interface CourseAttendanceReport {
  course: {
    _id: string;
    name: string;
    code: string;
  };
  students: Array<{
    student: {
      _id: string;
      name: string;
      studentId: string;
    };
    stats: AttendanceStats;
    isAtRisk: boolean;
  }>;
}

export const attendanceService = {
  getAll: async (params?: AttendanceQuery) => {
    const response = await api.get("/attendance", { params });
    return response.data;
  },

  getById: async (id: string): Promise<AttendanceRecord> => {
    const response = await api.get(`/attendance/${id}`);
    return response.data.data;
  },

  getByLecture: async (lectureId: string) => {
    const response = await api.get(`/attendance/lecture/${lectureId}`);
    return response.data.data;
  },

  getByCourse: async (courseId: string) => {
    const response = await api.get(`/attendance/course/${courseId}`);
    return response.data.data;
  },

  getByStudent: async (studentId: string) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data.data;
  },

  // Get course attendance report with all students
  getCourseReport: async (
    courseId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<CourseAttendanceReport & { pagination: any }> => {
    const response = await api.get(`/attendance/course/${courseId}/report`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  // Get students at risk of failure (below 85% attendance)
  getAtRiskStudents: async (courseId?: string) => {
    const response = await api.get("/attendance/at-risk", {
      params: { course: courseId },
    });
    return response.data.data;
  },

  // Manual attendance modification (Admin only)
  updateStatus: async (
    id: string,
    status: "present" | "absent" | "late" | "excused",
    reason?: string,
  ): Promise<AttendanceRecord> => {
    const response = await api.put(`/attendance/${id}`, { status, reason });
    return response.data.data;
  },

  // Mark student as excused
  markExcused: async (
    id: string,
    reason: string,
  ): Promise<AttendanceRecord> => {
    const response = await api.put(`/attendance/${id}/excuse`, { reason });
    return response.data.data;
  },

  // Export attendance report
  exportReport: async (
    courseId: string,
    format: "csv" | "excel" | "pdf" = "excel",
  ): Promise<Blob> => {
    const response = await api.get(`/attendance/course/${courseId}/export`, {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  },

  // Get daily summary
  getDailySummary: async (date?: string) => {
    const response = await api.get("/attendance/daily-summary", {
      params: { date },
    });
    return response.data.data;
  },

  // Get live attendance (students currently in hall)
  getLiveAttendance: async (hallId: string) => {
    const response = await api.get(`/attendance/live/${hallId}`);
    return response.data.data;
  },

  // Get weekly summary
  getWeeklySummary: async (startDate?: string) => {
    const response = await api.get("/attendance/weekly-summary", {
      params: { startDate },
    });
    return response.data.data;
  },
};
