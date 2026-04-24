import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
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
  name: z.string().min(2, "اسم القسم يجب أن يكون حرفين على الأقل"),
  code: z
    .string()
    .min(2, "رمز القسم يجب أن يكون حرفين على الأقل")
    .max(10, "رمز القسم لا يجب أن يتجاوز 10 أحرف"),
  faculty: z.string().min(2, "اسم الكلية مطلوب"),
  description: z.string().optional(),
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
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      faculty: "",
      description: "",
    },
  });

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        code: department.code,
        faculty: department.faculty || "",
        description: department.description || "",
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
              {isEditing ? "تعديل القسم" : "إضافة قسم جديد"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "تعديل تفاصيل القسم الحالي"
                : "أدخل المعلومات الأساسية لتعريف القسم الجديد"}
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
              بيانات القسم
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
                          اسم القسم
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: علوم الحاسب" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          الاسم الرسمي الكامل للقسم الدراسي
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
                          رمز القسم
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: CS" {...field} dir="ltr" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          رمز مختصر (مثلاً CS, IT, IS)
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
                        الكلية التابع لها هذا القسم
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        الوصف التعريفي (اختياري)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="اكتب نبذة مختصرة عن مهام هذا القسم..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    {isEditing ? "تحديث البيانات" : "إضافة القسم الآن"}
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
                  <p className="font-medium text-foreground">اسم القسم</p>
                  <p>استخدم الاسم الرسمي المعتمد</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">رمز القسم</p>
                  <p>رمز فريد مختصر للقسم</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-muted/30 rounded-3xl border border-border/50 p-5">
            <h3 className="font-bold text-primary mb-2">💡 نصيحة</h3>
            <p className="text-sm text-muted-foreground">
              تأكد من استخدام رمز فريد لكل قسم لتسهيل عملية البحث والتصنيف
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
