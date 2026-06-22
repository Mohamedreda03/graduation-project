import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { useUsers, useUpdateUser } from "@/hooks";
import type { User, AdminRole } from "@/types";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "مدير النظام (Super Admin)",
  dean: "العميد / الوكيل",
  student_affairs: "شؤون الطلاب",
  head_of_department: "رئيس قسم علمي",
};

export function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get("adminRole") || "";
  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const setRoleFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all" && value !== " ") {
        newParams.set("adminRole", value);
      } else {
        newParams.delete("adminRole");
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

  const { data, isLoading } = useUsers({
    role: "admin",
    page,
    limit,
    search: searchQuery || undefined,
  });

  const updateMutation = useUpdateUser();
  const [statusChangeUser, setStatusChangeUser] = useState<User | null>(null);

  const handleToggleStatus = async () => {
    if (statusChangeUser) {
      await updateMutation.mutateAsync({
        id: statusChangeUser._id,
        data: { isActive: !statusChangeUser.isActive } as any,
      });
      setStatusChangeUser(null);
    }
  };

  // Local filter for admin sub-role (since backend does not filter adminRole directly, or we can filter locally)
  const allEmployees = data?.data ?? [];
  const filteredEmployees = allEmployees.filter((emp) => {
    if (!roleFilter || roleFilter === "all") return true;
    return emp.adminRole === roleFilter;
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => {
        const name = row.original.name;
        if (name && typeof name === "object") {
          return <span className="font-bold">{`${(name as any).first} ${(name as any).last}`}</span>;
        }
        return <span className="font-bold">{(name as string) || "غير متوفر"}</span>;
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
      accessorKey: "adminRole",
      header: "صلاحية الدور الممنوحة",
      cell: ({ row }) => {
        const role = row.original.adminRole;
        const label = role ? ROLE_LABELS[role] : "مدير غير محدد";
        const dept = row.original.department;
        const deptName = dept && typeof dept === "object" ? (dept as any).name : "";

        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground text-xs">{label}</span>
            {role === "head_of_department" && deptName && (
              <span className="text-[10px] text-primary font-bold">قسم: {deptName}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => <span className="tabular-nums font-semibold" dir="ltr">{row.original.phone || "—"}</span>,
    },
    {
      accessorKey: "isActive",
      header: "الحالة",
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <Badge variant={active ? "outline" : "destructive"} className={active ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 font-bold" : "font-bold"}>
            {active ? "نشط" : "معطل"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const employee = row.original;

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
            <DropdownMenuContent align="end" className="text-right">
              <DropdownMenuItem asChild>
                <Link to={`/employees/${employee._id}/edit`}>
                  <Pencil className="ml-2 h-4 w-4" />
                  تعديل الصلاحيات والبيانات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={employee.isActive ? "text-destructive focus:bg-destructive/10 focus:text-destructive" : "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"}
                onClick={() => setStatusChangeUser(employee)}
              >
                {employee.isActive ? (
                  <>
                    <UserX className="ml-2 h-4 w-4" />
                    تعطيل الحساب
                  </>
                ) : (
                  <>
                    <UserCheck className="ml-2 h-4 w-4" />
                    تنشيط الحساب
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const getEmployeeName = (emp: User | null) => {
    if (!emp) return "";
    const name = emp.name;
    if (name && typeof name === "object") {
      return `${(name as any).first} ${(name as any).last}`;
    }
    return (name as string) || "";
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4 border-dashed">
        <div>
          <h1 className="text-3xl font-black text-foreground">
            إدارة الموظفين والمسؤولين
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            عرض وإضافة وتعديل صلاحيات موظفي إدارة الكلية وشؤون الطلاب ورؤساء الأقسام
          </p>
        </div>
        <Button asChild className="h-11 px-6 font-bold rounded-xl shadow-md">
          <Link to="/employees/new">
            <Plus className="ml-2 h-5 w-5" />
            إضافة موظف جديد
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
        <div className="w-[220px]">
          <label className="text-xs font-bold text-muted-foreground block mb-1">تصفية حسب صلاحية الدور</label>
          <Select dir="rtl" value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full h-10 rounded-xl bg-background border-muted font-semibold text-xs">
              <SelectValue placeholder="جميع الصلاحيات..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الصلاحيات</SelectItem>
              {Object.entries(ROLE_LABELS).map(([key, value]) => (
                <SelectItem key={key} value={key} className="text-right">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredEmployees}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="البحث باسم الموظف أو البريد الإلكتروني..."
        defaultSearchValue={searchQuery}
        onSearch={handeSearch}
        pageIndex={page - 1}
        pageSize={limit}
        pageCount={data?.pagination?.pages ?? 0}
        totalCount={filteredEmployees.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        manualPagination={false} // Local filter applied above, so client-side pagination works best
      />

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeUser} onOpenChange={() => setStatusChangeUser(null)}>
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              {statusChangeUser?.isActive ? "تأكيد تعطيل حساب الموظف" : "تأكيد تنشيط حساب الموظف"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
              {statusChangeUser?.isActive
                ? `هل أنت متأكد من رغبتك في تعطيل حساب الموظف (${getEmployeeName(statusChangeUser)})؟ لن يتمكن الموظف من تسجيل الدخول إلى النظام حتى يتم تنشيط حسابه مرة أخرى.`
                : `هل أنت متأكد من رغبتك في إعادة تنشيط حساب الموظف (${getEmployeeName(statusChangeUser)})؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={statusChangeUser?.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl" : "bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl"}
            >
              {statusChangeUser?.isActive ? "تعطيل الحساب" : "تنشيط الحساب"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
