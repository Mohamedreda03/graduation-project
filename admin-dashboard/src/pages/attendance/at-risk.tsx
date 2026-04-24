import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { useAtRiskStudents, useCourses } from "@/hooks";

interface AtRiskStudent {
  student: {
    _id: string;
    name: { first: string; last: string } | string;
    studentId: string;
  };
  course?: {
    _id: string;
    name: string;
    code: string;
  };
  attendanceRate: number;
  totalLectures: number;
  present: number;
  absent: number;
}

export function AtRiskStudentsPage() {
  const [courseFilter, setCourseFilter] = useState<string>("");

  const { data, isLoading } = useAtRiskStudents(courseFilter || undefined);
  const { data: coursesData } = useCourses();

  const columns: ColumnDef<AtRiskStudent>[] = [
    {
      accessorKey: "student.studentId",
      header: "الرقم الأكاديمي",
    },
    {
      accessorKey: "student.name",
      header: "اسم الطالب",
      cell: ({ row }) => {
        const student = row.original.student;
        return typeof student.name === "object"
          ? `${student.name.first} ${student.name.last}`
          : student.name;
      },
    },
    {
      accessorKey: "course.name",
      header: "المادة",
      cell: ({ row }) => row.original.course?.name || "غير معروف",
    },
    {
      accessorKey: "attendanceRate",
      header: "نسبة الحضور",
      cell: ({ row }) => {
        const rate = row.original.attendanceRate;
        return (
          <Badge variant={rate < 85 ? "destructive" : "outline"}>
            {rate.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      accessorKey: "present",
      header: "المحاضرات المحملة",
      cell: ({ row }) =>
        `${row.original.present} / ${row.original.totalLectures}`,
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const student = row.original.student;
        const course = row.original.course;
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link
              to={`/attendance?course=${course?._id}&student=${student._id}`}
            >
              <Eye className="h-4 w-4 ml-2" />
              عرض السجلات
            </Link>
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          طلاب معرضون للحرمان
        </h1>
        <p className="text-muted-foreground">
          الطلاب الذين تقل نسبة حضورهم عن 85% وقد يتعرضون للحرمان من دخول
          الامتحان
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            تنبيه هام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            توضح هذه القائمة الطلاب الذين تقل نسبة حضورهم عن 85% وهم معرضون لخطر
            الحرمان من دخول الامتحان النهائي. يرجى المتابعة مع هؤلاء الطلاب
            وإخطارهم بضرورة الانتظام في الحضور.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <Select dir="rtl" value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="كل المواد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المواد</SelectItem>
            {coursesData?.data?.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchKey="student.name"
        searchPlaceholder="بحث بالاسم..."
      />
    </div>
  );
}
