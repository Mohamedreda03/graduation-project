import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse, User } from "@/types";

interface CreateUserRequest {
  name: {
    first: string;
    last: string;
  };
  email: string;
  password?: string;
  role: "student" | "doctor" | "admin";
  adminRole?: "super_admin" | "dean" | "student_affairs" | "head_of_department";
  department?: string; // Specialization ID (optional)
  phone?: string;
}

export const usersService = {
  getAll: async (params?: {
    role?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>("/users", {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<ApiResponse<User>>("/users", data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<CreateUserRequest> & { isActive?: boolean },
  ): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
