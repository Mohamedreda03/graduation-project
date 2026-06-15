import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Users,
  Calendar,
  BookOpen,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useCourses, useDeleteCourse, useDepartments, useDoctor } from "@/hooks";
import type { Course, Department } from "@/types";

export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentFilter = searchParams.get("department") || "";
  const doctorFilter = searchParams.get("doctor") || "";
  const { data: doctorData } = useDoctor(doctorFilter);
  const levelFilter = searchParams.get("level") || "";
  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const setDepartmentFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all") {
        newParams.set("department", value);
      } else {
        newParams.delete("department");
      }
      newParams.set("page", "1");
      return newParams;
    });
  };

  const setLevelFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all") {
        newParams.set("level", value);
      } else {
        newParams.delete("level");
      }
      newParams.set("page", "1");
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
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handlePageChange = (pageIndex: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", (pageIndex + 1).toString());
      return newParams;
    });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("limit", pageSize.toString());
      newParams.set("page", "1");
      return newParams;
    });
  };

  const { data, isLoading } = useCourses({
    department:
      departmentFilter && departmentFilter !== "all"
        ? departmentFilter
        : undefined,
    doctor: doctorFilter || undefined,
    level:
      levelFilter && levelFilter !== "all" ? parseInt(levelFilter) : undefined,
    page,
    limit,
    search: searchQuery || undefined,
  });
  const { data: departmentsData } = useDepartments();
  const deleteMutation = useDeleteCourse();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "code",
      header: "الرمز",
    },
    {
      accessorKey: "name",
      header: "اسم المقرر",
    },
    {
      accessorKey: "department",
      header: "الكلية",
      cell: ({ row }) => {
        const dept = row.original.department;
        return dept && typeof dept === "object"
          ? (dept as any).name
          : "غير متوفر";
      },
    },
    {
      accessorKey: "doctor",
      header: "الدكتور",
      cell: ({ row }) => {
        const doctor = row.original.doctor;
        if (doctor && typeof doctor === "object") {
          return (
            (doctor as any).fullName ||
            (typeof (doctor as any).name === "object"
              ? `${(doctor as any).name.first} ${(doctor as any).name.last}`
              : (doctor as any).name)
          );
        }
        return "غير متوفر";
      },
    },
    {
      accessorKey: "level",
      header: "الفرقه",
      cell: ({ row }) => (
        <Badge variant="outline">الفرقه {row.original.level}</Badge>
      ),
    },
    {
      accessorKey: "semester",
      header: "الفصل الدراسي",
      cell: ({ row }) => row.original.semester || "غير محدد",
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const course = row.original;

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
              <DropdownMenuItem asChild>
                <Link to={`/courses/${course._id}/edit`}>
                  <Pencil className="ml-2 h-4 w-4" />
                  تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/courses/${course._id}/students`}>
                  <Users className="ml-2 h-4 w-4" />
                  الطلاب المسجلين
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/lectures?course=${course._id}`}>
                  <Calendar className="ml-2 h-4 w-4" />
                  المحاضرات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteId(course._id)}
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            المقررات
          </h1>
          <p className="text-muted-foreground font-medium">
            إدارة المقررات الدراسية وتعيين الأساتذة والطلاب
          </p>
        </div>
        <Button asChild className="rounded-xl h-11 px-6">
          <Link to="/courses/new">
            <Plus className="ml-2 h-5 w-5" />
            إضافة مقرر جديد
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
        <Select dir="rtl" value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px] rounded-xl border-muted bg-background">
            <SelectValue placeholder="جميع الكليات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الكليات</SelectItem>
            {departmentsData?.map((dept: Department) => (
              <SelectItem key={dept._id} value={dept._id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select dir="rtl" value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[180px] rounded-xl border-muted bg-background">
            <SelectValue placeholder="جميع الفرق" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفرق</SelectItem>
            <SelectItem value="1">الفرقه 1</SelectItem>
            <SelectItem value="2">الفرقه 2</SelectItem>
            <SelectItem value="3">الفرقه 3</SelectItem>
            <SelectItem value="4">الفرقه 4</SelectItem>
          </SelectContent>
        </Select>
      </div>



      {/* Doctor filter banner */}
      {doctorFilter && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 text-primary px-4 py-2.5 rounded-xl text-sm font-medium">
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>
            مقررات الدكتور:{" "}
            {doctorData?.fullName ||
              (doctorData?.name && typeof doctorData.name === "object"
                ? `${doctorData.name.first} ${doctorData.name.last}`
                : (doctorData?.name as string) || "")}
          </span>
          <Link
            to="/courses"
            className="mr-auto text-xs underline underline-offset-2 hover:text-primary/70 transition-colors"
          >
            إظهار جميع المقررات
          </Link>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="البحث باسم المقرر أو الرمز..."
        defaultSearchValue={searchQuery}
        onSearch={handeSearch}
        pageIndex={page - 1}
        pageSize={limit}
        pageCount={data?.pagination?.pages ?? 0}
        totalCount={data?.pagination?.total ?? 0}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        manualPagination={true}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المقرر نهائياً. لا يمكن التراجع عن هذا الإجراء.
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
