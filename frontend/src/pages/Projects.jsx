import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, LogOut, Trash2, X } from 'lucide-react';
import '../index.css';

function Projects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('tropica_user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Cargar proyectos de la DB
      fetch('http://localhost:4000/api/projects', {
        headers: { 'Authorization': `Bearer ${parsedUser.token}` }
      })
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error(err));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('tropica_user');
    navigate('/login');
  };

  const handleNewProject = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ title: 'Nueva Landing' })
      });
      const newProject = await response.json();
      navigate(`/editor/${newProject.id}`);
    } catch (err) {
      console.error('Error al crear proyecto:', err);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== `delete ${projectToDelete.title}`) return;
    
    try {
      await fetch(`http://localhost:4000/api/projects/${projectToDelete.id}`, {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo__small_v2.png" alt="Logo" style={{ height: '30px' }} />
            <h1 style={{ fontSize: '24px', color: '#333', margin: 0 }}>Mis Proyectos</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#3483fa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
              <span style={{ color: '#666', fontWeight: '500' }}>{user.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
            >
              <LogOut size={18} /> Salir
            </button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
          
          {/* New Project Card */}
          <div 
            onClick={handleNewProject}
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
    </div>
  );
}

export default Projects;
