import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lecturesService, type WeekSchedule } from "@/services/lectures.service";
import type { Lecture } from "@/types";

const DAYS = [
  { id: 0, name: "الأحد", short: "أحد" },
  { id: 1, name: "الإثنين", short: "إثنين" },
  { id: 2, name: "الثلاثاء", short: "ثلاثاء" },
  { id: 3, name: "الأربعاء", short: "أربعاء" },
  { id: 4, name: "الخميس", short: "خميس" },
  { id: 5, name: "الجمعة", short: "جمعة" },
  { id: 6, name: "السبت", short: "سبت" },
];

function LectureCard({ lecture }: { lecture: Lecture }) {
  const typeColors = {
    lecture: "border-r-blue-500 bg-blue-50 dark:bg-blue-950",
    section: "border-r-green-500 bg-green-50 dark:bg-green-950",
    lab: "border-r-purple-500 bg-purple-50 dark:bg-purple-950",
  };

  const typeLabels = {
    lecture: "محاضرة",
    section: "سكشن",
    lab: "معمل",
  };

  // Get course and hall info safely
  const courseName =
    typeof lecture.course === "string" ? "-" : lecture.course?.name || "غير محدد";
  const courseCode =
    typeof lecture.course === "string" ? "" : lecture.course?.code || "";
  const hallName = typeof lecture.hall === "string" ? "-" : lecture.hall?.name || "-";
  const hallBuilding =
    typeof lecture.hall === "string" ? "" : lecture.hall?.building || "";

  return (
    <div
      className={`p-3 rounded-lg border-r-4 ${typeColors[lecture.type]} transition-all hover:shadow-md`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">
          {lecture.startTime} - {lecture.endTime}
        </span>
      </div>
      <h4 className="font-semibold text-sm">{courseName}</h4>
      <p className="text-xs text-muted-foreground">{courseCode}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>
          {hallName} {hallBuilding && `- ${hallBuilding}`}
        </span>
      </div>
      <div className="mt-1">
        <span className="text-xs px-2 py-0.5 rounded-full bg-background">
          {typeLabels[lecture.type]}
        </span>
      </div>
    </div>
  );
}

export function MySchedulePage() {
  const today = new Date().getDay();

  const { data: schedule, isLoading, error } = useQuery<WeekSchedule>({
    queryKey: ["my-schedule"],
    queryFn: () => lecturesService.getMySchedule(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">جدول محاضراتي</h1>
          <p className="text-muted-foreground mt-1">الجدول الأسبوعي للمحاضرات</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">جدول محاضراتي</h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-destructive">حدث خطأ في تحميل الجدول</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if schedule is empty
  const hasLectures = schedule && Object.values(schedule).some((day) => day.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">جدول محاضراتي</h1>
          <p className="text-muted-foreground mt-1">الجدول الأسبوعي للمحاضرات</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            اليوم: {DAYS[today].name}
          </span>
        </div>
      </div>

      {!hasLectures ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد محاضرات مجدولة</p>
              <p className="text-sm text-muted-foreground mt-1">
                لم يتم تسجيل أي محاضرات في جدولك حتى الآن
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-7">
          {DAYS.map((day) => (
            <Card
              key={day.id}
              className={`${day.id === today ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader className="pb-2">
                <CardTitle
                  className={`text-sm font-medium text-center ${
                    day.id === today ? "text-primary" : ""
                  }`}
                >
                  {day.name}
                  {day.id === today && (
                    <span className="block text-xs text-primary mt-1">اليوم</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {schedule && schedule[day.id]?.length > 0 ? (
                  schedule[day.id].map((lecture: Lecture) => (
                    <LectureCard key={lecture._id} lecture={lecture} />
                  ))
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    لا توجد محاضرات
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">محاضرة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">سكشن</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm">معمل</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
