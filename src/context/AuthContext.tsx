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

/* ─────────────────────────────────────────────────────────
   Gateway URL resolution
   Priority: VITE_AUTH_BASE_URL env var  →  production origin
   port 8222  →  current origin (fallback for local testing)
───────────────────────────────────────────────────────── */
const PROD_APP_ORIGIN = 'https://hc.aui.ma';

const getAuthBaseUrl = (): string => {
  const envOverride = (import.meta as any).env?.VITE_AUTH_BASE_URL?.trim();
  if (envOverride) return envOverride.replace(/\/$/, '');
  if (window.location.origin === PROD_APP_ORIGIN) return 'https://hc.aui.ma:8222';
  return window.location.origin;
};

const AUTH_BASE_URL = getAuthBaseUrl();

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const normalizeEmail = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase();

const clearStoredAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('authSource');
};

const persistUser = (nextUser: User, source: 'sso') => {
  localStorage.setItem('user', JSON.stringify(nextUser));
  localStorage.setItem('authSource', source);
};

const extractEmailFromPrincipal = (principal: unknown): string | null => {
  if (!principal) return null;

  const root   = principal as any;
  const nested = (root.principal as any) ?? root;
  const attrs  = (nested.attributes as any) ?? nested;

  const candidates: string[] = [
    attrs.email,
    attrs.preferred_username,
    attrs.upn,
    attrs.userPrincipalName,
    root.name,
  ].map((v) => (typeof v === 'string' ? v : ''));

  return candidates.find((v) => v.includes('@')) ?? null;
};

