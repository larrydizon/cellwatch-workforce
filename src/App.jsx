import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Schedule from '@/pages/Schedule';
import Jobs from '@/pages/Jobs';
import TimeClock from '@/pages/TimeClock';
import Timesheets from '@/pages/Timesheets';
import Chat from '@/pages/Chat';
import Notifications from '@/pages/Notifications';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Leave from '@/pages/Leave';
import AdminOverview from '@/pages/AdminOverview';
import Forms from '@/pages/Forms';
import DailyReports from '@/pages/DailyReports';
import AuditLog from '@/pages/AuditLog';
import MyForms from '@/pages/MyForms';
import Onboarding from '@/pages/Onboarding';
import OwnerConsole from '@/pages/OwnerConsole';
import OwnerDashboard from '@/pages/OwnerDashboard';
import Billing from '@/pages/Billing';
import Payroll from '@/pages/Payroll';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">CW</span>
          </div>
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Only the "registered user" state is handled here. Login enforcement lives
  // in ProtectedRoute, which wraps every app route below.
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}
      >
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/owner-console" element={<OwnerConsole />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/time-clock" element={<TimeClock />} />
          <Route path="/timesheets" element={<Timesheets />} />
          <Route path="/daily-reports" element={<DailyReports />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/admin-overview" element={<AdminOverview />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/my-forms" element={<MyForms />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/payroll" element={<Payroll />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App