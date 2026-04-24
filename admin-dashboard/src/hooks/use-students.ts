import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService } from "@/services/students.service";
import { toast } from "sonner";

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  attendance: (id: string) =>
    [...studentKeys.detail(id), "attendance"] as const,
  attendanceSummary: (id: string) =>
    [...studentKeys.detail(id), "attendance-summary"] as const,
  deviceRequests: ["device-requests"] as const,
  stats: () => [...studentKeys.all, "stats"] as const,
};

export function useStudentStats() {
  return useQuery({
    queryKey: studentKeys.stats(),
    queryFn: studentsService.getStats,
  });
}

export function useStudents(params?: {
  department?: string;
  level?: number;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: studentKeys.list(params ?? {}),
    queryFn: () => studentsService.getAll(params),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsService.getById(id),
    enabled: !!id,
  });
}

export function useStudentAttendance(id: string, courseId?: string) {
  return useQuery({
    queryKey: [...studentKeys.attendance(id), courseId],
    queryFn: () => studentsService.getAttendance(id, courseId),
    enabled: !!id,
  });
}

export function useStudentAttendanceSummary(id: string) {
  return useQuery({
    queryKey: studentKeys.attendanceSummary(id),
    queryFn: () => studentsService.getAttendanceSummary(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Student added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding student");
    },
  });
}

export function useCreateStudentsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentsService.createBulk,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success(`${data.created} students added successfully`);
      if (data.failed > 0) {
        toast.warning(`Failed to add ${data.failed} students`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding students");
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof studentsService.update>[1];
    }) => studentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Student updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating student");
    },
  });
}

// Device change requests
export function useDeviceRequests(status?: string) {
  return useQuery({
    queryKey: [...studentKeys.deviceRequests, status],
    queryFn: () => studentsService.getDeviceRequests(status),
  });
}

export function useApproveDeviceChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentsService.approveDeviceChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.deviceRequests });
      toast.success("Device change request approved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error approving request");
    },
  });
}

export function useRejectDeviceChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason?: string;
    }) => studentsService.rejectDeviceChange(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.deviceRequests });
      toast.success("Device change request rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error rejecting request");
    },
  });
}
