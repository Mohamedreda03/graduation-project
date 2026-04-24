import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  RefreshCcw,
  Filter,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import {
  useDeviceRequests,
  useApproveDeviceChange,
  useRejectDeviceChange,
} from "@/hooks";
import type { DeviceChangeRequest } from "@/types";

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "قيد الانتظار", variant: "outline" },
  approved: { label: "مقبول", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
};

export function DeviceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const { data, isLoading } = useDeviceRequests(statusFilter || undefined);
  const approveMutation = useApproveDeviceChange();
  const rejectMutation = useRejectDeviceChange();

  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    if (approveId) {
      await approveMutation.mutateAsync(approveId);
      setApproveId(null);
    }
  };

  const handleReject = async () => {
    if (rejectId) {
      await rejectMutation.mutateAsync({
        requestId: rejectId,
        reason: rejectReason,
      });
      setRejectId(null);
      setRejectReason("");
    }
  };

  const columns: ColumnDef<
    DeviceChangeRequest & { studentName?: string; studentId?: string }
  >[] = [
    {
      accessorKey: "studentName",
      header: "اسم الطالب",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.studentName || "—"}</div>
      ),
    },
    {
      accessorKey: "studentId",
      header: "الرقم الأكاديمي",
    },
    {
      accessorKey: "reason",
      header: "السبب",
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.reason}>
          {row.original.reason}
        </div>
      ),
    },
    {
      accessorKey: "requestedAt",
      header: "تاريخ الطلب",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(row.original.requestedAt), {
            addSuffix: true,
            locale: ar,
          })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = statusMap[row.original.status] || statusMap.pending;
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        if (row.original.status !== "pending") {
          return (
            <span className="text-muted-foreground text-sm">تم المعالجة</span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => setApproveId(row.original._id)}
            >
              <CheckCircle className="h-4 w-4 ml-1" />
              قبول
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setRejectId(row.original._id)}
            >
              <XCircle className="h-4 w-4 ml-1" />
              رفض
            </Button>
          </div>
        );
      },
    },
  ];

  const requests = data || [];

  // Calculate stats
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const totalCount = requests.length;

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-muted/30 p-8 mb-8 border border-border/50">
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                  طلبات تغيير الجهاز
                </h1>
                <p className="text-muted-foreground">
                  إدارة طلبات الطلاب لتغيير أجهزتهم المسجلة
                </p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 text-sm bg-background/50 px-4 py-2 rounded-full border border-border/50">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>مراجعة آمنة</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-background/50 px-4 py-2 rounded-full border border-border/50">
                <RefreshCcw className="h-4 w-4 text-primary" />
                <span>تحديث فوري</span>
              </div>
            </div>
          </div>

          {/* Pending Alert */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {pendingCount} طلب ينتظر المراجعة
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card/50 dark:bg-card/20 p-5 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-foreground">
                {totalCount}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                إجمالي الطلبات
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 dark:bg-card/20 p-5 rounded-2xl border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-amber-500">
                {pendingCount}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                قيد الانتظار
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 dark:bg-card/20 p-5 rounded-2xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-green-500">
                {approvedCount}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                مقبولة
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 dark:bg-card/20 p-5 rounded-2xl border border-destructive/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-destructive">
                {rejectedCount}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                مرفوضة
              </div>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            قائمة الطلبات
          </h2>
          <Select dir="rtl" value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطلبات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="approved">مقبولة</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-5 sm:p-6">
          <DataTable
            columns={columns}
            data={requests}
            isLoading={isLoading}
            searchKey="studentName"
            searchPlaceholder="البحث عن طالب..."
          />
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={!!approveId} onOpenChange={() => setApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد قبول الطلب</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم السماح للطالب بتسجيل جهاز جديد. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              قبول الطلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>رفض الطلب</AlertDialogTitle>
            <AlertDialogDescription>
              يرجى إدخال سبب الرفض (اختياري)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="سبب الرفض..."
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              {rejectMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              رفض الطلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
