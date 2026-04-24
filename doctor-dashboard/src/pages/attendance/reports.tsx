import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/data-table";
import { attendanceService } from "@/services/attendance.service";
import { coursesService } from "@/services/courses.service";
import { useAuth } from "@/contexts/auth-context";
import type { Course } from "@/types";

interface StudentReport {
  student: {
    _id: string;
    name: { first: string; last: string } | string;
    studentId: string;
  };
  stats: {
    totalLectures: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  };
  isAtRisk: boolean;
}

export function AttendanceReportsPage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("");

  // Get my courses
  const { data: coursesData } = useQuery({
    queryKey: ["my-courses", user?._id],
    queryFn: () => coursesService.getAll({ doctor: user?._id }),
    enabled: !!user?._id,
  });

  const myCourses: Course[] = coursesData?.data || [];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Get course attendance report with pagination
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["course-report", selectedCourse, page, limit],
    queryFn: () =>
      attendanceService.getCourseReport(selectedCourse, page, limit),
    enabled: !!selectedCourse,
  });

  // Get at-risk students
  const { data: atRiskData } = useQuery({
    queryKey: ["at-risk", selectedCourse],
    queryFn: () =>
      attendanceService.getAtRiskStudents(selectedCourse || undefined),
  });

  const students: StudentReport[] = reportData?.students || [];
  const pagination = reportData?.pagination || { total: 0, pages: 0 };
  const atRiskCount = atRiskData?.length || 0;

  // Calculate averages
  const avgAttendance =
    students.length > 0
      ? students.reduce((acc, s) => acc + s.stats.attendanceRate, 0) /
        students.length
      : 0;

  // Define columns for DataTable
  const columns: ColumnDef<StudentReport>[] = [
    {
      accessorKey: "student.name",
      header: "الطالب",
      cell: ({ row }) => {
        const name = row.original.student.name;
        return (
          <span className="font-medium">
            {typeof name === "object" ? `${name.first} ${name.last}` : name}
          </span>
        );
      },
    },
    {
      accessorKey: "student.studentId",
      header: "رقم الطالب",
      cell: ({ row }) => row.original.student.studentId,
    },
    {
      accessorKey: "stats.totalLectures",
      header: "المحاضرات",
      cell: ({ row }) => row.original.stats.totalLectures,
    },
    {
      accessorKey: "stats.present",
      header: "حضور",
      cell: ({ row }) => (
        <span className="text-green-600">{row.original.stats.present}</span>
      ),
    },
    {
      accessorKey: "stats.absent",
      header: "غياب",
      cell: ({ row }) => (
        <span className="text-red-600">{row.original.stats.absent}</span>
      ),
    },
    {
      accessorKey: "stats.late",
      header: "تأخير",
      cell: ({ row }) => (
        <span className="text-yellow-600">{row.original.stats.late}</span>
      ),
    },
    {
      accessorKey: "stats.attendanceRate",
      header: "نسبة الحضور",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress
            value={row.original.stats.attendanceRate}
            className="w-16 h-2"
          />
          <span
            className={
              row.original.stats.attendanceRate >= 75
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {row.original.stats.attendanceRate.toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      accessorKey: "isAtRisk",
      header: "الحالة",
      cell: ({ row }) => {
        if (row.original.isAtRisk) {
          return <Badge variant="destructive">متعثر</Badge>;
        }
        if (row.original.stats.attendanceRate >= 90) {
          return <Badge className="bg-green-100 text-green-800">ممتاز</Badge>;
        }
        return <Badge variant="secondary">جيد</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تقارير الحضور</h1>
          <p className="text-muted-foreground mt-1">تحليل نسب الحضور للطلاب</p>
        </div>
        <Select
          value={selectedCourse}
          onValueChange={(val) => {
            setSelectedCourse(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[250px] rounded-xl border-muted bg-background">
            <SelectValue placeholder="اختر المادة لعرض التقرير" />
          </SelectTrigger>
          <SelectContent>
            {myCourses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.name} ({course.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedCourse ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">اختر مادة لعرض التقرير</p>
              <p className="text-sm text-muted-foreground mt-1">
                حدد المادة من القائمة أعلاه لعرض تقرير الحضور التفصيلي
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  عدد الطلاب
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
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
                  {avgAttendance.toFixed(1)}%
                </div>
                <Progress value={avgAttendance} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  طلاب متعثرون
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {atRiskCount}
                </div>
                <p className="text-xs text-muted-foreground">أقل من 75% حضور</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  طلاب ممتازين
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {students.filter((s) => s.stats.attendanceRate >= 90).length}
                </div>
                <p className="text-xs text-muted-foreground">90% فأكثر</p>
              </CardContent>
            </Card>
          </div>

          {/* Students Report Table with Pagination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                تقرير حضور الطلاب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={students}
                isLoading={isLoading}
                searchKey="student.name"
                searchPlaceholder="بحث بالاسم..."
                pageSize={limit}
                pageIndex={page - 1}
                pageCount={pagination.pages}
                totalCount={pagination.total}
                onPageChange={(idx) => setPage(idx + 1)}
                onPageSizeChange={setLimit}
                manualPagination={true}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
