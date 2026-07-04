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
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("الفصل الدراسي الأول");
  const [sectionsCount, setSectionsCount] = useState<number>(2);

  const selectedSpecializationObj = specializations?.find((d: any) => d._id === selectedCollegeId);
  
  const availableLevels = selectedSpecializationObj?.levels || [];
  const selectedLevelObj = availableLevels.find((lvl: any) => lvl.level === parseInt(selectedLevel));
  const availableDepartments = selectedLevelObj?.hasDepartments ? (selectedSpecializationObj?.departments || []) : [];

  // Fetch schedule with selected filters
  // Only run the query when the minimum required filters are selected
  // We need at least التخصص (specialization id) AND الفرقة (level), and department if applicable
  const filtersReady = !!selectedCollegeId && !!selectedLevel && (
    availableDepartments.length === 0 || 
    !!selectedDepartment
  );
  const { data: scheduleData, isLoading: scheduleLoading, refetch } = useWeekSchedule(
    {
      specialization: selectedCollegeId || undefined,
      department: selectedDepartment || undefined,
      level: selectedLevel ? parseInt(selectedLevel) : undefined,
      semester: selectedSemester || undefined,
      section: undefined, // Fetched all, we split them on client row-by-row
    },
    { enabled: filtersReady }
  );

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
  const watchLectureType = form.watch("lectureType");

  // Auto-set section to "all" if lectureType is "lecture"
  useEffect(() => {
    if (watchLectureType === "lecture") {
      form.setValue("section", "all");
    }
  }, [watchLectureType, form]);

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

  // Filter courses to only those matching the selected college (specialization) and level
  // This ensures adding a lecture always links it to the correct group
  const filteredCoursesForForm = courses.filter((c: any) => {
    const specId = typeof c.specialization === "object" ? c.specialization?._id : c.specialization;
    const matchesSpec = !selectedCollegeId || specId === selectedCollegeId;
    const matchesLevel = !selectedLevel || c.level === parseInt(selectedLevel);
    const matchesSemester =
      !selectedSemester ||
      (Array.isArray(c.semester)
        ? c.semester.includes(selectedSemester)
        : c.semester === selectedSemester);
    
    let matchesDept = true;
    if (selectedDepartment) {
      if (c.departments && c.departments.length > 0) {
        matchesDept = c.departments.includes(selectedDepartment);
      }
    }
    
    return matchesSpec && matchesLevel && matchesSemester && matchesDept;
  });
  // Fall back to all courses ONLY if no filters are active at all
  const coursesForForm = (!selectedCollegeId && !selectedLevel) ? courses : filteredCoursesForForm;


  // Reset filter chains on change
  const handleCollegeChange = (value: string) => {
    setSelectedCollegeId(value);
    setSelectedDepartment(""); // reset department when college changes
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    setSelectedDepartment(""); // reset department when level changes
  };

  // Sync sectionsCount with DB when specialization/level change
  useEffect(() => {
    if (selectedLevelObj) {
      setSectionsCount(selectedLevelObj.sectionsCount || 2);
    } else {
      setSectionsCount(2); // default
    }
  }, [selectedLevelObj]);

  const handleOpenSectionsDialog = () => {
    if (selectedLevelObj) {
      setTempSectionsCount(sectionsCount);
      setIsSectionsDialogOpen(true);
    }
  };

  const handleSaveSectionsCount = async () => {
    if (!selectedSpecializationObj || !selectedLevelObj) return;
    setIsSavingSections(true);
    try {
      const updatedLevels = (selectedSpecializationObj.levels || []).map((lvl: any) => {
        if (lvl.level === selectedLevelObj.level) {
          return { ...lvl, sectionsCount: tempSectionsCount };
        }
        return lvl;
      });

      await updateSpecializationMutation.mutateAsync({
        id: selectedSpecializationObj._id,
        data: {
          name: selectedSpecializationObj.name,
          code: selectedSpecializationObj.code,
          levels: updatedLevels,
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
    const ampm = hour >= 12 ? "PM" : "AM";
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

  // Open "Add Lecture" dialog with slot values pre-filled
  const handleCellClick = (dayOfWeek: string, startTime: string, endTime: string, sectionVal: string, pIdx: number) => {
    setIsEditing(false);
    setEditingId(null);

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
    setIsDialogOpen(true);
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
        semester: selectedSemester,
        // Include level so the lecture is returned when filtering by level
        ...(selectedLevel ? { level: parseInt(selectedLevel) } : {}),
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
    setSelectedDepartment("");
    setSelectedCollegeId("");
    setSelectedLevel("");
    setSelectedSemester("الفصل الدراسي الأول");
  };

  const isLoading = coursesLoading || hallsLoading || scheduleLoading;
  const hasLectures = scheduleData && Object.values(scheduleData).some((dayLectures: any) => dayLectures.length > 0);

  // Generate Table Rows dynamically
  const renderDayRows = (dayValue: string, dayLabel: string) => {
    if (!scheduleData) return null;
    let dayLectures = scheduleData[dayValue] || [];



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
        (!selectedCollegeId || specId === selectedCollegeId) &&
        (!selectedLevel || c.level === parseInt(selectedLevel)) &&
        (!selectedSemester ||
          (Array.isArray(c.semester)
            ? c.semester.includes(selectedSemester)
            : c.semester === selectedSemester))
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

      const lecSec = (lecture.lectureType || lecture.type) === "lecture" ? "all" : (lecture.section || "all");

      if (lecSec === "all") {
        // Occupies all rows
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
        // Occupies one or more rows (comma-separated e.g. "1,2")
        const lecSecs = lecSec.split(",").map((s: string) => s.trim());
        
        // Find indices in the sections array
        const sIndices = lecSecs
          .map((s: string) => sections.indexOf(s))
          .filter((idx: number) => idx !== -1)
          .sort((a: number, b: number) => a - b);

        if (sIndices.length > 0) {
          // Check if indices are contiguous
          let isContiguous = true;
          for (let i = 1; i < sIndices.length; i++) {
            if (sIndices[i] !== sIndices[i - 1] + 1) {
              isContiguous = false;
              break;
            }
          }

          if (isContiguous) {
            // Render as a single merged cell with rowSpan
            const firstSIdx = sIndices[0];
            const rowSpan = sIndices.length;
            
            for (let i = 0; i < sIndices.length; i++) {
              const sIdx = sIndices[i];
              for (let p = startIdx; p <= endIdx; p++) {
                if (sIdx === firstSIdx && p === startIdx) {
                  matrix[sIdx][p] = { ...lecture, rowSpan, colSpan: span };
                } else {
                  matrix[sIdx][p] = "skipped";
                }
              }
            }
          } else {
            // Non-contiguous: render separate cells in each row
            sIndices.forEach((sIdx: number) => {
              for (let p = startIdx; p <= endIdx; p++) {
                if (p === startIdx) {
                  matrix[sIdx][p] = { ...lecture, rowSpan: 1, colSpan: span };
                } else {
                  matrix[sIdx][p] = "skipped";
                }
              }
            });
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

                {/* Lecture Time */}
                <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100/60 dark:bg-slate-900/40 px-1 py-0.5 rounded mt-1 inline-block" dir="ltr">
                  {formatTime12h(cell.startTime)} - {formatTime12h(cell.endTime)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* College filter (الكلية) */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Building className="h-3.5 w-3.5" /> الكلية
              </label>
              <Select dir="rtl" value={selectedCollegeId} onValueChange={handleCollegeChange}>
                <SelectTrigger className="rounded-xl w-full">
                  <SelectValue placeholder="اختر الكلية" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {(specializations || []).map((spec: any) => (
                    <SelectItem key={spec._id} value={spec._id}>
                      {spec.name}
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
              <Select dir="rtl" value={selectedLevel} onValueChange={handleLevelChange}>
                <SelectTrigger className="rounded-xl w-full">
                  <SelectValue placeholder="اختر الفرقة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {availableLevels.map((lvl: any) => (
                    <SelectItem key={lvl.level.toString()} value={lvl.level.toString()}>
                      {lvl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department filter (التخصص) */}
            {availableDepartments.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> التخصص
                </label>
                <Select
                  dir="rtl"
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger className="rounded-xl w-full">
                    <SelectValue placeholder="اختر التخصص" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {availableDepartments.map((dept: string) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Semester filter */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> الفصل الدراسي
              </label>
              <Select dir="rtl" value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="rounded-xl w-full">
                  <SelectValue placeholder="اختر الفصل الدراسي" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="الفصل الدراسي الأول">الفصل الدراسي الأول</SelectItem>
                  <SelectItem value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              {selectedCollegeId && selectedLevel && (
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
      ) : !filtersReady ? (
        // Show placeholder until all required filters are selected
        <div className="text-center py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl mt-4 border border-slate-200 dark:border-slate-800">
          <CalendarClock className="h-16 w-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">يرجى استكمال تحديد البيانات</h3>
          <p className="text-slate-500 mt-2">اختر الكلية، الفرقة، والتخصص (إن وُجد) لعرض الجدول</p>
        </div>
      ) : (
        <>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl p-4 text-xs font-semibold leading-relaxed flex items-start gap-3 no-print mb-4" dir="rtl">
            <span className="text-lg">💡</span>
            <div>
              <strong>نظام الجدولة المفتوح نشط:</strong> يمكنك جدولة المحاضرات في أي وقت وأي يوم دراسي (من السبت إلى الخميس). للمحاضرات ذات التوقيت المخصص (خارج الفترات القياسية)، سيتم عرض وقتها الفعلي وتسكينها في أقرب فترة على الشبكة.
            </div>
          </div>
          
          <Card className="shadow-none border-none rounded-none overflow-hidden print-full-width p-0 bg-transparent">
          {/* Official Printable Header */}
          <div className="hidden print:flex flex-row justify-between items-start border-b-2 border-slate-800 pb-4 p-6 bg-white text-black" dir="rtl">
            <div className="text-right space-y-1 text-[11px] font-bold">
              <div>وزارة التعليم العالي</div>
              <div>{selectedSpecializationObj?.name || "المعهد العالي للهندسة ببلبيس"}</div>
              {selectedDepartment && <div>قسم {selectedDepartment}</div>}
              <div>المنشأ بقرار وزاري رقم 1855</div>
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-[16px] font-extrabold">
                جدول محاضرات الفرقة {levelNames[selectedLevel] || "..."}
              </h2>
              <p className="text-[12px] font-semibold">
                للعام الجامعي 2026/2025 - {selectedSemester}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-black p-1.5 rounded-xl w-16 h-16 text-[9px] text-center font-bold">
              شعار
              <br />
              المعهد
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            {/* Always render the table grid — show empty-state row inside tbody if no lectures */}
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
                {hasLectures ? (
                  dayNames.map((day) => renderDayRows(day.value, day.label))
                ) : (
                  // Empty state inside the table so the header is always visible
                  <tr>
                    <td
                      colSpan={2 + PERIODS.length}
                      className="py-20 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                          لا توجد محاضرات مجدولة لهذه الفرقة حتى الآن
                        </p>
                        <Button
                          size="sm"
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
                          إضافة أول محاضرة
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        </>
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
        <DialogContent className="max-w-xl text-right p-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm" dir="rtl">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-5 border-b border-slate-200 dark:border-slate-800">
            <DialogHeader className="p-0">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                <BookOpen className="h-5 w-5 text-primary" />
                {isEditing ? "تعديل تفاصيل المحاضرة" : "إضافة محاضرة جديدة للجدول"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 font-medium">
                قم بإدخال تفاصيل المادة، القاعة، وتوقيتها الأكاديمي لحفظها في الجداول الرسمية.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5 max-h-[75vh] overflow-y-auto">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md p-3 text-xs font-semibold leading-relaxed mb-4 flex items-start gap-2" dir="rtl">
                <span className="text-sm mt-0.5">💡</span>
                <div>
                  <strong>جدولة مفتوحة:</strong> يمكنك إضافة المحاضرة في أي وقت وأي يوم دراسي (من السبت إلى الخميس). إذا كنت تريد وقتاً غير قياسي، اختر <strong>"توقيت يدوي مخصص"</strong> من خيارات نظام توقيت الحصة بالأسفل.
                </div>
              </div>
              
              {/* SECTION 1: Academic Information */}
              <div className="space-y-3.5 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-md bg-slate-50/30 dark:bg-slate-900/5">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  البيانات الأكاديمية للمحاضرة
                </h3>
                
                {/* Course Selector */}
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="font-bold text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        المادة الدراسية
                      </FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-md w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors h-9">
                            <SelectValue placeholder="اختر المادة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          {coursesForForm.length === 0 ? (
                            <div className="py-3 px-4 text-center text-slate-400 text-xs">
                              لا توجد مواد لهذه الكلية والفرقة المختارة
                            </div>
                          ) : (
                            coursesForForm.map((c: any) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name} ({c.code})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Type selector */}
                  <FormField
                    control={form.control}
                    name="lectureType"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-bold text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          نوع الحصة
                        </FormLabel>
                        <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9">
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

                  {/* Week Pattern */}
                  <FormField
                    control={form.control}
                    name="weekType"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-bold text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <CalendarClock className="h-3.5 w-3.5 text-primary" />
                          تكرار الأسبوع
                        </FormLabel>
                        <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9">
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

                {/* Section Selector - conditional */}
                {watchLectureType !== "lecture" ? (
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => {
                      const isAll = field.value === "all";
                      const selectedSections = isAll ? [] : field.value.split(",").map(s => s.trim()).filter(Boolean);
                      
                      const handleCheckboxChange = (secVal: string, checked: boolean) => {
                        if (checked) {
                          const updated = [...selectedSections, secVal].sort();
                          field.onChange(updated.join(","));
                        } else {
                          const updated = selectedSections.filter(s => s !== secVal);
                          field.onChange(updated.length === 0 ? "all" : updated.join(","));
                        }
                      };

                      const handleTypeChange = (type: "all" | "specific") => {
                        if (type === "all") {
                          field.onChange("all");
                        } else {
                          field.onChange("1");
                        }
                      };

                      return (
                        <FormItem className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <FormLabel className="font-bold text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Grid3X3 className="h-3.5 w-3.5 text-primary" />
                            السكشن المستهدف (المجموعات)
                          </FormLabel>
                          
                          <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                              <input
                                type="radio"
                                name="sectionSelectType"
                                checked={isAll}
                                onChange={() => handleTypeChange("all")}
                                className="accent-primary h-3.5 w-3.5 cursor-pointer"
                              />
                              جميع المجموعات (الكل)
                            </label>
                            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                              <input
                                type="radio"
                                name="sectionSelectType"
                                checked={!isAll}
                                onChange={() => handleTypeChange("specific")}
                                className="accent-primary h-3.5 w-3.5 cursor-pointer"
                              />
                              مجموعات محددة (سكاشن)
                            </label>
                          </div>

                          {!isAll && (
                            <div className="grid grid-cols-4 gap-2 p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-md animate-in fade-in duration-200">
                              {Array.from({ length: sectionsCount }, (_, i) => (i + 1).toString()).map((sec) => {
                                const isChecked = selectedSections.includes(sec);
                                return (
                                  <label key={sec} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer p-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => handleCheckboxChange(sec, e.target.checked)}
                                      className="rounded accent-primary h-3.5 w-3.5 cursor-pointer"
                                    />
                                    سكشن {sec}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                ) : (
                  <div className="text-[11px] text-slate-500 font-semibold bg-slate-100/50 dark:bg-slate-900/40 p-2 rounded-md border border-slate-200/50 dark:border-slate-800/50">
                    * بما أن الحصة "محاضرة"، فإنها مخصصة لجميع الطلاب والمجموعات (الكل) بشكل تلقائي.
                  </div>
                )}
              </div>

              {/* SECTION 2: Location and Day */}
              <div className="space-y-3.5 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-md bg-slate-50/30 dark:bg-slate-900/5">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  مكان وتوقيت الحصة الدراسي
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Hall Selector */}
                  <FormField
                    control={form.control}
                    name="hall"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-bold text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          القاعة الدراسية
                        </FormLabel>
                        <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9">
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
                      <FormItem className="space-y-1">
                        <FormLabel className="font-bold text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          اليوم
                        </FormLabel>
                        <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9">
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
              </div>

              {/* SECTION 3: Timing Selection Panels */}
              <div className="border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-md bg-slate-50/30 dark:bg-slate-900/5 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  تفاصيل توقيت المحاضرة
                </h3>

                <FormField
                  control={form.control}
                  name="timeType"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="font-bold text-[11px] text-slate-500">نظام توقيت الحصة</FormLabel>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-md h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
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
                  <div className="grid grid-cols-2 gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <FormField
                      control={form.control}
                      name="startPeriod"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">بداية من الفترة</FormLabel>
                          <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-md w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent dir="rtl">
                              {PERIODS.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  الفترة {p.id} ({formatTime12h(p.start)})
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
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">إلى الفترة</FormLabel>
                          <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-md w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent dir="rtl">
                              {PERIODS.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()} disabled={parseInt(watchStartPeriod || "1") > p.id}>
                                  الفترة {p.id} ({formatTime12h(p.end)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">وقت البدء</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} dir="ltr" className="rounded-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">وقت الانتهاء</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} dir="ltr" className="rounded-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-500 font-mono text-left bg-slate-100/50 dark:bg-slate-900/60 py-1.5 px-3 rounded-md border border-slate-200/40 dark:border-slate-800/40" dir="ltr">
                  Selected Duration: {form.watch("startTime")} - {form.watch("endTime")}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-md h-9 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-md h-9 text-xs font-bold px-5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3.5 w-3.5 ml-1.5 animate-spin" />}
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
