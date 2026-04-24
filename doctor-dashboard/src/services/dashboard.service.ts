import api from "@/lib/axios";

interface DashboardStats {
  totalStudents: number;
  totalDoctors: number;
  totalCourses: number;
  totalDepartments: number;
  totalHalls: number;
  activeLectures: number;
  todayAttendance: {
    present: number;
    absent: number;
    rate: number;
  };
  weeklyTrend: Array<{
    day: string;
    present: number;
    absent: number;
    rate: number;
  }>;
  atRiskStudents: number;
  recentActivities: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

interface SystemHealth {
  database: "healthy" | "degraded" | "down";
  scheduler: "running" | "stopped";
  activeConnections: number;
  lastSync: string;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/dashboard/stats");
    return response.data.data;
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await api.get("/dashboard/health");
    return response.data.data;
  },

  getRecentActivities: async (limit?: number) => {
    const response = await api.get("/dashboard/activities", {
      params: { limit },
    });
    return response.data.data;
  },

  getQuickStats: async () => {
    const response = await api.get("/dashboard/quick-stats");
    return response.data.data;
  },
};
