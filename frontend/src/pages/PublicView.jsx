import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, Smartphone, ChevronDown, Search, Tag, MapPin, Bell, ShoppingCart, Menu, ChevronRight } from 'lucide-react';
import API_URL from '../api';

const isMobileDevice = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

// ─── Animated Banner ────────────────────────────────────────────
const AnimatedBanner = ({ item, height }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const validImages = (item?.uploadedImages || []).filter(Boolean);
  const images = validImages.length > 0 ? validImages : [
    'https://http2.mlstatic.com/D_NQ_853512-MLA75916035059_042024-OO.webp',
    'https://http2.mlstatic.com/D_NQ_938676-MLA75908076632_042024-OO.webp'
  ];

  useEffect(() => {
    const t = setInterval(() => setCurrentIndex(p => (p + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {images.map((img, idx) => (
        <div key={idx} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: currentIndex === idx ? 1 : 0, transition: 'opacity 0.8s ease-in-out'
        }} />
      ))}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 15, width: '100%', display: 'flex', justifyContent: 'center', gap: 8, zIndex: 20 }}>
          {images.map((_, idx) => (
            <div key={idx} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: currentIndex === idx ? '#3483fa' : 'rgba(255,255,255,0.5)', transition: 'background-color 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Render Item ────────────────────────────────────────────────
const renderPublicItem = (item, viewMode) => {
  if (item.type === 'rowGroup') {
    return (
      <div key={item.uniqueId} style={{ display: 'flex', width: '100%', justifyContent: item.justify, gap: 20, flexWrap: 'wrap' }}>
        {item.items.map(child => renderPublicItem(child, viewMode))}
      </div>
    );
  }

  const size = viewMode === 'desktop' ? item.desktopSize : item.mobileSize;
  if (!size) return null;
  const { height, width } = size;

  if (item.type === 'spacer') return <div key={item.uniqueId} style={{ width: '100%', height: 20 }} />;

  return (
    <div key={item.uniqueId} style={{ width, position: 'relative' }}>
      <div style={{ height, width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#ebebeb' }}>
        {item.type === 'banner' && <AnimatedBanner item={item} height={height} />}

        {item.id === 'encabezado_portada_logo' && (<>
          {item.uploadedImages?.[0] && <img src={item.uploadedImages[0]} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
          {item.uploadedImages?.[1] && <img src={item.uploadedImages[1]} alt="Logo" style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'contain', position: 'absolute', top: '50%', left: 40, transform: 'translateY(-50%)', background: 'white', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 5 }} />}
        </>)}

        {item.type === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', overflow: 'hidden', position: 'absolute', inset: 0, zIndex: 2 }}>
            <div style={{ height: item.showInfo === false ? '100%' : '55%', backgroundColor: '#f0f0f0', position: 'relative' }}>
              {item.uploadedImages?.[0]
                ? <img src={item.uploadedImages[0]} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>Sin Imagen</div>}
            </div>
            {item.showInfo !== false && (
              <div style={{ padding: 15, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#333' }}>{item.contentTitle || 'Título de la tarjeta'}</h4>
                <p style={{ margin: '0 0 15px 0', fontSize: 12, color: '#666', lineHeight: 1.4, flex: 1 }}>{item.contentParagraph || 'Descripción del contenido.'}</p>
                <a href="#" style={{ color: '#3483fa', fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}>{item.contentCTA || 'Descubrir más'}</a>
              </div>
            )}
          </div>
        )}

        {item.type !== 'banner' && item.id !== 'encabezado_portada_logo' && item.type !== 'list' && item.uploadedImages?.[0] && (
          <img src={item.uploadedImages[0]} alt="Imagen" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        )}
      </div>
    </div>
  );
};

// ─── MeLi Header Desktop ────────────────────────────────────────
const MeLiHeaderDesktop = () => (
  <div style={{ backgroundColor: '#fff159', width: '100%', padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    {/* Fila superior */}
    <div style={{ display: 'flex', width: '100%', maxWidth: 1200, margin: '0 auto', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years_v2.png" alt="Mercado Libre" style={{ height: 34 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,.2)', width: 500, height: 40 }}>
        <input type="text" placeholder="Buscar productos, marcas y más..." style={{ flex: 1, border: 'none', padding: '0 15px', fontSize: 16, outline: 'none', background: 'transparent', color: '#999' }} readOnly />
        <button style={{ background: 'white', border: 'none', padding: '0 15px', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="#666" />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#333', fontSize: 15, cursor: 'pointer' }}>
        <Tag size={20} /><span>Ofertas por tiempo limitado</span>
      </div>
    </div>
    {/* Fila inferior */}
    <div style={{ display: 'flex', width: '100%', maxWidth: 1200, margin: '0 auto', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: '#333' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
        <MapPin size={22} opacity={0.6} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ color: 'rgba(51,51,51,.5)', fontSize: 12 }}>Enviar a</span>
          <span>CP 56607</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {['Categorías', 'Ofertas', 'Cupones', 'Supermercado', 'Moda', 'Vender', 'Ayuda'].map(link => (
          <a key={link} href="#" style={{ textDecoration: 'none', color: 'rgba(51,51,51,.6)', fontSize: 14 }}>{link}</a>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <a href="#" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ background: 'white', color: '#3483fa', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>MM</div>
          Manuel <ChevronDown size={12} />
        </a>
        <a href="#" style={{ textDecoration: 'none', color: '#333' }}>Mis compras</a>
        <a href="#" style={{ textDecoration: 'none', color: '#333' }}><Bell size={18} /></a>
        <a href="#" style={{ textDecoration: 'none', color: '#333' }}><ShoppingCart size={18} /></a>
      </div>
    </div>
  </div>
);

// ─── MeLi Header Mobile ─────────────────────────────────────────
const MeLiHeaderMobile = () => (
  <div style={{ backgroundColor: '#fff159', width: '100%' }}>
    {/* Fila de búsqueda */}
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', gap: 8 }}>
      <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo__small.png" alt="MeLi" style={{ height: 28, flexShrink: 0 }} onError={e => { e.target.style.display='none'; }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', borderRadius: 16, height: 36, padding: '0 12px', gap: 8, boxShadow: '0 1px 2px rgba(0,0,0,.15)' }}>
        <Search size={14} color="#999" />
        <span style={{ color: '#bbb', fontSize: 14, flex: 1 }}>Estoy buscando...</span>
      </div>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
        <Menu size={22} color="#333" />
      </button>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
        <ShoppingCart size={22} color="#333" />
      </button>
    </div>
    {/* Fila de ubicación */}
    <div style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 6, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <MapPin size={16} color="#3483fa" />
      <span style={{ fontSize: 12, color: '#555', flex: 1 }}>
        Enviar a <strong style={{ color: '#333' }}>CP 66607</strong>
      </span>
      <ChevronRight size={14} color="#999" />
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────
export default function PublicView() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = isMobileDevice();
  const [viewMode, setViewMode] = useState(isMobile ? 'mobile' : 'desktop');
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/api/public/projects/${id}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { setProject(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  useEffect(() => {
    const update = () => {
      // Usar window.innerWidth, NO el clientWidth del contenedor
      // (el contenedor se expande por el hijo de 1920px y siempre da 1920)
      const vw = window.innerWidth;
      const tw = viewMode === 'desktop' ? 1920 : 375;
      setScale(vw < tw ? vw / tw : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [viewMode]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5', flexDirection: 'column', gap: 16, fontFamily: 'sans-serif' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e0e0e0', borderTop: '4px solid #3483fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#666' }}>Cargando maqueta...</p>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5', flexDirection: 'column', gap: 12, fontFamily: 'sans-serif' }}>
      <span style={{ fontSize: 48 }}>🔒</span>
      <h2 style={{ color: '#333', margin: 0 }}>Maqueta no disponible</h2>
      <p style={{ color: '#888', margin: 0 }}>Este enlace no es válido o la maqueta no ha sido publicada.</p>
    </div>
  );

  const canvasItems = viewMode === 'mobile' ? project.mobileLayout : project.desktopLayout;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden', fontFamily: 'sans-serif' }}>
      {/* Barra herramientas del builder */}
      <div style={{ height: 48, background: 'white', borderBottom: '1px solid #e6e6e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years_v2.png" alt="MeLi" style={{ height: 20 }} />
          <span style={{ width: 1, height: 18, background: '#e6e6e6' }} />
          <span style={{ fontSize: 12, color: '#aaa' }}>Vista previa · <strong style={{ color: '#333' }}>{project.title}</strong></span>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 8, padding: 3, gap: 2 }}>
            {['desktop', 'mobile'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '4px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, background: viewMode === m ? 'white' : 'transparent', color: viewMode === m ? '#3483fa' : '#888', boxShadow: viewMode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                {m === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />} {m === 'desktop' ? 'Desktop' : 'Mobile'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas - zoom afecta el layout, no hay overflow ni espacio extra */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
          background: '#f0f0f0',
          padding: isMobile ? 0 : '20px 0'
        }}
      >
        <div style={{
          width: viewMode === 'desktop' ? 1920 : 375,
          zoom: scale,
          background: 'white',
          margin: isMobile ? 0 : '0 auto',
          boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.12)'
        }}>
          {viewMode === 'desktop' ? <MeLiHeaderDesktop /> : <MeLiHeaderMobile />}
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', padding: 20, gap: 20 }}>
            {canvasItems?.map(item => renderPublicItem(item, viewMode))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '10px', color: '#ccc', fontSize: 11, background: 'white', borderTop: '1px solid #f5f5f5' }}>
        Creado con <strong style={{ color: '#3483fa' }}>MeLi Landing Builder</strong> · Trópica
      </div>
    </div>
  );
}
