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
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCreateCourse,
  useUpdateCourse,
  useCourse,
  useSpecializations,
  useDoctors,
} from "@/hooks";
import type { Specialization, Doctor } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "اسم المقرر يجب أن يكون حرفين على الأقل"),
  code: z.string().min(2, "رمز المقرر مطلوب"),
  specialization: z.string().min(1, "التخصص مطلوب"),
  departments: z.array(z.string()).optional(),
  doctor: z.string().min(1, "الدكتور مطلوب"),
  level: z.number().min(1).max(6),
  semester: z.array(z.string()).min(1, "الرجاء اختيار فصل دراسي واحد على الأقل"),
});

type FormValues = z.infer<typeof formSchema>;

export function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: course, isLoading: courseLoading } = useCourse(id ?? "");
  const { data: specializationsData } = useSpecializations();
  const { data: doctorsData } = useDoctors();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      specialization: "",
      departments: [],
      doctor: "",
      level: 1,
      semester: [],
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        name: course.name,
        code: course.code,
        specialization:
          typeof course.specialization === "object"
            ? course.specialization._id
            : course.specialization,
        departments: course.departments || [],
        doctor: typeof course.doctor === "object" && course.doctor !== null
            ? (course.doctor as any)._id || ""
            : course.doctor || "",
        level: course.level,
        semester: Array.isArray(course.semester) ? course.semester : (course.semester ? [course.semester] : []),
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

  const selectedSpecializationId = form.watch("specialization");
  const selectedLevel = form.watch("level");
  
  const selectedSpecializationObj = specializationsData?.find((s: any) => s._id === selectedSpecializationId);
  const availableLevels = selectedSpecializationObj?.levels || [];
  const selectedLevelObj = availableLevels.find((lvl: any) => lvl.level === selectedLevel);
  const availableDepartments = selectedLevelObj?.hasDepartments ? (selectedSpecializationObj?.departments || []) : [];

  // Reset departments if the selected level has no departments
  useEffect(() => {
    if (availableDepartments.length === 0) {
      form.setValue("departments", []);
    }
  }, [selectedLevel, availableDepartments.length, form]);

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
                    name="specialization"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          التخصص
                        </FormLabel>
                        <Select
                          key={`dept-${field.value}-${specializationsData?.length ?? 0}`}
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر التخصص" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specializationsData?.map((dept: Specialization) => (
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
                          الدكتور
                        </FormLabel>
                        <Select
                          key={`doc-${field.value}-${doctorsData?.data?.length ?? 0}`}
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر الدكتور" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctorsData?.data?.map((doctor: Doctor) => (
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
                          الفرقه
                        </FormLabel>
                        <Select
                          key={`level-${field.value}-${availableLevels.length}`}
                          dir="rtl"
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر الفرقه" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableLevels.map((lvl: any) => (
                              <SelectItem key={lvl.level.toString()} value={lvl.level.toString()}>
                                {lvl.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedSpecializationId && availableDepartments.length > 0 && (
                    <FormField
                      control={form.control}
                      name="departments"
                      render={() => (
                        <FormItem className="space-y-3 col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <FormLabel className="flex items-center gap-2 mb-3">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            الأقسام التي تدرس هذا المقرر (اختياري)
                          </FormLabel>
                          <FormDescription className="text-xs mb-3 text-slate-500">
                            اترك جميع الخيارات فارغة إذا كان هذا المقرر عاماً ويدرسه جميع أقسام الكلية.
                          </FormDescription>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {availableDepartments.map((dept) => (
                              <FormField
                                key={dept}
                                control={form.control}
                                name="departments"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={dept}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-3 bg-white dark:bg-slate-950 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                                      dir="rtl"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(dept)}
                                          onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            return checked
                                              ? field.onChange([...currentValue, dept])
                                              : field.onChange(
                                                  currentValue.filter(
                                                    (value) => value !== dept
                                                  )
                                                );
                                          }}
                                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary ml-2"
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal text-sm cursor-pointer w-full">
                                        {dept}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="semester"
                    render={() => (
                      <FormItem className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <FormLabel className="flex items-center gap-2 mb-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          الفصل الدراسي
                        </FormLabel>
                        <div className="grid grid-cols-1 gap-3">
                          {["الفصل الدراسي الأول", "الفصل الدراسي الثاني"].map((sem) => (
                            <FormField
                              key={sem}
                              control={form.control}
                              name="semester"
                              render={({ field }) => (
                                <FormItem
                                  key={sem}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-3 bg-white dark:bg-slate-950 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                                  dir="rtl"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(sem)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                          ? field.onChange([...currentValue, sem])
                                          : field.onChange(currentValue.filter((value) => value !== sem));
                                      }}
                                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary ml-2"
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm cursor-pointer w-full">
                                    {sem}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormDescription className="text-xs text-slate-500 mt-2">
                          يمكنك اختيار فصل دراسي واحد أو كلاهما (للمواد الممتدة)
                        </FormDescription>
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
                  <p className="font-medium text-foreground">الفرقه</p>
                  <p>الفرقه الدراسية (1-6)</p>
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
