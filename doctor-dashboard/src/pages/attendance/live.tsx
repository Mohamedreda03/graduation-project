import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio,
  Users,
  Clock,
  RefreshCw,
  Wifi,
  Search,
  Building,
  Activity,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatTime12h } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  useTodayLectures,
  useStartLecture,
  useEndLecture,
  useAttendanceByLecture,
  useUpdateAttendanceStatus,
  useMarkExcused,
  useUpdateMatrixCell,
} from "@/hooks";
import { toast } from "sonner";
import type { Lecture } from "@/types";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const levelLabels: Record<number | string, string> = {
  "1": "إعدادي",
  "2": "الفرقة الأولى",
  "3": "الفرقة الثانية",
  "4": "الفرقة الثالثة",
  "5": "الفرقة الرابعة",
};

const studentStatusMap: Record<string, { label: string; dot: string; text: string }> = {
  present: { label: "حاضر", dot: "bg-emerald-500", text: "text-emerald-600" },
  late: { label: "متأخر", dot: "bg-amber-500", text: "text-amber-600" },
  absent: { label: "غائب", dot: "bg-red-500", text: "text-red-600" },
  excused: { label: "عذر", dot: "bg-blue-500", text: "text-blue-600" },
  "in-progress": { label: "نشط", dot: "bg-emerald-500 motion-safe:animate-pulse", text: "text-emerald-600" },
  "in-progress-disconnected": { label: "غير متصل حالياً", dot: "bg-slate-400", text: "text-slate-500" },
};

function StatusDot({ status }: { status: string }) {
  const dotColor = studentStatusMap[status]?.dot || "bg-muted-foreground";
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${dotColor} shrink-0`} />
  );
}

interface StudentRowProps {
  student: any;
  record: any;
  entryTimeStr: string;
  exitTimeStr: string;
  currentStatus: string;
  livePresenceTime: number;
  livePresencePercentage: number;
  onPresence: () => void;
  onExcuse: () => void;
}

const StudentCardRow = memo(function StudentCardRow({
  student, record, entryTimeStr, exitTimeStr, currentStatus, livePresenceTime, livePresencePercentage, onPresence, onExcuse,
}: StudentRowProps) {
  const statusInfo = studentStatusMap[currentStatus] || studentStatusMap.absent;
  const isAbsent = currentStatus === "absent";

  return (
    <div className="border border-border/50 rounded-md p-3 bg-card space-y-2 text-right">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-foreground truncate">{student.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{student.studentId}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${statusInfo.text}`}>
          <StatusDot status={currentStatus} />
          {statusInfo.label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs">
        <div className="flex flex-col">
          <span className="text-muted-foreground font-medium">الدخول</span>
          <span className="font-mono font-semibold text-foreground" dir="ltr">{entryTimeStr}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground font-medium">الخروج</span>
          <span className="font-mono font-semibold text-foreground" dir="ltr">{exitTimeStr}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground font-medium">المدة</span>
          <span className="font-semibold text-foreground">{isAbsent ? "—" : `${livePresenceTime} د`}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground font-medium">النسبة</span>
          <span className="font-mono font-semibold text-foreground tabular-nums">{livePresencePercentage}%</span>
        </div>
      </div>
      {isAbsent && (
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 text-xs min-h-[44px] text-emerald-700 hover:bg-emerald-50 font-semibold rounded-md border-emerald-200 cursor-pointer" onClick={onPresence}>تحضير</Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs min-h-[44px] text-blue-700 hover:bg-blue-50 font-semibold rounded-md border-blue-200 cursor-pointer" onClick={onExcuse}>عذر</Button>
        </div>
      )}
    </div>
  );
});

