import React from 'react';

export function MaiaPanel({
  onClose,
  exceptions,
  newExWord, setNewExWord,
  newExReason, setNewExReason,
  newExLoading,
  addException,
  editingExId, setEditingExId,
  editWord, setEditWord,
  editReason, setEditReason,
  editException,
  deleteException,
}) {
  return (
    <div style={{ position: 'absolute', top: '44px', right: 0, width: '320px', background: 'white', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', border: '1px solid #e0e5ef', zIndex: 9999, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#1a1f2e', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/MAIA.png" alt="MAIA" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #8b5cf6' }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '13px' }}>Excepciones creativas</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Palabras que MAIA no marca como error</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>

      {/* Form agregar */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f7', background: '#faf5ff' }}>
        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>+ Agregar excepción</p>
        <input value={newExWord} onChange={e => setNewExWord(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addException(); }}
          placeholder='Palabra exacta (ej: "Ofertass")'
          style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '6px', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' }}
          onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = '#ddd6fe'} />
        <input value={newExReason} onChange={e => setNewExReason(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addException(); }}
          placeholder='Razón creativa (opcional)'
          style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' }}
          onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = '#ddd6fe'} />
        <button disabled={!newExWord.trim() || newExLoading} onClick={addException}
          style={{ width: '100%', background: !newExWord.trim() ? '#ede9fe' : '#7c3aed', color: !newExWord.trim() ? '#a78bfa' : 'white', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: '800', cursor: newExWord.trim() ? 'pointer' : 'default', transition: 'all 0.15s' }}>
          {newExLoading ? 'Guardando...' : 'Guardar excepción'}
        </button>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {exceptions.length === 0 ? (
          <p style={{ color: '#9ba3b5', fontSize: '12px', textAlign: 'center', padding: '20px 16px', margin: 0 }}>Sin excepciones registradas</p>
        ) : exceptions.map(ex => (
          <div key={ex.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f0f2f7' }}>
            {editingExId === ex.id ? (
              <div>
                <input value={editWord} onChange={e => setEditWord(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') editException(ex.id); if (e.key === 'Escape') setEditingExId(null); }}
                  style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace', border: '1.5px solid #8b5cf6', borderRadius: '6px', padding: '5px 8px', outline: 'none', marginBottom: '5px', boxSizing: 'border-box' }} />
                <input value={editReason} onChange={e => setEditReason(e.target.value)}
                  placeholder='Razón creativa (opcional)'
                  onKeyDown={e => { if (e.key === 'Enter') editException(ex.id); if (e.key === 'Escape') setEditingExId(null); }}
                  style={{ width: '100%', fontSize: '11px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '5px 8px', outline: 'none', marginBottom: '7px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = '#ddd6fe'} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => editException(ex.id)} disabled={!editWord.trim()}
                    style={{ flex: 1, background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>Guardar</button>
                  <button onClick={() => setEditingExId(null)}
                    style={{ flex: 1, background: '#f0f2f7', color: '#6b7280', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1a1f2e', fontFamily: 'monospace' }}>«{ex.word}»</p>
                  {ex.reason && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>{ex.reason}</p>}
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#b0b9cc' }}>{new Date(ex.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <button onClick={() => { setEditingExId(ex.id); setEditWord(ex.word); setEditReason(ex.reason || ''); }} title="Editar excepción"
                  style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', borderRadius: '4px', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>✏</button>
                <button onClick={() => deleteException(ex.id)} title="Eliminar excepción"
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', flexShrink: 0, borderRadius: '4px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>🗑</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
