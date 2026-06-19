import { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  User,
  Loader2,
  BookOpen,
  Sparkles,
  Layers,
  Grid3X3,
  CalendarClock,
  Printer,
  Filter,
  X,
  Trash2,
  Edit,
  Building,
  GraduationCap,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useCourses,
  useHalls,
  useDoctors,
  useCreateLecture,
  useUpdateLecture,
  useDeleteLecture,
  useWeekSchedule,
  useFaculties,
  useSpecializations,
  useUpdateSpecialization,
} from "@/hooks";
import type { Hall, Lecture } from "@/types";
import { toast } from "sonner";

const dayNames = [
  { value: "6", label: "السبت" },
  { value: "0", label: "الأحد" },
  { value: "1", label: "الاثنين" },
  { value: "2", label: "الثلاثاء" },
  { value: "3", label: "الأربعاء" },
  { value: "4", label: "الخميس" },
];

const levelNames: Record<string, string> = {
  "1": "الإعدادية",
  "2": "الأولى",
  "3": "الثانية",
  "4": "الثالثة",
  "5": "الرابعة",
};

// Standard 8 periods of 45 minutes from the uploaded design
const PERIODS = [
  { id: 1, label: "الأولى", start: "09:00", end: "09:45", display: "9:45 - 9:00" },
  { id: 2, label: "الثانية", start: "09:45", end: "10:30", display: "10:30 - 9:45" },
  { id: 3, label: "الثالثة", start: "10:30", end: "11:15", display: "11:15 - 10:30" },
  { id: 4, label: "الرابعة", start: "11:15", end: "12:00", display: "12:00 - 11:15" },
  { id: 5, label: "الخامسة", start: "12:00", end: "12:45", display: "12:45 - 12:00" },
  { id: 6, label: "السادسة", start: "12:45", end: "13:30", display: "1:30 - 12:45" },
  { id: 7, label: "السابعة", start: "13:30", end: "14:15", display: "2:15 - 1:30" },
  { id: 8, label: "الثامنة", start: "14:15", end: "15:00", display: "3:00 - 2:15" },
];

const formSchema = z.object({
  course: z.string().min(1, "المادة مطلوبة"),
  hall: z.string().min(1, "القاعة مطلوبة"),
  dayOfWeek: z.string().min(1, "اليوم مطلوب"),
  timeType: z.enum(["periods", "custom"]),
  startPeriod: z.string().optional(),
  endPeriod: z.string().optional(),
  startTime: z.string().min(1, "وقت البدء مطلوب"),
  endTime: z.string().min(1, "وقت الانتهاء مطلوب"),
  lectureType: z.enum(["lecture", "section", "lab"]),
  section: z.string(),
  weekType: z.enum(["all", "odd", "even"]),
});

type FormValues = z.infer<typeof formSchema>;

