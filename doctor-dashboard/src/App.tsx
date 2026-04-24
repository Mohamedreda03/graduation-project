import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Pages
import { LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/dashboard";
import AIChatPage from "@/pages/ai-chat";
import { MySchedulePage } from "@/pages/my-schedule";
import { TodaySchedulePage } from "@/pages/my-schedule/today";
import { MyCoursesPage } from "@/pages/courses";
import { CourseDetailsPage } from "@/pages/courses/details";
import { AttendancePage } from "@/pages/attendance";
import { AttendanceReportsPage } from "@/pages/attendance/reports";
import { AtRiskStudentsPage } from "@/pages/attendance/at-risk";
import { LiveAttendancePage } from "@/pages/attendance/live";

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
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />

                {/* My Schedule */}
                <Route path="/my-schedule" element={<MySchedulePage />} />
                <Route path="/my-schedule/today" element={<TodaySchedulePage />} />

                {/* Courses */}
                <Route path="/courses" element={<MyCoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailsPage />} />

                {/* Attendance */}
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/attendance/live/:hallId" element={<LiveAttendancePage />} />
                <Route path="/attendance/at-risk" element={<AtRiskStudentsPage />} />
                <Route path="/attendance/reports" element={<AttendanceReportsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
