import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import { LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/dashboard";
import { SpecializationsPage } from "@/pages/specializations";
import { SpecializationFormPage } from "@/pages/specializations/form";
import { HallsPage } from "@/pages/halls";
import { HallFormPage } from "@/pages/halls/form";
import { AccessPointsPage } from "@/pages/halls/access-points";
import { StudentsPage } from "@/pages/students";
import { StudentFormPage } from "@/pages/students/form";
import { ImportStudentsPage } from "@/pages/students/import";
import { DeviceRequestsPage } from "@/pages/students/device-requests";
import { StudentDetailsPage } from "@/pages/students/details";
import { DoctorsPage } from "@/pages/doctors";
import { DoctorFormPage } from "@/pages/doctors/form";
import { CoursesPage } from "@/pages/courses";
import { CourseFormPage } from "@/pages/courses/form";
import { CourseStudentsPage } from "@/pages/courses/students";
import { LecturesPage } from "@/pages/lectures";
import { LectureFormPage } from "@/pages/lectures/form";
import { LectureSchedulePage } from "@/pages/lectures/schedule";
import { TodayLecturesPage } from "@/pages/lectures/today";
import { AttendancePage } from "@/pages/attendance";
import { LiveAttendancePage } from "@/pages/attendance/live";
import { AtRiskStudentsPage } from "@/pages/attendance/at-risk";
import { AttendanceReportsPage } from "@/pages/attendance/reports";
import { AttendanceMonitoringPage } from "@/pages/attendance/monitoring";
import { SettingsPage } from "@/pages/settings";
import { EmployeesPage, EmployeeFormPage } from "@/pages/employees";
import AIChatPage from "@/pages/ai-chat";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache time
      retry: 1, // Only retry once
      refetchOnWindowFocus: false, // Don't refetch on tab focus
    },
  },
});

function App() {
  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="vite-ui-theme"
      attribute="class"
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<DashboardPage />} />

                  {/* Super Admin Only Routes */}
                  <Route element={<ProtectedRoute allowedAdminRoles={["super_admin"]} />}>
                    {/* Specializations */}
                    <Route path="/specializations" element={<SpecializationsPage />} />
                    <Route path="/specializations/new" element={<SpecializationFormPage />} />
                    <Route path="/specializations/:id/edit" element={<SpecializationFormPage />} />

                    {/* Halls */}
                    <Route path="/halls" element={<HallsPage />} />
                    <Route path="/halls/new" element={<HallFormPage />} />
                    <Route path="/halls/:id/edit" element={<HallFormPage />} />
                    <Route path="/halls/access-points" element={<AccessPointsPage />} />

                    {/* Settings */}
                    <Route path="/settings" element={<SettingsPage />} />

                    {/* Employees */}
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/employees/new" element={<EmployeeFormPage />} />
                    <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
                  </Route>

                  {/* Student Affairs & Super Admin */}
                  <Route element={<ProtectedRoute allowedAdminRoles={["super_admin", "student_affairs"]} />}>
                    {/* Students */}
                    <Route path="/students" element={<StudentsPage />} />
                    <Route path="/students/new" element={<StudentFormPage />} />
                    <Route path="/students/:id" element={<StudentDetailsPage />} />
                    <Route path="/students/:id/edit" element={<StudentFormPage />} />
                    <Route path="/students/import" element={<ImportStudentsPage />} />
                    <Route path="/students/device-requests" element={<DeviceRequestsPage />} />
                  </Route>

                  {/* Shared across Dept Head, Student Affairs, Super Admin */}
                  <Route element={<ProtectedRoute allowedAdminRoles={["super_admin", "student_affairs", "head_of_department"]} />}>
                    {/* Doctors */}
                    <Route path="/doctors" element={<DoctorsPage />} />
                    <Route path="/doctors/new" element={<DoctorFormPage />} />
                    <Route path="/doctors/:id/edit" element={<DoctorFormPage />} />

                    {/* Courses */}
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/new" element={<CourseFormPage />} />
                    <Route path="/courses/:id/edit" element={<CourseFormPage />} />
                    <Route path="/courses/:id/students" element={<CourseStudentsPage />} />

                    {/* Lectures */}
                    <Route path="/lectures" element={<LecturesPage />} />
                    <Route path="/lectures/new" element={<LectureFormPage />} />
                    <Route path="/lectures/:id/edit" element={<LectureFormPage />} />
                    <Route path="/lectures/schedule" element={<LectureSchedulePage />} />
                    <Route path="/lectures/today" element={<TodayLecturesPage />} />
                  </Route>

                  {/* Attendance & Reports - Shared across all Admins */}
                  <Route element={<ProtectedRoute allowedAdminRoles={["super_admin", "dean", "student_affairs", "head_of_department"]} />}>
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/attendance/live" element={<LiveAttendancePage />} />
                    <Route path="/attendance/at-risk" element={<AtRiskStudentsPage />} />
                    <Route path="/attendance/reports" element={<AttendanceReportsPage />} />
                  </Route>

                  {/* Dean and Super Admin Only - Comprehensive Monitoring */}
                  <Route element={<ProtectedRoute allowedAdminRoles={["super_admin", "dean"]} />}>
                    <Route path="/attendance/monitoring" element={<AttendanceMonitoringPage />} />
                  </Route>

                  {/* AI Chat */}
                  <Route path="/ai-chat" element={<AIChatPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster position="top-right" />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
