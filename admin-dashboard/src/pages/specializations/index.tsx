import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

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
import { DataTable } from "@/components/data-table";
import { useSpecializations, useDeleteSpecialization } from "@/hooks";
import type { Specialization } from "@/types";

export function SpecializationsPage() {
  const { data, isLoading } = useSpecializations();
  const deleteMutation = useDeleteSpecialization();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Specialization>[] = [
    {
      accessorKey: "name",
      header: "اسم الكلية",
    },
    {
      accessorKey: "code",
      header: "الرمز",
    },
    {
      accessorKey: "faculty",
      header: "الأقسام التابعة",
      cell: ({ row }) => {
        const facultyStr = row.original.faculty || "";
        const depts = facultyStr ? facultyStr.split(/[،,]/).map(t => t.trim()).filter(Boolean) : [];
        
        return (
          <div className="flex flex-wrap gap-1 max-w-[400px]">
            {depts.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              depts.map((dept, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold py-0 px-2 rounded">
                  {dept}
                </Badge>
              ))
            )}
          </div>
        );
      },
    },

    {
      accessorKey: "createdAt",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <span className="tabular-nums">{date.toLocaleDateString("en-US")}</span>;
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const specialization = row.original;

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
                <Link to={`/specializations/${specialization._id}/edit`}>
                  <Pencil className="ml-2 h-4 w-4" />
                  تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setDeleteId(specialization._id)}
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
            الكليات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الكليات والأقسام الأكاديمية
          </p>
        </div>
        <Button asChild className="h-10 px-5">
          <Link to="/specializations/new">
            <Plus className="ml-2 h-4 w-4" />
            إضافة كلية
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="البحث باسم الكلية..."
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا السجل الأكاديمي؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة.
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
