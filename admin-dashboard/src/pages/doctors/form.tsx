import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Phone,
  Save,
  ArrowRight,
  UserPlus,
  Stethoscope,
  Lightbulb,
  FileText,
  Info,
  GraduationCap,
  Hash,
  Building2,
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
import { useCreateDoctor, useUpdateDoctor, useDoctor } from "@/hooks";

const formSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastName: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DoctorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: doctor, isLoading: doctorLoading } = useDoctor(id ?? "");
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (doctor) {
      // Handle both name formats (string or object)
      const firstName =
        typeof doctor.name === "object"
          ? doctor.name.first
          : doctor.name?.split(" ")[0] || "";
      const lastName =
        typeof doctor.name === "object"
          ? doctor.name.last
          : doctor.name?.split(" ").slice(1).join(" ") || "";

      form.reset({
        firstName,
        lastName,
        email: doctor.email,
        password: "",
        phone: doctor.phone || "",
      });
    }
  }, [doctor, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Transform form data to match backend model structure
      const data = {
        name: {
          first: values.firstName,
          last: values.lastName,
        },
        email: values.email,
        password: values.password || undefined,
        phone: values.phone || undefined,
      };

      if (isEditing) {
        if (!data.password) delete (data as any).password;
        await updateMutation.mutateAsync({ id: id!, data });
      } else {
        await createMutation.mutateAsync(data as any);
      }
      navigate("/doctors");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && doctorLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-dashed pb-4">
        <div className="p-2 bg-primary/10 rounded-md">
          {isEditing ? (
            <Stethoscope className="h-6 w-6 text-primary" />
          ) : (
            <UserPlus className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "تعديل بيانات عضو هيئة التدريس" : "تسجيل عضو هيئة تدريس جديد"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing
              ? "تحديث السجل الأكاديمي والبيانات الشخصية"
              : "إدخال البيانات الأساسية لإنشاء حساب جديد"}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="xl:col-span-2">
          <div className="bg-card rounded-lg border shadow-sm">
            {/* Section Header */}
            <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">البيانات الشخصية والأكاديمية</h2>
            </div>

            <div className="p-5">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <User className="h-3.5 w-3.5 text-primary" />
                            الاسم الأول
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="أحمد" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <User className="h-3.5 w-3.5 text-primary" />
                            الاسم الأخير
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="كمال" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            البريد الإلكتروني الجامعي
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="doctor@university.edu"
                              className="h-10 font-mono text-left"
                              {...field}
                              dir="ltr"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Lock className="h-3.5 w-3.5 text-primary" />
                            {isEditing
                              ? "كلمة مرور جديدة (اختياري)"
                              : "كلمة المرور"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="******"
                              className="h-10 font-mono text-left"
                              {...field}
                              dir="ltr"
                            />
                          </FormControl>
                          {isEditing && (
                            <FormDescription className="text-xs">
                              اترك الحقل فارغاً للإبقاء على كلمة المرور الحالية
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            رقم الهاتف (اختياري)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="01xxxxxxxxx"
                              className="h-10 font-mono text-left tabular-nums"
                              {...field}
                              dir="ltr"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-dashed">
                    <Button
                      type="submit"
                      className="h-10 px-6 gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isEditing ? "حفظ التغييرات" : "تأكيد الإضافة"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-4"
                      onClick={() => navigate("/doctors")}
                    >
                      إلغاء الأمر
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info Card */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm">متطلبات النظام</h3>
            </div>
            <div className="p-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-0.5">تسجيل الدخول</p>
                  <p className="text-xs leading-relaxed">يستخدم عضو هيئة التدريس البريد الإلكتروني للوصول إلى تطبيق تسجيل الحضور.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-0.5">الرقم الوظيفي</p>
                  <p className="text-xs leading-relaxed">يتم إنشاؤه تلقائياً لتمييز السجل الأكاديمي في النظام.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm">إدارة الكوادر</h3>
            </div>
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => navigate("/doctors")}
              >
                <Stethoscope className="h-4 w-4" />
                سجل أعضاء هيئة التدريس
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => navigate("/courses")}
              >
                <Building2 className="h-4 w-4" />
                المقررات الأكاديمية
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
