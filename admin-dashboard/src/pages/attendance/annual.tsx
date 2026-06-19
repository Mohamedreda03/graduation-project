import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Download, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AnnualAttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 text-right">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">السجل السنوي للحضور والغياب</h1>
          <p className="text-muted-foreground">عرض ملخص الغياب والحضور الشامل خلال العام الدراسي</p>
        </div>
        <Button variant="outline">
          <Download className="ml-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الطالب أو الاسم..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Mocked Data for Demonstration */}
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>أحمد محمد محمود</CardTitle>
              <CardDescription>رقم جامعي: 20230012 | الفرقة الثالثة</CardDescription>
            </div>
            <div className="mr-auto text-left">
              <Badge variant="outline" className="text-lg py-1 px-3">
                نسبة الحضور الكلية: 85%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-secondary/20 p-4 rounded-lg flex flex-col items-center justify-center border">
                <span className="text-sm text-muted-foreground mb-1">إجمالي المحاضرات</span>
                <span className="text-2xl font-bold">120</span>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg flex flex-col items-center justify-center border border-green-200 dark:border-green-900">
                <span className="text-sm text-muted-foreground mb-1 text-green-700 dark:text-green-400">مرات الحضور</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">102</span>
              </div>
              <div className="bg-red-500/10 p-4 rounded-lg flex flex-col items-center justify-center border border-red-200 dark:border-red-900">
                <span className="text-sm text-muted-foreground mb-1 text-red-700 dark:text-red-400">مرات الغياب</span>
                <span className="text-2xl font-bold text-red-700 dark:text-red-400">18</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold mb-3">تفصيل المواد</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <span>هندسة البرمجيات</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">حضور: 20/24</span>
                    <Badge variant="default">83%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <span>الذكاء الاصطناعي</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">حضور: 22/24</span>
                    <Badge variant="default">91%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <span>أمن المعلومات</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">حضور: 15/24</span>
                    <Badge variant="destructive">62%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
