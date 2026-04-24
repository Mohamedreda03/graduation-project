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
        row.original.capacity ? `${row.original.capacity} طالب` : "غير محدد",
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
          <span className="font-medium">{ap.ssid || ap.apIdentifier}</span>
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
                className="h-9 w-9 p-0 rounded-full hover:bg-muted/50"
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
                className="text-destructive"
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            القاعات
          </h1>
          <p className="text-muted-foreground font-medium">
            إدارة قاعات الكلية ونقاط الوصول والتحكم في حالتها
          </p>
        </div>
        <Button asChild className="rounded-xl h-11 px-6">
          <Link to="/halls/new">
            <Plus className="ml-2 h-5 w-5" />
            إضافة قاعة جديدة
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="البحث بالاسم..."
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه القاعة نهائياً. لا يمكن التراجع عن هذا الإجراء.
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