/* ─────────────────────────────────────────────────────────
   EMAIL DIRECTORY  –  maps AUI Outlook emails → app user objects
   Add / remove entries here to grant / revoke access.
───────────────────────────────────────────────────────── */
const EMAIL_DIRECTORY: Record<string, User> = {
  // ── SUPER ADMIN (frontend-only elevated role) ──────────
  's.aboulhamam@gmail.com': {
    id: 99, nom: 'Aboulhamam', prenom: 'Soufiane',
    username: 's.aboulhamam@gmail.com', passwd: null,
    role: UserRole.SUPER_ADMIN, specialite: 'Supervision',
    telephone: '0000000000', email: 's.aboulhamam@gmail.com',
    status: UserStatus.ACTIVE,
  },

  // ── MEDECIN ────────────────────────────────────────────
  'm.aslaf@aui.ma': {
    id: 3, nom: 'Aslaf', prenom: 'Dr.Mounia',
    username: 'm.aslaf@aui.ma', passwd: null,
    role: UserRole.MEDECIN, specialite: 'Médecine Générale',
    telephone: '0000000000', email: 'm.aslaf@aui.ma',
    status: UserStatus.ACTIVE,
  },
  'health.center.doctor@aui.ma': {
    id: 4, nom: 'Physician', prenom: 'Intern',
    username: 'Health.Center.Doctor@aui.ma', passwd: null,
    role: UserRole.MEDECIN, specialite: 'Interne',
    telephone: '0000000000', email: 'Health.Center.Doctor@aui.ma',
    status: UserStatus.ACTIVE,
  },

  // ── ADMIN ──────────────────────────────────────────────
  'a.guennoun@aui.ma': {
    id: 1, nom: 'Guennoun', prenom: 'Dr.Adnane',
    username: 'a.guennoun@aui.ma', passwd: null,
    role: UserRole.ADMIN, specialite: 'Administration',
    telephone: '0000000000', email: 'a.guennoun@aui.ma',
    status: UserStatus.ACTIVE,
  },
  'h.harroud@aui.ma': {
    id: 10, nom: 'Harroud', prenom: 'Dr.Hamid',
    username: 'h.harroud@aui.ma', passwd: null,
    role: UserRole.ADMIN, specialite: 'Administration',
    telephone: '0000000000', email: 'h.harroud@aui.ma',
    status: UserStatus.ACTIVE,
  },
  'a.bettahi@aui.ma': {
    id: 11, nom: 'Bettahi', prenom: 'Abdelkarim',
    username: 'a.bettahi@aui.ma', passwd: null,
    role: UserRole.ADMIN, specialite: 'Administration',
    telephone: '0000000000', email: 'a.bettahi@aui.ma',
    status: UserStatus.ACTIVE,
  },
  'o.ghazal@aui.ma': {
    id: 5, nom: 'Ghazal', prenom: 'Oumaima',
    username: 'o.ghazal@aui.ma', passwd: null,
    role: UserRole.ADMIN, specialite: 'Administration',
    telephone: '0000000000', email: 'o.ghazal@aui.ma',
    status: UserStatus.ACTIVE,
  },

  // ── STUDENT ────────────────────────────────────────────
  'student.test@aui.ma': {
    id: 200, nom: 'Test', prenom: 'Student',
    username: 'student.test@aui.ma', passwd: null,
    role: UserRole.STUDENT, specialite: '',
    telephone: '', email: 'student.test@aui.ma',
    status: UserStatus.ACTIVE,
  },

  // ── DSA ────────────────────────────────────────────────
  'dsa.officer@aui.ma': {
    id: 201, nom: 'Officer', prenom: 'DSA',
    username: 'dsa.officer@aui.ma', passwd: null,
    role: UserRole.DSA, specialite: 'Dean of Student Affairs',
    telephone: '', email: 'dsa.officer@aui.ma',
    status: UserStatus.ACTIVE,
  },

  // ── INFIRMIER ──────────────────────────────────────────
  'm.ouakki@aui.ma': {
    id: 6, nom: 'Ouakki', prenom: 'Meriem',
    username: 'm.ouakki@aui.ma', passwd: null,
    role: UserRole.INFIRMIER, specialite: 'Soins Infirmiers',
    telephone: '0000000000', email: 'm.ouakki@aui.ma',
    status: UserStatus.ACTIVE,
  },
  'f.elmajdoubi@aui.ma': {
    id: 2, nom: 'Elmajdoubi', prenom: 'Fatima',
    username: 'f.elmajdoubi@aui.ma', passwd: null,
    role: UserRole.INFIRMIER, specialite: 'Soins Infirmiers',
    telephone: '0000000000', email: 'f.elmajdoubi@aui.ma',
    status: UserStatus.ACTIVE,
  },
  's.ghazal@aui.ma': {
    id: 7, nom: 'Ghazal', prenom: 'Siham',
    username: 's.ghazal@aui.ma', passwd: null,
    role: UserRole.INFIRMIER, specialite: 'Soins Infirmiers',
    telephone: '0000000000', email: 's.ghazal@aui.ma',
    status: UserStatus.ACTIVE,
  },
  'g.makhsou@aui.ma': {
    id: 8, nom: 'Makhsou', prenom: 'Ghizlane',
    username: 'g.makhsou@aui.ma', passwd: null,
    role: UserRole.INFIRMIER, specialite: 'Soins Infirmiers',
    telephone: '0000000000', email: 'g.makhsou@aui.ma',
    status: UserStatus.ACTIVE,
  },
  'health.center.nurse@aui.ma': {
    id: 9, nom: 'Nurses', prenom: 'Intern',
    username: 'Health.Center.Nurse@aui.ma', passwd: null,
    role: UserRole.INFIRMIER, specialite: 'Interne',
    telephone: '0000000000', email: 'Health.Center.Nurse@aui.ma',
    status: UserStatus.ACTIVE,
  },
};

const resolveUserFromEmail = (email: string | null | undefined): User | null =>
  EMAIL_DIRECTORY[normalizeEmail(email)] ?? null;

/* ─────────────────────────────────────────────────────────
   Context
───────────────────────────────────────────────────────── */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isLoggingOut: boolean;
  authError: string | null;
  activeRole: UserRole | null;
  effectiveRole: UserRole | null;
  loginWithOutlook: () => void;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
  resetActiveRole: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isMedecin: () => boolean;
  isInfirmier: () => boolean;
  isStudent: () => boolean;
  isDSA: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

