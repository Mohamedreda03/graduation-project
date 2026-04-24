import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  Users,
  FileText,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments, useCreateStudentsBulk } from "@/hooks";
import type { Department } from "@/types";

interface ParsedStudent {
  name: {
    first: string;
    last: string;
  };
  email: string;
  studentId: string;
  academicInfo: {
    level: number;
  };
}

export function ImportStudentsPage() {
  const navigate = useNavigate();
  const { data: departmentsData } = useDepartments();
  const createBulkMutation = useCreateStudentsBulk();

  const [department, setDepartment] = useState("");
  const [defaultPassword, setDefaultPassword] = useState("123456");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [parseError, setParseError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError("");
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          setParseError("الملف فارغ أو لا يحتوي على بيانات كافية");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(
          (h) => h.includes("name") || h.includes("اسم"),
        );
        const emailIdx = headers.findIndex(
          (h) => h.includes("email") || h.includes("بريد"),
        );
        const idIdx = headers.findIndex(
          (h) => h.includes("id") || h.includes("رقم"),
        );
        const levelIdx = headers.findIndex(
          (h) => h.includes("level") || h.includes("مستوى"),
        );

        if (nameIdx === -1 || emailIdx === -1 || idIdx === -1) {
          setParseError("الملف يجب أن يحتوي على أعمدة: name, email, studentId");
          return;
        }

        const students: ParsedStudent[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          if (cols.length < 3) continue;

          const fullName = cols[nameIdx] || "";
          const nameParts = fullName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || firstName;

          students.push({
            name: {
              first: firstName,
              last: lastName,
            },
            email: cols[emailIdx] || "",
            studentId: cols[idIdx] || "",
            academicInfo: {
              level: levelIdx !== -1 ? parseInt(cols[levelIdx]) || 1 : 1,
            },
          });
        }

        if (students.length === 0) {
          setParseError("لم يتم العثور على بيانات صالحة في الملف");
          return;
        }

        setParsedData(students);
        setCurrentStep(2);
      } catch {
        setParseError("حدث خطأ أثناء قراءة الملف");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!department || parsedData.length === 0) return;

    try {
      await createBulkMutation.mutateAsync({
        students: parsedData.map((s) => ({
          ...s,
          academicInfo: {
            ...s.academicInfo,
            department,
          },
        })),
        defaultPassword,
      });
      navigate("/students");
    } catch {
      // Error handled by mutation
    }
  };

  const departments: Department[] = departmentsData || [];

  const steps = [
    { id: 1, title: "رفع الملف", icon: Upload },
    { id: 2, title: "مراجعة البيانات", icon: FileText },
    { id: 3, title: "تأكيد الاستيراد", icon: CheckCircle2 },
  ];

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-muted/30 p-8 mb-8 border border-border/50">
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                  استيراد الطلاب
                </h1>
                <p className="text-muted-foreground">
                  استيراد مجموعة طلاب من ملف CSV بخطوات بسيطة
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 text-sm bg-background/50 px-4 py-2 rounded-full border border-border/50">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>استيراد سريع</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-background/50 px-4 py-2 rounded-full border border-border/50">
                <Shield className="h-4 w-4 text-green-500" />
                <span>تحقق تلقائي</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-background/50 px-4 py-2 rounded-full border border-border/50">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>معالجة ذكية</span>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <Button variant="outline" className="rounded-xl gap-2 shrink-0">
            <Download className="h-4 w-4" />
            تحميل قالب CSV
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center shrink-0">
            <div
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl ${
                currentStep >= step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-sm sm:text-base">
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mx-1 sm:mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Upload */}
          <div className="bg-card/50 dark:bg-card/20 backdrop-blur-sm rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  1
                </div>
                رفع ملف البيانات
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center ${
                  file
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setParsedData([]);
                        setCurrentStep(1);
                      }}
                    >
                      تغيير الملف
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-muted rounded-2xl flex items-center justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        اسحب الملف هنا أو اضغط للاختيار
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        يدعم ملفات CSV فقط
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="mt-4 flex items-center gap-3 text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{parseError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Preview */}
          {parsedData.length > 0 && (
            <div className="bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    2
                  </div>
                  معاينة البيانات
                </h2>
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {parsedData.length} طالب
                </div>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-4 text-right font-bold text-sm">#</th>
                      <th className="p-4 text-right font-bold text-sm">
                        الاسم
                      </th>
                      <th className="p-4 text-right font-bold text-sm">
                        البريد
                      </th>
                      <th className="p-4 text-right font-bold text-sm">
                        الرقم
                      </th>
                      <th className="p-4 text-right font-bold text-sm">
                        المستوى
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {parsedData.slice(0, 10).map((student, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-4 text-muted-foreground">{idx + 1}</td>
                        <td className="p-4 font-medium">
                          {student.name.first} {student.name.last}
                        </td>
                        <td className="p-4 text-left" dir="ltr">
                          {student.email}
                        </td>
                        <td className="p-4" dir="ltr">
                          {student.studentId}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                            {student.academicInfo.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="p-4 text-center text-muted-foreground bg-muted/30 border-t border-border/30">
                    و {parsedData.length - 10} طالب آخر...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Department Selection */}
          <div className="bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/30">
              <h2 className="text-lg font-bold">إعدادات الاستيراد</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  القسم
                </label>
                <Select dir="rtl" value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  كلمة المرور الافتراضية
                </label>
                <Input
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  سيتم تعيين هذه الكلمة لجميع الطلاب المستوردين
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-card/50 dark:bg-card/20 rounded-3xl border border-border/50 shadow-sm p-5 sm:p-6">
            <Button
              onClick={() => {
                setCurrentStep(3);
                handleImport();
              }}
              disabled={
                !department ||
                parsedData.length === 0 ||
                createBulkMutation.isPending
              }
              className="w-full h-12 sm:h-14 rounded-xl text-base sm:text-lg font-bold gap-2 sm:gap-3"
            >
              {createBulkMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Users className="h-5 w-5" />
                  استيراد {parsedData.length || 0} طالب
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/students")}
              className="w-full mt-3 rounded-xl"
            >
              إلغاء والعودة
            </Button>
          </div>

          {/* Help Card */}
          <div className="bg-muted/30 rounded-3xl border border-border/50 p-5 sm:p-6">
            <h3 className="font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              نصيحة
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              تأكد من أن ملف CSV يحتوي على الأعمدة التالية: name, email,
              studentId, level (اختياري)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
