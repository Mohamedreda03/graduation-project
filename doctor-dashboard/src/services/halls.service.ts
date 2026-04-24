import api from "@/lib/axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Hall,
  CreateHallRequest,
  AccessPoint,
} from "@/types";

export const hallsService = {
  getAll: async (): Promise<Hall[]> => {
    const response = await api.get<ApiResponse<Hall[]>>("/halls");
    return response.data.data;
  },

  getById: async (id: string): Promise<Hall> => {
    const response = await api.get<ApiResponse<Hall>>(`/halls/${id}`);
    return response.data.data;
  },

  getStatus: async (
    id: string,
  ): Promise<{
    hall: Hall;
    currentLecture: unknown;
    connectedStudents: number;
  }> => {
    const response = await api.get(`/halls/${id}/status`);
    return response.data.data;
  },

  create: async (data: CreateHallRequest): Promise<Hall> => {
    const response = await api.post<ApiResponse<Hall>>("/halls", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateHallRequest>,
  ): Promise<Hall> => {
    const response = await api.put<ApiResponse<Hall>>(`/halls/${id}`, data);
    return response.data.data;
  },

  updateAccessPoint: async (
    id: string,
    data: Partial<AccessPoint>,
  ): Promise<Hall> => {
    const response = await api.put<ApiResponse<Hall>>(
      `/halls/${id}/access-point`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/halls/${id}`);
  },
};
