import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, Users, Calendar, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { coursesService } from "@/services/courses.service";
import { useAuth } from "@/contexts/auth-context";
import type { Course } from "@/types";

export function MyCoursesPage() {
  const { user } = useAuth();

  const {
    data: coursesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-courses", user?._id],
    queryFn: () => coursesService.getAll({ doctor: user?._id }),
    enabled: !!user?._id,
  });

  const myCourses = coursesData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المواد الدراسية</h1>
          <p className="text-muted-foreground mt-1">
            المواد التي تقوم بتدريسها
          </p>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="animate-pulse">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المواد الدراسية</h1>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center mb-6">
                <BookOpen className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-lg font-medium text-destructive">
                حدث خطأ في تحميل المواد
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                يرجى المحاولة مرة أخرى لاحقاً
              </p>
            </div>
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
          <h1 className="text-3xl font-bold tracking-tight">المواد الدراسية</h1>
          <p className="text-muted-foreground mt-1">
            المواد التي تقوم بتدريسها
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">
            {myCourses.length} مادة
          </span>
        </div>
      </div>

      {myCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد مواد مسجلة</p>
              <p className="text-sm text-muted-foreground mt-1">
                لم يتم تسجيلك في أي مادة دراسية حتى الآن
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((course: Course) => (
            <Card key={course._id} className="hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {course.code}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    المستوى {course.level}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.students?.length || 0} طالب</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{course.creditHours} ساعة</span>
                  </div>
                </div>
                {course.department && (
                  <p className="text-xs text-muted-foreground">
                    {typeof course.department === "object"
                      ? course.department.name
                      : course.department}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                  asChild
                >
                  <Link to={`/courses/${course._id}`}>
                    عرض التفاصيل
                    <ChevronLeft className="h-4 w-4 mr-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
