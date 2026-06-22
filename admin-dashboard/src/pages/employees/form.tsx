import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Save,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Building2,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

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
  useCreateUser,
  useUpdateUser,
  useUser,
  useSpecializations,
} from "@/hooks";
import type { AdminRole } from "@/types";

const formSchema = z
  .object({
    firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
    lastName: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z
      .string()
      .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      .optional()
      .or(z.literal("")),
    phone: z.string().optional(),
    adminRole: z.enum(["super_admin", "dean", "student_affairs", "head_of_department"], {
      message: "يرجى تحديد صلاحية الدور للموظف",
    }),
    department: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.adminRole === "head_of_department" && !data.department) {
        return false;
      }
      return true;
    },
    {
      message: "القسم العلمي مطلوب عند اختيار صلاحية رئيس قسم",
      path: ["department"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: employee, isLoading: employeeLoading } = useUser(id ?? "");
  const { data: specializations } = useSpecializations();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      adminRole: "student_affairs",
      department: "",
    },
  });

  const selectedRole = form.watch("adminRole");

  useEffect(() => {
    if (employee && employee.role === "admin") {
      const firstName =
        typeof employee.name === "object"
          ? employee.name.first
          : employee.name?.split(" ")[0] || "";
      const lastName =
        typeof employee.name === "object"
          ? employee.name.last
          : employee.name?.split(" ").slice(1).join(" ") || "";

      form.reset({
        firstName,
        lastName,
        email: employee.email,
        password: "",
        phone: employee.phone || "",
        adminRole: (employee.adminRole as AdminRole) || "student_affairs",
        department:
          typeof employee.department === "object"
            ? (employee.department as any)?._id || ""
            : (employee.department as string) || "",
      });
    }
  }, [employee, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const data: any = {
        name: {
          first: values.firstName,
          last: values.lastName,
        },
        email: values.email,
        role: "admin",
        adminRole: values.adminRole,
        phone: values.phone || undefined,
        department: values.adminRole === "head_of_department" ? values.department : undefined,
      };

      if (values.password) {
        data.password = values.password;
      }

      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/employees");
    } catch (error) {
      // Handled by react-query / toast
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && employeeLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dashed pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">
              {isEditing ? "تعديل صلاحيات وبيانات المسؤول" : "إضافة مسؤول وموظف جديد"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">
              {isEditing
                ? "تعديل البيانات الأساسية والصلاحيات الممنوحة للموظف"
                : "إنشاء حساب مسؤول جديد وتحديد رتبته في لوحة التحكم"}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" className="rounded-xl h-10 px-4">
          <Link to="/employees">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Link>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="xl:col-span-2">
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b bg-muted/20 font-bold">
              <UserIcon className="h-4 w-4 text-primary" />
              <h2>البيانات الأساسية وتعيين الدور</h2>
            </div>

            <div className="p-6">
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
                          <FormLabel className="font-bold text-xs">الاسم الأول</FormLabel>
                          <FormControl>
                            <Input placeholder="أحمد" className="h-11 rounded-xl" {...field} />
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
                          <FormLabel className="font-bold text-xs">الاسم الأخير</FormLabel>
                          <FormControl>
                            <Input placeholder="سعيد" className="h-11 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="employee@college.edu"
                              className="h-11 rounded-xl text-left"
                              dir="ltr"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">رقم الهاتف (اختياري)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="01xxxxxxxxx"
                              className="h-11 rounded-xl text-left"
                              dir="ltr"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="adminRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">الصلاحية (الدور الوظيفي)</FormLabel>
                          <Select
                            dir="rtl"
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue placeholder="اختر دور الموظف..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="super_admin" className="text-right">مدير النظام (Super Admin)</SelectItem>
                              <SelectItem value="dean" className="text-right">العميد / الوكيل</SelectItem>
                              <SelectItem value="student_affairs" className="text-right">شؤون الطلاب</SelectItem>
                              <SelectItem value="head_of_department" className="text-right">رئيس قسم علمي</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedRole === "head_of_department" && (
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-xs">القسم العلمي التابع له</FormLabel>
                            <Select
                              dir="rtl"
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl">
                                  <SelectValue placeholder="اختر القسم..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {specializations?.map((dept) => (
                                  <SelectItem key={dept._id} value={dept._id} className="text-right">
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs">
                          كلمة المرور {isEditing && "(اتركها فارغة لعدم التغيير)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            className="h-11 rounded-xl text-left"
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-bold gap-2 text-base shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {isEditing ? "حفظ وتحديث الصلاحيات" : "إنشاء حساب الموظف الآن"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              دليل الصلاحيات والأدوار
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              يوفر النظام 4 مستويات مختلفة من الصلاحيات الإدارية، تأكد من إسناد الدور المناسب للموظف لضمان سلامة العمليات:
            </p>
            <div className="space-y-3 pt-2 text-xs">
              <div className="border-r-2 border-primary pr-3 py-0.5">
                <strong className="block text-foreground mb-0.5">مدير النظام (Super Admin)</strong>
                <span className="text-muted-foreground">صلاحيات كاملة للمراقبة، التحكم، إعدادات الخوادم، القاعات، المقررات والموظفين.</span>
              </div>
              <div className="border-r-2 border-primary pr-3 py-0.5">
                <strong className="block text-foreground mb-0.5">العميد / الوكيل</strong>
                <span className="text-muted-foreground">صلاحية شاملة لمراقبة نسب الحضور الفورية عبر الكلية، واستعراض تقارير الطلاب دون تعديل القاعات أو الموظفين.</span>
              </div>
              <div className="border-r-2 border-primary pr-3 py-0.5">
                <strong className="block text-foreground mb-0.5">شؤون الطلاب</strong>
                <span className="text-muted-foreground">صلاحية إدارة الطلاب، تسجيل الغيابات اليدوية، مراجعة طلبات تغيير الأجهزة، وإصدار شهادات الحضور.</span>
              </div>
              <div className="border-r-2 border-primary pr-3 py-0.5">
                <strong className="block text-foreground mb-0.5">رئيس قسم علمي</strong>
                <span className="text-muted-foreground">صلاحية مراقبة مقررات ومحاضرات القسم التابع له فقط، واستعراض نسب حضور طلاب القسم.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
