import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
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
import { useHalls, useDeleteHall } from "@/hooks";
import type { Hall } from "@/types";
import { cn } from "@/lib/utils";

export function HallsPage() {
  const { data, isLoading } = useHalls();
  const deleteMutation = useDeleteHall();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Hall>[] = [
    {
      accessorKey: "name",
      header: "اسم القاعة",
    },
    {
      accessorKey: "building",
      header: "المبنى",
    },
    {
      accessorKey: "floor",
      header: "الطابق",
    },
    {
      accessorKey: "capacity",
      header: "السعة",
      cell: ({ row }) =>
        row.original.capacity ? <span className="tabular-nums">{row.original.capacity} طالب</span> : "غير محدد",
    },
    {
      accessorKey: "accessPoint",
      header: "نقطة الوصول",
      cell: ({ row }) => {
        const ap = row.original.accessPoint;
        if (!ap?.ssid && !ap?.apIdentifier) {
          return (
            <span className="text-muted-foreground text-sm">غير مرتبطة</span>
          );
        }
        return (
          <div className="flex items-center gap-2 font-mono text-sm" dir="ltr">
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                ap.isOnline ? "bg-emerald-500" : "bg-destructive"
              )}
              title={ap.isOnline ? "متصل" : "غير متصل"}
            />
            <span className="font-medium">{ap.ssid || ap.apIdentifier}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const hall = row.original;

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
                <Link to={`/halls/${hall._id}/edit`}>
                  <Pencil className="ml-2 h-4 w-4" />
                  تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/halls/access-points">
                  <Wifi className="ml-2 h-4 w-4" />
                  نقاط الوصول
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setDeleteId(hall._id)}
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
            القاعات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة قاعات الكلية ونقاط الوصول والتحكم في حالتها
          </p>
        </div>
        <Button asChild className="h-10 px-5">
          <Link to="/halls/new">
            <Plus className="ml-2 h-4 w-4" />
            إضافة قاعة
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="البحث باسم القاعة..."
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه القاعة نهائياً. لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة بنقاط الوصول.
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
