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

/* AUI official crest/shield inline SVG */
const AuiCrest = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M28 4 L50 14 L50 32 C50 43 40 51 28 54 C16 51 6 43 6 32 L6 14 Z" fill="#003366" stroke="#C4A326" strokeWidth="1.5"/>
    <path d="M28 10 L45 18.5 L45 32 C45 40 37.5 47 28 50 C18.5 47 11 40 11 32 L11 18.5 Z" fill="#002244"/>
    {/* Cross */}
    <rect x="25.5" y="16" width="5" height="22" rx="0.5" fill="#C4A326"/>
    <rect x="18" y="24" width="20" height="5" rx="0.5" fill="#C4A326"/>
    {/* Crown top accent */}
    <circle cx="28" cy="13" r="2" fill="#C4A326"/>
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

        /* AUI navy overlay — richer and more institutional than the blue */
        .lc-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            160deg,
            rgba(0, 20, 60, 0.92) 0%,
            rgba(0, 40, 100, 0.72) 45%,
            rgba(0, 16, 50, 0.90) 100%
          );
        }

        /* Gold vignette at bottom — gives an AUI-crest/seal warmth */
        .lc-vignette {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: radial-gradient(ellipse 90% 60% at 50% 110%, rgba(196,163,38,0.18) 0%, transparent 70%);
        }

        /* Card */
        .lc-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 380px;
          background: rgba(255,255,255,0.96);
          border-radius: 4px;
          padding: 0;
          box-shadow: 0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(196,163,38,0.30);
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.55s cubic-bezier(.22,1,.36,1), transform 0.55s cubic-bezier(.22,1,.36,1);
          overflow: hidden;
        }
        .lc-card.mounted { opacity:1; transform:translateY(0); }

        /* Maroon top bar — AUI identity stripe */
        .lc-topbar {
          height: 5px;
          background: linear-gradient(90deg, #003366 0%, #C4A326 50%, #003366 100%);
        }

        /* Card body */
        .lc-body { padding: 2.2rem 2rem 1.8rem; }

        /* Crest + wordmark */
        .lc-brand {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.75rem; margin-bottom: 1.6rem; text-align: center;
        }

        .lc-university {
          font-size: 0.62rem; font-weight: 500; letter-spacing: 0.16em;
          text-transform: uppercase; color: #003366; opacity: 0.65;
        }
        .lc-title {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 1.55rem; font-weight: 600; color: #001833;
          line-height: 1.15; letter-spacing: -0.01em; margin-top: 0.1rem;
        }
        .lc-gold-rule {
          width: 36px; height: 2px; margin: 0.5rem auto 0;
          background: linear-gradient(90deg, transparent, #C4A326, transparent);
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
          background: #003366; color: #fff;
          font-size: 0.88rem; font-weight: 500; font-family: 'Inter', sans-serif;
          border: none; border-radius: 3px; cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
          box-shadow: 0 2px 8px rgba(0,51,102,0.30);
        }
        .lc-btn:hover  { background:#002244; transform:translateY(-1px); box-shadow:0 6px 18px rgba(0,51,102,0.38); }
        .lc-btn:active { transform:translateY(0); box-shadow:0 2px 6px rgba(0,51,102,0.22); }
        .lc-btn:focus-visible { outline:2px solid #C4A326; outline-offset:3px; }
        .lc-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; }

        .lc-hint {
          text-align:center; font-size:0.70rem; color:#6b7280;
          margin-top:0.9rem; line-height:1.5;
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
        .lc-dev-input:focus { border-color:#003366; }
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

          {/* Brand header */}
          <div className="lc-brand">
            <AuiCrest />
            <div>
              <p className="lc-university">Al Akhawayn University · Ifrane</p>
              <h1 className="lc-title">Health Center Portal</h1>
              <div className="lc-gold-rule" />
            </div>
          </div>

          <div className="lc-rule" />

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

          <p className="lc-hint">Use your authorized AUI Outlook account to access the system.</p>

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
