import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { specializationsService } from "@/services/specializations.service";
import { toast } from "sonner";

export const specializationKeys = {
  all: ["specializations"] as const,
  lists: () => [...specializationKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...specializationKeys.lists(), filters] as const,
  details: () => [...specializationKeys.all, "detail"] as const,
  detail: (id: string) => [...specializationKeys.details(), id] as const,
};

export function useSpecializations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: specializationKeys.list(params ?? {}),
    queryFn: () => specializationsService.getAll(),
  });
}

export function useSpecialization(id: string) {
  return useQuery({
    queryKey: specializationKeys.detail(id),
    queryFn: () => specializationsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSpecialization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: specializationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specializationKeys.all });
      toast.success("Specialization added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding specialization");
    },
  });
}

export function useUpdateSpecialization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof specializationsService.update>[1];
    }) => specializationsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specializationKeys.all });
      toast.success("Specialization updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating specialization");
    },
  });
}

export function useDeleteSpecialization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: specializationsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specializationKeys.all });
      toast.success("Specialization deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error deleting specialization");
    },
  });
}
