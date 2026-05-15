import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import API_URL from '../api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const btnRef = useRef(null);

  // Callback que Google llama con el credential JWT
  const handleCredentialResponse = async (response) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('tropica_user', JSON.stringify({ token: data.token, user: data.user }));
        navigate('/projects');
      } else {
        setError(data.error || 'Acceso denegado');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Sin conexión al servidor');
      setIsLoading(false);
    }
  };

  // Cargar Google Identity Services y renderizar el botón nativo
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('VITE_GOOGLE_CLIENT_ID no configurado.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // Renderizar el botón oficial de Google dentro de nuestro contenedor
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: btnRef.current.offsetWidth || 332,
        });
        setGsiReady(true);
      }
    };
    script.onerror = () => setError('No se pudo cargar Google Sign-In.');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

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
          line-height: 1.5;
        }

        @keyframes ln-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }

        /* Contenedor del botón de Google — ocupa ancho completo */
        .ln-google-btn-wrap {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Mientras carga el script de Google */
          position: relative;
        }

        /* Skeleton mientras GSI carga */
        .ln-google-btn-wrap:not(.ready)::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #f4f6fb;
          border: 1px solid #e0e5ef;
          border-radius: 4px;
          animation: ln-pulse 1.5s ease-in-out infinite;
        }

        @keyframes ln-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        /* Hacer que el iframe de Google ocupe el ancho completo */
        .ln-google-btn-wrap iframe {
          width: 100% !important;
        }

        .ln-loading-indicator {
          font-size: 12px;
          color: #9ba3b5;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 10px 0;
          text-align: center;
        }

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

        .ln-footer strong { color: rgba(26,31,46,0.5); }
      `}</style>

      <div className="ln-root">
        <div className="ln-card">

          <div className="ln-card-header">
            <div className="ln-bar" />
            <span className="ln-header-title">Landing Builder</span>
          </div>

          <div className="ln-card-body">
            <p className="ln-label">Autenticación</p>
            <h1 className="ln-title">Iniciar<br />sesión</h1>

            {error && <div className="ln-error">{error}</div>}

            {isLoading ? (
              <p className="ln-loading-indicator">Verificando acceso…</p>
            ) : (
              /* Botón oficial de Google — se inyecta aquí por el SDK */
              <div
                ref={btnRef}
                className={`ln-google-btn-wrap${gsiReady ? ' ready' : ''}`}
              />
            )}
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