const StudentTableRow = memo(function StudentTableRow({
  student, record, entryTimeStr, exitTimeStr, currentStatus, livePresenceTime, livePresencePercentage, onPresence, onExcuse,
}: StudentRowProps) {
  const statusInfo = studentStatusMap[currentStatus] || studentStatusMap.absent;
  const isAbsent = currentStatus === "absent";

  return (
    <tr className="hover:bg-muted/10 border-b border-border/50 transition-colors">
      <td className="py-2 px-2 text-right">
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{student.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{student.studentId}</span>
        </div>
      </td>
      <td className="py-2 px-2 text-center">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${statusInfo.text}`}>
          <StatusDot status={currentStatus} />
          {statusInfo.label}
        </span>
      </td>
      <td className="py-2 px-2 text-center font-mono text-xs font-medium text-foreground">{entryTimeStr}</td>
      <td className="py-2 px-2 text-center font-mono text-xs font-medium text-foreground">{exitTimeStr}</td>
      <td className="py-2 px-2 text-center text-xs text-muted-foreground font-medium">
        {isAbsent ? "—" : `${livePresenceTime} د`}
      </td>
      <td className="py-2 px-2 text-center">
        <span className="text-xs font-mono font-semibold text-foreground tabular-nums">{livePresencePercentage}%</span>
      </td>
      <td className="py-2 px-2 text-center">
        {isAbsent ? (
          <div className="flex items-center justify-center gap-1">
            <Button variant="outline" size="sm" className="text-[11px] h-7 px-2 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-md border-emerald-200 cursor-pointer" onClick={onPresence}>تحضير</Button>
            <Button variant="outline" size="sm" className="text-[11px] h-7 px-2 text-blue-700 hover:bg-blue-50 font-semibold rounded-md border-blue-200 cursor-pointer" onClick={onExcuse}>عذر</Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
});

function formatTime(date?: string | Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function LiveAttendancePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");

  // Local state to force re-render every 30 seconds to update live timers
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const todayStr = getLocalDateString();

  // Queries
  const { data: todayLectures, isLoading: lecturesLoading, refetch: refetchToday } = useTodayLectures();

  // Helper to check if lecture belongs to current doctor
  const isMyLecture = (lecture: Lecture): boolean => {
    if (lecture.doctor) {
      const doctorId =
        typeof lecture.doctor === "string" ? lecture.doctor : lecture.doctor._id;
      if (doctorId === user?._id) return true;
    }
    if (lecture.course && typeof lecture.course !== "string" && lecture.course.doctor) {
      const courseDoctorId =
        typeof lecture.course.doctor === "string"
          ? lecture.course.doctor
          : lecture.course.doctor._id;
      if (courseDoctorId === user?._id) return true;
    }
    return false;
  };

  const myLectures = useMemo(() => {
    return todayLectures?.filter(isMyLecture) || [];
  }, [todayLectures, user?._id]);

  const selectedLecture = useMemo(() => {
    return myLectures.find((l) => l._id === selectedLectureId) || null;
  }, [myLectures, selectedLectureId]);

  const { data: attendanceRecords, isLoading: attendanceLoading, refetch: refetchAttendance } = useAttendanceByLecture(
    selectedLectureId || ""
  );

  const startMutation = useStartLecture();
  const endMutation = useEndLecture();
  const updateStatusMutation = useUpdateAttendanceStatus();
  const excuseMutation = useMarkExcused();
  const updateMatrixCellMutation = useUpdateMatrixCell();

  // Trigger refetch every 5 seconds for active lecture
  useEffect(() => {
    if (!isSheetOpen || !selectedLectureId || selectedLecture?.status !== "in-progress") return;
    const interval = setInterval(() => {
      refetchAttendance();
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [isSheetOpen, selectedLectureId, selectedLecture?.status, refetchAttendance]);

  useEffect(() => {
    if (todayLectures) {
      setLastUpdate(new Date());
    }
  }, [todayLectures]);

  // Enrolled students calculation
  const enrolledStudents = useMemo(() => {
    if (!selectedLecture || !selectedLecture.course || typeof selectedLecture.course !== "object") return [];
    const course = selectedLecture.course as any;
    if (!course.students) return [];
    return course.students
      .map((student: any) => {
        if (typeof student === "string") {
          return {
            _id: student,
            name: "طالب غير معروف",
            studentId: "—",
          };
        }
        const fullName = student.name && typeof student.name === "object"
          ? `${student.name.first || ""} ${student.name.last || ""}`.trim()
          : student.name || "طالب غير معروف";
        return {
          _id: student._id || student,
          name: fullName,
          studentId: student.studentId || "—",
        };
      })
      .sort((a: any, b: any) => (a.studentId || "").localeCompare(b.studentId || ""));
  }, [selectedLecture]);

  const recordsByStudentId = useMemo(() => {
    const map = new Map<string, any>();
    if (!attendanceRecords) return map;
    for (const r of attendanceRecords) {
      const sid = r.student?._id?.toString() || r.student?.toString();
      if (sid) map.set(sid, r);
    }
    return map;
  }, [attendanceRecords]);

  // Statistics for the selected lecture
  const auditStats = useMemo(() => {
    if (!attendanceRecords) return { total: 0, present: 0, late: 0, absent: 0, excused: 0, rate: 0 };
    let present = 0, late = 0, excused = 0, inProgress = 0;
    for (const r of attendanceRecords) {
      if (r.status === "present") present++;
      else if (r.status === "late") late++;
      else if (r.status === "excused") excused++;
      else if (r.status === "in-progress") inProgress++;
    }
    const total = enrolledStudents.length;
    const absent = Math.max(0, total - present - late - excused - inProgress);
    const rate = total > 0 ? Math.round(((present + late + inProgress) / total) * 100) : 0;
    return { total, present, late, absent, excused, inProgress, rate };
  }, [attendanceRecords, enrolledStudents.length]);

  const timeBoundaries = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return { actualStart: "—", actualEnd: "—", doctorStart: "—", doctorEnd: "—" };
    }
    let earliest: Date | null = null;
    let latest: Date | null = null;

    for (const record of attendanceRecords) {
      if (record.sessions) {
        for (const session of record.sessions) {
          if (session.checkIn) {
            const d = new Date(session.checkIn);
            if (!earliest || d.getTime() < earliest.getTime()) earliest = d;
          }
          if (session.checkOut) {
            const d = new Date(session.checkOut);
            if (!latest || d.getTime() > latest.getTime()) latest = d;
          }
        }
      }
    }

    const actualStart = earliest ? formatTime(earliest) : "—";
    let actualEnd = "—";
    if (latest) {
      actualEnd = formatTime(latest);
    } else if (selectedLecture?.status === "in-progress") {
      actualEnd = "جارية حالياً";
    }

    const docStart = attendanceRecords.find((r: any) => r.lectureStartTime)?.lectureStartTime || selectedLecture?.actualStartTime;
    const docEnd = attendanceRecords.find((r: any) => r.lectureEndTime)?.lectureEndTime || selectedLecture?.actualEndTime;

    let doctorStart = "—";
    if (docStart) {
      doctorStart = formatTime(docStart);
    } else if (selectedLecture?.status === "in-progress") {
      doctorStart = earliest ? formatTime(earliest) : "لم يسجل";
    }

    let doctorEnd = "—";
    if (docEnd) {
      doctorEnd = formatTime(docEnd);
    } else if (selectedLecture?.status === "in-progress") {
      doctorEnd = "جارية حالياً";
    }

    return { actualStart, actualEnd, doctorStart, doctorEnd };
  }, [attendanceRecords, selectedLecture]);

  const filteredStudents = useMemo(() => {
    if (!auditSearchQuery.trim()) return enrolledStudents;
    const q = auditSearchQuery.toLowerCase().trim();
    return enrolledStudents.filter((s: any) => {
      const name = s.name ? s.name.toLowerCase() : "";
      const id = s.studentId ? s.studentId.toLowerCase() : "";
      return name.includes(q) || id.includes(q);
    });
  }, [enrolledStudents, auditSearchQuery]);

  const studentRows = useMemo(() => {
    const getLectureDuration = (startTime: string, endTime: string) => {
      if (!startTime || !endTime) return 45;
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      return endHour * 60 + endMin - (startHour * 60 + startMin);
    };

    return filteredStudents.map((student: any) => {
      const rec = recordsByStudentId.get(student._id?.toString()) || null;
      const firstSession = rec?.sessions?.[0];
      const lastSession = rec?.sessions?.[rec?.sessions?.length - 1];
      const entryTimeStr = firstSession?.checkIn
        ? formatTime(firstSession.checkIn)
        : "—";
      const exitTimeStr = lastSession?.checkOut
        ? formatTime(lastSession.checkOut)
        : rec?.status === "in-progress" ? "جاري" : "—";
      let currentStatus = rec ? rec.status : "absent";
      if (currentStatus === "in-progress" && lastSession && lastSession.checkOut) {
        currentStatus = "in-progress-disconnected";
      }

      // Calculate dynamic presence time for active connected sessions
      let livePresenceTime = rec?.totalPresenceTime || 0;
      if (rec?.status === "in-progress" && lastSession && !lastSession.checkOut) {
        const checkInTime = new Date(lastSession.checkIn).getTime();
        const currentTime = new Date().getTime();
        const elapsed = Math.round((currentTime - checkInTime) / (1000 * 60));
        livePresenceTime += Math.max(0, elapsed);
      }

      const totalDuration = selectedLecture
        ? getLectureDuration(selectedLecture.startTime, selectedLecture.endTime)
        : 45;

      const livePresencePercentage = totalDuration > 0
        ? Math.min(100, Math.round((livePresenceTime / totalDuration) * 100))
        : 0;

      return {
        student,
        record: rec,
        entryTimeStr,
        exitTimeStr,
        currentStatus,
        livePresenceTime,
        livePresencePercentage,
      };
    });
  }, [filteredStudents, recordsByStudentId, selectedLecture, tick]);

  const handleManualPresence = useCallback(async (student: any, record: any) => {
    if (!student) return;
    try {
      if (record && record._id) {
        await updateStatusMutation.mutateAsync({
          id: record._id,
          status: "present",
          reason: "تسجيل حضور يدوي من لوحة تحكم الأستاذ",
        });
      } else if (selectedLecture) {
        await updateMatrixCellMutation.mutateAsync({
          studentId: student._id,
          courseId: typeof selectedLecture.course === "object" ? selectedLecture.course._id : selectedLecture.course,
          date: todayStr,
          status: "present",
          reason: "تسجيل حضور يدوي من لوحة تحكم الأستاذ",
        });
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
      refetchAttendance();
    } catch (err) {
      toast.error("فشل تعديل حالة الطالب");
    }
  }, [updateStatusMutation, updateMatrixCellMutation, selectedLecture, todayStr, queryClient, refetchAttendance]);

  const handleManualExcuse = useCallback(async (student: any, record: any) => {
    if (!student) return;
    try {
      if (record && record._id) {
        await excuseMutation.mutateAsync({
          id: record._id,
          reason: "عذر طبي أو إذن معتمد من أستاذ المادة",
        });
      } else if (selectedLecture) {
        await updateMatrixCellMutation.mutateAsync({
          studentId: student._id,
          courseId: typeof selectedLecture.course === "object" ? selectedLecture.course._id : selectedLecture.course,
          date: todayStr,
          status: "excused",
          reason: "عذر طبي أو إذن معتمد من أستاذ المادة",
        });
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
      refetchAttendance();
    } catch (err) {
      toast.error("فشل تسجيل عذر الطالب");
    }
  }, [excuseMutation, updateMatrixCellMutation, selectedLecture, todayStr, queryClient, refetchAttendance]);

  const handleStartLecture = async (lectureId: string) => {
    try {
      await startMutation.mutateAsync(lectureId);
      toast.success("تم بدء المحاضرة بنجاح وبدء بث البلوتوث لرصد الحضور");
      refetchToday();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء بدء المحاضرة");
    }
  };

  const handleEndLecture = async (lectureId: string) => {
    try {
      await endMutation.mutateAsync(lectureId);
      toast.success("تم إنهاء المحاضرة وحفظ الغيابات بنجاح");
      refetchToday();
      if (selectedLectureId === lectureId) {
        refetchAttendance();
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنهاء المحاضرة");
    }
  };

  const handleRefreshAll = useCallback(() => {
    refetchToday();
  }, [refetchToday]);

  const timeStr = lastUpdate.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Filters search query for lectures
  const filteredLectures = useMemo(() => {
    return myLectures.filter((lecture: any) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const courseName = typeof lecture.course === "object" ? lecture.course.name.toLowerCase() : "";
        const courseCode = typeof lecture.course === "object" ? lecture.course.code.toLowerCase() : "";
        const hallName = typeof lecture.hall === "object" ? lecture.hall.name.toLowerCase() : "";
        if (!courseName.includes(s) && !courseCode.includes(s) && !hallName.includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [myLectures, searchTerm]);

  // Statistics calculation for my dashboard
  const kpiStats = useMemo(() => {
    const total = myLectures.length;
    const active = myLectures.filter((l) => l.status === "in-progress").length;
    const completed = myLectures.filter((l) => l.status === "completed").length;
    return { total, active, completed };
  }, [myLectures]);

  return (
    <div className="space-y-4 sm:space-y-5 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-md border border-primary/20 shrink-0">
            <Radio className="h-4 w-4 text-primary motion-safe:animate-pulse" />
          </div>
          <div className="min-w-0 text-right">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-[family-name:var(--font-heading)] truncate">
              غرفة الحضور المباشر للأستاذ
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              بدء المحاضرات وتتبع إشارات الاتصال والحضور والغياب للطلاب لحظة بلحظة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md border border-border min-h-[36px]">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground">توقيت النظام:</span>
            <span dir="ltr" className="font-mono font-semibold text-primary tabular-nums">{timeStr}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={lecturesLoading}
            className="gap-1.5 rounded-md min-h-[36px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${lecturesLoading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-2 sm:gap-3 grid-cols-3">
        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0 text-right">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">محاضرات اليوم</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{kpiStats.total}</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0 hidden sm:block">
              <Building className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0 text-right">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">محاضرات جارية</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">{kpiStats.active}</p>
            </div>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md shrink-0 hidden sm:block">
              <Wifi className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0 text-right">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">محاضرات منتهية</p>
              <p className="text-xl sm:text-2xl font-bold text-muted-foreground tabular-nums">{kpiStats.completed}</p>
            </div>
            <div className="p-2 bg-muted text-muted-foreground rounded-md shrink-0 hidden sm:block">
              <Activity className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Search */}
      <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث باسم المادة أو كود المادة أو القاعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 rounded-md border bg-background text-right w-full min-h-[36px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lectures List Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-[family-name:var(--font-heading)] flex items-center gap-2 text-foreground">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          محاضرات اليوم المتاحة للرصد ({filteredLectures.length})
        </h3>

        {filteredLectures.length === 0 && (
          <Card className="border-dashed rounded-md">
            <CardContent className="p-6 sm:p-8 text-center">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-bold text-foreground mb-1">لا توجد محاضرات اليوم</h4>
              <p className="text-xs text-muted-foreground">
                لم يتم إدراج محاضرات في جدولك لهذا اليوم، أو لا يوجد نتائج مطابقة للبحث.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredLectures.map((lecture: Lecture) => {
            const courseName = typeof lecture.course === "object" ? lecture.course.name : "غير معروف";
            const courseCode = typeof lecture.course === "object" ? lecture.course.code : "";
            const hallName = typeof lecture.hall === "object" ? lecture.hall.name : "غير معروف";
            const isLectureActive = lecture.status === "in-progress";
            const isCompleted = lecture.status === "completed";
            const isScheduled = lecture.status === "scheduled";

            return (
              <Card
                key={lecture._id}
                className={`overflow-hidden rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border transition-shadow ${
                  isLectureActive ? "border-emerald-500/30" : "border-border"
                }`}
              >
                <div className="bg-muted/40 px-3 sm:px-4 py-2 border-b border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span dir="ltr">{formatTime12h(lecture.startTime)}</span>
                    <span>{"\u2190"}</span>
                    <span dir="ltr">{formatTime12h(lecture.endTime)}</span>
                  </div>
                  {isLectureActive && (
                    <Badge className="bg-destructive text-destructive-foreground rounded-sm text-[10px] px-1.5 py-0 h-5 font-semibold shrink-0">بث مباشر</Badge>
                  )}
                  {isCompleted && (
                    <Badge className="bg-muted text-muted-foreground rounded-sm text-[10px] px-1.5 py-0 h-5 font-semibold shrink-0">انتهت</Badge>
                  )}
                  {isScheduled && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200/50 rounded-sm text-[10px] px-1.5 py-0 h-5 font-semibold shrink-0">مجدولة</Badge>
                  )}
                </div>

                <CardHeader className="pb-2 px-3 sm:px-4 pt-3 text-foreground text-right">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 text-right">
                      <CardTitle className="text-sm font-bold font-[family-name:var(--font-heading)]">{courseName}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                        {courseCode} &middot; {(lecture.level !== undefined && levelLabels[lecture.level]) || lecture.level || "غير محدد"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-border bg-background text-foreground font-semibold px-2 py-0.5 text-xs shrink-0">
                      {hallName}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 px-3 sm:px-4 pb-3 sm:pb-4 pt-0 text-right">
                  <div className="flex items-center gap-2 pt-2">
                    {isScheduled && (
                      <Button
                        size="sm"
                        className="w-full font-bold cursor-pointer rounded-md min-h-[36px] bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleStartLecture(lecture._id)}
                      >
                        <Play className="h-3.5 w-3.5 ml-1.5" />
                        بدء المحاضرة
                      </Button>
                    )}
                    {isLectureActive && (
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          size="sm"
                          className="w-full font-bold cursor-pointer rounded-md min-h-[36px]"
                          onClick={() => {
                            setSelectedLectureId(lecture._id);
                            setIsSheetOpen(true);
                          }}
                        >
                          <Wifi className="h-3.5 w-3.5 ml-1.5 animate-pulse text-emerald-400" />
                          فتح لوحة التحكم والتحضير
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full font-bold cursor-pointer rounded-md min-h-[36px]"
                          onClick={() => handleEndLecture(lecture._id)}
                        >
                          <Square className="h-3.5 w-3.5 ml-1.5" />
                          إنهاء المحاضرة وحفظ الغياب
                        </Button>
                      </div>
                    )}
                    {isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full font-bold cursor-pointer rounded-md min-h-[36px]"
                        onClick={() => {
                          setSelectedLectureId(lecture._id);
                          setIsSheetOpen(true);
                        }}
                      >
                        <Search className="h-3.5 w-3.5 ml-1.5" />
                        مراجعة كشف الحضور النهائي
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Control Sheet Drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-[720px] p-4 sm:p-5 text-right overflow-y-auto" dir="rtl">
          {selectedLecture && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-base sm:text-lg font-bold font-[family-name:var(--font-heading)] flex items-center gap-2 text-foreground">
                    {selectedLecture.status === "in-progress" ? (
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground shrink-0" />
                    )}
                    {selectedLecture.status === "in-progress" ? "مراقبة وإشراف الحضور اللحظي" : "سجل الحضور النهائي للمحاضرة"}
                  </SheetTitle>
                </div>
                <SheetDescription className="text-sm text-muted-foreground mt-1.5">
                  <strong className="text-foreground">
                    {typeof selectedLecture.course === "object" ? selectedLecture.course.name : "المادة"}
                  </strong>
                  &middot; {typeof selectedLecture.hall === "object" ? selectedLecture.hall.name : "القاعة"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-4 sm:mt-5">
                {/* Time stats */}
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 bg-muted/30 p-3 rounded-md border border-border text-right">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">التوقيت المجدول للمحاضرة</span>
                    <span className="text-xs font-mono font-semibold mt-0.5 text-foreground text-right block" dir="ltr">
                      {selectedLecture.startTime} - {selectedLecture.endTime}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">بداية البث الفعلي للمحاضرة</span>
                    <span className="text-xs font-mono font-semibold mt-0.5 text-primary text-right block" dir="ltr">
                      {timeBoundaries.doctorStart} - {timeBoundaries.doctorEnd}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">أول اتصال مسجل من طالب</span>
                    <span className={`text-xs font-mono font-semibold mt-0.5 text-right block ${timeBoundaries.actualStart !== "—" ? "text-emerald-600" : "text-muted-foreground"}`} dir="ltr">
                      {timeBoundaries.actualStart}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">آخر مغادرة مسجلة</span>
                    <span className={`text-xs font-mono font-semibold mt-0.5 text-right block ${timeBoundaries.actualEnd !== "—" && timeBoundaries.actualEnd !== "جارية حالياً" ? "text-primary" : timeBoundaries.actualEnd === "جارية حالياً" ? "text-emerald-600" : "text-muted-foreground"}`} dir="ltr">
                      {timeBoundaries.actualEnd}
                    </span>
                  </div>
                </div>

                {/* Statistics Mini Cards */}
                <div className="grid gap-1.5 sm:gap-2 grid-cols-3 sm:grid-cols-6">
                  <div className="bg-muted/30 border border-border p-2 rounded-md text-center">
                    <span className="text-[11px] text-muted-foreground font-medium block">إجمالي الطلاب</span>
                    <span className="text-base font-bold text-foreground tabular-nums mt-0.5 block">{auditStats.total}</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 p-2 rounded-md text-center">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">حاضر</span>
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 block">{auditStats.present + auditStats.inProgress}</span>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-2 rounded-md text-center">
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">متأخر</span>
                    <span className="text-base font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5 block">{auditStats.late}</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 p-2 rounded-md text-center">
                    <span className="text-[11px] text-red-700 dark:text-red-400 font-medium block">غائب</span>
                    <span className="text-base font-bold text-red-700 dark:text-red-400 tabular-nums mt-0.5 block">{auditStats.absent}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 p-2 rounded-md text-center">
                    <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium block">بعذر</span>
                    <span className="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums mt-0.5 block">{auditStats.excused}</span>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 p-2 rounded-md text-center">
                    <span className="text-[11px] text-primary font-medium block">النسبة</span>
                    <span className="text-base font-bold text-primary tabular-nums mt-0.5 block">{auditStats.rate}%</span>
                  </div>
                </div>

                {/* Student Records */}
                <div className="space-y-2 text-right">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="text-xs font-bold text-foreground">قائمة حضور وغياب الطلاب</h3>
                    <div className="relative w-full max-w-[200px]">
                      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="ابحث باسم الطالب أو رقم القيد..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        className="pr-8 rounded-md border bg-background text-right font-medium text-xs min-h-[36px] w-full"
                      />
                    </div>
                  </div>

                  {attendanceLoading ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      جاري التحميل ورصد سجل الحضور...
                    </div>
                  ) : studentRows.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      لا توجد سجلات مطابقة للبحث
                    </div>
                  ) : (
                    <>
                      {/* Desktop: Table view */}
                      <div className="hidden sm:block w-full overflow-auto rounded-md border border-border bg-card max-h-[400px]" dir="rtl">
                        <table className="w-full border-collapse text-right text-xs">
                          <thead className="bg-muted/40 sticky top-0 z-10 border-b border-border">
                            <tr>
                              <th className="text-right font-bold p-2 text-xs text-muted-foreground">الطالب</th>
                              <th className="text-center font-bold p-2 text-xs text-muted-foreground">الحالة</th>
                              <th className="text-center font-bold p-2 text-xs text-muted-foreground">الدخول</th>
                              <th className="text-center font-bold p-2 text-xs text-muted-foreground">الخروج</th>
                              <th className="text-center font-bold p-2 text-xs text-muted-foreground">المدة</th>
                              <th className="text-center font-bold p-2 text-xs text-muted-foreground">النسبة</th>
                              <th className="text-center font-bold p-2 text-xs text-muted-foreground">الإجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentRows.map((row: any) => (
                              <StudentTableRow
                                key={row.student._id}
                                student={row.student}
                                record={row.record}
                                entryTimeStr={row.entryTimeStr}
                                exitTimeStr={row.exitTimeStr}
                                currentStatus={row.currentStatus}
                                livePresenceTime={row.livePresenceTime}
                                livePresencePercentage={row.livePresencePercentage}
                                onPresence={() => handleManualPresence(row.student, row.record)}
                                onExcuse={() => handleManualExcuse(row.student, row.record)}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile: Card-list view */}
                      <div className="sm:hidden space-y-2 max-h-[400px] overflow-y-auto">
                        {studentRows.map((row: any) => (
                          <StudentCardRow
                            key={row.student._id}
                            student={row.student}
                            record={row.record}
                            entryTimeStr={row.entryTimeStr}
                            exitTimeStr={row.exitTimeStr}
                            currentStatus={row.currentStatus}
                            livePresenceTime={row.livePresenceTime}
                            livePresencePercentage={row.livePresencePercentage}
                            onPresence={() => handleManualPresence(row.student, row.record)}
                            onExcuse={() => handleManualExcuse(row.student, row.record)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
