import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardLayout from "@/components/DashboardLayout";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";
import TeacherDashboard from "@/pages/dashboards/TeacherDashboard";
import SchoolAdminDashboard from "@/pages/dashboards/SchoolAdminDashboard";
import SuperAdminDashboard from "@/pages/dashboards/SuperAdminDashboard";
import SubmitPage from "@/pages/SubmitPage";
import ReportPage from "@/pages/ReportPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function RoleDashboardRedirect() {
  const { user } = useAuth();
  switch (user?.role) {
    case "teacher": return <Navigate to="/dashboard/teacher" replace />;
    case "school_admin": return <Navigate to="/dashboard/school-admin" replace />;
    case "super_admin": return <Navigate to="/dashboard/super-admin" replace />;
    default: return <StudentDashboard />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/features" element={<LandingPage />} />
      <Route path="/pricing" element={<Navigate to="/" replace />} />
      <Route path="/about" element={<LandingPage />} />
      <Route path="/contact" element={<LandingPage />} />

      {/* Faculty routes */}
      <Route path="/dashboard" element={<ProtectedRoute><RoleDashboardRedirect /></ProtectedRoute>} />
      <Route path="/dashboard/submit" element={<ProtectedRoute><SubmitPage /></ProtectedRoute>} />
      <Route path="/dashboard/submissions" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/report/:id" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Teacher routes */}
      <Route path="/dashboard/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/*" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />

      {/* School admin routes */}
      <Route path="/dashboard/school-admin" element={<ProtectedRoute><SchoolAdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/school-admin/*" element={<ProtectedRoute><SchoolAdminDashboard /></ProtectedRoute>} />

      {/* Super admin routes */}
      <Route path="/dashboard/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/super-admin/*" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
