import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Play,
  Square,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import {
  useLectures,
  useDeleteLecture,
  useCourses,
  useHalls,
  useStartLecture,
  useEndLecture,
} from "@/hooks";
import type { Lecture, Course, Hall } from "@/types";

const dayNames = [
  "الأحد",
  "الأثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  scheduled: { label: "مجدولة", variant: "outline" },
  "in-progress": { label: "قيد التنفيذ", variant: "default" },
  completed: { label: "مكتملة", variant: "secondary" },
  cancelled: { label: "ملغاة", variant: "destructive" },
};

export function LecturesPage() {
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [hallFilter, setHallFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useLectures({
    course: courseFilter || undefined,
    hall: hallFilter || undefined,
    status: statusFilter || undefined,
  });
  const { data: coursesData } = useCourses();
  const { data: hallsData } = useHalls();
  const deleteMutation = useDeleteLecture();
  const startMutation = useStartLecture();
  const endMutation = useEndLecture();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Lecture>[] = [
    {
      accessorKey: "course",
      header: "المادة",
      cell: ({ row }) => {
        const course = row.original.course;
        return typeof course === "object" ? course.name : "غير معروف";
      },
    },
    {
      accessorKey: "hall",
      header: "القاعة",
      cell: ({ row }) => {
        const hall = row.original.hall;
        return typeof hall === "object" ? hall.name : "غير معروف";
      },
    },
    {
      accessorKey: "dayOfWeek",
      header: "اليوم",
      cell: ({ row }) => dayNames[row.original.dayOfWeek],
    },
    {
      accessorKey: "startTime",
      header: "الوقت",
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground">
          {row.original.startTime} - {row.original.endTime}
        </span>
      ),
    },
    {
      accessorKey: "lectureType",
      header: "النوع",
      cell: ({ row }) => {
        const typeMap: Record<string, string> = {
          lecture: "محاضرة",
          section: "سكشن",
          lab: "معمل",
        };
        const t = row.original.lectureType || row.original.type || "lecture";
        return typeMap[t] || t;
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const s = row.original.status || "scheduled";
        const status = statusMap[s] || {
          label: s,
          variant: "outline" as const,
        };
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      accessorKey: "doctor",
      header: "الدكتور",
      cell: ({ row }) => {
        const doctor = row.original.doctor;
        if (!doctor) return "—";
        if (typeof doctor === "object" && doctor !== null) {
          const name = (doctor as any).name;
          if (typeof name === "object") return `${name.first} ${name.last}`;
          return name || "—";
        }
        return "—";
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const lecture = row.original;
        const lectureStatus = lecture.status || "scheduled";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 rounded-full hover:bg-muted/50"
              >
                <span className="sr-only">فتح القائمة</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {lectureStatus === "scheduled" && (
                <DropdownMenuItem
                  onClick={() => startMutation.mutate(lecture._id)}
                >
                  <Play className="ml-2 h-4 w-4" />
                  بدء المحاضرة
                </DropdownMenuItem>
              )}
              {lectureStatus === "in-progress" && (
                <DropdownMenuItem
                  onClick={() => endMutation.mutate(lecture._id)}
                >
                  <Square className="ml-2 h-4 w-4" />
                  إنهاء المحاضرة
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/lectures/${lecture._id}/edit`}>
                  <Pencil className="ml-2 h-4 w-4" />
                  تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteId(lecture._id)}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                حذف
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            المحاضرات
          </h1>
          <p className="text-muted-foreground font-medium">
            إدارة جدول المحاضرات ومتابعة حالتها
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-xl h-11 px-6">
            <Link to="/lectures/schedule">جدولة المحاضرات الدورية</Link>
          </Button>
          <Button asChild className="rounded-xl h-11 px-6">
            <Link to="/lectures/new">
              <Plus className="ml-2 h-5 w-5" />
              إضافة محاضرة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select dir="rtl" value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="كل المواد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المواد</SelectItem>
            {coursesData?.data?.map((course: Course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select dir="rtl" value={hallFilter} onValueChange={setHallFilter}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="كل القاعات" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="all">كل القاعات</SelectItem>
            {hallsData?.map((hall: Hall) => (
              <SelectItem key={hall._id} value={hall._id}>
                {hall.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select dir="rtl" value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="scheduled">مجدولة</SelectItem>
            <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه المحاضرة نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
