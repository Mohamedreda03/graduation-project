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
import { useStudents, useSpecializations, useStudentStats } from "@/hooks";
import type { Student } from "@/types";

const levelLabels: Record<number | string, string> = {
  "1": "إعدادي",
  "2": "الفرقة الأولى",
  "3": "الفرقة الثانية",
  "4": "الفرقة الثالثة",
  "5": "الفرقة الرابعة",
};

export function StudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const specializationFilter = searchParams.get("specialization") || "";
  const levelFilter = searchParams.get("level") || "";
  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const setSpecializationFilter = (value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== "all") {
        newParams.set("specialization", value);
      } else {
        newParams.delete("specialization");
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
    specialization:
      specializationFilter && specializationFilter !== "all"
        ? specializationFilter
        : undefined,
    level:
      levelFilter && levelFilter !== "all" ? parseInt(levelFilter) : undefined,
    page,
    limit,
    search: searchQuery || undefined,
  });
  const { data: statsData } = useStudentStats();
  const { data: specializationsData } = useSpecializations();

  const selectedSpecializationObj = specializationsData?.find((s: any) => s._id === specializationFilter);
  const availableLevels = selectedSpecializationObj?.levels || [];

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "studentId",
      header: "الرقم الأكاديمي",
      cell: ({ row }) => <span className="tabular-nums font-mono text-sm">{row.original.studentId || "—"}</span>,
    },
    {
      accessorKey: "name",
      header: "اسم الطالب",
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
      accessorKey: "academicInfo.specialization",
      header: "القسم",
      cell: ({ row }) => {
        const dept = row.original.academicInfo?.specialization;
        return dept && typeof dept === "object"
          ? (dept as any).name
          : "غير متوفر";
      },
    },
    {
      accessorKey: "academicInfo.level",
      header: "الفرقه",
      cell: ({ row }) => {
        const lvl = row.original.academicInfo?.level;
        return (
          <Badge variant="outline" className="font-medium">
            {lvl ? (levelLabels[lvl] || `الفرقة ${lvl}`) : "-"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "device",
      header: "الجهاز",
      cell: ({ row }) => (
        <Badge
          variant={row.original.device?.isVerified ? "default" : "secondary"}
          className="font-medium"
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
                className="h-8 w-8 p-0"
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4 border-dashed">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            الطلاب
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة بيانات الطلاب وتتبع تسجيل الأجهزة الأكاديمية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="h-10 px-4">
            <Link to="/students/import">استيراد طلاب</Link>
          </Button>
          <Button
            asChild
            className="h-10 px-4"
          >
            <Link to="/students/new">
              <Plus className="ml-2 h-4 w-4" />
              إضافة طالب
            </Link>
          </Button>
        </div>
      </div>

      {/* Formal Stats Summary */}
      <div className="bg-card border rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-6 divide-x divide-x-reverse">
        <div className="flex items-center gap-3 pl-6">
          <div className="p-2 bg-primary/10 rounded-md">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-muted-foreground">إجمالي المقيدين</div>
            <div className="text-xl font-bold tabular-nums text-foreground">
              {statsData?.total || 0}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 pr-6 flex-1 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="flex flex-col min-w-[80px]">
              <span className="text-xs text-muted-foreground font-medium mb-0.5">{levelLabels[level]}</span>
              <span className="font-bold tabular-nums text-foreground">{statsData?.levels[level] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-card p-3 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground ml-2">
            <Layers className="size-4" />
            <span>تصفية:</span>
          </div>

          <Select dir="rtl" value={specializationFilter} onValueChange={setSpecializationFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="جميع الأقسام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {specializationsData?.map((dept: { _id: string; name: string }) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select dir="rtl" value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="جميع الفرق" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفرق</SelectItem>
              {availableLevels.length > 0 ? (
                availableLevels.map((lvl: any) => (
                  <SelectItem key={lvl.level.toString()} value={lvl.level.toString()}>
                    {lvl.name}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="1">إعدادي</SelectItem>
                  <SelectItem value="2">الفرقة الأولى</SelectItem>
                  <SelectItem value="3">الفرقة الثانية</SelectItem>
                  <SelectItem value="4">الفرقة الثالثة</SelectItem>
                  <SelectItem value="5">الفرقة الرابعة</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <div className="mr-auto">
            {(specializationFilter || levelFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchParams({})}
                className="text-muted-foreground hover:text-primary h-9"
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
