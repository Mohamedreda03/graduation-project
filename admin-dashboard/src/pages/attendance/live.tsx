import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLiveMonitoring,
  useUpdateAttendanceStatus,
  useMarkExcused,
  useAttendanceByLecture,
  useUpdateMatrixCell,
} from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Radio,
  Users,
  Clock,
  RefreshCw,
  Wifi,
  Search,
  Building,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime12h } from "@/lib/utils";

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
    <div className="border border-border/50 rounded-md p-3 bg-card space-y-2">
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
          <span className="text-xs text-muted-foreground">{"\u2014"}</span>
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
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
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

  const { data: monitoringData, isLoading: monitoringLoading, refetch: refetchMonitoring } = useLiveMonitoring();

  const { data: attendanceRecordsData, isLoading: attendanceLoading } = useAttendanceByLecture(
    selectedLectureId || "",
    todayStr
  );

  const updateStatusMutation = useUpdateAttendanceStatus();
  const excuseMutation = useMarkExcused();
  const updateMatrixCellMutation = useUpdateMatrixCell();

  const stats = monitoringData?.stats || {
    activeLecturesCount: 0,
    connectedStudentsCount: 0,
    occupiedHallsCount: 0,
    overallAttendanceRate: 0,
  };

  const departments = monitoringData?.departments || [];
  const lectures = monitoringData?.lectures || [];

  const selectedLecture = useMemo(
    () => lectures.find((l: any) => l._id === selectedLectureId) || null,
    [lectures, selectedLectureId]
  );

  useEffect(() => {
    if (monitoringData) {
      setLastUpdate(new Date());
    }
  }, [monitoringData]);

  const enrolledStudents = useMemo(() => {
    if (!selectedLecture) return [];
    return [...(selectedLecture.presentStudents || []), ...(selectedLecture.absentStudents || [])]
      .sort((a: any, b: any) => (a.studentId || "").localeCompare(b.studentId || ""));
  }, [selectedLecture]);

  const attendanceRecords = attendanceRecordsData || [];

  const recordsByStudentId = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of attendanceRecords) {
      const sid = r.student?._id?.toString() || r.student?.toString();
      if (sid) map.set(sid, r);
    }
    return map;
  }, [attendanceRecords]);

  const auditStats = useMemo(() => {
    let present = 0, late = 0, excused = 0, inProgress = 0;
    for (const r of attendanceRecords) {
      if (r.status === "present") present++;
      else if (r.status === "late") late++;
      else if (r.status === "excused") excused++;
      else if (r.status === "in-progress") inProgress++;
    }
    const total = enrolledStudents.length;
    const absent = total - present - late - excused - inProgress;
    const rate = total > 0 ? Math.round(((present + late + inProgress) / total) * 100) : 0;
    return { total, present, late, absent, excused, inProgress, rate };
  }, [attendanceRecords, enrolledStudents.length]);

  const timeBoundaries = useMemo(() => {
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

    const actualStart = earliest ? formatTime(earliest) : "\u2014";
    let actualEnd = "\u2014";
    if (latest) {
      actualEnd = formatTime(latest);
    } else if (selectedLecture?.status === "in-progress") {
      actualEnd = "جارية حالياً";
    }

    const docStart = attendanceRecords.find((r: any) => r.lectureStartTime)?.lectureStartTime || selectedLecture?.actualStartTime;
    const docEnd = attendanceRecords.find((r: any) => r.lectureEndTime)?.lectureEndTime || selectedLecture?.actualEndTime;

    let doctorStart = "\u2014";
    if (docStart) {
      doctorStart = formatTime(docStart);
    } else if (selectedLecture?.status === "in-progress") {
      doctorStart = earliest ? formatTime(earliest) : "لم يسجل";
    }

    let doctorEnd = "\u2014";
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

  const filteredLectures = useMemo(() => {
    return lectures.filter((lecture: any) => {
      if (selectedDept !== "all" && lecture.course.specialization !== selectedDept) {
        const deptName = departments.find((d: any) => d._id === selectedDept)?.name;
        if (lecture.course.specialization !== deptName) return false;
      }

      if (selectedLevel !== "all" && String(lecture.level) !== selectedLevel) {
        return false;
      }

      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (
          !lecture.course.name.toLowerCase().includes(s) &&
          !lecture.course.code.toLowerCase().includes(s) &&
          !(lecture.doctor?.name?.toLowerCase() || "").includes(s) &&
          !(lecture.hall?.name?.toLowerCase() || "").includes(s)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [lectures, selectedDept, selectedLevel, searchTerm, departments]);

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
      const lastSession = rec?.sessions?.[rec.sessions.length - 1];
      const entryTimeStr = firstSession?.checkIn
        ? formatTime(firstSession.checkIn)
        : "\u2014";
      const exitTimeStr = lastSession?.checkOut
        ? formatTime(lastSession.checkOut)
        : rec?.status === "in-progress" ? "جاري" : "\u2014";
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
    if (record && record._id) {
      await updateStatusMutation.mutateAsync({
        id: record._id,
        status: "present",
        reason: "تسجيل حضور يدوي من غرفة التحكم",
      });
    } else if (selectedLecture) {
      await updateMatrixCellMutation.mutateAsync({
        studentId: student._id,
        courseId: selectedLecture.course._id,
        date: todayStr,
        status: "present",
        reason: "تسجيل حضور يدوي من غرفة التحكم",
      });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    }
  }, [updateStatusMutation, updateMatrixCellMutation, selectedLecture, todayStr, queryClient]);

  const handleManualExcuse = useCallback(async (student: any, record: any) => {
    if (!student) return;
    if (record && record._id) {
      await excuseMutation.mutateAsync({
        id: record._id,
        reason: "عذر طبي أو إذن معتمد من شؤون الطلاب",
      });
    } else if (selectedLecture) {
      await updateMatrixCellMutation.mutateAsync({
        studentId: student._id,
        courseId: selectedLecture.course._id,
        date: todayStr,
        status: "excused",
        reason: "عذر طبي أو إذن معتمد من شؤون الطلاب",
      });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    }
  }, [excuseMutation, updateMatrixCellMutation, selectedLecture, todayStr, queryClient]);

  const handleRefreshAll = useCallback(() => {
    refetchMonitoring();
  }, [refetchMonitoring]);

  const timeStr = lastUpdate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const isLoading = monitoringLoading;

  return (
    <div className="space-y-4 sm:space-y-5 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-md border border-primary/20 shrink-0">
            <Radio className="h-4 w-4 text-primary motion-safe:animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-[family-name:var(--font-heading)] truncate">
              غرفة المراقبة والتحكم المباشر
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
              متابعة نبض المحاضرات، الأقسام، واستقبال إشارات الشبكة بالكلية في الوقت الفعلي
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md border border-border min-h-[36px]">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground hidden sm:inline">توقيت النظام:</span>
            <span dir="ltr" className="font-mono font-semibold text-primary tabular-nums">{timeStr}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="gap-1.5 rounded-md min-h-[36px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">محاضرات جارية</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.activeLecturesCount}</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
              <Building className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">الطلاب النشطين</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.connectedStudentsCount}</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">قاعات مشغّلة</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.occupiedHallsCount}</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
              <Wifi className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">معدل الحضور العام</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.overallAttendanceRate}%</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
              <Activity className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-4 sm:space-y-5">
        {/* Department Monitoring Section */}
        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] contain-layout">
          <CardHeader className="pb-3 border-b px-4 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-[family-name:var(--font-heading)]">
              <Building className="h-4 w-4 text-primary shrink-0" />
              <span>الرقابة اللحظية للأقسام العلمية</span>
            </CardTitle>
            <CardDescription className="text-xs">نسب الحضور والفاعلية الفورية بكل قسم في الكلية الآن</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {departments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا توجد أقسام نشطة حالياً
              </div>
            )}
            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {departments.map((dept: any) => {
                const rate = dept.attendanceRate;
                let progressIndicator = "bg-primary";
                if (rate < 60) progressIndicator = "bg-destructive";
                else if (rate < 75) progressIndicator = "bg-amber-600";

                return (
                  <div
                    key={dept._id}
                    className="p-3 border border-border bg-card rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h4 className="font-bold text-sm text-foreground truncate">{dept.name}</h4>
                      <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">{rate}%</span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={rate} className={`h-1.5 ${progressIndicator}`} />
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>محاضرات: <strong className="text-foreground">{dept.activeLectures}</strong></span>
                        <span>الطلاب: <strong className="text-foreground">{dept.presentCount}/{dept.totalEnrolled}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters & Control */}
        <Card className="rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="w-full sm:w-1/4 text-right">
              <label className="text-xs font-medium text-muted-foreground block mb-1">القسم العلمي</label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="rounded-md border bg-background text-right min-h-[44px] sm:min-h-[36px]">
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-1/4 text-right">
              <label className="text-xs font-medium text-muted-foreground block mb-1">الفرقة الدراسية</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="rounded-md border bg-background text-right min-h-[44px] sm:min-h-[36px]">
                  <SelectValue placeholder="جميع الفرق" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">جميع الفرق</SelectItem>
                  <SelectItem value="1">إعدادي</SelectItem>
                  <SelectItem value="2">الفرقة الأولى</SelectItem>
                  <SelectItem value="3">الفرقة الثانية</SelectItem>
                  <SelectItem value="4">الفرقة الثالثة</SelectItem>
                  <SelectItem value="5">الفرقة الرابعة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-2/4 text-right">
              <label className="text-xs font-medium text-muted-foreground block mb-1">البحث السريع</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث باسم المادة، الأستاذ أو القاعة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 rounded-md border bg-background text-right w-full min-h-[44px] sm:min-h-[36px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Lectures Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-[family-name:var(--font-heading)] flex items-center gap-2 text-foreground">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            المحاضرات النشطة ({filteredLectures.length})
          </h3>

          {filteredLectures.length === 0 && (
            <Card className="border-dashed rounded-md">
              <CardContent className="p-6 sm:p-8 text-center">
                <Wifi className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h4 className="text-sm font-bold text-foreground mb-1">لا توجد محاضرات جارية تطابق البحث</h4>
                <p className="text-xs text-muted-foreground">
                  تأكد من بدء المحاضرات وحضور الأطباء في المواعيد المقررة أو غير خيارات التصفية.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredLectures.map((lecture: any) => {
              const percentage = lecture.stats.percentage;
              let borderColor = "border-emerald-500/30";
              if (percentage < 60) borderColor = "border-destructive/30";
              else if (percentage < 75) borderColor = "border-amber-500/30";

              return (
                <Card
                  key={lecture._id}
                  className={`overflow-hidden rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border ${borderColor} transition-shadow`}
                >
                  <div className="bg-muted/40 px-3 sm:px-4 py-2 border-b border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span dir="ltr">{formatTime12h(lecture.startTime)}</span>
                      <span>{"\u2190"}</span>
                      <span dir="ltr">{formatTime12h(lecture.endTime)}</span>
                    </div>
                    <Badge className="bg-destructive text-destructive-foreground rounded-sm text-[10px] px-1.5 py-0 h-5 font-semibold shrink-0">مباشر</Badge>
                  </div>

                  <CardHeader className="pb-2 px-3 sm:px-4 pt-3 text-foreground">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold font-[family-name:var(--font-heading)]">{lecture.course.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                          {lecture.course.code} &middot; {lecture.course.specialization || "بدون قسم"} &middot; {levelLabels[lecture.level] || lecture.level}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-border bg-background text-foreground font-semibold px-2 py-0.5 text-xs shrink-0">
                        {lecture.hall?.name}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 px-3 sm:px-4 pb-3 sm:pb-4 pt-0 text-foreground">
                    <div className="text-xs text-muted-foreground font-medium truncate">
                      عضو هيئة التدريس: <strong className="text-foreground">{lecture.doctor?.name || "\u2014"}</strong>
                    </div>

                    <div className="grid grid-cols-3 gap-0 border border-border rounded-md overflow-hidden bg-background">
                      <div className="text-center p-2">
                        <span className="text-[11px] text-muted-foreground block mb-0.5">حاضرون</span>
                        <span className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums">{lecture.stats.present}</span>
                      </div>
                      <div className="text-center p-2 border-x border-border">
                        <span className="text-[11px] text-muted-foreground block mb-0.5">غائبون</span>
                        <span className="text-base sm:text-lg font-bold text-destructive tabular-nums">{lecture.stats.absent}</span>
                      </div>
                      <div className="text-center p-2">
                        <span className="text-[11px] text-muted-foreground block mb-0.5">نسبة الحضور</span>
                        <span className="text-base sm:text-lg font-bold text-primary tabular-nums">{percentage}%</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full font-bold cursor-pointer rounded-md min-h-[44px] sm:min-h-[36px]"
                      onClick={() => {
                        setSelectedLectureId(lecture._id);
                        setIsSheetOpen(true);
                      }}
                    >
                      فتح لوحة التحكم اللحظي
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    مراقبة وإشراف المحاضرة
                  </SheetTitle>
                </div>
                <SheetDescription className="text-sm text-muted-foreground mt-1.5">
                  <strong className="text-foreground">{selectedLecture.course?.name || "\u2014"}</strong>
                  &middot; {selectedLecture.doctor?.name || "\u2014"} &middot; {selectedLecture.hall?.name || "\u2014"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-4 sm:mt-5">
                {/* Time stats */}
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 bg-muted/30 p-3 rounded-md border border-border text-right">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">التوقيت المجدول</span>
                    <span className="text-xs font-mono font-semibold mt-0.5 text-foreground text-right block" dir="ltr">
                      {selectedLecture.startTime} - {selectedLecture.endTime}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">تسجيل الدكتور الفعلي</span>
                    <span className="text-xs font-mono font-semibold mt-0.5 text-primary text-right block" dir="ltr">
                      {timeBoundaries.doctorStart} - {timeBoundaries.doctorEnd}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">أول اتصال طالب</span>
                    <span className={`text-xs font-mono font-semibold mt-0.5 text-right block ${timeBoundaries.actualStart !== "\u2014" ? "text-emerald-600" : "text-muted-foreground"}`} dir="ltr">
                      {timeBoundaries.actualStart}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium">آخر مغادرة طالب</span>
                    <span className={`text-xs font-mono font-semibold mt-0.5 text-right block ${timeBoundaries.actualEnd !== "\u2014" && timeBoundaries.actualEnd !== "جارية حالياً" ? "text-primary" : timeBoundaries.actualEnd === "جارية حالياً" ? "text-emerald-600" : "text-muted-foreground"}`} dir="ltr">
                      {timeBoundaries.actualEnd}
                    </span>
                  </div>
                </div>

                {/* Statistics Mini Cards */}
                <div className="grid gap-1.5 sm:gap-2 grid-cols-3 sm:grid-cols-6">
                  <div className="bg-muted/30 border border-border p-2 rounded-md text-center">
                    <span className="text-[11px] text-muted-foreground font-medium block">إجمالي</span>
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="text-xs font-bold text-foreground">سجلات الطلاب</h3>
                    <div className="relative w-full max-w-[200px]">
                      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="ابحث..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        className="pr-8 rounded-md border bg-background text-right font-medium text-xs min-h-[36px] w-full"
                      />
                    </div>
                  </div>

                  {attendanceLoading ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      جاري التحميل...
                    </div>
                  ) : studentRows.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      لا توجد سجلات مطابقة
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
                            {studentRows.map((row) => (
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
                        {studentRows.map((row) => (
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
