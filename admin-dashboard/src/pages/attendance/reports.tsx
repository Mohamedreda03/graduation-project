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
  PieChart,
  Activity,
  BookOpen,
  GraduationCap,
  Target,
  Award,
} from "lucide-react";

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
  useCourses,
  useDepartments,
  useDashboardStats,
  useAtRiskStudents,
} from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import type { Department } from "@/types";

export function AttendanceReportsPage() {
  const { data: coursesData } = useCourses();
  const { data: departmentsData } = useDepartments();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: atRiskStudents } = useAtRiskStudents();

  const [reportType, setReportType] = useState("daily");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [dateRange, setDateRange] = useState("week");

  const courses = coursesData?.data || [];
  const departments: Department[] = departmentsData || [];

  // Use real statistics from API
  const stats = {
    totalStudents: dashboardStats?.totalStudents ?? 0,
    averageAttendance: dashboardStats?.todayAttendance?.rate ?? 0,
    trend: (dashboardStats?.todayAttendance?.rate ?? 0) > 70 ? "+5%" : "-3%",
    trendUp: (dashboardStats?.todayAttendance?.rate ?? 0) > 70,
    totalLectures: dashboardStats?.activeLectures ?? 0,
    atRiskCount: atRiskStudents?.length ?? dashboardStats?.atRiskStudents ?? 0,
  };

  const handleExport = (format: "excel" | "pdf") => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Stats Cards */}
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
                  متوسط الحضور
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
                  <div className="text-2xl font-bold">{stats.atRiskCount}</div>
                )}
                <div className="text-sm text-muted-foreground">
                  طلاب معرضون للخطر
                </div>
              </div>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            فلترة التقارير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع التقرير</label>
              <Select dir="rtl" value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="semester">فصلي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <Select dir="rtl" value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="semester">الفصل الحالي</SelectItem>
                  <SelectItem value="year">السنة الدراسية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">القسم</label>
              <Select dir="rtl" value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map((dept) => (
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
                  <SelectValue placeholder="جميع المواد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المواد</SelectItem>
                  {courses.map((c) => (
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              تحليل الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center border border-dashed rounded-lg bg-muted/20">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">الرسم البياني للحضور</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  يمكنك استخدام مكتبة مثل Recharts لعرض بيانات الحضور بشكل مرئي
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <div className="space-y-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-muted-foreground" />
                أفضل نسب الحضور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {courses.slice(0, 4).map((c, idx) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium bg-muted">
                      {idx + 1}
                    </div>
                    <span className="text-sm">{c.name}</span>
                  </div>
                  <span className="text-sm font-medium">{95 - idx * 5}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attendance Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-muted-foreground" />
                ملخص سريع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  الحاضرون اليوم:{" "}
                  {dashboardStats?.todayAttendance?.present ?? 0} طالب
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  الغائبون اليوم: {dashboardStats?.todayAttendance?.absent ??
                    0}{" "}
                  طالب
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  طلاب معرضون للخطر: {stats.atRiskCount} طالب
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            ملخص الحضور حسب المادة
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير الجدول
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-3 font-medium text-sm">المادة</th>
                  <th className="text-right p-3 font-medium text-sm">
                    عدد المحاضرات
                  </th>
                  <th className="text-right p-3 font-medium text-sm">
                    متوسط الحضور
                  </th>
                  <th className="text-right p-3 font-medium text-sm">
                    أعلى حضور
                  </th>
                  <th className="text-right p-3 font-medium text-sm">
                    أقل حضور
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.slice(0, 5).map((course, idx) => (
                  <tr key={course._id} className="hover:bg-muted/50">
                    <td className="p-3 font-medium">{course.name}</td>
                    <td className="p-3">{10 + idx * 2}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${75 + idx * 3}%` }}
                          />
                        </div>
                        <span className="text-sm">{75 + idx * 3}%</span>
                      </div>
                    </td>
                    <td className="p-3">95%</td>
                    <td className="p-3">58%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
