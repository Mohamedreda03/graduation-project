import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsService } from "@/services/doctors.service";
import { toast } from "sonner";

export const doctorKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...doctorKeys.lists(), filters] as const,
  details: () => [...doctorKeys.all, "detail"] as const,
  detail: (id: string) => [...doctorKeys.details(), id] as const,
  courses: (id: string) => [...doctorKeys.detail(id), "courses"] as const,
};

export function useDoctors(params?: {
  department?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: doctorKeys.list(params ?? {}),
    queryFn: () => doctorsService.getAll(params),
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => doctorsService.getById(id),
    enabled: !!id,
  });
}

export function useDoctorCourses(id: string) {
  return useQuery({
    queryKey: doctorKeys.courses(id),
    queryFn: () => doctorsService.getCourses(id),
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doctorsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
      toast.success("Doctor added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding doctor");
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof doctorsService.update>[1];
    }) => doctorsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
      toast.success("Doctor updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating doctor");
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doctorsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
      toast.success("Doctor deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error deleting doctor");
    },
  });
}

export function useAssignCourses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, courseIds }: { id: string; courseIds: string[] }) =>
      doctorsService.assignCourses(id, courseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
      toast.success("Courses assigned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error assigning courses");
    },
  });
}