export function LectureSchedulePage() {
  // Query Hooks
  const { data: faculties } = useFaculties();
  const { data: specializations } = useSpecializations();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: hallsData, isLoading: hallsLoading } = useHalls();
  const { data: doctorsData } = useDoctors();

  const getDoctorName = (doctor: any, fallback = "غير محدد") => {
    if (!doctor) return fallback;
    if (doctor.name && typeof doctor.name === "object") {
      return `${doctor.name.first || ""} ${doctor.name.last || ""}`.trim() || fallback;
    }
    return doctor.name || fallback;
  };

  const getCourseColorClass = (courseId: string) => {
    if (!courseId) return "bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    
    // Curated premium color palettes
    const palettes = [
      "bg-blue-50/90 hover:bg-blue-100/70 text-blue-950 dark:bg-blue-950/35 dark:text-blue-200",
      "bg-emerald-50/90 hover:bg-emerald-100/70 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-200",
      "bg-rose-50/90 hover:bg-rose-100/70 text-rose-950 dark:bg-rose-950/35 dark:text-rose-200",
      "bg-amber-50/90 hover:bg-amber-100/70 text-amber-950 dark:bg-amber-950/35 dark:text-amber-200",
      "bg-indigo-50/90 hover:bg-indigo-100/70 text-indigo-950 dark:bg-indigo-950/35 dark:text-indigo-200",
      "bg-teal-50/90 hover:bg-teal-100/70 text-teal-950 dark:bg-teal-950/35 dark:text-teal-200",
      "bg-violet-50/90 hover:bg-violet-100/70 text-violet-950 dark:bg-violet-950/35 dark:text-violet-200",
      "bg-orange-50/90 hover:bg-orange-100/70 text-orange-950 dark:bg-orange-950/35 dark:text-orange-200",
      "bg-purple-50/90 hover:bg-purple-100/70 text-purple-950 dark:bg-purple-950/35 dark:text-purple-200",
      "bg-cyan-50/90 hover:bg-cyan-100/70 text-cyan-950 dark:bg-cyan-950/35 dark:text-cyan-200",
      "bg-sky-50/90 hover:bg-sky-100/70 text-sky-950 dark:bg-sky-950/35 dark:text-sky-200",
      "bg-lime-50/90 hover:bg-lime-100/70 text-lime-950 dark:bg-lime-950/35 dark:text-lime-200",
    ];

    // Simple hash function to map ID to index
    let hash = 0;
    for (let i = 0; i < courseId.length; i++) {
      hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  };

  // Filter States
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedWeekType, setSelectedWeekType] = useState<string>("all");
  const [sectionsCount, setSectionsCount] = useState<number>(2);
  const [inlineAddSlot, setInlineAddSlot] = useState<{ dayOfWeek: string; startTime: string; endTime: string; section: string; periodIdx: number } | null>(null);

  // Fetch schedule with selected filters
  const { data: scheduleData, isLoading: scheduleLoading, refetch } = useWeekSchedule({
    faculty: selectedFaculty || undefined,
    specialization: selectedSpecialization || undefined,
    level: selectedLevel ? parseInt(selectedLevel) : undefined,
    section: undefined, // Fetched all, we split them on client row-by-row
  });

  // Mutations
  const createMutation = useCreateLecture();
  const updateMutation = useUpdateLecture();
  const deleteMutation = useDeleteLecture();
  const updateSpecializationMutation = useUpdateSpecialization();

  // Modal / Detail States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isSectionsDialogOpen, setIsSectionsDialogOpen] = useState(false);
  const [tempSectionsCount, setTempSectionsCount] = useState<number>(2);
  const [isSavingSections, setIsSavingSections] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course: "",
      hall: "",
      dayOfWeek: "",
      timeType: "periods",
      startPeriod: "1",
      endPeriod: "2",
      startTime: "09:00",
      endTime: "10:30",
      lectureType: "lecture",
      section: "all",
      weekType: "all",
    },
  });

  const watchTimeType = form.watch("timeType");
  const watchStartPeriod = form.watch("startPeriod");
  const watchEndPeriod = form.watch("endPeriod");

  // Dynamic start/end time updates when standard periods are changed
  useEffect(() => {
    if (watchTimeType === "periods" && watchStartPeriod && watchEndPeriod) {
      const startIdx = parseInt(watchStartPeriod) - 1;
      const endIdx = parseInt(watchEndPeriod) - 1;
      if (startIdx <= endIdx && PERIODS[startIdx] && PERIODS[endIdx]) {
        form.setValue("startTime", PERIODS[startIdx].start);
        form.setValue("endTime", PERIODS[endIdx].end);
      }
    }
  }, [watchTimeType, watchStartPeriod, watchEndPeriod, form]);

  const courses = coursesData?.data || [];
  const halls: Hall[] = hallsData || [];

  // Reset filter chains on change
  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value);
    setSelectedSpecialization("");
  };

  const handleSpecializationChange = (value: string) => {
    setSelectedSpecialization(value);
  };

  // Filtered lists for inputs
  const filteredSpecializations = specializations?.filter((d) => !selectedFaculty || d.faculty === selectedFaculty) || [];
  const selectedSpecializationObj = specializations?.find((d) => d._id === selectedSpecialization);

  // Sync sectionsCount with DB when specialization/level change
  useEffect(() => {
    if (selectedSpecializationObj && selectedLevel) {
      const dbSections = selectedSpecializationObj.sectionsCount?.[selectedLevel];
      if (typeof dbSections === "number") {
        setSectionsCount(dbSections);
      } else {
        setSectionsCount(selectedLevel === "1" ? 6 : 3); // fallback
      }
    } else {
      setSectionsCount(selectedLevel === "1" ? 6 : 3); // default
    }
  }, [selectedSpecialization, selectedLevel, selectedSpecializationObj]);

  const handleOpenSectionsDialog = () => {
    if (selectedSpecializationObj) {
      const currentVal = selectedSpecializationObj.sectionsCount?.[selectedLevel] ?? sectionsCount;
      setTempSectionsCount(currentVal);
      setIsSectionsDialogOpen(true);
    }
  };

  const handleSaveSectionsCount = async () => {
    if (!selectedSpecializationObj || !selectedLevel) return;
    setIsSavingSections(true);
    try {
      const currentSectionsCount = selectedSpecializationObj.sectionsCount || {};
      const updatedSectionsCount = {
        ...currentSectionsCount,
        [selectedLevel]: tempSectionsCount,
      };

      await updateSpecializationMutation.mutateAsync({
        id: selectedSpecializationObj._id,
        data: {
          name: selectedSpecializationObj.name,
          code: selectedSpecializationObj.code,
          faculty: selectedSpecializationObj.faculty,
          sectionsCount: updatedSectionsCount,
        },
      });
      toast.success("تم تحديث عدد السكاشن بنجاح");
      setIsSectionsDialogOpen(false);
    } catch (err) {
      toast.error("حدث خطأ أثناء حفظ التغييرات");
    } finally {
      setIsSavingSections(false);
    }
  };

  // Convert "HH:mm" to 12-hour format "hh:mm AM/PM"
  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const ampm = hour >= 12 ? "م" : "ص";
    hour = hour % 12;
    hour = hour ? hour : 12;
    const minuteStrFormatted = minute.toString().padStart(2, "0");
    return `${hour}:${minuteStrFormatted} ${ampm}`;
  };

  // Convert standard period indexing for grid column spans
  const getPeriodSpan = (startTimeStr: string, endTimeStr: string) => {
    const parseMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const lectureStart = parseMin(startTimeStr);
    const lectureEnd = parseMin(endTimeStr);

    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < PERIODS.length; i++) {
      const periodStart = parseMin(PERIODS[i].start);
      const periodEnd = parseMin(PERIODS[i].end);

      if (startIdx === -1 && lectureStart >= periodStart && lectureStart < periodEnd) {
        startIdx = i;
      }
      if (lectureEnd > periodStart && lectureEnd <= periodEnd) {
        endIdx = i;
      }
    }

    if (startIdx === -1) {
      let minDiff = Infinity;
      for (let i = 0; i < PERIODS.length; i++) {
        const diff = Math.abs(parseMin(PERIODS[i].start) - lectureStart);
        if (diff < minDiff) {
          minDiff = diff;
          startIdx = i;
        }
      }
    }

    if (endIdx === -1) {
      let minDiff = Infinity;
      for (let i = 0; i < PERIODS.length; i++) {
        const diff = Math.abs(parseMin(PERIODS[i].end) - lectureEnd);
        if (diff < minDiff) {
          minDiff = diff;
          endIdx = i;
        }
      }
    }

    if (startIdx > endIdx) {
      const temp = startIdx;
      startIdx = endIdx;
      endIdx = temp;
    }

    return { startIdx, endIdx, span: endIdx - startIdx + 1 };
  };

  // Open "Add Lecture" dialog or activate inline edit with slot values pre-filled
  const handleCellClick = (dayOfWeek: string, startTime: string, endTime: string, sectionVal: string, pIdx: number) => {
    setIsEditing(false);
    setEditingId(null);
    setInlineAddSlot({
      dayOfWeek,
      startTime,
      endTime,
      section: sectionVal,
      periodIdx: pIdx,
    });

    form.reset({
      course: "",
      hall: "",
      dayOfWeek,
      timeType: "periods",
      startPeriod: (pIdx + 1).toString(),
      endPeriod: (pIdx + 1).toString(),
      startTime,
      endTime,
      lectureType: "lecture",
      section: sectionVal as any,
      weekType: "all",
    });
  };

  const onInlineSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        course: values.course,
        hall: values.hall,
        dayOfWeek: parseInt(values.dayOfWeek),
        startTime: values.startTime,
        endTime: values.endTime,
        lectureType: values.lectureType,
        section: values.section,
        weekPattern: values.weekType === "all" ? "weekly" : values.weekType,
      };

      await createMutation.mutateAsync(payload);
      toast.success("تم إضافة المحاضرة بنجاح");
      setInlineAddSlot(null);
      form.reset();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "فشل في حفظ المحاضرة");
    }
  };

  // Open Details Dialog
  const handleLectureDetails = (lecture: any) => {
    setSelectedLecture(lecture);
    setIsDetailDialogOpen(true);
  };

  // Open Edit Form Dialog
  const handleEditClick = () => {
    if (!selectedLecture) return;
    setIsDetailDialogOpen(false);
    setIsEditing(true);
    setEditingId(selectedLecture._id);

    const weekTypeVal = selectedLecture.weekPattern === "weekly" ? "all" : selectedLecture.weekPattern;

    form.reset({
      course: selectedLecture.course?._id || selectedLecture.course,
      hall: selectedLecture.hall?._id || selectedLecture.hall,
      dayOfWeek: selectedLecture.dayOfWeek.toString(),
      timeType: "custom",
      startTime: selectedLecture.startTime,
      endTime: selectedLecture.endTime,
      lectureType: selectedLecture.lectureType || "lecture",
      section: (selectedLecture.section || "all") as any,
      weekType: weekTypeVal as any,
    });

    // Attempt to match start/end period
    const { startIdx, endIdx } = getPeriodSpan(selectedLecture.startTime, selectedLecture.endTime);
    if (startIdx !== -1 && endIdx !== -1) {
      form.setValue("timeType", "periods");
      form.setValue("startPeriod", (startIdx + 1).toString());
      form.setValue("endPeriod", (endIdx + 1).toString());
    }

    setIsDialogOpen(true);
  };

  // Handle Delete Lecture
  const handleDeleteClick = async () => {
    if (!selectedLecture) return;
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه المحاضرة نهائياً؟")) {
      try {
        await deleteMutation.mutateAsync(selectedLecture._id);
        setIsDetailDialogOpen(false);
        setSelectedLecture(null);
        refetch();
      } catch (err: any) {
        toast.error("فشل في حذف المحاضرة");
      }
    }
  };

  // Handle Submit Form
  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        course: values.course,
        hall: values.hall,
        dayOfWeek: parseInt(values.dayOfWeek),
        startTime: values.startTime,
        endTime: values.endTime,
        lectureType: values.lectureType,
        section: values.section,
        weekPattern: values.weekType === "all" ? "weekly" : values.weekType,
      };

      if (isEditing && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: payload,
        });
        toast.success("تم تعديل المحاضرة بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إضافة المحاضرة بنجاح");
      }
      setIsDialogOpen(false);
      form.reset();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "فشل في حفظ المحاضرة");
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedFaculty("");
    setSelectedSpecialization("");
    setSelectedLevel("");
    setSelectedSpecialization("");
    setSelectedWeekType("all");
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = coursesLoading || hallsLoading || scheduleLoading;
  const hasLectures = scheduleData && Object.values(scheduleData).some((dayLectures: any) => dayLectures.length > 0);

  // Generate Table Rows dynamically
  const renderDayRows = (dayValue: string, dayLabel: string) => {
    if (!scheduleData) return null;
    let dayLectures = scheduleData[dayValue] || [];

    // Filter by week type on the client side if not handled by API
    if (selectedWeekType !== "all") {
      dayLectures = dayLectures.filter((l: any) => l.weekPattern === "weekly" || l.weekPattern === selectedWeekType);
    }

    const maxSectionInLectures = dayLectures
      .map((l: any) => parseInt(l.section))
      .filter((s: number) => !isNaN(s));
    const maxSec = maxSectionInLectures.length > 0 
      ? Math.max(...maxSectionInLectures, sectionsCount) 
      : sectionsCount;
    const sections = Array.from({ length: maxSec }, (_, i) => (i + 1).toString());

    const filteredCourses = courses.filter((c: any) => {
      const specId = typeof c.specialization === "object" ? c.specialization?._id : c.specialization;
      return (
        (!selectedSpecialization || specId === selectedSpecialization) &&
        (!selectedLevel || c.level === parseInt(selectedLevel))
      );
    });
    const displayCourses = filteredCourses.length > 0 ? filteredCourses : courses;

    // Matrix to map standard slots for rendering rowspans & colspans
    // matrix[sectionIndex][periodIndex] = lectureObj | null | 'skipped'
    const matrix: (any)[][] = Array(sections.length)
      .fill(null)
      .map(() => Array(PERIODS.length).fill(null));

    dayLectures.forEach((lecture: any) => {
      const { startIdx, endIdx, span } = getPeriodSpan(lecture.startTime, lecture.endTime);
      
      // If period boundaries map completely outside our 8 slots
      if (startIdx === -1 || endIdx === -1) return;

      const lecSec = lecture.section || "all";

      if (lecSec === "all") {
        // Occupies both rows
        for (let s = 0; s < sections.length; s++) {
          for (let p = startIdx; p <= endIdx; p++) {
            if (s === 0 && p === startIdx) {
              matrix[s][p] = { ...lecture, rowSpan: sections.length, colSpan: span };
            } else {
              matrix[s][p] = "skipped";
            }
          }
        }
      } else {
        // Occupies one row
        const sIdx = sections.indexOf(lecSec);
        if (sIdx !== -1) {
          for (let p = startIdx; p <= endIdx; p++) {
            if (p === startIdx) {
              matrix[sIdx][p] = { ...lecture, rowSpan: 1, colSpan: span };
            } else {
              matrix[sIdx][p] = "skipped";
            }
          }
        }
      }
    });

    return sections.map((section, sIdx) => (
      <tr key={`${dayValue}-${section}`} className="border-b border-slate-200 dark:border-slate-800 transition-colors group">
        {/* Render Day Name ONLY once on the first section's row */}
        {sIdx === 0 && (
          <td
            rowSpan={sections.length}
            className="p-3 text-center font-bold bg-slate-50 dark:bg-slate-900/60 border-l border-slate-200 dark:border-slate-800 align-middle w-24 text-[13px] text-slate-800 dark:text-slate-200 font-medium"
          >
            {dayLabel}
          </td>
        )}

        {/* Section labels column */}
        <td className="p-3 text-center font-bold bg-slate-50/50 dark:bg-slate-900/40 border-l border-slate-200 dark:border-slate-800 text-[12px] text-slate-600 dark:text-slate-400 w-12 align-middle">
          {section}
        </td>

        {/* Render 8 period cells */}
        {PERIODS.map((period, pIdx) => {
          const cell = matrix[sIdx][pIdx];

          if (cell === "skipped") return null;

          const isInlineActive =
            inlineAddSlot &&
            inlineAddSlot.dayOfWeek === dayValue &&
            inlineAddSlot.periodIdx === pIdx &&
            inlineAddSlot.section === section;

          if (isInlineActive) {
            return (
              <td
                key={pIdx}
                className="p-1 border-l border-slate-200 dark:border-slate-800 align-middle bg-amber-500/10 dark:bg-amber-500/5 min-w-[150px] no-print"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rounded-xl border border-amber-300 dark:border-amber-800/80 p-2 bg-white dark:bg-slate-950 space-y-1.5 text-right shadow-md animate-in fade-in zoom-in duration-200">
                  {/* Course select */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-amber-600 dark:text-amber-400 block pr-0.5">المادة</label>
                    <select
                      className="w-full text-[11px] font-bold p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-amber-500 text-right text-slate-800 dark:text-slate-200"
                      value={form.watch("course")}
                      onChange={(e) => form.setValue("course", e.target.value)}
                    >
                      <option value="">اختر المادة</option>
                      {displayCourses.map((c: any) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hall select */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-amber-600 dark:text-amber-400 block pr-0.5">القاعة</label>
                    <select
                      className="w-full text-[11px] p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-amber-500 text-right text-slate-800 dark:text-slate-200"
                      value={form.watch("hall")}
                      onChange={(e) => form.setValue("hall", e.target.value)}
                    >
                      <option value="">اختر القاعة</option>
                      {halls.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type select */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-amber-600 dark:text-amber-400 block pr-0.5">النوع</label>
                    <select
                      className="w-full text-[11px] p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-amber-500 text-right text-slate-800 dark:text-slate-200"
                      value={form.watch("lectureType")}
                      onChange={(e) => form.setValue("lectureType", e.target.value as any)}
                    >
                      <option value="lecture">محاضرة</option>
                      <option value="section">سكشن</option>
                      <option value="lab">معمل</option>
                    </select>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-900">
                    <button
                      type="button"
                      className="h-6 text-[10px] rounded-lg px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold"
                      onClick={() => setInlineAddSlot(null)}
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      className="h-6 text-[10px] font-bold rounded-lg px-3 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                      onClick={form.handleSubmit(onInlineSubmit)}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "جاري..." : "حفظ"}
                    </button>
                  </div>
                </div>
              </td>
            );
          }

          if (cell === null) {
            // Empty Cell, Click to Add
            return (
              <td
                key={pIdx}
                className="border-l border-slate-200 dark:border-slate-800 align-middle hover:bg-slate-50 dark:hover:bg-slate-900/25 cursor-pointer transition-colors p-3 text-center"
                onClick={() => handleCellClick(dayValue, period.start, period.end, section, pIdx)}
              >
                <div className="min-h-[40px] flex items-center justify-center no-print">
                  <Plus className="h-4 w-4 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 hover:text-primary transition-all duration-200" />
                </div>
              </td>
            );
          }

          // Render Lecture Cell (Flat style)
          const courseId = cell.course?._id || cell.course || "";
          const colorClass = getCourseColorClass(courseId);

          return (
            <td
              key={pIdx}
              rowSpan={cell.rowSpan}
              colSpan={cell.colSpan}
              className={`p-3 text-center align-middle cursor-pointer transition-all duration-200 border-l border-slate-200 dark:border-slate-800 select-none ${colorClass}`}
              onClick={() => handleLectureDetails(cell)}
            >
              <div className="space-y-1 text-center font-medium">
                {/* Course Name */}
                <div className="font-extrabold text-[12.5px] text-slate-800 dark:text-slate-100 leading-tight">
                  {cell.course?.name || "مادة غير معروفة"}
                </div>
                
                {/* Doctor Name */}
                <div className="text-[10.5px] text-slate-600 dark:text-slate-400 font-semibold">
                  {getDoctorName(cell.doctor, "أستاذ المادة")}
                </div>

                {/* Hall Name & Type */}
                <div className="text-[10.5px] text-slate-700 dark:text-slate-300 font-bold">
                  ({cell.hall?.name || "غير محدد"}) {cell.lectureType === "lecture" ? "" : cell.lectureType === "lab" ? "(معمل)" : "(سكشن)"}
                </div>
              </div>
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Print Helpers */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-grid-border {
            border-collapse: collapse !important;
            border: 2px solid black !important;
          }
          .print-grid-border th, .print-grid-border td {
            border: 1px solid black !important;
            color: black !important;
          }
        }
      `,
        }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <CalendarClock className="h-8 w-8 text-primary" />
            إدارة جداول المحاضرات
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            قم بجدولة المحاضرات والسكاشن، وعرض وتصفية الجداول حسب الكلية، القسم والفرقة الدراسية.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200">
            <Printer className="h-4 w-4 ml-2" />
            طباعة الجدول
          </Button>

          <Button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              form.reset({
                course: "",
                hall: "",
                dayOfWeek: "6",
                timeType: "periods",
                startPeriod: "1",
                endPeriod: "2",
                startTime: "09:00",
                endTime: "10:30",
                lectureType: "lecture",
                section: "all",
                weekType: "all",
              });
              setIsDialogOpen(true);
            }}
            className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة محاضرة جديدة
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-md border-slate-200/80 dark:border-slate-800/80 no-print">
        <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Filter className="h-4 w-4 text-primary" />
            أدوات التصفية والتحكم في الجداول
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Faculty filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Building className="h-3.5 w-3.5" /> الكلية
              </label>
              <Select value={selectedFaculty} onValueChange={handleFacultyChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر الكلية" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {faculties?.map((fac) => (
                    <SelectItem key={fac} value={fac}>
                      {fac}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Specialization filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> التخصص
              </label>
              <Select value={selectedSpecialization} onValueChange={handleSpecializationChange} disabled={!selectedFaculty}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={selectedFaculty ? "اختر التخصص" : "اختر الكلية أولاً"} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {filteredSpecializations.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> الفرقة الدراسية
              </label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر الفرقة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {Object.entries(levelNames).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Week type filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> الأسبوع الدراسي
              </label>
              <Select value={selectedWeekType} onValueChange={setSelectedWeekType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الأسابيع</SelectItem>
                  <SelectItem value="odd">الأسابيع الفردية فقط</SelectItem>
                  <SelectItem value="even">الأسابيع الزوجية فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              {selectedSpecialization && selectedLevel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSectionsDialog}
                  className="rounded-xl border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50/50 dark:border-indigo-900/60 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                >
                  <Grid3X3 className="h-4 w-4 ml-2 text-indigo-500" />
                  تعديل عدد السكاشن ({sectionsCount})
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-800">
              <X className="h-4 w-4 ml-1" />
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Timetable Display */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="shadow-none border-none rounded-none overflow-hidden print-full-width p-0 bg-transparent">
          {/* Official Printable Header */}
          <div className="hidden print:flex flex-row justify-between items-start border-b-2 border-slate-800 pb-4 p-6 bg-white text-black" dir="rtl">
            <div className="text-right space-y-1 text-[11px] font-bold">
              <div>وزارة التعليم العالي</div>
              <div>{selectedFaculty || "المعهد العالي للهندسة ببلبيس"}</div>
              {selectedSpecializationObj && <div>{selectedSpecializationObj.name}</div>}
              <div>المنشأ بقرار وزاري رقم 1855</div>
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-[16px] font-extrabold">
                جدول محاضرات الفرقة {levelNames[selectedLevel] || "..."}
              </h2>
              <p className="text-[12px] font-semibold">
                للعام الجامعي 2026/2025 - الفصل الدراسي الثاني
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-black p-1.5 rounded-xl w-16 h-16 text-[9px] text-center font-bold">
              شعار
              <br />
              المعهد
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            {hasLectures ? (
              <table className="w-full min-w-[900px] border-collapse print-grid-border text-slate-900 dark:text-slate-200">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 text-[12px] border-l border-slate-200 dark:border-slate-800 w-24">
                      اليوم
                    </th>
                    <th className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 text-[12px] border-l border-slate-200 dark:border-slate-800 w-12">
                      Sec
                    </th>
                    {PERIODS.map((period) => (
                      <th
                        key={period.id}
                        className="p-3 text-center border-l border-slate-200 dark:border-slate-800 w-32"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                            الفترة {period.id}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                            {period.display}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayNames.map((day) => renderDayRows(day.value, day.label))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20">
                <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-1.5">لا يوجد محاضرات مجدولة لهذا التصفية</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm max-w-md mx-auto mb-6">
                  يرجى تحديد الكلية، القسم والفرقة المطلوبة من الفلاتر في الأعلى، أو قم بإضافة محاضرة جديدة للبدء.
                </p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingId(null);
                    form.reset({
                      course: "",
                      hall: "",
                      dayOfWeek: "6",
                      timeType: "periods",
                      startPeriod: "1",
                      endPeriod: "2",
                      startTime: "09:00",
                      endTime: "10:30",
                      lectureType: "lecture",
                      section: "all",
                      weekType: "all",
                    });
                    setIsDialogOpen(true);
                  }}
                  className="rounded-xl no-print"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة محاضرة الآن
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sections Count Edit Dialog */}
      <Dialog open={isSectionsDialogOpen} onOpenChange={setIsSectionsDialogOpen}>
        <DialogContent className="max-w-md text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold border-b pb-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              تعديل عدد السكاشن للفرقة الدراسية
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              تعديل عدد السكاشن للفرقة {levelNames[selectedLevel]} في تخصص {selectedSpecializationObj?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                عدد السكاشن الجديد:
              </label>
              <Input
                type="number"
                min={1}
                max={8}
                value={tempSectionsCount}
                onChange={(e) => setTempSectionsCount(parseInt(e.target.value) || 1)}
                className="rounded-xl text-center font-bold text-lg"
              />
              <span className="text-[11px] text-muted-foreground block mt-1">
                القيمة المسموح بها من 1 إلى 8 سكاشن.
              </span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button onClick={handleSaveSectionsCount} disabled={isSavingSections} className="rounded-xl">
                {isSavingSections ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                حفظ التغييرات
              </Button>
              <Button variant="ghost" onClick={() => setIsSectionsDialogOpen(false)} className="rounded-xl">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Lecture Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold border-b pb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {isEditing ? "تعديل تفاصيل المحاضرة" : "إضافة محاضرة جديدة للجدول"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              أدخل تفاصيل المحاضرة والوقت والمكان لحفظها في قاعدة البيانات.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              {/* Course Selector */}
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs">المادة الدراسية</FormLabel>
                    <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        {courses.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Hall Selector */}
                <FormField
                  control={form.control}
                  name="hall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs">القاعة الدراسية</FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="اختر القاعة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          {halls.map((h) => (
                            <SelectItem key={h._id} value={h._id}>
                              {h.name} - {h.building}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Day Selector */}
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs">اليوم</FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="اختر اليوم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          {dayNames.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lecture Metadata */}
              <div className="grid grid-cols-3 gap-4">
                {/* Type selector */}
                <FormField
                  control={form.control}
                  name="lectureType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs">نوع الحصة</FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="lecture">محاضرة</SelectItem>
                          <SelectItem value="section">سكشن</SelectItem>
                          <SelectItem value="lab">معمل</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Section Selector */}
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs">السكشن (المجموعة)</FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="all">جميع المجموعات (الكل)</SelectItem>
                          <SelectItem value="1">سكشن 1</SelectItem>
                          <SelectItem value="2">سكشن 2</SelectItem>
                          <SelectItem value="3">سكشن 3</SelectItem>
                          <SelectItem value="4">سكشن 4</SelectItem>
                          <SelectItem value="5">سكشن 5</SelectItem>
                          <SelectItem value="6">سكشن 6</SelectItem>
                          <SelectItem value="7">سكشن 7</SelectItem>
                          <SelectItem value="8">سكشن 8</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Week Pattern */}
                <FormField
                  control={form.control}
                  name="weekType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs">تكرار الأسبوع</FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="all">كل الأسابيع</SelectItem>
                          <SelectItem value="odd">أسابيع فردية</SelectItem>
                          <SelectItem value="even">أسابيع زوجية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Timing Selection Panels */}
              <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
                <FormField
                  control={form.control}
                  name="timeType"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="font-bold text-xs text-slate-500">نظام توقيت الحصة</FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-8 bg-white dark:bg-slate-950">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="periods">فترات دراسية معيارية (45 دقيقة)</SelectItem>
                          <SelectItem value="custom">توقيت يدوي مخصص</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {watchTimeType === "periods" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">بداية من الفترة</FormLabel>
                          <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl bg-white dark:bg-slate-950">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent dir="rtl">
                              {PERIODS.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  الفترة {p.id} ({p.start})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">إلى الفترة</FormLabel>
                          <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl bg-white dark:bg-slate-950">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent dir="rtl">
                              {PERIODS.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()} disabled={parseInt(watchStartPeriod || "1") > p.id}>
                                  الفترة {p.id} ({p.end})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">وقت البدء</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} dir="ltr" className="rounded-xl bg-white dark:bg-slate-950" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">وقت الانتهاء</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} dir="ltr" className="rounded-xl bg-white dark:bg-slate-950" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono text-left" dir="ltr">
                  Selected Duration: {form.watch("startTime")} - {form.watch("endTime")}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl px-6 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 shadow"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  {isEditing ? "حفظ التغييرات" : "إضافة المحاضرة"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Lecture Details / Actions Modal */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold border-b pb-2 text-indigo-700 dark:text-indigo-400">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              تفاصيل الحصة الأكاديمية
            </DialogTitle>
          </DialogHeader>

          {selectedLecture && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">اسم المادة</span>
                <h3 className="text-lg font-extrabold text-foreground">{selectedLecture.course?.name || "مادة غير معروفة"}</h3>
                <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded font-mono text-slate-600 dark:text-slate-400 border">
                  كود: {selectedLecture.course?.code || "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-dashed border-slate-200 dark:border-slate-800 py-3.5 my-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                    <User className="h-3 w-3" /> المحاضر
                  </span>
                  <div className="text-sm font-semibold">{getDoctorName(selectedLecture.doctor, "غير محدد")}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                    <MapPin className="h-3 w-3" /> المكان / القاعة
                  </span>
                  <div className="text-sm font-semibold">
                    {selectedLecture.hall?.name || "غير محدد"} - {selectedLecture.hall?.building || ""}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-bold text-slate-400 block text-[10px]">موعد المحاضرة</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {dayNames.find((d) => d.value === selectedLecture.dayOfWeek.toString())?.label || "غير معروف"}
                  </span>
                  <span className="block font-mono text-[10px]" dir="ltr">
                    {formatTime12h(selectedLecture.startTime)} - {formatTime12h(selectedLecture.endTime)}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-slate-400 block text-[10px]">الاستهداف والمجموعات</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[9px] px-1.5 font-bold">
                      {selectedLecture.section === "all" ? "جميع السكاشن" : `سكشن ${selectedLecture.section}`}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1.5 font-semibold">
                      {selectedLecture.weekPattern === "weekly" ? "كل أسبوع" : selectedLecture.weekPattern === "odd" ? "أسابيع فردية" : "أسابيع زوجية"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button variant="outline" className="rounded-xl flex-1 text-slate-600" onClick={() => setIsDetailDialogOpen(false)}>
                  إغلاق
                </Button>
                <Button variant="secondary" className="rounded-xl flex-1 border-slate-200" onClick={handleEditClick}>
                  <Edit className="h-4 w-4 ml-1.5 text-indigo-600 dark:text-indigo-400" />
                  تعديل
                </Button>
                <Button variant="destructive" className="rounded-xl flex-1" onClick={handleDeleteClick}>
                  <Trash2 className="h-4 w-4 ml-1.5" />
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
