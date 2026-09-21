import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  idNum?: number;
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

/* Collapses a name to a comparable key: strips diacritics (Aït → ait),
   lowercases, and removes everything but letters/digits so spacing,
   hyphens and punctuation differences (El Mesnaoui / el-mesnaoui) don't
   break equality. Used only to bridge a student's Outlook name to their
   roster record when no shared email/ID identifier is available. */
const normalizeName = (value: string | null | undefined): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/* Inactivity: last user activity is kept as a timestamp in localStorage and
   compared on a short interval, rather than relying on one long setTimeout.
   A single in-memory timer is lost on refresh/tab close and fires late (or
   never) across laptop sleep and background-tab throttling, so a returning
   user could still hold a live login well past the limit. A stored
   timestamp survives all of that and is shared across open tabs. */
const LAST_ACTIVITY_KEY    = 'lastActivity';
const INACTIVITY_LIMIT_MS  = 30 * 60 * 1000;
const INACTIVITY_CHECK_MS  = 15 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000;

const clearStoredAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('authSource');
  localStorage.removeItem(LAST_ACTIVITY_KEY);
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

/* Same claim set as extractEmailFromPrincipal, but returns every distinct
   @-shaped candidate instead of just the first. Jenzabar's on-file email
   for a student is sometimes a different alias than the "primary" email
   Azure surfaces (e.g. an ID-number address the SIS still has on record,
   like 120487@aui.ma, while Outlook shows a name-based H.Idhammou@aui.ma).
   Since these are two different strings, matching only the first candidate
   can miss a legitimate student entirely — so the student lookup tries
   each of these in turn instead of giving up after the first miss. */
const extractAllEmailCandidates = (principal: unknown): string[] => {
  if (!principal) return [];

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

  const seen = new Set<string>();
  return candidates.filter((v) => {
    if (!v.includes('@') || seen.has(v)) return false;
    seen.add(v);
    return true;
  });
};

/* Azure AD is the authoritative source for a person's name — the personnel/
   patient DB rows can carry stale or duplicated data (e.g. a reused email on
   an old record). When Azure supplies given_name/family_name (or a full
   name), prefer it over whatever the DB match returned. */
const extractNameFromPrincipal = (principal: unknown): { prenom: string; nom: string } | null => {
  if (!principal) return null;

  const root   = principal as any;
  const nested = (root.principal as any) ?? root;
  const attrs  = (nested.attributes as any) ?? nested;

  const givenName  = typeof attrs.given_name === 'string' ? attrs.given_name.trim() : '';
  const familyName = typeof attrs.family_name === 'string' ? attrs.family_name.trim() : '';
  if (givenName || familyName) return { prenom: givenName, nom: familyName };

  const fullName = typeof attrs.name === 'string' ? attrs.name.trim() : '';
  if (fullName) {
    const parts = fullName.split(/\s+/);
    return { prenom: parts[0], nom: parts.slice(1).join(' ') };
  }

  return null;
};

