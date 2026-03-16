import React from 'react';
import { Shield, UserCog, Stethoscope, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';

interface RoleCard {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  light: string;
  border: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: UserRole.SUPER_ADMIN,
    label: 'Supervision',
    description: 'Accès complet — gestion de tout le système sans restriction.',
    icon: Shield,
    accent: '#003366',
    light: '#EEF2F8',
    border: '#B0C4DE',
  },
  {
    role: UserRole.ADMIN,
    label: 'Administrateur',
    description: 'Personnel, matériels, fournisseurs, rapports et consultations.',
    icon: UserCog,
    accent: '#6D28D9',
    light: '#F5F3FF',
    border: '#C4B5FD',
  },
  {
    role: UserRole.MEDECIN,
    label: 'Médecin',
    description: 'Consultations, dossiers patients et liste des matériels.',
    icon: Stethoscope,
    accent: '#0369A1',
    light: '#F0F9FF',
    border: '#BAE6FD',
  },
  {
    role: UserRole.INFIRMIER,
    label: 'Infirmier / Infirmière',
    description: 'Consultations, patients et matériels disponibles.',
    icon: Heart,
    accent: '#047857',
    light: '#F0FDF4',
    border: '#A7F3D0',
  },
];

/* Inline AUI crest matching the Login page */
const AuiCrest = () => (
  <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 4 L50 14 L50 32 C50 43 40 51 28 54 C16 51 6 43 6 32 L6 14 Z" fill="#003366" stroke="#C4A326" strokeWidth="1.5"/>
    <path d="M28 10 L45 18.5 L45 32 C45 40 37.5 47 28 50 C18.5 47 11 40 11 32 L11 18.5 Z" fill="#002244"/>
    <rect x="25.5" y="16" width="5" height="22" rx="0.5" fill="#C4A326"/>
    <rect x="18" y="24" width="20" height="5" rx="0.5" fill="#C4A326"/>
    <circle cx="28" cy="13" r="2" fill="#C4A326"/>
  </svg>
);

const RolePicker: React.FC = () => {
  const { user, setActiveRole, logout, isLoggingOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <AuiCrest />
        </div>
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
          Al Akhawayn University · Health Center
        </p>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
          Choisissez votre rôle
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Bienvenue, <span className="font-medium text-gray-700">{user?.prenom} {user?.nom}</span>.
          {' '}Sélectionnez le rôle avec lequel vous souhaitez travailler.
        </p>
      </div>

      {/* Role cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {ROLE_CARDS.map(({ role, label, description, icon: Icon, accent, light, border }) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className="text-left p-5 rounded-lg border-2 transition-all duration-150 focus:outline-none group"
            style={{
              background: light,
              borderColor: border,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = accent;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${accent}22`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = border;
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: accent }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5" style={{ fontSize: '0.95rem' }}>
                  {label}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </div>
            <div
              className="mt-3 text-xs font-semibold tracking-wide flex items-center gap-1"
              style={{ color: accent }}
            >
              Accéder →
            </div>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        disabled={isLoggingOut}
        className="mt-8 flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LogOut className="w-4 h-4" />
        {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
      </button>

      <p className="mt-4 text-xs text-gray-300">
        © {new Date().getFullYear()} Al Akhawayn University in Ifrane · ITS
      </p>
    </div>
  );
};

export default RolePicker;
