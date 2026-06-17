import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "@/services/courses.service";
import { toast } from "sonner";

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  students: (id: string) => [...courseKeys.detail(id), "students"] as const,
  lectures: (id: string) => [...courseKeys.detail(id), "lectures"] as const,
  attendanceStats: (id: string) =>
    [...courseKeys.detail(id), "attendance-stats"] as const,
};

export function useCourses(params?: {
  specialization?: string;
  doctor?: string;
  level?: number;
  semester?: number;
  academicYear?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: courseKeys.list(params ?? {}),
    queryFn: () => coursesService.getAll(params),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => coursesService.getById(id),
    enabled: !!id,
  });
}

export function useCourseStudents(id: string) {
  return useQuery({
    queryKey: courseKeys.students(id),
    queryFn: () => coursesService.getStudents(id),
    enabled: !!id,
  });
}

export function useCourseLectures(id: string) {
  return useQuery({
    queryKey: courseKeys.lectures(id),
    queryFn: () => coursesService.getLectures(id),
    enabled: !!id,
  });
}

export function useCourseAttendanceStats(id: string) {
  return useQuery({
    queryKey: courseKeys.attendanceStats(id),
    queryFn: () => coursesService.getAttendanceStats(id),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("تم إضافة الدورة بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطأ في إضافة الدورة");
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof coursesService.update>[1];
    }) => coursesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("تم تعديل الدورة بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطأ في تعديل الدورة");
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("تم حذف الدورة بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطأ في حذف الدورة");
    },
  });
}

export function useEnrollStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, studentIds }: { id: string; studentIds: string[] }) =>
      coursesService.enrollStudents(id, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("تم تسجيل الطلاب بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطأ في تسجيل الطلاب");
    },
  });
}

export function useUnenrollStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, studentIds }: { id: string; studentIds: string[] }) =>
      coursesService.unenrollStudents(id, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("تم إلغاء تسجيل الطلاب بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطأ في إلغاء تسجيل الطلاب");
    },
  });
}

export function useEnrollByLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, level }: { id: string; level: number }) =>
      coursesService.enrollByLevel(id, level),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success(`تم تسجيل ${data.enrolled} طالبًا بنجاح`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطأ في تسجيل الطلاب");
    },
  });
}
