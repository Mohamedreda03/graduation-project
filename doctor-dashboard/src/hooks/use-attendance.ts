import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance.service";
import { toast } from "sonner";

export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...attendanceKeys.lists(), filters] as const,
  details: () => [...attendanceKeys.all, "detail"] as const,
  detail: (id: string) => [...attendanceKeys.details(), id] as const,
  byLecture: (lectureId: string) =>
    [...attendanceKeys.all, "lecture", lectureId] as const,
  byCourse: (courseId: string) =>
    [...attendanceKeys.all, "course", courseId] as const,
  byStudent: (studentId: string) =>
    [...attendanceKeys.all, "student", studentId] as const,
  courseReport: (courseId: string) =>
    [...attendanceKeys.all, "course-report", courseId] as const,
  atRisk: (courseId?: string) =>
    [...attendanceKeys.all, "at-risk", courseId] as const,
  dailySummary: (date?: string) =>
    [...attendanceKeys.all, "daily-summary", date] as const,
  weeklySummary: (startDate?: string) =>
    [...attendanceKeys.all, "weekly-summary", startDate] as const,
};

export function useAttendance(params?: {
  lecture?: string;
  course?: string;
  student?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: attendanceKeys.list(params ?? {}),
    queryFn: () => attendanceService.getAll(params),
  });
}

export function useAttendanceById(id: string) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => attendanceService.getById(id),
    enabled: !!id,
  });
}

export function useAttendanceByLecture(lectureId: string) {
  return useQuery({
    queryKey: attendanceKeys.byLecture(lectureId),
    queryFn: () => attendanceService.getByLecture(lectureId),
    enabled: !!lectureId,
  });
}

export function useAttendanceByCourse(courseId: string) {
  return useQuery({
    queryKey: attendanceKeys.byCourse(courseId),
    queryFn: () => attendanceService.getByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useAttendanceByStudent(studentId: string) {
  return useQuery({
    queryKey: attendanceKeys.byStudent(studentId),
    queryFn: () => attendanceService.getByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useCourseAttendanceReport(courseId: string) {
  return useQuery({
    queryKey: attendanceKeys.courseReport(courseId),
    queryFn: () => attendanceService.getCourseReport(courseId),
    enabled: !!courseId,
  });
}

export function useAtRiskStudents(courseId?: string) {
  return useQuery({
    queryKey: attendanceKeys.atRisk(courseId),
    queryFn: () => attendanceService.getAtRiskStudents(courseId),
  });
}

export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: attendanceKeys.dailySummary(date),
    queryFn: () => attendanceService.getDailySummary(date),
  });
}

export function useWeeklySummary(startDate?: string) {
  return useQuery({
    queryKey: attendanceKeys.weeklySummary(startDate),
    queryFn: () => attendanceService.getWeeklySummary(startDate),
  });
}

export function useUpdateAttendanceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "present" | "absent" | "late" | "excused";
      reason?: string;
    }) => attendanceService.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success("تم تحديث حالة الحضور");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث حالة الحضور");
    },
  });
}

export function useMarkExcused() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      attendanceService.markExcused(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success("تم تسجيل الغياب بعذر");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل العذر");
    },
  });
}

export function useExportAttendanceReport() {
  return useMutation({
    mutationFn: ({
      courseId,
      format,
    }: {
      courseId: string;
      format: "csv" | "excel" | "pdf";
    }) => attendanceService.exportReport(courseId, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-report.${variables.format === "excel" ? "xlsx" : variables.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("تم تصدير التقرير بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تصدير التقرير");
    },
  });
}
