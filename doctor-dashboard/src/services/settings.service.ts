import api from "@/lib/axios";
import type { ApiResponse, Setting } from "@/types";

export const settingsService = {
  getAll: async (): Promise<Setting[]> => {
    const response = await api.get<ApiResponse<Setting[]>>("/settings");
    return response.data.data;
  },

  getByKey: async (key: string): Promise<Setting> => {
    const response = await api.get<ApiResponse<Setting>>(`/settings/${key}`);
    return response.data.data;
  },

  update: async (
    key: string,
    value: string | number | boolean,
  ): Promise<Setting> => {
    const response = await api.put<ApiResponse<Setting>>(`/settings/${key}`, {
      value,
    });
    return response.data.data;
  },

  updateBulk: async (
    settings: Array<{ key: string; value: string | number | boolean }>,
  ): Promise<Setting[]> => {
    const response = await api.put<ApiResponse<Setting[]>>("/settings/bulk", {
      settings,
    });
    return response.data.data;
  },

  // Get current academic year settings
  getAcademicSettings: async () => {
    const response = await api.get("/settings/academic");
    return response.data.data;
  },

  // Get attendance settings
  getAttendanceSettings: async () => {
    const response = await api.get("/settings/attendance");
    return response.data.data;
  },

  // Reset to defaults
  resetToDefaults: async (): Promise<Setting[]> => {
    const response = await api.post<ApiResponse<Setting[]>>("/settings/reset");
    return response.data.data;
  },
};
