import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import {
  useSpecializations,
  useCourses,
  useStudents,
  useCourseMatrix,
  useStudentMatrix,
  useUpdateMatrixCell,
} from "@/hooks";

import { AttendancePageHeader } from "@/components/attendance/page-header";
import { AttendanceFilters } from "@/components/attendance/attendance-filters";
import { CourseMatrixTable } from "@/components/attendance/course-matrix-table";
import { StudentMatrixTable } from "@/components/attendance/student-matrix-table";
import {
  SelectCourseEmptyState,
  NoStudentsEmptyState,
  LoadingEmptyState,
  SelectStudentEmptyState,
  StudentLoadingEmptyState,
  NoStudentCoursesEmptyState,
} from "@/components/attendance/empty-states";

export function AttendancePage() {
  // Master View Mode: 'course' | 'student'
  const [viewMode, setViewMode] = useState<"course" | "student">("course");

  // Course Matrix Filters State
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedLectureDate, setSelectedLectureDate] = useState<string>("all");

  // Student Matrix Filters State
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStudentSearch(studentSearch);
    }, 1000);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Queries
  const { data: specializations } = useSpecializations();
  const { data: coursesData } = useCourses({ limit: 100 });
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    search: debouncedStudentSearch || undefined,
    specialization: selectedDept !== "all" ? selectedDept : undefined,
    level: selectedLevel !== "all" ? Number(selectedLevel) : undefined,
    limit: 50,
  });

  const { data: courseMatrix, isLoading: courseMatrixLoading } = useCourseMatrix(
    viewMode === "course" && selectedCourse !== "all" ? selectedCourse : ""
  );
  const { data: studentMatrix, isLoading: studentMatrixLoading } = useStudentMatrix(
    viewMode === "student" && selectedStudentId ? selectedStudentId : ""
  );

  const updateMatrixCellMutation = useUpdateMatrixCell();

  // Filters calculations
  const deptsList = specializations || [];
  const allCourses = coursesData?.data || [];

  const filteredCourses = allCourses.filter((course: any) => {
    if (
      selectedDept !== "all" &&
      course.specialization?._id !== selectedDept &&
      course.specialization !== selectedDept
    ) {
      return false;
    }
    if (selectedLevel !== "all" && String(course.level) !== selectedLevel) {
      return false;
    }
    return true;
  });

  // Reset course selection if it is filtered out
  useEffect(() => {
    if (
      selectedCourse !== "all" &&
      !filteredCourses.some((c) => c._id === selectedCourse)
    ) {
      setSelectedCourse("all");
    }
  }, [selectedDept, selectedLevel, filteredCourses]);

  // Reset lecture date selection when course changes
  useEffect(() => {
    setSelectedLectureDate("all");
  }, [selectedCourse]);

  // Reset selected student and search query when department or level filters change
  useEffect(() => {
    setSelectedStudentId(null);
    setStudentSearch("");
  }, [selectedDept, selectedLevel]);

  // Auto-select first student if available and none selected
  const studentsList = studentsData?.data || [];
  useEffect(() => {
    if (viewMode === "student" && studentsList.length > 0 && !selectedStudentId) {
      setSelectedStudentId(studentsList[0]._id);
    }
  }, [studentsList, viewMode]);

  // Cell status change action
  const handleMatrixCellChange = async (
    studentId: string,
    courseId: string,
    date: string,
    newStatus: "present" | "absent" | "late" | "excused"
  ) => {
    await updateMatrixCellMutation.mutateAsync({
      studentId,
      courseId,
      date,
      status: newStatus,
      reason: "تعديل مباشر من كشف الحضور الرقمي العام",
    });
  };

  // Export Course Matrix to Excel
  const handleExportCourseExcel = () => {
    if (!courseMatrix || courseMatrix.students.length === 0) {
      toast.error("لا توجد بيانات لتصديرها");
      return;
    }

    const { dates, students: rows, course } = courseMatrix;
    const data: any[] = [];
    const statusDetails: Record<string, string> = {
      present: "حاضر",
      absent: "غائب",
      late: "متأخر",
      excused: "عذر",
    };

    const headers = [
      "رقم الطالب",
      "اسم الطالب",
      ...dates.map((d: string) => d),
      "إجمالي الحضور",
      "إجمالي الغياب",
      "نسبة الحضور",
    ];
    data.push(headers);

    rows.forEach((student: any) => {
      const studentRow = [
        student.studentId,
        student.name,
        ...dates.map((d: string) => {
          const status = student.attendance[d]?.status || "absent";
          return statusDetails[status] || "غائب";
        }),
        student.stats.present,
        student.stats.absent,
        `${student.stats.rate}%`,
      ];
      data.push(studentRow);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "كشف حضور المادة");
    XLSX.writeFile(workbook, `كشف_حضور_${course.code || "المادة"}.xlsx`);
    toast.success("تم تصدير ملف الكشف بنجاح");
  };

  // Export Student Matrix to Excel
  const handleExportStudentExcel = () => {
    if (!studentMatrix || studentMatrix.courses.length === 0) {
      toast.error("لا توجد بيانات لتصديرها");
      return;
    }

    const { courses: rows, student } = studentMatrix;
    const data: any[] = [];
    const statusDetails: Record<string, string> = {
      present: "حاضر",
      absent: "غائب",
      late: "متأخر",
      excused: "عذر",
    };

    const maxLectures = Math.max(1, ...rows.map((r: any) => r.lectures.length));

    const headers = [
      "كود المادة",
      "المادة الدراسية",
      ...Array.from({ length: maxLectures }).map((_, i) => `محاضرة ${i + 1}`),
      "حاضر",
      "غائب",
      "نسبة الحضور",
    ];
    data.push(headers);

    rows.forEach((rowItem: any) => {
      const rowData = [
        rowItem.course.code,
        rowItem.course.name,
        ...Array.from({ length: maxLectures }).map((_, idx) => {
          const lec = rowItem.lectures[idx];
          if (!lec) return "—";
          const dateObj = new Date(lec.date);
          const formatted = dateObj.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
          });
          return `${statusDetails[lec.status] || "غائب"} (${formatted})`;
        }),
        rowItem.stats.present,
        rowItem.stats.absent,
        `${rowItem.stats.rate}%`,
      ];
      data.push(rowData);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "غياب الطالب الشامل");
    XLSX.writeFile(workbook, `كشف_غياب_الطالب_${student.studentId}.xlsx`);
    toast.success("تم تصدير ملف الطالب بنجاح");
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Page Header */}
      <AttendancePageHeader
        viewMode={viewMode}
        courseMatrix={courseMatrix}
        studentMatrix={studentMatrix}
        onExportCourse={handleExportCourseExcel}
        onExportStudent={handleExportStudentExcel}
      />

      {/* Filters */}
      <AttendanceFilters
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setStudentSearch("");
        }}
        selectedDept={selectedDept}
        onDeptChange={setSelectedDept}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        selectedCourse={selectedCourse}
        onCourseChange={setSelectedCourse}
        studentSearch={studentSearch}
        onStudentSearchChange={setStudentSearch}
        deptsList={deptsList}
        filteredCourses={filteredCourses}
        studentsList={studentsList}
        onSelectStudent={(studentId, studentName, studentIdNum) => {
          setViewMode("student");
          setSelectedStudentId(studentId);
          setStudentSearch(studentIdNum); // Use ID number so they are easily found in the sidebar
        }}
        selectedLectureDate={selectedLectureDate}
        onLectureDateChange={setSelectedLectureDate}
        lectureDates={courseMatrix?.dates || []}
      />

      {/* CASE 1: Course Matrix View */}
      {viewMode === "course" && (
        <>
          {selectedCourse === "all" ? (
            <SelectCourseEmptyState />
          ) : courseMatrixLoading ? (
            <LoadingEmptyState message="جاري تحميل كشف المناداة..." />
          ) : courseMatrix && courseMatrix.students.length === 0 ? (
            <NoStudentsEmptyState />
          ) : courseMatrix ? (
            <CourseMatrixTable
              courseMatrix={courseMatrix}
              studentSearch={studentSearch}
              selectedCourse={selectedCourse}
              onCellChange={handleMatrixCellChange}
              onSwitchToStudent={(studentId, studentName) => {
                setViewMode("student");
                setSelectedStudentId(studentId);
                setStudentSearch(studentName);
              }}
              selectedLectureDate={selectedLectureDate}
            />
          ) : null}
        </>
      )}

      {/* CASE 2: Student Matrix View */}
      {viewMode === "student" && (
        <div className="w-full">
          {!selectedStudentId ? (
            <SelectStudentEmptyState />
          ) : studentMatrixLoading ? (
            <StudentLoadingEmptyState />
          ) : studentMatrix && studentMatrix.courses.length === 0 ? (
            <NoStudentCoursesEmptyState />
          ) : studentMatrix ? (
            <StudentMatrixTable
              studentMatrix={studentMatrix}
              selectedCourse={selectedCourse}
              onCellChange={handleMatrixCellChange}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
