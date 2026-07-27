import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, Smartphone, ChevronDown, Search, Tag, MapPin, Bell, ShoppingCart, Menu, ChevronRight, Truck, Star } from 'lucide-react';
import API_URL from '../api';

const isMobileDevice = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

// Reparte el título RTB en hasta 2 líneas de máx. 17 caracteres (GUIA-FORMATOS-ML.pdf)
const splitRtbTitle = (text, perLine = 17, maxLines = 2) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= perLine || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current) lines.push(current);
  const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (used < words.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1]} ${words.slice(used).join(' ')}`.trim();
  }
  return lines.slice(0, maxLines);
};

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
          backgroundImage: `url("${img}")`, backgroundSize: 'cover', backgroundPosition: 'center',
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
      <div key={item.uniqueId} style={{ display: 'flex', width: '100%', justifyContent: item.justify, flexWrap: 'wrap', gap: 20 }}>
        {item.items.map(child => renderPublicItem(child, viewMode))}
      </div>
    );
  }

  const size = viewMode === 'desktop' ? item.desktopSize : item.mobileSize;
  if (!size) return null;
  const { height, width } = size;

  if (item.type === 'spacer') return <div key={item.uniqueId} style={{ width: '100%', height: height || 40 }} />;

  if (item.type === 'text_block') {
    const canvasWidth = viewMode === 'desktop' ? 1920 : 800;
    const tbW = item.textWidthPx ?? canvasWidth;
    const tbH = item.textHeightPx ?? 80;
    return (
      <div key={item.uniqueId} style={{ width: '100%', padding: '16px 0', boxSizing: 'border-box' }}>
        <div style={{ width: tbW, height: tbH, margin: '0 auto', overflow: 'hidden' }}>
          <p style={{
            margin: 0, padding: '8px 10px',
            fontFamily: "'Proxima Nova', 'Inter', -apple-system, sans-serif",
            fontSize: `${item.textFontSize ?? (viewMode === 'desktop' ? 10 : 8)}px`,
            lineHeight: '1.6', color: '#1a1a2e',
            textAlign: item.textAlign ?? 'left',
            whiteSpace: 'pre-wrap',
          }}>{item.textContent || ''}</p>
        </div>
      </div>
    );
  }

  if (item.type === 'rtb_card') {
    const RTB_LIGHT = ['#FED261', '#4BBCF6'];
    const cardColor = item.cardColor || '#00A650';
    const txtColor = RTB_LIGHT.includes(cardColor) ? '#1a1a2e' : 'white';
    const imgUrl = item.uploadedImages?.[0] || null;
    const logoUrl = item.uploadedImages?.[1] || null;
    const sc = width / (item.desktopSize?.width || width);
    const font = "'Proxima Nova','Inter',-apple-system,sans-serif";

    const logoBox = (size) => (
      <div style={{ width: size, height: Math.round(size * 0.74), background: 'white', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxSizing: 'border-box', boxShadow: '0 2px 10px rgba(0,0,0,0.14)' }}>
        {logoUrl
          ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4, boxSizing: 'border-box' }} />
          : <span style={{ fontSize: Math.max(9, Math.round(12 * sc)), color: '#bbb', fontWeight: 700 }}>Logo</span>}
      </div>
    );
    const imageArea = (style) => (
      <div style={{ background: '#e8f0f8', overflow: 'hidden', ...style }}>
        {imgUrl && <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      </div>
    );

    if (item.id === 'rtb_card_horizontal') {
      return (
        <div key={item.uniqueId} style={{ width, height, fontFamily: font }}>
          <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ flex: 1, background: cardColor, display: 'flex', alignItems: 'center', gap: Math.round(24 * sc), padding: `0 ${Math.round(32 * sc)}px`, minWidth: 0 }}>
              {logoBox(Math.round(110 * sc))}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                {/* Jerarquía RTB: volanta chica · título grande (2 líneas) · CTA chico */}
                <span style={{ fontSize: Math.round(18 * sc), fontWeight: 700, color: txtColor, opacity: 0.85, lineHeight: 1.2, letterSpacing: '0.02em', marginBottom: Math.round(6 * sc) }}>{item.rtbVolanta || 'Volanta'}</span>
                <span style={{ fontSize: Math.round(40 * sc), fontWeight: 800, color: txtColor, lineHeight: 1.05, marginBottom: Math.round(8 * sc), display: 'block' }}>
                  {splitRtbTitle(item.rtbTitle || 'Título de la card').map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}
                </span>
                <span style={{ fontSize: Math.round(16 * sc), fontWeight: 600, color: txtColor, opacity: 0.9, lineHeight: 1.2 }}>{item.rtbCta || 'Ver más'}</span>
              </div>
            </div>
            {imageArea({ width: '42%', height: '100%', flexShrink: 0 })}
          </div>
        </div>
      );
    }

    const isSquare = item.id === 'rtb_card_cuadrada';
    const imgH = Math.round(width * (isSquare ? 1 : 528 / 1008));
    const logoScale = isSquare ? 1.35 : 1;
    const logoW = Math.round(150 * sc * logoScale);
    const logoH = Math.round(logoW * 0.74);
    // El logo queda mitad sobre la imagen y mitad sobre el color, sin fondo detrás
    const logoOffset = Math.round(logoH / 2);
    return (
      <div key={item.uniqueId} style={{ width, height, fontFamily: font }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {imageArea({ width: '100%', height: imgH, flexShrink: 0 })}
          <div style={{ flex: 1, background: cardColor, position: 'relative', padding: `${Math.round(28 * sc)}px ${Math.round(32 * sc)}px`, boxSizing: 'border-box' }}>
            {/* Logo montado sobre el borde: 50% imagen / 50% card, sin pestaña de color */}
            <div style={{ position: 'absolute', top: -logoOffset, left: Math.round(32 * sc), zIndex: 2 }}>
              {logoBox(logoW)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: logoOffset + Math.round(16 * sc) }}>
              {/* Jerarquía RTB: volanta chica · título grande (2 líneas) · CTA chico */}
              <span style={{ fontSize: Math.round(20 * sc), fontWeight: 700, color: txtColor, opacity: 0.85, lineHeight: 1.2, letterSpacing: '0.02em', marginBottom: Math.round(8 * sc) }}>{item.rtbVolanta || 'Volanta'}</span>
              <span style={{ fontSize: Math.round(46 * sc), fontWeight: 800, color: txtColor, lineHeight: 1.08, marginBottom: Math.round(12 * sc), display: 'block' }}>
                {splitRtbTitle(item.rtbTitle || 'Título de la card').map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}
              </span>
              <span style={{ fontSize: Math.round(18 * sc), fontWeight: 600, color: txtColor, opacity: 0.9, lineHeight: 1.2 }}>{item.rtbCta || 'Ver más'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'product_card') {
    const fs = (base) => `${Math.round(base * (width / 271))}px`;
    return (
      <div key={item.uniqueId} style={{ width, position: 'relative' }}>
        <div style={{
          width: '100%', height,
          background: 'white', borderRadius: '8px',
          overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.10)',
          display: 'flex', flexDirection: 'column',
          border: '1px solid #ebebeb',
          fontFamily: "'Proxima Nova', 'Inter', -apple-system, sans-serif",
        }}>
          {/* Portada / Imagen */}
          <div style={{
            flex: '0 0 52%', background: '#f5f5f5',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {item.uploadedImages?.[0] && (
              <img src={item.uploadedImages[0]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
            )}
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, padding: `${Math.round(8 * width / 271)}px ${Math.round(10 * width / 271)}px`, display: 'flex', flexDirection: 'column', gap: `${Math.round(4 * width / 271)}px`, overflow: 'hidden' }}>
            {/* Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: fs(8.5), fontWeight: '700', letterSpacing: '0.02em',
              background: '#2968C8', color: 'white',
              padding: `1px ${fs(4)}`, borderRadius: '2px',
              alignSelf: 'flex-start',
            }}>★ OFERTA IMPERDIBLE</span>

            {/* Precio anterior */}
            <s style={{ fontSize: fs(10), color: '#999', lineHeight: 1 }}>$ XX.XXX</s>

            {/* Precio actual + % OFF */}
            <div style={{ display: 'flex', alignItems: 'center', gap: `${Math.round(5 * width / 271)}px`, flexWrap: 'wrap' }}>
              <span style={{ fontSize: fs(18), fontWeight: '400', color: '#1a1a2e', lineHeight: 1 }}>$ XX.XXX</span>
              <span style={{ fontSize: fs(9), fontWeight: '700', background: '#00A650', color: 'white', padding: `1px ${fs(5)}`, borderRadius: '10px' }}>XX% OFF</span>
            </div>

            {/* Cuotas */}
            <span style={{ fontSize: fs(10), color: '#00A650', fontWeight: '500' }}>Hasta 3 cuotas sin interés</span>

            {/* Envío */}
            <span style={{ fontSize: fs(10), color: '#3483fa', fontWeight: '500' }}>Envío gratis ⚡ FULL</span>

            {/* Descripción */}
            <p style={{ fontSize: fs(9.5), color: '#666', margin: 0, lineHeight: '1.35', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum imperdiet.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
// ─── Mock de contexto (referencia visual, para ver RTB/Home Slider "en la página") ──
// Fila de "accesos dinámicos" real de mercadolibre.com.mx debajo del Home Slider.
// Íconos: 4 son los SVG reales exportados de la página (frontend/public/meli-icons),
// los otros 2 (cuenta/ubicación) no estaban en esa sesión guardada, van dibujados a mano
// con el mismo estilo (círculo #EEE de fondo, 105x105) para que no desentonen.
const BENEFIT_CARDS = [
  { title: 'Envío gratis', desc: 'Beneficio por ser tu primera compra.', cta: 'Mostrar productos', icon: '/meli-icons/envio-gratis.svg' },
  { title: 'Ingresa a tu cuenta', desc: 'Disfruta de ofertas y compra sin límites.', cta: 'Ingresar a tu cuenta', variant: 'account' },
  { title: 'Ingresa tu ubicación', desc: 'Consulta costos y tiempos de entrega.', cta: 'Ingresar ubicación', variant: 'location' },
  { title: 'Menos de $500', desc: 'Descubre productos con precios bajos.', cta: 'Mostrar productos', icon: '/meli-icons/menos-de-500.svg' },
  { title: 'Más vendidos', desc: 'Explora los productos que son tendencia.', cta: 'Ir a Más vendidos', icon: '/meli-icons/mas-vendidos.svg' },
  { title: 'Compra protegida', desc: 'Puedes devolver tu compra gratis.', cta: 'Cómo funciona', icon: '/meli-icons/compra-protegida.svg' },
];

const BenefitIcon = ({ icon, variant, size }) => {
  if (icon) return <img src={icon} alt="" style={{ width: size, height: size }} />;
  const dark = '#2d2d2d';
  const box = { width: size, height: size, viewBox: '0 0 105 105' };
  const bg = <circle cx="53" cy="53" r="45.54" fill="#EEE" />;
  if (variant === 'account') {
    return (
      <svg {...box}>
        {bg}
        <rect x="28" y="34" width="50" height="36" rx="4" fill="#FFE600" stroke={dark} strokeWidth="2.5" />
        <circle cx="53" cy="48" r="7" fill="white" stroke={dark} strokeWidth="2" />
        <path d="M39 64c2-7 8-10 14-10s12 3 14 10" fill="white" stroke={dark} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === 'location') {
    return (
      <svg {...box}>
        {bg}
        <path d="M53 28c-10 0-18 7.5-18 18 0 13 18 32 18 32s18-19 18-32c0-10.5-8-18-18-18z" fill="#FFE600" stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="53" cy="46" r="7" fill="white" stroke={dark} strokeWidth="2" />
      </svg>
    );
  }
  return null;
};

const FakeCard = ({ viewMode }) => {
  const w = viewMode === 'desktop' ? 168 : 108;
  const fs = (n) => `${Math.round(n * (w / 168))}px`;
  return (
    <div style={{ width: w, background: 'white', borderRadius: 6, overflow: 'hidden', border: '1px solid #ebebeb', flexShrink: 0, fontFamily: "'Proxima Nova','Inter',-apple-system,sans-serif" }}>
      <div style={{ width: '100%', height: viewMode === 'desktop' ? 150 : 100, background: '#f0f0f0' }} />
      <div style={{ padding: `${fs(8)} ${fs(9)}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <s style={{ fontSize: fs(10), color: '#999', lineHeight: 1 }}>$ X.XXX</s>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: fs(17), color: '#1a1a2e', fontWeight: 400 }}>$ X.XXX</span>
          <span style={{ fontSize: fs(9), fontWeight: 700, background: '#00a650', color: 'white', padding: `1px ${fs(5)}`, borderRadius: '10px' }}>XX% OFF</span>
        </div>
        <span style={{ fontSize: fs(10), color: '#00a650', fontWeight: 500 }}>en 3 MSI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Truck size={Math.max(9, Math.round(11 * (w / 168)))} color="#00a650" />
          <span style={{ fontSize: fs(10), color: '#00a650', fontWeight: 500 }}>Llega gratis mañana</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
          {[...Array(4)].map((_, i) => <Star key={i} size={Math.max(8, Math.round(10 * (w / 168)))} fill="#3483fa" color="#3483fa" />)}
          <Star size={Math.max(8, Math.round(10 * (w / 168)))} color="#c9c9c9" />
        </div>
      </div>
    </div>
  );
};

