import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardCheck,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { attendanceService } from "@/services/attendance.service";
import { coursesService } from "@/services/courses.service";
import { useAuth } from "@/contexts/auth-context";
import { useUpdateAttendanceStatus } from "@/hooks";
import type { AttendanceRecord, Course } from "@/types";

const statusLabels: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "معذور",
  "in-progress": "جاري",
};

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  excused: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

// Helper function to get student data
const getStudentData = (student: AttendanceRecord["student"]) => {
  if (typeof student === "string" || !student)
    return { name: "-", studentId: "-", id: "" };
  const name =
    typeof student.name === "object"
      ? `${student.name.first} ${student.name.last}`
      : student.name || "-";
  return { name, studentId: student.studentId || "-", id: student._id };
};

// Helper function to get course name
const getCourseName = (course: AttendanceRecord["course"]) => {
  if (typeof course === "string" || !course) return "-";
  return course.name || "-";
};

export function AttendancePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCourse, setSelectedCourse] = useState(
    searchParams.get("course") || "",
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "",
  );
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || "",
  );
  const studentFilter = searchParams.get("student") || "";

  const updateStatusMutation = useUpdateAttendanceStatus();

  // Get my courses
  const { data: coursesData } = useQuery({
    queryKey: ["my-courses", user?._id],
    queryFn: () => coursesService.getAll({ doctor: user?._id }),
    enabled: !!user?._id,
  });

  const myCourses = coursesData?.data || [];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Get attendance records with pagination
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: [
      "attendance",
      selectedCourse,
      selectedStatus,
      selectedDate,
      studentFilter,
      page,
      limit,
    ],
    queryFn: () =>
      attendanceService.getAll({
        course: selectedCourse || undefined,
        status: selectedStatus || undefined,
        date: selectedDate || undefined,
        student: studentFilter || undefined,
        page,
        limit,
      }),
  });

  const records: AttendanceRecord[] = attendanceData?.data || [];
  const pagination = attendanceData?.pagination || { total: 0, pages: 0 };

  // Calculate stats
  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    late: records.filter((r) => r.status === "late").length,
  };

  const handleCourseChange = (value: string) => {
    const val = value === "all" ? "" : value;
    setSelectedCourse(val);
    setPage(1);
    if (value === "all") {
      searchParams.delete("course");
    } else {
      searchParams.set("course", value);
    }
    setSearchParams(searchParams);
  };

  const handleStatusChange = (value: string) => {
    const val = value === "all" ? "" : value;
    setSelectedStatus(val);
    setPage(1);
    if (value === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", value);
    }
    setSearchParams(searchParams);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setPage(1);
    if (!value) {
      searchParams.delete("date");
    } else {
      searchParams.set("date", value);
    }
    setSearchParams(searchParams);
  };

  const onUpdateStatus = (
    id: string,
    status: "present" | "absent" | "late" | "excused",
  ) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Define columns for DataTable
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "student",
      header: "الطالب",
      cell: ({ row }) => {
        const { name } = getStudentData(row.original.student);
        return <span className="font-medium">{name}</span>;
      },
    },
    {
      accessorKey: "studentId",
      header: "رقم الطالب",
      cell: ({ row }) => {
        const { studentId } = getStudentData(row.original.student);
        return studentId;
      },
    },
    {
      accessorKey: "course",
      header: "المادة",
      cell: ({ row }) => getCourseName(row.original.course),
    },
    {
      accessorKey: "date",
      header: "التاريخ",
      cell: ({ row }) =>
        row.original.date
          ? new Date(row.original.date).toLocaleDateString("ar-EG")
          : "-",
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status] || ""}>
          {statusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "checkInTime",
      header: "وقت الدخول",
      cell: ({ row }) => {
        // Try to get check-in time from sessions array
        const sessions = row.original.sessions;
        if (sessions && sessions.length > 0 && sessions[0].checkIn) {
          return new Date(sessions[0].checkIn).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        return "-";
      },
    },
    {
      accessorKey: "presencePercentage",
      header: "نسبة الحضور",
      cell: ({ row }) =>
        row.original.presencePercentage !== undefined
          ? `${row.original.presencePercentage.toFixed(0)}%`
          : "-",
    },
    {
      id: "actions",
      header: "تعديل الحالة",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onUpdateStatus(record._id, "present")}
              >
                <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                تحديد كحاضر
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateStatus(record._id, "absent")}
              >
                <XCircle className="ml-2 h-4 w-4 text-red-600" />
                تحديد كغائب
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateStatus(record._id, "late")}
              >
                <Clock className="ml-2 h-4 w-4 text-yellow-600" />
                تحديد كمتأخر
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateStatus(record._id, "excused")}
              >
                <AlertTriangle className="ml-2 h-4 w-4 text-blue-600" />
                تحديد كمعذور
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجلات الحضور</h1>
        <p className="text-muted-foreground mt-1">
          متابعة حضور الطلاب في محاضراتك
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي السجلات
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">سجل حضور</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حضور</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.present}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${((stats.present / stats.total) * 100).toFixed(1)}%`
                : "0%"}{" "}
              من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">غياب</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.absent}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${((stats.absent / stats.total) * 100).toFixed(1)}%`
                : "0%"}{" "}
              من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تأخير</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.late}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${((stats.late / stats.total) * 100).toFixed(1)}%`
                : "0%"}{" "}
              من الإجمالي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground ml-2">
          <span>تصفية حسب:</span>
        </div>

        <div className="min-w-[200px]">
          <Select
            value={selectedCourse || "all"}
            onValueChange={handleCourseChange}
          >
            <SelectTrigger className="w-[200px] rounded-xl border-muted bg-background">
              <SelectValue placeholder="المادة الدراسية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {myCourses.map((course: Course) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[180px]">
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-[180px] rounded-xl border-muted bg-background pl-8"
            />
            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[160px]">
          <Select
            value={selectedStatus || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[160px] rounded-xl border-muted bg-background">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="present">حاضر</SelectItem>
              <SelectItem value="absent">غائب</SelectItem>
              <SelectItem value="late">متأخر</SelectItem>
              <SelectItem value="excused">معذور</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Records Table with Pagination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            سجلات الحضور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={records}
            isLoading={isLoading}
            searchKey="student"
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
    </div>
  );
}
