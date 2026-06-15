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
  useCreateDepartment,
  useUpdateDepartment,
  useDepartment,
} from "@/hooks";

const formSchema = z.object({
  name: z.string().min(2, "اسم الكلية يجب أن يكون حرفين على الأقل"),
  code: z
    .string()
    .min(2, "رمز الكلية يجب أن يكون حرفين على الأقل")
    .max(10, "رمز الكلية لا يجب أن يتجاوز 10 أحرف"),
  faculty: z.string().min(2, "اسم الكلية مطلوب"),
  description: z.string().optional(),
  specializations: z
    .array(
      z.object({
        _id: z.string().optional(),
        name: z.string().min(2, "اسم التخصص يجب أن يكون حرفين على الأقل"),
        code: z.string().optional(),
      })
    )
    .default([]),
});

type FormValues = z.infer<typeof formSchema>;

export function DepartmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: department, isLoading: departmentLoading } = useDepartment(
    id ?? "",
  );
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      faculty: "",
      description: "",
      specializations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "specializations",
  });

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        code: department.code,
        faculty: department.faculty || "",
        description: department.description || "",
        specializations: department.specializations || [],
      });
    }
  }, [department, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      navigate("/departments");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && departmentLoading) {
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

                {/* Specializations Section */}
                <div className="space-y-4 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">الأقسام التابعة للكلية</h3>
                      <p className="text-sm text-muted-foreground">أضف أقسام فرعية للكلية لتتمكن من اختيارها للطلاب والمقررات</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ name: "", code: "" })}
                      className="gap-2 rounded-xl"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة كلية
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-border rounded-2xl bg-muted/20 text-muted-foreground text-sm">
                      لا توجد كليات مضافة بعد. اضغط على "إضافة كلية" للبدء.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <FormField
                              control={form.control}
                              name={`specializations.${index}.name`}
                              render={({ field: inputField }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-xs">اسم التخصص</FormLabel>
                                  <FormControl>
                                    <Input placeholder="مثال: هندسة الاتصالات" {...inputField} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`specializations.${index}.code`}
                              render={({ field: inputField }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-xs">رمز التخصص (اختياري)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="مثال: CCE" {...inputField} dir="ltr" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="mt-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl animate-none shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    onClick={() => navigate("/departments")}
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
