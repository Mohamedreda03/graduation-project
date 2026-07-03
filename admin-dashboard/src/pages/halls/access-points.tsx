import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Wifi,
  WifiOff,
  Copy,
  Check,
  RefreshCw,
  Signal,
  Server,
  AlertCircle,
  Zap,
  Shield,
  Router,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { useHalls } from "@/hooks";
import type { Hall } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccessPointsPage() {
  const { data, isLoading, refetch, isFetching } = useHalls();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const [result] = await Promise.all([refetch(), minDelay]);
      if (result.isError) {
        toast.error("حدث خطأ أثناء تحديث البيانات");
      } else {
        toast.success("تم تحديث البيانات بنجاح");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث البيانات");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns: ColumnDef<Hall>[] = [
    {
      accessorKey: "name",
      header: "القاعة",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "building",
      header: "المبنى",
    },
    {
      accessorKey: "accessPoint.apIdentifier",
      header: "معرف نقطة الوصول",
      cell: ({ row }) => {
        const apId = row.original.accessPoint?.apIdentifier;
        const ssid = row.original.accessPoint?.ssid;
        if (!apId && !ssid) {
          return (
            <span className="text-muted-foreground text-sm">غير مرتبط</span>
          );
        }
        return (
          <div className="flex items-center justify-end gap-2" dir="ltr">
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono border">
              {apId || ssid}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                copyToClipboard(apId || ssid || "", `ap-${row.original._id}`)
              }
            >
              {copiedId === `ap-${row.original._id}` ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "accessPoint.isOnline",
      header: "الحالة",
      cell: ({ row }) => {
        const isOnline = row.original.accessPoint?.isOnline;
        const lastSeen = row.original.accessPoint?.lastSeen;
        const hasAp = row.original.accessPoint?.apIdentifier || row.original.accessPoint?.ssid;

        if (!hasAp) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        return (
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-muted-foreground">
              {lastSeen
                ? `آخر ظهور: ${new Date(lastSeen).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "لم يتصل بعد"}
            </span>
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className={cn(
                "gap-1 flex items-center justify-center h-6 px-2.5",
                isOnline &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              )}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span>متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>غير متصل</span>
                </>
              )}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "accessPoint.apiKey",
      header: "مفتاح API",
      cell: ({ row }) => {
        const apiKey = row.original.accessPoint?.apiKey;
        if (!apiKey) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.slice(-4);
        return (
          <div className="flex items-center justify-end gap-2" dir="ltr">
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono border">
              {maskedKey}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => copyToClipboard(apiKey, `api-${row.original._id}`)}
            >
              {copiedId === `api-${row.original._id}` ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  // Filter halls that have access points or show all
  const halls: Hall[] = data || [];

  // Calculate stats
  const totalHalls = halls.length;
  const linkedHalls = halls.filter(
    (h) => h.accessPoint?.apIdentifier || h.accessPoint?.ssid,
  ).length;
  const onlineAPs = halls.filter(
    (h) => (h.accessPoint?.apIdentifier || h.accessPoint?.ssid) && h.accessPoint?.isOnline,
  ).length;
  const offlineAPs = linkedHalls - onlineAPs;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dashed pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            نقاط الوصول
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة بيانات ومعرفات الشبكة للقاعات الدراسية
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 px-4 gap-2"
          onClick={handleRefresh}
          disabled={isRefreshing || isFetching}
        >
          <RefreshCw className={cn("h-4 w-4", (isRefreshing || isFetching) && "animate-spin")} />
          {isRefreshing || isFetching ? "جاري التحديث..." : "تحديث البيانات"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                إجمالي القاعات
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {totalHalls}
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-md">
              <Server className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                نقاط وصول مرتبطة
              </div>
              <div className="text-2xl font-bold tabular-nums text-primary">
                {linkedHalls}
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-md">
              <Router className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border shadow-sm border-l-emerald-500/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                متصلة حالياً
              </div>
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {onlineAPs}
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-md">
              <Wifi className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border shadow-sm border-l-destructive/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                غير متصلة
              </div>
              <div className="text-2xl font-bold tabular-nums text-destructive">
                {offlineAPs}
              </div>
            </div>
            <div className="p-2 bg-destructive/10 rounded-md">
              <WifiOff className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Router className="h-4 w-4 text-primary" />
            سجل الشبكات
          </h2>
        </div>
        <div className="p-4">
          <DataTable
            columns={columns}
            data={halls}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="البحث باسم القاعة..."
          />
        </div>
      </div>
    </div>
  );
}
