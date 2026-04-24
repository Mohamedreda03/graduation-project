import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "web",
  },
});

// Simple flag to prevent infinite refresh loops
let isRefreshing = false;

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip if no config, not 401, already retried, or auth endpoint
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    // Skip if already refreshing (prevent loops)
    if (isRefreshing) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call web refresh endpoint using plain axios (not our intercepted instance)
      await axios.post(
        `${API_URL}/auth/web/refresh`,
        {},
        {
          withCredentials: true,
          headers: { "X-Client-Type": "web" },
        },
      );

      // Wait for browser to update cookies
      await new Promise((r) => setTimeout(r, 100));

      // Retry with NEW axios call (fresh cookies)
      const retryResponse = await axios({
        method: originalRequest.method,
        url: `${API_URL}${originalRequest.url}`,
        data: originalRequest.data,
        params: originalRequest.params,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Client-Type": "web",
        },
      });

      return retryResponse;
    } catch {
      // Refresh failed - redirect to login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
