import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Building2,
  Hash,
  FileText,
  GraduationCap,
  Save,
  Plus,
  Trash2,
  X,
  Layers
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

const levelSchema = z.object({
  level: z.number().min(1, "رقم الفرقة مطلوب"),
  name: z.string().min(2, "اسم الفرقة مطلوب"),
  hasDepartments: z.boolean().default(false),
  sectionsCount: z.number().min(1).max(20).default(2),
});

const formSchema = z.object({
  name: z.string().min(2, "اسم الكلية يجب أن يكون حرفين على الأقل"),
  code: z
    .string()
    .min(2, "رمز الكلية يجب أن يكون حرفين على الأقل")
    .max(10, "رمز الكلية لا يجب أن يتجاوز 10 أحرف"),
  description: z.string().optional(),
  departments: z.array(z.string()).default([]),
  levels: z.array(levelSchema).min(1, "يرجى إضافة فرقة واحدة على الأقل"),
});

type FormValues = z.infer<typeof formSchema>;

export function SpecializationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: specialization, isLoading: specializationLoading } = useSpecialization(id ?? "");
  const createMutation = useCreateSpecialization();
  const updateMutation = useUpdateSpecialization();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      description: "",
      departments: [],
      levels: [
        { level: 1, name: "الفرقة الإعدادية", hasDepartments: false, sectionsCount: 4 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "levels",
  });

  useEffect(() => {
    if (specialization) {
      form.reset({
        name: specialization.name,
        code: specialization.code,
        description: specialization.description || "",
        departments: specialization.departments || [],
        levels: specialization.levels && specialization.levels.length > 0 
          ? specialization.levels 
          : [{ level: 1, name: "الفرقة الإعدادية", hasDepartments: false, sectionsCount: 4 }],
      });
    }
  }, [specialization, form]);

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
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "تعديل بيانات الكلية" : "تسجيل كلية جديدة"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing
              ? "تحديث السجل الأكاديمي والفرق الدراسية للكلية"
              : "إدخال البيانات الأساسية والفرق الدراسية لإنشاء سجل كلية جديد"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                البيانات الأساسية
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      <Input placeholder="مثال: كلية الهندسة" className="h-10" {...field} />
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
                      الرمز الأكاديمي
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: ENG" className="h-10 font-mono text-left" {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="p-5 pt-0">
              <FormField
                control={form.control}
                name="departments"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel className="text-sm flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      الأقسام العلمية للكلية
                    </FormLabel>
                    <FormDescription className="text-xs">
                      أدخل كافة الأقسام المتاحة في هذه الكلية واضغط Enter. (ستستخدمها الفرق التخصصية لاحقاً)
                    </FormDescription>
                    
                    <div className="flex flex-wrap gap-2 p-3 bg-background border rounded-lg min-h-[3.5rem] mt-1 items-center">
                      {value.length === 0 ? (
                        <span className="text-xs text-muted-foreground px-2">لم يتم إضافة أي أقسام بعد</span>
                      ) : (
                        value.map((dept, deptIdx) => (
                          <Badge
                            key={deptIdx}
                            variant="secondary"
                            className="pr-2 pl-1.5 py-1 flex items-center gap-1 bg-primary/5 text-primary border-primary/20 text-sm"
                          >
                            {dept}
                            <button
                              type="button"
                              onClick={() => {
                                const newDepts = [...value];
                                newDepts.splice(deptIdx, 1);
                                onChange(newDepts);
                              }}
                              className="hover:bg-destructive/10 p-0.5 rounded-full text-primary hover:text-destructive transition-colors ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <Input
                        placeholder="اكتب اسم القسم واضغط Enter..."
                        className="h-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.currentTarget.value || "").trim();
                            if (val && !value.includes(val)) {
                              onChange([...value, val]);
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                الفرق الدراسية والأقسام
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ level: fields.length + 1, name: `الفرقة ${fields.length + 1}`, hasDepartments: false, sectionsCount: 4 })}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة فرقة جديدة
              </Button>
            </div>
            
            <div className="p-5 space-y-6">
              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  لم يتم إضافة أي فرق دراسية بعد. يرجى إضافة فرقة واحدة على الأقل.
                </div>
              )}
              
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 relative">
                  <div className="absolute top-4 left-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pr-2">
                    <FormField
                      control={form.control}
                      name={`levels.${index}.level`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">رقم الفرقة (برمجياً)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`levels.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">اسم الفرقة</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: الفرقة الأولى" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`levels.${index}.sectionsCount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">عدد السكاشن</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name={`levels.${index}.hasDepartments`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-bold">فرقة تخصصية (بها أقسام)</FormLabel>
                          <FormDescription className="text-xs">
                            {field.value
                              ? "هذه الفرقة سترث كافة أقسام الكلية المحددة أعلاه تلقائياً."
                              : "هذه الفرقة عامة ولا يوجد لها أقسام (مثل الإعدادية)."}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            dir="ltr"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              {form.formState.errors.levels?.message && (
                <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.levels?.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
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
  );
}
