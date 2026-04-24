import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useCourse,
  useCourseStudents,
  useEnrollStudents,
  useUnenrollStudents,
  useEnrollByLevel,
} from "@/hooks/use-courses";
import { useStudents } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Users,
  UserPlus,
  UserMinus,
  Search,
  GraduationCap,
  Layers,
  Loader2,
} from "lucide-react";

interface Student {
  _id: string;
  name: { first: string; last: string } | string;
  studentId: string;
  email: string;
  academicInfo?: {
    level?: number;
    department?: { _id: string; name: string } | string;
  };
}

export function CourseStudentsPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = id ?? "";

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: enrolledStudents, isLoading: studentsLoading } =
    useCourseStudents(courseId);

  const enrollMutation = useEnrollStudents();
  const unenrollMutation = useUnenrollStudents();
  const enrollByLevelMutation = useEnrollByLevel();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  // For the add dialog - fetch all students
  const { data: allStudentsData, isLoading: allStudentsLoading } = useStudents({
    limit: 200,
    search: searchQuery || undefined,
  });

  const allStudents: Student[] = allStudentsData?.data ?? [];
  const enrolled: Student[] = enrolledStudents ?? [];

  // Filter out already enrolled students
  const enrolledIds = new Set(enrolled.map((s: Student) => s._id));
  const availableStudents = allStudents.filter(
    (s: Student) => !enrolledIds.has(s._id),
  );

  const getStudentName = (student: Student) => {
    if (typeof student.name === "object") {
      return `${student.name.first} ${student.name.last}`;
    }
    return student.name || "-";
  };

  const handleEnrollSelected = async () => {
    if (selectedStudents.length === 0) return;
    await enrollMutation.mutateAsync({
      id: courseId,
      studentIds: selectedStudents,
    });
    setSelectedStudents([]);
    setShowAddDialog(false);
  };

  const handleUnenroll = async (studentId: string) => {
    await unenrollMutation.mutateAsync({
      id: courseId,
      studentIds: [studentId],
    });
  };

  const handleEnrollByLevel = async () => {
    if (!selectedLevel) return;
    await enrollByLevelMutation.mutateAsync({
      id: courseId,
      level: parseInt(selectedLevel),
    });
    setShowLevelDialog(false);
    setSelectedLevel("");
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const isLoading = courseLoading || studentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/courses">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            طلاب مادة {course?.name || "..."}
          </h1>
          <p className="text-muted-foreground text-sm">
            كود المادة: {course?.code}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الطلاب المسجلين</p>
              <p className="text-2xl font-bold">{enrolled.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {/* Add Individual Students */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              إضافة طلاب
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                إضافة طلاب إلى المادة
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الرقم الأكاديمي..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Selected count */}
              {selectedStudents.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {selectedStudents.length} طالب محدد
                </Badge>
              )}

              {/* Students list */}
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                {allStudentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "لا توجد نتائج" : "كل الطلاب مسجلين بالفعل"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الرقم الأكاديمي</TableHead>
                        <TableHead>المستوى</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableStudents.map((student: Student) => (
                        <TableRow
                          key={student._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleStudent(student._id)}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedStudents.includes(student._id)}
                              onCheckedChange={() => toggleStudent(student._id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {getStudentName(student)}
                          </TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>
                            {student.academicInfo?.level || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Enroll button */}
              <Button
                className="w-full gap-2"
                disabled={
                  selectedStudents.length === 0 || enrollMutation.isPending
                }
                onClick={handleEnrollSelected}
              >
                {enrollMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                تسجيل {selectedStudents.length} طالب
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enroll by Level */}
        <Dialog open={showLevelDialog} onOpenChange={setShowLevelDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Layers className="h-4 w-4" />
              تسجيل حسب المستوى
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                تسجيل جميع طلاب مستوى معين
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">المستوى 1</SelectItem>
                  <SelectItem value="2">المستوى 2</SelectItem>
                  <SelectItem value="3">المستوى 3</SelectItem>
                  <SelectItem value="4">المستوى 4</SelectItem>
                  <SelectItem value="5">المستوى 5</SelectItem>
                  <SelectItem value="6">المستوى 6</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="w-full gap-2"
                disabled={!selectedLevel || enrollByLevelMutation.isPending}
                onClick={handleEnrollByLevel}
              >
                {enrollByLevelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                تسجيل جميع طلاب المستوى {selectedLevel || "..."}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enrolled Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            الطلاب المسجلين ({enrolled.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrolled.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">لا يوجد طلاب مسجلين</p>
              <p className="text-sm">أضف طلاب باستخدام الأزرار أعلاه</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم الأكاديمي</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>المستوى</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolled.map((student: Student, index: number) => (
                    <TableRow key={student._id}>
                      <TableCell className="text-center text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getStudentName(student)}
                      </TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          المستوى {student.academicInfo?.level || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                          onClick={() => handleUnenroll(student._id)}
                          disabled={unenrollMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                          إلغاء التسجيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
