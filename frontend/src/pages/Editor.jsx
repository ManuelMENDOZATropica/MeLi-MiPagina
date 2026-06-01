import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Monitor, Smartphone, GripVertical, Trash2, Image as ImageIcon, Layout, Type, Video, Search, MapPin, Tag, ChevronDown, Bell, ShoppingCart, User, AlignCenter, MoveHorizontal, ListMinus, AlignJustify, CornerDownLeft, ArrowLeft, CheckCircle2, Play, Edit3, Eye, EyeOff, Layers, Grid, Settings, ArrowRight, FileDown } from 'lucide-react';
import { componentsList } from '../componentsData';
import API_URL from '../api';
import '../index.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import { useExceptions } from '../hooks/useExceptions';
import { useComments } from '../hooks/useComments';
import { useNotifications } from '../hooks/useNotifications';
import { useSocket } from '../hooks/useSocket';

// Paleta de colores por colaborador (owner = índice 0)
const COLLAB_COLORS = [
  '#fff159', // owner → amarillo MeLi
  '#3483fa', // azul
  '#10b981', // verde
  '#f59e0b', // naranja
  '#ec4899', // rosa
  '#8b5cf6', // violeta
  '#06b6d4', // cyan
  '#ef4444', // rojo
];

// ─────────────────────────────────────────────────────────────────────────────
// CommentPanel: componente externo (NO dentro de Editor) para evitar remount
// ─────────────────────────────────────────────────────────────────────────────
function CommentPanel({
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
  const [exceptionForm, setExceptionForm] = useState(null); // commentId | null
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
      position: 'absolute',
      top: '12px', left: '12px',
      width: '320px',
      background: 'rgba(255,255,255,0.97)',
      borderRadius: '14px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)',
      border: '1px solid rgba(224,229,239,0.8)',
      backdropFilter: 'blur(12px)',
      zIndex: 500, overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
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
              <ReactMarkdown
                components={{
                  p: ({children}) => <p style={{ margin: '0 0 4px' }}>{children}</p>,
                  strong: ({children}) => <strong style={{ fontWeight: '700', color: '#1a1f2e' }}>{children}</strong>,
                  ol: ({children}) => <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>,
                  ul: ({children}) => <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>,
                  li: ({children}) => <li style={{ marginBottom: '2px' }}>{children}</li>,
                }}
              >{comment.text}</ReactMarkdown>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                style={{ fontSize: '11px', color: '#3483fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0' }}>↩ Responder</button>
              <button onClick={() => onResolve(comment.id)}
                style={{ fontSize: '11px', color: comment.resolved ? '#10b981' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0' }}>
                {comment.resolved ? '✓ Resuelto' : '✓ Resolver'}
              </button>
              {/* Botón Crear excepción — solo en comentarios de MAIA */}
              {comment.author.email === 'maia@tropica.me' && !comment.resolved && (
                <button
                  onClick={() => { setExceptionForm(exceptionForm === comment.id ? null : comment.id); setExWord(''); setExReason(''); }}
                  style={{ fontSize: '11px', color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0' }}
                >✦ Excepción</button>
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
                <input
                  value={exWord}
                  onChange={e => setExWord(e.target.value)}
                  placeholder='Palabra/frase exacta (ej: "Protecciónn")'
                  style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '6px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = '#ddd6fe'}
                />
                <input
                  value={exReason}
                  onChange={e => setExReason(e.target.value)}
                  placeholder='Razón creativa (opcional)'
                  style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = '#ddd6fe'}
                />
                <button
                  disabled={!exWord.trim() || exLoading}
                  onClick={async () => {
                    if (!exWord.trim()) return;
                    setExLoading(true);
                    await onException(comment.id, exWord, exReason);
                    setExLoading(false);
                    setExceptionForm(null);
                  }}
                  style={{ width: '100%', background: exLoading ? '#c4b5fd' : '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: '800', cursor: exLoading ? 'wait' : 'pointer', letterSpacing: '0.04em' }}
                >{exLoading ? 'Verificando con MAIA...' : 'Guardar excepción'}</button>
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
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p style={{ margin: '0 0 2px' }}>{children}</p>,
                          strong: ({children}) => <strong style={{ fontWeight: '700' }}>{children}</strong>,
                          ol: ({children}) => <ol style={{ margin: '2px 0', paddingLeft: '16px' }}>{children}</ol>,
                          ul: ({children}) => <ul style={{ margin: '2px 0', paddingLeft: '16px' }}>{children}</ul>,
                          li: ({children}) => <li style={{ marginBottom: '1px' }}>{children}</li>,
                        }}
                      >{reply.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input de respuesta */}
            {replyingTo === comment.id && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                <input
                  autoFocus
                  value={commentInputs[comment.id] || ''}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(elementId, comment.id); } }}
                  placeholder="Responder..."
                  style={{ flex: 1, fontSize: '12px', border: '1.5px solid #3483fa', borderRadius: '6px', padding: '5px 8px', outline: 'none', fontFamily: 'inherit' }}
                />
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
        <textarea
          value={inputVal}
          onChange={handleInput}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(elementId); } }}
          placeholder="Comentar... (@ para mencionar, Enter para enviar)"
          rows={2}
          style={{ width: '100%', fontSize: '13px', border: '1.5px solid #e0e5ef', borderRadius: '8px', padding: '8px 10px', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#3483fa'}
          onBlur={e => e.target.style.borderColor = '#e0e5ef'}
        />
        <button onClick={() => onSubmit(elementId)}
          style={{ marginTop: '6px', width: '100%', background: '#1a1f2e', color: '#fff159', border: 'none', borderRadius: '7px', padding: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#252c3f'}
          onMouseLeave={e => e.currentTarget.style.background = '#1a1f2e'}
        >Enviar comentario</button>
      </div>
    </div>
  );
}




// Helper icon selector
const getIcon = (type) => {
  switch (type) {
    case 'header': return <Layout size={20} />;
    case 'logo': return <ImageIcon size={20} />;
    case 'banner': return <ImageIcon size={20} />;
    case 'list': return <Type size={20} />;
    case 'carousel': return <Layout size={20} />;
    case 'gallery': return <Layout size={20} />;
    case 'video': return <Video size={20} />;
    case 'spacer': return <ListMinus size={20} />;
    case 'text_block': return <Type size={20} />;
    case 'product_card': return <ShoppingCart size={20} />;
    default: return <Layout size={20} />;
  }
};

const AnimatedBanner = ({ item, isPreviewMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const validImages = (item?.uploadedImages || []).filter(Boolean);
  const images = validImages.length > 0 ? validImages : [
    "https://http2.mlstatic.com/D_NQ_853512-MLA75916035059_042024-OO.webp",
    "https://http2.mlstatic.com/D_NQ_938676-MLA75908076632_042024-OO.webp"
  ];

  // Auto-advance SOLO en preview/publicado, NO en editor
  useEffect(() => {
    if (!isPreviewMode || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length, isPreviewMode]);

  const goTo = (e, idx) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((idx + images.length) % images.length);
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Track que se desliza a la izquierda */}
      <div style={{
        display: 'flex',
        width: `${images.length * 100}%`,
        height: '100%',
        transform: `translateX(-${currentIndex * (100 / images.length)}%)`,
        transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: 'transform',
      }}>
        {images.map((img, idx) => (
          <div key={idx} style={{
            width: `${100 / images.length}%`,
            height: '100%',
            flexShrink: 0,
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }} />
        ))}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 20, pointerEvents: 'auto' }}>
          {images.map((_, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onClick={(e) => goTo(e, idx)}
              style={{
                width: currentIndex === idx ? '20px' : '8px',
                height: '8px',
                borderRadius: currentIndex === idx ? '4px' : '50%',
                backgroundColor: currentIndex === idx ? '#3483fa' : 'rgba(255,255,255,0.75)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* Flechas prev / next */}
      {images.length > 1 && (
        <>
          <button
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onClick={(e) => goTo(e, currentIndex - 1)}
            style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: '22px', color: '#333', lineHeight: 1, pointerEvents: 'auto',
            }}
          >‹</button>
          <button
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onClick={(e) => goTo(e, currentIndex + 1)}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: '22px', color: '#333', lineHeight: 1, pointerEvents: 'auto',
            }}
          >›</button>
        </>
      )}
    </div>
  );
};

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [projectTitle, setProjectTitle] = useState('Cargando Proyecto...');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [maiaCheckState, setMaiaCheckState] = useState(null); // null | 'checking' | { errors } | 'ok'
  const [maiaCheckItems, setMaiaCheckItems] = useState([]); // [{name, status:'pending'|'ok'|'error', msg}]
  const [textEditorPanel, setTextEditorPanel] = useState(null); // { item, x, y }
  const [projectCollabs, setProjectCollabs] = useState([]); // [{id,name,email,avatar,color}]
  const [showAddCollab, setShowAddCollab] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [collabSearch, setCollabSearch] = useState('');
  const [collabError, setCollabError] = useState('');

  // Excepciones creativas de MAIA (declarar ANTES que useComments para pasar setExceptions)
  const {
    exceptions, setExceptions,
    showMaiaPanel, setShowMaiaPanel,
    newExWord, setNewExWord,
    newExReason, setNewExReason,
    newExLoading,
    editingExId, setEditingExId,
    editWord, setEditWord,
    editReason, setEditReason,
    addException, deleteException, editException
  } = useExceptions({ projectId: id });

  // Sistema de comentarios
  const [activeCommentElId, setActiveCommentElId] = useState(null);
  const {
    comments, setComments,
    commentInputs, setCommentInputs,
    replyingTo, setReplyingTo,
    mentionQuery, setMentionQuery,
    submitComment, resolveComment, deleteComment, handleException
  } = useComments({ projectId: id, token, setExceptions });

  // Notificaciones
  const {
    notifications, setNotifications,
    showNotifPanel, setShowNotifPanel,
    markNotifsRead
  } = useNotifications();

  // Global Upload State
  const [uploadTargetId, setUploadTargetId] = useState(null);
  const [uploadIndex, setUploadIndex] = useState(0);
  const fileInputRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const canvasScrollRef = useRef(null); // scroll container del canvas
  const [isExporting, setIsExporting] = useState(false);

  const [isHoveringText, setIsHoveringText] = useState(false);
  const [editingField, setEditingField] = useState({ id: null, field: null });
  const [textResizing, setTextResizing] = useState(null); // { id, dir, startX, startY, startW, startH }

  const [viewMode, setViewMode] = useState('desktop');
  const [canvases, setCanvases] = useState({ desktop: [], mobile: [] });
  const canvasItems = canvases[viewMode];

  const isInitialLoad = useRef(true);

  // Carga inicial del proyecto
  useEffect(() => {
    const savedUser = localStorage.getItem('tropica_user');
    if (!savedUser) {
      navigate('/login', { state: { from: `/editor/${id}` } });
    } else {
      const parsed = JSON.parse(savedUser);
      setUser(parsed.user);
      setToken(parsed.token);

      fetch(`${API_URL}/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('No se pudo cargar el proyecto');
          return res.json();
        })
        .then(data => {
          setProjectTitle(data.title);
          setCanvases({
            desktop: Array.isArray(data.desktopLayout) ? data.desktopLayout : [],
            mobile: Array.isArray(data.mobileLayout) ? data.mobileLayout : []
          });
          setIsPublished(data.isPublished || false);
          if (data.slug) setPublishedSlug(data.slug);
          // Construir lista de colaboradores con colores asignados
          const collabs = [
            data.user ? { ...data.user, color: COLLAB_COLORS[0] } : null,
            ...((data.editors || []).map((e, i) => ({
              ...e.user,
              color: COLLAB_COLORS[(i + 1) % COLLAB_COLORS.length]
            })))
          ].filter(Boolean);
          setProjectCollabs(collabs);
          // Esperamos un momento para que el setState no dispare el AutoGuardado
          setTimeout(() => { isInitialLoad.current = false; }, 1000);
        })
        .catch(err => {
          console.error(err);
          navigate('/projects');
        });

      // Cargar comentarios del proyecto
      fetch(`${API_URL}/api/projects/${id}/comments`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      }).then(r => r.ok ? r.json() : []).then(data => setComments(Array.isArray(data) ? data : []));

      // Cargar notificaciones
      fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      }).then(r => r.ok ? r.json() : []).then(data => setNotifications(Array.isArray(data) ? data : []));

      // Cargar excepciones creativas del proyecto
      fetch(`${API_URL}/api/projects/${id}/exceptions`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      }).then(r => r.ok ? r.json() : []).then(data => setExceptions(Array.isArray(data) ? data : []));

      // Cargar todos los usuarios disponibles (para el + de colaboradores)
      fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      }).then(r => r.ok ? r.json() : []).then(data => setAllUsers(Array.isArray(data) ? data : []));
    }
  }, [id, navigate]);

  // Socket.io: tiempo real (canvas + comentarios + notificaciones + excepciones)
  const socketRef = useSocket({
    projectId: id, token,
    setComments, setNotifications, setExceptions,
    setCanvases, setProjectTitle,
  });

  // Autoguardado silencioso con Debounce (espera 1.5s sin cambios para guardar)
  useEffect(() => {
    if (isInitialLoad.current || !token) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      fetch(`${API_URL}/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(socketRef.current?.id ? { 'X-Socket-Id': socketRef.current.id } : {})
        },
        body: JSON.stringify({
          title: projectTitle,
          desktopLayout: canvases.desktop,
          mobileLayout: canvases.mobile
        })
      })
        .then(res => res.json())
        .then(() => {
          setTimeout(() => {
            setIsSaving(false);
            setLastSaved(new Date());
          }, 500);
        })
        .catch(err => console.error('Error auto-guardando:', err));
    }, 1500);

    return () => clearTimeout(timer);
  }, [canvases, projectTitle, token, id]);


  const setCanvasItems = (updater) => {
    setCanvases(prev => {
      const newItems = typeof updater === 'function' ? updater(prev[viewMode]) : updater;
      return { ...prev, [viewMode]: newItems };
    });
  };

  // Devuelve el color del colaborador que agregó un elemento
  const getCollabColor = (userId) =>
    projectCollabs.find(c => c.id === userId)?.color ?? null;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Centra el elemento en la vista y abre su panel de comentarios
  const scrollToElement = (elementId) => {
    setActiveCommentElId(elementId);
    setTimeout(() => {
      const el = document.querySelector(`[data-id="${elementId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.outline = '2px solid #3483fa';
        el.style.outlineOffset = '3px';
        setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 2000);
      }
    }, 80);
  };

  // Verifica todos los elementos antes de publicar
  const runMaiaPrePublishCheck = () => new Promise((resolve) => {
    const allItems = [];
    const collect = (items) => items.forEach(item => {
      if (item.type === 'rowGroup' && item.items) item.items.forEach(c => allItems.push(c));
      else allItems.push(item);
    });
    collect([...(canvases.desktop || []), ...(canvases.mobile || [])]);

    // Solo items con imagen subida
    const itemsToCheck = allItems.filter(item => item.uploadedImages?.[0]);

    if (itemsToCheck.length === 0) { resolve({ errors: [] }); return; }

    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    const initial = itemsToCheck.map(item => ({
      id: item.uniqueId, name: item.name || 'Elemento', status: 'pending', msg: ''
    }));
    setMaiaCheckItems(initial);

    const errors = [];

    // Procesar en serie para que la animación se vea secuencial
    (async () => {
      for (let idx = 0; idx < itemsToCheck.length; idx++) {
        const item = itemsToCheck[idx];
        const imageUrl = item.uploadedImages[0];
        const size = viewMode === 'desktop' ? item.desktopSize : item.mobileSize;
        const itemErrors = [];

        // ── Check 1: dimensiones (omitido para tarjetas de producto) ──
        if (size?.width && size?.height && item.type !== 'product_card') {
          await new Promise(res2 => {
            const imgEl = new window.Image();
            imgEl.onload = () => {
              const tol = 0.05;
              const DPI_SCALE = 150 / 72; // acepta exportaciones a 150 dpi
              const w72ok  = Math.abs(imgEl.naturalWidth  - size.width)              / size.width              <= tol;
              const h72ok  = Math.abs(imgEl.naturalHeight - size.height)             / size.height             <= tol;
              const w150ok = Math.abs(imgEl.naturalWidth  - size.width  * DPI_SCALE) / (size.width  * DPI_SCALE) <= tol;
              const h150ok = Math.abs(imgEl.naturalHeight - size.height * DPI_SCALE) / (size.height * DPI_SCALE) <= tol;
              const ok = (w72ok && h72ok) || (w150ok && h150ok);
              if (!ok) itemErrors.push(`Dimensiones: ${imgEl.naturalWidth}×${imgEl.naturalHeight}px (esperado ${size.width}×${size.height}px @ 72dpi o ${Math.round(size.width*DPI_SCALE)}×${Math.round(size.height*DPI_SCALE)}px @ 150dpi)`);
              res2();
            };
            imgEl.onerror = () => res2();
            imgEl.src = imageUrl;
          });
        }

        // ── Check 2: typos con Gemini (re-verificación fresca) ──
        try {
          const typoRes = await fetch(`${API_URL}/api/check-typos-only`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
            body: JSON.stringify({ imageUrl, projectId: id })
          });
          const typoData = await typoRes.json();
          if (typoData.hasTypos) {
            const desc = typoData.errors?.length ? typoData.errors.join(', ') : 'Typos detectados en el texto';
            itemErrors.push(`Typos: ${desc}`);
          }
        } catch (e) {
          // Si Gemini falla, no bloqueamos por esto
        }

        const hasError = itemErrors.length > 0;
        const msg = itemErrors.join(' | ');
        if (hasError) errors.push({ name: item.name || 'Elemento', msg });

        setMaiaCheckItems(prev => prev.map((p, i) =>
          i === idx ? { ...p, status: hasError ? 'error' : 'ok', msg } : p
        ));

        // Pausa entre elementos para que la animación sea legible
        await new Promise(r => setTimeout(r, 400));
      }
      setTimeout(() => resolve({ errors }), 500);
    })();
  });

  // Agregar colaborador al proyecto
  const addCollaborator = async (userId) => {
    setCollabError('');
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    const res = await fetch(`${API_URL}/api/projects/${id}/editors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCollabError(data.error || 'No se pudo agregar el colaborador');
      return;
    }
    const updated = await res.json();
    // Reconstruir lista de colaboradores
    const collabs = [
      updated.user ? { ...updated.user, color: COLLAB_COLORS[0] } : null,
      ...((updated.editors || []).map((e, i) => ({ ...e.user, color: COLLAB_COLORS[(i + 1) % COLLAB_COLORS.length] })))
    ].filter(Boolean);
    setProjectCollabs(collabs);
    setShowAddCollab(false);
    setCollabSearch('');
    setCollabError('');
  };

  // Exportar el canvas como PDF
  const exportToPdf = async () => {
    if (!pdfCanvasRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const el = pdfCanvasRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({
        orientation: el.offsetWidth > el.offsetHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [el.offsetWidth, el.offsetHeight],
        hotfixes: ['px_scaling']
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, el.offsetWidth, el.offsetHeight);
      pdf.save(`${projectTitle.replace(/\s+/g, '_')}_maqueta.pdf`);
    } catch (e) {
      console.error('Error exportando PDF:', e);
    }
    setIsExporting(false);
  };

  // Renderiza texto con @menciones resaltadas
  const renderCommentText = (text) => {
    const parts = text.split(/(@[\w\s]+?)(?=\s|$|@)/g);
    return parts.map((p, i) =>
      p.startsWith('@')
        ? <strong key={i} style={{ color: '#3483fa' }}>{p}</strong>
        : <span key={i}>{p}</span>
    );
  };


  
  
  
  
  
  
  
    const triggerUpload = (uniqueId) => {
    setUploadTargetId(uniqueId);
    setUploadIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Analiza una imagen subida con Gemini Vision para detectar typos
  const analyzeImageForTypos = async (imageUrl, elementId) => {
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    let elementOwnerId = null;
    const findOwner = (items) => {
      for (const item of items) {
        if (item.uniqueId === elementId) { elementOwnerId = item.addedBy || null; return; }
        if (item.type === 'rowGroup' && item.items) {
          for (const child of item.items) {
            if (child.uniqueId === elementId) { elementOwnerId = child.addedBy || null; return; }
          }
        }
      }
    };
    const allItems = [...(canvases.desktop || []), ...(canvases.mobile || [])];
    findOwner(allItems);
    try {
      const res = await fetch(`${API_URL}/api/analyze-typos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({ imageUrl, projectId: id, elementId, elementOwnerId })
      });
      const result = await res.json();
      if (result.typos && result.comment) {
        setComments(prev => [...prev, result.comment]);
        if (result.notification) {
          setNotifications(prev => [result.notification, ...prev]);
        }
      }
    } catch (e) {
      console.error('Error analizando imagen:', e);
    }
  };

  // Verifica que las dimensiones de la imagen coincidan con las del elemento
  const checkImageDimensions = (imageUrl, elementId) => {
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;

    // Encontrar el elemento en cualquiera de los dos canvases
    let foundItem = null;
    const searchItem = (items) => {
      for (const item of items) {
        if (item.uniqueId === elementId) { foundItem = item; return; }
        if (item.type === 'rowGroup' && item.items) {
          for (const child of item.items) {
            if (child.uniqueId === elementId) { foundItem = child; return; }
          }
        }
      }
    };
    searchItem([...(canvases.desktop || []), ...(canvases.mobile || [])]);
    if (!foundItem) return;

    const expectedSize = viewMode === 'desktop' ? foundItem.desktopSize : foundItem.mobileSize;
    if (!expectedSize?.width || !expectedSize?.height) return;
    // Las tarjetas de producto aceptan cualquier imagen sin validar dimensiones
    if (foundItem.type === 'product_card') return;

    const img = new window.Image();
    img.onload = async () => {
      const actualW = img.naturalWidth;
      const actualH = img.naturalHeight;
      const expW = expectedSize.width;
      const expH = expectedSize.height;

      // Tolerancia del 5% — acepta 72 dpi (1:1) o 150 dpi (~2.08:1)
      const tol = 0.05;
      const DPI_SCALE = 150 / 72;
      const wOk = Math.abs(actualW - expW) / expW <= tol || Math.abs(actualW - expW * DPI_SCALE) / (expW * DPI_SCALE) <= tol;
      const hOk = Math.abs(actualH - expH) / expH <= tol || Math.abs(actualH - expH * DPI_SCALE) / (expH * DPI_SCALE) <= tol;

      if (!wOk || !hOk) {
        const elementOwnerId = foundItem.addedBy || null;
        const exp150W = Math.round(expW * DPI_SCALE);
        const exp150H = Math.round(expH * DPI_SCALE);
        const text = `**Aviso de dimensiones:**\n\nLa imagen subida mide **${actualW} × ${actualH} px** pero este elemento espera **${expW} × ${expH} px** (72 dpi) o **${exp150W} × ${exp150H} px** (150 dpi).\n\nConsiderá reemplazarla con una imagen del tamaño correcto para evitar distorsión.`;
        try {
          const res = await fetch(`${API_URL}/api/maia-comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
            body: JSON.stringify({ imageUrl, projectId: id, elementId, elementOwnerId, text })
          });
          const result = await res.json();
          if (result.comment) {
            setComments(prev => [...prev, result.comment]);
            if (result.notification) setNotifications(prev => [result.notification, ...prev]);
          }
        } catch (e) {
          console.error('Error en checkImageDimensions:', e);
        }
      }
    };
    img.src = imageUrl;
  };

  const handleFileDrop = (e, uniqueId) => {
    if (isPreviewMode) return;
    // Si es un archivo del SO (no un componente de la barra lateral)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result;
        try {
          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: base64Str })
          });
          if (!response.ok) throw new Error('Error al subir la imagen');
          const data = await response.json();
          if (data.url) {
            setCanvasItems(prev => prev.map(item => {
              if (item.uniqueId === uniqueId) {
                const currentImages = [...(item.uploadedImages || [])];
                currentImages[0] = data.url;
                return { ...item, uploadedImages: currentImages };
              }
              if (item.type === 'rowGroup') {
                return { ...item, items: item.items.map(child => {
                  if (child.uniqueId === uniqueId) {
                    const currentImages = [...(child.uploadedImages || [])];
                    currentImages[0] = data.url;
                    return { ...child, uploadedImages: currentImages };
                  }
                  return child;
                })};
              }
              return item;
            }));
            // Análisis IA en background
            analyzeImageForTypos(data.url, uniqueId);
            checkImageDimensions(data.url, uniqueId);
          }
        } catch (error) {
          console.error('Error subiendo imagen por drag:', error);
          alert('Hubo un error subiendo la imagen.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGlobalImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && uploadTargetId) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result;
        
        try {
          // Send to Cloudinary backend
          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: base64Str })
          });
          
          if (!response.ok) throw new Error('Error al subir la imagen');
          
          const data = await response.json();
          
          if (data.url) {
            setCanvasItems(prev => prev.map(item => {
              if (item.uniqueId === uploadTargetId) {
                const currentImages = [...(item.uploadedImages || [])];
                currentImages[uploadIndex] = data.url;
                return { ...item, uploadedImages: currentImages };
              }
              if (item.type === 'rowGroup') {
                const updatedChildren = item.items.map(child => {
                  if (child.uniqueId === uploadTargetId) {
                    const currentImages = [...(child.uploadedImages || [])];
                    currentImages[uploadIndex] = data.url;
                    return { ...child, uploadedImages: currentImages };
                  }
                  return child;
                });
                return { ...item, items: updatedChildren };
              }
              return item;
            }));
            // Análisis IA en background
            analyzeImageForTypos(data.url, uploadTargetId);
            checkImageDimensions(data.url, uploadTargetId);
          }
        } catch (error) {
          console.error('Error subiendo imagen a Cloudinary:', error);
          alert('Hubo un error subiendo la imagen. Inténtalo de nuevo.');
        } finally {
          setUploadTargetId(null);
          setUploadIndex(0);
          e.target.value = null; // Reset input
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateItemText = (uniqueId, field, value) => {
    setCanvasItems(prev => prev.map(item => {
      if (item.uniqueId === uniqueId) return { ...item, [field]: value };
      if (item.type === 'rowGroup') {
        const updatedChildren = item.items.map(child => child.uniqueId === uniqueId ? { ...child, [field]: value } : child);
        return { ...item, items: updatedChildren };
      }
      return item;
    }));
  };

  const toggleItemInfo = (uniqueId) => {
    setCanvasItems(prev => prev.map(item => {
      if (item.uniqueId === uniqueId) return { ...item, showInfo: item.showInfo === false ? true : false };
      if (item.type === 'rowGroup') {
        const updatedChildren = item.items.map(child => child.uniqueId === uniqueId ? { ...child, showInfo: child.showInfo === false ? true : false } : child);
        return { ...item, items: updatedChildren };
      }
      return item;
    }));
  };

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [showSafeAreas, setShowSafeAreas] = useState(true);
  const [showComponentInfo, setShowComponentInfo] = useState(true);

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 60; // 30px padding on each side
        const targetWidth = viewMode === 'desktop' ? 1920 : 800;
        const newScale = containerWidth < targetWidth ? containerWidth / targetWidth : 1;
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [viewMode]);

  // Selection & Lasso
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lasso, setLasso] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Sidebar drag events
  const handleDragStartSidebar = (e, component) => {
    e.dataTransfer.setData('componentId', component.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Canvas sortable drag events
  const handleDragStartCanvas = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');

    // Crear imagen de drag pequeña y compacta
    const item = canvasItems[index];
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      background: #3483fa;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      font-family: sans-serif;
      box-shadow: 0 4px 16px rgba(52,131,250,0.5);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    `;
    ghost.textContent = `⠿ ${item?.name || 'Componente'}`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOverCanvas = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedIndex !== null ? 'move' : 'copy';
    setIsOverCanvas(true);
  };

  const handleItemDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverCanvas(true);
    e.dataTransfer.dropEffect = draggedIndex !== null ? 'move' : 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // Si estamos en la mitad superior → 'before'; mitad inferior → 'after'
    const position = y < rect.height / 2 ? 'before' : 'after';
    setDragOverTarget({ index, position });
  };

  const handleDragLeaveCanvas = () => {
    setIsOverCanvas(false);
    setDragOverTarget(null);
  };

  const handleDropCanvas = (e, fallbackIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverCanvas(false);

    const dropTarget = dragOverTarget;
    setDragOverTarget(null);

    const componentId = e.dataTransfer.getData('componentId');

    let dropIndex = fallbackIndex;
    let forceBottom = false;

    if (dropTarget) {
      dropIndex = dropTarget.index;
      if (dropTarget.position === 'after') {
        dropIndex += 1;
      }
      // 'before' → insert at dropTarget.index (no increment)
    }

    if (componentId) {
      const component = componentsList.find(c => c.id === componentId);
      if (component) {
        const newItem = { ...component, uniqueId: 'comp-' + Date.now() + Math.random(), addedBy: user?.id };

        let itemsToAdd = [newItem];
        if (forceBottom) {
          const spacerComponent = componentsList.find(c => c.id === 'salto_linea');
          const newSpacer = { ...spacerComponent, uniqueId: 'comp-spacer-' + Date.now() };
          itemsToAdd = [newSpacer, newItem];
        }

        if (dropIndex !== null) {
          const newItems = [...canvasItems];
          newItems.splice(dropIndex, 0, ...itemsToAdd);
          setCanvasItems(newItems);
        } else {
          setCanvasItems([...canvasItems, ...itemsToAdd]);
        }
      }
    } else if (draggedIndex !== null && dropIndex !== null && draggedIndex !== dropIndex) {
      const newItems = [...canvasItems];
      const removed = newItems[draggedIndex];
      newItems.splice(draggedIndex, 1);

      let adjustedDropIndex = dropIndex;
      if (draggedIndex < dropIndex) adjustedDropIndex -= 1;

      let itemsToAdd = [removed];
      if (forceBottom) {
        const spacerComponent = componentsList.find(c => c.id === 'salto_linea');
        const newSpacer = { ...spacerComponent, uniqueId: 'comp-spacer-' + Date.now() };
        itemsToAdd = [newSpacer, removed];
      }

      newItems.splice(adjustedDropIndex, 0, ...itemsToAdd);
      setCanvasItems(newItems);
    }
    setDraggedIndex(null);
  };

  const removeItem = (uniqueId) => {
    setCanvasItems(prev => prev.map(item => {
      if (item.uniqueId === uniqueId) return null;
      if (item.type === 'rowGroup') {
        const filtered = item.items.filter(child => child.uniqueId !== uniqueId);
        if (filtered.length === 0) return null;
        return { ...item, items: filtered };
      }
      return item;
    }).filter(Boolean));

    const newSelected = new Set(selectedIds);
    newSelected.delete(uniqueId);
    setSelectedIds(newSelected);
  };

  const getScaledHeight = (item, mode) => {
    const size = mode === 'desktop' ? item.desktopSize : item.mobileSize;
    if (!size) return 100;
    return size.height;
  };

  const getScaledWidth = (item, mode) => {
    const size = mode === 'desktop' ? item.desktopSize : item.mobileSize;
    if (!size) return '100%';
    return size.width;
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.canvas-item') || e.target.closest('.delete-btn') || e.target.closest('.context-menu')) {
      if (!e.target.closest('.context-menu')) setContextMenu(null);
      return;
    }

    setContextMenu(null);
    if (!e.shiftKey) setSelectedIds(new Set());

    setLasso({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handleMouseMove = (e) => {
    if (!lasso) return;
    setLasso({ ...lasso, currentX: e.clientX, currentY: e.clientY });
  };

  const handleMouseUp = (e) => {
    if (!lasso) return;

    const left = Math.min(lasso.startX, lasso.currentX);
    const right = Math.max(lasso.startX, lasso.currentX);
    const top = Math.min(lasso.startY, lasso.currentY);
    const bottom = Math.max(lasso.startY, lasso.currentY);

    if (right - left < 5 && bottom - top < 5) {
      setLasso(null);
      return;
    }

    const newSelected = new Set(selectedIds);
    const itemElements = document.querySelectorAll('.canvas-item');

    itemElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isIntersecting = !(rect.right < left || rect.left > right || rect.bottom < top || rect.top > bottom);
      if (isIntersecting && el.dataset.id) {
        newSelected.add(el.dataset.id);
      }
    });

    setSelectedIds(newSelected);
    setLasso(null);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetId: null });
  };

  const handleItemContextMenu = (e, uniqueId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, targetId: uniqueId });
  };

  useEffect(() => {
    const hideMenu = () => setContextMenu(null);
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  // Resize handler para text_block
  useEffect(() => {
    if (!textResizing) return;
    const canvasWidth = viewMode === 'desktop' ? 1920 : 800;
    const onMove = (e) => {
      const dx = (e.clientX - textResizing.startX) / scale;
      const dy = (e.clientY - textResizing.startY) / scale;
      setCanvasItems(prev => prev.map(it => {
        const update = (child) => {
          if (child.uniqueId !== textResizing.id) return child;
          const newW = textResizing.dir.includes('e')
            ? Math.round(Math.max(120, Math.min(canvasWidth, textResizing.startW + dx * 2)))
            : child.textWidthPx ?? canvasWidth;
          const newH = textResizing.dir.includes('s')
            ? Math.round(Math.max(40, textResizing.startH + dy))
            : child.textHeightPx ?? 80;
          return { ...child, textWidthPx: newW, textHeightPx: newH };
        };
        if (it.uniqueId === textResizing.id) return update(it);
        if (it.type === 'rowGroup') return { ...it, items: it.items.map(update) };
        return it;
      }));
    };
    const onUp = () => setTextResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [textResizing, scale, viewMode]);

  const groupSelected = (justify) => {
    const extracted = [];
    const remainingItems = canvasItems.map(item => {
      if (item.type === 'rowGroup') {
        const kept = [];
        item.items.forEach(child => {
          if (selectedIds.has(child.uniqueId)) extracted.push(child);
          else kept.push(child);
        });
        return { ...item, items: kept };
      } else {
        if (selectedIds.has(item.uniqueId)) {
          extracted.push(item);
          return null;
        }
        return item;
      }
    }).filter(i => i !== null).filter(i => i.type !== 'rowGroup' || i.items.length > 0);

    const newGroup = {
      uniqueId: 'row-' + Date.now(),
      type: 'rowGroup',
      justify: justify,
      items: extracted
    };

    setCanvasItems([...remainingItems, newGroup]);
    setSelectedIds(new Set());
    setContextMenu(null);
  };

  const renderItem = (originalItem, isInsideGroup = false, index = null) => {
    let item = { ...originalItem };

    if (item.type === 'rowGroup') {
      return (
        <div
          key={item.uniqueId}
          className="row-group"
          style={{ justifyContent: item.justify }}
          draggable
          onDragStart={(e) => handleDragStartCanvas(e, index)}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => handleDropCanvas(e, index)}
          onContextMenu={(e) => handleItemContextMenu(e, item.uniqueId)}
        >
          {!isPreviewMode && (
            <button className="delete-btn" onClick={() => removeItem(item.uniqueId)}>
              <Trash2 size={16} />
            </button>
          )}
          {item.items.map(child => renderItem(child, true, null))}
        </div>
      );
    }

    const size = viewMode === 'desktop' ? item.desktopSize : item.mobileSize;
    const height = getScaledHeight(item, viewMode);
    const width = getScaledWidth(item, viewMode);
    const isSelected = selectedIds.has(item.uniqueId);

    let indicatorClass = '';
    if (dragOverTarget && dragOverTarget.index === index) {
      indicatorClass = `drop-indicator-${dragOverTarget.position}`;
    }

    const safeAreaStr = viewMode === 'desktop' ? item.safeAreaDesktop : item.safeAreaMobile;
    let safeAreaStyle = null;
    if (showSafeAreas && safeAreaStr) {
      const match = safeAreaStr.match(/(\d+)\s*x\s*(\d+)/);
      if (match) {
        safeAreaStyle = {
          width: `${match[1]}px`,
          height: `${match[2]}px`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: '2px dashed rgba(230, 126, 34, 0.8)',
          backgroundColor: 'rgba(230, 126, 34, 0.05)',
          pointerEvents: 'none',
          zIndex: 10
        };
      }
    }

    if (viewMode === 'mobile' && !item.mobileSize) {
      return (
        <div
          key={item.uniqueId}
          data-id={item.uniqueId}
          className={`canvas-item ${isSelected ? 'selected' : ''} ${indicatorClass}`}
          style={{ width: '100%' }}
          onDragOver={(e) => handleItemDragOver(e, index)}
          onDrop={(e) => handleDropCanvas(e, index)}
          onContextMenu={(e) => handleItemContextMenu(e, item.uniqueId)}
        >
          {!isPreviewMode && (
            <div className="component-placeholder" style={{ height: '100px', width: '100%', background: '#ffebee', color: '#c62828' }}>
              <button className="delete-btn" onClick={() => removeItem(item.uniqueId)}><Trash2 size={16} /></button>
              <div className="component-content">
                <h3>{item.name}</h3>
                <p>No aplica para Mobile</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (item.type === 'spacer') {
      return (
        <div
          key={item.uniqueId}
          data-id={item.uniqueId}
          className={`canvas-item ${isSelected ? 'selected' : ''} ${indicatorClass}`}
          style={{ width: '100%' }}
          draggable={!isInsideGroup}
          onDragStart={!isInsideGroup ? (e) => handleDragStartCanvas(e, index) : undefined}
          onDragOver={(e) => handleItemDragOver(e, index)}
          onDrop={!isInsideGroup ? (e) => handleDropCanvas(e, index) : undefined}
          onContextMenu={(e) => handleItemContextMenu(e, item.uniqueId)}
        >
          {!isPreviewMode && <button className="delete-btn" onClick={() => removeItem(item.uniqueId)}><Trash2 size={16} /></button>}
          {!isPreviewMode && <div className="spacer-item">Salto de Línea (Espaciador)</div>}
        </div>
      );
    }

    if (item.type === 'text_block') {
      const canvasWidth = viewMode === 'desktop' ? 1920 : 800;
      const tbW = item.textWidthPx ?? canvasWidth;
      const tbH = item.textHeightPx ?? 80;
      const isResizingThis = textResizing?.id === item.uniqueId;

      // Estilo de handle de resize
      const handleBase = {
        position: 'absolute',
        background: 'rgba(230, 126, 34, 0.85)',
        borderRadius: '3px',
        zIndex: 30,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      };

      return (
        <div
          key={item.uniqueId}
          data-id={item.uniqueId}
          className={`canvas-item ${isSelected ? 'selected' : ''} ${indicatorClass}`}
          style={{ width: '100%', padding: '16px 0', boxSizing: 'border-box' }}
          draggable={!isInsideGroup && !isHoveringText && !textResizing}
          onDragStart={!isInsideGroup ? (e) => handleDragStartCanvas(e, index) : undefined}
          onDragEnd={() => { setDraggedIndex(null); setDragOverTarget(null); }}
          onDragOver={(e) => handleItemDragOver(e, index)}
          onDrop={!isInsideGroup ? (e) => handleDropCanvas(e, index) : undefined}
          onContextMenu={(e) => handleItemContextMenu(e, item.uniqueId)}
        >
          {!isPreviewMode && (
            <button className="delete-btn" onClick={() => removeItem(item.uniqueId)}>
              <Trash2 size={16} />
            </button>
          )}

          {/* Contenedor centrado con borde naranja + resize */}
          <div
            style={{
              width: `${tbW}px`,
              height: `${tbH}px`,
              margin: '0 auto',
              position: 'relative',
              border: isPreviewMode ? 'none' : '2px dashed rgba(230, 126, 34, 0.8)',
              backgroundColor: isPreviewMode ? 'transparent' : 'rgba(230, 126, 34, 0.03)',
              boxSizing: 'border-box',
              overflow: 'visible',
            }}
            onMouseEnter={() => !isPreviewMode && setIsHoveringText(true)}
            onMouseLeave={() => setIsHoveringText(false)}
          >
            {/* Etiqueta de dimensiones (estilo safe area) */}
            {!isPreviewMode && (
              <div style={{
                position: 'absolute',
                top: '-22px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(230, 126, 34, 0.9)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                letterSpacing: '0.04em',
              }}>
                {tbW} × {tbH} px
              </div>
            )}

            {/* Toolbar: tamaño de fuente + alineación */}
            {!isPreviewMode && (
              <div style={{
                position: 'absolute',
                top: '-26px',
                right: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={() => setIsHoveringText(true)}
              >
                {/* Alineación */}
                {[
                  { val: 'left',    icon: '\u2630\u2013' },
                  { val: 'center',  icon: '\u2630\u2014\u2630' },
                  { val: 'right',   icon: '\u2013\u2630' },
                  { val: 'justify', icon: '\u2261' },
                ].map(({ val, icon }) => (
                  <button
                    key={val}
                    title={val}
                    onClick={() => updateItemText(item.uniqueId, 'textAlign', val)}
                    style={{
                      background: (item.textAlign ?? 'left') === val ? 'rgba(230,126,34,0.9)' : 'white',
                      color: (item.textAlign ?? 'left') === val ? 'white' : 'rgba(230,126,34,0.9)',
                      border: '1.5px solid rgba(230,126,34,0.6)',
                      borderRadius: '3px',
                      padding: '1px 5px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      lineHeight: 1,
                      fontWeight: '700',
                    }}
                  >{icon}</button>
                ))}
                <span style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(230,126,34,0.9)', marginLeft: '4px' }}>T</span>
                <select
                  value={item.textFontSize ?? (viewMode === 'desktop' ? 10 : 8)}
                  onChange={(e) => updateItemText(item.uniqueId, 'textFontSize', Number(e.target.value))}
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#1a1f2e',
                    background: 'white',
                    border: '1.5px solid rgba(230,126,34,0.6)',
                    borderRadius: '4px',
                    padding: '1px 4px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(s => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={item.textContent || ''}
              placeholder={isPreviewMode ? '' : 'Escribe aquí tu texto...'}
              onChange={(e) => updateItemText(item.uniqueId, 'textContent', e.target.value)}
              readOnly={isPreviewMode}
              style={{
                width: '100%',
                height: '100%',
                resize: 'none',
                border: 'none',
                outline: 'none',
                overflow: isPreviewMode ? 'hidden' : 'auto',
                background: 'transparent',
                fontFamily: "'Proxima Nova', 'Inter', -apple-system, sans-serif",
                fontSize: `${item.textFontSize ?? (viewMode === 'desktop' ? 10 : 8)}px`,
                lineHeight: '1.6',
                color: '#1a1a2e',
                padding: '8px 10px',
                cursor: isPreviewMode ? 'default' : 'text',
                boxSizing: 'border-box',
                textAlign: item.textAlign ?? 'left',
              }}
            />

            {/* Handle: borde derecho */}
            {!isPreviewMode && (
              <div
                style={{
                  ...handleBase,
                  right: '-5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '10px',
                  height: '36px',
                  cursor: 'ew-resize',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTextResizing({ id: item.uniqueId, dir: 'e', startX: e.clientX, startY: e.clientY, startW: tbW, startH: tbH });
                }}
              />
            )}

            {/* Handle: borde inferior */}
            {!isPreviewMode && (
              <div
                style={{
                  ...handleBase,
                  bottom: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '36px',
                  height: '10px',
                  cursor: 'ns-resize',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTextResizing({ id: item.uniqueId, dir: 's', startX: e.clientX, startY: e.clientY, startW: tbW, startH: tbH });
                }}
              />
            )}

            {/* Handle: esquina inferior-derecha */}
            {!isPreviewMode && (
              <div
                style={{
                  ...handleBase,
                  right: '-5px',
                  bottom: '-5px',
                  width: '12px',
                  height: '12px',
                  cursor: 'nwse-resize',
                  borderRadius: '50%',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTextResizing({ id: item.uniqueId, dir: 'se', startX: e.clientX, startY: e.clientY, startW: tbW, startH: tbH });
                }}
              />
            )}
          </div>
        </div>
      );
    }


    // ── Tarjeta de Producto (MeLi poly-card) ──────────────────────
    if (item.type === 'product_card') {
      const fs = (base) => `${Math.round(base * (width / 271))}px`;
      return (
        <div
          key={item.uniqueId}
          data-id={item.uniqueId}
          className={`canvas-item ${isSelected ? 'selected' : ''} ${indicatorClass} ${draggedIndex === index ? 'is-dragging' : ''}`}
          draggable={!isInsideGroup}
          style={{ width: `${width}px`, position: 'relative' }}
          onDragStart={!isInsideGroup ? (e) => handleDragStartCanvas(e, index) : undefined}
          onDragEnd={() => { setDraggedIndex(null); setDragOverTarget(null); }}
          onDragOver={(e) => {
            if (!isPreviewMode) {
              if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); e.stopPropagation(); }
              else { handleItemDragOver(e, index); }
            }
          }}
          onDrop={(e) => {
            if (isPreviewMode) return;
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFileDrop(e, item.uniqueId); }
            else if (!isInsideGroup) { handleDropCanvas(e, index); }
          }}
          onContextMenu={(e) => handleItemContextMenu(e, item.uniqueId)}
          onClick={() => setSelectedId(item.uniqueId)}
        >
          {/* Botón eliminar */}
          {!isPreviewMode && (
            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); removeItem(item.uniqueId); }}>
              <Trash2 size={16} />
            </button>
          )}

          {/* Dot de colaborador */}
          {!isPreviewMode && item.addedBy && getCollabColor(item.addedBy) && (
            <div
              title={projectCollabs.find(c => c.id === item.addedBy)?.name || ''}
              style={{
                position: 'absolute', bottom: '6px', right: '8px',
                width: '10px', height: '10px', borderRadius: '50%',
                background: getCollabColor(item.addedBy),
                border: '2px solid rgba(255,255,255,0.9)',
                zIndex: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Badge de comentarios */}
          {!isPreviewMode && comments.some(c => c.elementId === item.uniqueId && !c.resolved) && (
            <div
              onClick={e => { e.stopPropagation(); setActiveCommentElId(item.uniqueId); }}
              title="Ver comentarios"
              style={{
                position: 'absolute', top: '6px', right: '8px',
                background: '#3483fa', color: 'white', borderRadius: '10px',
                fontSize: '10px', fontWeight: '800', padding: '2px 7px',
                zIndex: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(52,131,250,0.4)',
                display: 'flex', alignItems: 'center', gap: '3px'
              }}
            >
              💬 {comments.filter(c => c.elementId === item.uniqueId && !c.resolved).length}
            </div>
          )}

          {/* Panel de comentarios flotante */}
          {!isPreviewMode && activeCommentElId === item.uniqueId && (
            <CommentPanel
              elementId={item.uniqueId}
              elementName={item.name || 'Tarjeta de Producto'}
              comments={comments}
              projectCollabs={projectCollabs}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              commentInputs={commentInputs}
              setCommentInputs={setCommentInputs}
              mentionQuery={mentionQuery}
              setMentionQuery={setMentionQuery}
              onClose={() => setActiveCommentElId(null)}
              onSubmit={submitComment}
              onResolve={resolveComment}
              onDelete={deleteComment}
              onException={handleException}
              getCollabColor={getCollabColor}
            />
          )}

          {/* Tarjeta */}
          <div
            style={{
              width: `${width}px`, height: `${height}px`,
              background: 'white', borderRadius: '8px',
              overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.10)',
              display: 'flex', flexDirection: 'column',
              border: '1px solid #ebebeb',
              fontFamily: "'Proxima Nova', 'Inter', -apple-system, sans-serif",
              cursor: isPreviewMode ? 'default' : 'pointer',
              userSelect: 'none',
            }}
            onClick={() => !isPreviewMode && triggerUpload(item.uniqueId)}
          >
            {/* ── Portada / Imagen ── */}
            <div style={{
              flex: '0 0 52%', background: '#f5f5f5',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.uploadedImages?.[0] ? (
                <img src={item.uploadedImages[0]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
              ) : (
                <div style={{ textAlign: 'center', color: '#ccc' }}>
                  <ImageIcon size={Math.round(32 * width / 271)} color="#d0d0d0" />
                  {!isPreviewMode && <div style={{ fontSize: fs(8), marginTop: '4px', color: '#bbb' }}>Click para subir imagen</div>}
                </div>
              )}
            </div>

            {/* ── Contenido ── */}
            <div style={{ flex: 1, padding: `${Math.round(8 * width / 271)}px ${Math.round(10 * width / 271)}px`, display: 'flex', flexDirection: 'column', gap: `${Math.round(4 * width / 271)}px`, overflow: 'hidden' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: fs(8.5), fontWeight: '700', letterSpacing: '0.02em',
                background: '#2968C8', color: 'white',
                padding: `1px ${fs(4)}`, borderRadius: '2px',
                alignSelf: 'flex-start',
              }}>★ OFERTA IMPERDIBLE</span>

              <s style={{ fontSize: fs(10), color: '#999', lineHeight: 1 }}>$ XX.XXX</s>

              <div style={{ display: 'flex', alignItems: 'center', gap: `${Math.round(5 * width / 271)}px`, flexWrap: 'wrap' }}>
                <span style={{ fontSize: fs(18), fontWeight: '400', color: '#1a1a2e', lineHeight: 1 }}>$ XX.XXX</span>
                <span style={{ fontSize: fs(9), fontWeight: '700', background: '#00A650', color: 'white', padding: `1px ${fs(5)}`, borderRadius: '10px' }}>XX% OFF</span>
              </div>

              <span style={{ fontSize: fs(10), color: '#00A650', fontWeight: '500' }}>Hasta 3 cuotas sin interés</span>
              <span style={{ fontSize: fs(10), color: '#3483fa', fontWeight: '500' }}>Envío gratis ⚡ FULL</span>

              <p style={{
                fontSize: fs(9.5), color: '#666', margin: 0, lineHeight: '1.35',
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum imperdiet.</p>
            </div>
          </div>
        </div>
      );
    }


    return (
      <div
        key={item.uniqueId}
        data-id={item.uniqueId}
        className={`canvas-item ${isSelected ? 'selected' : ''} ${indicatorClass} ${draggedIndex === index ? 'is-dragging' : ''}`}
        draggable={!isInsideGroup && !isHoveringText}
        style={{ width: `${width}px` }}
        onDragStart={!isInsideGroup ? (e) => handleDragStartCanvas(e, index) : undefined}
        onDragEnd={() => { setDraggedIndex(null); setDragOverTarget(null); }}
        onDragOver={(e) => {
          if (!isPreviewMode) {
            // Si es un archivo del SO, solo resaltar; si es componente, comportamiento normal
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault();
              e.stopPropagation();
            } else {
              handleItemDragOver(e, index);
            }
          }
        }}
        onDrop={(e) => {
          if (isPreviewMode) return;
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileDrop(e, item.uniqueId);
          } else if (!isInsideGroup) {
            handleDropCanvas(e, index);
          }
        }}
        onContextMenu={(e) => handleItemContextMenu(e, item.uniqueId)}
      >
        {!isPreviewMode && (
          <button className="delete-btn" onClick={() => removeItem(item.uniqueId)}>
            <Trash2 size={16} />
          </button>
        )}
        {!isPreviewMode && item.addedBy && getCollabColor(item.addedBy) && (
          <div
            title={projectCollabs.find(c => c.id === item.addedBy)?.name || ''}
            style={{
              position: 'absolute', bottom: '6px', right: '8px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: getCollabColor(item.addedBy),
              border: '2px solid rgba(255,255,255,0.9)',
              zIndex: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              pointerEvents: 'none'
            }}
          />
        )}
        {/* Indicador de comentarios en el elemento */}
        {!isPreviewMode && comments.some(c => c.elementId === item.uniqueId && !c.resolved) && (
          <div
            onClick={e => { e.stopPropagation(); setActiveCommentElId(item.uniqueId); }}
            title="Ver comentarios"
            style={{
              position: 'absolute', top: '6px', right: '8px',
              background: '#3483fa', color: 'white', borderRadius: '10px',
              fontSize: '10px', fontWeight: '800', padding: '2px 7px',
              zIndex: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(52,131,250,0.4)',
              display: 'flex', alignItems: 'center', gap: '3px'
            }}
          >
            💬 {comments.filter(c => c.elementId === item.uniqueId && !c.resolved).length}
          </div>
        )}
        {/* Panel de comentarios flotante */}
        {!isPreviewMode && activeCommentElId === item.uniqueId && (
          <CommentPanel
            elementId={item.uniqueId}
            elementName={item.name || 'Elemento'}
            comments={comments}
            projectCollabs={projectCollabs}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            commentInputs={commentInputs}
            setCommentInputs={setCommentInputs}
            mentionQuery={mentionQuery}
            setMentionQuery={setMentionQuery}
            onClose={() => setActiveCommentElId(null)}
            onSubmit={submitComment}
            onResolve={resolveComment}
            onDelete={deleteComment}
            onException={handleException}
            getCollabColor={getCollabColor}
          />
        )}
        <div
          className="component-placeholder"
          style={{ height: `${height}px`, width: '100%', position: 'relative', padding: 0 }}
        >
          
            <>
              {(item.type === 'banner' || item.type === 'carousel') && <AnimatedBanner item={item} height={height} isPreviewMode={isPreviewMode} />}

              {item.id === 'encabezado_portada_logo' && (
                <>
                  {item.uploadedImages && item.uploadedImages[0] && (
                    <img src={item.uploadedImages[0]} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                  )}
                  {item.uploadedImages && item.uploadedImages[1] && (
                    <img src={item.uploadedImages[1]} alt="Logo" style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'contain', position: 'absolute', top: '50%', left: '40px', transform: 'translateY(-50%)', background: 'white', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 5 }} />
                  )}
                </>
              )}

              {item.type === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', overflow: 'hidden', position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 2 }}>
                  <div style={{ height: item.showInfo === false ? '100%' : '55%', width: '100%', backgroundColor: '#f0f0f0', position: 'relative', transition: 'height 0.3s ease' }}>
                    {item.uploadedImages && item.uploadedImages[0] ? (
                      <img src={item.uploadedImages[0]} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                        Sin Imagen
                      </div>
                    )}
                  </div>
                  {item.showInfo !== false && (
                    <div
                      style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid #e6e6e6', borderTop: 'none', borderRadius: '0 0 4px 4px' }}
                      onMouseEnter={() => setIsHoveringText(true)}
                      onMouseLeave={() => setIsHoveringText(false)}
                    >
                      {editingField.id === item.uniqueId && editingField.field === 'contentTitle' ? (
                        <input
                          autoFocus
                          defaultValue={item.contentTitle || 'Título de la tarjeta'}
                          onBlur={(e) => {
                            updateItemText(item.uniqueId, 'contentTitle', e.target.value);
                            setEditingField({ id: null, field: null });
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                          style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333', border: '1px solid #3483fa', borderRadius: '3px', padding: '2px 5px', width: '100%', outline: 'none' }}
                        />
                      ) : (
                        <h4
                          onDoubleClick={() => !isPreviewMode && setEditingField({ id: item.uniqueId, field: 'contentTitle' })}
                          style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333', cursor: isPreviewMode ? 'default' : 'text' }}
                        >
                          {item.contentTitle || 'Título de la tarjeta'}
                        </h4>
                      )}

                      {editingField.id === item.uniqueId && editingField.field === 'contentParagraph' ? (
                        <textarea
                          autoFocus
                          defaultValue={item.contentParagraph || 'Este es un párrafo de ejemplo para la lista de contenido. Describe el evento o promoción.'}
                          onBlur={(e) => {
                            updateItemText(item.uniqueId, 'contentParagraph', e.target.value);
                            setEditingField({ id: null, field: null });
                          }}
                          style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666', lineHeight: '1.4', flex: 1, border: '1px solid #3483fa', borderRadius: '3px', padding: '5px', width: '100%', resize: 'none', outline: 'none' }}
                          rows={3}
                        />
                      ) : (
                        <p
                          onDoubleClick={() => !isPreviewMode && setEditingField({ id: item.uniqueId, field: 'contentParagraph' })}
                          style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666', lineHeight: '1.4', flex: 1, cursor: isPreviewMode ? 'default' : 'text' }}
                        >
                          {item.contentParagraph || 'Este es un párrafo de ejemplo para la lista de contenido. Describe el evento o promoción.'}
                        </p>
                      )}

                      {editingField.id === item.uniqueId && editingField.field === 'contentCTA' ? (
                        <input
                          autoFocus
                          defaultValue={item.contentCTA || 'Descubrir más'}
                          onBlur={(e) => {
                            updateItemText(item.uniqueId, 'contentCTA', e.target.value);
                            setEditingField({ id: null, field: null });
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                          style={{ color: '#3483fa', fontSize: '12px', fontWeight: 'bold', border: '1px solid #3483fa', borderRadius: '3px', padding: '2px 5px', width: 'fit-content', outline: 'none' }}
                        />
                      ) : (
                        <a
                          href="#"
                          onDoubleClick={(e) => {
                            if (!isPreviewMode) {
                              e.preventDefault();
                              setEditingField({ id: item.uniqueId, field: 'contentCTA' });
                            }
                          }}
                          style={{ color: '#3483fa', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', cursor: isPreviewMode ? 'pointer' : 'text' }}
                          onClick={(e) => { if (!isPreviewMode) e.preventDefault(); }}
                        >
                          {item.contentCTA || 'Descubrir más'}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {item.type !== 'banner' && item.id !== 'encabezado_portada_logo' && item.type !== 'list' && item.uploadedImages && item.uploadedImages[0] && (
                <img src={item.uploadedImages[0]} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
              )}

              

              </>

          {!isPreviewMode && (
            <>
              {safeAreaStyle && <div style={safeAreaStyle} title={`Área Segura: ${safeAreaStr}`} />}
              {showComponentInfo && (
                <div className="component-content" style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <h3>{item.name}</h3>
                  <p>Renderizado: {size.width} x {size.height} px</p>
                  {safeAreaStr && <p className="safe-area">Área Segura: {safeAreaStr}</p>}

                  {item.uploadedImages?.length > 0 && <span style={{ fontSize: '11px', marginTop: '10px', display: 'block', color: '#666' }}>{item.uploadedImages.length} imágenes cargadas</span>}

                  {item.notes && <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#666' }}>Nota: {item.notes}</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div style={{ height: '56px', background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100, flexShrink: 0 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '6px 12px', borderRadius: '6px', transition: 'all 0.18s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <ArrowLeft size={15} /> Proyectos
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

          {isEditingTitle ? (
            <input
              autoFocus
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              style={{ fontSize: '14px', fontWeight: '700', color: '#fff', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '4px 10px', outline: 'none', width: '220px' }}
            />
          ) : (
            <h2
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Doble clic para editar"
              style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', margin: 0, cursor: 'text', letterSpacing: '-0.2px' }}
            >
              {projectTitle}
            </h2>
          )}

          {isSaving ? (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Guardando…</span>
          ) : lastSaved ? (
            <span style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Guardado
            </span>
          ) : null}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            style={{ background: isPreviewMode ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', color: isPreviewMode ? '#34d399' : 'rgba(255,255,255,0.65)', border: `1px solid ${isPreviewMode ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '12px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {isPreviewMode ? <><Edit3 size={14} /> Editor</> : <><Play size={14} /> Preview</>}
          </button>

          {/* Botón Exportar PDF — solo en preview */}
          {isPreviewMode && (
            <button
              onClick={exportToPdf}
              disabled={isExporting}
              style={{ background: isExporting ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)', padding: '6px 14px', borderRadius: '6px', cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', opacity: isExporting ? 0.6 : 1 }}
              onMouseEnter={e => { if (!isExporting) e.currentTarget.style.background = 'rgba(16,185,129,0.25)'; }}
              onMouseLeave={e => { if (!isExporting) e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; }}
            >
              <FileDown size={14} />
              {isExporting ? 'Exportando…' : 'Exportar PDF'}
            </button>
          )}

          <button
            onClick={async () => {
              // Paso 1: verificación MAIA
              setMaiaCheckState('checking');
              setMaiaCheckItems([]);
              const { errors } = await runMaiaPrePublishCheck();
              if (errors.length > 0) {
                setMaiaCheckState({ errors });
                return;
              }
              setMaiaCheckState('ok');
              // Paso 2: publicar
              setIsPublishing(true);
              try {
                const res = await fetch(`${API_URL}/api/projects/${id}/publish`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setIsPublished(data.isPublished);
                if (data.slug) setPublishedSlug(data.slug);
                if (data.isPublished) setShowPublishModal(true);
              } catch (e) { console.error(e); }
              setIsPublishing(false);
              setMaiaCheckState(null);
            }}
            style={{ background: '#fff159', color: '#1a1f2e', border: 'none', padding: '7px 18px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.18s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ffe800'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff159'}
          >
            {isPublishing ? '...' : isPublished ? '✓ Publicado' : 'Publicar'}
          </button>

          {/* Publish Modal */}
          {showPublishModal && (() => {
            const publicUrl = `${window.location.origin}/view/${publishedSlug || id}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;
            return (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPublishModal(false)}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPublishModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#888' }}>✕</button>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#1a1a1a' }}>¡Maqueta publicada!</h2>
                    <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Cualquier persona con el enlace puede verla</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <img src={qrUrl} alt="QR Code" style={{ width: '160px', height: '160px', borderRadius: '12px', border: '3px solid #1a1f2e', padding: '6px' }} />
                  </div>
                  <div style={{ background: '#f4f6fb', border: '1px solid #e0e5ef', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ flex: 1, fontSize: '13px', color: '#444', wordBreak: 'break-all', fontFamily: 'monospace' }}>{publicUrl}</span>
                    <button onClick={() => { navigator.clipboard.writeText(publicUrl); }} style={{ background: '#1a1f2e', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Copiar</button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={publicUrl} target="_blank" rel="noreferrer" style={{ flex: 1, background: '#1a1f2e', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none', display: 'block' }}>Abrir enlace</a>
                    <button onClick={async () => {
                      const res = await fetch(`${API_URL}/api/projects/${id}/publish`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                      const data = await res.json();
                      setIsPublished(data.isPublished);
                      setShowPublishModal(false);
                    }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Despublicar</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Botón MAIA — panel de excepciones creativas */}
          <div style={{ position: 'relative' }}>
            <button
              id="maia-exceptions-btn"
              onClick={() => setShowMaiaPanel(p => !p)}
              title="Excepciones creativas de MAIA"
              style={{ background: showMaiaPanel ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)', border: showMaiaPanel ? '1px solid rgba(139,92,246,0.5)' : '1px solid transparent', color: 'white', cursor: 'pointer', padding: '3px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', overflow: 'hidden', transition: 'all 0.18s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = showMaiaPanel ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}
            >
              <img src="/MAIA.png" alt="MAIA" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </button>
            {exceptions.length > 0 && (
              <span style={{ position: 'absolute', top: '0px', right: '0px', background: '#8b5cf6', color: 'white', borderRadius: '50%', width: '14px', height: '14px', fontSize: '8px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #1a1f2e' }}>{exceptions.length > 9 ? '9+' : exceptions.length}</span>
            )}
            {showMaiaPanel && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '320px', background: 'white', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', border: '1px solid #e0e5ef', zIndex: 9999, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
                {/* Header */}
                <div style={{ background: '#1a1f2e', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/MAIA.png" alt="MAIA" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #8b5cf6' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '13px' }}>Excepciones creativas</p>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Palabras que MAIA no marca como error</p>
                  </div>
                  <button onClick={() => setShowMaiaPanel(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>

                {/* Form agregar */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f7', background: '#faf5ff' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>+ Agregar excepción</p>
                  <input
                    value={newExWord}
                    onChange={e => setNewExWord(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addException(); }}
                    placeholder='Palabra exacta (ej: "Ofertass")'
                    style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '6px', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = '#ddd6fe'}
                  />
                  <input
                    value={newExReason}
                    onChange={e => setNewExReason(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addException(); }}
                    placeholder='Razón creativa (opcional)'
                    style={{ width: '100%', fontSize: '12px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '6px 8px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = '#ddd6fe'}
                  />
                  <button
                    disabled={!newExWord.trim() || newExLoading}
                    onClick={addException}
                    style={{ width: '100%', background: !newExWord.trim() ? '#ede9fe' : '#7c3aed', color: !newExWord.trim() ? '#a78bfa' : 'white', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: '800', cursor: newExWord.trim() ? 'pointer' : 'default', transition: 'all 0.15s' }}
                  >{newExLoading ? 'Guardando...' : 'Guardar excepción'}</button>
                </div>

                {/* Lista */}
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {exceptions.length === 0 ? (
                    <p style={{ color: '#9ba3b5', fontSize: '12px', textAlign: 'center', padding: '20px 16px', margin: 0 }}>Sin excepciones registradas</p>
                  ) : exceptions.map(ex => (
                    <div key={ex.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f0f2f7' }}>
                      {editingExId === ex.id ? (
                        /* ── Modo edición ── */
                        <div>
                          <input
                            value={editWord}
                            onChange={e => setEditWord(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') editException(ex.id); if (e.key === 'Escape') setEditingExId(null); }}
                            autoFocus
                            style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace', border: '1.5px solid #8b5cf6', borderRadius: '6px', padding: '5px 8px', outline: 'none', marginBottom: '5px', boxSizing: 'border-box' }}
                          />
                          <input
                            value={editReason}
                            onChange={e => setEditReason(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') editException(ex.id); if (e.key === 'Escape') setEditingExId(null); }}
                            placeholder='Razón creativa (opcional)'
                            style={{ width: '100%', fontSize: '11px', border: '1.5px solid #ddd6fe', borderRadius: '6px', padding: '5px 8px', outline: 'none', marginBottom: '7px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                            onBlur={e => e.target.style.borderColor = '#ddd6fe'}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => editException(ex.id)}
                              disabled={!editWord.trim()}
                              style={{ flex: 1, background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                            >Guardar</button>
                            <button
                              onClick={() => setEditingExId(null)}
                              style={{ flex: 1, background: '#f0f2f7', color: '#6b7280', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        /* ── Modo lectura ── */
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1a1f2e', fontFamily: 'monospace' }}>«{ex.word}»</p>
                            {ex.reason && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>{ex.reason}</p>}
                            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#b0b9cc' }}>{new Date(ex.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <button
                            onClick={() => { setEditingExId(ex.id); setEditWord(ex.word); setEditReason(ex.reason || ''); }}
                            title="Editar excepción"
                            style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', borderRadius: '4px', flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >✏</button>
                          <button
                            onClick={() => deleteException(ex.id)}
                            title="Eliminar excepción"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', flexShrink: 0, borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >🗑</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campana de notificaciones */}
          <div style={{ position: 'relative' }}>
            <button
              id="notif-bell-btn"
              onClick={() => { setShowNotifPanel(!showNotifPanel); if (!showNotifPanel) markNotifsRead(); }}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.18s', position: 'relative' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #1a1f2e' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifPanel && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '300px', background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e0e5ef', zIndex: 9999, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>🔔 Notificaciones</span>
                  <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ color: '#9ba3b5', fontSize: '13px', textAlign: 'center', padding: '24px 16px', margin: 0 }}>Sin notificaciones</p>
                  ) : notifications.map(n => (
                    <div key={n.id}
                      onClick={() => {
                        setShowNotifPanel(false);
                        const elementId = n.comment?.elementId;
                        if (elementId) scrollToElement(elementId);
                      }}
                      style={{ padding: '10px 14px', borderBottom: '1px solid #f0f2f7', cursor: 'pointer', background: n.read ? 'white' : '#eef4ff', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f4f6fb'}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? 'white' : '#eef4ff'}
                    >
                      {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3483fa', marginTop: '5px', flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#1a1f2e' }}>
                          {n.comment.author.name} te mencionó
                        </p>
                        <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#6b7280' }}>en "{n.comment.project.title}"</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontStyle: 'italic' }}>«{n.comment.text.slice(0, 60)}{n.comment.text.length > 60 ? '…' : ''}»</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {projectCollabs.length > 0 && (
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
          )}
          {/* Avatares de todos los colaboradores con anillo de color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {projectCollabs.map((collab) => (
              <div
                key={collab.id}
                title={collab.name || collab.email}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: `2.5px solid ${collab.color}`,
                  overflow: 'hidden', flexShrink: 0,
                  boxShadow: `0 0 0 1px rgba(0,0,0,0.3), 0 0 8px ${collab.color}55`,
                  transition: 'transform 0.15s',
                  cursor: 'default'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {(collab.picture || collab.avatar) ? (
                  <img
                    src={collab.picture || collab.avatar}
                    alt={collab.name || 'Avatar'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: collab.color === '#fff159' ? '#fff159' : collab.color,
                    color: collab.color === '#fff159' ? '#1a1f2e' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '13px'
                  }}>
                    {(collab.name || collab.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botón + para agregar colaborador (todos los usuarios) */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowAddCollab(!showAddCollab); setCollabSearch(''); }}
                title="Agregar colaborador"
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.35)',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '300', lineHeight: 1,
                  transition: 'all 0.18s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
              >+</button>

              {showAddCollab && (() => {
                const collabIds = new Set(projectCollabs.map(c => c.id));
                const available = allUsers.filter(u =>
                  !collabIds.has(u.id) &&
                  ((u.name || '').toLowerCase().includes(collabSearch.toLowerCase()) ||
                   (u.email || '').toLowerCase().includes(collabSearch.toLowerCase()))
                );
                return (
                  <div
                    style={{
                      position: 'absolute', top: '42px', right: 0,
                      width: '240px', background: 'white', borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: '1px solid #e0e5ef',
                      zIndex: 9999, overflow: 'hidden'
                    }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <div style={{ padding: '10px 12px', background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>Agregar colaborador</span>
                      <button onClick={() => { setShowAddCollab(false); setCollabError(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <input
                        autoFocus
                        value={collabSearch}
                        onChange={e => { setCollabSearch(e.target.value); setCollabError(''); }}
                        placeholder="Buscar por nombre o email…"
                        style={{ width: '100%', fontSize: '12px', border: '1.5px solid #e0e5ef', borderRadius: '7px', padding: '6px 10px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#3483fa'}
                        onBlur={e => e.target.style.borderColor = '#e0e5ef'}
                      />
                    </div>
                    {/* Mensaje de error */}
                    {collabError && (
                      <div style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '600', borderTop: '1px solid #fca5a5' }}>
                        ⚠️ {collabError}
                      </div>
                    )}
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {available.length === 0 ? (
                        <p style={{ color: '#9ba3b5', fontSize: '12px', textAlign: 'center', padding: '16px', margin: 0 }}>Sin usuarios disponibles</p>
                      ) : available.map(u => (
                        <div
                          key={u.id}
                          onMouseDown={(e) => { e.preventDefault(); addCollaborator(u.id); }}
                          style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '1px solid #f0f2f7', userSelect: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f4f6fb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3483fa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0, overflow: 'hidden' }}>
                            {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                            <p style={{ margin: 0, fontSize: '10px', color: '#9ba3b5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                          </div>
                          <span style={{ fontSize: '18px', color: '#3483fa', fontWeight: '300' }}>+</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="builder-layout" style={{ height: 'calc(100vh - 56px)' }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* ── SIDEBAR ── */}
        {!isPreviewMode && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h2>Componentes</h2>
            </div>
            <div className="sidebar-content">
              <div className="comp-grid">
                {componentsList
                  .filter(comp => viewMode === 'desktop' ? comp.desktopSize : comp.mobileSize)
                  .map((comp) => (
                    <div
                      key={comp.id}
                      className="comp-card"
                      draggable
                      onDragStart={(e) => handleDragStartSidebar(e, comp)}
                      title={comp.notes || comp.name}
                    >
                      <div className="comp-card-icon">{getIcon(comp.type)}</div>
                      <span className="comp-card-label">{comp.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="canvas-area" onContextMenu={handleContextMenu}>
          <div className="canvas-toolbar">
            <div className="view-toggle">
              <button className={`view-btn ${viewMode === 'desktop' ? 'active' : ''}`} onClick={() => setViewMode('desktop')}><Monitor size={18} /> Desktop</button>
              <button className={`view-btn ${viewMode === 'mobile' ? 'active' : ''}`} onClick={() => setViewMode('mobile')}><Smartphone size={18} /> Mobile</button>
            </div>
          </div>

          <div className="canvas-container" onMouseDown={handleMouseDown} ref={containerRef}>
            <div style={{ width: (viewMode === 'desktop' ? 1920 : 800) * scale, display: 'flex', justifyContent: 'center', transition: 'width 0.3s ease' }}>
              <div className={`canvas-wrapper ${viewMode}`} ref={pdfCanvasRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                {viewMode === 'mobile' ? (
                  <div className="mobile-app-header">
                    {/* Status bar */}
                    <div className="mobile-status-bar">
                      <span className="mobile-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="mobile-status-icons">
                        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><rect x="0" y="3" width="3" height="9" rx="0.5" fill="#1a1a1a"/><rect x="4.5" y="2" width="3" height="10" rx="0.5" fill="#1a1a1a"/><rect x="9" y="0" width="3" height="12" rx="0.5" fill="#d0d0d0"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#d0d0d0"/></svg>
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 2.4C10.8 2.4 13.3 3.6 15 5.6L16 4.4C13.9 2 11.1 0.6 8 0.6C4.9 0.6 2.1 2 0 4.4L1 5.6C2.7 3.6 5.2 2.4 8 2.4Z" fill="#1a1a1a"/><path d="M8 5.6C9.9 5.6 11.6 6.4 12.8 7.7L13.8 6.5C12.3 4.9 10.2 4 8 4C5.8 4 3.7 4.9 2.2 6.5L3.2 7.7C4.4 6.4 6.1 5.6 8 5.6Z" fill="#1a1a1a"/><circle cx="8" cy="10.5" r="1.5" fill="#1a1a1a"/></svg>
                        <div className="mobile-battery">
                          <span>84</span>
                          <svg width="28" height="14" viewBox="0 0 28 14" fill="none"><rect x="0.5" y="0.5" width="24" height="13" rx="3.5" stroke="#1a1a1a"/><rect x="2" y="2" width="19" height="10" rx="2" fill="#1a1a1a"/><path d="M26 4.5V9.5C27.1 9 27.1 5 26 4.5Z" fill="#1a1a1a"/></svg>
                        </div>
                      </div>
                    </div>
                    {/* Search row */}
                    <div className="mobile-search-row">
                      <div className="mobile-search-input">
                        <Search size={16} color="#9ca3af" />
                        <span>Buscar en Mercado Libre</span>
                      </div>
                      <div className="mobile-bell-btn">
                        <Bell size={22} color="#1a1a1a" />
                        <span className="mobile-bell-badge">1</span>
                      </div>
                    </div>
                    {/* Location */}
                    <div className="mobile-location-row">
                      <MapPin size={14} color="#1a1a1a" />
                      <span>CP 56806</span>
                      <ChevronDown size={14} color="#1a1a1a" />
                    </div>
                    {/* Category chips */}
                    <div className="mobile-category-chips">
                      {['Todo','Celulares','Moda','Belleza','Vehículos','Hogar','Televisores','Juegos'].map((cat, i) => (
                        <span key={cat} className={`mobile-chip ${i === 0 ? 'active' : ''}`}>{cat}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="meli-header-container">
                    <div className="meli-header-top">
                      <div className="meli-logo"><img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years_v2.png" alt="Mercado Libre" /></div>
                      <div className="meli-search-bar">
                        <input type="text" placeholder="Buscar productos, marcas y más..." />
                        <div className="meli-search-store"><span>en Nike</span><ChevronDown size={14} /></div>
                        <button className="meli-search-btn"><Search size={18} color="#666" /></button>
                      </div>
                      <div className="meli-promo"><Tag size={20} /><span>Ofertas por tiempo limitado</span></div>
                    </div>
                    <div className="meli-header-bottom">
                      <div className="meli-location"><MapPin size={22} opacity={0.6} /><div className="location-text"><span className="location-send">Enviar a</span><span className="location-cp">CP 56607</span></div></div>
                      <div className="meli-nav-links">
                        <a href="#">Categorías <ChevronDown size={12} /></a><a href="#">Ofertas</a><a href="#">Cupones</a><a href="#">Supermercado</a><a href="#">Moda</a><a href="#" className="mercado-play">Mercado Play <span className="gratis-badge">GRATIS</span></a><a href="#">Vender</a><a href="#">Ayuda</a>
                      </div>
                      <div className="meli-user-links">
                        <a href="#" className="user-profile"><div className="user-avatar">MM</div>Manuel <ChevronDown size={12} /></a><a href="#">Mis compras</a><a href="#">Favoritos <ChevronDown size={12} /></a><a href="#"><Bell size={18} /></a><a href="#"><ShoppingCart size={18} /></a>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`drop-zone ${isOverCanvas ? 'is-over' : ''}`}
                  onDragOver={handleDragOverCanvas}
                  onDragLeave={handleDragLeaveCanvas}
                  onDrop={(e) => handleDropCanvas(e)}
                >
                  {canvasItems.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: '100px', width: '100%' }}>
                      <h3>Arrastra componentes aquí para construir tu Landing</h3>
                    </div>
                  ) : (
                    <>
                      {/* Zona de drop en la parte superior para insertar ANTES del primer elemento */}
                      {!isPreviewMode && (
                        <div
                          style={{
                            width: '100%',
                            height: dragOverTarget?.index === -1 ? '6px' : '6px',
                            background: dragOverTarget?.index === -1 ? '#3483fa' : 'transparent',
                            transition: 'background 0.15s',
                            cursor: 'default'
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverTarget({ index: -1, position: 'before' });
                          }}
                          onDragLeave={() => setDragOverTarget(null)}
                          onDrop={(e) => {
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverTarget(null);
                            const componentId = e.dataTransfer.getData('componentId');
                            if (componentId) {
                              const component = componentsList.find(c => c.id === componentId);
                              if (component) {
                                const newItem = { ...component, uniqueId: 'comp-' + Date.now() + Math.random() };
                                setCanvasItems([newItem, ...canvasItems]);
                              }
                            } else if (draggedIndex !== null && draggedIndex !== 0) {
                              const newItems = [...canvasItems];
                              const [removed] = newItems.splice(draggedIndex, 1);
                              newItems.unshift(removed);
                              setCanvasItems(newItems);
                              setDraggedIndex(null);
                            }
                          }}
                        />
                      )}
                      {canvasItems.map((item, index) => renderItem(item, false, index))}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Lasso Box Rendering */}
            {lasso && (
              <div
                className="lasso-selection"
                style={{
                  left: Math.min(lasso.startX, lasso.currentX),
                  top: Math.min(lasso.startY, lasso.currentY),
                  width: Math.abs(lasso.currentX - lasso.startX),
                  height: Math.abs(lasso.currentY - lasso.startY),
                }}
              />
            )}
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="context-menu"
            style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000, background: 'white', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '5px 0', minWidth: '150px' }}
          >
            

            {contextMenu.targetId && (() => {
              // Buscar el item target en ambos canvases
              let targetItem = null;
              [...canvases.desktop, ...canvases.mobile].forEach(i => {
                if (i.uniqueId === contextMenu.targetId) targetItem = i;
                if (i.type === 'rowGroup') i.items.forEach(c => { if (c.uniqueId === contextMenu.targetId) targetItem = c; });
              });
              const hasImage = targetItem?.uploadedImages?.length > 0;
              const hasTexts = targetItem?.type === 'list'; // Solo 'list' tiene textos editables
              return (
                <>
                  {hasTexts && (
                    <div className="context-menu-item" onClick={() => {
                      setTextEditorPanel({ item: targetItem });
                      setContextMenu(null);
                    }} style={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #eee', marginBottom: '4px', paddingBottom: '8px' }}>
                      <Edit3 size={16} /> Editar Textos
                    </div>
                  )}
                  <div className="context-menu-item" onClick={() => { setActiveCommentElId(contextMenu.targetId); setContextMenu(null); }} style={{ fontWeight: 'bold', color: '#6b7280' }}>
                    💬 Comentar
                  </div>
                  {/* Opciones dinámicas de subir imagen */}
                  {(() => {
                    const imgs = targetItem?.uploadedImages?.filter(Boolean) || [];
                    const isMultiType = ['banner', 'carousel'].includes(targetItem?.type);
                    if (isMultiType) {
                      // Mostrar opción para subir la siguiente imagen
                      const nextIndex = imgs.length;
                      return (
                        <>
                          <div className="context-menu-item" onClick={() => {
                            setUploadTargetId(contextMenu.targetId);
                            setUploadIndex(nextIndex);
                            if (fileInputRef.current) fileInputRef.current.click();
                            setContextMenu(null);
                          }} style={{ fontWeight: 'bold', color: '#3483fa' }}>
                            <ImageIcon size={16} /> Subir imagen {nextIndex + 1}
                          </div>
                          {imgs.length > 0 && (
                            <div className="context-menu-item" onClick={() => {
                              setCanvasItems(prev => prev.map(it => {
                                if (it.uniqueId === contextMenu.targetId) return { ...it, uploadedImages: [] };
                                if (it.type === 'rowGroup') return { ...it, items: it.items.map(c => c.uniqueId === contextMenu.targetId ? { ...c, uploadedImages: [] } : c) };
                                return it;
                              }));
                              setContextMenu(null);
                            }} style={{ color: '#e53e3e' }}>
                              <ImageIcon size={16} /> Quitar todas las imágenes ({imgs.length})
                            </div>
                          )}
                        </>
                      );
                    }
                    // Para otros tipos: comportamiento original
                    return (
                      <>
                        <div className="context-menu-item" onClick={() => { triggerUpload(contextMenu.targetId); setContextMenu(null); }} style={{ fontWeight: 'bold', color: '#3483fa' }}>
                          <ImageIcon size={16} /> {imgs.length > 0 ? 'Cambiar Imagen' : 'Subir Imagen'}
                        </div>
                        {imgs.length > 0 && (
                          <div className="context-menu-item" onClick={() => {
                            setCanvasItems(prev => prev.map(it => {
                              if (it.uniqueId === contextMenu.targetId) return { ...it, uploadedImages: [] };
                              if (it.type === 'rowGroup') return { ...it, items: it.items.map(c => c.uniqueId === contextMenu.targetId ? { ...c, uploadedImages: [] } : c) };
                              return it;
                            }));
                            setContextMenu(null);
                          }} style={{ color: '#e53e3e' }}>
                            <ImageIcon size={16} /> Quitar Imagen
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="context-menu-item" onClick={() => { removeItem(contextMenu.targetId); setContextMenu(null); }} style={{ color: '#e53e3e', borderTop: '1px solid #eee', marginTop: '4px', paddingTop: '4px' }}>
                    <Trash2 size={16} /> Eliminar Componente
                  </div>
                  <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
                </>
              );
            })()}

            {/* Toggle Info for Lists */}
            {(() => {
              let targetItem = null;
              canvases.desktop.forEach(i => {
                if (i.uniqueId === contextMenu.targetId) targetItem = i;
                if (i.type === 'rowGroup') i.items.forEach(c => { if (c.uniqueId === contextMenu.targetId) targetItem = c; });
              });
              if (!targetItem) {
                canvases.mobile.forEach(i => {
                  if (i.uniqueId === contextMenu.targetId) targetItem = i;
                  if (i.type === 'rowGroup') i.items.forEach(c => { if (c.uniqueId === contextMenu.targetId) targetItem = c; });
                });
              }
              if (targetItem && targetItem.type === 'list') {
                return (
                  <div className="context-menu-item" onClick={() => { toggleItemInfo(contextMenu.targetId); setContextMenu(null); }}>
                    {targetItem.showInfo === false ? <><Eye size={16} /> Mostrar Textos</> : <><EyeOff size={16} /> Ocultar Textos</>}
                  </div>
                );
              }
              return null;
            })()}

            <div className="context-menu-item" onClick={() => { setShowSafeAreas(!showSafeAreas); setContextMenu(null); }}>
              <Tag size={16} /> {showSafeAreas ? "Ocultar Áreas Seguras" : "Visualizar Áreas Seguras"}
            </div>
            <div className="context-menu-item" onClick={() => { setShowComponentInfo(!showComponentInfo); setContextMenu(null); }}>
              {showComponentInfo ? <><EyeOff size={16} /> Ocultar Info de Componentes</> : <><Eye size={16} /> Mostrar Info de Componentes</>}
            </div>
            {selectedIds.size >= 2 && (
              <>
                <div className="context-menu-item" onClick={() => groupSelected('center')}>
                  <AlignCenter size={16} /> Centrar elementos
                </div>
                <div className="context-menu-item" onClick={() => groupSelected('space-around')}>
                  <MoveHorizontal size={16} /> Distribuir espacio (Space-around)
                </div>
                <div className="context-menu-item" onClick={() => groupSelected('space-between')}>
                  <AlignJustify size={16} /> Distribuir bordes (Space-between)
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating Line Break Draggable */}
        {!isPreviewMode && (
          <div
            className="floating-break-btn"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('componentId', 'salto_linea');
              e.dataTransfer.effectAllowed = 'copy';
            }}
            title="Arrastra para forzar un salto de línea"
          >
            <CornerDownLeft size={28} />
          </div>
        )}
      </div>

      {/* Global Hidden File Input */}
      <input
        ref={fileInputRef}
        id="global-file-input"
        type="file"
        accept="image/*"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}
        onChange={handleGlobalImageUpload}
      />

      {/* ── MAIA Pre-publish check overlay ── */}
      {maiaCheckState && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99998,
          background: 'rgba(10,14,26,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            background: '#0f1420', borderRadius: '20px',
            padding: '36px 40px', minWidth: '420px', maxWidth: '520px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontFamily: "'Inter', sans-serif",
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
          }}>

            {/* MAIA avatar + título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                boxShadow: maiaCheckState === 'checking'
                  ? '0 0 0 3px #3483fa, 0 0 20px #3483fa88'
                  : maiaCheckState === 'ok'
                  ? '0 0 0 3px #10b981, 0 0 20px #10b98188'
                  : '0 0 0 3px #ef4444, 0 0 20px #ef444488)',
                animation: maiaCheckState === 'checking' ? 'pulse 1.4s infinite' : 'none'
              }}>
                <img src="/MAIA.png" alt="MAIA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '800', fontSize: '17px', color: '#ffffff' }}>
                  {maiaCheckState === 'checking' ? 'Verificando maqueta...' :
                   maiaCheckState === 'ok' ? '¡Todo en orden!' :
                   'No se puede publicar'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  {maiaCheckState === 'checking' ? 'MAIA está revisando cada elemento' :
                   maiaCheckState === 'ok' ? 'Publicando...' :
                   'Corregí los errores antes de publicar'}
                </p>
              </div>
            </div>

            {/* Lista de items verificados */}
            {maiaCheckState === 'checking' && maiaCheckItems.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {maiaCheckItems.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                    padding: '8px 12px',
                    border: `1px solid ${item.status === 'ok' ? 'rgba(16,185,129,0.3)' : item.status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`
                  }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>
                      {item.status === 'pending' ? '⏳' : item.status === 'ok' ? '✅' : '❌'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>{item.name}</p>
                      {item.msg && <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#ef4444' }}>{item.msg}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error screen */}
            {maiaCheckState !== 'checking' && maiaCheckState !== 'ok' && maiaCheckState?.errors && (
              <div style={{ width: '100%' }}>
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px', padding: '14px', marginBottom: '16px'
                }}>
                  {maiaCheckState.errors.map((err, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: i < maiaCheckState.errors.length - 1 ? '8px' : 0 }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>❌</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#fca5a5' }}>{err.name}</p>
                        <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'rgba(252,165,165,0.7)' }}>{err.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setMaiaCheckState(null)}
                  style={{
                    width: '100%', padding: '12px',
                    background: '#fff159', color: '#1a1f2e',
                    border: 'none', borderRadius: '10px',
                    fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}
                >
                  Corregir y volver al editor
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel flotante de edición de textos */}
      {textEditorPanel && (() => {
        const panelItem = textEditorPanel.item;
        const fields = [
          { key: 'contentTitle', label: 'Título', type: 'input', placeholder: 'Título de la tarjeta' },
          { key: 'contentParagraph', label: 'Párrafo', type: 'textarea', placeholder: 'Describe el evento o promoción.' },
          { key: 'contentCTA', label: 'Texto del CTA', type: 'input', placeholder: 'Descubrir más' },
        ];
        // Estado local temporal para los valores del panel
        const handleSave = (e) => {
          e.preventDefault();
          const form = e.target;
          const updates = {};
          fields.forEach(f => {
            const el = form.elements[f.key];
            if (el) updates[f.key] = el.value;
          });
          setCanvasItems(prev => prev.map(item => {
            if (item.uniqueId === panelItem.uniqueId) return { ...item, ...updates };
            if (item.type === 'rowGroup') return {
              ...item,
              items: item.items.map(c => c.uniqueId === panelItem.uniqueId ? { ...c, ...updates } : c)
            };
            return item;
          }));
          setTextEditorPanel(null);
        };

        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setTextEditorPanel(null)}
          >
            <div
              style={{ background: 'white', borderRadius: '14px', padding: '28px 32px', width: '440px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header del panel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#1a1a1a', fontWeight: 700 }}>✏️ Editar Textos</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#999' }}>{panelItem.name}</p>
                </div>
                <button onClick={() => setTextEditorPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '20px', lineHeight: 1 }}>✕</button>
              </div>

              <form onSubmit={handleSave}>
                {fields.map(f => (
                  <div key={f.key} style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {f.label}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        name={f.key}
                        defaultValue={panelItem[f.key] || ''}
                        placeholder={f.placeholder}
                        rows={3}
                        style={{ width: '100%', border: '1.5px solid #e6e6e6', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#333', outline: 'none', resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = '#3483fa'}
                        onBlur={e => e.target.style.borderColor = '#e6e6e6'}
                      />
                    ) : (
                      <input
                        name={f.key}
                        defaultValue={panelItem[f.key] || ''}
                        placeholder={f.placeholder}
                        style={{ width: '100%', border: '1.5px solid #e6e6e6', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#333', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = '#3483fa'}
                        onBlur={e => e.target.style.borderColor = '#e6e6e6'}
                      />
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" style={{ flex: 1, background: '#3483fa', color: 'white', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    Guardar Cambios
                  </button>
                  <button type="button" onClick={() => setTextEditorPanel(null)} style={{ background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '8px', padding: '11px 18px', fontSize: '14px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

export default Editor;
