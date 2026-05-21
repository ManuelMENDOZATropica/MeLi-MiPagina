import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, LogOut, Trash2, X, Monitor, Smartphone } from 'lucide-react';
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
  const [users, setUsers] = useState([]);
  const [selectedEditors, setSelectedEditors] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('tropica_user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetch(`${API_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${parsedUser.token}` }
      })
      .then(res => { if (!res.ok) throw new Error(`Error ${res.status}`); return res.json(); })
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando proyectos:', err));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('tropica_user');
    navigate('/login');
  };

  const handleOpenCreateModal = async () => {
    setNewProjectName('');
    setCreateError('');
    setSelectedEditors([]);
    setShowCreateModal(true);

    // Leer token directamente del localStorage para evitar problemas de estado
    const saved = localStorage.getItem('tropica_user');
    const parsed = saved ? JSON.parse(saved) : null;
    const token = parsed?.token;

    if (!token) {
      console.error('No hay token en localStorage');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Error al obtener usuarios:', response.status, err);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleNewProject = async () => {
    const name = newProjectName.trim();
    if (name.length < 2) { setCreateError('El nombre debe tener al menos 2 caracteres.'); return; }
    setIsCreating(true);
    const token = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: name, editorIds: selectedEditors })
      });
      const newProject = await response.json();
      navigate(`/editor/${newProject.id}`);
    } catch (err) {
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
    } catch (err) { console.error('Error al eliminar proyecto:', err); }
  };

  const getTypeLabel = (proj) => {
    const d = new Date(proj.updatedAt);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (!user) return null;

  const avatarSrc = user.user?.picture || user.user?.avatar || user.avatar;
  const displayName = user.user?.name || user.name || '';
  const displayEmail = user.user?.email || user.email || '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');
        .proj-root { min-height: 100vh; background: #dfe4ec; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }

        /* TOP NAV */
        .proj-nav {
          background: #1a1f2e;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          flex-shrink: 0;
        }
        .proj-nav-left { display: flex; align-items: center; gap: 12px; }
        .proj-nav-mark { width: 6px; height: 28px; background: #fff159; border-radius: 2px; }
        .proj-nav-title { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: 0.06em; text-transform: uppercase; }
        .proj-nav-right { display: flex; align-items: center; gap: 14px; }
        .proj-user-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); }
        .proj-logout-btn {
          background: transparent; border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 600;
          padding: 5px 12px; cursor: pointer; display: flex; align-items: center;
          gap: 5px; transition: all 0.18s; font-family: 'Inter', sans-serif;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .proj-logout-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }

        /* BODY */
        .proj-body { flex: 1; padding: 40px 48px; max-width: 1320px; width: 100%; margin: 0 auto; box-sizing: border-box; }

        /* PAGE HEADER */
        .proj-page-header { margin-bottom: 32px; }
        .proj-page-header h1 { font-size: 32px; font-weight: 900; color: #1a1f2e; letter-spacing: -1px; margin: 0 0 4px; }
        .proj-page-header p { font-size: 13px; color: #6b7280; margin: 0; }

        /* GRID */
        .proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

        /* NEW PROJECT CARD */
        .proj-card-new {
          background: rgba(255,255,255,0.5);
          border: 2px dashed #b0b9cc;
          border-radius: 14px;
          min-height: 200px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1);
          color: #6b7280; gap: 10px;
        }
        .proj-card-new:hover { background: rgba(255,255,255,0.85); border-color: #3483fa; color: #3483fa; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(52,131,250,0.12); }
        .proj-card-new-icon { width: 48px; height: 48px; border-radius: 10px; border: 2px dashed currentColor; display: flex; align-items: center; justify-content: center; }
        .proj-card-new-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

        /* PROJECT CARD */
        .proj-card {
          background: white;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e0e5ef;
          position: relative;
        }
        .proj-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.11); border-color: #3483fa; }

        .proj-card-thumb {
          height: 130px;
          background: linear-gradient(135deg, #1a1f2e 0%, #2d3548 60%, #1a1f2e 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .proj-card-thumb-pattern {
          position: absolute; inset: 0; opacity: 0.06;
          background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .proj-card-thumb-accent { width: 36px; height: 4px; background: #fff159; border-radius: 2px; position: relative; z-index: 1; }

        .proj-card-delete {
          position: absolute; top: 10px; right: 10px;
          background: rgba(0,0,0,0.4); border: none; color: #ff7b70;
          width: 30px; height: 30px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: 0; transition: opacity 0.18s;
          backdrop-filter: blur(4px);
        }
        .proj-card:hover .proj-card-delete { opacity: 1; }

        .proj-card-body { padding: 16px 18px; }
        .proj-card-name { font-size: 15px; font-weight: 700; color: #1a1f2e; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .proj-card-meta { font-size: 11px; color: #9ba3b5; text-transform: uppercase; letter-spacing: 0.05em; }

        /* MODAL */
        .proj-modal-bg { position: fixed; inset: 0; background: rgba(15,18,30,0.65); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .proj-modal { background: white; border-radius: 16px; padding: 32px; width: 420px; box-shadow: 0 24px 60px rgba(0,0,0,0.25); position: relative; }
        .proj-modal-title { font-size: 20px; font-weight: 800; color: #1a1f2e; margin: 0 0 4px; letter-spacing: -0.4px; }
        .proj-modal-sub { font-size: 13px; color: #9ba3b5; margin: 0 0 24px; }
        .proj-modal-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #9ba3b5; display: block; margin-bottom: 6px; }
        .proj-modal-input {
          width: 100%; padding: 12px 14px; border: 1.5px solid #e0e5ef;
          font-size: 15px; font-family: 'Inter', sans-serif; color: #1a1f2e;
          outline: none; transition: border-color 0.18s; box-sizing: border-box;
          background: #f8f9fc;
        }
        .proj-modal-input:focus { border-color: #3483fa; background: white; }
        .proj-modal-error { color: #e74c3c; font-size: 12px; margin: 6px 0 0; }
        .proj-modal-hint { color: #b0b9cc; font-size: 11px; margin: 6px 0 0; }
        .proj-modal-actions { display: flex; gap: 10px; margin-top: 24px; }
        .proj-btn-primary {
          flex: 1; background: #1a1f2e; color: #fff159; border: none;
          padding: 13px; font-size: 13px; font-weight: 800; font-family: 'Inter', sans-serif;
          cursor: pointer; text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.18s;
          display: flex; align-items: center; justify-content: space-between;
        }
        .proj-btn-primary:hover:not(:disabled) { background: #252c3f; }
        .proj-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .proj-btn-secondary {
          background: #f4f6fb; color: #6b7280; border: none;
          padding: 13px 18px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .proj-btn-secondary:hover { background: #e8ecf4; }

        /* DELETE MODAL */
        .proj-delete-title { font-size: 18px; font-weight: 800; color: #e74c3c; margin: 0 0 4px; }
        .proj-delete-sub { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0 0 20px; }
        .proj-btn-danger {
          flex: 1; background: #e74c3c; color: white; border: none;
          padding: 11px; font-size: 13px; font-weight: 800; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .proj-btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }
        .proj-btn-danger:hover:not(:disabled) { background: #c0392b; }
      `}</style>

      <div className="proj-root">
        {/* NAV */}
        <nav className="proj-nav">
          <div className="proj-nav-left">
            <div className="proj-nav-mark" />
            <span className="proj-nav-title">Landing Builder</span>
          </div>
          <div className="proj-nav-right">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff159' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff159', color: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                {(displayName || displayEmail || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {displayName && <span className="proj-user-name">{displayName}</span>}
            <button className="proj-logout-btn" onClick={handleLogout}>
              <LogOut size={13} /> Salir
            </button>
          </div>
        </nav>

        {/* BODY */}
        <div className="proj-body">
          <div className="proj-page-header">
            <h1>Mis Proyectos</h1>
            <p>{projects.length} proyecto{projects.length !== 1 ? 's' : ''} · Trópica Landing Builder</p>
          </div>

          <div className="proj-grid">
            {/* New Project */}
            <div className="proj-card-new" onClick={handleOpenCreateModal}>
              <div className="proj-card-new-icon"><Plus size={22} /></div>
              <span className="proj-card-new-label">Nuevo Proyecto</span>
            </div>

            {/* Existing projects */}
            {projects.map(proj => (
              <div key={proj.id} className="proj-card" onClick={() => navigate(`/editor/${proj.id}`)}>
                <div className="proj-card-thumb">
                  <div className="proj-card-thumb-pattern" />
                  <div className="proj-card-thumb-accent" />
                  {proj.userId === (user.user?.id || user.id) && (
                    <button
                      className="proj-card-delete"
                      onClick={e => { e.stopPropagation(); setProjectToDelete(proj); setDeleteConfirmText(''); }}
                      title="Eliminar proyecto"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="proj-card-body">
                  <p className="proj-card-name">{proj.title}</p>
                  <p className="proj-card-meta">{getTypeLabel(proj)}</p>
                  
                  {/* Collaborators / Ownership info */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '24px' }}>
                    {proj.userId === (user.user?.id || user.id) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#3483fa', background: '#e6f0ff', padding: '3px 8px', borderRadius: '10px' }}>Propietario</span>
                        {proj.editors && proj.editors.length > 0 && (
                          <div style={{ display: 'flex', marginLeft: '6px' }}>
                            {proj.editors.slice(0, 3).map((ed, idx) => (
                              <div key={ed.user.id} title={ed.user.name || ed.user.email} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid white', marginLeft: idx > 0 ? '-8px' : '0', zIndex: 3 - idx, background: '#fff159', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', overflow: 'hidden' }}>
                                {ed.user.avatar ? <img src={ed.user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (ed.user.name || ed.user.email || 'U').charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {proj.editors.length > 3 && <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid white', marginLeft: '-8px', background: '#e0e5ef', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', zIndex: 0 }}>+{proj.editors.length - 3}</div>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#e74c3c', background: '#fcebea', padding: '3px 8px', borderRadius: '10px' }}>Editor</span>
                        {proj.user && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                            <span>de</span>
                            <div title={proj.user.name || proj.user.email} style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff159', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', overflow: 'hidden' }}>
                              {proj.user.avatar ? <img src={proj.user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (proj.user.name || proj.user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.user.name || proj.user.email.split('@')[0]}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DELETE MODAL */}
        {projectToDelete && (
          <div className="proj-modal-bg" onClick={() => setProjectToDelete(null)}>
            <div className="proj-modal" onClick={e => e.stopPropagation()}>
              <button onClick={() => setProjectToDelete(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={20} /></button>
              <p className="proj-delete-title">Eliminar Proyecto</p>
              <p className="proj-delete-sub">Esta acción no se puede deshacer. Escribe <strong>delete {projectToDelete.title}</strong> para confirmar.</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={`delete ${projectToDelete.title}`}
                className="proj-modal-input"
                autoFocus
                style={{ marginBottom: '16px' }}
              />
              <div className="proj-modal-actions">
                <button onClick={() => setProjectToDelete(null)} className="proj-btn-secondary">Cancelar</button>
                <button
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmText !== `delete ${projectToDelete.title}`}
                  className="proj-btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE MODAL */}
        {showCreateModal && (
          <div className="proj-modal-bg" onClick={() => setShowCreateModal(false)}>
            <div className="proj-modal" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={20} /></button>
              <p className="proj-modal-title">Nuevo Proyecto</p>
              <p className="proj-modal-sub">Dale un nombre claro a tu landing page.</p>
              <label className="proj-modal-label">Nombre del proyecto</label>
              <input
                autoFocus
                type="text"
                value={newProjectName}
                onChange={e => { setNewProjectName(e.target.value); setCreateError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleNewProject()}
                placeholder="Ej: Landing Verano 2026"
                maxLength={80}
                className="proj-modal-input"
              />
              {createError ? <p className="proj-modal-error">{createError}</p> : <p className="proj-modal-hint">Mínimo 2 · Máximo 80 caracteres</p>}
              
              <label className="proj-modal-label" style={{ marginTop: '20px' }}>Compartir con editores (Opcional)</label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1.5px solid #e0e5ef', borderRadius: '8px', padding: '6px', background: '#f8f9fc', marginBottom: '8px' }}>
                {users.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#9ba3b5', textAlign: 'center', margin: '20px 0' }}>No hay otros usuarios disponibles.</p>
                ) : (
                  users.map(u => (
                    <div 
                      key={u.id}
                      onClick={() => {
                        setSelectedEditors(prev => 
                          prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                        );
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
                        cursor: 'pointer', borderRadius: '6px',
                        background: selectedEditors.includes(u.id) ? '#e6f0ff' : 'transparent',
                        border: selectedEditors.includes(u.id) ? '1px solid #3483fa' : '1px solid transparent',
                        marginBottom: '4px', transition: 'all 0.15s'
                      }}
                    >
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff159', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                          {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1f2e' }}>{u.name || 'Usuario'}</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{u.email}</span>
                      </div>
                      {selectedEditors.includes(u.id) && <div style={{ marginLeft: 'auto', color: '#3483fa', fontWeight: 'bold' }}>✓</div>}
                    </div>
                  ))
                )}
              </div>
              <div className="proj-modal-actions">
                <button onClick={() => setShowCreateModal(false)} className="proj-btn-secondary">Cancelar</button>
                <button onClick={handleNewProject} disabled={isCreating} className="proj-btn-primary">
                  <span>{isCreating ? 'Creando…' : 'Crear Proyecto'}</span>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Projects;
