import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsService } from "@/services/departments.service";
import { toast } from "sonner";

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...departmentKeys.lists(), filters] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
};

export function useDepartments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: departmentKeys.list(params ?? {}),
    queryFn: () => departmentsService.getAll(),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding department");
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof departmentsService.update>[1];
    }) => departmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating department");
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error deleting department");
    },
  });
}
