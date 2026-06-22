import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useStudent,
  useStudentAttendance,
  useStudentAttendanceSummary,
} from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Smartphone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Pencil,
  BookOpen,
  History,
  Activity,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatTime12h } from "@/lib/utils";

export function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = id ?? "";
  const navigate = useNavigate();

  const { data: student, isLoading: studentLoading, error: studentError } = useStudent(studentId);
  const { data: attendanceHistory, isLoading: historyLoading } = useStudentAttendance(studentId);
  const { data: summaryData, isLoading: summaryLoading } = useStudentAttendanceSummary(studentId);

  const isLoading = studentLoading || historyLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">عذراً، لم يتم العثور على الطالب</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          قد يكون الطالب تم حذفه أو أن المعرف البرمجي غير صحيح.
        </p>
        <Button onClick={() => navigate("/students")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة لقائمة الطلاب
        </Button>
      </div>
    );
  }

  const getStudentName = (s: typeof student) => {
    if (s.name && typeof s.name === "object") {
      return `${s.name.first} ${s.name.last}`;
    }
    return (s.name as string) || "غير متوفر";
  };

  const getSpecializationName = (s: typeof student) => {
    const dept = s.academicInfo?.specialization;
    return dept && typeof dept === "object" ? (dept as any).name : (dept as string) || "غير محدد";
  };

  // Safe access to summary array
  const summaryList = summaryData?.summary || [];
  
  // Overall attendance calculation
  const totalLecturesCount = summaryList.reduce((acc: number, item: any) => acc + (item.totalLectures || 0), 0);
  const attendedLecturesCount = summaryList.reduce((acc: number, item: any) => acc + (item.attendedLectures || 0), 0);
  const overallPercentage = totalLecturesCount > 0 
    ? Math.round((attendedLecturesCount / totalLecturesCount) * 100) 
    : 0;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/students">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary">
              تفاصيل الطالب
            </h1>
            <p className="text-muted-foreground font-medium">
              عرض البيانات الشخصية، الجهاز، وملخص حضور المقررات
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="rounded-xl h-11 px-6 gap-2">
            <Link to={`/students/${student._id}/edit`}>
              <Pencil className="h-4 w-4" />
              تعديل البيانات
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal and Device Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Info Card */}
          <Card className="rounded-3xl border-none shadow-sm bg-card/50 dark:bg-card/20 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                البيانات الشخصية والجامعية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">الاسم الكامل</label>
                  <p className="text-base font-black text-foreground">{getStudentName(student)}</p>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">الرقم الأكاديمي</label>
                  <p className="text-base font-bold text-primary font-mono">{student.studentId}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">البريد الإلكتروني</label>
                  <p className="text-sm font-medium text-foreground dir-ltr text-right">{student.email}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">رقم الهاتف</label>
                  <p className="text-sm font-medium text-foreground">{student.phone || "غير متوفر"}</p>
                </div>

                <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">التخصص</label>
                    <Badge variant="secondary" className="font-semibold">{getSpecializationName(student)}</Badge>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">الفرقه</label>
                    <Badge variant="outline" className="font-semibold">الفرقه {student.academicInfo?.level || "-"}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Info Card */}
          <Card className="rounded-3xl border-none shadow-sm bg-card/50 dark:bg-card/20 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                بيانات جهاز الطالب
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {student.device?.macAddress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">حالة الجهاز:</span>
                    <Badge variant={student.device?.isVerified ? "default" : "secondary"}>
                      {student.device?.isVerified ? "مسجل ومفعل" : "غير مفعل"}
                    </Badge>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">عنوان الـ MAC</label>
                    <p className="text-sm font-mono font-bold bg-muted/50 p-2 rounded-xl text-center dir-ltr text-foreground">
                      {student.device.macAddress}
                    </p>
                  </div>

                  {student.device?.deviceName && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">اسم الجهاز</span>
                      <p className="text-sm font-semibold text-foreground">{student.device.deviceName}</p>
                    </div>
                  )}

                  {student.device?.registeredAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>تاريخ تسجيل الجهاز: {new Date(student.device.registeredAt).toLocaleDateString("en-US")}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground space-y-2">
                  <Smartphone className="h-10 w-10 mx-auto opacity-30" />
                  <p className="font-semibold text-sm">لا يوجد جهاز مسجل حالياً</p>
                  <p className="text-xs">يجب على الطالب تسجيل الدخول من تطبيقه لربط الجهاز.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attendance Overview & Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Overall Attendance Rate Card */}
            <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    معدل الحضور العام
                  </p>
                  <h3 className="text-2xl font-black text-primary">
                    {overallPercentage}%
                  </h3>
                </div>
              </CardContent>
            </Card>

            {/* Enrolled Courses Count Card */}
            <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                  <BookOpen className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    المقررات المسجلة
                  </p>
                  <h3 className="text-2xl font-black">
                    {summaryList.length} مقررات
                  </h3>
                </div>
              </CardContent>
            </Card>

            {/* Total Lectures Count Card */}
            <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    المحاضرات المحضورة
                  </p>
                  <h3 className="text-2xl font-black">
                    {attendedLecturesCount} / {totalLecturesCount}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses Attendance Summary */}
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/10 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                حالة الحضور لكل مقرر
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {summaryList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>الطالب غير مسجل في أي مقررات حالياً.</p>
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-right">المقرر</TableHead>
                        <TableHead className="text-center">دكتور المادة</TableHead>
                        <TableHead className="text-center">المحاضرات المحضورة</TableHead>
                        <TableHead className="text-center">نسبة الحضور</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryList.map((item: any) => {
                        const pct = item.attendancePercentage || 0;
                        let pctColor = "text-rose-500 bg-rose-500/10";
                        if (pct >= 75) {
                          pctColor = "text-emerald-500 bg-emerald-500/10";
                        } else if (pct >= 50) {
                          pctColor = "text-amber-500 bg-amber-500/10";
                        }

                        return (
                          <TableRow key={item.course.id}>
                            <TableCell className="font-semibold">
                              <div>{item.course.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{item.course.code}</div>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground font-medium">
                              {typeof item.course.doctor === "object" && item.course.doctor
                                ? `${item.course.doctor.first || ""} ${item.course.doctor.last || ""}`.trim()
                                : item.course.doctor || "غير محدد"}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {item.attendedLectures} / {item.totalLectures}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`font-black rounded-lg ${pctColor}`} variant="outline">
                                {pct}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Attendance History */}
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/10 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                سجل الحضور التفصيلي
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!attendanceHistory || attendanceHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>لا يوجد سجل حضور مسجل للطالب حالياً.</p>
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">المقرر</TableHead>
                        <TableHead className="text-center">المحاضرة</TableHead>
                        <TableHead className="text-center">القاعة</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="text-center">مدة التواجد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceHistory.map((record: any) => {
                        const statusColors: Record<string, string> = {
                          present: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
                          absent: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20",
                          late: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20",
                        };
                        const statusArabic: Record<string, string> = {
                          present: "حاضر",
                          absent: "غائب",
                          late: "متأخر",
                        };

                        const dateObj = record.date ? new Date(record.date) : null;
                        const dateStr = dateObj ? dateObj.toLocaleDateString("en-US") : "-";

                        // Get lecture details
                        const daysArabic = [
                          "الأحد",
                          "الإثنين",
                          "الثلاثاء",
                          "الأربعاء",
                          "الخميس",
                          "الجمعة",
                          "السبت"
                        ];
                        const lectureDayNum = record.lecture?.dayOfWeek;
                        const lectureDay = typeof lectureDayNum === "number" ? daysArabic[lectureDayNum] : "";
                        const hasLectureTime = !!(record.lecture?.startTime && record.lecture?.endTime);

                        return (
                          <TableRow key={record._id}>
                            <TableCell className="font-semibold text-muted-foreground">
                              {dateStr}
                            </TableCell>
                            <TableCell className="font-bold">
                              {record.course?.name || "-"}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {lectureDay && <div className="font-bold text-sm mb-1">{lectureDay}</div>}
                              {hasLectureTime && (
                                <div className="text-muted-foreground font-mono flex items-center gap-1 justify-center" dir="ltr">
                                  <span dir="rtl">{formatTime12h(record.lecture.startTime)}</span>
                                  <span>-</span>
                                  <span dir="rtl">{formatTime12h(record.lecture.endTime)}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {record.hall?.name || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`font-black rounded-lg ${statusColors[record.status] || "bg-muted text-muted-foreground"}`} variant="outline">
                                {statusArabic[record.status] || record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm text-muted-foreground">
                              {record.durationMinutes !== undefined ? `${record.durationMinutes} دقيقة` : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
