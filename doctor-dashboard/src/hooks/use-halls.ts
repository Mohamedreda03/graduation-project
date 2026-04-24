import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hallsService } from "@/services/halls.service";
import { toast } from "sonner";

export const hallKeys = {
  all: ["halls"] as const,
  lists: () => [...hallKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...hallKeys.lists(), filters] as const,
  details: () => [...hallKeys.all, "detail"] as const,
  detail: (id: string) => [...hallKeys.details(), id] as const,
  status: (id: string) => [...hallKeys.detail(id), "status"] as const,
};

export function useHalls(params?: {
  building?: string;
  floor?: number;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: hallKeys.list(params ?? {}),
    queryFn: () => hallsService.getAll(),
  });
}

export function useHall(id: string) {
  return useQuery({
    queryKey: hallKeys.detail(id),
    queryFn: () => hallsService.getById(id),
    enabled: !!id,
  });
}

export function useHallStatus(id: string) {
  return useQuery({
    queryKey: hallKeys.status(id),
    queryFn: () => hallsService.getStatus(id),
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useCreateHall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: hallsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallKeys.all });
      toast.success("Hall added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding hall");
    },
  });
}

export function useUpdateHall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof hallsService.update>[1];
    }) => hallsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallKeys.all });
      toast.success("Hall updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating hall");
    },
  });
}

export function useUpdateAccessPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof hallsService.updateAccessPoint>[1];
    }) => hallsService.updateAccessPoint(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallKeys.all });
      toast.success("Access point updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating access point");
    },
  });
}

export function useDeleteHall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: hallsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallKeys.all });
      toast.success("Hall deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error deleting hall");
    },
  });
}
