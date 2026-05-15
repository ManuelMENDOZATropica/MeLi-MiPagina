import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import '../index.css';
import API_URL from '../api';

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const handleMockLogin = async (type) => {
    setIsLoading(true);
    setLoadingType(type);
    setError('');

    if (type === 'valid') {
      try {
        const response = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mockEmail: 'manu@tropica.me' })
        });
        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('tropica_user', JSON.stringify({ token: data.token, user: data.user }));
          // Small delay so the animation plays visibly
          setTimeout(() => navigate('/projects'), 800);
        } else {
          setIsLoading(false);
          setLoadingType(null);
          setError(data.error || 'Error al iniciar sesión');
        }
      } catch (err) {
        setIsLoading(false);
        setLoadingType(null);
        setError('Error conectando al servidor backend. Asegúrate de que esté encendido.');
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingType(null);
        setError('Acceso denegado. Solo se permiten correos @tropica.me');
      }, 600);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0d0d;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Animated background blobs */
        .login-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: blobFloat 8s ease-in-out infinite alternate;
        }
        .login-blob-1 {
          width: 500px; height: 500px;
          background: #fff159;
          top: -150px; left: -150px;
          animation-delay: 0s;
        }
        .login-blob-2 {
          width: 350px; height: 350px;
          background: #3483fa;
          bottom: -100px; right: -80px;
          animation-delay: 3s;
        }
        .login-blob-3 {
          width: 250px; height: 250px;
          background: #fff159;
          bottom: 80px; left: 30%;
          animation-delay: 1.5s;
        }

        @keyframes blobFloat {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.08); }
        }

        /* Grid texture overlay */
        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 48px 40px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
          animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,241,89,0.12);
          border: 1px solid rgba(255,241,89,0.3);
          color: #fff159;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 24px;
        }

        .login-title {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .login-title span {
          color: #fff159;
        }

        .login-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 36px;
          line-height: 1.6;
        }

        .login-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin-bottom: 28px;
        }

        .login-btn {
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.01em;
          margin-bottom: 12px;
        }

        .login-btn:disabled {
          cursor: not-allowed;
        }

        .login-btn-primary {
          background: #fff159;
          color: #1a1a1a;
        }

        .login-btn-primary:hover:not(:disabled) {
          background: #ffe800;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,241,89,0.35);
        }

        .login-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn-secondary {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .login-btn-secondary:hover:not(:disabled) {
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.7);
          transform: translateY(-1px);
        }

        .login-error {
          background: rgba(231,76,60,0.12);
          border: 1px solid rgba(231,76,60,0.3);
          color: #ff7b70;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.5;
          animation: errorShake 0.4s ease;
        }

        @keyframes errorShake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
        }

        /* Loading spinner */
        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(26,26,26,0.2);
          border-top-color: #1a1a1a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        .login-spinner-light {
          border-color: rgba(255,255,255,0.2);
          border-top-color: rgba(255,255,255,0.6);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Shimmer on loading */
        .login-btn.is-loading::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          animation: shimmer 1.2s infinite;
        }

        @keyframes shimmer {
          to { transform: translateX(100%); }
        }

        .login-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
        }
      `}</style>

      <div className="login-root">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
        <div className="login-grid" />

        <div className="login-card">
          <div className="login-badge">
            <Sparkles size={12} />
            Trópica · Landing Builder
          </div>

          <h1 className="login-title">
            Tu canal,<br />
            <span>amplificado.</span>
          </h1>
          <p className="login-subtitle">
            Accede con tu cuenta corporativa para gestionar y publicar tus páginas de Mercado Libre.
          </p>

          <div className="login-divider" />

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button
            id="btn-login-tropica"
            onClick={() => handleMockLogin('valid')}
            disabled={isLoading}
            className={`login-btn login-btn-primary${isLoading && loadingType === 'valid' ? ' is-loading' : ''}`}
          >
            {isLoading && loadingType === 'valid' ? (
              <>
                <div className="login-spinner" />
                Accediendo…
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar como @tropica.me
              </>
            )}
          </button>

          <button
            id="btn-login-other"
            onClick={() => handleMockLogin('invalid')}
            disabled={isLoading}
            className={`login-btn login-btn-secondary${isLoading && loadingType === 'invalid' ? ' is-loading' : ''}`}
          >
            {isLoading && loadingType === 'invalid' ? (
              <>
                <div className="login-spinner login-spinner-light" />
                Verificando…
              </>
            ) : (
              <>
                <LogIn size={18} />
                Intentar con @gmail.com
              </>
            )}
          </button>

          <p className="login-footer">Solo cuentas @tropica.me tienen acceso · © 2026</p>
        </div>
      </div>
    </>
  );
}

export default Login;
