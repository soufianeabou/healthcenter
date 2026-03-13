import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserStatus } from '../types/roles';

interface User {
  id: number;
  nom: string;
  prenom: string;
  username: string;
  passwd: string | null;
  role: UserRole;
  specialite: string;
  telephone: string;
  email: string;
  status: UserStatus;
}

const PROD_APP_ORIGIN = 'https://hc.aui.ma';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

const getAuthBaseUrl = () => {
  const configuredBaseUrl = (import.meta as any).env?.VITE_AUTH_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (window.location.origin === PROD_APP_ORIGIN) {
    return window.location.origin;
  }

  return PROD_APP_ORIGIN;
};

const AUTH_BASE_URL = getAuthBaseUrl();
const DEV_LOGIN_ENABLED = LOCAL_HOSTNAMES.has(window.location.hostname);

const normalizeEmail = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase();

const EMAIL_DIRECTORY: Record<string, User> = {
  // SUPER ADMIN (frontend-only elevated role)
  's.aboulhamam@gmail.com': {
    id: 99,
    nom: 'Aboulhamam',
    prenom: 'Soufiane',
    username: 's.aboulhamam@gmail.com',
    passwd: null,
    role: UserRole.SUPER_ADMIN,
    specialite: 'Supervision',
    telephone: '0000000000',
    email: 's.aboulhamam@gmail.com',
    status: UserStatus.ACTIVE
  },
  // MEDECIN
  'm.aslaf@aui.ma': {
    id: 3,
    nom: 'Aslaf',
    prenom: 'Dr.Mounia',
    username: 'm.aslaf@aui.ma',
    passwd: null,
    role: UserRole.MEDECIN,
    specialite: 'Médecine Générale',
    telephone: '0000000000',
    email: 'm.aslaf@aui.ma',
    status: UserStatus.ACTIVE
  },
  'health.center.doctor@aui.ma': {
    id: 4,
    nom: 'Physician',
    prenom: 'Intern',
    username: 'Health.Center.Doctor@aui.ma',
    passwd: null,
    role: UserRole.MEDECIN,
    specialite: 'Interne',
    telephone: '0000000000',
    email: 'Health.Center.Doctor@aui.ma',
    status: UserStatus.ACTIVE
  },
  // ADMIN
  'a.guennoun@aui.ma': {
    id: 1,
    nom: 'Guennoun',
    prenom: 'Dr.Adnane',
    username: 'a.guennoun@aui.ma',
    passwd: null,
    role: UserRole.ADMIN,
    specialite: 'Administration',
    telephone: '0000000000',
    email: 'a.guennoun@aui.ma',
    status: UserStatus.ACTIVE
  },
  'h.harroud@aui.ma': {
    id: 10,
    nom: 'Harroud',
    prenom: 'Dr.Hamid',
    username: 'h.harroud@aui.ma',
    passwd: null,
    role: UserRole.ADMIN,
    specialite: 'Administration',
    telephone: '0000000000',
    email: 'h.harroud@aui.ma',
    status: UserStatus.ACTIVE
  },
  'a.bettahi@aui.ma': {
    id: 11,
    nom: 'Bettahi',
    prenom: 'Abdelkarim',
    username: 'a.bettahi@aui.ma',
    passwd: null,
    role: UserRole.ADMIN,
    specialite: 'Administration',
    telephone: '0000000000',
    email: 'a.bettahi@aui.ma',
    status: UserStatus.ACTIVE
  },
  'o.ghazal@aui.ma': {
    id: 5,
    nom: 'Ghazal',
    prenom: 'Oumaima',
    username: 'o.ghazal@aui.ma',
    passwd: null,
    role: UserRole.ADMIN,
    specialite: 'Administration',
    telephone: '0000000000',
    email: 'o.ghazal@aui.ma',
    status: UserStatus.ACTIVE
  },
  // INFIRMIER
  'm.ouakki@aui.ma': {
    id: 6,
    nom: 'Ouakki',
    prenom: 'Meriem',
    username: 'm.ouakki@aui.ma',
    passwd: null,
    role: UserRole.INFIRMIER,
    specialite: 'Soins Infirmiers',
    telephone: '0000000000',
    email: 'm.ouakki@aui.ma',
    status: UserStatus.ACTIVE
  },
  'f.elmajdoubi@aui.ma': {
    id: 2,
    nom: 'Elmajdoubi',
    prenom: 'Fatima',
    username: 'f.elmajdoubi@aui.ma',
    passwd: null,
    role: UserRole.INFIRMIER,
    specialite: 'Soins Infirmiers',
    telephone: '0000000000',
    email: 'f.elmajdoubi@aui.ma',
    status: UserStatus.ACTIVE
  },
  's.ghazal@aui.ma': {
    id: 7,
    nom: 'Ghazal',
    prenom: 'Siham',
    username: 's.ghazal@aui.ma',
    passwd: null,
    role: UserRole.INFIRMIER,
    specialite: 'Soins Infirmiers',
    telephone: '0000000000',
    email: 's.ghazal@aui.ma',
    status: UserStatus.ACTIVE
  },
  'g.makhsou@aui.ma': {
    id: 8,
    nom: 'Makhsou',
    prenom: 'Ghizlane',
    username: 'g.makhsou@aui.ma',
    passwd: null,
    role: UserRole.INFIRMIER,
    specialite: 'Soins Infirmiers',
    telephone: '0000000000',
    email: 'g.makhsou@aui.ma',
    status: UserStatus.ACTIVE
  },
  'health.center.nurse@aui.ma': {
    id: 9,
    nom: 'Nurses',
    prenom: 'Intern',
    username: 'Health.Center.Nurse@aui.ma',
    passwd: null,
    role: UserRole.INFIRMIER,
    specialite: 'Interne',
    telephone: '0000000000',
    email: 'Health.Center.Nurse@aui.ma',
    status: UserStatus.ACTIVE
  }
};

