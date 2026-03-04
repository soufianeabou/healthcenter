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

const AUTH_BASE_URL =
  (import.meta as any).env?.VITE_AUTH_BASE_URL || window.location.origin;

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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      return;
    }

    const tryHydrateFromSso = async () => {
      try {
        const base = AUTH_BASE_URL.replace(/\/$/, '');
        const response = await fetch(`${base}/auth/user`, {
          credentials: 'include'
        });
        if (!response.ok) {
          return;
        }
        const principal = await response.json();
        const email = extractEmailFromPrincipal(principal);
        const mappedUser = resolveUserFromEmail(email);
        if (mappedUser) {
          setUser(mappedUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(mappedUser));
        }
      } catch (error) {
        console.error('Failed to hydrate user from SSO:', error);
      }
    };

    void tryHydrateFromSso();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Minimal mock auth for non-SSO environments: support provided emails with shared password,
      // and keep existing demo users for local testing.
      const PASS = '@@Passw0rd@@';
      const uname = (username || '').trim();
      const ukey = normalizeEmail(uname);

      const emailUser = resolveUserFromEmail(ukey);
      if (emailUser && password === PASS) {
        const u = emailUser;
        setUser(u);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(u));
        return { success: true };
      }

      // Existing minimal mocks preserved
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
        localStorage.setItem('user', JSON.stringify(mockNurseUser));
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
        localStorage.setItem('user', JSON.stringify(mockAdminUser));
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
        localStorage.setItem('user', JSON.stringify(mockDoctorUser));
        return { success: true };
      }

      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'An unexpected error occurred during login.' };
    }
  };

  const loginWithOutlook = () => {
    const base = AUTH_BASE_URL.replace(/\/$/, '');
    window.location.href = `${base}/oauth2/authorization/azure-dev`;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
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
