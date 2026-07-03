import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  BookOpen,
  Wifi,
  Play,
  Square,
  Printer,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { lecturesService, type WeekSchedule } from "@/services/lectures.service";
import type { Lecture } from "@/types";
import { formatTime12h } from "@/lib/utils";
import { useStartLecture, useEndLecture } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const baseDayNames = [
  { value: "6", label: "السبت" },
  { value: "0", label: "الأحد" },
  { value: "1", label: "الإثنين" },
  { value: "2", label: "الثلاثاء" },
  { value: "3", label: "الأربعاء" },
  { value: "4", label: "الخميس" },
];

const dayNames = [...baseDayNames, { value: "5", label: "الجمعة" }];

const PERIODS = [
  { id: 1, label: "الأولى", start: "09:00", end: "09:45", display: "9:45 - 9:00" },
  { id: 2, label: "الثانية", start: "09:45", end: "10:30", display: "10:30 - 9:45" },
  { id: 3, label: "الثالثة", start: "10:30", end: "11:15", display: "11:15 - 10:30" },
  { id: 4, label: "الرابعة", start: "11:15", end: "12:00", display: "12:00 - 11:15" },
  { id: 5, label: "الخامسة", start: "12:00", end: "12:45", display: "12:45 - 12:00" },
  { id: 6, label: "السادسة", start: "12:45", end: "13:30", display: "1:30 - 12:45" },
  { id: 7, label: "السابعة", start: "13:30", end: "14:15", display: "2:15 - 1:30" },
  { id: 8, label: "الثامنة", start: "14:15", end: "15:00", display: "3:00 - 2:15" },
];

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  scheduled: { label: "مجدولة", variant: "outline" },
  "in-progress": { label: "قيد التنفيذ", variant: "default" },
  completed: { label: "مكتملة", variant: "secondary" },
  cancelled: { label: "ملغاة", variant: "destructive" },
};

const levelNames: Record<string, string> = {
  "1": "الفرقة الإعدادية",
  "2": "الفرقة الأولى",
  "3": "الفرقة الثانية",
  "4": "الفرقة الثالثة",
  "5": "الفرقة الرابعة",
};

