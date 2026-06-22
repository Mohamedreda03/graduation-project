import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { toast } from "sonner";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(params?: {
  role?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: userKeys.list(params ?? {}),
    queryFn: () => usersService.getAll(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding user");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof usersService.update>[1];
    }) => usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating user");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error deleting user");
    },
  });
}
