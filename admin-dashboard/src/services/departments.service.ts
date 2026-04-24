import api from "@/lib/axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Department,
  CreateDepartmentRequest,
} from "@/types";

export const departmentsService = {
  getAll: async (): Promise<Department[]> => {
    const response = await api.get<ApiResponse<Department[]>>("/departments");
    return response.data.data;
  },

  getById: async (id: string): Promise<Department> => {
    const response = await api.get<ApiResponse<Department>>(
      `/departments/${id}`,
    );
    return response.data.data;
  },

  create: async (data: CreateDepartmentRequest): Promise<Department> => {
    const response = await api.post<ApiResponse<Department>>(
      "/departments",
      data,
    );
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateDepartmentRequest>,
  ): Promise<Department> => {
    const response = await api.put<ApiResponse<Department>>(
      `/departments/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },
};
