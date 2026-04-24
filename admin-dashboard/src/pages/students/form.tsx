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
  useDepartments,
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
  department: z.string().min(1, "القسم مطلوب"),
  level: z.number().min(1).max(6),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  macAddress: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: student, isLoading: studentLoading } = useStudent(id ?? "");
  const { data: departmentsData } = useDepartments();
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
      department: "",
      level: 1,
      specialization: "",
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
        department:
          typeof student.academicInfo?.department === "object"
            ? student.academicInfo.department._id
            : student.academicInfo?.department || "",
        level: student.academicInfo?.level || 1,
        specialization: student.academicInfo?.specialization || "",
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
          department: values.department,
          level: values.level,
          specialization: values.specialization || undefined,
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
            {isEditing ? (
              <User className="h-8 w-8 text-primary" />
            ) : (
              <UserPlus className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {isEditing ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "تعديل تفاصيل سجل الطالب"
                : "أدخل المعلومات الأساسية لتعريف طالب جديد في النظام"}
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
              البيانات الشخصية
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
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
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
                          <User className="h-4 w-4 text-primary" />
                          الاسم الأخير
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="محمد" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          الرقم الأكاديمي
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="2021001" {...field} dir="ltr" />
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
                          <Mail className="h-4 w-4 text-primary" />
                          البريد الإلكتروني
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="student@example.com"
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
                          <Lock className="h-4 w-4 text-primary" />
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
                    name="department"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          القسم
                        </FormLabel>
                        <Select
                          dir="rtl"
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر القسم" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departmentsData?.map(
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
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
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
                    name="specialization"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          التخصص (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: علوم الحاسب" {...field} />
                        </FormControl>
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
                          <Phone className="h-4 w-4 text-primary" />
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

                  <FormField
                    control={form.control}
                    name="macAddress"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          عنوان الـ MAC (الجهاز)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="XX:XX:XX:XX:XX:XX"
                            {...field}
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          اترك الحقل فارغاً لإلغاء ربط الجهاز الحالي
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    {isEditing ? "حفظ التغييرات" : "إضافة الطالب"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/students")}
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
          {/* Student Info Preview */}
          <div className="bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/50 bg-muted/30">
              <h3 className="font-bold">معلومات مفيدة</h3>
            </div>
            <div className="p-5 space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">الرقم الأكاديمي</p>
                  <p>رقم تعريفي فريد للطالب</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    البريد الإلكتروني
                  </p>
                  <p>يُستخدم لتسجيل الدخول</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">القسم والمستوى</p>
                  <p>لربط الطالب بالمقررات</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-muted/30 rounded-3xl border border-border/50 p-5">
            <h3 className="font-bold text-primary mb-2">💡 نصيحة</h3>
            <p className="text-sm text-muted-foreground">
              تأكد من صحة البريد الإلكتروني حيث سيستخدمه الطالب لتسجيل الدخول
              للتطبيق
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
