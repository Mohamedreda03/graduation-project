import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
  health: ["dashboard", "health"] as const,
  activities: (limit?: number) => ["dashboard", "activities", limit] as const,
  quickStats: ["dashboard", "quick-stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: dashboardKeys.health,
    queryFn: () => dashboardService.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRecentActivities(limit?: number) {
  return useQuery({
    queryKey: dashboardKeys.activities(limit),
    queryFn: () => dashboardService.getRecentActivities(limit),
  });
}

export function useQuickStats() {
  return useQuery({
    queryKey: dashboardKeys.quickStats,
    queryFn: () => dashboardService.getQuickStats(),
    refetchInterval: 60000,
  });
}
