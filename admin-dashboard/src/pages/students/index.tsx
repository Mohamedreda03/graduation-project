import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Eye,
  Smartphone,
  Users,
  GraduationCap,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useStudents, useDepartments, useStudentStats } from "@/hooks";
import type { Student } from "@/types";

export function StudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentFilter = searchParams.get("department") || "";
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
      newParams.set("page", "1"); // Reset to first page on filter change
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
      newParams.set("page", "1"); // Reset to first page on filter change
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
      newParams.set("page", "1"); // Reset to first page on search
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

  const { data, isLoading } = useStudents({
    department:
      departmentFilter && departmentFilter !== "all"
        ? departmentFilter
        : undefined,
    level:
      levelFilter && levelFilter !== "all" ? parseInt(levelFilter) : undefined,
    page,
    limit,
    search: searchQuery || undefined,
  });
  const { data: statsData } = useStudentStats();
  const { data: departmentsData } = useDepartments();

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "studentId",
      header: "الرقم الأكاديمي",
    },
    {
      accessorKey: "name",
      header: "اسم الطالب",
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
      accessorKey: "academicInfo.department",
      header: "القسم",
      cell: ({ row }) => {
        const dept = row.original.academicInfo?.department;
        return dept && typeof dept === "object"
          ? (dept as any).name
          : "غير متوفر";
      },
    },
    {
      accessorKey: "academicInfo.level",
      header: "المستوى",
      cell: ({ row }) => (
        <Badge variant="outline">
          المستوى {row.original.academicInfo?.level || "-"}
        </Badge>
      ),
    },
    {
      accessorKey: "device",
      header: "الجهاز",
      cell: ({ row }) => (
        <Badge
          variant={row.original.device?.isVerified ? "default" : "secondary"}
        >
          <Smartphone className="ml-1 h-3 w-3" />
          {row.original.device?.isVerified ? "مسجل" : "غير مسجل"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const student = row.original;

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
                <Link to={`/students/${student._id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  عرض التفاصيل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/students/${student._id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  تعديل
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            الطلاب
          </h1>
          <p className="text-muted-foreground font-medium">
            إدارة بيانات الطلاب وتتبع تسجيل الأجهزة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-xl h-11 px-6">
            <Link to="/students/import">استيراد طلاب</Link>
          </Button>
          <Button
            asChild
            className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20"
          >
            <Link to="/students/new">
              <Plus className="ml-2 h-5 w-5" />
              إضافة طالب جديد
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                إجمالي الطلاب
              </p>
              <h3 className="text-2xl font-black text-primary">
                {statsData?.total || 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        {[1, 2, 3, 4].map((level) => (
          <Card
            key={level}
            className="rounded-2xl border-none shadow-sm bg-muted/30"
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                <GraduationCap className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  المستوى {level}
                </p>
                <h3 className="text-2xl font-black">
                  {statsData?.levels[level] || 0}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground ml-2">
            <Layers className="size-4" />
            <span>تصفية حسب:</span>
          </div>

          <Select dir="rtl" value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px] rounded-xl border-muted bg-background">
              <SelectValue placeholder="جميع الأقسام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {departmentsData?.map((dept: { _id: string; name: string }) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select dir="rtl" value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px] rounded-xl border-muted bg-background">
              <SelectValue placeholder="جميع المستويات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="1">المستوى 1</SelectItem>
              <SelectItem value="2">المستوى 2</SelectItem>
              <SelectItem value="3">المستوى 3</SelectItem>
              <SelectItem value="4">المستوى 4</SelectItem>
            </SelectContent>
          </Select>

          <div className="mr-auto">
            {(departmentFilter || levelFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchParams({})}
                className="text-muted-foreground hover:text-primary rounded-lg"
              >
                إعادة تعيين
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="البحث بالاسم أو الرقم الأكاديمي..."
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
      </div>
    </div>
  );
}
