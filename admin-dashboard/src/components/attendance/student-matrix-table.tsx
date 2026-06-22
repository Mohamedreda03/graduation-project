import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statusDetails: Record<
  string,
  { label: string; shortcut: string; color: string; badge: string }
> = {
  present: {
    label: "حاضر",
    shortcut: "ح",
    color: "text-green-600 font-bold",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  absent: {
    label: "غائب",
    shortcut: "غ",
    color: "text-red-500 font-bold",
    badge: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  late: {
    label: "متأخر",
    shortcut: "مـ",
    color: "text-amber-500 font-bold",
    badge: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  excused: {
    label: "عذر",
    shortcut: "عـ",
    color: "text-blue-500 font-bold",
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
};

interface StudentMatrixTableProps {
  studentMatrix: any;
  selectedCourse: string;
  onCellChange: (
    studentId: string,
    courseId: string,
    date: string,
    status: "present" | "absent" | "late" | "excused"
  ) => Promise<void>;
}

export function StudentMatrixTable({
  studentMatrix,
  selectedCourse,
  onCellChange,
}: StudentMatrixTableProps) {
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const handleCellChange = async (
    courseId: string,
    date: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    setUpdatingCell(`${courseId}-${date}`);
    try {
      await onCellChange(studentMatrix.student._id, courseId, date, status);
    } finally {
      setUpdatingCell(null);
    }
  };

  const filteredStudentCourses = studentMatrix.courses.filter((courseItem: any) => {
    if (selectedCourse === "all") return true;
    return courseItem.course._id === selectedCourse;
  });

  if (filteredStudentCourses.length === 0) {
    return (
      <Card className="border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card h-full flex items-center justify-center">
        <CardContent className="text-center py-16 text-muted-foreground text-xs font-semibold">
          لا توجد نتائج مطابقة للمادة المحددة في سجل الطالب.
        </CardContent>
      </Card>
    );
  }

  const maxLecturesCount = Math.max(
    1,
    ...filteredStudentCourses.map((c: any) => c.lectures.length)
  );

  const selectedCourseItem =
    selectedCourse !== "all" && filteredStudentCourses.length === 1
      ? filteredStudentCourses[0]
      : null;

  return (
    <Card className="rounded-lg border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-[480px] bg-card" dir="rtl">
      <CardHeader className="pb-2 pt-3 px-4 border-b bg-muted/5">
        <CardTitle className="text-md font-bold flex items-center gap-2 text-foreground">
          <GraduationCap className="h-4.5 w-4.5 text-primary" />
          <span>
            مجموع حضور غياب الطالب: {studentMatrix.student.name} (
            {studentMatrix.student.studentId})
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          سجل غياب الطالب عبر المواد المسجل بها بصفحة واحدة (المحاضرات مرتبة تسلسلياً).
        </CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1" dir="rtl">
        <Table className="border-collapse" dir="rtl">
          <TableHeader className="bg-muted/20">
            <TableRow className="border-b border-border/50">
              <TableHead className="text-right font-bold border-l w-[150px] min-w-[150px] max-w-[150px] bg-muted sticky right-0 z-20 py-2.5">
                المادة الدراسية
              </TableHead>
              <TableHead className="text-right font-bold border-l w-[140px] min-w-[140px] max-w-[140px] bg-muted sticky right-[150px] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] py-2.5">
                اسم الطالب
              </TableHead>
              <TableHead className="text-right font-bold border-l w-[90px] min-w-[90px] max-w-[90px] bg-muted sticky right-[290px] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] py-2.5">
                كود الطالب
              </TableHead>

              {/* Generate columns for max lectures */}
              {Array.from({ length: maxLecturesCount }).map((_, idx) => {
                const lecture = selectedCourseItem?.lectures[idx];
                let formattedDate = "";
                if (lecture) {
                  const dateObj = new Date(lecture.date);
                  formattedDate = dateObj.toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                  });
                }

                return (
                  <TableHead
                    key={idx}
                    className="text-center font-bold border-l min-w-[75px] max-w-[85px] py-1"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs">محاضرة {idx + 1}</span>
                      {formattedDate && (
                        <span className="text-[9px] text-muted-foreground font-mono font-medium mt-0.5">
                          {formattedDate}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}

              <TableHead className="text-center font-bold border-r bg-muted/10 w-[55px] py-2.5">
                حاضر
              </TableHead>
              <TableHead className="text-center font-bold border-r bg-muted/10 w-[55px] py-2.5">
                غائب
              </TableHead>
              <TableHead className="text-center font-bold border-r bg-muted/10 w-[75px] py-2.5">
                النسبة
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudentCourses.map((courseItem: any) => {
              const rate = courseItem.stats.rate;
              let badgeColor = "bg-green-50 text-green-700 border-green-200/60";
              if (rate < 50) {
                badgeColor = "bg-red-50 text-red-700 border-red-200/60";
              } else if (rate < 60) {
                badgeColor = "bg-amber-50 text-amber-700 border-amber-200/60";
              }

              return (
                <TableRow
                  key={courseItem.course._id}
                  className="hover:bg-muted/5 border-b border-border/50 transition-colors"
                >
                  {/* Sticky Course */}
                  <TableCell className="font-bold text-xs border-l bg-background sticky right-0 z-10 w-[150px] min-w-[150px] max-w-[150px] truncate py-1.5">
                    {courseItem.course.name}
                    <span className="block font-mono text-[9px] text-muted-foreground font-normal mt-0.5">
                      {courseItem.course.code}
                    </span>
                  </TableCell>

                  {/* Sticky Student Name */}
                  <TableCell className="font-bold text-xs border-l bg-background sticky right-[150px] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] w-[140px] min-w-[140px] max-w-[140px] truncate py-1.5">
                    {studentMatrix.student.name}
                  </TableCell>

                  {/* Sticky Student ID */}
                  <TableCell className="font-mono font-bold text-xs border-l bg-background sticky right-[290px] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] w-[90px] min-w-[90px] max-w-[90px] py-1.5">
                    {studentMatrix.student.studentId}
                  </TableCell>

                  {/* Matrix Cells */}
                  {Array.from({ length: maxLecturesCount }).map((_, idx) => {
                    const lecture = courseItem.lectures[idx];

                    if (!lecture) {
                      return (
                        <TableCell
                          key={idx}
                          className="text-center text-muted-foreground/30 border-l bg-muted/5 text-[10px] py-1.5"
                          title="لم تُعقد هذه المحاضرة بعد لهذه المادة"
                        >
                          —
                        </TableCell>
                      );
                    }

                    const details = statusDetails[lecture.status] || statusDetails.absent;
                    const dateObj = new Date(lecture.date);
                    const formattedDate = dateObj.toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                    });
                    const cellKey = `${courseItem.course._id}-${lecture.date}`;
                    const isUpdating = updatingCell === cellKey;

                    return (
                      <TableCell key={idx} className="text-center p-0.5 border-l">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`w-full py-1 text-center rounded-md text-xs font-bold transition-all hover:bg-muted/40 cursor-pointer flex flex-col gap-0.5 ${
                                isUpdating
                                  ? "opacity-50 cursor-wait"
                                  : details.color
                              }`}
                              disabled={isUpdating}
                            >
                              <span>{details.shortcut}</span>
                              <span className="text-[8px] font-mono text-muted-foreground font-medium">
                                {formattedDate}
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[120px] rounded-md" align="end">
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(
                                  courseItem.course._id,
                                  lecture.date,
                                  "present"
                                )
                              }
                            >
                              <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                              <span>حاضر (ح)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(
                                  courseItem.course._id,
                                  lecture.date,
                                  "absent"
                                )
                              }
                            >
                              <XCircle className="ml-2 h-4 w-4 text-red-500" />
                              <span>غائب (غ)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(
                                  courseItem.course._id,
                                  lecture.date,
                                  "late"
                                )
                              }
                            >
                              <Clock className="ml-2 h-4 w-4 text-amber-500" />
                              <span>متأخر (مـ)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(
                                  courseItem.course._id,
                                  lecture.date,
                                  "excused"
                                )
                              }
                            >
                              <AlertTriangle className="ml-2 h-4 w-4 text-blue-500" />
                              <span>غياب بعذر (عـ)</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    );
                  })}

                  {/* Totals */}
                  <TableCell className="text-center font-bold text-xs border-r text-green-600 bg-muted/5 w-[55px] py-1.5">
                    {courseItem.stats.present}
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs border-r text-red-500 bg-muted/5 w-[55px] py-1.5">
                    {courseItem.stats.absent}
                  </TableCell>
                  <TableCell className="text-center p-1 border-r bg-muted/5 w-[75px] py-1.5">
                    <Badge
                      variant="outline"
                      className={`font-bold text-[10px] px-1.5 py-0 rounded-md border ${badgeColor}`}
                    >
                      {rate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
