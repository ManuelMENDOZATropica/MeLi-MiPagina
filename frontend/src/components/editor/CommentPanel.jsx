import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function CommentPanel({
  elementId, elementName,
  comments, projectCollabs, replyingTo, setReplyingTo,
  commentInputs, setCommentInputs,
  mentionQuery, setMentionQuery,
  onClose, onSubmit, onResolve, onDelete, onException,
  getCollabColor,
}) {
  const elComments = comments.filter(c => c.elementId === elementId);
  const inputKey = 'new_' + elementId;
  const inputVal = commentInputs[inputKey] || '';
  const currentUserId = JSON.parse(localStorage.getItem('tropica_user'))?.user?.id;
  const [exceptionForm, setExceptionForm] = useState(null);
  const [exWord, setExWord] = useState('');
  const [exReason, setExReason] = useState('');
  const [exLoading, setExLoading] = useState(false);

  const handleInput = (e) => {
    const val = e.target.value;
    setCommentInputs(prev => ({ ...prev, [inputKey]: val }));
    const match = val.match(/@([\w\s]*)$/);
    if (match) setMentionQuery({ field: inputKey, query: match[1] });
    else setMentionQuery(null);
  };

  const filteredCollabs = mentionQuery && mentionQuery.field === inputKey
    ? projectCollabs.filter(c =>
        c.id !== currentUserId &&
        (c.name || '').toLowerCase().includes(mentionQuery.query.toLowerCase())
      )
    : [];

  const insertMention = (collab) => {
    const val = inputVal.replace(/@([\w\s]*)$/, `@${collab.name} `);
    setCommentInputs(prev => ({ ...prev, [inputKey]: val }));
    setMentionQuery(null);
  };

  return (
    <div style={{
      position: 'absolute', top: '12px', left: '12px', width: '320px',
      background: 'rgba(255,255,255,0.97)', borderRadius: '14px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)',
      border: '1px solid rgba(224,229,239,0.8)', backdropFilter: 'blur(12px)',
      zIndex: 500, overflow: 'hidden', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{ background: '#1a1f2e', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>💬 {elementName}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>✕</button>
      </div>

      {/* Lista de comentarios */}
      <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '10px' }}>
        {elComments.length === 0 && (
          <p style={{ color: '#9ba3b5', fontSize: '12px', textAlign: 'center', margin: '16px 0' }}>Sin comentarios aún</p>
        )}
        {elComments.map(comment => (
          <div key={comment.id} style={{
            marginBottom: '12px', opacity: comment.resolved ? 0.55 : 1,
            background: comment.resolved ? '#f4f6fb' : 'white',
            borderRadius: '8px', border: '1px solid #e8ecf4', padding: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: getCollabColor(comment.author.id) || '#ddd', color: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', overflow: 'hidden', flexShrink: 0 }}>
                {comment.author.avatar ? <img src={comment.author.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (comment.author.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1a1f2e' }}>{comment.author.name || comment.author.email}</span>
              <span style={{ fontSize: '10px', color: '#b0b9cc', marginLeft: 'auto' }}>
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#2d3548', margin: '0 0 8px', lineHeight: '1.5' }}>
              <ReactMarkdown components={{
                p: ({children}) => <p style={{ margin: '0 0 4px' }}>{children}</p>,
                strong: ({children}) => <strong style={{ fontWeight: '700', color: '#1a1f2e' }}>{children}</strong>,
                ol: ({children}) => <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>,
                ul: ({children}) => <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>,
                li: ({children}) => <li style={{ marginBottom: '2px' }}>{children}</li>,
              }}>{comment.text}</ReactMarkdown>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                style={{ fontSize: '11px', color: '#3483fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0' }}>↩ Responder</button>
              <button onClick={() => onResolve(comment.id)}
                style={{ fontSize: '11px', color: comment.resolved ? '#10b981' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0' }}>
                {comment.resolved ? '✓ Resuelto' : '✓ Resolver'}
              </button>
              {comment.author.email === 'maia@tropica.me' && !comment.resolved && (
                <button
                  onClick={() => { setExceptionForm(exceptionForm === comment.id ? null : comment.id); setExWord(''); setExReason(''); }}
                  style={{ fontSize: '11px', color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0' }}>✦ Excepción</button>
              )}
              {comment.author.id === currentUserId && (
                <button onClick={() => onDelete(comment.id)}
                  style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0', marginLeft: 'auto' }}>🗑</button>
              )}
            </div>

            {/* Formulario inline de excepción */}
            {exceptionForm === comment.id && (
              <div style={{ marginTop: '10px', background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>✦ Crear excepción creativa</p>
                <input value={exWord} onChange={e => setExWord(e.target.value)} placeholder='Palabra/frase exacta (ej: "Protecciónn")'
                  style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '6px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = '#ddd6fe'} />
                <input value={exReason} onChange={e => setExReason(e.target.value)} placeholder='Razón creativa (opcional)'
                  style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = '#ddd6fe'} />
                <button disabled={!exWord.trim() || exLoading}
                  onClick={async () => {
                    if (!exWord.trim()) return;
                    setExLoading(true);
                    await onException(comment.id, exWord, exReason);
                    setExLoading(false);
                    setExceptionForm(null);
                  }}
                  style={{ width: '100%', background: exLoading ? '#c4b5fd' : '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: '800', cursor: exLoading ? 'wait' : 'pointer', letterSpacing: '0.04em' }}>
                  {exLoading ? 'Verificando con MAIA...' : 'Guardar excepción'}
                </button>
              </div>
            )}

            {/* Respuestas */}
            {(comment.replies || []).length > 0 && (
              <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid #e8ecf4' }}>
                {comment.replies.map(reply => (
                  <div key={reply.id} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: getCollabColor(reply.author.id) || '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', overflow: 'hidden', flexShrink: 0 }}>
                        {reply.author.avatar ? <img src={reply.author.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (reply.author.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a1f2e' }}>{reply.author.name || reply.author.email}</span>
                      {reply.author.id === currentUserId && (
                        <button onClick={() => onDelete(reply.id, comment.id)}
                          style={{ fontSize: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', padding: 0 }}>🗑</button>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#2d3548', margin: 0, lineHeight: '1.4' }}>
                      <ReactMarkdown components={{
                        p: ({children}) => <p style={{ margin: '0 0 2px' }}>{children}</p>,
                        strong: ({children}) => <strong style={{ fontWeight: '700' }}>{children}</strong>,
                        ol: ({children}) => <ol style={{ margin: '2px 0', paddingLeft: '16px' }}>{children}</ol>,
                        ul: ({children}) => <ul style={{ margin: '2px 0', paddingLeft: '16px' }}>{children}</ul>,
                        li: ({children}) => <li style={{ marginBottom: '1px' }}>{children}</li>,
                      }}>{reply.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input de respuesta */}
            {replyingTo === comment.id && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                <input autoFocus value={commentInputs[comment.id] || ''}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(elementId, comment.id); } }}
                  placeholder="Responder..."
                  style={{ flex: 1, fontSize: '12px', border: '1.5px solid #3483fa', borderRadius: '6px', padding: '5px 8px', outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={() => onSubmit(elementId, comment.id)}
                  style={{ background: '#3483fa', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>↩</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input nuevo comentario */}
      <div style={{ padding: '10px', borderTop: '1px solid #e8ecf4', position: 'relative' }}>
        {filteredCollabs.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: '10px', right: '10px', background: 'white', border: '1px solid #e0e5ef', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 600 }}>
            {filteredCollabs.map(c => (
              <div key={c.id} onClick={() => insertMention(c)}
                style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f6fb'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', color: c.color === '#fff159' ? '#1a1f2e' : 'white' }}>
                  {(c.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: '600', color: '#1a1f2e' }}>{c.name}</span>
                <span style={{ color: '#9ba3b5', fontSize: '11px' }}>{c.email}</span>
              </div>
            ))}
          </div>
        )}
        <textarea value={inputVal} onChange={handleInput}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(elementId); } }}
          placeholder="Comentar... (@ para mencionar, Enter para enviar)"
          rows={2}
          style={{ width: '100%', fontSize: '13px', border: '1.5px solid #e0e5ef', borderRadius: '8px', padding: '8px 10px', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#3483fa'} onBlur={e => e.target.style.borderColor = '#e0e5ef'} />
        <button onClick={() => onSubmit(elementId)}
          style={{ marginTop: '6px', width: '100%', background: '#1a1f2e', color: '#fff159', border: 'none', borderRadius: '7px', padding: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#252c3f'}
          onMouseLeave={e => e.currentTarget.style.background = '#1a1f2e'}>Enviar comentario</button>
      </div>
    </div>
  );
}
