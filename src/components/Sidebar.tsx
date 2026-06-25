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
  LogOut,
  RefreshCw,
  FileCheck,
  ClipboardList,
  ShieldCheck,
  PackagePlus,
  PackageMinus,
  Pill,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Supervision',
  [UserRole.ADMIN]:       'Administrateur',
  [UserRole.MEDECIN]:     'Médecin',
  [UserRole.INFIRMIER]:   'Infirmier(e)',
  [UserRole.STUDENT]:     'Étudiant(e)',
  [UserRole.DSA]:         'DSA',
};

const Sidebar = () => {
  const { user, effectiveRole, logout, isLoggingOut, resetActiveRole } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord',       path: '/dashboard' },
    { icon: Stethoscope,     label: 'Consultations',          path: '/consultations' },
    { icon: Users,           label: 'Patients',               path: '/patients' },
    { icon: Package,         label: 'Matériels',              path: '/materiels' },
    { icon: Pill,            label: 'Médicaments',            path: '/medicines/manage' },
    { icon: PackagePlus,     label: 'Entrées stock',          path: '/entry-stock' },
    { icon: PackageMinus,    label: 'Sorties stock',          path: '/exit-stock' },
    { icon: UserCog,         label: 'Personnel',              path: '/personnel' },
    { icon: Truck,           label: 'Fournisseurs',           path: '/suppliers' },
    { icon: BarChart3,       label: 'Rapports',               path: '/reports' },
    { icon: FileCheck,       label: 'Revue des certificats',  path: '/certificate-review' },
  ];

  const medecinNavItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord',       path: '/dashboard' },
    { icon: Stethoscope,     label: 'Consultations',          path: '/consultations' },
    { icon: Users,           label: 'Patients',               path: '/patients' },
    { icon: Package,         label: 'Matériels',              path: '/materiels-list' },
    { icon: FileCheck,       label: 'Revue des certificats',  path: '/certificate-review' },
  ];

  const infirmierNavItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Stethoscope,     label: 'Consultations',    path: '/consultations' },
    { icon: Users,           label: 'Patients',          path: '/patients' },
    { icon: Package,         label: 'Matériels',         path: '/materiels-list' },
  ];

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord',  path: '/dashboard' },
    { icon: ClipboardList,   label: 'Mes Certificats',  path: '/my-certificates' },
  ];

  const dsaNavItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord',    path: '/dashboard' },
    { icon: ShieldCheck,     label: 'Certificats DSA',    path: '/dsa-certificates' },
  ];

  const navItems = (() => {
    switch (effectiveRole) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return adminNavItems;
      case UserRole.MEDECIN:
        return medecinNavItems;
      case UserRole.INFIRMIER:
        return infirmierNavItems;
      case UserRole.STUDENT:
        return studentNavItems;
      case UserRole.DSA:
        return dsaNavItems;
      default:
        return adminNavItems;
    }
  })();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <img
          src="/assets/hclogo.png"
          alt="AUI Health Center"
          className="h-10 w-auto object-contain flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-800 leading-tight">AUI Health Center</p>
          <p className="text-xs text-gray-400 leading-tight">Portal</p>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#003366' }}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.prenom} {user.nom}</p>
              <p className="text-xs truncate" style={{ color: '#003366', fontWeight: 500 }}>
                {effectiveRole ? ROLE_LABELS[effectiveRole] : ''}
                {isSuperAdmin && (
                  <span className="ml-1 text-xs text-amber-600 font-semibold">(SA)</span>
                )}
              </p>
            </div>
          </div>
          {/* Switch role button for super admins */}
          {isSuperAdmin && (
            <button
              onClick={resetActiveRole}
              className="mt-2 w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded text-gray-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Changer de rôle
            </button>
          )}
        </div>
      )}

      <nav className="flex-1 mt-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 text-sm ${
                isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 font-medium' : ''
              }`
            }
          >
            <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {user && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 text-sm ${
                isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 font-medium' : ''
              }`
            }
          >
            <User className="w-4 h-4 mr-3 flex-shrink-0" />
            Mon Profil
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4 mr-3" />
            {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
