import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
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
  Shield,
  GraduationCap,
  BookOpen,
  Hash,
  Wifi,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpecializations, useCreateStudentsBulk } from "@/hooks";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ParsedStudent {
  name: {
    first: string;
    last: string;
  };
  email: string;
  studentId: string;
  phone?: string;
  device?: {
    macAddress: string;
    isVerified: boolean;
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ImportStudentsPage() {
  const navigate = useNavigate();
  const { data: specializationsData } = useSpecializations();
  const createBulkMutation = useCreateStudentsBulk();

  // Sidebar state — كل البيانات الأكاديمية هنا
  const [specialization, setSpecialization] = useState("");
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [defaultPassword, setDefaultPassword] = useState("123456");

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [parseError, setParseError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // ─── الفرق المتاحة بناءً على التخصص المختار ───────────────────────────
  const availableLevels = useMemo(() => {
    if (!specialization || !specializationsData) return [];
    const spec = specializationsData.find((s) => s._id === specialization);
    return spec?.levels ?? [];
  }, [specialization, specializationsData]);

  const availableDepartments = useMemo(() => {
    if (!specialization || !specializationsData) return [];
    const spec = specializationsData.find((s) => s._id === specialization);
    return spec?.departments ?? [];
  }, [specialization, specializationsData]);

  const selectedLevelData = useMemo(() => {
    return availableLevels.find(l => String(l.level) === level);
  }, [availableLevels, level]);

  const requiresDepartment = selectedLevelData?.hasDepartments ?? false;

  // ─── عند تغيير التخصص أو الفرقة، نصفر ما يليه ─────────────────────────
  const handleSpecializationChange = (val: string) => {
    setSpecialization(val);
    setLevel("");
    setDepartment("");
  };

  const handleLevelChange = (val: string) => {
    setLevel(val);
    setDepartment("");
  };

  // ─── قراءة الأكسيل ────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError("");
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Get array of arrays (raw values)
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (rows.length < 2) {
          setParseError("الملف فارغ أو لا يحتوي على بيانات كافية");
          return;
        }

        const headers = (rows[0] as string[]).map((h) =>
          String(h || "").trim().toLowerCase()
        );

        // الأعمدة الأساسية (مطلوبة)
        const nameIdx = headers.findIndex(
          (h) => h.includes("name") || h.includes("اسم") || h.includes("الاسم")
        );
        const emailIdx = headers.findIndex(
          (h) =>
            h.includes("email") ||
            h.includes("بريد") ||
            h.includes("البريد") ||
            h.includes("ايميل") ||
            h.includes("إيميل")
        );
        const idIdx = headers.findIndex(
          (h) =>
            h.includes("id") ||
            h.includes("رقم") ||
            h.includes("الرقم") ||
            h.includes("كود") ||
            h.includes("studentid")
        );

        // الأعمدة الاختيارية
        const macIdx = headers.findIndex(
          (h) =>
            h.includes("mac") ||
            h.includes("ماك") ||
            h.includes("macaddress") ||
            h.includes("عنوان الماك") ||
            h.includes("جهاز")
        );
        const phoneIdx = headers.findIndex(
          (h) =>
            h.includes("phone") ||
            h.includes("هاتف") ||
            h.includes("تليفون") ||
            h.includes("موبايل") ||
            h.includes("جوال")
        );

        if (nameIdx === -1 || emailIdx === -1 || idIdx === -1) {
          setParseError(
            "الملف يجب أن يحتوي على: الاسم (Name) | البريد الإلكتروني (Email) | الرقم الأكاديمي (Student ID)"
          );
          return;
        }

        const students: ParsedStudent[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const fullName = String(row[nameIdx] || "").trim();
          const email = String(row[emailIdx] || "").trim();
          const studentId = String(row[idIdx] || "").trim();

          if (!fullName || !email || !studentId) continue;

          const nameParts = fullName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || firstName;

          const phone = phoneIdx !== -1 ? String(row[phoneIdx] || "").trim() : "";
          const macAddress = macIdx !== -1 ? String(row[macIdx] || "").trim() : "";

          students.push({
            name: { first: firstName, last: lastName },
            email,
            studentId,
            ...(phone ? { phone } : {}),
            ...(macAddress ? { device: { macAddress, isVerified: true } } : {}),
          });
        }

        if (students.length === 0) {
          setParseError("لم يتم العثور على بيانات صالحة في الملف");
          return;
        }

        setParsedData(students);
        setCurrentStep(2);
      } catch (error) {
        console.error(error);
        setParseError(
          "حدث خطأ أثناء قراءة الملف. يرجى التأكد من اختيار ملف Excel صالح (.xlsx / .xls)."
        );
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // ─── تحميل القالب ─────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const headers = [
      "الاسم (Name)",
      "البريد الإلكتروني (Email)",
      "الرقم الأكاديمي (Student ID)",
      "عنوان الماك (MAC Address)",
      "الهاتف (Phone)",
    ];
    const sampleData = [
      headers,
      ["أحمد محمد علي", "ahmed.ali@example.com", "20230001", "AA:BB:CC:DD:EE:01", "01012345678"],
      ["سارة يوسف", "sara.yousef@example.com", "20230002", "AA:BB:CC:DD:EE:02", "01112345678"],
      ["محمد إبراهيم", "m.ibrahim@example.com", "20230003", "", ""],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الطلاب");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(fileData);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_students.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── إرسال البيانات ───────────────────────────────────────────────────
  const handleImport = async () => {
    if (!specialization || !level || parsedData.length === 0) return;

    try {
      await createBulkMutation.mutateAsync({
        students: parsedData.map((s) => ({
          ...s,
          academicInfo: {
            specialization,
            level: parseInt(level),
            ...(requiresDepartment && department ? { department } : {}),
          },
        })),
        defaultPassword,
      });
      navigate("/students");
    } catch {
      // Error handled by mutation
    }
  };

  const isReadyToImport =
    !!specialization && !!level && (!requiresDepartment || !!department) && parsedData.length > 0;

  const steps = [
    { id: 1, title: "رفع الملف", icon: Upload },
    { id: 2, title: "مراجعة السجلات", icon: FileText },
    { id: 3, title: "تنفيذ الاستيراد", icon: CheckCircle2 },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dashed pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              استيراد سجلات الطلاب
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              ارفع ملف Excel — الاسم والإيميل والرقم الأكاديمي (مطلوب) + MAC Address والهاتف (اختياري)
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="h-10 px-4 gap-2"
        >
          <Download className="h-4 w-4" />
          تحميل القالب المعتمد
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${
                currentStep >= step.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/30 border-transparent text-muted-foreground"
              }`}
            >
              <step.icon className="h-4 w-4" />
              <span className="font-semibold text-sm">{step.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <ArrowLeft className="h-4 w-4 mx-2 text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ Main Content ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Upload */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="text-base font-bold flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm tabular-nums">
                  1
                </div>
                رفع ملف البيانات
              </h2>
            </div>

            {/* Columns info */}
            <div className="px-5 pt-4 pb-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium shrink-0">مطلوب:</span>
                {[
                  { icon: Users, label: "الاسم" },
                  { icon: Hash, label: "الرقم الأكاديمي" },
                  { icon: BookOpen, label: "البريد الإلكتروني" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 font-semibold"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium shrink-0">اختياري:</span>
                {[
                  { icon: Wifi, label: "MAC Address" },
                  { icon: Phone, label: "الهاتف" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded border border-dashed font-medium"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5">
              <div
                className={`relative border border-dashed rounded-lg p-8 text-center transition-colors ${
                  file
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto bg-primary/10 rounded-md flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm" dir="ltr">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
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
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto bg-muted rounded-md flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        اسحب الملف هنا أو اضغط للاختيار
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                        .xlsx, .xls, .csv
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="mt-4 flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{parseError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Preview */}
          {parsedData.length > 0 && (
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm tabular-nums">
                    2
                  </div>
                  معاينة السجلات المكتشفة
                </h2>
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {parsedData.length} سجل
                </Badge>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0 border-b">
                    <tr>
                      <th className="px-4 py-2.5 text-right font-bold text-muted-foreground w-12">#</th>
                      <th className="px-4 py-2.5 text-right font-bold text-muted-foreground">الاسم</th>
                      <th className="px-4 py-2.5 text-right font-bold text-muted-foreground">الرقم الأكاديمي</th>
                      <th className="px-4 py-2.5 text-right font-bold text-muted-foreground">البريد الإلكتروني</th>
                      <th className="px-4 py-2.5 text-right font-bold text-muted-foreground">MAC Address</th>
                      <th className="px-4 py-2.5 text-right font-bold text-muted-foreground">الهاتف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.slice(0, 10).map((student, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {student.name.first} {student.name.last}
                        </td>
                        <td className="px-4 py-2 font-mono text-muted-foreground tabular-nums" dir="ltr">
                          {student.studentId}
                        </td>
                        <td className="px-4 py-2 font-mono text-muted-foreground text-xs" dir="ltr">
                          {student.email}
                        </td>
                        <td className="px-4 py-2" dir="ltr">
                          {student.device?.macAddress ? (
                            <span className="inline-flex items-center gap-1 text-xs font-mono text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                              <Wifi className="h-3 w-3" />
                              {student.device.macAddress}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground font-mono" dir="ltr">
                          {student.phone || <span className="text-muted-foreground/50">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="p-3 text-center text-xs text-muted-foreground bg-muted/30 border-t">
                    + {parsedData.length - 10} سجل إضافي غير معروض
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-4">

          {/* Academic Settings */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                البيانات الأكاديمية
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                ستُطبَّق على جميع الطلاب المستوردين
              </p>
            </div>
            <div className="p-5 space-y-5">

              {/* التخصص */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  التخصص
                </label>
                <Select
                  dir="rtl"
                  value={specialization}
                  onValueChange={handleSpecializationChange}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="اختر التخصص..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(specializationsData ?? []).map((spec) => (
                      <SelectItem key={spec._id} value={spec._id}>
                        <span className="font-medium">{spec.name}</span>
                        {spec.code && (
                          <span className="text-muted-foreground mr-2 text-xs">
                            ({spec.code})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* الفرقة — تظهر فقط بعد اختيار التخصص */}
              {specialization && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">
                    الفرقة الدراسية
                  </label>
                  {availableLevels.length > 0 ? (
                    <Select dir="rtl" value={level} onValueChange={handleLevelChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر الفرقة..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLevels.map((lvl) => (
                          <SelectItem
                            key={lvl.level}
                            value={String(lvl.level)}
                          >
                            {lvl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 border border-dashed">
                      لم يتم تحديد فرق لهذا التخصص بعد
                    </p>
                  )}
                </div>
              )}

              {/* القسم — يظهر فقط إذا كانت الفرقة المختارة تتطلب قسم */}
              {requiresDepartment && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">
                    القسم
                  </label>
                  {availableDepartments.length > 0 ? (
                    <Select dir="rtl" value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر القسم..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 border border-dashed text-destructive">
                      الفرقة تتطلب قسم، ولكن لم يتم إضافة أقسام لهذا التخصص
                    </p>
                  )}
                </div>
              )}

              {/* كلمة المرور */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  كلمة المرور الافتراضية
                </label>
                <Input
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  dir="ltr"
                  className="h-10 font-mono text-left"
                />
                <p className="text-xs text-muted-foreground">
                  كلمة مرور مؤقتة يستخدمها الطالب عند أول تسجيل دخول
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-card rounded-lg border shadow-sm p-4 space-y-3">
            {/* Validation checklist */}
            <div className="space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${parsedData.length > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${parsedData.length > 0 ? "bg-green-100 border-green-500" : "border-muted-foreground/40"}`}>
                  {parsedData.length > 0 && <CheckCircle2 className="h-3 w-3" />}
                </div>
                ملف البيانات {parsedData.length > 0 ? `(${parsedData.length} طالب)` : "غير مرفوع"}
              </div>
              <div className={`flex items-center gap-2 ${specialization ? "text-green-600" : "text-muted-foreground"}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${specialization ? "bg-green-100 border-green-500" : "border-muted-foreground/40"}`}>
                  {specialization && <CheckCircle2 className="h-3 w-3" />}
                </div>
                التخصص {specialization ? "محدد ✓" : "غير محدد"}
              </div>
              <div className={`flex items-center gap-2 ${level ? "text-green-600" : "text-muted-foreground"}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${level ? "bg-green-100 border-green-500" : "border-muted-foreground/40"}`}>
                  {level && <CheckCircle2 className="h-3 w-3" />}
                </div>
                الفرقة {level ? "محددة ✓" : "غير محددة"}
              </div>
              {requiresDepartment && (
                <div className={`flex items-center gap-2 ${department ? "text-green-600" : "text-muted-foreground"}`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${department ? "bg-green-100 border-green-500" : "border-muted-foreground/40"}`}>
                    {department && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  القسم {department ? "محدد ✓" : "غير محدد"}
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-2">
              <Button
                onClick={() => {
                  setCurrentStep(3);
                  handleImport();
                }}
                disabled={!isReadyToImport || createBulkMutation.isPending}
                className="w-full h-10 font-bold gap-2"
              >
                {createBulkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري تسجيل البيانات...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    تسجيل ({parsedData.length || 0}) طالب
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/students")}
                className="w-full h-10"
                disabled={createBulkMutation.isPending}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
