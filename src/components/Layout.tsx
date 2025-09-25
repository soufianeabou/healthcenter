import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  LayoutDashboard,
  Users,
  Pill,
  FileText,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'MEDECIN': return 'Médecin';
      case 'INFIRMIERE': return 'Infirmière';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MEDECIN': return 'bg-blue-100 text-blue-800';
      case 'INFIRMIERE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: 'Tableau de bord',
      path: '/dashboard',
      roles: ['ADMIN', 'MEDECIN', 'INFIRMIERE']
    },
    {
      key: '/patients',
      icon: <Users size={20} />,
      label: 'Patients',
      path: '/patients',
      roles: ['ADMIN', 'MEDECIN', 'INFIRMIERE']
    },
    {
      key: '/consultations',
      icon: <FileText size={20} />,
      label: 'Consultations',
      path: '/consultations',
      roles: ['ADMIN', 'MEDECIN', 'INFIRMIERE']
    },
    {
      key: '/medicines',
      icon: <Pill size={20} />,
      label: 'Médicaments',
      path: '/medicines',
      roles: ['ADMIN', 'MEDECIN', 'INFIRMIERE']
    },
    {
      key: '/personnel',
      icon: <UserCheck size={20} />,
      label: 'Personnel',
      path: '/personnel',
      roles: ['ADMIN']
    },
    {
      key: '/reports',
      icon: <BarChart3 size={20} />,
      label: 'Rapports',
      path: '/reports',
      roles: ['ADMIN', 'MEDECIN']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const userMenuItems = [
    {
      key: 'profile',
      icon: <Settings size={16} />,
      label: 'Mon Profil',
      path: '/profile'
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Déconnexion',
      onClick: logout
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AUI</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Health Center</h1>
            <p className="text-xs text-gray-500">Centre de Santé AUI</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user?.role || '')}`}>
              {getRoleDisplay(user?.role || '')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.key}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuVisible(true)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          {sidebarContent}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {filteredMenuItems.find(item => item.path === location.pathname)?.label || 'Tableau de bord'}
                </h2>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplay(user?.role || '')}
                    </p>
                  </div>
                  <div className="relative group">
                    <button className="p-1 rounded-md hover:bg-gray-100">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                      {userMenuItems.map((item) => (
                        <div key={item.key}>
                          {item.path ? (
                            <Link
                              to={item.path}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {item.icon}
                              {item.label}
                            </Link>
                          ) : (
                            <button
                              onClick={item.onClick}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {item.icon}
                              {item.label}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <main className="p-4">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuVisible && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuVisible(false)}></div>
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
