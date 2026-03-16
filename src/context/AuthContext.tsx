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
   Priority:
   1) VITE_AUTH_BASE_URL env var
   2) Production origin https://hc.aui.ma (fronted by nginx → gateway on 8222)
   3) Current origin (for local dev, when you override via env)
───────────────────────────────────────────────────────── */
const PROD_APP_ORIGIN = 'https://hc.aui.ma';

const getAuthBaseUrl = (): string => {
  const envOverride = (import.meta as any).env?.VITE_AUTH_BASE_URL?.trim();
  if (envOverride) {
    const url = envOverride.replace(/\/$/, '');
    console.log('[Auth] Using VITE_AUTH_BASE_URL:', url);
    return url;
  }

  const currentOrigin = window.location.origin;
  console.log('[Auth] Current origin:', currentOrigin);

  if (currentOrigin === PROD_APP_ORIGIN) {
    console.log('[Auth] Production detected, using app origin (nginx → gateway):', PROD_APP_ORIGIN);
    return PROD_APP_ORIGIN;
  }

  console.log('[Auth] Development mode, using current origin:', currentOrigin);
  return currentOrigin;
};

const AUTH_BASE_URL = getAuthBaseUrl();
console.log('[Auth] Final AUTH_BASE_URL:', AUTH_BASE_URL);

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const normalizeEmail = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase();

const clearStoredAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('authSource');
};

// Explicit-logout flag: when set, tryHydrateFromSso skips SSO re-authentication
// entirely so the user stays on the login page even if the Spring session is
// still alive. Cleared only when the user intentionally clicks "Sign in".
const LOGOUT_FLAG = 'hc_explicit_logout';
const setLoggedOutFlag   = () => localStorage.setItem(LOGOUT_FLAG, '1');
const clearLoggedOutFlag = () => localStorage.removeItem(LOGOUT_FLAG);
const wasExplicitLogout  = () => localStorage.getItem(LOGOUT_FLAG) === '1';

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

  // ── ADMIN (AUI Outlook) ────────────────────────────────
  's.aboulhamam@aui.ma': {
    id: 12, nom: 'Aboulhamam', prenom: 'Soufiane',
    username: 's.aboulhamam@aui.ma', passwd: null,
    role: UserRole.ADMIN, specialite: 'Administration',
    telephone: '0000000000', email: 's.aboulhamam@aui.ma',
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

/* ─────────────────────────────────────────────────────────
   AuthProvider
───────────────────────────────────────────────────────── */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,            setUser]            = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);
  const [isLoggingOut,    setIsLoggingOut]    = useState(false);
  const [authError,       setAuthError]       = useState<string | null>(null);

  /* ── On mount: pre-populate from storage, then always verify
        with the gateway so an Outlook redirect is always picked up. ── */
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    // Pre-populate immediately to avoid blank flash while the fetch runs
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        clearStoredAuth();
      }
    }

    const tryHydrateFromSso = async () => {
      // If the user explicitly clicked Logout, do NOT auto-re-authenticate via
      // the Spring session — even if the gateway still has an active session.
      // This prevents the login-loop on Brave / browsers that keep the Azure SSO alive.
      if (wasExplicitLogout()) {
        console.log('[Auth] Explicit logout flag found — skipping SSO hydration. Show login page.');
        setIsAuthLoading(false);
        return;
      }

      try {
        console.log('[Auth] Checking session at:', `${AUTH_BASE_URL}/auth/user`);
        const response = await fetch(`${AUTH_BASE_URL}/auth/user`, {
          credentials: 'include',
        });

        // 401 / 403 → no active SSO session; keep whatever localStorage has
        if (!response.ok) {
          console.log('[Auth] No active SSO session (status:', response.status, ')');
          return;
        }

        const contentType = response.headers.get('content-type') ?? '';

        // Guard: gateway may redirect unauthenticated requests to an HTML login page
        if (!contentType.toLowerCase().includes('application/json')) {
          const preview = (await response.text()).slice(0, 120);
          console.warn('[Auth] /auth/user did not return JSON. CT:', contentType, '| Preview:', preview);
          return;
        }

        const principal = await response.json();
        console.log('[Auth] Principal received:', principal);
        
        const email = extractEmailFromPrincipal(principal);
        console.log('[Auth] Email extracted:', email);

        if (!email) {
          console.warn('[Auth] No email found in principal');
          // Session exists but carries no email claim → clear only SSO sessions
          if (localStorage.getItem('authSource') === 'sso') {
            clearStoredAuth();
            setUser(null);
            setIsAuthenticated(false);
          }
          return;
        }

        const mappedUser = resolveUserFromEmail(email);

        if (mappedUser) {
          // ✅ Recognised email → grant access
          console.log('[Auth] ✅ Email authorized, role:', mappedUser.role);
          setAuthError(null);
          setUser(mappedUser);
          setIsAuthenticated(true);
          persistUser(mappedUser, 'sso');
        } else {
          // ❌ Azure authenticated but not in the whitelist
          console.warn('[Auth] ❌ Email not in whitelist:', email);
          clearStoredAuth();
          setUser(null);
          setIsAuthenticated(false);
          setAuthError(
            `Le compte Outlook ${email} est authentifié mais n'est pas autorisé à accéder à cette application.`,
          );
        }
      } catch (err) {
        // Network / gateway error: don't wipe a valid existing session
        console.error('[Auth] SSO hydration failed:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void tryHydrateFromSso();
  }, []);

  /* ── Redirect to Azure AD via the Spring Security gateway ── */
  const loginWithOutlook = () => {
    setAuthError(null);
    // Clear the explicit-logout flag so that after Outlook redirects back,
    // tryHydrateFromSso runs normally and logs the user in.
    clearLoggedOutFlag();
    const redirectUrl = `${AUTH_BASE_URL}/oauth2/authorization/azure-dev`;
    console.log('[Auth] Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
  };

  /* ── Logout ── */
  const logout = () => {
    if (isLoggingOut) return;
    console.log('[Auth] Logging out...');
    setIsLoggingOut(true);
    clearStoredAuth();

    // Mark explicit logout BEFORE navigating — tryHydrateFromSso will see this
    // flag on the next page load and skip SSO hydration, keeping the user on
    // the login page even if the Spring/Azure session is still alive.
    setLoggedOutFlag();

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    // Best-effort: try to invalidate the Spring session server-side.
    // Uses redirect:manual so we don't follow the Microsoft logout redirect chain.
    void fetch(`${AUTH_BASE_URL}/logout`, {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual',
    }).catch(() => {/* ignore — nginx may not proxy /logout */});

    window.location.href = '/';
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

  /* ── Role helpers ── */
  const hasRole     = (role: UserRole)    => user?.role === role;
  const hasAnyRole  = (roles: UserRole[]) => roles.some(hasRole);
  const isAdmin     = ()                  => hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const isMedecin   = ()                  => hasRole(UserRole.MEDECIN);
  const isInfirmier = ()                  => hasRole(UserRole.INFIRMIER);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAuthLoading,
        isLoggingOut,
        authError,
        loginWithOutlook,
        logout,
        updateProfile,
        hasRole,
        hasAnyRole,
        isAdmin,
        isMedecin,
        isInfirmier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};