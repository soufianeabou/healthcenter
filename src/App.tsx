import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Consultations from './pages/Consultations';
import Medicines from './pages/Medicines';

import EntryStock from './pages/EntryStock';
import ExitStock from './pages/ExitStock';
import Students from './pages/Students';
import Patients from './pages/Patients';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Personnel from './pages/Personnel';
import StudentPortal from './pages/StudentPortal';
import Profile from './pages/Profile';
import MedicinesList from './pages/MedicinesList';
import MedicineDetails from './pages/MedicineDetails';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types/roles';
import ConsultationDetails from './pages/ConsultationDetails';

function AppContent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  const isAdmin = user?.role === UserRole.ADMIN;
  const isMedecin = user?.role === UserRole.MEDECIN || user?.role === UserRole.INFIRMIER;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            {isAdmin && (
              <>
                <Route path="/medicines" element={<Medicines />} />
                <Route path="/medicines/:id" element={<MedicineDetails />} />

                <Route path="/entry-stock" element={<EntryStock />} />
                <Route path="/exit-stock" element={<ExitStock />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/personnel" element={<Personnel />} />
              </>
            )}
            
            {/* Doctor/Nurse Routes */}
            {isMedecin && (
              <>
                <Route path="/consultations" element={<Consultations />} />
                <Route path="/consultations/:id" element={<ConsultationDetails />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/medicines-list" element={<MedicinesList />} />
                <Route path="/medicines/:id" element={<MedicineDetails />} />
              </>
            )}
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;