import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface CourseMatrixTableProps {
  courseMatrix: any;
  studentSearch: string;
  selectedCourse: string;
  onCellChange: (
    studentId: string,
    courseId: string,
    date: string,
    status: "present" | "absent" | "late" | "excused"
  ) => Promise<void>;
  onSwitchToStudent: (studentId: string, studentName: string) => void;
  selectedLectureDate?: string;
}

export function CourseMatrixTable({
  courseMatrix,
  studentSearch,
  selectedCourse,
  onCellChange,
  onSwitchToStudent,
  selectedLectureDate = "all",
}: CourseMatrixTableProps) {
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const handleCellChange = async (
    studentId: string,
    date: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    setUpdatingCell(`${studentId}-${date}`);
    try {
      await onCellChange(studentId, selectedCourse, date, status);
    } finally {
      setUpdatingCell(null);
    }
  };

  const searchStr = studentSearch.trim().toLowerCase();
  const filteredStudents = courseMatrix.students.filter((student: any) => {
    if (!searchStr) return true;
    return (
      student.name.toLowerCase().includes(searchStr) ||
      student.studentId.toLowerCase().includes(searchStr)
    );
  });

  const displayedDates = !selectedLectureDate || selectedLectureDate === "all"
    ? courseMatrix.dates
    : courseMatrix.dates.filter((d: string) => d === selectedLectureDate);

  if (filteredStudents.length === 0) {
    return (
      <Card className="border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-card">
        <CardContent className="text-center py-10 text-muted-foreground text-xs font-semibold">
          لا توجد نتائج مطابقة لبحث الطالب في هذه المادة.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden flex flex-col bg-card" dir="rtl">
      <CardHeader className="pb-2 pt-3 px-4 border-b flex flex-row items-center justify-between bg-muted/5">
        <div>
          <CardTitle className="text-md font-bold text-foreground">
            كشف غياب مادة: {courseMatrix.course.name} ({courseMatrix.course.code})
          </CardTitle>
          <CardDescription className="text-xs">
            اضغط على الرمز (ح/غ/مـ/عـ) داخل الجدول لتعديل حالة حضور الطالب مباشرة.
          </CardDescription>
        </div>
      </CardHeader>

      <ScrollArea className="w-full flex-1" dir="rtl">
        <Table className="border-collapse" dir="rtl">
          <TableHeader className="bg-muted/20">
            <TableRow className="border-b border-border/50">
              <TableHead className="text-right font-bold border-l w-[100px] min-w-[100px] max-w-[100px] bg-muted sticky right-0 z-20 py-2.5">
                كود الطالب
              </TableHead>
              <TableHead className="text-right font-bold border-l w-[160px] min-w-[160px] max-w-[160px] bg-muted sticky right-[100px] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] py-2.5">
                اسم الطالب
              </TableHead>

              {/* Dates columns */}
              {displayedDates.map((date: string) => {
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                });
                return (
                  <TableHead
                    key={date}
                    className="text-center font-bold border-l min-w-[70px] max-w-[80px] py-2"
                  >
                    <span className="block text-[9px] text-muted-foreground font-medium mb-0.5">
                      {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="font-mono text-xs">{formattedDate}</span>
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
            {filteredStudents.map((student: any) => {
              const rate = student.stats.rate;
              let badgeColor = "bg-green-50 text-green-700 border-green-200/60";
              if (rate < 50) {
                badgeColor = "bg-red-50 text-red-700 border-red-200/60";
              } else if (rate < 60) {
                badgeColor = "bg-amber-50 text-amber-700 border-amber-200/60";
              }

              return (
                <TableRow
                  key={student._id}
                  className="hover:bg-muted/5 border-b border-border/50 transition-colors"
                >
                  {/* Sticky ID */}
                  <TableCell className="font-mono font-bold text-xs border-l bg-background sticky right-0 z-10 w-[100px] min-w-[100px] max-w-[100px] py-1.5">
                    {student.studentId}
                  </TableCell>

                  {/* Sticky Name + Quick Action Button */}
                  <TableCell className="font-bold text-xs border-l bg-background sticky right-[100px] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] w-[160px] min-w-[160px] max-w-[160px] py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold text-foreground text-right" title={student.name}>
                        {student.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-muted p-0 text-muted-foreground hover:text-primary flex-shrink-0"
                        title="عرض كشف غياب الطالب الشامل لكافة المواد"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSwitchToStudent(student._id, student.name);
                        }}
                      >
                        <User className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Matrix Cells */}
                  {displayedDates.map((date: string) => {
                    const cell = student.attendance[date] || { status: "absent" };
                    const details = statusDetails[cell.status] || statusDetails.absent;
                    const cellKey = `${student._id}-${date}`;
                    const isUpdating = updatingCell === cellKey;

                    return (
                      <TableCell key={date} className="text-center p-0.5 border-l">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`w-full py-1.5 text-center rounded-md text-xs font-bold transition-all hover:bg-muted/40 cursor-pointer ${
                                isUpdating
                                  ? "opacity-50 cursor-wait"
                                  : details.color
                              }`}
                              disabled={isUpdating}
                            >
                              {details.shortcut}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[120px] rounded-md" align="end">
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(student._id, date, "present")
                              }
                            >
                              <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                              <span>حاضر (ح)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(student._id, date, "absent")
                              }
                            >
                              <XCircle className="ml-2 h-4 w-4 text-red-500" />
                              <span>غائب (غ)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(student._id, date, "late")
                              }
                            >
                              <Clock className="ml-2 h-4 w-4 text-amber-500" />
                              <span>متأخر (مـ)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-sm"
                              onClick={() =>
                                handleCellChange(student._id, date, "excused")
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
                    {student.stats.present}
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs border-r text-red-500 bg-muted/5 w-[55px] py-1.5">
                    {student.stats.absent}
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
