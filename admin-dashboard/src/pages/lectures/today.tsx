import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Timer,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { useTodayLectures, useStartLecture, useEndLecture } from "@/hooks";
import type { Lecture } from "@/types";

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  scheduled: {
    label: "مجدولة",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
  "in-progress": {
    label: "جارية",
    variant: "default",
    icon: <Play className="h-3 w-3" />,
  },
  completed: {
    label: "مكتملة",
    variant: "secondary",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "ملغاة",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function TodayLecturesPage() {
  const today = new Date();

  const { data, isLoading, refetch } = useTodayLectures();
  const startMutation = useStartLecture();
  const endMutation = useEndLecture();

  const handleStart = async (id: string) => {
    await startMutation.mutateAsync(id);
    refetch();
  };

  const handleEnd = async (id: string) => {
    await endMutation.mutateAsync(id);
    refetch();
  };

  const columns: ColumnDef<Lecture>[] = [
    {
      accessorKey: "course",
      header: "المادة",
      cell: ({ row }) => {
        const course = row.original.course;
        return (
          <div className="font-medium">
            {typeof course === "object" ? course.name : course}
          </div>
        );
      },
    },
    {
      id: "time",
      header: "الوقت",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span dir="ltr">
            {row.original.startTime} - {row.original.endTime}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "hall",
      header: "القاعة",
      cell: ({ row }) => {
        const hall = row.original.hall;
        return (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {typeof hall === "object" ? hall.name : hall}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = statusMap[row.original.status] || statusMap.scheduled;
        return (
          <Badge variant={status.variant} className="gap-1">
            {status.icon}
            {status.label}
          </Badge>
        );
      },
    },
    {
      id: "attendance",
      header: "الحضور",
      cell: ({ row }) => {
        const attended =
          (row.original as Lecture & { attendanceCount?: number })
            .attendanceCount || 0;
        const total =
          (row.original as Lecture & { totalStudents?: number })
            .totalStudents || 0;
        const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {attended}/{total}
            </span>
            <span className="text-muted-foreground text-sm">
              ({percentage}%)
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const lecture = row.original;

        if (lecture.status === "completed" || lecture.status === "cancelled") {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        if (lecture.status === "in-progress") {
          return (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => handleEnd(lecture._id)}
              disabled={endMutation.isPending}
            >
              <Square className="h-3 w-3" />
              إنهاء
            </Button>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-green-600 border-green-600/50 hover:bg-green-50"
            onClick={() => handleStart(lecture._id)}
            disabled={startMutation.isPending}
          >
            <Play className="h-3 w-3" />
            بدء
          </Button>
        );
      },
    },
  ];

  const lectures: Lecture[] = data || [];
  const scheduledCount = lectures.filter(
    (l) => l.status === "scheduled",
  ).length;
  const inProgressCount = lectures.filter(
    (l) => l.status === "in-progress",
  ).length;
  const completedCount = lectures.filter(
    (l) => l.status === "completed",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">محاضرات اليوم</h1>
          <p className="text-muted-foreground mt-1">
            {format(today, "EEEE، d MMMM yyyy", { locale: ar })}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{lectures.length}</div>
                <div className="text-sm text-muted-foreground">
                  إجمالي المحاضرات
                </div>
              </div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{scheduledCount}</div>
                <div className="text-sm text-muted-foreground">مجدولة</div>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <div className="text-sm text-muted-foreground">جارية الآن</div>
              </div>
              <Play className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-sm text-muted-foreground">مكتملة</div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            قائمة المحاضرات
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(), "HH:mm", { locale: ar })}</span>
          </div>
        </CardHeader>

        <CardContent>
          {lectures.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                لا توجد محاضرات اليوم
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                لم يتم جدولة أي محاضرات لهذا اليوم. يمكنك إضافة محاضرات جديدة من
                صفحة الجدولة.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/lectures/schedule">
                  <Calendar className="h-4 w-4 ml-2" />
                  الذهاب للجدولة
                </a>
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={lectures}
              isLoading={isLoading}
              searchKey="course.name"
              searchPlaceholder="البحث عن مادة..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
