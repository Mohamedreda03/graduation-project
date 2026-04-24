import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Building,
  Users,
  Wifi,
  Network,
  Save,
  ArrowRight,
  Plus,
  DoorOpen,
  Lightbulb,
  Info,
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
import { useCreateHall, useUpdateHall, useHall } from "@/hooks";

const formSchema = z.object({
  name: z.string().min(2, "اسم القاعة يجب أن يكون حرفين على الأقل"),
  building: z.string().min(1, "المبنى مطلوب"),
  capacity: z.number().min(1, "السعة يجب أن تكون 1 على الأقل").optional(),
  apSsid: z.string().optional(),
  apIpRange: z.string().optional(),
  apIdentifier: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function HallFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: hall, isLoading: hallLoading } = useHall(id ?? "");
  const createMutation = useCreateHall();
  const updateMutation = useUpdateHall();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      building: "",
      capacity: 30,
      apSsid: "",
      apIpRange: "",
      apIdentifier: "",
    },
  });

  useEffect(() => {
    if (hall) {
      form.reset({
        name: hall.name,
        building: hall.building,
        capacity: hall.capacity ?? 30,
        apSsid: hall.accessPoint?.ssid || "",
        apIpRange: hall.accessPoint?.ipRange || "",
        apIdentifier: hall.accessPoint?.apIdentifier || "",
      });
    }
  }, [hall, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const data = {
        name: values.name,
        building: values.building,
        capacity: values.capacity,
        accessPoint: {
          ssid: values.apSsid,
          ipRange: values.apIpRange,
          apIdentifier: values.apIdentifier,
        },
      };
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/halls");
    } catch {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && hallLoading) {
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
                <DoorOpen className="h-8 w-8 text-primary" />
              ) : (
                <Plus className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">
                {isEditing ? "تعديل القاعة" : "إضافة قاعة جديدة"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditing
                  ? "تعديل بيانات القاعة الحالية"
                  : "أدخل المعلومات الأساسية لتعريف قاعة جديدة في الكلية"}
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
              <Building className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">معلومات القاعة</h2>
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
                          <DoorOpen className="h-4 w-4 text-muted-foreground" />
                          اسم القاعة
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="قاعة 101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="building"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          المبنى
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مبنى أ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          سعة القاعة (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          عدد الطلاب الأقصى
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Access Point Fields */}
                <div className="border-t border-border/50 pt-8 mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Wifi className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">
                      نقطة الوصول (Access Point) - اختياري
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="apSsid"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-muted-foreground" />
                            اسم الشبكة (SSID)
                          </FormLabel>
                          <FormControl>
                            <Input
                              dir="ltr"
                              placeholder="Network_Name"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            اسم شبكة الواي فاي المرتبطة بالقاعة
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apIpRange"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2">
                            <Network className="h-4 w-4 text-muted-foreground" />
                            نطاق IP
                          </FormLabel>
                          <FormControl>
                            <Input
                              dir="ltr"
                              placeholder="192.168.137"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            نطاق عناوين IP للشبكة
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apIdentifier"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2">
                            <Network className="h-4 w-4 text-muted-foreground" />
                            معرف نقطة الوصول
                          </FormLabel>
                          <FormControl>
                            <Input dir="ltr" placeholder="AP-001" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            معرف فريد لنقطة الوصول
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                    {isEditing ? "حفظ التغييرات" : "إضافة قاعة"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-8 gap-2"
                    onClick={() => navigate("/halls")}
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
                <DoorOpen className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">اسم القاعة</p>
                  <p>اسم مميز لتحديد القاعة بسهولة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">المبنى والطابق</p>
                  <p>لتسهيل الوصول للقاعة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Network className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">عنوان MAC</p>
                  <p>يستخدم للتحقق من موقع الطالب</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wifi className="h-4 w-4 mt-0.5 text-primary/60" />
                <div>
                  <p className="font-medium text-foreground">اسم الشبكة</p>
                  <p>شبكة الواي فاي الخاصة بالقاعة</p>
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
              تأكد من إدخال عنوان MAC الصحيح لنقطة الوصول. هذا العنوان ضروري
              للتحقق من أن الطالب موجود فعلياً داخل القاعة عند تسجيل الحضور.
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
                onClick={() => navigate("/halls")}
              >
                <DoorOpen className="h-4 w-4" />
                عرض جميع القاعات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 rounded-xl"
                onClick={() => navigate("/halls/access-points")}
              >
                <Wifi className="h-4 w-4" />
                إدارة نقاط الوصول
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
