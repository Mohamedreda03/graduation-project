import { User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const levelLabels: Record<number | string, string> = {
  "1": "إعدادي",
  "2": "الفرقة الأولى",
  "3": "الفرقة الثانية",
  "4": "الفرقة الثالثة",
  "5": "الفرقة الرابعة",
};

interface StudentSelectorProps {
  students: any[];
  selectedStudentId: string | null;
  onStudentSelect: (studentId: string) => void;
  isLoading: boolean;
}

export function StudentSelector({
  students,
  selectedStudentId,
  onStudentSelect,
  isLoading,
}: StudentSelectorProps) {
  return (
    <Card className="rounded-lg border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] h-[480px] flex flex-col bg-card overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3 border-b bg-muted/10">
        <CardTitle className="text-xs font-bold text-foreground">
          نتائج بحث الطلاب
        </CardTitle>
        <CardDescription className="text-[10px]">
          اختر الطالب لعرض كشف مواده
        </CardDescription>
      </CardHeader>
      <CardContent className="p-1.5 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              جاري تحميل الطلاب...
            </div>
          )}
          {!isLoading && students.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <User className="h-6 w-6 mx-auto mb-2 opacity-30" />
              لا توجد نتائج للبحث
            </div>
          )}
          <div className="space-y-1 p-0.5">
            {students.map((student: any) => {
              const isSelected = student._id === selectedStudentId;
              const fullName = student.name
                ? `${student.name.first} ${student.name.last}`
                : "غير معروف";

              return (
                <button
                  key={student._id}
                  onClick={() => onStudentSelect(student._id)}
                  className={`w-full text-right p-2.5 rounded-md border text-xs transition-all flex flex-col gap-0.5 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
                      : "border-border/50 bg-card hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold text-foreground truncate max-w-[130px]">
                      {fullName}
                    </span>
                    <span className="font-mono font-semibold text-[10px] text-muted-foreground shrink-0">
                      {student.studentId}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex justify-between mt-0.5 border-t border-dashed border-border/50 pt-1 w-full font-medium">
                    <span className="truncate max-w-[100px]">
                      القسم: {student.academicInfo?.specialization?.name || "عام"}
                    </span>
                    <span>
                      {levelLabels[student.academicInfo?.level] ||
                        student.academicInfo?.level}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
