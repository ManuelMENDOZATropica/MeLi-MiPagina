import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, LogOut, Trash2, X } from 'lucide-react';
import '../index.css';
import API_URL from '../api';

function Projects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('tropica_user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Cargar proyectos de la DB
      fetch(`${API_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${parsedUser.token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando proyectos:', err));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('tropica_user');
    navigate('/login');
  };

  const handleNewProject = async () => {
    const name = newProjectName.trim();
    if (name.length < 2) {
      setCreateError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ title: name })
      });
      const newProject = await response.json();
      navigate(`/editor/${newProject.id}`);
    } catch (err) {
      console.error('Error al crear proyecto:', err);
      setCreateError('Error al crear el proyecto. Intenta de nuevo.');
    }
    setIsCreating(false);
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== `delete ${projectToDelete.title}`) return;
    
    try {
      await fetch(`${API_URL}/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setProjectToDelete(null);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Error al eliminar proyecto:', err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', backgroundColor: 'white', padding: '20px 28px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderBottom: '3px solid #fff159' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #fff159 0%, #3483fa 100%)' }} />
            <h1 style={{ fontSize: '24px', color: '#1a1a1a', margin: 0, fontWeight: '800', letterSpacing: '-0.3px' }}>Mis Proyectos</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* User avatar: real photo or initial */}
              {(user.user?.picture || user.user?.avatar || user.avatar) ? (
                <img
                  src={user.user?.picture || user.user?.avatar || user.avatar}
                  alt={user.user?.name || user.name || 'Avatar'}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #fff159', boxShadow: '0 0 0 2px #3483fa22' }}
                />
              ) : (
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #fff159, #3483fa)', color: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', border: '2.5px solid #fff159' }}>
                  {(user.user?.name || user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={{ color: '#1a1a1a', fontWeight: '700', fontSize: '14px', lineHeight: 1.2 }}>
                  {user.user?.name || user.name || ''}
                </span>
                <span style={{ color: '#999', fontSize: '12px', lineHeight: 1.2 }}>
                  {user.user?.email || user.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: '1px solid #ffe4e4', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '14px', padding: '8px 14px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff0f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
          
          {/* New Project Card */}
          <div
            onClick={() => { setNewProjectName(''); setCreateError(''); setShowCreateModal(true); }}
            style={{ backgroundColor: 'white', border: '2px dashed #3483fa', borderRadius: '8px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#3483fa' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f5ff'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Plus size={40} style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: 0 }}>Crear Nuevo Proyecto</h3>
          </div>

          {/* Render de proyectos desde la BD */}
          {projects.map(proj => (
            <div 
              key={proj.id}
              onClick={() => navigate(`/editor/${proj.id}`)}
              style={{ backgroundColor: 'white', border: '1px solid #e6e6e6', borderRadius: '8px', height: '200px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#3483fa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e6e6e6'; }}
            >
              <div style={{ flex: 1, backgroundColor: '#fff159', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.1)', position: 'relative' }}>
                <Layout size={60} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(proj);
                    setDeleteConfirmText('');
                  }}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', color: '#ff4d4f', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  title="Eliminar proyecto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ padding: '15px', borderTop: '1px solid #e6e6e6' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>{proj.title}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  {new Date(proj.updatedAt).toLocaleDateString()} a las {new Date(proj.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#e74c3c', fontSize: '20px' }}>Eliminar Proyecto</h2>
              <button onClick={() => setProjectToDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ marginBottom: '20px', color: '#333', lineHeight: '1.5' }}>
              Esta acción no se puede deshacer. Para confirmar, escribe <strong>delete {projectToDelete.title}</strong> en el campo de abajo.
            </p>
            
            <input 
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`delete ${projectToDelete.title}`}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '20px', boxSizing: 'border-box' }}
              autoFocus
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setProjectToDelete(null)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteProject}
                disabled={deleteConfirmText !== `delete ${projectToDelete.title}`}
                style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: deleteConfirmText !== `delete ${projectToDelete.title}` ? 'not-allowed' : 'pointer', opacity: deleteConfirmText !== `delete ${projectToDelete.title}` ? 0.5 : 1 }}
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Proyecto */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowCreateModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Nuevo Proyecto</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={20} /></button>
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nombre del proyecto
            </label>
            <input
              autoFocus
              type="text"
              value={newProjectName}
              onChange={e => { setNewProjectName(e.target.value); setCreateError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleNewProject()}
              placeholder="Ej: Landing Verano 2026"
              maxLength={80}
              style={{ width: '100%', padding: '11px 14px', border: `1.5px solid ${createError ? '#e74c3c' : '#e6e6e6'}`, borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '6px', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = createError ? '#e74c3c' : '#3483fa'}
              onBlur={e => e.target.style.borderColor = createError ? '#e74c3c' : '#e6e6e6'}
            />
            {createError && <p style={{ color: '#e74c3c', fontSize: '13px', margin: '0 0 12px 0' }}>{createError}</p>}
            {!createError && <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 20px 0' }}>Mínimo 2 caracteres · Máximo 80</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={handleNewProject}
                disabled={isCreating}
                style={{ flex: 1, background: '#3483fa', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '700', cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.7 : 1 }}
              >
                {isCreating ? 'Creando...' : 'Crear Proyecto'}
              </button>
              <button onClick={() => setShowCreateModal(false)} style={{ background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '8px', padding: '12px 18px', fontSize: '14px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
