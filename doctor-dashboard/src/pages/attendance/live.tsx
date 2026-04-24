import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Wifi,
  Clock,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table";
import { attendanceService } from "@/services/attendance.service";
import { hallsService } from "@/services/halls.service";
import { useUpdateAttendanceStatus } from "@/hooks";
import type { ColumnDef } from "@tanstack/react-table";

interface LiveAttendance {
  activeSessions: number;
  sessions: Array<{
    student: {
      _id: string;
      name: { first: string; last: string } | string;
      studentId: string;
    };
    connectedAt: string;
    macAddress: string;
  }>;
  inProgressRecords: number;
  records: Array<{
    student: {
      _id: string;
      name: { first: string; last: string } | string;
      studentId: string;
    };
    checkIn: string;
    totalTime: number;
    _id?: string; // AttendanceRecord ID
  }>;
}

export function LiveAttendancePage() {
  const { hallId } = useParams<{ hallId: string }>();
  const updateStatusMutation = useUpdateAttendanceStatus();

  const { data: hall } = useQuery({
    queryKey: ["hall", hallId],
    queryFn: () => hallsService.getById(hallId!),
    enabled: !!hallId,
  });

  const { data: liveData, isLoading, refetch } = useQuery<LiveAttendance>({
    queryKey: ["live-attendance", hallId],
    queryFn: () => attendanceService.getLiveAttendance(hallId!),
    refetchInterval: 5000, // Refetch every 5 seconds
    enabled: !!hallId,
  });

  const handleUpdateStatus = (
    id: string,
    status: "present" | "absent" | "late" | "excused",
  ) => {
    updateStatusMutation.mutate({ id, status });
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "student.studentId",
      header: "رقم الطالب",
    },
    {
      accessorKey: "student.name",
      header: "اسم الطالب",
      cell: ({ row }) => {
        const name = row.original.student.name;
        return typeof name === "object" ? `${name.first} ${name.last}` : name;
      },
    },
    {
      accessorKey: "checkIn",
      header: "وقت الدخول",
      cell: ({ row }) =>
        new Date(row.original.checkIn || row.original.connectedAt).toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      accessorKey: "totalTime",
      header: "مدة التواجد",
      cell: ({ row }) => `${row.original.totalTime || 0} دقيقة`,
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const record = row.original;
        // In live view, we might not have the attendance ID directly if it's just a session
        // But the backend should ideally return it or we can find it.
        if (!record._id) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleUpdateStatus(record._id, "present")}>
                <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                تحديد كحاضر
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus(record._id, "absent")}>
                <XCircle className="ml-2 h-4 w-4 text-red-600" />
                تحديد كغائب
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus(record._id, "late")}>
                <ClockIcon className="ml-2 h-4 w-4 text-yellow-600" />
                تحديد كمتأخر
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus(record._id, "excused")}>
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/my-schedule/today" className="text-muted-foreground hover:text-foreground">
          محاضرات اليوم
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">الحضور المباشر: {hall?.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الحضور المباشر</h1>
          <p className="text-muted-foreground mt-1">
            الطلاب المتصلون حالياً في {hall?.name}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
          تحديث تلقائي (5 ثوانٍ)
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأجهزة المتصلة بالـ AP</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveData?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">جهاز مسجل حالياً</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سجلات الحضور النشطة</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{liveData?.inProgressRecords || 0}</div>
            <p className="text-xs text-muted-foreground">طالب قيد تسجيل الحضور</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            الطلاب المتواجدون الآن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={liveData?.records || []}
            isLoading={isLoading}
            searchKey="student.name"
            searchPlaceholder="بحث عن طالب..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
