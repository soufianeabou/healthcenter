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

interface PersonnelApiUser {
  id: number;
  nom: string;
  prenom: string;
  username?: string;
  passwd?: string | null;
  role?: string;
  specialite?: string;
  telephone?: string;
  email?: string;
  status?: string;
}

const SUPER_ADMIN_EMAILS = new Set([
  's.aboulhamam@aui.ma',
  'a.bettahi@aui.ma',
  's.ghajdaoui@aui.ma',
  'h.harroud@aui.ma',
]);

const toUserRole = (rawRole: string | null | undefined): UserRole => {
  const normalized = String(rawRole ?? '').trim().toUpperCase();
  if (normalized === UserRole.ADMIN) return UserRole.ADMIN;
  if (normalized === UserRole.MEDECIN) return UserRole.MEDECIN;
  if (normalized === UserRole.INFIRMIER) return UserRole.INFIRMIER;
  return UserRole.ADMIN;
};

const toUserStatus = (rawStatus: string | null | undefined): UserStatus => {
  const normalized = String(rawStatus ?? '').trim().toUpperCase();
  if (normalized === UserStatus.ACTIVE) return UserStatus.ACTIVE;
  if (normalized === UserStatus.INACTIVE) return UserStatus.INACTIVE;
  if (normalized === UserStatus.PENDING) return UserStatus.PENDING;
  if (normalized === UserStatus.SUSPENDED) return UserStatus.SUSPENDED;
  return UserStatus.ACTIVE;
};

const resolveUserFromBackendPersonnel = (personnel: PersonnelApiUser, ssoEmail: string): User => {
  const email = normalizeEmail(personnel.email ?? ssoEmail);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.has(email);
  return {
    id: personnel.id,
    nom: personnel.nom ?? '',
    prenom: personnel.prenom ?? '',
    username: personnel.username ?? email,
    passwd: null,
    role: isSuperAdmin ? UserRole.SUPER_ADMIN : toUserRole(personnel.role),
    specialite: personnel.specialite ?? '',
    telephone: personnel.telephone ?? '',
    email,
    status: toUserStatus(personnel.status),
  };
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
  // For SUPER_ADMIN: the role they chose to act as. null = not yet picked.
  activeRole: UserRole | null;
  // The role that drives navigation/permissions. For SUPER_ADMIN it's activeRole,
  // for everyone else it's their actual user.role.
  effectiveRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  resetActiveRole: () => void;
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
const ACTIVE_ROLE_KEY = 'hc_active_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,            setUser]            = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);
  const [isLoggingOut,    setIsLoggingOut]    = useState(false);
  const [authError,       setAuthError]       = useState<string | null>(null);
  const [activeRole,      setActiveRoleState] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
    return stored as UserRole | null;
  });

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

        // Source of truth is backend personnel table: match Outlook email
        const personnelResponse = await fetch('https://hc.aui.ma/api/consultations/personnels');
        if (!personnelResponse.ok) {
          throw new Error(`Failed to load personnels (${personnelResponse.status})`);
        }
        const personnels = (await personnelResponse.json()) as PersonnelApiUser[];
        const matchedPersonnel = personnels.find(
          (p) => normalizeEmail(p.email) === normalizeEmail(email),
        );

        if (matchedPersonnel) {
          const mappedUser = resolveUserFromBackendPersonnel(matchedPersonnel, email);
          console.log('[Auth] ✅ Email authorized from personnel table. role:', mappedUser.role, 'id:', mappedUser.id);
          setAuthError(null);
          setUser(mappedUser);
          setIsAuthenticated(true);
          persistUser(mappedUser, 'sso');
        } else {
          // ❌ Outlook authenticated but no matching row in personnel table
          console.warn('[Auth] ❌ Email not found in personnels table:', email);
          clearStoredAuth();
          setUser(null);
          setIsAuthenticated(false);
          setAuthError(
            `Le compte Outlook ${email} est authentifié mais n'existe pas dans la table du personnel.`,
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

    setLoggedOutFlag();
    setActiveRoleState(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);

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

  /* ── Active-role management (SUPER_ADMIN only) ── */
  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
  };
  const resetActiveRole = () => {
    setActiveRoleState(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  // The role that drives all navigation / permission checks.
  // SUPER_ADMINs act as their chosen role; everyone else uses their own role.
  const effectiveRole: UserRole | null =
    user?.role === UserRole.SUPER_ADMIN && activeRole ? activeRole : (user?.role ?? null);

  /* ── Role helpers (based on effectiveRole) ── */
  const hasRole     = (role: UserRole)    => effectiveRole === role;
  const hasAnyRole  = (roles: UserRole[]) => roles.some(r => effectiveRole === r);
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
        activeRole,
        effectiveRole,
        setActiveRole,
        resetActiveRole,
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