import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import Dashboard from './Dashboard';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import PatientManagement from './PatientManagement';
import ProtectedReport from './ProtectedReport';
import StaffManagement from './StaffManagement';
import StaffUserManagement from './StaffUserManagement';
import StaffDashboard from './StaffDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import UploadStatistics from './UploadStatistics';
import ActivityLogs from './ActivityLogs';
import StorageAnalytics from './StorageAnalytics';
import PublicSharedReport from './PublicSharedReport';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they try to access unauthorized page
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const { user, login } = useAuth();

  // Redirect logic based on role
  const getDashboardByRole = (role) => {
    switch (role) {
      case 'admin': return <Dashboard />;
      case 'doctor': return <DoctorDashboard />;
      case 'patient': return <PatientDashboard />;
      case 'receptionist': return <PatientManagement />;
      case 'technician': return <TechnicianDashboard />;
      case 'staff': return <StaffDashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />
        } />
        <Route path="/signup" element={
          user ? <Navigate to="/" replace /> : <SignupPage />
        } />

        {/* Main Dashboard Route - Intelligent Redirect */}
        <Route path="/" element={
          user ? getDashboardByRole(user.role) : <Navigate to="/login" replace />
        } />

        {/* Admin Routes (Protected) */}
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/admin/upload-statistics" element={
          <PrivateRoute allowedRoles={['admin']}>
            <UploadStatistics />
          </PrivateRoute>
        } />

        <Route path="/admin/activity-logs" element={
          <PrivateRoute allowedRoles={['admin']}>
            <ActivityLogs />
          </PrivateRoute>
        } />

        <Route path="/admin/storage-analytics" element={
          <PrivateRoute allowedRoles={['admin']}>
            <StorageAnalytics />
          </PrivateRoute>
        } />

        {/* Admin Staff Management Route - Admin Only */}
        <Route path="/admin/staff-management" element={
          <PrivateRoute allowedRoles={['admin']}>
            <StaffManagement />
          </PrivateRoute>
        } />

        {/* Staff Dashboard Route - Staff Members Only */}
        <Route path="/staff-dashboard" element={
          <PrivateRoute allowedRoles={['staff']}>
            <StaffDashboard />
          </PrivateRoute>
        } />

        <Route path="/staff-dashboard/management" element={
          <PrivateRoute allowedRoles={['staff']}>
            <StaffUserManagement />
          </PrivateRoute>
        } />

        {/* Protected Report Route */}
        <Route path="/report/:id" element={
          <PrivateRoute allowedRoles={['doctor', 'patient']}>
            <ProtectedReport />
          </PrivateRoute>
        } />

        {/* Public Shared External Report Route */}
        <Route path="/shared-report/:id" element={<PublicSharedReport />} />

      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
