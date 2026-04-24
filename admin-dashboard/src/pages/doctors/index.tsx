import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
import { useDoctors, useDeleteDoctor, useDepartments } from "@/hooks";
import type { Doctor } from "@/types";

export function DoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentFilter = searchParams.get("department") || "";
  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const setDepartmentFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all" && value !== " ") {
        newParams.set("department", value);
      } else {
        newParams.delete("department");
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

  const { data, isLoading } = useDoctors({
    department:
      departmentFilter && departmentFilter !== "all" && departmentFilter !== " "
        ? departmentFilter
        : undefined,
    page,
    limit,
    search: searchQuery || undefined,
  });
  const { data: departmentsData } = useDepartments();
  const deleteMutation = useDeleteDoctor();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Doctor>[] = [
    {
      accessorKey: "employeeId",
      header: "الرقم الوظيفي",
    },
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => {
        const name = row.original.name;
        if (name && typeof name === "object") {
          return `${(name as any).first} ${(name as any).last}`;
        }
        return (name as string) || "غير متوفر";
      },
    },
    {
      accessorKey: "email",
      header: "البريد الإلكتروني",
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => row.original.phone || "غير متوفر",
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const doctor = row.original;

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
                <Link to={`/doctors/${doctor._id}/edit`}>
                  <Pencil className="ml-2 h-4 w-4" />
                  تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/doctors/${doctor._id}/courses`}>
                  <BookOpen className="ml-2 h-4 w-4" />
                  المقررات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteId(doctor._id)}
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
            الأطباء
          </h1>
          <p className="text-muted-foreground font-medium">
            إدارة بيانات أعضاء هيئة التدريس والمقررات الخاصة بهم
          </p>
        </div>
        <Button asChild className="rounded-xl h-11 px-6">
          <Link to="/doctors/new">
            <Plus className="ml-2 h-5 w-5" />
            إضافة طبيب جديد
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
        <Select dir="rtl" value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px] rounded-xl border-muted bg-background">
            <SelectValue placeholder="جميع الأقسام" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">جميع الأقسام</SelectItem>
            {departmentsData?.map((dept: { _id: string; name: string }) => (
              <SelectItem key={dept._id} value={dept._id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="البحث باسم الطبيب أو الرقم الوظيفي..."
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
              سيتم حذف بيانات هذا الطبيب نهائياً. لا يمكن التراجع عن هذا
              الإجراء.
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
