import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  Package, 
  Users, 
  Truck, 
  BarChart3, 
  UserCog,
  GraduationCap,
  Heart,
  Stethoscope,
  User,
  LogOut,
  PackagePlus,
  PackageMinus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, getRoleDisplayName } from '../types/roles';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Pill, label: 'Medicines', path: '/medicines' },
    { icon: PackagePlus, label: 'Entrées de Stock', path: '/entry-stock' },
    { icon: PackageMinus, label: 'Sorties de Stock', path: '/exit-stock' },
    { icon: UserCog, label: 'Personnel', path: '/personnel' },
    { icon: Truck, label: 'Suppliers', path: '/suppliers' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  const medecinNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Stethoscope, label: 'Consultations', path: '/consultations' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Pill, label: 'Medicines List', path: '/medicines-list' },
  ];

  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case UserRole.ADMIN:
        return adminNavItems;
      case UserRole.MEDECIN:
        return medecinNavItems;
      case UserRole.INFIRMIER:
        return medecinNavItems; // Nurses see same as doctors
      default:
        return adminNavItems;
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">AUI Health</h1>
            <p className="text-sm text-gray-500">Center</p>
          </div>
        </div>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">{getRoleDisplayName(user.role)}</p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200 ${
                isActive ? 'bg-green-50 text-green-600 border-r-2 border-green-600' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
        
        {/* Profile Link */}
        {user && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200 ${
                isActive ? 'bg-green-50 text-green-600 border-r-2 border-green-600' : ''
              }`
            }
          >
            <User className="w-5 h-5 mr-3" />
            My Profile
          </NavLink>
        )}
      </nav>

      {/* Logout Button */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-lg"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;