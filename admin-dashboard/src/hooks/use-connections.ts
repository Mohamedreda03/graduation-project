import { useQuery } from "@tanstack/react-query";
import { connectionsService } from "@/services/connections.service";

export const connectionKeys = {
  all: ["connections"] as const,
  lists: () => [...connectionKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...connectionKeys.lists(), filters] as const,
};

export function useConnectionLogs(params?: {
  eventType?: string;
  macAddress?: string;
  hallId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: connectionKeys.list(params ?? {}),
    queryFn: () => connectionsService.getAll(params),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time logs
  });
}
