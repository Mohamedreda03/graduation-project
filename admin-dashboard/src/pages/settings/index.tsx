import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Settings } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings, useUpdateSettingsBulk } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const settingsSchema = z.object({
  academicYear: z.string().min(1, "السنة الدراسية مطلوبة"),
  currentSemester: z.number().min(1).max(2),
  attendanceThreshold: z.number().min(0).max(100),
  lateThresholdMinutes: z.number().min(0),
  sessionTimeoutMinutes: z.number().min(1),
  maxDevicesPerStudent: z.number().min(1),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettingsBulk();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      academicYear: "2024-2025",
      currentSemester: 1,
      attendanceThreshold: 85,
      lateThresholdMinutes: 15,
      sessionTimeoutMinutes: 30,
      maxDevicesPerStudent: 1,
    },
  });

  useEffect(() => {
    if (settings) {
      const getValue = (key: string, defaultValue: any) => {
        const setting = settings.find((s) => s.key === key);
        return setting?.value ?? defaultValue;
      };

      form.reset({
        academicYear: getValue("academicYear", "2024-2025"),
        currentSemester: getValue("currentSemester", 1),
        attendanceThreshold: getValue("attendanceThreshold", 85),
        lateThresholdMinutes: getValue("lateThresholdMinutes", 15),
        sessionTimeoutMinutes: getValue("sessionTimeoutMinutes", 30),
        maxDevicesPerStudent: getValue("maxDevicesPerStudent", 1),
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: SettingsValues) => {
    const settingsArray = Object.entries(values).map(([key, value]) => ({
      key,
      value,
    }));
    await updateMutation.mutateAsync(settingsArray);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 text-right">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة إعدادات النظام</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          إعدادات النظام
        </h1>
        <p className="text-muted-foreground mt-1">
          تخصيص وتكوين المعاملات الأساسية للنظام
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="academic" dir="rtl" className="space-y-6">
            <TabsList className="w-full max-w-lg">
              <TabsTrigger value="academic" className="px-6">
                الإعدادات الأكاديمية
              </TabsTrigger>
              <TabsTrigger value="attendance" className="rounded-lg px-6">
                إعدادات الحضور
              </TabsTrigger>
              <TabsTrigger value="system" className="rounded-lg px-6">
                إعدادات النظام
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <TabsContent value="academic" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="academicYear"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>السنة الدراسية</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="2024-2025"
                              {...field}
                              dir="ltr"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            مثال: 2024-2025
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentSemester"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>الترم الحالي</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={2} {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            1 للترم الأول، 2 للترم الثاني
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="attendance" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="attendanceThreshold"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>الحد الأدنى لنسبة الحضور (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} max={100} {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            الطلاب الذين تقل نسبتهم عن هذه القيمة معرضون للحرمان
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lateThresholdMinutes"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>حد التأخير (بالدقائق)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            يُعتبر الطالب متأخراً بعد مرور هذا الوقت من بداية
                            المحاضرة
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="system" className="space-y-8 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="sessionTimeoutMinutes"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>مدة الجلسة (بالدقائق)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            مدة انتهاء صلاحية جلسة الطالب
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxDevicesPerStudent"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>الحد الأقصى للأجهزة لكل طالب</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            عدد الأجهزة المسموح بها لكل حساب طالب
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    حفظ الإعدادات
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