/* ─────────────────────────────────────────────────────────
   AuthProvider
───────────────────────────────────────────────────────── */
const ACTIVE_ROLE_KEY = 'activeRole';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,            setUser]            = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);
  const [isLoggingOut,    setIsLoggingOut]    = useState(false);
  const [authError,       setAuthError]       = useState<string | null>(null);
  const [activeRole,      setActiveRoleState] = useState<UserRole | null>(
    () => (localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole | null)
  );

  /* effectiveRole: what the UI should treat as the current role.
     For SUPER_ADMIN it's whatever they picked; for others it's their own role. */
  const effectiveRole: UserRole | null =
    user?.role === UserRole.SUPER_ADMIN ? activeRole : (user?.role ?? null);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
  };

  const resetActiveRole = () => {
    setActiveRoleState(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  /* ── On mount: restore from localStorage, then verify SSO with a 5-second
        timeout so a stalled/unreachable gateway never blocks the app. ── */
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        clearStoredAuth();
      }
    }

    const tryHydrateFromSso = async () => {
      // 5-second timeout — if the gateway is unreachable we fall through to localStorage
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${AUTH_BASE_URL}/auth/user`, {
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timer);

        // 401 / 403 → no active SSO session; keep whatever localStorage has
        if (!response.ok) return;

        const contentType = response.headers.get('content-type') ?? '';

        if (!contentType.toLowerCase().includes('application/json')) {
          const preview = (await response.text()).slice(0, 120);
          console.warn('[Auth] /auth/user did not return JSON. CT:', contentType, '| Preview:', preview);
          return;
        }

        const principal = await response.json();
        const email     = extractEmailFromPrincipal(principal);

        if (!email) {
          if (localStorage.getItem('authSource') === 'sso') {
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
        } else {
          clearStoredAuth();
          setUser(null);
          setIsAuthenticated(false);
          setAuthError(
            `Le compte Outlook ${email} est authentifié mais n'est pas autorisé à accéder à cette application.`,
          );
        }
      } catch (err: any) {
        clearTimeout(timer);
        // Timeout or network error — silently fall through to whatever localStorage has
        if (err?.name !== 'AbortError') {
          console.warn('[Auth] SSO hydration failed:', err);
        }
      } finally {
        setIsAuthLoading(false);
      }
    };

    void tryHydrateFromSso();
  }, []);

  /* ── Redirect to Azure AD via the Spring Security gateway ── */
  const loginWithOutlook = () => {
    setAuthError(null);
    window.location.href = `${AUTH_BASE_URL}/oauth2/authorization/azure-dev`;
  };

  /* ── Logout: clear storage and redirect through gateway logout ── */
  const logout = () => {
    setIsLoggingOut(true);
    clearStoredAuth();
    resetActiveRole();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    window.location.href = `${AUTH_BASE_URL}/logout`;
  };

  /* ── Profile update ── */
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    try {
      const payload: any = { ...user, ...userData };
      if (!userData.passwd || String(userData.passwd).trim() === '') {
        delete payload.passwd;
      }
      const response = await fetch(
        `https://hc.aui.ma/api/consultations/personnels/${user.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error('Profile update failed');
      const updated     = await response.json();
      const userToStore = { ...updated, passwd: null };
      setUser(userToStore);
      localStorage.setItem('user', JSON.stringify(userToStore));
      return true;
    } catch (err) {
      console.error('[Auth] Profile update failed:', err);
      return false;
    }
  };

  /* ── Role helpers — check effectiveRole so SUPER_ADMIN simulation works ── */
  const hasRole     = (role: UserRole)    => effectiveRole === role;
  const hasAnyRole  = (roles: UserRole[]) => roles.some(r => effectiveRole === r);
  const isAdmin     = ()                  => effectiveRole === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN && !activeRole || effectiveRole === UserRole.SUPER_ADMIN;
  const isMedecin   = ()                  => effectiveRole === UserRole.MEDECIN;
  const isInfirmier = ()                  => effectiveRole === UserRole.INFIRMIER;
  const isStudent   = ()                  => effectiveRole === UserRole.STUDENT;
  const isDSA       = ()                  => effectiveRole === UserRole.DSA;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAuthLoading,
        isLoggingOut,
        authError,
        activeRole,
        effectiveRole,
        loginWithOutlook,
        logout,
        setActiveRole,
        resetActiveRole,
        updateProfile,
        hasRole,
        hasAnyRole,
        isAdmin,
        isMedecin,
        isInfirmier,
        isStudent,
        isDSA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};