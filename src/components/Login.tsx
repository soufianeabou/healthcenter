import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MicrosoftLogo = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
    <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
    <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const Login: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { loginWithOutlook, authError } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Inter:wght@300;400;500&display=swap');

        /* Background photo with slow zoom */
        .lc-bg {
          position: absolute; inset: -5%;
          background: url('/assets/background.webp') center/cover no-repeat;
          animation: lcZoom 28s ease-in-out infinite alternate;
          z-index: 0;
        }
        @keyframes lcZoom { from { transform:scale(1); } to { transform:scale(1.06); } }

        /* Deep neutral overlay on background (eye-friendly) */
        .lc-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            150deg,
            rgba(15, 23, 42, 0.96) 0%,
            rgba(15, 23, 42, 0.88) 35%,
            rgba(15, 23, 42, 0.92) 100%
          );
        }

        /* Soft vignette at bottom */
        .lc-vignette {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: radial-gradient(ellipse 90% 60% at 50% 115%, rgba(15,118,110,0.28) 0%, transparent 75%);
        }

        /* Card */
        .lc-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 380px;
          background: rgba(255,255,255,0.98);
          border-radius: 4px;
          padding: 0;
          box-shadow: 0 40px 100px rgba(15,23,42,0.78), 0 0 0 1px rgba(148,163,184,0.40);
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.55s cubic-bezier(.22,1,.36,1), transform 0.55s cubic-bezier(.22,1,.36,1);
          overflow: hidden;
        }
        .lc-card.mounted { opacity:1; transform:translateY(0); }

        /* Top bar subtle green accent */
        .lc-topbar {
          height: 5px;
          background: linear-gradient(90deg, #10b981 0%, #059669 40%, #0f766e 100%);
        }

        /* Card body */
        .lc-body { padding: 2.2rem 2rem 1.8rem; }

        /* Brand + wordmark */
        .lc-brand {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.75rem; margin-bottom: 1.6rem; text-align: center;
        }

        .lc-university {
          font-size: 0.62rem; font-weight: 500; letter-spacing: 0.16em;
          text-transform: uppercase; color: #6b7280; opacity: 0.9;
        }
        .lc-title {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 1.55rem; font-weight: 600; color: #111827;
          line-height: 1.15; letter-spacing: -0.01em; margin-top: 0.1rem;
        }
        .lc-gold-rule {
          width: 36px; height: 2px; margin: 0.5rem auto 0;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          border-radius: 2px;
        }

        /* Divider */
        .lc-rule { width:100%; height:1px; background:#e8e8e8; margin: 0 0 1.4rem; }

        /* Error */
        .lc-error {
          display:flex; align-items:flex-start; gap:0.55rem;
          background:#fef2f2; border:1px solid #fecaca;
          border-radius:4px; padding:0.75rem 0.85rem; margin-bottom:1.1rem;
          color:#b91c1c; font-size:0.78rem; line-height:1.5;
        }

        /* Sign-in button */
        .lc-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:0.65rem;
          padding: 0.85rem 1rem;
          background: #059669; color: #f9fafb;
          font-size: 0.88rem; font-weight: 500; font-family: 'Inter', sans-serif;
          border: none; border-radius: 3px; cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
          box-shadow: 0 2px 8px rgba(5,150,105,0.35);
        }
        .lc-btn:hover  { background:#047857; transform:translateY(-1px); box-shadow:0 6px 18px rgba(5,150,105,0.45); }
        .lc-btn:active { transform:translateY(0); box-shadow:0 2px 6px rgba(5,150,105,0.28); }
        .lc-btn:focus-visible { outline:2px solid #22c55e; outline-offset:3px; }
        .lc-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; }

        .lc-hint {
          text-align:center; font-size:0.72rem; color:#6b7280;
          margin-top:0.4rem; line-height:1.5;
        }

        /* Footer */
        .lc-footer {
          text-align:center; font-size:0.65rem; color:#9ca3af;
          margin-top:1.5rem; padding-top:1.2rem;
          border-top: 1px solid #f0f0f0;
          letter-spacing:0.04em;
        }

        /* Dev form extras */
        .lc-dev-sep { display:flex; align-items:center; gap:0.7rem; margin:1.2rem 0 1rem; }
        .lc-dev-sep span { font-size:0.60rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.10em; white-space:nowrap; }
        .lc-dev-sep::before, .lc-dev-sep::after { content:''; flex:1; height:1px; background:#e5e7eb; }
        .lc-dev-input {
          width:100%; padding:0.65rem 0.85rem; background:#fff;
          border:1px solid #d1d5db; border-radius:3px;
          color:#111827; font-size:0.82rem; font-family:'Inter',sans-serif;
          outline:none; transition:border-color 0.15s; margin-bottom:0.6rem; box-sizing:border-box;
        }
        .lc-dev-input:focus { border-color:#047857; }
        .lc-dev-btn {
          width:100%; padding:0.70rem; background:#16a34a; color:#fff;
          border:none; border-radius:3px; font-size:0.83rem; font-weight:500;
          font-family:'Inter',sans-serif; cursor:pointer; transition:background 0.16s;
        }
        .lc-dev-btn:hover { background:#15803d; }
      `}</style>

      {/* Background */}
      <div className="lc-bg"       aria-hidden="true" />
      <div className="lc-overlay"  aria-hidden="true" />
      <div className="lc-vignette" aria-hidden="true" />

      {/* Card */}
      <div className={`lc-card${mounted ? ' mounted' : ''}`} role="main">
        <div className="lc-topbar" />
        <div className="lc-body">

          {/* Brand header with provided logo */}
          <div className="lc-brand">
            <img
              src="/assets/hclogo.png"
              alt="AUI Health Center"
              style={{ height: 64, width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <p className="lc-university">Al Akhawayn University · Health Center</p>
              <h1 className="lc-title">AUI Health Center Portal</h1>
              <div className="lc-gold-rule" />
            </div>
          </div>

          <div className="lc-rule" />

          {/* Single sign-on status + error if any */}
          <div className="mb-3">
            <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xs">
                <p className="font-medium text-gray-800">Single sign-on enabled</p>
                <p className="text-gray-500">Use your AUI Outlook account to access the portal.</p>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {authError && (
            <div className="lc-error" role="alert">
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:1 }} />
              <span>{authError}</span>
            </div>
          )}

          {/* Sign-in CTA */}
          <button
            type="button"
            onClick={loginWithOutlook}
            className="lc-btn"
            aria-label="Sign in with Microsoft Outlook"
          >
            <MicrosoftLogo />
            Sign in with Outlook
          </button>

          <p className="lc-hint">Click the button above to authenticate using your Outlook account.</p>

          {/* Local dev fallback */}
          {isLocalDev && <DevLogin />}

          <p className="lc-footer">© {new Date().getFullYear()} Al Akhawayn University in Ifrane &nbsp;·&nbsp; ITS</p>
        </div>
      </div>
    </div>
  );
};

/* ── Local dev only: username/password form ── */
const DevLogin: React.FC = () => {
  const { authError: _ae, ...ctx } = useAuth() as any;
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctx.login) return;
    setBusy(true);
    await ctx.login(u, p);
    setBusy(false);
  };

  return (
    <>
      <div className="lc-dev-sep"><span>local dev only</span></div>
      <form onSubmit={submit}>
        <input className="lc-dev-input" placeholder="Username" value={u} onChange={e => setU(e.target.value)} required />
        <input className="lc-dev-input" type="password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} required />
        <button type="submit" className="lc-dev-btn" disabled={busy}>
          {busy ? 'Signing in…' : 'Dev Login'}
        </button>
      </form>
    </>
  );
};

export default Login;
