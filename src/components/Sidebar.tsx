import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  BarChart3, 
  UserCog,
  Stethoscope,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, getRoleDisplayName } from '../types/roles';
const Sidebar = () => {
  const { user, logout, isLoggingOut } = useAuth();

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Stethoscope,    label: 'Consultations',   path: '/consultations' },
    { icon: Users,          label: 'Patients',         path: '/patients' },
    { icon: Package,        label: 'Matériels',        path: '/materiels' },
    { icon: UserCog,        label: 'Personnel',        path: '/personnel' },
    { icon: Truck,          label: 'Fournisseurs',     path: '/suppliers' },
    { icon: BarChart3,      label: 'Rapports',         path: '/reports' },
  ];

  const medecinNavItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Stethoscope,    label: 'Consultations',    path: '/consultations' },
    { icon: Users,          label: 'Patients',          path: '/patients' },
    { icon: Package,        label: 'Matériels',         path: '/materiels-list' },
  ];

  const getNavItems = () => {
    if (!user) return [];
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return adminNavItems;
      case UserRole.MEDECIN:
      case UserRole.INFIRMIER:
        return medecinNavItems;
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
      <div className="p-4 border-b border-gray-200">
        <img src="/assets/hclogo.png" alt="Health Center" className="h-12 w-auto object-contain" />
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
            Mon Profil
          </NavLink>
        )}
      </nav>

      {/* Logout Button */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center px-4 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;