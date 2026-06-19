import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  User,
  Hash,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  Layers,
  Save,
  ArrowRight,
  UserPlus,
  FileText,
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
  useCreateStudent,
  useUpdateStudent,
  useStudent,
  useSpecializations,
} from "@/hooks";

const formSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastName: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
  studentId: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  specialization: z.string().min(1, "التخصص مطلوب"),
  level: z.number().min(1).max(5),
  phone: z.string().optional(),
  macAddress: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: student, isLoading: studentLoading } = useStudent(id ?? "");
  const { data: specializationsData } = useSpecializations();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      studentId: "",
      specialization: "",
      level: 1,
      phone: "",
      macAddress: "",
    },
  });

  useEffect(() => {
    if (student) {
      // Handle both name formats (string or object)
      const firstName =
        typeof student.name === "object"
          ? student.name.first
          : student.name?.split(" ")[0] || "";
      const lastName =
        typeof student.name === "object"
          ? student.name.last
          : student.name?.split(" ").slice(1).join(" ") || "";

      form.reset({
        firstName,
        lastName,
        email: student.email,
        password: "",
        studentId: student.studentId,
        specialization:
          typeof student.academicInfo?.specialization === "object"
            ? student.academicInfo.specialization._id
            : student.academicInfo?.specialization || "",
        level: student.academicInfo?.level || 1,
        phone: student.phone || "",
        macAddress: student.device?.macAddress || "",
      });
    }
  }, [student, form]);

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
        studentId: values.studentId,
        phone: values.phone || undefined,
        academicInfo: {
          specialization: values.specialization,
          level: values.level,
        },
        device: values.macAddress
          ? {
              macAddress: values.macAddress,
              isVerified: true,
            }
          : undefined,
      };

      if (isEditing) {
        if (!data.password) delete (data as any).password;
        await updateMutation.mutateAsync({ id: id!, data });
      } else {
        await createMutation.mutateAsync(data as any);
      }
      navigate("/students");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && studentLoading) {
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
            <User className="h-6 w-6 text-primary" />
          ) : (
            <UserPlus className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "تعديل بيانات الطالب" : "تسجيل طالب جديد"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing
              ? "تحديث السجل الأكاديمي والبيانات الشخصية للطالب"
              : "إدخال البيانات الأساسية لإنشاء ملف أكاديمي جديد"}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="xl:col-span-2 bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              البيانات الشخصية والأكاديمية
            </h2>
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
                          <Input placeholder="محمد" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <Hash className="h-3.5 w-3.5 text-primary" />
                          الرقم الأكاديمي
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="2021001" className="h-10 font-mono text-left tabular-nums" {...field} dir="ltr" />
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
                            placeholder="student@university.edu"
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

                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                          التخصص / القسم
                        </FormLabel>
                        <Select
                          key={`dept-${field.value}-${specializationsData?.length ?? 0}`}
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="اختر التخصص" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specializationsData?.map(
                              (dept: { _id: string; name: string }) => (
                                <SelectItem key={dept._id} value={dept._id}>
                                  {dept.name}
                                </SelectItem>
                              ),
                            )}
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
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          الفرقة الدراسية
                        </FormLabel>
                        <Select
                          key={`level-${field.value}`}
                          dir="rtl"
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="اختر الفرقة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">إعدادي</SelectItem>
                            <SelectItem value="2">الفرقة الأولى</SelectItem>
                            <SelectItem value="3">الفرقة الثانية</SelectItem>
                            <SelectItem value="4">الفرقة الثالثة</SelectItem>
                            <SelectItem value="5">الفرقة الرابعة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="macAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <Hash className="h-3.5 w-3.5 text-primary" />
                          عنوان الـ MAC للجهاز (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="XX:XX:XX:XX:XX:XX"
                            className="h-10 font-mono text-left"
                            {...field}
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          يُستخدم للتحقق من حضور الطالب عبر جهازه المسجل. اترك الحقل فارغاً لإلغاء ربط أي جهاز.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-dashed">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 px-6 gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isEditing ? "حفظ التغييرات" : "إضافة السجل"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/students")}
                    className="h-10 px-4"
                  >
                    إلغاء الأمر
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Sidebar Tips */}
        <div className="space-y-4">
          {/* Student Info Preview */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-bold text-sm">متطلبات النظام</h3>
            </div>
            <div className="p-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">الرقم الأكاديمي</p>
                  <p className="text-xs leading-relaxed">رقم تعريفي فريد يستخدم في كافة التعاملات الجامعية.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">
                    البريد الإلكتروني
                  </p>
                  <p className="text-xs leading-relaxed">البريد الجامعي المعتمد لتسجيل الدخول.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">الفرقة والتخصص</p>
                  <p className="text-xs leading-relaxed">تُستخدم لربط الطالب آلياً بالمقررات الدراسية المناسبة.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
