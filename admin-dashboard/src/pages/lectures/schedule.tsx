import { useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  User,
  Loader2,
  BookOpen,
  Sparkles,
  Layers,
  Grid3X3,
  CalendarClock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourses, useHalls, useDoctors } from "@/hooks";
import type { Hall } from "@/types";

const dayNames = [
  { value: "0", label: "الأحد" },
  { value: "1", label: "الاثنين" },
  { value: "2", label: "الثلاثاء" },
  { value: "3", label: "الأربعاء" },
  { value: "4", label: "الخميس" },
  { value: "5", label: "الجمعة" },
  { value: "6", label: "السبت" },
];

const formSchema = z.object({
  course: z.string().min(1, "المادة مطلوبة"),
  hall: z.string().min(1, "القاعة مطلوبة"),
  dayOfWeek: z.string().min(1, "اليوم مطلوب"),
  startTime: z.string().min(1, "وقت البدء مطلوب"),
  endTime: z.string().min(1, "وقت الانتهاء مطلوب"),
  weekType: z.enum(["all", "odd", "even"]),
});

type FormValues = z.infer<typeof formSchema>;

export function LectureSchedulePage() {
  const { data: coursesData } = useCourses();
  const { data: hallsData } = useHalls();
  const { data: doctorsData } = useDoctors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course: "",
      hall: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      weekType: "all",
    },
  });

  const onSubmit = async (values: FormValues) => {
    console.log(values);
    // TODO: Implement lecture creation
    setIsDialogOpen(false);
    form.reset();
  };

  const courses = coursesData?.data || [];
  const halls: Hall[] = hallsData || [];

  // Generate time slots
  const timeSlots: { start: string; end: string }[] = [];
  for (let hour = 8; hour <= 18; hour++) {
    const start = `${hour.toString().padStart(2, "0")}:00`;
    const end = `${(hour + 1).toString().padStart(2, "0")}:00`;
    timeSlots.push({ start, end });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">جدولة المحاضرات</h1>
          <p className="text-muted-foreground mt-1">
            إنشاء وإدارة الجدول الأسبوعي للمحاضرات
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة محاضرة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                إضافة محاضرة جديدة
              </DialogTitle>
              <DialogDescription>
                أدخل تفاصيل المحاضرة لإضافتها للجدول
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المادة</FormLabel>
                      <Select
                        dir="rtl"
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المادة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القاعة</FormLabel>
                      <Select
                        dir="rtl"
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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

                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اليوم</FormLabel>
                      <Select
                        dir="rtl"
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر اليوم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dayNames.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وقت البدء</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وقت الانتهاء</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="weekType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الأسبوع</FormLabel>
                      <Select
                        dir="rtl"
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">كل أسبوع</SelectItem>
                          <SelectItem value="odd">أسابيع فردية</SelectItem>
                          <SelectItem value="even">أسابيع زوجية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        حدد إذا كانت المحاضرة تتكرر كل أسبوع أو أسابيع معينة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" className="rounded-xl">
                    إضافة المحاضرة
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{courses.length}</div>
                <div className="text-sm text-muted-foreground">المواد</div>
              </div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{halls.length}</div>
                <div className="text-sm text-muted-foreground">القاعات</div>
              </div>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">6</div>
                <div className="text-sm text-muted-foreground">أيام</div>
              </div>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">11</div>
                <div className="text-sm text-muted-foreground">فترة زمنية</div>
              </div>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            الجدول الأسبوعي
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>8:00 ص - 7:00 م</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-200">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-right font-medium text-muted-foreground w-20 bg-muted/50">
                    <Clock className="h-4 w-4 mx-auto" />
                  </th>
                  {dayNames.slice(0, 6).map((day) => (
                    <th
                      key={day.value}
                      className="p-3 text-center font-medium bg-muted/50"
                    >
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, idx) => (
                  <tr key={idx} className="border-b">
                    <td
                      className="p-3 text-sm text-muted-foreground font-mono bg-muted/30"
                      dir="ltr"
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{slot.start}</span>
                        <span className="text-xs text-muted-foreground">
                          {slot.end}
                        </span>
                      </div>
                    </td>
                    {dayNames.slice(0, 6).map((day) => (
                      <td
                        key={day.value}
                        className="p-2 border-r min-h-12 align-top hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="min-h-12 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Empty State */}
        <CardContent className="text-center py-8 border-t">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">ابدأ بإضافة المحاضرات</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            اضغط على "إضافة محاضرة" أو انقر على أي خلية في الجدول لبدء جدولة
            المحاضرات
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة محاضرة الآن
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
