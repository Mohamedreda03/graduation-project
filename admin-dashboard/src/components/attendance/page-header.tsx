import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  viewMode: "course" | "student";
  courseMatrix?: any;
  studentMatrix?: any;
  onExportCourse: () => void;
  onExportStudent: () => void;
}

export function AttendancePageHeader({
  viewMode,
  courseMatrix,
  studentMatrix,
  onExportCourse,
  onExportStudent,
}: PageHeaderProps) {
  const hasData =
    (viewMode === "course" && courseMatrix && courseMatrix.students.length > 0) ||
    (viewMode === "student" && studentMatrix && studentMatrix.courses.length > 0);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold text-primary">
          كشف الحضور الأكاديمي الرقمي
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          مخطط غياب تفاعلي يحاكي الكشوفات الورقية لعرض وتعديل الحضور للمواد أو للطلاب
        </p>
      </div>

      {hasData && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-md shadow-sm gap-1.5 h-9 flex-shrink-0"
          onClick={viewMode === "course" ? onExportCourse : onExportStudent}
        >
          <Download className="h-4 w-4" />
          <span>
            {viewMode === "course"
              ? "تصدير كشف المادة Excel"
              : "تصدير كشف الطالب Excel"}
          </span>
        </Button>
      )}
    </div>
  );
}
