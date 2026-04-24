import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  BookOpen,
  Hash,
  Building2,
  User,
  Layers,
  Calendar,
  FileText,
  Save,
  ArrowRight,
  Plus,
  GraduationCap,
  Lightbulb,
  Info,
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
  useCreateCourse,
  useUpdateCourse,
  useCourse,
  useDepartments,
  useDoctors,
} from "@/hooks";
import type { Department, Doctor } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "اسم المقرر يجب أن يكون حرفين على الأقل"),
  code: z.string().min(2, "رمز المقرر مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  doctor: z.string().min(1, "الدكتور مطلوب"),
  level: z.number().min(1).max(6),
  semester: z.string().min(1, "الفصل الدراسي مطلوب"),
  specialization: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: course, isLoading: courseLoading } = useCourse(id ?? "");
  const { data: departmentsData } = useDepartments();
  const { data: doctorsData } = useDoctors();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      department: "",
      doctor: "",
      level: 1,
      semester: "",
      specialization: "",
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        name: course.name,
        code: course.code,
        department:
          typeof course.department === "object"
            ? course.department._id
            : course.department,
        doctor:
          typeof course.doctor === "object"
            ? course.doctor._id
            : course.doctor || "",
        level: course.level,
        semester: course.semester,
        specialization: course.specialization || "",
      });
    }
  }, [course, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data: values });
      } else {
        await createMutation.mutateAsync(values as any);
      }
      navigate("/courses");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && courseLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-muted/30 p-8 mb-8 border border-border/50">
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/20 rounded-2xl">
              {isEditing ? (
                <BookOpen className="h-8 w-8 text-primary" />
              ) : (
                <Plus className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">
                {isEditing ? "تعديل المقرر" : "إضافة مقرر جديد"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditing
                  ? "تعديل بيانات المقرر الحالي"
                  : "أدخل المعلومات الأساسية لتعريف مقرر دراسي جديد"}
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
              <h2 className="text-xl font-bold">معلومات المقرر الدراسي</h2>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          اسم المقرر
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="برمجة بايثون" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          رمز المقرر
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="CS101" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          القسم
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر القسم" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departmentsData?.map((dept: Department) => (
                              <SelectItem key={dept._id} value={dept._id}>
                                {dept.name}
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
                    name="doctor"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          الأستاذ
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر الأستاذ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctorsData?.data?.map((doctor) => (
                              <SelectItem key={doctor._id} value={doctor._id}>
                                {doctor.fullName ||
                                  (typeof doctor.name === "object"
                                    ? `${doctor.name.first} ${doctor.name.last}`
                                    : doctor.name)}
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
                    name="level"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          المستوى
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر المستوى" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">المستوى 1</SelectItem>
                            <SelectItem value="2">المستوى 2</SelectItem>
                            <SelectItem value="3">المستوى 3</SelectItem>
                            <SelectItem value="4">المستوى 4</SelectItem>
                            <SelectItem value="5">المستوى 5</SelectItem>
                            <SelectItem value="6">المستوى 6</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          الفصل الدراسي
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: خريف 2025" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          مثل: خريف 2025، ربيع 2026
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          التخصص (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: علوم الحاسب" {...field} />
                        </FormControl>
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
                    {isEditing ? "حفظ التغييرات" : "إضافة مقرر"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-8 gap-2"
                    onClick={() => navigate("/courses")}
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
                  <p className="font-medium text-foreground">اسم المقرر</p>
                  <p>اسم وصفي للمقرر الدراسي</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">رمز المقرر</p>
                  <p>رمز فريد مثل CS101 أو MATH201</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">المستوى</p>
                  <p>المستوى الدراسي (1-6)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">الفصل الدراسي</p>
                  <p>مثل: خريف 2025، ربيع 2026</p>
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
              يمكنك تعيين أستاذ للمقرر لاحقاً. اختر الفصل الدراسي المناسب حتى
              يظهر المقرر في جدول المحاضرات الصحيح.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-card/50 dark:bg-card/20 p-6 rounded-3xl border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-bold">روابط مفيدة</h3>
            </div>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-xl"
                onClick={() => navigate("/courses")}
              >
                <BookOpen className="h-4 w-4" />
                عرض جميع المقررات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-xl"
                onClick={() => navigate("/lectures/schedule")}
              >
                <Calendar className="h-4 w-4" />
                جدول المحاضرات
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
