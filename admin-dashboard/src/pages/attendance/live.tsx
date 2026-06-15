import { useState, useEffect } from "react";
import { useAttendance, useLectures, useDepartments } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Radio,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wifi,
  Search,
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
import type { AttendanceRecord, Lecture } from "@/types";
import { formatTime12h } from "@/lib/utils";

export function LiveAttendancePage() {
  const [tick, setTick] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filters State
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { data: lecturesData, isLoading: lecturesLoading } = useLectures({
    status: "in-progress",
  });

  const { data: departmentsData } = useDepartments();
  const departments = departmentsData || [];

  const inProgressLectures: Lecture[] = (lecturesData?.data ?? []).filter(
    (l) => l.status === "in-progress",
  );

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch,
  } = useAttendance({
    status: "in-progress",
    limit: 100,
  });

  // Refetch on tick
  useEffect(() => {
    refetch();
  }, [tick]);

  const presentRecords: AttendanceRecord[] = (
    attendanceData?.data ?? []
  ).filter(
    (r: AttendanceRecord) =>
      r.status === "in-progress" || r.status === "present",
  );

  // Apply filters
  const filteredLectures = inProgressLectures.filter((lecture) => {
    // 1. Department Filter
    if (selectedDept !== "all") {
      const deptId =
        typeof lecture.course === "object"
          ? typeof lecture.course.department === "object"
            ? lecture.course.department?._id
            : lecture.course.department
          : "";
      if (deptId !== selectedDept) return false;
    }

    // 2. Level Filter
    if (selectedLevel !== "all") {
      const level =
        lecture.level ||
        (typeof lecture.course === "object" ? lecture.course.level : undefined);
      if (String(level) !== selectedLevel) return false;
    }

    // 3. Search Term (Course Name, Course Code, Doctor Name, Hall Name)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const courseName =
        typeof lecture.course === "object"
          ? lecture.course.name.toLowerCase()
          : "";
      const courseCode =
        typeof lecture.course === "object"
          ? lecture.course.code.toLowerCase()
          : "";
      const doctorName =
        typeof lecture.doctor === "object"
          ? typeof lecture.doctor.name === "object"
            ? `${lecture.doctor.name.first} ${lecture.doctor.name.last}`.toLowerCase()
            : (lecture.doctor.name || "").toLowerCase()
          : typeof lecture.doctor === "string"
          ? lecture.doctor.toLowerCase()
          : "";
      const hallName =
        typeof lecture.hall === "object" ? lecture.hall.name.toLowerCase() : "";

      if (
        !courseName.includes(search) &&
        !courseCode.includes(search) &&
        !doctorName.includes(search) &&
        !hallName.includes(search)
      ) {
        return false;
      }
    }

    return true;
  });

  const now = lastUpdate;
  const timeStr = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const isLoading = lecturesLoading || attendanceLoading;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <Radio className="h-6 w-6 text-green-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              الحضور المباشر
            </h1>
            <p className="text-sm text-muted-foreground">
              يتحدث تلقائياً كل 5 ثواني
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4" />
            <span dir="ltr">{timeStr}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid gap-4 sm:grid-cols-3 bg-card p-4 rounded-2xl border shadow-sm">
        <div className="space-y-1.5 text-right">
          <label className="text-xs font-bold text-muted-foreground">الكلية / القسم</label>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-full rounded-xl border-muted bg-background text-right">
              <SelectValue placeholder="جميع الأقسام" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {departments.map((dept: any) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 text-right">
          <label className="text-xs font-bold text-muted-foreground">الفرقة الدراسية</label>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full rounded-xl border-muted bg-background text-right">
              <SelectValue placeholder="جميع الفرق" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">جميع الفرق</SelectItem>
              <SelectItem value="1">الفرقة الأولى</SelectItem>
              <SelectItem value="2">الفرقة الثانية</SelectItem>
              <SelectItem value="3">الفرقة الثالثة</SelectItem>
              <SelectItem value="4">الفرقة الرابعة</SelectItem>
              <SelectItem value="5">الفرقة الخامسة</SelectItem>
              <SelectItem value="6">الفرقة السادسة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 text-right">
          <label className="text-xs font-bold text-muted-foreground">البحث السريع</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث باسم المادة، الأستاذ أو القاعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 rounded-xl border-muted bg-background text-right w-full"
            />
          </div>
        </div>
      </div>

      {/* No active lectures in system */}
      {!isLoading && inProgressLectures.length === 0 && (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wifi className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">
              لا توجد محاضرات جارية الآن
            </h3>
            <p className="text-sm text-muted-foreground">
              تظهر هنا المحاضرات النشطة حالياً في النظام فور بدئها.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtered out - no results */}
      {!isLoading && inProgressLectures.length > 0 && filteredLectures.length === 0 && (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">
              لا توجد نتائج تطابق خيارات التصفية
            </h3>
            <p className="text-sm text-muted-foreground">
              حاول تغيير خيارات البحث أو التصفية لإظهار المحاضرات المطلوبة.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active lecture cards */}
      <div className="grid gap-6">
        {filteredLectures.map((lecture) => {
          const lectureRecords = presentRecords.filter((r) => {
            if (!r.lecture) return false;
            const lId =
              typeof r.lecture === "object" ? r.lecture._id : r.lecture;
            return lId === lecture._id;
          });

          const presentCount = lectureRecords.length;
          const totalStudents =
            (lecture as Lecture & { totalStudents?: number }).totalStudents ??
            0;
          const percentage =
            totalStudents > 0
              ? Math.round((presentCount / totalStudents) * 100)
              : 0;

          const courseName =
            typeof lecture.course === "object"
              ? lecture.course.name
              : lecture.course;
          const hallName =
            typeof lecture.hall === "object" ? lecture.hall.name : lecture.hall;

          const courseDeptName =
            typeof lecture.course === "object"
              ? typeof lecture.course.department === "object"
                ? lecture.course.department?.name
                : lecture.course.department
              : "";

          const doctorName =
            typeof lecture.doctor === "object"
              ? typeof lecture.doctor.name === "object"
                ? `${lecture.doctor.name.first} ${lecture.doctor.name.last}`
                : lecture.doctor.name || "—"
              : lecture.doctor || "—";

          return (
            <Card
              key={lecture._id}
              className="border-green-500/30 bg-green-500/5 overflow-hidden rounded-2xl shadow-sm"
            >
              {/* Live banner */}
              <div className="bg-green-600 text-white px-4 py-1.5 flex items-center gap-2 text-xs font-bold justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="flex items-center gap-1">
                    <span>محاضرة جارية الآن — </span>
                    <span dir="rtl" className="font-mono">{formatTime12h(lecture.startTime)}</span>
                    <span>←</span>
                    <span dir="rtl" className="font-mono">{formatTime12h(lecture.endTime)}</span>
                  </span>
                </div>
                {doctorName && (
                  <span className="text-[11px] font-medium opacity-90">الدكتور: {doctorName}</span>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">{courseName}</CardTitle>
                  <Badge variant="default" className="bg-green-600 gap-1 rounded-lg">
                    <Radio className="h-3 w-3" />
                    مباشر
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 font-medium">
                  <span>القاعة: {hallName}</span>
                  {courseDeptName && (
                    <>
                      <span>•</span>
                      <span>القسم: {courseDeptName}</span>
                    </>
                  )}
                  {lecture.level && (
                    <>
                      <span>•</span>
                      <span>الفرقة: {lecture.level}</span>
                    </>
                  )}
                  {lecture.specialization && (
                    <>
                      <span>•</span>
                      <span>التخصص: {lecture.specialization}</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background rounded-xl p-3 text-center border">
                    <div className="text-2xl font-black text-green-600">
                      {presentCount}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      حاضر
                    </div>
                  </div>
                  <div className="bg-background rounded-xl p-3 text-center border">
                    <div className="text-2xl font-black text-destructive">
                      {Math.max(0, totalStudents - presentCount)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      غائب
                    </div>
                  </div>
                  <div className="bg-background rounded-xl p-3 text-center border">
                    <div className="text-2xl font-black text-green-600">{percentage}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      نسبة الحضور
                    </div>
                  </div>
                </div>

                {/* Student list */}
                {lectureRecords.length > 0 && (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      الطلاب الحاضرون ({lectureRecords.length})
                    </div>
                    <div className="divide-y max-h-64 overflow-y-auto">
                      {lectureRecords.map((record) => {
                        const student =
                          typeof record.student === "object"
                            ? record.student
                            : null;
                        const studentName = student
                          ? typeof student.name === "object"
                            ? `${student.name.first} ${student.name.last}`
                            : student.name
                          : "—";
                        const studentId = student?.studentId ?? "—";

                        return (
                          <div
                            key={record._id}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {studentName}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground font-mono"
                                  dir="ltr"
                                >
                                  {studentId}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                record.status === "present"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs rounded-md"
                            >
                              {record.status === "present" ? "حاضر" : "جاري"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {lectureRecords.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <XCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">لم يتصل أي طالب بعد</p>
                    <p className="text-xs mt-1">
                      تأكد من أن الطلاب متصلون بنقطة الوصول بالقاعة
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
