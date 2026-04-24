import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  Users,
  Calendar,
  ChevronRight,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { coursesService } from "@/services/courses.service";
import type { Course, User } from "@/types";

export function CourseDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["course", id],
    queryFn: () => coursesService.getById(id!),
    enabled: !!id,
  });

  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["course-students", id],
    queryFn: () => coursesService.getStudents(id!),
    enabled: !!id,
  });

  // Define columns for students DataTable
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "studentId",
      header: "رقم الطالب",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.studentId}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) =>
        typeof row.original.name === "object"
          ? `${row.original.name.first} ${row.original.name.last}`
          : row.original.name,
    },
    {
      accessorKey: "email",
      header: "البريد الإلكتروني",
      cell: ({ row }) => row.original.email,
    },
    {
      accessorKey: "academicInfo.department",
      header: "القسم",
      cell: ({ row }) => {
        const dept = row.original.academicInfo?.department;
        if (!dept) return "-";
        return typeof dept === "object" ? dept.name : dept;
      },
    },
    {
      accessorKey: "academicInfo.level",
      header: "المستوى",
      cell: ({ row }) => row.original.academicInfo?.level || "-",
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const student = row.original;
        const studentName = typeof student.name === "object" ? `${student.name.first} ${student.name.last}` : student.name;
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/attendance?course=${id}&q=${studentName}`}>
              <ClipboardCheck className="h-4 w-4 ml-2" />
              سجل الحضور
            </Link>
          </Button>
        );
      },
    },
  ];

  if (courseLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link to="/courses" className="hover:text-foreground">
            المواد
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>جاري التحميل...</span>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link to="/courses" className="hover:text-foreground">
            المواد
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>غير موجود</span>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive">
                المادة غير موجودة
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                تعذر العثور على هذه المادة، تأكد من صحة الرابط
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          to="/courses"
          className="text-muted-foreground hover:text-foreground"
        >
          المواد
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{course.name}</span>
      </div>

      {/* Course Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
          <p className="text-muted-foreground mt-1">{course.code}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/attendance?course=${course._id}`}>
            <ClipboardCheck className="h-4 w-4 ml-2" />
            سجل الحضور
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length || 0}</div>
            <p className="text-xs text-muted-foreground">طالب مسجل في المادة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستوى</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.level}</div>
            <p className="text-xs text-muted-foreground">المستوى الدراسي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الساعات المعتمدة
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.creditHours || 3}</div>
            <p className="text-xs text-muted-foreground">ساعة معتمدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            معلومات المادة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">كود المادة</p>
              <p className="font-medium">{course.code}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">القسم</p>
              <p className="font-medium">
                {typeof course.department === "object"
                  ? course.department.name
                  : course.department || "غير محدد"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">
                الفصل الدراسي
              </p>
              <p className="font-medium">{course.semester || "غير محدد"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">نوع المادة</p>
              <p className="font-medium">{course.type || "إجبارية"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List with Pagination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            الطلاب المسجلين
            <span className="text-sm text-muted-foreground font-normal">
              ({students?.length || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students || []}
            isLoading={studentsLoading}
            searchKey="name"
            searchPlaceholder="بحث بالاسم أو رقم الطالب..."
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