/* Applies the Azure-sourced name on top of a DB-resolved user, when available. */
const withAuthoritativeName = (user: User, principal: unknown): User => {
  const azureName = extractNameFromPrincipal(principal);
  if (!azureName) return user;
  return {
    ...user,
    prenom: azureName.prenom || user.prenom,
    nom:    azureName.nom    || user.nom,
  };
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

/* Result of the student lookup below, distinguishing "genuinely not a
   student" from "couldn't tell right now" — these need different user-facing
   messages. Collapsing both into null (as an earlier version did) made a
   transient backend/network failure look identical to "no profile exists",
   which sent students to contact an administrator about an account that was
   actually fine. */
type StudentLookupResult =
  | { status: 'found'; user: User }
  | { status: 'not_found' }
  | { status: 'error' };

/* Resolves a student from the patient service's student roster
   (/api/patients/by-type/students) — the same endpoint that has always been
   deployed and that made student login work originally. Used when the email
   is authenticated via SSO but has no personnel row; a match here is a
   student and gets the STUDENT portal role.

   candidateEmails is every @-shaped claim Azure gave us (see
   extractAllEmailCandidates). Jenzabar's on-file email for a student is
   often a different alias than the one Outlook shows: the student signs in
   as e.g. H.Idhammou@aui.ma, while the SIS/patient record is keyed to an
   ID-number address like 120487@aui.ma (the same ID used by the attendance
   API). So we match a roster patient whose email equals ANY of the Azure
   candidates, not just the primary one — that's what lets students whose
   Outlook alias differs from their SIS email through.

   loginEmail is the student's actual, stable Outlook identity: the returned
   profile always carries that (not whichever roster field matched), so
   certificate history and everything else keyed by email stays consistent.

   azureName is the student's name from Outlook (given_name/family_name).
   It's the bridge that actually works in practice: a student signs in with
   a NAME-based alias (O.Mesnaoui@aui.ma), but the TmsEPrd/roster record is
   keyed to an ID-based email (120XXX@aui.ma) and Outlook does NOT expose
   that ID in any claim — so email/ID matching can't connect the two. The
   person's name is the one identifier both sides reliably carry. Whichever
   matcher wins, idNum still comes from the matched roster row, so the
   downstream student flow (certificates, absences) keeps using the right ID. */
const resolveStudentFromPatientService = async (
  candidateEmails: string[],
  azureName: { prenom: string; nom: string } | null,
  loginEmail: string,
): Promise<StudentLookupResult> => {
  try {
    const res = await fetch('https://hc.aui.ma/api/patients/by-type/students', {
      credentials: 'include',
    });
    if (!res.ok) return { status: 'error' };
    const students: any[] = await res.json();
    if (!Array.isArray(students)) return { status: 'error' };

    // (a) email string equality against any Azure claim, and
    // (b) student ID parsed from any {digits}@... claim vs patient.idNum.
    //     Both only fire if Outlook happens to surface the id-based address;
    //     kept because they're exact when they do.
    const candidateEmailSet = new Set(candidateEmails.map(normalizeEmail));
    const candidateIdSet = new Set(
      candidateEmails
        .map((e) => normalizeEmail(e).match(/^(\d+)@/)?.[1])
        .filter((id): id is string => !!id),
    );

    let match = students.find(
      (p) =>
        (p?.email && candidateEmailSet.has(normalizeEmail(p.email))) ||
        (p?.idNum != null && candidateIdSet.has(String(p.idNum))),
    );

    // (c) name match — the bridge that actually works, since Outlook gives a
    //     name-based alias while the roster is keyed to an id-based email the
    //     token never exposes. Require a UNIQUE full-name match (both name
    //     orderings, accent/spacing-insensitive) so we never log a student in
    //     as a different student who happens to share their name.
    if (!match && azureName && (azureName.prenom || azureName.nom)) {
      const target    = normalizeName(azureName.prenom) + normalizeName(azureName.nom);
      const targetRev  = normalizeName(azureName.nom) + normalizeName(azureName.prenom);
      const nameMatches = students.filter((p) => {
        const key = normalizeName(String(p?.prenom ?? '')) + normalizeName(String(p?.nom ?? ''));
        return key !== '' && (key === target || key === targetRev);
      });
      if (nameMatches.length === 1) {
        match = nameMatches[0];
      } else if (nameMatches.length > 1) {
        console.warn(
          '[Auth] Ambiguous student name match — refusing to guess.',
          'name:', azureName, 'candidates:', nameMatches.length,
        );
      }
    }

    if (!match) {
      // Diagnostic: if a genuinely-registered student still isn't matched,
      // this pinpoints why. Compare the Azure name/emails against the roster.
      console.warn(
        '[Auth] No student roster match.',
        '| Azure name:', azureName,
        '| Azure email candidates:', candidateEmails,
        '| IDs parsed from them:', [...candidateIdSet],
        '| roster size:', students.length,
      );
      return { status: 'not_found' };
    }

    return {
      status: 'found',
      user: {
        id:         match.id,
        nom:        match.nom    ?? '',
        prenom:     match.prenom ?? '',
        username:   loginEmail,
        passwd:     null,
        role:       UserRole.STUDENT,
        specialite: '',
        telephone:  '',
        email:      loginEmail,
        status:     UserStatus.ACTIVE,
        idNum:      match.idNum ?? undefined,
      },
    };
  } catch {
    return { status: 'error' };
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
  isPsy: () => boolean;
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
          const superAdminUser: User = withAuthoritativeName(
            personnelUser
              ? { ...personnelUser, role: UserRole.SUPER_ADMIN }
              : {
                  id: 0, nom: normalizedEmail.split('@')[0], prenom: '',
                  username: email, passwd: null,
                  role: UserRole.SUPER_ADMIN, specialite: 'Supervision',
                  telephone: '', email, status: UserStatus.ACTIVE,
                },
            principal,
          );
          setAuthError(null);
          setUser(superAdminUser);
          setIsAuthenticated(true);
          persistUser(superAdminUser, 'sso');
          return;
        }

        // 2. Look up the user in the personnels table by email
        const personnelUser = await resolveUserFromBackendPersonnel(email);

        if (personnelUser) {
          const finalPersonnelUser = withAuthoritativeName(personnelUser, principal);
          setAuthError(null);
          setUser(finalPersonnelUser);
          setIsAuthenticated(true);
          persistUser(finalPersonnelUser, 'sso');
        } else {
          // 3. Not staff — check the student roster before giving up.
          // Bridge the student's Outlook identity to their roster record by
          // email, id, or (the one that actually works) name — see
          // resolveStudentFromPatientService. A student's Outlook alias
          // (O.Mesnaoui@aui.ma) never matches the roster's id-based email
          // (120XXX@aui.ma), and Outlook doesn't expose the id, so name is
          // the only shared identifier.
          // One-time dump of exactly what Outlook returned, so if a
          // registered student still fails we can see the real claims.
          console.debug('[Auth] Azure principal for student lookup:', principal);
          const emailCandidates = extractAllEmailCandidates(principal);
          const azureName = extractNameFromPrincipal(principal);
          const studentLookup = await resolveStudentFromPatientService(emailCandidates, azureName, email);

          if (studentLookup.status === 'found') {
            const finalStudentUser = withAuthoritativeName(studentLookup.user, principal);
            setAuthError(null);
            setUser(finalStudentUser);
            setIsAuthenticated(true);
            persistUser(finalStudentUser, 'sso');
          } else if (studentLookup.status === 'error') {
            // The lookup itself failed (network/backend) — this is NOT the
            // same as "no profile exists", so don't tell the student to
            // contact an administrator about an account that's actually
            // fine. Keep whatever localStorage has and let them retry.
            console.warn('[Auth] Student lookup failed for', email);
            setAuthError(
              'Impossible de vérifier votre profil pour le moment. Merci de réessayer dans un instant.',
            );
          } else {
            // Authenticated by Azure but genuinely not found as personnel or student
            clearStoredAuth();
            setUser(null);
            setIsAuthenticated(false);
            setAuthError(
              `Le compte ${email} est authentifié mais n'a pas de profil dans le système. Contactez l'administrateur.`,
            );
          }
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

  /* ── 30-minute inactivity logout ──
     Goes through the same real logout as the button (gateway session and
     Azure sign-out included), not just a local state reset — otherwise a
     refresh after "auto-logout" would silently re-authenticate through the
     still-alive SSO session, defeating the point on a shared/lab terminal. */
  useEffect(() => {
    if (!isAuthenticated) return;

    const readLastActivity = (): number => Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
    const touch = () => localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

    const isExpired = () => {
      const last = readLastActivity();
      return last > 0 && Date.now() - last > INACTIVITY_LIMIT_MS;
    };

    // Returning after being away (closed tab, slept laptop): the stored
    // timestamp is already past the limit, so end the session right away
    // instead of restoring a stale login from localStorage.
    if (isExpired()) {
      logout();
      return;
    }
    if (!readLastActivity()) touch();

    let lastWrite = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWrite = now;
      touch();
    };

    const check = () => { if (isExpired()) logout(); };
    const interval = setInterval(check, INACTIVITY_CHECK_MS);
    // Timers are throttled/suspended in background tabs and during sleep;
    // re-check the moment the tab is visible again.
    const onVisibility = () => { if (document.visibilityState === 'visible') check(); };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated]);

  /* ── Redirect to Azure AD via the Spring Security gateway ── */
  const loginWithOutlook = () => {
    setAuthError(null);
    window.location.href = `${AUTH_BASE_URL}/oauth2/authorization/azure-dev`;
  };

  /* ── Logout: clear local state, then hand off to the gateway's /logout,
        which destroys the server session and signs out of Azure, then lands
        back on the login page (see SecurityConfig / AuthController#afterLogout).
        Guarded so the inactivity interval and a button click can't both
        fire it before the redirect takes over. ── */
  const loggingOutRef = useRef(false);
  const logout = () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setIsLoggingOut(true);
    clearStoredAuth();
    resetActiveRole();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    window.location.href = `${AUTH_BASE_URL}/logout`;
  };

  /* If the browser restores this page from its back/forward cache after a
     logout, React state (and the guard above) comes back frozen mid-logout.
     Reset it so the login screen is usable. */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        loggingOutRef.current = false;
        setIsLoggingOut(false);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

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
  const isPsy       = ()                  => effectiveRole === UserRole.PSY;

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
        isPsy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};