export function MySchedulePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().getDay();

  const doctorName = user?.name
    ? (typeof user.name === "object" ? `${user.name.first || ""} ${user.name.last || ""}`.trim() : user.name)
    : "";

  const { data: schedule, isLoading, error } = useQuery<WeekSchedule>({
    queryKey: ["my-schedule"],
    queryFn: () => lecturesService.getMySchedule(),
  });

  const startMutation = useStartLecture();
  const endMutation = useEndLecture();

  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const getCourseColorClass = (courseId: string) => {
    if (!courseId) return "bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    
    const palettes = [
      "bg-blue-50/90 hover:bg-blue-100/70 text-blue-950 dark:bg-blue-950/35 dark:text-blue-200",
      "bg-emerald-50/90 hover:bg-emerald-100/70 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-200",
      "bg-rose-50/90 hover:bg-rose-100/70 text-rose-950 dark:bg-rose-950/35 dark:text-rose-200",
      "bg-amber-50/90 hover:bg-amber-100/70 text-amber-950 dark:bg-amber-950/35 dark:text-amber-200",
      "bg-indigo-50/90 hover:bg-indigo-100/70 text-indigo-950 dark:bg-indigo-950/35 dark:text-indigo-200",
      "bg-teal-50/90 hover:bg-teal-100/70 text-teal-950 dark:bg-teal-950/35 dark:text-teal-200",
      "bg-violet-50/90 hover:bg-violet-100/70 text-violet-950 dark:bg-violet-950/35 dark:text-violet-200",
      "bg-orange-50/90 hover:bg-orange-100/70 text-orange-950 dark:bg-orange-950/35 dark:text-orange-200",
      "bg-purple-50/90 hover:bg-purple-100/70 text-purple-950 dark:bg-purple-950/35 dark:text-purple-200",
      "bg-cyan-50/90 hover:bg-cyan-100/70 text-cyan-950 dark:bg-cyan-950/35 dark:text-cyan-200",
    ];

    let hash = 0;
    for (let i = 0; i < courseId.length; i++) {
      hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  };

  const getPeriodSpan = (startTimeStr: string, endTimeStr: string) => {
    const parseMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const lectureStart = parseMin(startTimeStr);
    const lectureEnd = parseMin(endTimeStr);

    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < PERIODS.length; i++) {
      const periodStart = parseMin(PERIODS[i].start);
      const periodEnd = parseMin(PERIODS[i].end);

      if (startIdx === -1 && lectureStart >= periodStart && lectureStart < periodEnd) {
        startIdx = i;
      }
      if (lectureEnd > periodStart && lectureEnd <= periodEnd) {
        endIdx = i;
      }
    }

    if (startIdx === -1) {
      let minDiff = Infinity;
      for (let i = 0; i < PERIODS.length; i++) {
        const diff = Math.abs(parseMin(PERIODS[i].start) - lectureStart);
        if (diff < minDiff) {
          minDiff = diff;
          startIdx = i;
        }
      }
    }

    if (endIdx === -1) {
      let minDiff = Infinity;
      for (let i = 0; i < PERIODS.length; i++) {
        const diff = Math.abs(parseMin(PERIODS[i].end) - lectureEnd);
        if (diff < minDiff) {
          minDiff = diff;
          endIdx = i;
        }
      }
    }

    if (startIdx > endIdx) {
      const temp = startIdx;
      startIdx = endIdx;
      endIdx = temp;
    }

    return { startIdx, endIdx, span: endIdx - startIdx + 1 };
  };

  const handleStartLecture = async (lectureId: string) => {
    try {
      await startMutation.mutateAsync(lectureId);
      toast.success("تم بدء المحاضرة بنجاح وبدء رصد الحضور اللحظي");
      setIsDetailDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء بدء المحاضرة");
    }
  };

  const handleEndLecture = async (lectureId: string) => {
    try {
      await endMutation.mutateAsync(lectureId);
      toast.success("تم إنهاء المحاضرة ورصد الغياب بنجاح");
      setIsDetailDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنهاء المحاضرة");
    }
  };

  const handleLectureDetails = (lecture: any) => {
    setSelectedLecture(lecture);
    setIsDetailDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasLectures = schedule && Object.values(schedule).some((dayLectures: any) => dayLectures.length > 0);

  const renderDayRows = (dayValue: string, dayLabel: string) => {
    if (!schedule) return null;
    const dayLectures = schedule[parseInt(dayValue, 10)] || [];
    const isTodayRow = parseInt(dayValue, 10) === today;

    // Initialize 8 slots for periods
    const rowCells = Array(PERIODS.length).fill(null);

    dayLectures.forEach((lecture: Lecture) => {
      const { startIdx, endIdx, span } = getPeriodSpan(lecture.startTime, lecture.endTime);
      if (startIdx === -1 || endIdx === -1) return;

      for (let p = startIdx; p <= endIdx; p++) {
        if (p === startIdx) {
          rowCells[p] = { ...lecture, colSpan: span };
        } else {
          rowCells[p] = "skipped";
        }
      }
    });

    return (
      <tr key={dayValue} className="border-b border-slate-200 dark:border-slate-800 transition-colors group">
        <td
          className={`p-3 text-center font-bold border-l border-slate-200 dark:border-slate-800 align-middle w-24 text-[13px] ${
            isTodayRow
              ? "bg-primary/10 text-primary"
              : "bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200"
          }`}
        >
          {dayLabel}
          {isTodayRow && <span className="block text-[9px] text-primary mt-0.5">اليوم</span>}
        </td>

        {PERIODS.map((period, pIdx) => {
          const cell = rowCells[pIdx];

          if (cell === "skipped") return null;

          if (cell === null) {
            return (
              <td
                key={pIdx}
                className="border-l border-slate-200 dark:border-slate-800 align-middle hover:bg-slate-50 dark:hover:bg-slate-900/25 transition-colors p-3 text-center text-slate-300 dark:text-slate-700 font-semibold"
              >
                —
              </td>
            );
          }

          const courseId = typeof cell.course === "object" ? cell.course?._id : cell.course || "";
          const colorClass = getCourseColorClass(courseId);
          const courseName = typeof cell.course === "object" ? cell.course.name : "مادة غير معروفة";
          const hallName = typeof cell.hall === "object" ? cell.hall.name : "غير محدد";
          const hallBuilding = typeof cell.hall === "object" ? cell.hall.building : "";
          const typeVal = cell.lectureType || cell.type;
          const typeLabel = typeVal === "lecture" ? "محاضرة" : typeVal === "lab" ? "معمل" : "تمارين";

          // Extract specialization, level, departments
          const courseObj = typeof cell.course === "object" ? cell.course : null;
          const rawSpecialization = courseObj?.specialization
            ? (typeof courseObj.specialization === "object" ? courseObj.specialization.name : courseObj.specialization)
            : "";
          const specializationLabel = rawSpecialization
            ? (rawSpecialization.startsWith("كلية") ? rawSpecialization : `كلية ${rawSpecialization}`)
            : "";
          const levelLabel = courseObj?.level
            ? (levelNames[courseObj.level.toString()] || `الفرقة ${courseObj.level}`)
            : "";
          const departmentLabel = courseObj?.departments && courseObj.departments.length > 0
            ? courseObj.departments.join(" / ")
            : "";

          return (
            <td
              key={pIdx}
              colSpan={cell.colSpan}
              className={`p-3 text-center align-middle cursor-pointer transition-all duration-200 border-l border-slate-200 dark:border-slate-800 select-none ${colorClass}`}
              onClick={() => handleLectureDetails(cell)}
            >
              <div className="space-y-1.5 text-center font-medium leading-tight p-0.5">
                {/* Course Name */}
                <div className="font-extrabold text-[12px] text-slate-800 dark:text-slate-100">
                  {courseName}
                </div>

                {/* College / Specialization */}
                {specializationLabel && (
                  <div className="text-[9.5px] font-bold text-indigo-950 dark:text-indigo-200 bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded inline-block">
                    {specializationLabel}
                  </div>
                )}

                {/* Department & Level */}
                {(departmentLabel || levelLabel) && (
                  <div className="text-[9.5px] text-slate-700 dark:text-slate-300 font-semibold">
                    {levelLabel} {departmentLabel ? `· ${departmentLabel}` : ""}
                  </div>
                )}

                {/* Type & Hall */}
                <div className="text-[9.5px] text-slate-800 dark:text-slate-200 font-bold">
                  ({hallName}{hallBuilding ? ` - ${hallBuilding}` : ""}) · {typeLabel}
                </div>

                {/* Time */}
                <div className="text-[9px] text-slate-500 font-semibold font-mono" dir="ltr">
                  {formatTime12h(cell.startTime)} - {formatTime12h(cell.endTime)}
                </div>
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="space-y-6 pb-12 text-right animate-in fade-in duration-300" dir="rtl">
      {/* Print Helpers */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-grid-border {
            border-collapse: collapse !important;
            border: 2px solid black !important;
          }
          .print-grid-border th, .print-grid-border td {
            border: 1px solid black !important;
            color: black !important;
          }
        }
      `,
        }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <CalendarClock className="h-8 w-8 text-primary" />
            جدول المحاضرات الأسبوعي للأستاذ / {doctorName}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            عرض وتنظيم الجدول الأسبوعي الخاص بك مع تفاصيل المادة، الفرقة، الكلية، القسم والقاعة.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200 font-bold">
            <Printer className="h-4 w-4 ml-2" />
            طباعة الجدول
          </Button>
        </div>
      </div>

      {/* Main Timetable Display */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">جاري تحميل الجدول الأسبوعي...</div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-destructive">حدث خطأ أثناء تحميل الجدول الأسبوعي للمحاضرات.</p>
          </CardContent>
        </Card>
      ) : !hasLectures ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد محاضرات في جدولك</p>
              <p className="text-sm text-muted-foreground mt-1">
                لم يتم تسجيل أي محاضرات في جدولك الأسبوعي حتى الآن.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border border-slate-200/80 dark:border-slate-800/80 overflow-hidden print-full-width p-0 bg-card">
          {/* Official Printable Header */}
          <div className="hidden print:flex flex-row justify-between items-start border-b-2 border-slate-800 pb-4 p-6 bg-white text-black" dir="rtl">
            <div className="text-right space-y-1 text-[11px] font-bold">
              <div>وزارة التعليم العالي</div>
              <div>المعهد العالي للهندسة ببلبيس</div>
              <div>المنشأ بقرار وزاري رقم 1855</div>
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-[16px] font-extrabold">
                جدول المحاضرات الأسبوعي للأستاذ / {doctorName}
              </h2>
              <p className="text-[12px] font-semibold">
                للعام الجامعي 2026/2025 - الفصل الدراسي الثاني
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-black p-1.5 rounded-xl w-16 h-16 text-[9px] text-center font-bold">
              شعار
              <br />
              المعهد
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse print-grid-border text-slate-900 dark:text-slate-200">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 text-[12px] border-l border-slate-200 dark:border-slate-800 w-24">
                    اليوم
                  </th>
                  {PERIODS.map((period) => (
                    <th
                      key={period.id}
                      className="p-3 text-center border-l border-slate-200 dark:border-slate-800 w-32"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          الفترة {period.id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                          {period.display}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayNames.map((day) => renderDayRows(day.value, day.label))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md text-right" dir="rtl">
          {selectedLecture && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold border-b pb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>
                    {typeof selectedLecture.course === "object" ? selectedLecture.course.name : "تفاصيل المحاضرة"}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-xs mt-1">
                  كود المادة: {typeof selectedLecture.course === "object" ? selectedLecture.course.code : "غير معروف"}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">القاعة</span>
                    <span className="font-semibold text-sm flex items-center gap-1.5 justify-end">
                      {typeof selectedLecture.hall === "object" ? selectedLecture.hall.name : selectedLecture.hall}
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">نوع الحصة</span>
                    <span className="font-semibold text-sm">
                      {(selectedLecture.lectureType || selectedLecture.type) === "lecture"
                        ? "محاضرة نظري"
                        : (selectedLecture.lectureType || selectedLecture.type) === "lab"
                        ? "معمل عملي"
                        : "تمارين"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <span className="text-[10px] text-muted-foreground block mb-0.5">اليوم والتوقيت</span>
                  <span className="font-semibold text-sm flex items-center gap-1.5 justify-end">
                    {dayNames.find((d) => d.value === selectedLecture.dayOfWeek.toString())?.label}
                    &middot;
                    <span dir="ltr" className="font-mono">
                      {formatTime12h(selectedLecture.startTime)} - {formatTime12h(selectedLecture.endTime)}
                    </span>
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-[10px] text-muted-foreground block">الحالة الحالية</span>
                  <Badge variant={statusMap[selectedLecture.status || "scheduled"]?.variant}>
                    {statusMap[selectedLecture.status || "scheduled"]?.label}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {selectedLecture.status === "scheduled" && (
                    <Button
                      onClick={() => handleStartLecture(selectedLecture._id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <Play className="h-4 w-4 ml-2" />
                      بدء المحاضرة وتشغيل البلوتوث
                    </Button>
                  )}

                  {selectedLecture.status === "in-progress" && (
                    <>
                      <Button
                        asChild
                        className="w-full font-bold"
                      >
                        <Link to="/attendance/live">
                          <Wifi className="h-4 w-4 ml-2 animate-pulse text-emerald-400" />
                          عرض المراقبة البث المباشر
                        </Link>
                      </Button>

                      <Button
                        onClick={() => handleEndLecture(selectedLecture._id)}
                        variant="destructive"
                        className="w-full font-bold"
                      >
                        <Square className="h-4 w-4 ml-2" />
                        إنهاء المحاضرة ورصد الغياب
                      </Button>
                    </>
                  )}

                  {selectedLecture.status === "completed" && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full font-bold text-primary hover:bg-primary/5 border-primary/20"
                    >
                      <Link to={`/attendance?course=${typeof selectedLecture.course === "object" ? selectedLecture.course._id : selectedLecture.course}`}>
                        عرض كشف الحضور الرقمي للمادة
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="w-full"
                  >
                    إغلاق التفاصيل
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
