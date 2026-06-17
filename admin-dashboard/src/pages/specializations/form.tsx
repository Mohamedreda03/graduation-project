import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Building2,
  Hash,
  FileText,
  GraduationCap,
  Save,
  ArrowRight,
  Plus,
  Trash2,
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
  useCreateSpecialization,
  useUpdateSpecialization,
  useSpecialization,
} from "@/hooks";

const levelNames: Record<string, string> = {
  "1": "الفرقة الإعدادية",
  "2": "الفرقة الأولى",
  "3": "الفرقة الثانية",
  "4": "الفرقة الثالثة",
  "5": "الفرقة الرابعة",
  "6": "الفرقة الخامسة",
};

const formSchema = z.object({
  name: z.string().min(2, "اسم الكلية يجب أن يكون حرفين على الأقل"),
  code: z
    .string()
    .min(2, "رمز الكلية يجب أن يكون حرفين على الأقل")
    .max(10, "رمز الكلية لا يجب أن يتجاوز 10 أحرف"),
  faculty: z.string().min(2, "اسم الكلية مطلوب"),
  description: z.string().optional(),
  sectionsCount: z.record(z.string(), z.number().min(1).max(8)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SpecializationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: specialization, isLoading: specializationLoading } = useSpecialization(
    id ?? "",
  );
  const createMutation = useCreateSpecialization();
  const updateMutation = useUpdateSpecialization();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      faculty: "",
      description: "",
      sectionsCount: {
        "1": 2,
        "2": 2,
        "3": 2,
        "4": 2,
        "5": 2,
        "6": 2,
      },
    },
  });

  useEffect(() => {
    if (specialization) {
      form.reset({
        name: specialization.name,
        code: specialization.code,
        faculty: specialization.faculty || "",
        description: specialization.description || "",
        sectionsCount: {
          "1": specialization.sectionsCount?.["1"] ?? 2,
          "2": specialization.sectionsCount?.["2"] ?? 2,
          "3": specialization.sectionsCount?.["3"] ?? 2,
          "4": specialization.sectionsCount?.["4"] ?? 2,
          "5": specialization.sectionsCount?.["5"] ?? 2,
          "6": specialization.sectionsCount?.["6"] ?? 2,
        },
      });
    }
  }, [specialization, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      navigate("/specializations");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && specializationLoading) {
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
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {isEditing ? "تعديل كلية" : "إضافة كلية جديدة"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "تعديل تفاصيل الكلية الحالية"
                : "أدخل المعلومات الأساسية لتعريف الكلية الجديدة"}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              بيانات الكلية
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          اسم الكلية
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: علوم الحاسب" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          الاسم الرسمي الكامل للكلية
                        </FormDescription>
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
                          <Hash className="h-4 w-4 text-primary" />
                          رمز الكلية
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: CS" {...field} dir="ltr" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          رمز مختصر (مثلاً CS, IT, IS) للكلية
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        اسم الكلية
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: كلية الحاسبات والمعلومات"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        الأقسام التابعة للكلية
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sections Count Per Level */}
                <div className="space-y-4 pt-6 border-t border-border/50">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">عدد السكاشن لكل فرقة دراسية</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      حدد عدد السكاشن الافتراضي لكل فرقة دراسية في هذا التخصص. سيتم استخدام هذه القيم تلقائياً في صفحة الجداول.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {Object.entries(levelNames).map(([levelVal, levelLabel]) => (
                      <FormField
                        key={levelVal}
                        control={form.control}
                        name={`sectionsCount.${levelVal}`}
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-semibold">{levelLabel}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={8}
                                className="rounded-xl text-center font-bold"
                                {...field}
                                value={field.value ?? 2}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-xl h-12 px-8 font-bold gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {isEditing ? "تحديث البيانات" : "إضافة الكلية الآن"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/specializations")}
                    className="rounded-xl h-12 px-6 font-medium hover:bg-destructive/10 hover:text-destructive gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Sidebar Tips */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/50 bg-muted/30">
              <h3 className="font-bold">معلومات مفيدة</h3>
            </div>
            <div className="p-5 space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">اسم الكلية</p>
                  <p>استخدم الاسم الرسمي المعتمد</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">رمز الكلية</p>
                  <p>رمز فريد مختصر للكلية</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-muted/30 rounded-3xl border border-border/50 p-5">
            <h3 className="font-bold text-primary mb-2">💡 نصيحة</h3>
            <p className="text-sm text-muted-foreground">
              تأكد من استخدام رمز فريد لكل كلية لتسهيل عملية البحث والتصنيف
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
