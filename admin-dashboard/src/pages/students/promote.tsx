import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSpecializations, usePromotionPreview, usePromoteStudents } from "@/hooks";
import type { PromotionStudent, PromotionResult } from "@/services/students.service";
import type { Specialization } from "@/types";

// ─── Step Indicator ────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = [
    { label: "اختيار الفرقة" },
    { label: "اختيار الطلاب" },
    { label: "النتيجة" },
  ];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${done ? "bg-primary border-primary text-primary-foreground"
                  : active ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"}`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : idx}
            </div>
            <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Student Row ────────────────────────────────────────────────────────────
function StudentRow({
  student,
  checked,
  onToggle,
}: {
  student: PromotionStudent;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  const fullName = `${student.name.first} ${student.name.last}`;
  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer
        ${checked ? "border-primary/40 bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
      onClick={() => onToggle(student._id)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle(student._id)}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{fullName}</p>
        <p className="text-xs text-muted-foreground font-mono">{student.studentId || "—"}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {student.specialization && (
          <Badge variant="outline" className="text-xs">{student.specialization.name}</Badge>
        )}
        {checked ? (
          student.willGraduate ? (
            <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-300">
              <GraduationCap className="w-3 h-3 ml-1" /> تخرج
            </Badge>
          ) : (
            <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-300">
              <TrendingUp className="w-3 h-3 ml-1" />
              → {student.nextLevelName || `فرقة ${student.nextLevel}`}
            </Badge>
          )
        ) : (
          <Badge variant="secondary" className="text-xs">
            <RefreshCw className="w-3 h-3 ml-1" /> يعيد السنة
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function PromoteStudentsPage() {
  const navigate = useNavigate();

  // Step 1 filters
  const [specialization, setSpecialization] = useState("");
  const [level, setLevel] = useState("");
  const [fetchEnabled, setFetchEnabled] = useState(false);

  // Step 2 selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Step 3 result
  const [result, setResult] = useState<PromotionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  const { data: specializationsData } = useSpecializations();

  const selectedSpec = specializationsData?.find(
    (s: Specialization) => s._id === specialization,
  );
  const availableLevels = selectedSpec?.levels || [];

  // Fetch preview
  const { data: previewData, isLoading: isLoadingPreview } = usePromotionPreview(
    {
      level: parseInt(level),
      specialization: specialization || undefined,
    },
    fetchEnabled && !!level,
  );

  const promoteStudents = usePromoteStudents();

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    if (!previewData?.students) return [];
    if (!search) return previewData.students;
    const q = search.toLowerCase();
    return previewData.students.filter(
      (s) =>
        `${s.name.first} ${s.name.last}`.toLowerCase().includes(q) ||
        (s.studentId || "").toLowerCase().includes(q),
    );
  }, [previewData, search]);

  // Toggle single
  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select / deselect all filtered
  const toggleAll = () => {
    const allIds = filteredStudents.map((s) => s._id);
    const allSelected = allIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Step 1 → 2
  const handleFetch = () => {
    setFetchEnabled(true);
    setSelected(new Set()); // reset selection
    setCurrentStep(2);
  };

  // Pre-select all when data loads
  const handleDataLoaded = (students: PromotionStudent[]) => {
    setSelected(new Set(students.map((s) => s._id)));
  };

  // Watch for data arriving and auto-select
  const [autoSelected, setAutoSelected] = useState(false);
  if (previewData && !autoSelected) {
    handleDataLoaded(previewData.students);
    setAutoSelected(true);
  }

  // Confirmation → execute
  const handleConfirm = async () => {
    setConfirmOpen(false);
    try {
      const res = await promoteStudents.mutateAsync({
        studentIds: Array.from(selected),
        clearEnrolledCourses: false,
      });
      setResult(res);
      setCurrentStep(3);
    } catch { /* error handled in hook */ }
  };

  // Summary counts
  const selectedStudents = previewData?.students.filter((s) => selected.has(s._id)) || [];
  const willGraduateCount = selectedStudents.filter((s) => s.willGraduate).length;
  const willPromoteCount = selectedStudents.length - willGraduateCount;
  const willRepeatCount = (previewData?.students.length || 0) - selected.size;

  const allFiltered = filteredStudents.every((s) => selected.has(s._id));

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4 border-dashed">
        <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ترقية السنوات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ترقية الطلاب من فرقة لأخرى في نهاية العام الدراسي
          </p>
        </div>
      </div>

      <StepIndicator current={currentStep} />

      {/* ── STEP 1 ── */}
      {currentStep === 1 && (
        <div className="bg-card border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">اختر الفرقة المراد ترقيتها</h2>
            <p className="text-sm text-muted-foreground">
              اختر التخصص والفرقة الحالية — سيتم عرض جميع الطلاب النشطين في هذه الفرقة
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التخصص</label>
              <Select
                dir="rtl"
                value={specialization}
                onValueChange={(v) => {
                  setSpecialization(v === "all" ? "" : v);
                  setLevel("");
                  setFetchEnabled(false);
                  setAutoSelected(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع التخصصات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التخصصات</SelectItem>
                  {specializationsData?.map((s: Specialization) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">الفرقة الحالية <span className="text-destructive">*</span></label>
              <Select
                dir="rtl"
                value={level}
                onValueChange={(v) => {
                  setLevel(v);
                  setFetchEnabled(false);
                  setAutoSelected(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرقة" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.length > 0 ? (
                    availableLevels.map((l: { level: number; name: string }) => (
                      <SelectItem key={l.level} value={String(l.level)}>
                        {l.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>الفرقة {n}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!level}
            onClick={handleFetch}
          >
            <Users className="ml-2 h-4 w-4" />
            عرض الطلاب
          </Button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {isLoadingPreview ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>جاري تحميل بيانات الطلاب...</span>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{previewData?.summary.total || 0}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">إجمالي الطلاب</div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{willPromoteCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">سيُرقَّى</div>
                </div>
                <div className="bg-amber-500/5 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{willGraduateCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">سيتخرج</div>
                </div>
              </div>

              {willRepeatCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>{willRepeatCount} طالب سيعيد السنة (غير محدد)</span>
                </div>
              )}

              {/* Search + Select all */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو الرقم الأكاديمي..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {allFiltered ? "إلغاء تحديد الكل" : "تحديد الكل"}
                </Button>
              </div>

              {/* Students list */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {previewData?.students.length === 0
                    ? "لا يوجد طلاب في هذه الفرقة"
                    : "لا توجد نتائج للبحث"}
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredStudents.map((s) => (
                    <StudentRow
                      key={s._id}
                      student={s}
                      checked={selected.has(s._id)}
                      onToggle={toggleStudent}
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentStep(1);
                    setFetchEnabled(false);
                    setAutoSelected(false);
                  }}
                >
                  <ArrowRight className="ml-2 h-4 w-4" />
                  رجوع
                </Button>
                <Button
                  disabled={selected.size === 0 || promoteStudents.isPending}
                  onClick={() => setConfirmOpen(true)}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  ترقية {selected.size} طالب
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 3 — Result ── */}
      {currentStep === 3 && result && (
        <div className="space-y-4">
          <Alert className="border-emerald-300 bg-emerald-500/5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-700">تمت العملية بنجاح</AlertTitle>
            <AlertDescription className="text-emerald-600">
              تم ترقية {result.promoted.length} طالب
              {result.graduated.length > 0 && ` وتخرج ${result.graduated.length} طالب`}
            </AlertDescription>
          </Alert>

          {/* Promoted */}
          {result.promoted.length > 0 && (
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                الطلاب الذين تمت ترقيتهم ({result.promoted.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.promoted.map((s) => (
                  <div key={s._id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-muted/40">
                    <span>{s.name.first} {s.name.last}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      فرقة {s.fromLevel} → فرقة {s.toLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graduated */}
          {result.graduated.length > 0 && (
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-amber-600" />
                الطلاب المتخرجون ({result.graduated.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.graduated.map((s) => (
                  <div key={s._id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-muted/40">
                    <span>{s.name.first} {s.name.last}</span>
                    <Badge variant="outline" className="text-xs">تخرج</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed */}
          {result.failed.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>طلاب فشلت ترقيتهم ({result.failed.length})</AlertTitle>
              <AlertDescription>
                {result.failed.map((s) => (
                  <div key={s._id} className="text-xs">{s.studentId}: {s.error}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => navigate("/students")}>
              العودة لقائمة الطلاب
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(1);
                setLevel("");
                setSpecialization("");
                setFetchEnabled(false);
                setAutoSelected(false);
                setResult(null);
                setSelected(new Set());
              }}
            >
              ترقية فرقة أخرى
            </Button>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد ترقية الطلاب</DialogTitle>
            <DialogDescription className="space-y-2 mt-2">
              <div className="grid grid-cols-3 gap-2 text-center my-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                  <div className="text-lg font-bold text-emerald-600">{willPromoteCount}</div>
                  <div className="text-xs text-muted-foreground">سيُرقَّى</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                  <div className="text-lg font-bold text-amber-600">{willGraduateCount}</div>
                  <div className="text-xs text-muted-foreground">سيتخرج</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold">{willRepeatCount}</div>
                  <div className="text-xs text-muted-foreground">يعيد السنة</div>
                </div>
              </div>
              <p className="text-sm">
                هذا الإجراء <strong>لا يمكن التراجع عنه</strong>. هل أنت متأكد؟
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button
              onClick={handleConfirm}
              disabled={promoteStudents.isPending}
              className="flex-1"
            >
              {promoteStudents.isPending ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الترقية...</>
              ) : (
                <><ArrowLeft className="ml-2 h-4 w-4" /> نعم، تأكيد الترقية</>
              )}
            </Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
