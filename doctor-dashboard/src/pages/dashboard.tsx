import { useQuery } from "@tanstack/react-query";
import { Calendar, BookOpen, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  lecturesService,
  type WeekSchedule,
} from "@/services/lectures.service";
import { coursesService } from "@/services/courses.service";
import { useAuth } from "@/contexts/auth-context";
import type { Lecture, Course } from "@/types";

const DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export function DashboardPage() {
  const { user } = useAuth();
  const today = new Date().getDay();

  // Get my schedule
  const { data: schedule, isLoading: scheduleLoading } = useQuery<WeekSchedule>(
    {
      queryKey: ["my-schedule"],
      queryFn: () => lecturesService.getMySchedule(),
    },
  );

  // Get today's lectures
  const { data: todayLectures, isLoading: todayLoading } = useQuery<Lecture[]>({
    queryKey: ["today-lectures"],
    queryFn: () => lecturesService.getToday(),
  });

  // Get my courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => coursesService.getAll({ doctor: user?._id }),
  });

  const myCourses = coursesData?.data || [];

  // Helper to check if lecture belongs to current doctor
  const isMyLecture = (lecture: Lecture): boolean => {
    // Check doctor field
    if (lecture.doctor) {
      const doctorId =
        typeof lecture.doctor === "string"
          ? lecture.doctor
          : lecture.doctor._id;
      if (doctorId === user?._id) return true;
    }
    // Check course.doctor field
    if (
      lecture.course &&
      typeof lecture.course !== "string" &&
      lecture.course.doctor
    ) {
      const courseDoctorId =
        typeof lecture.course.doctor === "string"
          ? lecture.course.doctor
          : lecture.course.doctor._id;
      if (courseDoctorId === user?._id) return true;
    }
    return false;
  };

  const myTodayLectures = todayLectures?.filter(isMyLecture) || [];

  // Calculate total lectures per week
  const totalLecturesPerWeek = schedule
    ? Object.values(schedule).reduce(
        (acc, dayLectures) => acc + dayLectures.length,
        0,
      )
    : 0;

  // Calculate total students across all courses
  const totalStudents = myCourses.reduce(
    (acc: number, course: Course) => acc + (course.students?.length || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          مرحباً،{" "}
          {typeof user?.name === "object" ? user.name.first : user?.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {DAYS[today]} -{" "}
          {new Date().toLocaleDateString("ar-EG", { dateStyle: "long" })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">محاضرات اليوم</CardTitle>
            <Calendar className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {todayLoading ? "..." : myTodayLectures.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">محاضرات مجدولة</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              المواد الدراسية
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {coursesLoading ? "..." : myCourses.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">المواد المسجلة</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {coursesLoading ? "..." : totalStudents}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">طالب مسجل</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              المحاضرات الأسبوعية
            </CardTitle>
            <Clock className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {scheduleLoading ? "..." : totalLecturesPerWeek}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">إجمالي الحصص</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Calendar className="h-4 w-4" />
            جدول محاضرات اليوم
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {todayLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              جاري تحميل البيانات...
            </div>
          ) : myTodayLectures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              لا توجد محاضرات مسجلة اليوم
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {myTodayLectures.map((lecture) => {
                const courseName =
                  typeof lecture.course === "string"
                    ? "-"
                    : lecture.course?.name || "-";
                const hallName =
                  typeof lecture.hall === "string"
                    ? "-"
                    : lecture.hall?.name || "-";
                const hallBuilding =
                  typeof lecture.hall === "string"
                    ? ""
                    : lecture.hall?.building || "";
                return (
                  <div
                    key={lecture._id}
                    className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/5 border border-primary/10 rounded-xl">
                        <span className="text-xs font-bold text-primary">
                          {lecture.startTime}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {lecture.endTime}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-foreground">{courseName}</h4>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                          {hallName} {hallBuilding && `• مبنى ${hallBuilding}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge
                        variant="default"
                        className={
                          lecture.type === "lecture"
                            ? "bg-blue-500/10 text-blue-600"
                            : lecture.type === "section"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-purple-500/10 text-purple-600"
                        }
                      >
                        {lecture.type === "lecture"
                          ? "محاضرة"
                          : lecture.type === "section"
                            ? "تمارين"
                            : "معمل"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            المواد الدراسية
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {coursesLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-pulse">جاري التحميل...</div>
            </div>
          ) : myCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">
                لا توجد مواد مسجلة
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myCourses.map((course: Course) => (
                <div
                  key={course._id}
                  className="group p-5 rounded-xl border border-border/50 bg-card hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {course.name}
                  </h4>
                  <p className="text-sm text-muted-foreground font-medium">
                    {course.code}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">
                        {course.students?.length || 0}
                      </span>
                      <span className="text-muted-foreground">طالب</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
