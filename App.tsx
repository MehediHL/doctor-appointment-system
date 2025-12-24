import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Hospitals from './pages/Hospitals';
import Doctors from './pages/Doctors';
import BookAppointment from './pages/BookAppointment';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import { Role } from './types';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-10 text-center">Loading application...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="hospitals" element={<Hospitals />} />
        <Route path="hospital/:hospitalId/doctors" element={<Doctors />} />
        
        {/* Protected Routes */}
        <Route 
          path="book/:doctorId" 
          element={
            <ProtectedRoute allowedRoles={[Role.PATIENT]}>
              <BookAppointment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="patient-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[Role.PATIENT]}>
              <PatientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="doctor-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[Role.DOCTOR]}>
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}