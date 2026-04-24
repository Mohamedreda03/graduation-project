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

export function AccessPointsPage() {
  const { data, isLoading, refetch } = useHalls();
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
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
      accessorKey: "accessPoint.apiKey",
      header: "مفتاح API",
      cell: ({ row }) => {
        const apiKey = row.original.accessPoint?.apiKey;
        if (!apiKey) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.slice(-4);
        return (
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
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
  const unlinkedHalls = halls.filter(
    (h) => !h.accessPoint?.apIdentifier && !h.accessPoint?.ssid,
  ).length;

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-muted/30 p-8 mb-8 border border-border/50">
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Router className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                  نقاط الوصول
                </h1>
                <p className="text-muted-foreground">
                  إدارة بيانات نقاط الوصول المرتبطة بالقاعات
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 text-sm bg-background/50 px-4 py-2 rounded-full border border-border/50">
                <Shield className="h-4 w-4 text-primary" />
                <span>بيانات التعريف</span>
              </div>
              {unlinkedHalls > 0 && (
                <div className="flex items-center gap-2 text-sm bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">
                    {unlinkedHalls} قاعة بدون نقطة وصول
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card/50 dark:bg-card/20 p-5 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-foreground">
                {totalHalls}
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">
                إجمالي القاعات
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Server className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 dark:bg-card/20 p-5 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-primary">
                {linkedHalls}
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">
                نقاط مرتبطة
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 dark:bg-card/20 p-5 rounded-2xl border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-amber-500">
                {unlinkedHalls}
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">
                بدون نقطة
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <WifiOff className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Router className="h-5 w-5 text-primary" />
            قائمة نقاط الوصول
          </h2>
        </div>
        <div className="p-5 sm:p-6">
          <DataTable
            columns={columns}
            data={halls}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="البحث عن قاعة..."
          />
        </div>
      </div>
    </div>
  );
}
