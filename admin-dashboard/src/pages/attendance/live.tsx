import { useState, useEffect } from "react";
import { useAttendance, useLectures } from "@/hooks";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttendanceRecord, Lecture } from "@/types";

export function LiveAttendancePage() {
  const [tick, setTick] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

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

  const now = lastUpdate;
  const timeStr = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const isLoading = lecturesLoading || attendanceLoading;

  return (
    <div className="space-y-6">
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

      {/* No active lectures banner */}
      {!isLoading && inProgressLectures.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wifi className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">
              لا توجد محاضرات جارية الآن
            </h3>
            <p className="text-sm text-muted-foreground">
              ابدأ محاضرة من صفحة "محاضرات اليوم" لتظهر هنا
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active lecture cards */}
      <div className="grid gap-6">
        {inProgressLectures.map((lecture) => {
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

          return (
            <Card
              key={lecture._id}
              className="border-green-500/30 bg-green-500/5 overflow-hidden"
            >
              {/* Live banner */}
              <div className="bg-green-500 text-white px-4 py-1.5 flex items-center gap-2 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                جارية الآن — {lecture.startTime} → {lecture.endTime}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{courseName}</CardTitle>
                  <Badge variant="default" className="bg-green-600 gap-1">
                    <Radio className="h-3 w-3" />
                    مباشر
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  القاعة: {hallName}
                </p>
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
                    <div className="text-2xl font-black">{percentage}%</div>
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
                              <div>
                                <p className="text-sm font-medium">
                                  {studentName}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground"
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
                              className="text-xs"
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
                      تأكد من أن الطلاب متصلون بنقطة الوصول للقاعة
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
