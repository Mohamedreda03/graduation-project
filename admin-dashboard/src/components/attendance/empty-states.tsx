import { FileSpreadsheet, BookOpen, User, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SelectCourseEmptyState() {
  return (
    <Card className="border-dashed rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card">
      <CardContent className="p-12 text-center">
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30 animate-pulse" />
        <h3 className="text-md font-bold text-foreground">
          يرجى اختيار مادة أكاديمية
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          استخدم خيارات التصفية بالأعلى لاختيار القسم، الفرقة، ثم المادة لعرض سجل الحضور والغياب الخاص بها.
        </p>
      </CardContent>
    </Card>
  );
}

export function NoStudentsEmptyState() {
  return (
    <Card className="border-dashed rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card">
      <CardContent className="p-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
        <h3 className="text-md font-bold text-foreground">
          لا يوجد طلاب مسجلون في هذه المادة
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          تأكد من إدراج الطلاب وتنسيقهم لشعبة المادة بنجاح
        </p>
      </CardContent>
    </Card>
  );
}

export function LoadingEmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-lg bg-card">
      <CardContent className="p-12 text-center">
        <Clock className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
        <h3 className="text-md font-bold text-foreground">{message}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          يرجى الانتظار لحين معالجة البيانات
        </p>
      </CardContent>
    </Card>
  );
}

export function SelectStudentEmptyState() {
  return (
    <Card className="border-dashed rounded-lg p-16 text-center h-[480px] flex flex-col justify-center items-center shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card">
      <User className="h-12 w-12 text-muted-foreground mb-3 opacity-30 animate-pulse" />
      <h3 className="text-md font-bold text-foreground">لم يتم تحديد أي طالب</h3>
      <p className="text-xs text-muted-foreground mt-1">
        يرجى البحث بالاسم أو الكود الأكاديمي في حقل البحث، ثم اختيار الطالب من القائمة لعرض سجلات الحضور الشاملة الخاصة به.
      </p>
    </Card>
  );
}

export function StudentLoadingEmptyState() {
  return (
    <Card className="rounded-lg p-16 text-center h-[480px] flex flex-col justify-center items-center bg-card">
      <Clock className="h-8 w-8 text-primary animate-spin mb-3" />
      <h3 className="text-md font-bold text-foreground">
        جاري تحميل سجل غياب الطالب...
      </h3>
      <p className="text-xs text-muted-foreground mt-1">
        يرجى الانتظار لحين معالجة المواد والمحاضرات
      </p>
    </Card>
  );
}

export function NoStudentCoursesEmptyState() {
  return (
    <Card className="border-dashed rounded-lg p-16 text-center h-[480px] flex flex-col justify-center items-center shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card">
      <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
      <h3 className="text-md font-bold text-foreground">
        الطالب غير مسجل في أي مقرر
      </h3>
      <p className="text-xs text-muted-foreground mt-1">
        تأكد من إضافة وتسكين الطالب في المواد الدراسية
      </p>
    </Card>
  );
}
