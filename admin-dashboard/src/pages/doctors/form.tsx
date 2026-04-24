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
                <Stethoscope className="h-8 w-8 text-primary" />
              ) : (
                <UserPlus className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">
                {isEditing ? "تعديل بيانات الدكتور" : "إضافة دكتور جديد"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditing
                  ? "تعديل تفاصيل سجل الدكتور"
                  : "أدخل المعلومات الأساسية لتعريف عضو هيئة تدريس جديد"}
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
              <h2 className="text-xl font-bold">معلومات عضو هيئة التدريس</h2>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          الاسم الأول
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="أحمد" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          الاسم الأخير
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="كمال" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          البريد الإلكتروني
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="doctor@example.com"
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
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {isEditing
                            ? "كلمة مرور جديدة (اختياري)"
                            : "كلمة المرور"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            {...field}
                            dir="ltr"
                          />
                        </FormControl>
                        {isEditing && (
                          <FormDescription className="text-xs">
                            اترك الحقل فارغاً إذا كنت لا تريد تغيير كلمة المرور
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
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          رقم الهاتف (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="01xxxxxxxxx"
                            {...field}
                            dir="ltr"
                          />
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
                    {isEditing ? "حفظ التغييرات" : "إضافة دكتور"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-8 gap-2"
                    onClick={() => navigate("/doctors")}
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
                <User className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">الاسم الكامل</p>
                  <p>أدخل الاسم مع اللقب العلمي (د. / أ.د.)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">الرقم الوظيفي</p>
                  <p>رقم فريد لتمييز عضو هيئة التدريس</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">
                    البريد الإلكتروني
                  </p>
                  <p>يستخدم لتسجيل الدخول للنظام</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">القسم</p>
                  <p>القسم الأكاديمي التابع له</p>
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
              يمكن للدكتور استخدام البريد الإلكتروني وكلمة المرور لتسجيل الدخول
              إلى التطبيق وتسجيل حضور الطلاب في المحاضرات.
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
                onClick={() => navigate("/doctors")}
              >
                <Stethoscope className="h-4 w-4" />
                عرض جميع الدكاترة
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-xl"
                onClick={() => navigate("/departments")}
              >
                <Building2 className="h-4 w-4" />
                إدارة الأقسام
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
