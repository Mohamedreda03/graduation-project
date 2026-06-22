import { useState } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceFiltersProps {
  viewMode: "course" | "student";
  onViewModeChange: (mode: "course" | "student") => void;
  selectedDept: string;
  onDeptChange: (dept: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedCourse: string;
  onCourseChange: (course: string) => void;
  studentSearch: string;
  onStudentSearchChange: (search: string) => void;
  deptsList: any[];
  filteredCourses: any[];
  studentsList?: any[];
  onSelectStudent?: (studentId: string, studentName: string, studentIdNum: string) => void;
  selectedLectureDate?: string;
  onLectureDateChange?: (date: string) => void;
  lectureDates?: string[];
}

export function AttendanceFilters({
  viewMode,
  onViewModeChange,
  selectedDept,
  onDeptChange,
  selectedLevel,
  onLevelChange,
  selectedCourse,
  onCourseChange,
  studentSearch,
  onStudentSearchChange,
  deptsList,
  filteredCourses,
  studentsList = [],
  onSelectStudent,
  selectedLectureDate = "all",
  onLectureDateChange,
  lectureDates = [],
}: AttendanceFiltersProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <Card className="rounded-lg border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] relative">
      <CardHeader className="pb-2 pt-3 px-4 border-b bg-muted/10 rounded-t-lg">
        <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
          <Search className="h-4 w-4 text-primary" />
          <span>أدوات البحث وتصفية البيانات</span>
        </CardTitle>
        <CardDescription className="text-xs">
          فرز وتصفية سجلات حضور الطلاب حسب المقررات، المستويات الأكاديمية، والأقسام
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 gap-3 flex flex-wrap items-end">
        {/* Student Search Input */}
        <div className="flex-1 min-w-[200px] space-y-1 text-right relative">
          <label className="text-[11px] font-bold text-muted-foreground">
            البحث عن طالب (بالاسم أو الكود)
          </label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث باسم الطالب أو الكود..."
              value={studentSearch}
              onChange={(e) => {
                onStudentSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pr-9 rounded-md border bg-background text-right w-full font-semibold h-9 py-1"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && studentSearch.trim().length > 0 && studentsList && studentsList.length > 0 && (
            <div className="absolute right-0 left-0 top-[60px] bg-card border border-border rounded-md shadow-md z-50 max-h-[220px] overflow-y-auto p-1 space-y-0.5">
              {studentsList.map((student: any) => {
                const fullName = student.name
                  ? `${student.name.first} ${student.name.last}`
                  : "غير معروف";
                return (
                  <button
                    key={student._id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents input blur before click
                    }}
                    onClick={() => {
                      if (onSelectStudent) {
                        onSelectStudent(student._id, fullName, student.studentId);
                      }
                      setShowSuggestions(false);
                    }}
                    className="w-full text-right p-2 hover:bg-muted/40 rounded-sm transition-colors cursor-pointer flex flex-col gap-0.5 border-b border-border/10 last:border-b-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-foreground truncate">{fullName}</span>
                      <span className="font-mono text-[10px] text-muted-foreground font-semibold shrink-0">{student.studentId}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground/80 flex justify-between w-full font-medium">
                      <span>القسم: {student.academicInfo?.specialization?.name || "عام"}</span>
                      <span>الفرقة: {student.academicInfo?.level || "غير محدد"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Master Selector */}
        <div className="w-full sm:w-[220px] space-y-1 text-right">
          <label className="text-[11px] font-bold text-muted-foreground">
            طريقة عرض الكشف
          </label>
          <Select dir="rtl" value={viewMode} onValueChange={onViewModeChange}>
            <SelectTrigger className="rounded-md border bg-background text-right font-semibold h-9 py-1 px-3 w-full">
              <SelectValue placeholder="اختر العرض" />
            </SelectTrigger>
            <SelectContent dir="rtl" className="rounded-md">
              <SelectItem value="course">📑 كشف حضور وغياب مادة دراسية</SelectItem>
              <SelectItem value="student">
                👤 كشف غياب طالب محدد عبر المواد
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div className="w-full sm:w-[180px] space-y-1 text-right">
          <label className="text-[11px] font-bold text-muted-foreground">
            الكلية / القسم
          </label>
          <Select dir="rtl" value={selectedDept} onValueChange={onDeptChange}>
            <SelectTrigger className="rounded-md border bg-background text-right h-9 py-1 px-3 w-full">
              <SelectValue placeholder="جميع الأقسام" />
            </SelectTrigger>
            <SelectContent dir="rtl" className="rounded-md">
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {deptsList.map((dept: any) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Academic Level */}
        <div className="w-full sm:w-[130px] space-y-1 text-right">
          <label className="text-[11px] font-bold text-muted-foreground">
            الفرقة الدراسية
          </label>
          <Select dir="rtl" value={selectedLevel} onValueChange={onLevelChange}>
            <SelectTrigger className="rounded-md border bg-background text-right h-9 py-1 px-3 w-full">
              <SelectValue placeholder="جميع الفرق" />
            </SelectTrigger>
            <SelectContent dir="rtl" className="rounded-md">
              <SelectItem value="all">جميع الفرق</SelectItem>
              <SelectItem value="1">إعدادي</SelectItem>
              <SelectItem value="2">الفرقة الأولى</SelectItem>
              <SelectItem value="3">الفرقة الثانية</SelectItem>
              <SelectItem value="4">الفرقة الثالثة</SelectItem>
              <SelectItem value="5">الفرقة الرابعة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course */}
        <div className="w-full sm:w-[220px] space-y-1 text-right">
          <label className="text-[11px] font-bold text-muted-foreground">
            المادة الدراسية
          </label>
          <Select dir="rtl" value={selectedCourse} onValueChange={onCourseChange}>
            <SelectTrigger className="rounded-md border bg-background text-right font-semibold h-9 py-1 px-3 w-full">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent dir="rtl" className="rounded-md">
              <SelectItem value="all">
                اختر المادة لتفعيل الكشف
              </SelectItem>
              {filteredCourses.map((course: any) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lecture Date Filter (Conditional) */}
        {viewMode === "course" && selectedCourse !== "all" && lectureDates && lectureDates.length > 0 && (
          <div className="w-full sm:w-[180px] space-y-1 text-right">
            <label className="text-[11px] font-bold text-muted-foreground">
              تحديد محاضرة معينة
            </label>
            <Select dir="rtl" value={selectedLectureDate} onValueChange={onLectureDateChange}>
              <SelectTrigger className="rounded-md border bg-background text-right h-9 py-1 px-3 w-full">
                <SelectValue placeholder="جميع المحاضرات" />
              </SelectTrigger>
              <SelectContent dir="rtl" className="rounded-md">
                <SelectItem value="all">جميع المحاضرات</SelectItem>
                {lectureDates.map((dateStr: string, idx: number) => {
                  const dateObj = new Date(dateStr);
                  const formatted = dateObj.toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                  });
                  return (
                    <SelectItem key={dateStr} value={dateStr}>
                      محاضرة {idx + 1} ({formatted})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
