import React, { useState, useEffect } from 'react';
import { User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Microsoft / Outlook SVG logo ─── */
const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
    <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
    <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

/* ─── AUI Logo ─── */
const AUILogo = () => (
  <>
    <img
      src="/logo.png"
      alt="AUI Logo"
      className="aui-logo-img"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
        const fallback = (e.currentTarget as HTMLImageElement)
          .nextElementSibling as HTMLElement | null;
        if (fallback) fallback.style.display = 'flex';
      }}
    />
    {/* Shown only if /logo.png fails to load */}
    <div className="aui-logo-fallback" style={{ display: 'none' }}>
      <User size={26} color="#fff" />
    </div>
  </>
);

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = () => {
  const [mounted, setMounted] = useState(false);
  const { loginWithOutlook, authError } = useAuth();

  /* Trigger entrance animation after first paint */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* ── Background image with subtle Ken-Burns zoom ── */
        .login-bg {
          position: absolute;
          inset: -6%;
          background: url('../public/assets/background.webp') center / cover no-repeat;
          animation: bgZoom 22s ease-in-out infinite alternate;
          z-index: 0;
        }
        @keyframes bgZoom {
          from { transform: scale(1);    }
          to   { transform: scale(1.09); }
        }

        /* Deep gradient overlay so text is always legible over any photo */
        .login-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(8, 25, 60, 0.86) 0%,
            rgba(0, 70, 140, 0.60) 50%,
            rgba(8, 25, 60, 0.82) 100%
          );
          z-index: 1;
        }

        /* ── Ambient colour orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          z-index: 1;
          pointer-events: none;
          animation: orbDrift ease-in-out infinite alternate;
        }
        .orb-1 {
          width: 480px; height: 480px;
          background: rgba(0, 82, 163, 0.30);
          top: -150px; left: -120px;
          animation-duration: 15s;
        }
        .orb-2 {
          width: 340px; height: 340px;
          background: rgba(0, 164, 239, 0.22);
          bottom: -100px; right: -80px;
          animation-duration: 11s;
          animation-delay: -5s;
        }
        .orb-3 {
          width: 220px; height: 220px;
          background: rgba(242, 80, 34, 0.12);
          bottom: 28%; left: 8%;
          animation-duration: 18s;
          animation-delay: -9s;
        }
        @keyframes orbDrift {
          from { transform: translate(0,    0)    scale(1);    }
          to   { transform: translate(28px, 18px) scale(1.12); }
        }

        /* ── Floating particles ── */
        .particles {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          animation: particleRise linear infinite;
        }
        @keyframes particleRise {
          0%   { transform: translateY(105vh) translateX(0);                    opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 0.5; }
          100% { transform: translateY(-8vh) translateX(var(--dx, 0px));        opacity: 0; }
        }

        /* ── Glassmorphism card ── */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(28px) saturate(170%);
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 2.75rem 2.25rem 2.25rem;
          box-shadow:
            0 36px 90px rgba(0, 0, 0, 0.50),
            inset 0 0 0 1px rgba(255, 255, 255, 0.04);
          opacity: 0;
          transform: translateY(30px) scale(0.98);
          transition:
            opacity   0.65s cubic-bezier(.22, 1, .36, 1),
            transform 0.65s cubic-bezier(.22, 1, .36, 1);
        }
        .login-card.mounted {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* ── Logo ── */
        .aui-logo-img {
          height: 52px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.40));
        }
        .aui-logo-fallback {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0052a3, #0078d4);
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 82, 163, 0.50);
          flex-shrink: 0;
        }

        /* ── Header ── */
        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.65rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .card-subtitle {
          font-size: 0.80rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.48);
          margin-top: 0.3rem;
          letter-spacing: 0.025em;
        }

        /* ── Thin separator ── */
        .card-rule {
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.10);
          margin: 1.6rem 0;
        }

        /* ── Welcome copy ── */
        .card-welcome {
          font-size: 0.85rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.52);
          line-height: 1.65;
          margin-bottom: 1.5rem;
        }
        .card-welcome strong {
          color: rgba(255, 255, 255, 0.82);
          font-weight: 500;
        }

        /* ── Error banner ── */
        .error-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.32);
          border-radius: 10px;
          padding: 0.8rem 0.9rem;
          margin-bottom: 1.25rem;
          color: #fca5a5;
          font-size: 0.82rem;
          line-height: 1.5;
        }

        /* ── Outlook / Microsoft button ── */
        .btn-outlook {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.7rem;
          padding: 0.9rem 1rem;
          background: rgba(255, 255, 255, 0.96);
          color: #111827;
          font-size: 0.90rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 22px rgba(0, 0, 0, 0.28);
          letter-spacing: 0.01em;
          transition:
            background  0.18s ease,
            transform   0.14s ease,
            box-shadow  0.18s ease;
        }
        .btn-outlook:hover {
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.38);
        }
        .btn-outlook:active {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
        }
        .btn-outlook:focus-visible {
          outline: 2px solid rgba(0, 164, 239, 0.70);
          outline-offset: 3px;
        }

        /* ── Security badges row ── */
        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 1rem;
          font-size: 0.71rem;
          color: rgba(255, 255, 255, 0.27);
          letter-spacing: 0.03em;
        }
        .security-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.20);
          display: inline-block;
          flex-shrink: 0;
        }

        /* ── Footer ── */
        .card-footer {
          text-align: center;
          font-size: 0.69rem;
          color: rgba(255, 255, 255, 0.17);
          margin-top: 1.75rem;
          letter-spacing: 0.04em;
        }
      `}</style>

      <div className="login-root">
        {/* Animated background */}
        <div className="login-bg"      aria-hidden="true" />
        <div className="login-overlay" aria-hidden="true" />

        {/* Colour orbs */}
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />
        <div className="orb orb-3" aria-hidden="true" />

        {/* Rising particles */}
        <div className="particles" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="particle"
              style={{
                left:                `${Math.random() * 100}%`,
                width:               `${1 + Math.random() * 2.5}px`,
                height:              `${1 + Math.random() * 2.5}px`,
                animationDuration:   `${9 + Math.random() * 16}s`,
                animationDelay:      `${Math.random() * -25}s`,
                ['--dx' as any]:     `${(Math.random() - 0.5) * 140}px`,
                opacity:              0.1 + Math.random() * 0.35,
              }}
            />
          ))}
        </div>

        {/* ── Main card ── */}
        <div className={`login-card${mounted ? ' mounted' : ''}`} role="main">

          {/* Logo + title */}
          <div className="card-header">
            <AUILogo />
            <div>
              <h1 className="card-title">AUI Health Center</h1>
              <p className="card-subtitle">Système de gestion des soins de santé</p>
            </div>
          </div>

          <div className="card-rule" />

          {/* Welcome message */}
          <p className="card-welcome">
            Bienvenue sur le portail du Centre de Santé.<br />
            Connectez-vous avec votre{' '}
            <strong>compte AUI Outlook</strong>{' '}
            pour accéder à l'application.
          </p>

          {/* Error from AuthContext (e.g. email not in the directory) */}
          {authError && (
            <div className="error-banner" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{authError}</span>
            </div>
          )}

          {/* ── Primary action ── */}
          <button
            type="button"
            onClick={loginWithOutlook}
            className="btn-outlook"
            aria-label="Se connecter avec Microsoft Outlook"
          >
            <MicrosoftLogo />
            Se connecter avec Outlook
          </button>

          {/* Security note */}
          <p className="security-note">
            <span>Connexion sécurisée</span>
            <span className="security-dot" />
            <span>Microsoft Azure AD</span>
            <span className="security-dot" />
            <span>AUI SSO</span>
          </p>

          {/* Footer */}
          <p className="card-footer">
            © {new Date().getFullYear()} Al Akhawayn University · ITS Department
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;