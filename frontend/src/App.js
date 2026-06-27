import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/Sidebar";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CreativesPage from "@/pages/CreativesPage";
import CreativeDetailPage from "@/pages/CreativeDetailPage";
import AIStudioPage from "@/pages/AIStudioPage";
import UploadPage from "@/pages/UploadPage";
import AlertsPage from "@/pages/AlertsPage";
import SettingsPage from "@/pages/SettingsPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#050A08] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/creatives" element={<ProtectedRoute><CreativesPage /></ProtectedRoute>} />
      <Route path="/creatives/:id" element={<ProtectedRoute><CreativeDetailPage /></ProtectedRoute>} />
      <Route path="/ai-studio" element={<ProtectedRoute><AIStudioPage /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={loading ? "/login" : (user ? "/dashboard" : "/login")} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}
