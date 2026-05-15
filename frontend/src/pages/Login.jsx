import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import '../index.css';
import API_URL from '../api';

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockEmail: 'manu@tropica.me' })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('tropica_user', JSON.stringify({ token: data.token, user: data.user }));
        setTimeout(() => navigate('/projects'), 700);
      } else {
        setIsLoading(false);
        setError(data.error || 'Acceso denegado');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Sin conexión al servidor');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ln-root {
          min-height: 100vh;
          background: #dfe4ec;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }

        .ln-card {
          background: white;
          border: 1px solid #e0e5ef;
          width: 380px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }

        /* Same as editor top bar */
        .ln-card-header {
          background: #1a1f2e;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ln-bar {
          width: 5px;
          height: 24px;
          background: #fff159;
          flex-shrink: 0;
        }

        .ln-header-title {
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .ln-card-body {
          padding: 32px 24px 28px;
        }

        .ln-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9ba3b5;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .ln-label::before {
          content: '';
          width: 20px;
          height: 1px;
          background: #9ba3b5;
          flex-shrink: 0;
        }

        .ln-title {
          font-size: 32px;
          font-weight: 900;
          color: #1a1f2e;
          letter-spacing: -1.5px;
          line-height: 1;
          margin-bottom: 32px;
        }

        .ln-error {
          border-left: 3px solid #e74c3c;
          padding: 10px 14px;
          background: rgba(231,76,60,0.07);
          color: #c0392b;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          animation: ln-shake 0.3s ease;
        }

        @keyframes ln-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }

        /* Same button style as editor "Publicar" */
        .ln-btn {
          width: 100%;
          padding: 16px 20px;
          background: #1a1f2e;
          color: #fff159;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.18s, transform 0.15s;
          position: relative;
          overflow: hidden;
        }

        .ln-btn:hover:not(:disabled) { background: #252c3f; transform: translateY(-1px); }
        .ln-btn:active:not(:disabled) { transform: translateY(0); }
        .ln-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ln-btn.loading::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          transform: translateX(-100%);
          animation: ln-shimmer 1s infinite;
        }

        @keyframes ln-shimmer { to { transform: translateX(100%); } }

        .ln-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,241,89,0.2);
          border-top-color: #fff159;
          border-radius: 50%;
          animation: ln-spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        @keyframes ln-spin { to { transform: rotate(360deg); } }

        .ln-footer {
          border-top: 1px solid #e0e5ef;
          padding: 12px 24px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #b0b9cc;
          display: flex;
          justify-content: space-between;
        }

        .ln-footer strong { color: rgba(255,241,89,0.7); }
      `}</style>

      <div className="ln-root">
        <div className="ln-card">

          {/* Header — same dark bar as editor top nav */}
          <div className="ln-card-header">
            <div className="ln-bar" />
            <span className="ln-header-title">Landing Builder</span>
          </div>

          <div className="ln-card-body">
            <p className="ln-label">Autenticación</p>
            <h1 className="ln-title">Iniciar<br />sesión</h1>

            {error && <div className="ln-error">{error}</div>}

            <button
              id="btn-login-tropica"
              onClick={handleLogin}
              disabled={isLoading}
              className={`ln-btn${isLoading ? ' loading' : ''}`}
            >
              <span>{isLoading ? 'Accediendo…' : 'Entrar con @tropica.me'}</span>
              {isLoading ? <div className="ln-spinner" /> : <ArrowRight size={16} strokeWidth={2.5} />}
            </button>
          </div>

          <div className="ln-footer">
            <span><strong>2026 TRÓPICA</strong> · Creative &amp; Tech</span>
            <span>Solo @tropica.me</span>
          </div>

        </div>
      </div>
    </>
  );
}

export default Login;
