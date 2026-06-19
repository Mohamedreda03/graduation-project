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
import { useDoctors, useDeleteDoctor, useSpecializations } from "@/hooks";
import type { Doctor } from "@/types";

export function DoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const specializationFilter = searchParams.get("specialization") || "";
  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const setSpecializationFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all" && value !== " ") {
        newParams.set("specialization", value);
      } else {
        newParams.delete("specialization");
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
    specialization:
      specializationFilter && specializationFilter !== "all" && specializationFilter !== " "
        ? specializationFilter
        : undefined,
    page,
    limit,
    search: searchQuery || undefined,
  });
  const { data: specializationsData } = useSpecializations();
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
      cell: ({ row }) => <span className="tabular-nums font-mono text-sm">{row.original.employeeId || "—"}</span>,
    },
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => {
        const name = row.original.name;
        if (name && typeof name === "object") {
          return <span className="font-medium">{`${(name as any).first} ${(name as any).last}`}</span>;
        }
        return <span className="font-medium">{(name as string) || "غير متوفر"}</span>;
      },
    },
    {
      accessorKey: "email",
      header: "البريد الإلكتروني",
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground text-sm font-mono">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => <span className="tabular-nums" dir="ltr">{row.original.phone || "—"}</span>,
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
                className="h-8 w-8 p-0"
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
                <Link to={`/courses?doctor=${doctor._id}`}>
                  <BookOpen className="ml-2 h-4 w-4" />
                  المقررات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4 border-dashed">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            أعضاء هيئة التدريس
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة بيانات الدكاترة والمقررات الأكاديمية الخاصة بهم
          </p>
        </div>
        <Button asChild className="h-10 px-5">
          <Link to="/doctors/new">
            <Plus className="ml-2 h-4 w-4" />
            إضافة عضو هيئة تدريس
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-3 rounded-lg border shadow-sm">
        <Select dir="rtl" value={specializationFilter} onValueChange={setSpecializationFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="تصفية حسب القسم..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">جميع الأقسام</SelectItem>
            {specializationsData?.map((dept: { _id: string; name: string }) => (
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
        searchPlaceholder="البحث باسم العضو أو الرقم الوظيفي..."
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
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا السجل الأكاديمي؟ لا يمكن التراجع عن هذا الإجراء وسيتم إزالة ارتباط العضو بالمقررات الدراسية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
