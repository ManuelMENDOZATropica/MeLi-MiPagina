import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import '../index.css';

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleMockLogin = async (type) => {
    if (type === 'valid') {
      try {
        const response = await fetch('http://localhost:4000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mockEmail: 'manu@tropica.me' })
        });
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('tropica_user', JSON.stringify({ token: data.token, user: data.user }));
          navigate('/projects');
        } else {
          setError(data.error || 'Error al iniciar sesión');
        }
      } catch (err) {
        setError('Error conectando al servidor backend. Asegúrate de que esté encendido.');
      }
    } else {
      setError('Acceso denegado. Solo se permiten correos @tropica.me');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <img 
          src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years_v2.png" 
          alt="Mercado Libre" 
          style={{ height: '40px', marginBottom: '30px' }} 
        />
        <h2 style={{ marginBottom: '10px', color: '#333' }}>Landing Builder</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Inicia sesión con tu cuenta corporativa para continuar.</p>
        
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <button 
          onClick={() => handleMockLogin('valid')}
          style={{ width: '100%', padding: '12px', backgroundColor: '#3483fa', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}
        >
          <LogIn size={20} /> Entrar como @tropica.me
        </button>

        <button 
          onClick={() => handleMockLogin('invalid')}
          style={{ width: '100%', padding: '12px', backgroundColor: 'white', color: '#666', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <LogIn size={20} /> Intentar con @gmail.com
        </button>
      </div>
    </div>
  );
}

export default Login;
