import api from "@/lib/axios";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  User,
} from "@/types";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      // Use web login endpoint for doctor dashboard
      const response = await api.post<ApiResponse<LoginResponse>>(
        "/auth/web/login",
        data,
      );
      return response.data.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      if (error.message === "Network Error") {
        throw new Error("تعذر الاتصال بالسيرفر. يرجى التحقق من اتصالك بالإنترنت أو تشغيل السيرفر الخلفي.");
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    // Use web logout endpoint - will clear httpOnly cookies
    await api.post("/auth/web/logout");
  },

  // Refresh is handled automatically by axios interceptor
  refreshToken: async (): Promise<void> => {
    await api.post("/auth/web/refresh");
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post("/auth/change-password", data);
  },

  // Get current user - used for normal requests (will try refresh on 401)
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/users/me");
    return response.data.data;
  },

  // Get current user for initial auth check (won't try refresh on 401)
  getMeInitial: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/users/me", {
      _isInitialAuthCheck: true,
    } as never);
    return response.data.data;
  },
};
