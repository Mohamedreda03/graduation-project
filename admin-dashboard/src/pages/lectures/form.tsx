import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Clock,
  Calendar,
  Building2,
  BookOpen,
  Save,
  ArrowRight,
  Plus,
  GraduationCap,
  Lightbulb,
  Info,
  Repeat,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateLecture,
  useUpdateLecture,
  useLecture,
  useCourses,
  useHalls,
} from "@/hooks";
import type { Course, Hall } from "@/types";

const dayOptions = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

const formSchema = z.object({
  course: z.string().min(1, "المقرر مطلوب"),
  hall: z.string().min(1, "القاعة مطلوبة"),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "وقت البداية مطلوب"),
  endTime: z.string().min(1, "وقت النهاية مطلوب"),
  lectureType: z.enum(["lecture", "section", "lab"]),
  weekPattern: z.enum(["weekly", "odd", "even"]),
});

type FormValues = z.infer<typeof formSchema>;

export function LectureFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: lecture, isLoading: lectureLoading } = useLecture(id ?? "");
  const { data: coursesData } = useCourses();
  const { data: hallsData } = useHalls();
  const createMutation = useCreateLecture();
  const updateMutation = useUpdateLecture();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course: "",
      hall: "",
      dayOfWeek: new Date().getDay(),
      startTime: "",
      endTime: "",
      lectureType: "lecture",
      weekPattern: "weekly",
    },
  });

  useEffect(() => {
    if (lecture) {
      const courseId =
        typeof lecture.course === "object"
          ? lecture.course._id
          : lecture.course;
      const hallId =
        typeof lecture.hall === "object" ? lecture.hall._id : lecture.hall;
      const type = (lecture.lectureType || lecture.type || "lecture") as
        | "lecture"
        | "section"
        | "lab";
      const pattern = (lecture.weekPattern || "weekly") as
        | "weekly"
        | "odd"
        | "even";

      form.reset({
        course: courseId,
        hall: hallId,
        dayOfWeek: lecture.dayOfWeek,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        lectureType: type,
        weekPattern: pattern,
      });
    }
  }, [lecture, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        dayOfWeek: Number(values.dayOfWeek),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data: payload });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      navigate("/lectures");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && lectureLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Extract courses array from the response
  const courses: Course[] = Array.isArray(coursesData)
    ? coursesData
    : (coursesData?.data ?? []);

  // Extract halls array from the response
  const halls: Hall[] = Array.isArray(hallsData)
    ? hallsData
    : ((hallsData as any)?.data ?? []);

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-muted/30 p-8 mb-8 border border-border/50">
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/20 rounded-2xl">
              {isEditing ? (
                <Calendar className="h-8 w-8 text-primary" />
              ) : (
                <Plus className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">
                {isEditing ? "تعديل المحاضرة" : "إضافة محاضرة جديدة"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditing
                  ? "تعديل بيانات المحاضرة الحالية"
                  : "حدد المقرر والقاعة والوقت لإنشاء محاضرة جديدة"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-card/50 dark:bg-card/20 p-8 rounded-3xl border border-border/50 shadow-sm">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">معلومات المحاضرة</h2>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Course */}
                  <FormField
                    control={form.control}
                    name="course"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          المقرر
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                          key={`course-${field.value}`}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر المقرر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course._id} value={course._id}>
                                {course.code} - {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hall */}
                  <FormField
                    control={form.control}
                    name="hall"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          القاعة
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                          key={`hall-${field.value}`}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر القاعة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {halls.map((hall) => (
                              <SelectItem key={hall._id} value={hall._id}>
                                {hall.name} - {hall.building}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Day of Week */}
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          اليوم
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                          key={`day-${field.value}`}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر اليوم" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dayOptions.map((day) => (
                              <SelectItem
                                key={day.value}
                                value={day.value.toString()}
                              >
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Lecture Type */}
                  <FormField
                    control={form.control}
                    name="lectureType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          نوع المحاضرة
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                          key={`type-${field.value}`}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lecture">محاضرة</SelectItem>
                            <SelectItem value="section">سكشن</SelectItem>
                            <SelectItem value="lab">معمل</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Time */}
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          وقت البداية
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            dir="ltr"
                            className="text-left"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          بصيغة 24 ساعة (مثل 09:00)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Time */}
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          وقت النهاية
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            dir="ltr"
                            className="text-left"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          بصيغة 24 ساعة (مثل 10:30)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Week Pattern */}
                  <FormField
                    control={form.control}
                    name="weekPattern"
                    render={({ field }) => (
                      <FormItem className="space-y-3 md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <Repeat className="h-4 w-4 text-muted-foreground" />
                          نمط التكرار
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                          key={`week-${field.value}`}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر نمط التكرار" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">
                              أسبوعي (كل أسبوع)
                            </SelectItem>
                            <SelectItem value="odd">
                              الأسابيع الفردية فقط
                            </SelectItem>
                            <SelectItem value="even">
                              الأسابيع الزوجية فقط
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t border-border/50">
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-xl px-8 gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isEditing ? "حفظ التغييرات" : "إضافة محاضرة"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-8 gap-2"
                    onClick={() => navigate("/lectures")}
                  >
                    <ArrowRight className="h-4 w-4" />
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-card/50 dark:bg-card/20 p-6 rounded-3xl border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-bold">معلومات مهمة</h3>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <BookOpen className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">المقرر</p>
                  <p>اختر المقرر الدراسي المرتبط بهذه المحاضرة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">القاعة</p>
                  <p>القاعة المجهزة بـ Access Point لتسجيل الحضور</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">الوقت</p>
                  <p>تأكد من عدم التعارض مع محاضرات أخرى في نفس القاعة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">اليوم</p>
                  <p>0 = الأحد، 6 = السبت</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="bg-muted/30 p-6 rounded-3xl border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-700 dark:text-amber-400">
                نصيحة
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              بعد إنشاء المحاضرة، يمكنك بدؤها يدوياً من صفحة المحاضرات. تأكد من
              تسجيل الطلاب في المقرر أولاً حتى يتم تسجيل حضورهم تلقائياً.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-card/50 dark:bg-card/20 p-6 rounded-3xl border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-bold">روابط مفيدة</h3>
            </div>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-xl"
                onClick={() => navigate("/lectures")}
              >
                <Calendar className="h-4 w-4" />
                عرض جميع المحاضرات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-xl"
                onClick={() => navigate("/courses")}
              >
                <BookOpen className="h-4 w-4" />
                عرض المقررات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-xl"
                onClick={() => navigate("/halls")}
              >
                <Building2 className="h-4 w-4" />
                عرض القاعات
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
