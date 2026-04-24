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
    <Card className="border-border bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary/70" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="text-2xl font-bold text-foreground">{value}</div>
        )}
        {description && (
          <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          لوحة التحكم
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          نظرة عامة على حالة النظام اليوم
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Lectures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              محاضرات اليوم
            </CardTitle>
            <CardDescription>المحاضرات المقررة لهذا اليوم</CardDescription>
          </CardHeader>
          <CardContent>
            {lecturesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : todayLectures && todayLectures.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المادة</TableHead>
                    <TableHead>القاعة</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayLectures.slice(0, 5).map((lecture: any) => (
                    <TableRow key={lecture._id}>
                      <TableCell className="font-medium">
                        {lecture.course?.name || "غير متوفر"}
                      </TableCell>
                      <TableCell>{lecture.hall?.name || "غير متوفر"}</TableCell>
                      <TableCell dir="ltr">
                        {lecture.startTime} - {lecture.endTime}
                      </TableCell>
                      <TableCell>
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
              <p className="text-center text-muted-foreground py-4">
                لا يوجد محاضرات مقررة اليوم
              </p>
            )}
          </CardContent>
        </Card>

        {/* At Risk Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              طلاب في خطر
            </CardTitle>
            <CardDescription>
              الطلاب الذين تقل نسبة حضورهم عن 85%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : atRiskStudents && atRiskStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الرقم الأكاديمي</TableHead>
                    <TableHead>نسبة الحضور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskStudents.slice(0, 5).map((item: any) => (
                    <TableRow key={item.student?._id}>
                      <TableCell className="font-medium">
                        {typeof item.student?.name === "object"
                          ? `${item.student.name.first} ${item.student.name.last}`
                          : item.student?.name || "غير متوفر"}
                      </TableCell>
                      <TableCell>
                        {item.student?.studentId || "غير متوفر"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {item.attendanceRate?.toFixed(1) || 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                لا يوجد طلاب في خطر حالياً 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
