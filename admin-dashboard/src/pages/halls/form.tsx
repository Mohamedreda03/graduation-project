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
  Key,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useCreateHall, useUpdateHall, useHall, useUpdateAccessPoint } from "@/hooks";

const formSchema = z.object({
  name: z.string().min(2, "اسم القاعة يجب أن يكون حرفين على الأقل"),
  building: z.string().min(1, "المبنى مطلوب"),
  capacity: z.number().min(1, "السعة يجب أن تكون 1 على الأقل").optional(),
  apSsid: z.string().optional(),
  apIpRange: z.string().optional(),
  apIdentifier: z.string().optional(),
  apApiKey: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function HallFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: hall, isLoading: hallLoading } = useHall(id ?? "");
  const createMutation = useCreateHall();
  const updateMutation = useUpdateHall();
  const updateApMutation = useUpdateAccessPoint();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      building: "",
      capacity: 30,
      apSsid: "",
      apIpRange: "",
      apIdentifier: "",
      apApiKey: "",
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
        apApiKey: hall.accessPoint?.apiKey || "",
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
          apiKey: values.apApiKey,
        },
      };
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data });
        if (data.accessPoint) {
            await updateApMutation.mutateAsync({ id: id!, data: data.accessPoint });
        }
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/halls");
    } catch {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || updateApMutation.isPending;

  if (isEditing && hallLoading) {
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
            <DoorOpen className="h-6 w-6 text-primary" />
          ) : (
            <Plus className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "تعديل القاعة" : "إضافة قاعة جديدة"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing
              ? "تحديث بيانات وسعة القاعة الحالية"
              : "تسجيل قاعة جديدة في قاعدة بيانات الكلية"}
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
              <Building className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">البيانات الأساسية للقاعة</h2>
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
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <DoorOpen className="h-3.5 w-3.5 text-primary" />
                            اسم القاعة
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="قاعة 101" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="building"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Building className="h-3.5 w-3.5 text-primary" />
                            المبنى
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="مبنى أ" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            السعة الاستيعابية
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              className="h-10 tabular-nums"
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
                            الحد الأقصى لعدد الطلاب
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Access Point Fields */}
                  <div className="border-t border-dashed pt-6 mt-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Wifi className="h-4 w-4 text-primary" />
                      <h3 className="text-base font-bold">
                        إعدادات نقطة الوصول (Access Point)
                      </h3>
                      <Badge variant="outline" className="text-xs font-normal mr-2">اختياري</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="apSsid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <Wifi className="h-3.5 w-3.5 text-primary" />
                              اسم الشبكة (SSID)
                            </FormLabel>
                            <FormControl>
                              <Input
                                dir="ltr"
                                placeholder="Network_Name"
                                className="h-10 font-mono text-left"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="apIpRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <Network className="h-3.5 w-3.5 text-primary" />
                              نطاق IP
                            </FormLabel>
                            <FormControl>
                              <Input
                                dir="ltr"
                                placeholder="192.168.137"
                                className="h-10 font-mono text-left tabular-nums"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="apIdentifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <Network className="h-3.5 w-3.5 text-primary" />
                              معرف نقطة الوصول
                            </FormLabel>
                            <FormControl>
                              <Input dir="ltr" placeholder="AP-001" className="h-10 font-mono text-left" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="apApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <Key className="h-3.5 w-3.5 text-primary" />
                              مفتاح API
                            </FormLabel>
                            <FormControl>
                              <Input dir="ltr" placeholder="secret_key_123" type="text" className="h-10 font-mono text-left" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                      onClick={() => navigate("/halls")}
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
              <h3 className="font-bold text-sm">متطلبات الإدخال</h3>
            </div>
            <div className="p-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <DoorOpen className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-0.5">اسم القاعة</p>
                  <p className="text-xs leading-relaxed">يجب أن يكون الاسم مميزاً لتجنب التعارض في الجداول.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Network className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-0.5">بيانات الشبكة</p>
                  <p className="text-xs leading-relaxed">تُستخدم لمصادقة حضور الطلاب برمجياً عبر أجهزتهم.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm">إدارة القاعات</h3>
            </div>
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => navigate("/halls")}
              >
                <DoorOpen className="h-4 w-4" />
                عرض السجل الكامل
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => navigate("/halls/access-points")}
              >
                <Wifi className="h-4 w-4" />
                مراجعة نقاط الوصول
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
