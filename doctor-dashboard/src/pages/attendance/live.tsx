import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users,
  Wifi,
  Clock,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Search,
  Grid,
  List,
  AlertCircle,
  Radio,
  UserCheck,
  UserX,
  Hourglass,
  MapPin,
  Laptop,
  Play,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attendanceService } from "@/services/attendance.service";
import { hallsService } from "@/services/halls.service";
import {
  useUpdateAttendanceStatus,
  useEndLecture,
  useStartLecture,
  useLectures,
  useTodayLectures,
} from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { Lecture } from "@/types";
import { formatTime12h } from "@/lib/utils";

interface LiveAttendance {
  activeSessions: number;
  sessions: Array<{
    student: {
      _id: string;
      name: { first: string; last: string } | string;
      studentId: string;
    };
    connectedAt: string;
    macAddress: string;
  }>;
  inProgressRecords: number;
  records: Array<{
    student: {
      _id: string;
      name: { first: string; last: string } | string;
      studentId: string;
    };
    checkIn: string;
    totalTime: number;
    status: string;
    _id?: string;
  }>;
}

export function LiveAttendancePage() {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const updateStatusMutation = useUpdateAttendanceStatus();
  const endLectureMutation = useEndLecture();
  const startLectureMutation = useStartLecture();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLectureId, setSelectedLectureId] = useState<string>("");

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's lectures
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

  const myLectures = todayLectures?.filter(isMyLecture) || [];

  // Auto-select active or upcoming lecture on load
  useEffect(() => {
    if (myLectures.length > 0 && !selectedLectureId) {
      // 1. If hallId in URL, match lecture with this hall
      if (hallId) {
        const matchingLecture = myLectures.find((l) => {
          const lHallId = typeof l.hall === "object" ? l.hall._id : l.hall;
          return lHallId === hallId;
        });
        if (matchingLecture) {
          setSelectedLectureId(matchingLecture._id);
          return;
        }
      }

      // 2. Else match an active lecture
      const active = myLectures.find((l) => l.status === "in-progress");
      if (active) {
        setSelectedLectureId(active._id);
        return;
      }

      // 3. Else match first scheduled lecture
      const scheduled = myLectures.find((l) => l.status === "scheduled");
      if (scheduled) {
        setSelectedLectureId(scheduled._id);
        return;
      }

      // 4. Fallback to first
      setSelectedLectureId(myLectures[0]._id);
    }
  }, [myLectures, hallId, selectedLectureId]);

  const selectedLecture = myLectures.find((l) => l._id === selectedLectureId);

  const currentHallId = selectedLecture
    ? typeof selectedLecture.hall === "object"
      ? selectedLecture.hall._id
      : selectedLecture.hall
    : undefined;

  // Fetch hall details
  const { data: hall } = useQuery({
    queryKey: ["hall", currentHallId],
    queryFn: () => hallsService.getById(currentHallId!),
    enabled: !!currentHallId,
  });

  // Fetch live attendance data (refresh every 5 seconds if active)
  const { data: liveData, isLoading: liveLoading, refetch: refetchLive } = useQuery<LiveAttendance>({
    queryKey: ["live-attendance", currentHallId],
    queryFn: () => attendanceService.getLiveAttendance(currentHallId!),
    refetchInterval: 5000,
    enabled: !!currentHallId && selectedLecture?.status === "in-progress",
  });

  const isLoading = lecturesLoading || (selectedLecture?.status === "in-progress" && liveLoading);

  const handleUpdateStatus = async (
    recordId: string,
    studentName: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ id: recordId, status });
      const statusLabels = {
        present: "حاضر",
        absent: "غائب",
        late: "متأخر",
        excused: "معذور",
      };
      toast.success(`تم تغيير حالة الطالب ${studentName} إلى ${statusLabels[status]}`);
      refetchLive();
    } catch (err) {
      toast.error("فشل تغيير حالة الطالب");
    }
  };

  const handleStartLecture = async (lectureId: string, hId: string) => {
    try {
      await startLectureMutation.mutateAsync(lectureId);
      toast.success("تم بدء المحاضرة بنجاح وبدء رصد الحضور");
      refetchToday();
      navigate(`/attendance/live/${hId}`);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء بدء المحاضرة");
    }
  };

  const handleEndLecture = async () => {
    if (!selectedLecture) return;
    try {
      await endLectureMutation.mutateAsync(selectedLecture._id);
      toast.success("تم إنهاء المحاضرة وحفظ الغيابات بنجاح");
      refetchToday();
    } catch (err) {
      toast.error("حدث خطأ أثناء إنهاء المحاضرة");
    }
  };

  const handleSelectLecture = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    const lec = myLectures.find((l) => l._id === lectureId);
    if (lec) {
      const hId = typeof lec.hall === "object" ? lec.hall._id : lec.hall;
      navigate(`/attendance/live/${hId}`);
    }
  };

  const getStudentName = (student: any) => {
    if (student && typeof student.name === "object") {
      return `${student.name.first} ${student.name.last}`;
    }
    return student?.name || "طالب غير معروف";
  };

  const getRandomBgColor = (studentId: string) => {
    const colors = [
      "bg-red-500/10 text-red-500 border-red-500/20",
      "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      "bg-amber-500/10 text-amber-500 border-amber-500/20",
      "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    ];
    const index = studentId ? studentId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0;
    return colors[index];
  };

  const getDisplayTime = (record: any) => {
    let baseTime = record.totalTime || 0;
    if (record.status === "in-progress" && record.checkIn) {
      const checkInTime = new Date(record.checkIn).getTime();
      const nowTime = currentTime.getTime();
      const elapsedMins = Math.floor((nowTime - checkInTime) / (1000 * 60));
      return baseTime + Math.max(0, elapsedMins);
    }
    return baseTime;
  };

  const timeStr = currentTime.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Filter records
  const filteredRecords = liveData?.records?.filter((r) => {
    const name = getStudentName(r.student).toLowerCase();
    const sId = (r.student.studentId || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || sId.includes(query);
  }) || [];

  // Filter sessions
  const filteredSessions = liveData?.sessions?.filter((s) => {
    const name = getStudentName(s.student).toLowerCase();
    const sId = (s.student?.studentId || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || sId.includes(query);
  }) || [];

  // Stats
  const totalEnrolled = selectedLecture?.course && typeof selectedLecture.course !== "string"
    ? selectedLecture.course.students?.length || 0
    : 0;
  const presentCount = liveData?.records?.filter(
    (r) => r.status === "in-progress" || r.status === "present" || r.status === "late" || r.status === "excused"
  ).length || 0;
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Breadcrumbs & Live Pulse */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/my-schedule/today" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            محاضرات اليوم
          </Link>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold text-foreground">الحساب والمتابعة الفورية</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
            <Clock className="h-4 w-4 text-primary" />
            <span dir="ltr" className="font-mono font-bold">{timeStr}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            رصد الحضور المباشر
          </div>
        </div>
      </div>

      {/* Main Selector & Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-card p-6 rounded-3xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Radio className="h-7 w-7 text-primary animate-pulse" />
            متابعة الحضور المباشر اليوم
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            اختر إحدى محاضراتك اليوم للبدء، المتابعة اللحظية، أو إنهاء رصد الحضور.
          </p>
        </div>

        <div className="flex items-center gap-3 min-w-[320px] w-full xl:w-auto">
          <Select value={selectedLectureId} onValueChange={handleSelectLecture}>
            <SelectTrigger className="w-full xl:w-[380px] rounded-xl border-muted bg-background h-11 text-right font-bold text-sm">
              <SelectValue placeholder="اختر المحاضرة" />
            </SelectTrigger>
            <SelectContent dir="rtl" className="max-w-[420px]">
              {myLectures.map((lec) => {
                const cName = typeof lec.course === "object" ? lec.course.name : "مقرر";
                const cCode = typeof lec.course === "object" ? lec.course.code : "";
                const hName = typeof lec.hall === "object" ? lec.hall.name : "قاعة";
                const statusTag =
                  lec.status === "in-progress"
                    ? "🟢 جارية الآن"
                    : lec.status === "completed"
                    ? "✅ مكتملة"
                    : "⏱️ مجدولة";
                
                return (
                  <SelectItem key={lec._id} value={lec._id} className="text-right py-2.5 font-bold text-sm">
                    {cCode} - {cName} • {hName} ({statusTag})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              refetchToday();
              if (currentHallId && selectedLecture?.status === "in-progress") {
                refetchLive();
              }
            }}
            variant="outline"
            className="rounded-xl h-11 px-4 hover:bg-muted/50 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 text-primary ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {myLectures.length === 0 && !lecturesLoading && (
        <Card className="border-dashed border-2 rounded-3xl bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Calendar className="h-16 w-16 text-muted-foreground opacity-30 animate-pulse" />
            <h3 className="text-xl font-bold text-foreground">لا توجد محاضرات مجدولة لك اليوم</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              لم نجد أي محاضرات مخصصة لك في جدول اليوم. يمكنك الاسترخاء أو مراجعة جدولك الأسبوعي الكامل.
            </p>
            <Button asChild className="rounded-xl h-10 px-6 font-bold" variant="outline">
              <Link to="/my-schedule">عرض الجدول الأسبوعي</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedLecture && (
        <div className="space-y-8">
          {/* CASE 1: SCHEDULED (Waiting to Start) */}
          {selectedLecture.status === "scheduled" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-dashed border-2 rounded-3xl bg-blue-500/5 border-blue-500/20 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                <div className="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center animate-bounce">
                    <Clock className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-full">
                      محاضرة مجدولة اليوم
                    </span>
                    <h2 className="text-2xl font-black text-foreground">
                      {typeof selectedLecture.course === "object" ? selectedLecture.course.name : "مقرر غير معروف"}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono font-bold">
                      {typeof selectedLecture.course === "object" ? selectedLecture.course.code : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-md pt-4">
                    <div className="bg-background/80 border p-4 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center gap-1">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <span className="text-xs text-muted-foreground">مكان الانعقاد</span>
                      <span className="text-sm font-bold">{hall?.name || "قاعة"} {hall?.building && `• مبنى ${hall.building}`}</span>
                    </div>

                    <div className="bg-background/80 border p-4 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center gap-1">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="text-xs text-muted-foreground">التوقيت المجدول</span>
                      <span className="text-sm font-bold flex items-center gap-1" dir="ltr">
                        <span dir="rtl">{formatTime12h(selectedLecture.startTime)}</span>
                        <span>-</span>
                        <span dir="rtl">{formatTime12h(selectedLecture.endTime)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 w-full max-w-sm">
                    <Button
                      onClick={() => handleStartLecture(selectedLecture._id, currentHallId!)}
                      disabled={startLectureMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 font-black shadow-lg shadow-blue-600/20 text-base gap-3 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Play className="h-5 w-5 fill-current shrink-0" />
                      بدء تسجيل حضور الطلاب الآن
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 font-medium">
                      عند الضغط على البدء، سيتم تفعيل البث، والتقاط الطلاب المتصلين بنقطة الوصول تلقائياً.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* CASE 2: COMPLETED (Finished) */}
          {selectedLecture.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-dashed border-2 rounded-3xl bg-emerald-500/5 border-emerald-500/20 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
                <div className="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full">
                      محاضرة مكتملة ومحفوظة
                    </span>
                    <h2 className="text-2xl font-black text-foreground">
                      {typeof selectedLecture.course === "object" ? selectedLecture.course.name : "مقرر غير معروف"}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono font-bold">
                      {typeof selectedLecture.course === "object" ? selectedLecture.course.code : ""}
                    </p>
                  </div>

                  <div className="bg-background/80 border p-6 rounded-2xl text-center shadow-sm w-full max-w-md space-y-4">
                    <h4 className="text-sm font-bold text-foreground">ملخص الحضور والغياب النهائي</h4>
                    <p className="text-xs text-muted-foreground">
                      تم إغلاق رصد الحضور وتسجيل البيانات النهائية بنجاح في قاعدة البيانات.
                    </p>
                    <div className="border-t pt-4 flex items-center justify-around">
                      <div className="text-center">
                        <span className="block text-xs text-muted-foreground">مكان القاعة</span>
                        <span className="text-sm font-bold">{hall?.name || "قاعة"}</span>
                      </div>
                      <div className="w-[1px] h-8 bg-border" />
                      <div className="text-center">
                        <span className="block text-xs text-muted-foreground">التوقيت</span>
                        <span className="text-sm font-bold flex items-center gap-1" dir="ltr">
                          <span dir="rtl">{formatTime12h(selectedLecture.startTime)}</span>
                          <span>-</span>
                          <span dir="rtl">{formatTime12h(selectedLecture.endTime)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                    <Button asChild className="rounded-xl h-11 px-6 font-bold" variant="default">
                      <Link to={`/attendance?course=${typeof selectedLecture.course === "object" ? selectedLecture.course._id : selectedLecture.course}&date=${new Date().toLocaleDateString("en-CA")}`}>
                        غياب هذه المحاضرة
                      </Link>
                    </Button>
                    {/* <Button asChild className="rounded-xl h-11 px-6 font-bold" variant="outline">
                      <Link to="/attendance/reports">عرض تقارير الحضور الشاملة</Link>
                    </Button> */}
                    <Button asChild className="rounded-xl h-11 px-6 font-bold" variant="secondary">
                      <Link to="/my-schedule/today">العودة للجدول</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* CASE 3: IN PROGRESS (Real-Time Live Dashboard) */}
          {selectedLecture.status === "in-progress" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Lecture Metadata Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">المقرر الدراسي المفتوح الآن</span>
                    <h2 className="text-xl font-black text-foreground">{typeof selectedLecture.course === "object" ? selectedLecture.course.name : "مقرر"}</h2>
                    <p className="text-xs text-muted-foreground font-mono font-semibold">{typeof selectedLecture.course === "object" ? selectedLecture.course.code : ""}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
                      <span>{hall?.name} {hall?.building && `• مبنى ${hall.building}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary/70 shrink-0" />
                      <span dir="ltr" className="font-mono flex items-center gap-1">
                        <span dir="rtl">{formatTime12h(selectedLecture.startTime)}</span>
                        <span>-</span>
                        <span dir="rtl">{formatTime12h(selectedLecture.endTime)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-center gap-3">
                    <Badge variant="outline" className="bg-background/80 border-primary/20 px-3 py-1 text-sm font-bold text-primary">
                      {selectedLecture.type === "lecture"
                        ? "محاضرة نظرية"
                        : selectedLecture.type === "section"
                          ? "تمارين عملية"
                          : "معمل تطبيقي"}
                    </Badge>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-xl h-10 px-5 gap-2 font-bold shadow-md shadow-destructive/10 text-xs">
                          <LogOut className="h-4 w-4" />
                          إنهاء وحفظ الغيابات
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="text-right" dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">هل أنت متأكد من إنهاء المحاضرة؟</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            سيقوم هذا الإجراء بإغلاق جلسة الحضور فورياً، واعتماد حضور الطلاب المتواجدين حالياً، وتثبيت غياب الطلاب الذين لم يتصلوا بالشبكة. لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse gap-3">
                          <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={handleEndLecture} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                            إنهاء المحاضرة
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border border-border bg-card/60 dark:bg-card/20 overflow-hidden relative group hover:shadow-md transition-all duration-300">
                  <div className="absolute top-0 right-0 h-1.5 w-full bg-blue-500" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الاتصالات النشطة بالشبكة</span>
                    <Laptop className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-blue-500">{liveData?.activeSessions || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      أجهزة متصلة بالـ Access Point
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border bg-card/60 dark:bg-card/20 overflow-hidden relative group hover:shadow-md transition-all duration-300">
                  <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">سجلات حضور الطلاب</span>
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-emerald-500">{presentCount}</div>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      من أصل <span className="font-bold text-foreground">{totalEnrolled}</span> طلاب مسجلين بالمقرر
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border bg-card/60 dark:bg-card/20 overflow-hidden relative group hover:shadow-md transition-all duration-300">
                  <div className="absolute top-0 right-0 h-1.5 w-full bg-rose-500" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الطلاب المتخلفون</span>
                    <UserX className="h-4 w-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-rose-500">
                      {Math.max(0, totalEnrolled - presentCount)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">طالب لم يسجل دخوله بعد</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border bg-card/60 dark:bg-card/20 overflow-hidden relative group hover:shadow-md transition-all duration-300">
                  <div className="absolute top-0 right-0 h-1.5 w-full bg-primary" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">نسبة الحضور الفورية</span>
                    <Radio className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black text-primary">{attendanceRate}%</span>
                    </div>
                    <Progress value={attendanceRate} className="h-1.5" />
                  </CardContent>
                </Card>
              </div>

              {/* Main Dynamic Panel */}
              <Card className="rounded-3xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="p-6 bg-muted/20 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      متابعة الحضور والاتصال بالقاعة
                    </CardTitle>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ابحث بالاسم أو الرقم الأكاديمي..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-9 w-64 rounded-xl border-border bg-background focus-visible:ring-primary/20 text-right"
                        />
                      </div>

                      {/* View Toggles */}
                      <div className="flex items-center gap-1 bg-background border rounded-xl p-1 shrink-0">
                        <Button
                          variant={viewMode === "grid" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <Tabs defaultValue="attendance" className="space-y-6" dir="rtl">
                    <TabsList className="bg-muted/50 p-1 rounded-xl h-11">
                      <TabsTrigger value="attendance" className="rounded-lg h-9 font-bold gap-2">
                        <UserCheck className="h-4 w-4" />
                        الطلاب الحاضرون ({filteredRecords.length})
                      </TabsTrigger>
                      <TabsTrigger value="wifi-sessions" className="rounded-lg h-9 font-bold gap-2">
                        <Wifi className="h-4 w-4" />
                        الأجهزة المتصلة بالواي فاي ({filteredSessions.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* TAB: Enrolled & Checked-in Students */}
                    <TabsContent value="attendance" className="outline-none">
                      {filteredRecords.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground space-y-3">
                          <UserX className="h-12 w-12 mx-auto opacity-30" />
                          <h4 className="font-bold">لا يوجد طلاب متصلون بالمقرر حالياً</h4>
                          <p className="text-xs max-w-xs mx-auto">
                            لم يتم رصد تسجيل دخول الطلاب بعد، أو لم يتطابق البحث مع أي اسم.
                          </p>
                        </div>
                      ) : viewMode === "grid" ? (
                        /* Grid Layout for Students */
                        <motion.div
                          layout
                          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                          <AnimatePresence mode="popLayout">
                            {filteredRecords.map((record) => {
                              const name = getStudentName(record.student);
                              const initial = name.charAt(0);

                              const statusTheme = {
                                present: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
                                absent: "bg-rose-500/10 border-rose-500/20 text-rose-600",
                                late: "bg-amber-500/10 border-amber-500/20 text-amber-600",
                                excused: "bg-blue-500/10 border-blue-500/20 text-blue-600",
                                "in-progress": "bg-emerald-500/10 border-emerald-500/30 text-emerald-505 animate-pulse font-bold",
                              }[record.status] || "bg-muted text-muted-foreground";

                              const statusText = {
                                present: "حاضر",
                                absent: "غائب",
                                late: "متأخر",
                                excused: "معذور",
                                "in-progress": "متصل الآن",
                              }[record.status] || record.status;

                              return (
                                <motion.div
                                  key={record._id}
                                  layoutId={record._id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="group relative p-5 rounded-2xl border border-border/50 bg-card/45 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      {/* Avatar Initials */}
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base border shrink-0 ${getRandomBgColor(record.student.studentId)}`}>
                                        {initial}
                                      </div>

                                      <div className="space-y-0.5 max-w-[150px] text-right">
                                        <h4 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                                          {name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground font-mono font-medium truncate">
                                          {record.student.studentId}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Actions Dropdown */}
                                    {record._id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="text-right">
                                          <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "present")}>
                                            <CheckCircle className="ml-2 h-4 w-4 text-emerald-600" />
                                            تعديل كحاضر
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "absent")}>
                                            <XCircle className="ml-2 h-4 w-4 text-rose-600" />
                                            تعديل كغائب
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "late")}>
                                            <ClockIcon className="ml-2 h-4 w-4 text-amber-600" />
                                            تعديل كمتأخر
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "excused")}>
                                            <AlertTriangle className="ml-2 h-4 w-4 text-blue-600" />
                                            تعديل كمعذور
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>

                                  <div className="space-y-3 pt-3 border-t border-border/40 mt-auto">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <ClockIcon className="h-3.5 w-3.5 text-primary/70" />
                                        <span dir="ltr">
                                          {new Date(record.checkIn).toLocaleTimeString("ar-EG", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}
                                        </span>
                                      </span>
                                      <span className="flex items-center gap-1 font-semibold text-foreground">
                                        <Hourglass className="h-3.5 w-3.5 text-primary/70" />
                                        <span>{getDisplayTime(record)} دقيقة</span>
                                      </span>
                                    </div>

                                    {/* Status Badge */}
                                    <Badge className={`w-full justify-center rounded-lg border py-1 font-bold ${statusTheme}`}>
                                      {statusText}
                                    </Badge>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        /* List Layout for Students */
                        <div className="border rounded-2xl overflow-hidden divide-y">
                          {filteredRecords.map((record) => {
                            const name = getStudentName(record.student);

                            const statusTheme = {
                              present: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
                              absent: "bg-rose-500/10 border-rose-500/20 text-rose-600",
                              late: "bg-amber-500/10 border-amber-500/20 text-amber-600",
                              excused: "bg-blue-500/10 border-blue-500/20 text-blue-600",
                              "in-progress": "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 animate-pulse font-bold",
                            }[record.status] || "bg-muted text-muted-foreground";

                            const statusText = {
                              present: "حاضر",
                              absent: "غائب",
                              late: "متأخر",
                              excused: "معذور",
                              "in-progress": "متصل الآن",
                            }[record.status] || record.status;

                            return (
                              <div
                                key={record._id}
                                className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${getRandomBgColor(record.student.studentId)}`}>
                                    {name.charAt(0)}
                                  </div>
                                  <div className="text-right">
                                    <h4 className="font-bold text-foreground text-sm">{name}</h4>
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{record.student.studentId}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded-lg">
                                    دخول: {new Date(record.checkIn).toLocaleTimeString("ar-EG", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-medium bg-muted/40 px-2 py-1 rounded-lg">
                                    مدة: {getDisplayTime(record)} دقيقة
                                  </span>
                                  <Badge className={`rounded-lg font-bold border py-1 px-3 ${statusTheme}`}>
                                    {statusText}
                                  </Badge>

                                  {record._id && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="text-right">
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "present")}>
                                          <CheckCircle className="ml-2 h-4 w-4 text-emerald-600" />
                                          تعديل كحاضر
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "absent")}>
                                          <XCircle className="ml-2 h-4 w-4 text-rose-600" />
                                          تعديل كغائب
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "late")}>
                                          <ClockIcon className="ml-2 h-4 w-4 text-amber-600" />
                                          تعديل كمتأخر
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(record._id!, name, "excused")}>
                                          <AlertTriangle className="ml-2 h-4 w-4 text-blue-600" />
                                          تعديل كمعذور
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* TAB: Connected Hotspot Devices (WiFi sessions) */}
                    <TabsContent value="wifi-sessions" className="outline-none">
                      {filteredSessions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground space-y-3">
                          <Wifi className="h-12 w-12 mx-auto opacity-30" />
                          <h4 className="font-bold">لا توجد أجهزة متصلة بالشبكة</h4>
                          <p className="text-xs max-w-xs mx-auto">
                            لا تظهر أي أجهزة نشطة متصلة بنقطة الوصول بالقاعة حالياً.
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-2xl overflow-hidden divide-y">
                          <div className="bg-muted/30 px-4 py-3 flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            <span>الجهاز / الطالب</span>
                            <div className="flex items-center gap-12 font-sans">
                              <span className="w-32 text-center">عنوان الـ MAC</span>
                              <span className="w-24 text-center">وقت الاتصال</span>
                            </div>
                          </div>

                          {filteredSessions.map((session) => {
                            const name = getStudentName(session.student);
                            const hasAttendance = liveData?.records?.some(r => r.student._id === session.student?._id);

                            return (
                              <div
                                key={session.macAddress}
                                className="flex items-center justify-between p-4 hover:bg-muted/5 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                                    <Laptop className="h-4 w-4" />
                                  </div>
                                  <div className="text-right">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                      {name}
                                      {hasAttendance ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] rounded-lg">
                                          سجل حضور
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] rounded-lg">
                                          متصل بالشبكة فقط
                                        </Badge>
                                      )}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">{session.student?.studentId || "زائر غير معروف"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-12 font-mono text-xs">
                                  <span className="text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-lg w-32 text-center">{session.macAddress}</span>
                                  <span className="text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-lg w-24 text-center">
                                    {new Date(session.connectedAt).toLocaleTimeString("ar-EG", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