const PageContextMock = ({ section, viewMode, position }) => {
  const padPx = viewMode === 'desktop' ? 40 : 16;
  const gap = viewMode === 'desktop' ? 14 : 8;
  if (section === 'homeSlider' && position === 'after') {
    const isD = viewMode === 'desktop';
    const scaleB = isD ? 1 : 0.74;
    return (
      <div style={{
        width: '100%', fontFamily: "'Proxima Nova','Inter',-apple-system,sans-serif",
        background: `linear-gradient(180deg, #FFE600 0px, rgba(255,230,0,0.45) ${Math.round(160 * scaleB)}px, #EBEBEB ${Math.round(340 * scaleB)}px)`,
      }}>

        {/* ── 1. Benefit cards ── */}
        <div style={{ padding: isD ? '20px 0' : '14px 0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, padding: `0 ${padPx}px` }}>
            {BENEFIT_CARDS.map(b => (
              <div key={b.title} style={{ width: 183 * scaleB, flexShrink: 0, background: 'white', borderRadius: 6, boxShadow: '0 1px 2px 0 rgba(0,0,0,.12)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: 0, fontSize: 16 * scaleB, lineHeight: `${20 * scaleB}px`, fontWeight: 600, color: 'rgba(0,0,0,.9)', padding: `${16 * scaleB}px ${12 * scaleB}px 0 ${16 * scaleB}px`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 105 * scaleB, margin: 'auto' }}>
                  <BenefitIcon icon={b.icon} variant={b.variant} size={105 * scaleB} />
                </div>
                <p style={{ margin: 0, fontSize: 14 * scaleB, lineHeight: `${18 * scaleB}px`, fontWeight: 400, color: 'rgba(0,0,0,.9)', padding: `${12 * scaleB}px ${16 * scaleB}px`, textAlign: 'center', height: 52 * scaleB, overflow: 'hidden' }}>{b.desc}</p>
                <div style={{ margin: `${17 * scaleB}px`, background: 'rgba(65,137,230,.15)', borderRadius: 4, display: 'flex', justifyContent: 'center' }}>
                  <span style={{ color: '#3483fa', fontSize: 12 * scaleB, fontWeight: 600, padding: `${6 * scaleB}px ${8 * scaleB}px`, whiteSpace: 'nowrap' }}>{b.cta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Oferta del día + Ofertas ── */}
        <div style={{ background: 'transparent', padding: `${isD ? 16 : 10}px ${padPx}px` }}>
          <div style={{ display: 'flex', gap: 16, flexDirection: isD ? 'row' : 'column', maxWidth: 1200, margin: '0 auto' }}>
            {/* Oferta del día */}
            <div style={{ width: isD ? 300 : '100%', background: 'white', borderRadius: 6, padding: isD ? 20 : 14, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: isD ? 20 : 16, fontWeight: 600, color: '#1a1a2e' }}>Oferta del día</h3>
              <div style={{ width: '100%', height: isD ? 200 : 150, background: '#f0f0f0', borderRadius: 4, marginBottom: 12 }} />
              <span style={{ fontSize: isD ? 14 : 12, color: '#666', marginBottom: 4, display: 'block' }}>Mochila Táctica Militar Impermeable</span>
              <s style={{ fontSize: isD ? 12 : 10, color: '#999' }}>$ 608.42</s>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: isD ? 22 : 18, color: '#1a1a2e', fontWeight: 400 }}>$ 430</span>
                <span style={{ fontSize: isD ? 11 : 9, fontWeight: 700, background: '#00a650', color: 'white', padding: '1px 6px', borderRadius: 10 }}>28% OFF</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Truck size={isD ? 12 : 10} color="#00a650" />
                <span style={{ fontSize: isD ? 11 : 9, color: '#00a650', fontWeight: 500 }}>Envío gratis</span>
                <span style={{ fontSize: isD ? 10 : 8, background: '#00a650', color: 'white', fontWeight: 700, padding: '0 4px', borderRadius: 2, marginLeft: 2 }}>FULL</span>
              </div>
            </div>
            {/* Ofertas */}
            <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: isD ? 20 : 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: isD ? 20 : 16, fontWeight: 600, color: '#1a1a2e' }}>Ofertas</h3>
                <span style={{ fontSize: isD ? 14 : 11, color: '#3483fa', cursor: 'pointer' }}>Mostrar todas las ofertas</span>
              </div>
              <div style={{ display: 'flex', gap: isD ? 12 : 8, overflow: 'hidden' }}>
                {Array.from({ length: isD ? 5 : 3 }).map((_, i) => (
                  <div key={i} style={{ width: isD ? 140 : 100, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', height: isD ? 130 : 90, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }} />
                    <span style={{ fontSize: isD ? 11 : 9, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>Producto de oferta {i + 1}</span>
                    <s style={{ fontSize: isD ? 10 : 8, color: '#999', lineHeight: 1 }}>$ X.XXX</s>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: isD ? 15 : 12, color: '#1a1a2e', fontWeight: 400 }}>$ X.XXX</span>
                      <span style={{ fontSize: isD ? 9 : 7, fontWeight: 700, background: '#00a650', color: 'white', padding: '1px 4px', borderRadius: 8 }}>XX% OFF</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      <Truck size={isD ? 10 : 8} color="#00a650" />
                      <span style={{ fontSize: isD ? 10 : 8, color: '#00a650', fontWeight: 500 }}>Envío gratis</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Category promo banners ── */}
        <div style={{ background: 'transparent', padding: `0 ${padPx}px ${isD ? 16 : 10}px` }}>
          <div style={{ display: 'flex', gap: 16, flexDirection: isD ? 'row' : 'column', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #00B4E6 0%, #0077B6 100%)', borderRadius: 6, height: isD ? 180 : 120, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${isD ? 28 : 16}px`, overflow: 'hidden' }}>
              <div>
                <span style={{ fontSize: isD ? 12 : 9, color: 'rgba(255,255,255,.8)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>CELULARES</span>
                <span style={{ fontSize: isD ? 22 : 15, color: 'white', fontWeight: 700, lineHeight: 1.2, display: 'block' }}>HASTA 30%{'\n'}DE DESCUENTO</span>
              </div>
              <div style={{ width: isD ? 140 : 80, height: isD ? 140 : 80, background: 'rgba(255,255,255,.15)', borderRadius: 8, flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #7B2D8E 0%, #4A0E5C 100%)', borderRadius: 6, height: isD ? 180 : 120, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${isD ? 28 : 16}px`, overflow: 'hidden' }}>
              <div>
                <span style={{ fontSize: isD ? 12 : 9, color: 'rgba(255,255,255,.8)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>FULL</span>
                <span style={{ fontSize: isD ? 22 : 15, color: 'white', fontWeight: 700, lineHeight: 1.2, display: 'block' }}>HASTA 50%{'\n'}DE DESCUENTO</span>
              </div>
              <div style={{ width: isD ? 140 : 80, height: isD ? 140 : 80, background: 'rgba(255,255,255,.15)', borderRadius: 8, flexShrink: 0 }} />
            </div>
          </div>
        </div>

        {/* ── 4. Más vendidos para ti ── */}
        <div style={{ background: 'transparent', padding: `0 ${padPx}px ${isD ? 16 : 10}px` }}>
          <div style={{ background: 'white', borderRadius: 6, padding: isD ? 20 : 14, maxWidth: 1200, margin: '0 auto' }}>
            <h3 style={{ fontSize: isD ? 17 : 13, color: '#333', margin: '0 0 12px', fontWeight: 600 }}>Más vendidos para ti</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap }}>
              {Array.from({ length: isD ? 6 : 3 }).map((_, i) => <FakeCard key={i} viewMode={viewMode} />)}
            </div>
          </div>
        </div>

        {/* ── 5. Meli+ banner ── */}
        <div style={{ background: 'linear-gradient(90deg, #A90F90 0%, #520E6E 100%)', padding: isD ? '16px 40px' : '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isD ? 16 : 10 }}>
            <span style={{ color: 'white', fontSize: isD ? 18 : 13, fontWeight: 800, letterSpacing: '-0.02em' }}>meli+</span>
            <span style={{ color: 'white', fontSize: isD ? 15 : 10, fontWeight: 600, letterSpacing: '0.02em' }}>VIVE MERCADO LIBRE COMO UN EXPERTO</span>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,.6)', borderRadius: 4, padding: isD ? '6px 16px' : '4px 10px', color: 'white', fontSize: isD ? 13 : 9, fontWeight: 600, whiteSpace: 'nowrap' }}>Suscríbete desde $ 49.90</div>
        </div>

        {/* ── 6. Streaming services ── */}
        <div style={{ background: 'white', padding: `${isD ? 24 : 14}px ${padPx}px` }}>
          <div style={{ display: 'flex', gap: isD ? 24 : 12, justifyContent: 'center', maxWidth: 1200, margin: '0 auto' }}>
            {[{ name: 'Disney+', color: '#113CCF' }, { name: 'HBO Max', color: '#5822B4' }, { name: 'Star+', color: '#C70D3A' }, ...(isD ? [{ name: 'Paramount+', color: '#0068C8' }] : [])].map(s => (
              <div key={s.name} style={{ width: isD ? 160 : 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: isD ? 100 : 60, height: isD ? 100 : 60, borderRadius: 16, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: isD ? 14 : 9, fontWeight: 700 }}>{s.name}</span>
                </div>
                <span style={{ fontSize: isD ? 12 : 8, color: '#00a650', fontWeight: 500, textAlign: 'center' }}>Llega gratis mañana</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // RTB no lleva contexto simulado: solo se muestra el header de MeLi.
  return null;
};

const SECTION_LABELS = { miPagina: 'Mi página', rtb: "RTB's", homeSlider: 'Home Slider' };
const SECTION_LAYOUT_KEYS = {
  miPagina: { desktop: 'desktopLayout', mobile: 'mobileLayout' },
  rtb: { desktop: 'rtbDesktopLayout', mobile: 'rtbMobileLayout' },
  homeSlider: { desktop: 'homeSliderDesktopLayout', mobile: 'homeSliderMobileLayout' },
};

export default function PublicView() {
  const { id, section: sectionParam } = useParams();
  const section = SECTION_LAYOUT_KEYS[sectionParam] ? sectionParam : 'miPagina';
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = isMobileDevice();
  const [viewMode, setViewMode] = useState('mobile');
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Migra rutas viejas de las imágenes por defecto del Home Slider (con espacios/paréntesis, rompían el CSS)
  const fixDefaultSliderUrls = (layout) => Array.isArray(layout) ? layout.map(it => ({
    ...it,
    uploadedImages: (it.uploadedImages || []).map(u => {
      if (typeof u === 'string' && (u.includes('Slide%20home%201') || u.includes('Slide home 1'))) {
        return (u.includes('(1)') || u.includes('%281%29')) ? '/home-slider-1.webp' : '/home-slider-2.webp';
      }
      return u;
    })
  })) : [];

  useEffect(() => {
    fetch(`${API_URL}/api/public/projects/${id}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        setProject({
          ...data,
          homeSliderDesktopLayout: fixDefaultSliderUrls(data.homeSliderDesktopLayout),
          homeSliderMobileLayout: fixDefaultSliderUrls(data.homeSliderMobileLayout),
        });
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  useEffect(() => {
    const update = () => {
      // Usar window.innerWidth, NO el clientWidth del contenedor
      // (el contenedor se expande por el hijo de 1920px y siempre da 1920)
      const vw = window.innerWidth;
      const tw = viewMode === 'desktop' ? 1920 : 800;
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

  const layoutKeys = SECTION_LAYOUT_KEYS[section];
  const canvasItems = viewMode === 'mobile' ? project[layoutKeys.mobile] : project[layoutKeys.desktop];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden', fontFamily: 'sans-serif' }}>
      {/* Barra herramientas del builder */}
      <div style={{ height: 48, background: 'white', borderBottom: '1px solid #e6e6e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years_v2.png" alt="MeLi" style={{ height: 20 }} />
          <span style={{ width: 1, height: 18, background: '#e6e6e6' }} />
          <span style={{ fontSize: 12, color: '#aaa' }}>Vista previa · <strong style={{ color: '#333' }}>{project.title}</strong> · {SECTION_LABELS[section]}</span>
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
          width: viewMode === 'desktop' ? 1920 : 800,
          zoom: scale,
          background: 'white',
          margin: isMobile ? 0 : '0 auto',
          boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.12)'
        }}>
          {viewMode === 'desktop' ? <MeLiHeaderDesktop /> : <MeLiHeaderMobile />}
          <PageContextMock section={section} viewMode={viewMode} position="before" />
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', padding: section === 'miPagina' ? 20 : 0, gap: 20 }}>
            {canvasItems?.map(item => renderPublicItem(item, viewMode))}
          </div>
          <PageContextMock section={section} viewMode={viewMode} position="after" />
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '10px', color: '#ccc', fontSize: 11, background: 'white', borderTop: '1px solid #f5f5f5' }}>
        Creado con <strong style={{ color: '#3483fa' }}>MeLi Landing Builder</strong> · TRÓPICA Creative &amp; Tech
      </div>
    </div>
  );
}