const resolveUserFromEmail = (email: string | null | undefined): User | null => {
  const key = normalizeEmail(email);
  if (!key) return null;
  return EMAIL_DIRECTORY[key] || null;
};

const clearStoredAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('authSource');
};

const persistUser = (nextUser: User, source: 'local' | 'sso') => {
  localStorage.setItem('user', JSON.stringify(nextUser));
  localStorage.setItem('authSource', source);
};

const extractEmailFromPrincipal = (principal: any): string | null => {
  if (!principal) return null;

  const root = principal as any;
  const nested = (root.principal as any) || root;
  const attrs = (nested.attributes as any) || nested;

  const candidates = [
    attrs.email,
    attrs.preferred_username,
    attrs.upn,
    attrs.userPrincipalName,
    root.name
  ];

  const emailCandidate = candidates
    .map((v) => (typeof v === 'string' ? v : ''))
    .find((v) => v.includes('@'));

  return emailCandidate || null;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOutlook: () => void;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isMedecin: () => boolean;
  isInfirmier: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAuthSource = localStorage.getItem('authSource');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    if (storedAuthSource === 'local') {
      setIsAuthLoading(false);
      return;
    }

    const tryHydrateFromSso = async () => {
      try {
        const response = await fetch(`${AUTH_BASE_URL}/auth/user`, {
          credentials: 'include'
        });
        if (!response.ok) {
          return;
        }
        const principal = await response.json();
        const email = extractEmailFromPrincipal(principal);
        if (!email) {
          if (!storedUser || storedAuthSource === 'sso') {
            clearStoredAuth();
            setUser(null);
            setIsAuthenticated(false);
          }
          return;
        }

        const mappedUser = resolveUserFromEmail(email);
        if (mappedUser) {
          setAuthError(null);
          setUser(mappedUser);
          setIsAuthenticated(true);
          persistUser(mappedUser, 'sso');
          return;
        }

        clearStoredAuth();
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(
          `The Outlook account ${email} is authenticated but is not authorized to access this application.`
        );
      } catch (error) {
        console.error('Failed to hydrate user from SSO:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void tryHydrateFromSso();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const uname = (username || '').trim();
      setAuthError(null);

      if (!DEV_LOGIN_ENABLED) {
        return {
          success: false,
          error: 'Production access is managed through Outlook. Please use "Sign in with Outlook".'
        };
      }

      if (uname === 'inf' && password === 'inf') {
        const mockNurseUser: User = {
          id: 3,
          nom: 'Nurse',
          prenom: 'Jane',
          username: 'inf',
          passwd: null,
          role: 'INFIRMIER' as UserRole,
          specialite: 'Soins Infirmiers',
          telephone: '0123456787',
          email: 'nurse.jane@aui.ma',
          status: 'ACTIF' as UserStatus
        };
        setUser(mockNurseUser);
        setIsAuthenticated(true);
        persistUser(mockNurseUser, 'local');
        return { success: true };
      }

      if (uname === 'admin' && password === 'admin') {
        const mockAdminUser: User = {
          id: 1,
          nom: 'Admin',
          prenom: 'User',
          username: 'admin',
          passwd: null,
          role: 'ADMIN' as UserRole,
          specialite: 'Administration',
          telephone: '0123456789',
          email: 'admin@aui.ma',
          status: 'ACTIF' as UserStatus
        };
        setUser(mockAdminUser);
        setIsAuthenticated(true);
        persistUser(mockAdminUser, 'local');
        return { success: true };
      }

      if (uname === 'med' && password === 'med') {
        const mockDoctorUser: User = {
          id: 2,
          nom: 'Dr. Smith',
          prenom: 'John',
          username: 'med',
          passwd: null,
          role: 'MEDECIN' as UserRole,
          specialite: 'Médecine Générale',
          telephone: '0123456788',
          email: 'dr.smith@aui.ma',
          status: 'ACTIF' as UserStatus
        };
        setUser(mockDoctorUser);
        setIsAuthenticated(true);
        persistUser(mockDoctorUser, 'local');
        return { success: true };
      }

      return { success: false, error: 'Invalid local development credentials.' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'An unexpected error occurred during login.' };
    }
  };

  const loginWithOutlook = () => {
    setAuthError(null);
    window.location.href = `${AUTH_BASE_URL}/oauth2/authorization/azure-dev`;
  };

  const logout = () => {
    const authSource = localStorage.getItem('authSource');
    clearStoredAuth();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    if (authSource === 'local') {
      return;
    }

    window.location.href = `${AUTH_BASE_URL}/logout`;
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    try {
      const payload: any = { ...user, ...userData };
      if (!userData.passwd || userData.passwd.toString().trim() === '') {
        delete payload.passwd;
      }
      const response = await fetch(`https://hc.aui.ma/api/consultations/personnels/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Profile update failed');
      }
      const updatedUser = await response.json();
      const userToStore = { ...updatedUser, passwd: null };
      setUser(userToStore);
      localStorage.setItem('user', JSON.stringify(userToStore));
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return roles.some(role => hasRole(role));
  };

  const isAdmin = () => {
    return hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  };

  const isMedecin = () => {
    return hasRole(UserRole.MEDECIN);
  };

  const isInfirmier = () => {
    return hasRole(UserRole.INFIRMIER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAuthLoading,
        authError,
        login,
        loginWithOutlook,
        logout,
        updateProfile,
        hasRole,
        hasAnyRole,
        isAdmin,
        isMedecin,
        isInfirmier
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
