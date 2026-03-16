import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Consultations from './pages/Consultations';
import Materiels from './pages/Materiels';

import EntryStock from './pages/EntryStock';
import ExitStock from './pages/ExitStock';
import Students from './pages/Students';
import Patients from './pages/Patients';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Personnel from './pages/Personnel';
import StudentPortal from './pages/StudentPortal';
import Profile from './pages/Profile';
import MaterielsList from './pages/MaterielsList';
import MaterielDetails from './pages/MaterielDetails';
import RolePicker from './pages/RolePicker';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types/roles';
import ConsultationDetails from './pages/ConsultationDetails';

function AppContent() {
  const { user, isAuthenticated, isAuthLoading, activeRole, effectiveRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-10 text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-600">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // SUPER_ADMIN must pick a role before entering the app
  if (user?.role === UserRole.SUPER_ADMIN && !activeRole) {
    return <RolePicker />;
  }

  const isAdmin = effectiveRole === UserRole.ADMIN || effectiveRole === UserRole.SUPER_ADMIN;
  const isMedecinOrNurse = effectiveRole === UserRole.MEDECIN || effectiveRole === UserRole.INFIRMIER;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}
      {/* Sidebar: drawer on mobile, static on desktop */}
      <aside
        className={`
          w-64 flex-shrink-0 flex flex-col bg-white shadow-lg
          fixed md:relative inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Shared Routes - Consultations, Patients, Materials List */}
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/consultations/:id" element={<ConsultationDetails />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/materiels-list" element={<MaterielsList />} />
            <Route path="/materiels/:id" element={<MaterielDetails />} />
            
            {/* Admin Only Routes */}
            {isAdmin && (
              <>
                <Route path="/materiels" element={<Materiels />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/personnel" element={<Personnel />} />
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
