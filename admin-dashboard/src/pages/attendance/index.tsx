import { Link, useSearchParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar as CalendarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import {
  useAttendance,
  useCourses,
  useUpdateAttendanceStatus,
  useExportAttendanceReport,
} from "@/hooks";
import type { AttendanceRecord } from "@/types";

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  present: { label: "حاضر", variant: "default", icon: CheckCircle },
  absent: { label: "غائب", variant: "destructive", icon: XCircle },
  late: { label: "متأخر", variant: "outline", icon: Clock },
  excused: { label: "عذر مقبول", variant: "secondary", icon: AlertTriangle },
  "in-progress": { label: "جاري", variant: "outline", icon: Clock },
};

export function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const courseFilter = searchParams.get("course") || "";
  const statusFilter = searchParams.get("status") || "";
  const dateFilter = searchParams.get("date") || "";
  const searchQuery = searchParams.get("q") || "";

  const setCourseFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all") {
        newParams.set("course", value);
      } else {
        newParams.delete("course");
      }
      return newParams;
    });
  };

  const setStatusFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all") {
        newParams.set("status", value);
      } else {
        newParams.delete("status");
      }
      return newParams;
    });
  };

  const setDateFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set("date", value);
      } else {
        newParams.delete("date");
      }
      return newParams;
    });
  };

  const handeSearch = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set("q", value);
      } else {
        newParams.delete("q");
      }
      return newParams;
    });
  };

  const { data, isLoading } = useAttendance({
    course: courseFilter && courseFilter !== "all" ? courseFilter : undefined,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    startDate: dateFilter || undefined,
  });
  const { data: coursesData } = useCourses();
  const updateStatusMutation = useUpdateAttendanceStatus();
  const exportMutation = useExportAttendanceReport();

  const handleStatusChange = (
    id: string,
    status: "present" | "absent" | "late" | "excused",
  ) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleExport = (courseId: string, format: "csv" | "excel" | "pdf") => {
    exportMutation.mutate({ courseId, format });
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "student",
      header: "الطالب",
      cell: ({ row }) => {
        const student = row.original.student;
        return typeof student === "object"
          ? typeof student.name === "object"
            ? `${student.name.first} ${student.name.last}`
            : student.name
          : "غير معروف";
      },
    },
    {
      accessorKey: "studentId",
      header: "رقم الطالب",
      cell: ({ row }) => {
        const student = row.original.student;
        return typeof student === "object" ? student.studentId : "غير معروف";
      },
    },
    {
      accessorKey: "course",
      header: "المادة",
      cell: ({ row }) => {
        const course = row.original.course;
        return typeof course === "object" ? course.name : "غير معروف";
      },
    },
    {
      accessorKey: "date",
      header: "التاريخ",
      cell: ({ row }) => {
        if (row.original.date) {
          return new Date(row.original.date).toLocaleDateString("ar-EG");
        }
        return "غير معروف";
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = statusMap[row.original.status];
        if (!status) return row.original.status;
        const Icon = status.icon;
        return (
          <Badge variant={status.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {status.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "checkInTime",
      header: "وقت الدخول",
      cell: ({ row }) => {
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
      cell: ({ row }) => {
        return row.original.presencePercentage !== undefined
          ? `${row.original.presencePercentage}%`
          : "-";
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const record = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">فتح القائمة</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleStatusChange(record._id, "present")}
              >
                <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                تحديد كحاضر
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(record._id, "absent")}
              >
                <XCircle className="ml-2 h-4 w-4 text-red-600" />
                تحديد كغائب
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(record._id, "late")}
              >
                <Clock className="ml-2 h-4 w-4 text-yellow-600" />
                تحديد كمتأخر
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(record._id, "excused")}
              >
                <AlertTriangle className="ml-2 h-4 w-4 text-blue-600" />
                تحديد كعذر مقبول
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">سجلات الحضور</h1>
          <p className="text-muted-foreground">عرض وتعديل سجلات حضور الطلاب</p>
        </div>
        {courseFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="ml-2 h-4 w-4" />
                تصدير تقرير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleExport(courseFilter, "excel")}
              >
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport(courseFilter, "csv")}
              >
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport(courseFilter, "pdf")}
              >
                تصدير PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium pr-1">المادة الدراسية</label>
          <Select dir="rtl" value={courseFilter || "all"} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="اختر المادة" />
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium pr-1">تاريخ المحاضرة</label>
          <div className="relative">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[200px] bg-background pl-8"
            />
            <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium pr-1">حالة الحضور</label>
          <Select dir="rtl" value={statusFilter || "all"} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="present">حاضر</SelectItem>
              <SelectItem value="absent">غائب</SelectItem>
              <SelectItem value="late">متأخر</SelectItem>
              <SelectItem value="excused">عذر مقبول</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchKey="student"
        searchPlaceholder="بحث عن طالب بالاسم..."
        defaultSearchValue={searchQuery}
        onSearch={handeSearch}
      />
    </div>
  );
}
