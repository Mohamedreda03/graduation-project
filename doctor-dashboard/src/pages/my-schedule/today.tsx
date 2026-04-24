import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Clock, MapPin, BookOpen, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lecturesService } from "@/services/lectures.service";
import { useAuth } from "@/contexts/auth-context";
import type { Lecture } from "@/types";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function TodaySchedulePage() {
  const { user } = useAuth();
  const today = new Date();
  const dayName = DAYS[today.getDay()];

  const { data: todayLectures, isLoading, error } = useQuery<Lecture[]>({
    queryKey: ["today-lectures"],
    queryFn: () => lecturesService.getToday(),
  });

  // Helper to check if lecture belongs to current doctor
  const isMyLecture = (lecture: Lecture): boolean => {
    // Check doctor field
    if (lecture.doctor) {
      const doctorId =
        typeof lecture.doctor === "string" ? lecture.doctor : lecture.doctor._id;
      if (doctorId === user?._id) return true;
    }
    // Check course.doctor field
    if (lecture.course && typeof lecture.course !== "string" && lecture.course.doctor) {
      const courseDoctorId =
        typeof lecture.course.doctor === "string"
          ? lecture.course.doctor
          : lecture.course.doctor._id;
      if (courseDoctorId === user?._id) return true;
    }
    return false;
  };

  // Filter only my lectures
  const myLectures = todayLectures?.filter(isMyLecture) || [];

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

  // Determine if lecture is current, upcoming, or past
  const getLectureStatus = (lecture: Lecture) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    if (currentTime >= lecture.startTime && currentTime <= lecture.endTime) {
      return "current";
    } else if (currentTime < lecture.startTime) {
      return "upcoming";
    }
    return "past";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">محاضرات اليوم</h1>
          <p className="text-muted-foreground mt-1">
            {dayName} - {today.toLocaleDateString("ar-EG", { dateStyle: "long" })}
          </p>
        </div>
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">محاضرات اليوم</h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-destructive">حدث خطأ في تحميل المحاضرات</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">محاضرات اليوم</h1>
          <p className="text-muted-foreground mt-1">
            {dayName} - {today.toLocaleDateString("ar-EG", { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">{myLectures.length} محاضرة</span>
        </div>
      </div>

      {myLectures.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد محاضرات اليوم</p>
              <p className="text-sm text-muted-foreground mt-1">
                استمتع بيوم إجازتك! 🎉
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myLectures.map((lecture) => {
            const status = getLectureStatus(lecture);
            const courseName =
              typeof lecture.course === "string" ? "-" : lecture.course?.name || "-";
            const courseCode =
              typeof lecture.course === "string" ? "" : lecture.course?.code || "";
            const hallName =
              typeof lecture.hall === "string" ? "-" : lecture.hall?.name || "-";
            const hallBuilding =
              typeof lecture.hall === "string" ? "" : lecture.hall?.building || "";

            return (
              <Card
                key={lecture._id}
                className={`overflow-hidden ${
                  status === "current"
                    ? "ring-2 ring-green-500"
                    : status === "past"
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className={`h-1 ${
                  status === "current"
                    ? "bg-green-500"
                    : status === "upcoming"
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{courseName}</CardTitle>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        status === "current"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : status === "upcoming"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {status === "current"
                        ? "جارية الآن"
                        : status === "upcoming"
                        ? "قادمة"
                        : "انتهت"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{courseCode}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {lecture.startTime} - {lecture.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {hallName} {hallBuilding && `- ${hallBuilding}`}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        lecture.type === "lecture"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : lecture.type === "section"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                      }`}
                    >
                      {typeLabels[lecture.type]}
                    </span>
                  </div>

                  {status === "current" && (
                    <div className="pt-2">
                      <Button className="w-full gap-2" variant="outline" asChild>
                        <Link to={`/attendance/live/${typeof lecture.hall === "string" ? lecture.hall : lecture.hall?._id}`}>
                          <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
                          عرض الحضور المباشر
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
