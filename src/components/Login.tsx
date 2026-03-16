import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
    <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
    <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const Login: React.FC = () => {
  const [mounted, setMounted]   = useState(false);
  const { loginWithOutlook, authError } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .lc-bg {
          position: absolute; inset: -6%;
          background: url('/assets/background.webp') center/cover no-repeat;
          animation: lcZoom 22s ease-in-out infinite alternate;
          z-index: 0;
        }
        @keyframes lcZoom { from { transform: scale(1); } to { transform: scale(1.08); } }

        .lc-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(145deg, rgba(6,20,50,0.88) 0%, rgba(0,60,120,0.60) 50%, rgba(6,20,50,0.84) 100%);
        }

        .lc-orb { position: absolute; border-radius: 50%; filter: blur(90px); z-index: 1; pointer-events: none; animation: lcDrift ease-in-out infinite alternate; }
        .lc-orb1 { width:460px; height:460px; background:rgba(0,80,160,0.28); top:-140px; left:-120px; animation-duration:16s; }
        .lc-orb2 { width:320px; height:320px; background:rgba(0,160,240,0.20); bottom:-90px; right:-70px; animation-duration:12s; animation-delay:-5s; }
        @keyframes lcDrift { from { transform:translate(0,0) scale(1); } to { transform:translate(26px,16px) scale(1.10); } }

        .lc-particle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.50); animation: lcRise linear infinite; }
        @keyframes lcRise {
          0%   { transform: translateY(105vh) translateX(0); opacity:0; }
          8%   { opacity:1; }
          92%  { opacity:0.4; }
          100% { transform: translateY(-6vh) translateX(var(--dx,0px)); opacity:0; }
        }

        .lc-card {
          position: relative; z-index: 10; width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 24px;
          padding: 2.5rem 2rem 2rem;
          box-shadow: 0 32px 80px rgba(0,0,0,0.52), inset 0 0 0 1px rgba(255,255,255,0.04);
          opacity: 0; transform: translateY(28px) scale(0.98);
          transition: opacity 0.60s cubic-bezier(.22,1,.36,1), transform 0.60s cubic-bezier(.22,1,.36,1);
        }
        .lc-card.mounted { opacity:1; transform:translateY(0) scale(1); }

        .lc-logo { height:52px; width:auto; object-fit:contain; filter:drop-shadow(0 4px 14px rgba(0,0,0,0.40)); }
        .lc-logo-fb { width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,#0052a3,#0078d4); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(0,82,163,0.50); }

        .lc-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.60rem; font-weight: 700; color: #fff;
          letter-spacing: -0.01em; line-height: 1.2;
        }
        .lc-sub { font-size: 0.78rem; font-weight: 300; color: rgba(255,255,255,0.45); margin-top: 0.25rem; letter-spacing: 0.03em; }

        .lc-rule { width:100%; height:1px; background:rgba(255,255,255,0.10); margin: 1.5rem 0; }

        .lc-error {
          display:flex; align-items:flex-start; gap:0.55rem;
          background:rgba(239,68,68,0.13); border:1px solid rgba(239,68,68,0.30);
          border-radius:10px; padding:0.75rem 0.85rem; margin-bottom:1.1rem;
          color:#fca5a5; font-size:0.80rem; line-height:1.5;
        }

        .lc-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:0.65rem;
          padding: 0.85rem 1rem;
          background: rgba(255,255,255,0.97); color: #111827;
          font-size: 0.90rem; font-weight: 500; font-family: 'DM Sans', sans-serif;
          border: none; border-radius: 12px; cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.26);
          letter-spacing: 0.01em;
          transition: background 0.16s, transform 0.12s, box-shadow 0.16s;
        }
        .lc-btn:hover  { background:#fff; transform:translateY(-2px); box-shadow:0 10px 30px rgba(0,0,0,0.36); }
        .lc-btn:active { transform:translateY(0); box-shadow:0 4px 14px rgba(0,0,0,0.22); }
        .lc-btn:focus-visible { outline:2px solid rgba(0,164,239,0.70); outline-offset:3px; }
        .lc-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

        .lc-hint { text-align:center; font-size:0.72rem; color:rgba(255,255,255,0.28); margin-top:0.85rem; }
        .lc-footer { text-align:center; font-size:0.67rem; color:rgba(255,255,255,0.15); margin-top:1.6rem; letter-spacing:0.04em; }

        .lc-dev-sep { display:flex; align-items:center; gap:0.7rem; margin:1.2rem 0 1rem; }
        .lc-dev-sep span { font-size:0.65rem; color:rgba(255,255,255,0.22); text-transform:uppercase; letter-spacing:0.08em; white-space:nowrap; }
        .lc-dev-sep::before, .lc-dev-sep::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.10); }
        .lc-dev-input {
          width:100%; padding:0.65rem 0.85rem; background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.14); border-radius:10px;
          color:#fff; font-size:0.82rem; font-family:'DM Sans',sans-serif;
          outline:none; transition:border-color 0.15s;
          margin-bottom:0.6rem;
        }
        .lc-dev-input::placeholder { color:rgba(255,255,255,0.30); }
        .lc-dev-input:focus { border-color:rgba(255,255,255,0.35); }
        .lc-dev-btn {
          width:100%; padding:0.70rem; background:rgba(34,197,94,0.80); color:#fff;
          border:none; border-radius:10px; font-size:0.85rem; font-weight:500;
          font-family:'DM Sans',sans-serif; cursor:pointer; transition:background 0.16s;
        }
        .lc-dev-btn:hover { background:rgba(34,197,94,0.95); }
      `}</style>

      {/* Animated background */}
      <div className="lc-bg"      aria-hidden="true" />
      <div className="lc-overlay" aria-hidden="true" />
      <div className="lc-orb lc-orb1" aria-hidden="true" />
      <div className="lc-orb lc-orb2" aria-hidden="true" />

      {/* Floating particles */}
      <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', overflow:'hidden' }} aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="lc-particle" style={{
            left: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2.2}px`,
            height: `${1 + Math.random() * 2.2}px`,
            animationDuration: `${10 + Math.random() * 16}s`,
            animationDelay: `${Math.random() * -26}s`,
            ['--dx' as any]: `${(Math.random() - 0.5) * 130}px`,
          }} />
        ))}
      </div>

      {/* Card */}
      <div className={`lc-card${mounted ? ' mounted' : ''}`} role="main">

        {/* Header: logo + name */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.25rem' }}>
          <img
            src="/assets/hclogo.png"
            alt="AUI Health Center"
            className="lc-logo"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fb) fb.style.display = 'flex';
            }}
          />
          <div className="lc-logo-fb" style={{ display:'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2l9 7-9 7-9-7 9-7z"/><path d="M3 9l9 7 9-7"/></svg>
          </div>
          <div>
            <h1 className="lc-title">AUI Health Center</h1>
            <p className="lc-sub">Healthcare Management System</p>
          </div>
        </div>

        <div className="lc-rule" />

        {/* Error banner */}
        {authError && (
          <div className="lc-error" role="alert">
            <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }} />
            <span>{authError}</span>
          </div>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={loginWithOutlook}
          className="lc-btn"
          aria-label="Sign in with Microsoft Outlook"
        >
          <MicrosoftLogo />
          Sign in with Outlook
        </button>

        <p className="lc-hint">Use your authorized AUI Outlook account</p>

        {/* Local dev fallback — hidden in production */}
        {isLocalDev && <DevLogin />}

        <p className="lc-footer">© {new Date().getFullYear()} Al Akhawayn University · ITS</p>
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
