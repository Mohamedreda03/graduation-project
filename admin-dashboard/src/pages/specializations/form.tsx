import { useEffect, useState } from "react";
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
  Plus,
  X,
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
import {
  useCreateSpecialization,
  useUpdateSpecialization,
  useSpecialization,
} from "@/hooks";

const levelNames: Record<string, string> = {
  "1": "الفرقة الإعدادية",
  "2": "الفرقة الأولى",
  "3": "الفرقة الثانية",
  "4": "الفرقة الثالثة",
  "5": "الفرقة الرابعة",
  "6": "الفرقة الخامسة",
};

const formSchema = z.object({
  name: z.string().min(2, "اسم الكلية يجب أن يكون حرفين على الأقل"),
  code: z
    .string()
    .min(2, "رمز الكلية يجب أن يكون حرفين على الأقل")
    .max(10, "رمز الكلية لا يجب أن يتجاوز 10 أحرف"),
  faculty: z.string().min(2, "يرجى إضافة قسم واحد على الأقل"),
  description: z.string().optional(),
  sectionsCount: z.record(z.string(), z.number().min(1).max(8)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SpecializationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: specialization, isLoading: specializationLoading } = useSpecialization(
    id ?? "",
  );
  const createMutation = useCreateSpecialization();
  const updateMutation = useUpdateSpecialization();

  const [departments, setDepartments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      faculty: "",
      description: "",
      sectionsCount: {
        "1": 2,
        "2": 2,
        "3": 2,
        "4": 2,
        "5": 2,
        "6": 2,
      },
    },
  });

  useEffect(() => {
    if (specialization) {
      const depts = specialization.faculty
        ? specialization.faculty.split(/[،,]/).map((t: string) => t.trim()).filter(Boolean)
        : [];
      setDepartments(depts);

      form.reset({
        name: specialization.name,
        code: specialization.code,
        faculty: specialization.faculty || "",
        description: specialization.description || "",
        sectionsCount: {
          "1": specialization.sectionsCount?.["1"] ?? 2,
          "2": specialization.sectionsCount?.["2"] ?? 2,
          "3": specialization.sectionsCount?.["3"] ?? 2,
          "4": specialization.sectionsCount?.["4"] ?? 2,
          "5": specialization.sectionsCount?.["5"] ?? 2,
          "6": specialization.sectionsCount?.["6"] ?? 2,
        },
      });
    }
  }, [specialization, form]);

  const addDepartment = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !departments.includes(trimmed)) {
      const newDepts = [...departments, trimmed];
      setDepartments(newDepts);
      form.setValue("faculty", newDepts.join("، "), { shouldValidate: true });
    }
    setInputValue("");
  };

  const removeDepartment = (indexToRemove: number) => {
    const newDepts = departments.filter((_, idx) => idx !== indexToRemove);
    setDepartments(newDepts);
    form.setValue("faculty", newDepts.join("، "), { shouldValidate: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "،") {
      e.preventDefault();
      addDepartment(inputValue);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      navigate("/specializations");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && specializationLoading) {
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
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "تعديل بيانات الكلية" : "تسجيل كلية جديدة"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing
              ? "تحديث السجل الأكاديمي والإداري للكلية"
              : "إدخال البيانات الأساسية لإنشاء سجل كلية جديد"}
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
              البيانات الأساسية
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          اسم الكلية
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: علوم الحاسب" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <Hash className="h-3.5 w-3.5 text-primary" />
                          رمز الكلية
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: CS" className="h-10 font-mono text-left" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel className="flex items-center gap-2 text-sm font-bold">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        الأقسام العلمية التابعة
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        اكتب اسم القسم واضغط زر (إدخال Enter) أو الفاصلة (،) أو الزر الجانبي للإضافة.
                      </FormDescription>
                      
                      {/* Tags Container */}
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border rounded-xl min-h-12 mt-2 items-center">
                        {departments.length === 0 ? (
                          <span className="text-xs text-muted-foreground font-medium">
                            لا توجد أقسام مضافة بعد. يرجى إضافة قسم واحد على الأقل.
                          </span>
                        ) : (
                          departments.map((dept, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="pr-2 pl-1.5 py-1 flex items-center gap-1.5 bg-background border hover:bg-muted font-bold text-xs rounded-lg transition-all"
                            >
                              <span>{dept}</span>
                              <button
                                type="button"
                                onClick={() => removeDepartment(index)}
                                className="hover:bg-destructive/10 p-0.5 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>

                      {/* Input controls */}
                      <div className="flex gap-2 mt-2">
                        <FormControl>
                          <Input
                            placeholder="مثال: قسم هندسة الاتصالات"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-10 rounded-xl flex-1"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addDepartment(inputValue)}
                          className="h-10 px-4 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <Plus className="h-4 w-4 ml-1" />
                          إضافة
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sections Count Per Level */}
                <div className="space-y-4 pt-6 border-t border-dashed">
                  <div>
                    <h3 className="text-base font-bold text-foreground">السعة الاستيعابية (عدد السكاشن)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      العدد الافتراضي للسكاشن لكل فرقة دراسية، يستخدم في جدولة المحاضرات.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(levelNames).map(([levelVal, levelLabel]) => (
                      <FormField
                        key={levelVal}
                        control={form.control}
                        name={`sectionsCount.${levelVal}`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 p-3 rounded-md border bg-muted/20">
                            <FormLabel className="text-xs font-semibold">{levelLabel}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={8}
                                className="h-9 text-center tabular-nums"
                                {...field}
                                value={field.value ?? 2}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-dashed">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 px-6"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    {isEditing ? "حفظ التعديلات" : "تأكيد الإضافة"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/specializations")}
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
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-bold text-sm">ضوابط الإدخال</h3>
            </div>
            <div className="p-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">اسم الكلية</p>
                  <p className="text-xs leading-relaxed">يجب استخدام الاسم الرسمي المعتمد في السجلات الأكاديمية للجامعة.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">الترميز الأكاديمي</p>
                  <p className="text-xs leading-relaxed">رمز إنجليزي قصير (مثل CS) يستخدم في جداول المحاضرات وأرقام الجلوس.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
