import { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Filter,
  Activity,
  BookOpen,
  Award,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  useCourses,
  useSpecializations,
  useDashboardStats,
  useAtRiskStudents,
} from "@/hooks";
import {
  useWeeklySummary,
  useCourseAttendanceReport,
} from "@/hooks/use-attendance";
import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceReportsPage() {
  const [course, setCourse] = useState("all");
  const [specialization, setSpecialization] = useState("all");

  const { data: coursesData } = useCourses(
    specialization !== "all" ? { specialization } : undefined
  );
  const { data: specializationsData } = useSpecializations();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  
  // Fetch weekly summary
  const { data: weeklySummaryData, isLoading: weeklyLoading } = useWeeklySummary();
  
  // Fetch specific course report
  const { data: courseReportData, isLoading: courseReportLoading } = useCourseAttendanceReport(
    course !== "all" ? course : ""
  );

  // Fetch at risk students
  const { data: atRiskStudents } = useAtRiskStudents(course !== "all" ? course : undefined);

  const courses = coursesData?.data || [];
  const specializations = specializationsData || [];

  // Parse course report data
  const courseStudents: any[] = Array.isArray(courseReportData) ? courseReportData : ((courseReportData as any)?.data || []);
  
  const courseAvgAttendance = courseStudents.length > 0 
    ? courseStudents.reduce((sum: number, student: any) => sum + (student.stats?.attendanceRate || 0), 0) / courseStudents.length 
    : 0;

  // Use real statistics from API
  const stats = {
    totalStudents: dashboardStats?.totalStudents ?? 0,
    averageAttendance: dashboardStats?.todayAttendance?.rate ?? 0,
    totalLectures: dashboardStats?.activeLectures ?? 0,
    atRiskCount: atRiskStudents?.length ?? dashboardStats?.atRiskStudents ?? 0,
  };

  const handleExport = (format: "excel" | "pdf") => {
    console.log(`Exporting as ${format}`);
  };

  // Format weekly data for Recharts
  const weeklyChartData = weeklySummaryData?.dailyData?.map((day: any) => {
    const dateObj = new Date(day.date);
    const dayName = new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(dateObj);
    return {
      name: dayName,
      حاضر: day.present,
      غائب: day.absent,
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تقارير الحضور</h1>
          <p className="text-muted-foreground mt-1">
            تحليل وإحصائيات شاملة لبيانات الحضور
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4 text-muted-foreground" />
            تصفية التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الكلية</label>
              <Select dir="rtl" value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {specializations.map((dept: any) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">المادة</label>
              <Select dir="rtl" value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المواد (نظرة عامة)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المواد (نظرة عامة)</SelectItem>
                  {courses.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {course === "all" ? (
        <>
          {/* General Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {stats.averageAttendance}%
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      معدل حضور اليوم
                    </div>
                  </div>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {stats.totalLectures}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      محاضرات اليوم
                    </div>
                  </div>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {stats.totalStudents}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      إجمالي الطلاب
                    </div>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold text-red-500">{stats.atRiskCount}</div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      معرضون للخطر
                    </div>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  تحليل الحضور الأسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full" dir="ltr">
                  {weeklyLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : weeklyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'right' }} />
                        <Bar dataKey="حاضر" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="غائب" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      لا توجد بيانات لهذا الأسبوع
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    ملخص اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm font-medium">
                    <li className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        حاضرون
                      </span>
                      <span>{dashboardStats?.todayAttendance?.present ?? 0}</span>
                    </li>
                    <li className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        غائبون
                      </span>
                      <span>{dashboardStats?.todayAttendance?.absent ?? 0}</span>
                    </li>
                    <li className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        متأخرون
                      </span>
                      <span>{(dashboardStats?.todayAttendance as any)?.late ?? 0}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Specific Course Report */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  عدد الطلاب
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courseStudents.length}</div>
                <p className="text-xs text-muted-foreground">طالب مسجل</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  متوسط الحضور
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courseAvgAttendance.toFixed(1)}%
                </div>
                <Progress value={courseAvgAttendance} className="mt-2 h-2 bg-muted [&>div]:bg-primary" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  طلاب متعثرون
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.atRiskCount}
                </div>
                <p className="text-xs text-muted-foreground">تجاوزوا نسبة الغياب</p>
              </CardContent>
            </Card>
          </div>

          {/* Students Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                سجل الطلاب للمادة المحددة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {courseReportLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : courseStudents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  لا توجد بيانات حضور لهذه المادة
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الرقم الجامعي</TableHead>
                        <TableHead className="text-right">الطالب</TableHead>
                        <TableHead className="text-right">المحاضرات</TableHead>
                        <TableHead className="text-right">الحضور</TableHead>
                        <TableHead className="text-right">الغياب</TableHead>
                        <TableHead className="text-right">نسبة الحضور</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseStudents.map((student: any) => {
                        const s = student.student || student;
                        const stats = student.stats || {};
                        const name = typeof s.name === "object" ? `${s.name.first} ${s.name.last}` : s.name;
                        
                        return (
                        <TableRow key={s.studentId || s._id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {s.studentId}
                          </TableCell>
                          <TableCell className="font-bold">
                            {name}
                          </TableCell>
                          <TableCell>{stats.totalLectures || 0}</TableCell>
                          <TableCell className="text-green-600 font-bold">
                            {stats.present || 0}
                          </TableCell>
                          <TableCell className="text-red-600 font-bold">
                            {stats.absent || 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold ${
                                  (stats.attendanceRate || 0) < 75
                                    ? "text-red-500"
                                    : (stats.attendanceRate || 0) < 85
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                }`}
                              >
                                {stats.attendanceRate || 0}%
                              </span>
                              <Progress
                                value={stats.attendanceRate || 0}
                                className={`w-16 h-2 bg-muted ${
                                  (stats.attendanceRate || 0) < 75
                                    ? "[&>div]:bg-red-500"
                                    : (stats.attendanceRate || 0) < 85
                                    ? "[&>div]:bg-yellow-500"
                                    : "[&>div]:bg-green-500"
                                }`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
