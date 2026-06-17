import api from "@/lib/axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Specialization,
  CreateSpecializationRequest,
} from "@/types";

export const specializationsService = {
  getAll: async (): Promise<Specialization[]> => {
    const response = await api.get<ApiResponse<Specialization[]>>("/specializations");
    return response.data.data;
  },

  getById: async (id: string): Promise<Specialization> => {
    const response = await api.get<ApiResponse<Specialization>>(
      `/specializations/${id}`,
    );
    return response.data.data;
  },

  create: async (data: CreateSpecializationRequest): Promise<Specialization> => {
    const response = await api.post<ApiResponse<Specialization>>(
      "/specializations",
      data,
    );
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateSpecializationRequest>,
  ): Promise<Specialization> => {
    const response = await api.put<ApiResponse<Specialization>>(
      `/specializations/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/specializations/${id}`);
  },
};
