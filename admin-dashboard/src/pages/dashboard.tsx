import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  DoorOpen,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDashboardStats,
  useTodayLectures,
  useAtRiskStudents,
} from "@/hooks";
import { formatTime12h } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card className="border-border bg-card/40 transition-colors hover:bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-md bg-primary/10 p-1.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayLectures, isLoading: lecturesLoading } =
    useTodayLectures();
  const { data: atRiskStudents, isLoading: atRiskLoading } =
    useAtRiskStudents();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-0.5 border-b pb-4 border-dashed">
        <h1 className="text-3xl font-bold text-foreground">
          لوحة التحكم
        </h1>
        <p className="text-sm text-muted-foreground">
          نظرة عامة على حالة النظام اليوم - النظام الأكاديمي الموحد
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الطلاب"
          value={stats?.totalStudents ?? 0}
          icon={GraduationCap}
          loading={statsLoading}
        />
        <StatCard
          title="أعضاء هيئة التدريس"
          value={stats?.totalDoctors ?? 0}
          icon={Users}
          loading={statsLoading}
        />
        <StatCard
          title="المواد الدراسية"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          loading={statsLoading}
        />
        <StatCard
          title="القاعات الدراسية"
          value={stats?.totalHalls ?? 0}
          icon={DoorOpen}
          loading={statsLoading}
        />
      </div>

      {/* Attendance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="محاضرات اليوم"
          value={stats?.activeLectures ?? 0}
          icon={Calendar}
          loading={statsLoading}
        />
        <StatCard
          title="نسبة الحضور"
          value={`${stats?.todayAttendance?.rate ?? 0}%`}
          icon={TrendingUp}
          loading={statsLoading}
        />
        <StatCard
          title="الطلاب الحاضرون"
          value={stats?.todayAttendance?.present ?? 0}
          icon={CheckCircle}
          loading={statsLoading}
        />
        <StatCard
          title="الطلاب الغائبون"
          value={stats?.todayAttendance?.absent ?? 0}
          icon={XCircle}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Today's Lectures */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3 border-b border-dashed mb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5 text-primary" />
              محاضرات اليوم
            </CardTitle>
            <CardDescription>المحاضرات المقررة لهذا اليوم وجدول التنفيذ</CardDescription>
          </CardHeader>
          <CardContent>
            {lecturesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : todayLectures && todayLectures.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="font-bold">المادة</TableHead>
                    <TableHead className="font-bold text-center">القاعة</TableHead>
                    <TableHead className="font-bold text-center">الوقت</TableHead>
                    <TableHead className="font-bold text-left">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayLectures.slice(0, 5).map((lecture: any) => (
                    <TableRow key={lecture._id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium py-3">
                        {lecture.course?.name || "غير متوفر"}
                      </TableCell>
                      <TableCell className="text-center">{lecture.hall?.name || "غير متوفر"}</TableCell>
                      <TableCell dir="ltr" className="text-center tabular-nums text-sm">
                        {formatTime12h(lecture.startTime)} - {formatTime12h(lecture.endTime)}
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge
                          variant={
                            lecture.status === "in-progress"
                              ? "default"
                              : lecture.status === "completed"
                                ? "secondary"
                                : lecture.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="font-medium"
                        >
                          {lecture.status === "in-progress"
                            ? "قيد التنفيذ"
                            : lecture.status === "completed"
                              ? "مكتملة"
                              : lecture.status === "cancelled"
                                ? "ملغاة"
                                : "مجدولة"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                لا يوجد محاضرات مقررة اليوم
              </p>
            )}
          </CardContent>
        </Card>

        {/* At Risk Students */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-dashed mb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              طلاب متعثرون
            </CardTitle>
            <CardDescription>
              تنبيه الحضور: نسبة أقل من 50%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : atRiskStudents && atRiskStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="font-bold">الطالب</TableHead>
                    <TableHead className="font-bold text-left">النسبة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskStudents.slice(0, 5).map((item: any) => (
                    <TableRow key={item.student?._id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium py-3">
                        <div className="flex flex-col">
                          <span>
                            {typeof item.student?.name === "object"
                              ? `${item.student.name.first} ${item.student.name.last}`
                              : item.student?.name || "غير متوفر"}
                          </span>
                          <span className="text-xs text-muted-foreground font-normal tabular-nums">
                            #{item.student?.studentId || "00000"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge variant="destructive" className="tabular-nums">
                          {item.attendanceRate?.toFixed(1) || 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">لا يوجد طلاب في خطر حالياً 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
