import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Monitor, Smartphone, GripVertical, Trash2, Image as ImageIcon, Layout, Type, Video, Search, MapPin, Tag, ChevronDown, Bell, ShoppingCart, User, AlignCenter, MoveHorizontal, ListMinus, AlignJustify, CornerDownLeft, ArrowLeft, CheckCircle2, Play, Edit3, Eye, EyeOff, Layers } from 'lucide-react';
import { componentsList } from '../componentsData';
import API_URL from '../api';
import '../index.css';


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
    default: return <Layout size={20} />;
  }
};

const AnimatedBanner = ({ item, height, isPreviewMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const validImages = (item?.uploadedImages || []).filter(Boolean);
  const images = validImages.length > 0 ? validImages : [
    "https://http2.mlstatic.com/D_NQ_853512-MLA75916035059_042024-OO.webp",
    "https://http2.mlstatic.com/D_NQ_938676-MLA75908076632_042024-OO.webp"
  ];

  useEffect(() => {
    if (!isPreviewMode) {
      setCurrentIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length, isPreviewMode]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
      {images.map((img, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: currentIndex === idx ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out'
          }}
        />
      ))}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: '15px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 20 }}>
          {images.map((_, idx) => (
            <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentIndex === idx ? '#3483fa' : 'rgba(255,255,255,0.5)', transition: 'background-color 0.3s' }} />
          ))}
        </div>
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
  const [textEditorPanel, setTextEditorPanel] = useState(null); // { item, x, y }

  // Global Upload State
  const [uploadTargetId, setUploadTargetId] = useState(null);
  const [uploadIndex, setUploadIndex] = useState(0);
  const fileInputRef = useRef(null);

  const [isHoveringText, setIsHoveringText] = useState(false);
  const [editingField, setEditingField] = useState({ id: null, field: null });

  const [viewMode, setViewMode] = useState('desktop');
  const [canvases, setCanvases] = useState({ desktop: [], mobile: [] });
  const canvasItems = canvases[viewMode];

  const isInitialLoad = useRef(true);

  // Carga inicial del proyecto
  useEffect(() => {
    const savedUser = localStorage.getItem('tropica_user');
    if (!savedUser) {
      navigate('/login');
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
          // Esperamos un momento para que el setState no dispare el AutoGuardado
          setTimeout(() => { isInitialLoad.current = false; }, 1000);
        })
        .catch(err => {
          console.error(err);
          navigate('/projects');
        });
    }
  }, [id, navigate]);

  // Autoguardado silencioso con Debounce (espera 1.5s sin cambios para guardar)
  useEffect(() => {
    if (isInitialLoad.current || !token) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      fetch(`${API_URL}/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

  const triggerUpload = (uniqueId) => {
    setUploadTargetId(uniqueId);
    setUploadIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Drag & Drop de archivos del sistema operativo sobre el componente
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
        const targetWidth = viewMode === 'desktop' ? 1920 : 375;
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
        const newItem = { ...component, uniqueId: 'comp-' + Date.now() + Math.random() };

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
        <div
          className="component-placeholder"
          style={{ height: `${height}px`, width: '100%', position: 'relative', padding: 0 }}
        >
          
            <>
              {item.type === 'banner' && <AnimatedBanner item={item} height={height} isPreviewMode={isPreviewMode} />}

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Editor Top Navigation Bar */}
      <div style={{ height: '60px', backgroundColor: 'white', borderBottom: '1px solid #e6e6e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', color: '#3483fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold' }}
          >
            <ArrowLeft size={18} /> Volver a Proyectos
          </button>

          <div style={{ width: '1px', height: '30px', backgroundColor: '#e6e6e6' }}></div>

          {isEditingTitle ? (
            <input
              autoFocus
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              style={{ fontSize: '18px', color: '#333', margin: 0, border: '1px solid #3483fa', borderRadius: '4px', padding: '4px 8px', outline: 'none' }}
            />
          ) : (
            <h2
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Doble clic para editar nombre"
              style={{ fontSize: '18px', color: '#333', margin: 0, cursor: 'text' }}
            >
              {projectTitle}
            </h2>
          )}

          {/* Indicador de Autoguardado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
            {isSaving ? (
              <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Guardando cambios...</span>
            ) : lastSaved ? (
              <span style={{ fontSize: '12px', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Guardado
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            style={{
              background: isPreviewMode ? '#10b981' : '#f0f0f0',
              color: isPreviewMode ? 'white' : '#333',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            {isPreviewMode ? <><Edit3 size={16} /> Volver al Editor</> : <><Play size={16} /> Go Live (Preview)</>}
          </button>

          {/* Botón Publish */}
          <button
            onClick={async () => {
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
            }}
            style={{
              background: isPublished ? '#7c3aed' : '#f5f0ff',
              color: isPublished ? 'white' : '#7c3aed',
              border: '1.5px solid #7c3aed',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 'bold',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {isPublishing ? '...' : isPublished ? '✓ Publicado' : '🔗 Publicar'}
          </button>

          {/* Modal Publish */}
          {showPublishModal && (() => {
            const publicUrl = `${window.location.origin}/view/${publishedSlug || id}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;
            return (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPublishModal(false)}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPublishModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#888' }}>✕</button>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#1a1a1a' }}>¡Maqueta publicada!</h2>
                    <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Cualquier persona con el enlace puede verla</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <img src={qrUrl} alt="QR Code" style={{ width: '160px', height: '160px', borderRadius: '12px', border: '3px solid #7c3aed', padding: '6px' }} />
                  </div>
                  <div style={{ background: '#f8f5ff', border: '1px solid #e0d5ff', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ flex: 1, fontSize: '13px', color: '#444', wordBreak: 'break-all', fontFamily: 'monospace' }}>{publicUrl}</span>
                    <button onClick={() => { navigator.clipboard.writeText(publicUrl); }} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Copiar</button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={publicUrl} target="_blank" rel="noreferrer" style={{ flex: 1, background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none', display: 'block' }}>Abrir enlace</a>
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

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>{user.email}</span>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #f0f0f0' }} />
              ) : (
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#3483fa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="builder-layout" style={{ height: 'calc(100vh - 60px)' }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* Sidebar */}
        {!isPreviewMode && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h2>Elementos Mercado Libre</h2>
            </div>
            <div className="sidebar-content">
              {componentsList.filter(comp => viewMode === 'desktop' ? comp.desktopSize : comp.mobileSize).map((comp) => (
                <div key={comp.id} className="draggable-item" draggable onDragStart={(e) => handleDragStartSidebar(e, comp)}>
                  <GripVertical size={16} color="#ccc" />
                  <div className="item-icon">{getIcon(comp.type)}</div>
                  <div className="item-details">
                    <h4>{comp.name}</h4>
                    <p>D: {comp.desktopSize.width}x{comp.desktopSize.height} | M: {comp.mobileSize ? `${comp.mobileSize.width}x${comp.mobileSize.height}` : 'N/A'}</p>
                  </div>
                </div>
              ))}
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
            <div style={{ width: (viewMode === 'desktop' ? 1920 : 375) * scale, display: 'flex', justifyContent: 'center', transition: 'width 0.3s ease' }}>
              <div className={`canvas-wrapper ${viewMode}`} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                <div className={`meli-header-container ${viewMode === 'mobile' ? 'mobile-header' : ''}`}>
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
                  <div className="context-menu-item" onClick={() => { triggerUpload(contextMenu.targetId); setContextMenu(null); }} style={{ fontWeight: 'bold', color: '#3483fa' }}>
                    <ImageIcon size={16} /> {hasImage ? 'Cambiar Imagen' : 'Subir Imagen'}
                  </div>
                  {hasImage && (
                    <div className="context-menu-item" onClick={() => {
                      setCanvasItems(prev => prev.map(item => {
                        if (item.uniqueId === contextMenu.targetId) return { ...item, uploadedImages: [] };
                        if (item.type === 'rowGroup') return { ...item, items: item.items.map(c => c.uniqueId === contextMenu.targetId ? { ...c, uploadedImages: [] } : c) };
                        return item;
                      }));
                      setContextMenu(null);
                    }} style={{ color: '#e53e3e' }}>
                      <ImageIcon size={16} /> Quitar Imagen
                    </div>
                  )}
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
