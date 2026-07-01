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
   Auth endpoints (/auth/user, /oauth2/*, /logout) are served
   by Spring Security through nginx on port 443 — same origin.
   Never use port 8222 directly; that port is internal only.
───────────────────────────────────────────────────────── */
const getAuthBaseUrl = (): string => {
  const envOverride = (import.meta as any).env?.VITE_AUTH_BASE_URL?.trim();
  if (envOverride) return envOverride.replace(/\/$/, '');
  // Always use the same origin — nginx proxies /oauth2/* and /auth/* to the gateway
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
   SUPER_ADMIN override — these emails get the elevated role
   regardless of what is stored in the personnel table.
───────────────────────────────────────────────────────── */
const SUPER_ADMIN_EMAILS = new Set([
  's.aboulhamam@aui.ma',
  'a.bettahi@aui.ma',
  's.ghajdaoui@aui.ma',
  'h.harroud@aui.ma',
]);

/* Maps the backend ERole ordinal (or string) → frontend UserRole */
const toUserRole = (rawRole: unknown): UserRole => {
  if (typeof rawRole === 'number') {
    if (rawRole === 0) return UserRole.MEDECIN;
    if (rawRole === 1) return UserRole.INFIRMIER;
    if (rawRole === 2) return UserRole.ADMIN;
  }
  const s = String(rawRole ?? '').trim().toUpperCase();
  if (s === 'MEDECIN')   return UserRole.MEDECIN;
  if (s === 'INFIRMIER') return UserRole.INFIRMIER;
  if (s === 'ADMIN')     return UserRole.ADMIN;
  if (s === 'STUDENT')   return UserRole.STUDENT;
  if (s === 'DSA')       return UserRole.DSA;
  return UserRole.ADMIN; // safe fallback
};

/* Fetches the personnels table and matches by email.
   Returns a User object on match, null if not found or request fails. */
const resolveUserFromBackendPersonnel = async (email: string): Promise<User | null> => {
  try {
    const res = await fetch('https://hc.aui.ma/api/consultations/personnels', {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const personnels: any[] = await res.json();
    const match = personnels.find(
      (p) => normalizeEmail(p.email) === normalizeEmail(email),
    );
    if (!match) return null;
    return {
      id:         match.id,
      nom:        match.nom        ?? '',
      prenom:     match.prenom     ?? '',
      username:   match.email      ?? email,
      passwd:     null,
      role:       toUserRole(match.role),
      specialite: match.specialite ?? '',
      telephone:  match.telephone  ?? '',
      email:      match.email      ?? email,
      status:     UserStatus.ACTIVE,
    };
  } catch {
    return null;
  }
};

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
      // 12-second timeout — server responses legitimately take ~4s; give plenty of margin
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(`${AUTH_BASE_URL}/auth/user`, {
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timer);

        // 401 / 403 → no active SSO session; keep whatever localStorage has
        if (!response.ok) return;

        const contentType = response.headers.get('content-type') ?? '';

        // Gateway may redirect unauthenticated requests to an HTML login page
        if (!contentType.toLowerCase().includes('application/json')) {
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

        const normalizedEmail = normalizeEmail(email);

        // 1. SUPER_ADMIN override — elevated role regardless of DB entry
        if (SUPER_ADMIN_EMAILS.has(normalizedEmail)) {
          const personnelUser = await resolveUserFromBackendPersonnel(email);
          const superAdminUser: User = personnelUser
            ? { ...personnelUser, role: UserRole.SUPER_ADMIN }
            : {
                id: 0, nom: normalizedEmail.split('@')[0], prenom: '',
                username: email, passwd: null,
                role: UserRole.SUPER_ADMIN, specialite: 'Supervision',
                telephone: '', email, status: UserStatus.ACTIVE,
              };
          setAuthError(null);
          setUser(superAdminUser);
          setIsAuthenticated(true);
          persistUser(superAdminUser, 'sso');
          return;
        }

        // 2. Look up the user in the personnels table by email
        const personnelUser = await resolveUserFromBackendPersonnel(email);

        if (personnelUser) {
          setAuthError(null);
          setUser(personnelUser);
          setIsAuthenticated(true);
          persistUser(personnelUser, 'sso');
        } else {
          // Authenticated by Azure but not found in the personnel table
          clearStoredAuth();
          setUser(null);
          setIsAuthenticated(false);
          setAuthError(
            `Le compte ${email} est authentifié mais n'a pas de profil personnel dans le système. Contactez l'administrateur.`,
          );
        }
      } catch (err: any) {
        clearTimeout(timer);
        if (err?.name !== 'AbortError') {
          console.warn('[Auth] SSO hydration failed:', err);
        }
        // Network/timeout — silently keep whatever localStorage has
      } finally {
        setIsAuthLoading(false);
      }
    };

    void tryHydrateFromSso();
  }, []);

  /* ── 30-minute inactivity timeout ── */
  useEffect(() => {
    if (!isAuthenticated) return;

    const TIMEOUT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        clearStoredAuth();
        localStorage.removeItem(ACTIVE_ROLE_KEY);
        setActiveRoleState(null);
        setUser(null);
        setIsAuthenticated(false);
      }, TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated]);

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