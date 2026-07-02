import { useState } from "react";
import {
  Activity,
  Search,
  Clock,
  CheckCircle,
  Play,
  Calendar,
  Users,
} from "lucide-react";
import { useLecturesByDate } from "@/hooks/use-lectures";
import { useAttendanceByLecture } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime12h } from "@/lib/utils";

// Helper to get local YYYY-MM-DD date string
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function AttendanceMonitoringPage() {
  // Date selection for completed lectures auditing
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString);
  const [selectedLecture, setSelectedLecture] = useState<any | null>(null);
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");

  // Load lectures for the selected date
  const { data: dateLectures, isLoading: lecturesLoading } = useLecturesByDate(selectedDate);
  const lectures = dateLectures || [];

  // Load attendance records for the selected lecture
  const { data: attendanceRecordsData, isLoading: attendanceLoading } = useAttendanceByLecture(
    selectedLecture?._id || "",
    selectedDate
  );
  const attendanceRecords = attendanceRecordsData || [];

  // Filter student records based on search
  const filteredRecords = attendanceRecords.filter((record: any) => {
    if (!auditSearchQuery.trim()) return true;
    const query = auditSearchQuery.toLowerCase().trim();
    const student = record.student;
    const studentName = student
      ? typeof student.name === "object"
        ? `${student.name.first || ""} ${student.name.last || ""}`.toLowerCase()
        : student.name.toLowerCase()
      : "";
    const studentId = student?.studentId?.toLowerCase() || "";
    return studentName.includes(query) || studentId.includes(query);
  });

  // Calculate stats for the selected lecture
  const auditTotalEnrolled = attendanceRecords.length;
  const auditPresentCount = attendanceRecords.filter((r: any) => r.status === "present").length;
  const auditLateCount = attendanceRecords.filter((r: any) => r.status === "late").length;
  const auditAbsentCount = attendanceRecords.filter((r: any) => r.status === "absent").length;
  const auditExcusedCount = attendanceRecords.filter((r: any) => r.status === "excused").length;
  const auditActiveCount = attendanceRecords.filter((r: any) => r.status === "in-progress").length;

  const auditAttendanceRate = auditTotalEnrolled > 0
    ? Math.round(((auditPresentCount + auditLateCount + auditActiveCount) / auditTotalEnrolled) * 100)
    : 0;

  // Calculate actual network-level start & end times based on student sessions
  let actualStartTime = "—";
  let actualEndTime = "—";
  let earliestCheckIn: Date | null = null;
  let latestCheckOut: Date | null = null;

  for (const record of attendanceRecords) {
    if (record.sessions) {
      for (const session of record.sessions) {
        if (session.checkIn) {
          const checkInDate = new Date(session.checkIn);
          if (!earliestCheckIn || checkInDate.getTime() < earliestCheckIn.getTime()) {
            earliestCheckIn = checkInDate;
          }
        }
        if (session.checkOut) {
          const checkOutDate = new Date(session.checkOut);
          if (!latestCheckOut || checkOutDate.getTime() > latestCheckOut.getTime()) {
            latestCheckOut = checkOutDate;
          }
        }
      }
    }
  }

  if (earliestCheckIn) {
    actualStartTime = earliestCheckIn.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (latestCheckOut) {
    actualEndTime = latestCheckOut.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (selectedLecture?.status === "in-progress") {
    actualEndTime = "جارية حالياً";
  } else if (selectedLecture?.status === "completed" && selectedLecture.endTime) {
    actualEndTime = selectedLecture.endTime;
  }

  // Calculate Doctor's actual start and end times
  let doctorStartTimeStr = "—";
  let doctorEndTimeStr = "—";

  const firstRecordWithStartTime = attendanceRecords.find((r: any) => r.lectureStartTime);
  const firstRecordWithEndTime = attendanceRecords.find((r: any) => r.lectureEndTime);

  const docStartTime = firstRecordWithStartTime?.lectureStartTime || selectedLecture?.actualStartTime;
  const docEndTime = firstRecordWithEndTime?.lectureEndTime || selectedLecture?.actualEndTime;

  if (docStartTime) {
    doctorStartTimeStr = new Date(docStartTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (selectedLecture?.status === "in-progress" || selectedLecture?.status === "completed") {
    doctorStartTimeStr = earliestCheckIn 
      ? earliestCheckIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "لم يسجل";
  }

  if (docEndTime) {
    doctorEndTimeStr = new Date(docEndTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (selectedLecture?.status === "completed") {
    doctorEndTimeStr = latestCheckOut
      ? latestCheckOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : selectedLecture.endTime;
  } else if (selectedLecture?.status === "in-progress") {
    doctorEndTimeStr = "جارية حالياً";
  }

  const activeSessions = lectures.filter((l: any) => l.status === "in-progress").length;
  const completedSessions = lectures.filter((l: any) => l.status === "completed").length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Page Header */}
      <div className="space-y-1.5 pb-3 border-b border-border/50">
        <h1 className="text-2xl font-bold font-amiri text-foreground flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-primary flex-shrink-0" />
          المتابعة الشاملة للمحاضرات
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          شاشة مراقبة العمليات الفورية لمتابعة توقيتات المحاضرات الجارية والمكتملة للطلاب
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 max-w-2xl">
        <Card className="rounded-md border border-border/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.08)] transition-shadow">
          <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-start justify-between space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground">
              {selectedDate === getLocalDateString() ? "المحاضرات النشطة" : "المحاضرات النشطة في التاريخ"}
            </CardTitle>
            <Play className="h-4 w-4 text-emerald-500 animate-pulse flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-foreground">{activeSessions}</div>
            <p className="text-[10px] text-muted-foreground mt-1">جاري تسجيل الحضور</p>
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.08)] transition-shadow">
          <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-start justify-between space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground">
              {selectedDate === getLocalDateString() ? "المحاضرات المكتملة" : "المحاضرات المكتملة في التاريخ"}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-foreground">{completedSessions}</div>
            <p className="text-[10px] text-muted-foreground mt-1">من أصل {lectures.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Date Selector Filter */}
        <Card className="rounded-md border border-border/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card">
          <CardContent className="p-3 flex items-end justify-between gap-3">
            {selectedLecture && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedLecture(null);
                  setAuditSearchQuery("");
                }}
                className="text-xs h-9 px-3 rounded-md font-bold hover:bg-muted cursor-pointer flex-shrink-0"
              >
                إلغاء التحديد
              </Button>
            )}

            <div className="w-full sm:w-[220px] space-y-1.5 text-right ml-auto">
              <label className="text-[11px] font-bold text-muted-foreground">
                التاريخ
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedLecture(null);
                  }}
                  className="pr-9 rounded-md border bg-background text-right font-medium text-xs h-9 py-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lectures Table */}
        <Card className="rounded-md border border-border/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden bg-card">
          <CardHeader className="pb-2 pt-3 px-3 border-b border-border/50 bg-muted/5">
            <CardTitle className="text-sm font-bold text-foreground">
              المحاضرات المجدولة
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              متابعة حالة وتوقيتات المحاضرات
            </CardDescription>
          </CardHeader>
          <div className="w-full overflow-auto rounded-b-md bg-card max-h-[380px]" dir="rtl">
            <table className="w-full border-collapse text-right text-xs">
              <thead className="bg-muted/60 sticky top-0 z-10 border-b border-border/50">
                <tr>
                  <th className="text-right font-bold p-2.5 text-xs">المادة</th>
                  <th className="text-center font-bold p-2.5 text-xs">الأستاذ</th>
                  <th className="text-center font-bold p-2.5 text-xs">القاعة</th>
                  <th className="text-center font-bold p-2.5 text-xs">الوقت</th>
                  <th className="text-center font-bold p-2.5 text-xs">الحالة</th>
                  <th className="text-center font-bold p-2.5 text-xs">الإجراء</th>
                </tr>
              </thead>
              <TableBody>
                {lecturesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : lectures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      لا توجد محاضرات مجدولة
                    </TableCell>
                  </TableRow>
                ) : (
                  lectures.map((lecture: any) => {
                    const courseName = lecture.course?.name || "—";
                    const courseCode = lecture.course?.code || "";
                    const doctorName = lecture.doctor
                      ? typeof lecture.doctor.name === "object"
                        ? `${lecture.doctor.name.first} ${lecture.doctor.name.last}`
                        : lecture.doctor.name
                      : "—";

                    let statusBadge = "bg-muted text-muted-foreground border-muted-foreground/30";
                    let statusText = "مجدولة";
                    if (lecture.status === "in-progress") {
                      statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200/50 animate-pulse";
                      statusText = "جارية";
                    } else if (lecture.status === "completed") {
                      statusBadge = "bg-blue-50 text-blue-700 border-blue-200/40";
                      statusText = "مكتملة";
                    } else if (lecture.status === "cancelled") {
                      statusBadge = "bg-red-50 text-red-700 border-red-200/40";
                      statusText = "ملغاة";
                    }

                    const isSelected = selectedLecture?._id === lecture._id;

                    return (
                      <TableRow key={lecture._id} className={`hover:bg-muted/3 border-b border-border/40 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                        <TableCell className="py-2 px-2.5 text-right">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-foreground">{courseName}</span>
                            {courseCode && <span className="font-mono text-[9px] text-muted-foreground">{courseCode}</span>}
                          </div>
                        </TableCell>

                        <TableCell className="py-2 px-2.5 text-center text-xs text-foreground font-medium">
                          {doctorName}
                        </TableCell>

                        <TableCell className="py-2 px-2.5 text-center text-xs text-foreground font-medium">
                          {lecture.hall?.name || "—"}
                        </TableCell>

                        <TableCell className="py-2 px-2.5 text-center font-mono text-xs text-foreground" dir="ltr">
                          {lecture.startTime}–{lecture.endTime}
                        </TableCell>

                        <TableCell className="py-2 px-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-bold ${statusBadge}`}
                          >
                            {statusText}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-2 px-2.5 text-center">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedLecture(null);
                              } else {
                                setSelectedLecture(lecture);
                                setAuditSearchQuery("");
                              }
                            }}
                            className="text-[10px] h-7 px-2 rounded-sm font-bold cursor-pointer"
                          >
                            {isSelected ? "إغلاق" : "تفاصيل"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </table>
          </div>
        </Card>

        {/* Audit Details Panel */}
        {selectedLecture && (
          <Card className="rounded-md border border-border/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden bg-card mt-4">
            <CardHeader className="pb-3 pt-3 px-3 border-b border-border/50 bg-muted/5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedLecture(null);
                    setAuditSearchQuery("");
                  }}
                  className="text-xs h-8 px-2 font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  إغلاق
                </Button>

                <div className="text-right ml-auto">
                  <CardTitle className="text-base font-bold text-foreground font-amiri flex items-center gap-2 mb-1 justify-end">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    تفاصيل الحضور: {selectedLecture.course?.name || "—"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedLecture.course?.code} · {selectedLecture.hall?.name} · {selectedLecture.doctor ? (typeof selectedLecture.doctor.name === "object" ? `${selectedLecture.doctor.name.first} ${selectedLecture.doctor.name.last}` : selectedLecture.doctor.name) : "—"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              {/* Time stats */}
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-muted/30 p-2.5 rounded-md border border-border/50">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-muted-foreground font-bold">التوقيت المجدول للمقرر</span>
                  <span className="text-xs font-mono font-bold mt-0.5 text-foreground text-right block" dir="ltr">
                    {formatTime12h(selectedLecture.startTime)} - {formatTime12h(selectedLecture.endTime)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-muted-foreground font-bold">تسجيل الدكتور الفعلي (بدء / إنهاء)</span>
                  <span className="text-xs font-mono font-bold mt-0.5 text-primary text-right block" dir="ltr">
                    {doctorStartTimeStr !== "—" && doctorEndTimeStr !== "—" ? (
                      `${doctorStartTimeStr} - ${doctorEndTimeStr}`
                    ) : doctorStartTimeStr !== "—" ? (
                      doctorStartTimeStr
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-muted-foreground font-bold">أول اتصال طالب بالقاعة</span>
                  <span className={`text-xs font-mono font-bold mt-0.5 text-right block ${earliestCheckIn ? "text-emerald-600" : "text-muted-foreground"}`} dir="ltr">
                    {actualStartTime}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-muted-foreground font-bold">آخر مغادرة طالب للقاعة</span>
                  <span className={`text-xs font-mono font-bold mt-0.5 text-right block ${latestCheckOut ? "text-blue-600" : "text-muted-foreground"}`} dir="ltr">
                    {actualEndTime}
                  </span>
                </div>
              </div>

              {/* Statistics Mini Cards */}
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
                <div className="bg-muted/30 dark:bg-muted/10 border border-border/50 dark:border-border/30 p-2 rounded-md text-center">
                  <span className="text-[10px] text-muted-foreground font-bold block">إجمالي</span>
                  <span className="text-lg font-bold text-foreground mt-0.5 block">{auditTotalEnrolled}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/30 p-2 rounded-md text-center">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">حاضر</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">{auditPresentCount}</span>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/30 p-2 rounded-md text-center">
                  <span className="text-[10px] text-red-700 dark:text-red-400 font-bold block">
                    {selectedLecture?.status === "in-progress" ? "غير متصل" : "غائب"}
                  </span>
                  <span className="text-lg font-bold text-red-700 dark:text-red-400 mt-0.5 block">{auditAbsentCount}</span>
                </div>
                <div className="bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/15 p-2 rounded-md text-center">
                  <span className="text-[10px] text-primary dark:text-primary/90 font-bold block">النسبة</span>
                  <span className="text-lg font-bold text-primary dark:text-primary mt-0.5 block">{auditAttendanceRate}%</span>
                </div>
              </div>

              {/* Filter and Table */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-xs font-bold text-foreground">سجلات الطلاب</h3>
                  <div className="relative w-full sm:w-[240px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="ابحث..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="pr-8 rounded-md border bg-background text-right font-medium text-[11px] h-8 py-1 w-full"
                    />
                  </div>
                </div>

                {attendanceLoading ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    جاري التحميل...
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    لا توجد سجلات
                  </div>
                ) : (
                  <div className="w-full overflow-auto rounded-md border bg-card max-h-[320px]" dir="rtl">
                    <table className="w-full border-collapse text-right text-xs">
                      <thead className="bg-muted/60 sticky top-0 z-10 border-b border-border/50">
                        <tr>
                          <th className="text-right font-bold p-2 text-xs">الطالب</th>
                          <th className="text-center font-bold p-2 text-xs">الحالة</th>
                          <th className="text-center font-bold p-2 text-xs">الدخول</th>
                          <th className="text-center font-bold p-2 text-xs">الخروج</th>
                          <th className="text-center font-bold p-2 text-xs">المدة</th>
                          <th className="text-center font-bold p-2 text-xs">النسبة</th>
                        </tr>
                      </thead>
                      <TableBody>
                        {filteredRecords.map((rec: any) => {
                          const student = rec.student;
                          const studentName = student
                            ? typeof student.name === "object"
                              ? `${student.name.first} ${student.name.last}`
                              : student.name
                            : "—";
                          const studentId = student?.studentId || "—";

                          const firstSession = rec.sessions?.[0];
                          const lastSession = rec.sessions?.[rec.sessions.length - 1];

                          const entryTimeStr = firstSession?.checkIn
                            ? new Date(firstSession.checkIn).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—";

                          const exitTimeStr = lastSession?.checkOut
                            ? new Date(lastSession.checkOut).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : rec.status === "in-progress"
                            ? "جاري"
                            : "—";

                          let statusBadge = "bg-muted text-muted-foreground border-muted-foreground/30";
                          let statusText = "—";

                          if (rec.status === "present") {
                            statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                            statusText = "حاضر";
                          } else if (rec.status === "late") {
                            statusBadge = "bg-amber-50 text-amber-700 border-amber-200/50";
                            statusText = "متأخر";
                          } else if (rec.status === "absent") {
                            statusBadge = "bg-red-50 text-red-700 border-red-200/40";
                            statusText = selectedLecture?.status === "in-progress" ? "غير متصل" : "غائب";
                          } else if (rec.status === "excused") {
                            statusBadge = "bg-blue-50 text-blue-700 border-blue-200/40";
                            statusText = "عذر";
                          } else if (rec.status === "in-progress") {
                            statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200/50 animate-pulse";
                            statusText = "نشط";
                          }

                          return (
                            <TableRow key={rec._id} className="hover:bg-muted/3 border-b border-border/40">
                              <TableCell className="py-1.5 px-2 text-right">
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs text-foreground">{studentName}</span>
                                  <span className="font-mono text-[9px] text-muted-foreground">{studentId}</span>
                                </div>
                              </TableCell>

                              <TableCell className="py-1.5 px-2 text-center">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-bold ${statusBadge}`}
                                >
                                  {statusText}
                                </Badge>
                              </TableCell>

                              <TableCell className="py-1.5 px-2 text-center font-mono text-[10px] font-semibold text-foreground">
                                <span dir="ltr">{entryTimeStr}</span>
                              </TableCell>

                              <TableCell className="py-1.5 px-2 text-center font-mono text-[10px] font-semibold text-foreground">
                                <span dir="ltr">{exitTimeStr}</span>
                              </TableCell>

                              <TableCell className="py-1.5 px-2 text-center text-xs text-muted-foreground font-semibold">
                                {rec.status === "absent" ? "—" : `${rec.totalPresenceTime || 0} د`}
                              </TableCell>

                              <TableCell className="py-1.5 px-2 text-center">
                                <span className="text-[10px] font-mono font-bold text-foreground">
                                  {rec.presencePercentage || 0}%
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
