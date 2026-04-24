import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lecturesService } from "@/services/lectures.service";
import { toast } from "sonner";

export const lectureKeys = {
  all: ["lectures"] as const,
  lists: () => [...lectureKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...lectureKeys.lists(), filters] as const,
  details: () => [...lectureKeys.all, "detail"] as const,
  detail: (id: string) => [...lectureKeys.details(), id] as const,
  today: () => [...lectureKeys.all, "today"] as const,
  byDate: (date: string) => [...lectureKeys.all, "by-date", date] as const,
  weekSchedule: (filters: Record<string, unknown>) =>
    [...lectureKeys.all, "week-schedule", filters] as const,
};

export function useLectures(params?: {
  course?: string;
  hall?: string;
  doctor?: string;
  dayOfWeek?: number;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: lectureKeys.list(params ?? {}),
    queryFn: () => lecturesService.getAll(params),
  });
}

export function useLecture(id: string) {
  return useQuery({
    queryKey: lectureKeys.detail(id),
    queryFn: () => lecturesService.getById(id),
    enabled: !!id,
  });
}

export function useTodayLectures() {
  return useQuery({
    queryKey: lectureKeys.today(),
    queryFn: () => lecturesService.getToday(),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useLecturesByDate(date: string) {
  return useQuery({
    queryKey: lectureKeys.byDate(date),
    queryFn: () => lecturesService.getByDate(date),
    enabled: !!date,
  });
}

export function useWeekSchedule(courseId?: string, hallId?: string) {
  return useQuery({
    queryKey: lectureKeys.weekSchedule({ courseId, hallId }),
    queryFn: () => lecturesService.getWeekSchedule(courseId, hallId),
  });
}

export function useCreateLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lecturesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lectureKeys.all });
      toast.success("Lecture added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error adding lecture");
    },
  });
}

export function useScheduleRecurringLectures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lecturesService.scheduleRecurring,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: lectureKeys.all });
      toast.success(`${data.created} lectures scheduled successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error scheduling lectures");
    },
  });
}

export function useUpdateLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof lecturesService.update>[1];
    }) => lecturesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lectureKeys.all });
      toast.success("Lecture updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating lecture");
    },
  });
}

export function useDeleteLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lecturesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lectureKeys.all });
      toast.success("Lecture deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error deleting lecture");
    },
  });
}

export function useStartLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lecturesService.startLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lectureKeys.all });
      toast.success("Lecture started");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error starting lecture");
    },
  });
}

export function useEndLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lecturesService.endLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lectureKeys.all });
      toast.success("Lecture ended");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error ending lecture");
    },
  });
}

export function useCancelLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      lecturesService.cancelLecture(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lectureKeys.all });
      toast.success("Lecture cancelled");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error cancelling lecture");
    },
  });
}
