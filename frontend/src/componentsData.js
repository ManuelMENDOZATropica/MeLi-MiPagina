export const componentsList = [
  // ══════════════════════════════════════════════════════════════
  // MI PÁGINA
  // ══════════════════════════════════════════════════════════════
  {
    id: "encabezado_portada_logo",
    name: "Encabezado: Portada + Logo",
    desktopSize: { width: 1920, height: 300 },
    mobileSize: { width: 720, height: 160 },
    safeAreaDesktop: "1800 x 180 px",
    safeAreaMobile: "675 x 122 px",
    notes: "Portada (Max: 10 MB) + Logo (1000x1000px, Fondo transparente)",
    type: "header",
    section: "miPagina"
  },
  {
    id: "banner_principal_pequeno",
    name: "Banner Principal Pequeño",
    desktopSize: { width: 1920, height: 480 },
    mobileSize: { width: 600, height: 340 },
    safeAreaDesktop: "1760 x 320 px",
    safeAreaMobile: "560 x 300 px",
    notes: "Peso máximo: 10 MB",
    type: "banner",
    section: "miPagina"
  },
  {
    id: "banner_principal_grande",
    name: "Banner Principal Grande",
    desktopSize: { width: 1920, height: 640 },
    mobileSize: { width: 600, height: 800 },
    safeAreaDesktop: "1814 x 555 px",
    safeAreaMobile: "548 x 741 px",
    notes: "Peso máximo: 10 MB",
    type: "banner",
    section: "miPagina"
  },
  {
    id: "banner_principal_flotante",
    name: "Banner Principal Flotante",
    desktopSize: { width: 2880, height: 720 },
    mobileSize: { width: 1080, height: 804 },
    notes: "Peso máximo: 10 MB",
    type: "banner",
    section: "miPagina"
  },
  {
    id: "banner_secundario_pequeno",
    name: "Banner Secundario Pequeño",
    desktopSize: { width: 1500, height: 250 },
    mobileSize: { width: 600, height: 200 },
    safeAreaDesktop: "1460 x 210 px",
    safeAreaMobile: "564 x 160 px",
    notes: "Peso máximo: 10 MB. No admite carrusel.",
    type: "banner",
    section: "miPagina"
  },
  {
    id: "banner_secundario_grande",
    name: "Banner Secundario Grande",
    desktopSize: { width: 1500, height: 375 },
    mobileSize: { width: 600, height: 340 },
    notes: "Peso máximo: 10 MB. No admite carrusel.",
    type: "banner",
    section: "miPagina"
  },
  {
    id: "lista_contenido",
    name: "Lista de Contenido",
    desktopSize: { width: 574, height: 323 },
    mobileSize: { width: 328, height: 323 },
    notes: "Permite hasta 4 elementos por fila. Lleva: Imagen, Título, Párrafo y CTA.",
    type: "list",
    section: "miPagina"
  },
  {
    id: "carrusel_categorias_2",
    name: "Carrusel Categorías (x2)",
    desktopSize: { width: 574, height: 323 },
    mobileSize: null,
    notes: "Se visualiza en carrusel horizontal",
    type: "carousel",
    section: "miPagina"
  },
  {
    id: "carrusel_categorias_3",
    name: "Carrusel Categorías (x3)",
    desktopSize: { width: 372, height: 209 },
    mobileSize: null,
    notes: "Lleva a un listado de productos",
    type: "carousel",
    section: "miPagina"
  },
  {
    id: "carrusel_categorias_4",
    name: "Carrusel Categorías (x4)",
    desktopSize: { width: 271, height: 153 },
    mobileSize: null,
    notes: "Versión entregable única",
    type: "carousel",
    section: "miPagina"
  },
  {
    id: "galeria_categorias_2",
    name: "Galería Categorías (x2)",
    desktopSize: { width: 574, height: 323 },
    mobileSize: { width: 328, height: 184 },
    notes: "Ideal para destacar secciones clave",
    type: "gallery",
    section: "miPagina"
  },
  {
    id: "galeria_categorias_3",
    name: "Galería Categorías (x3)",
    desktopSize: { width: 372, height: 209 },
    mobileSize: { width: 328, height: 184 },
    notes: "Personaliza tu marca con imágenes",
    type: "gallery",
    section: "miPagina"
  },
  {
    id: "galeria_categorias_4",
    name: "Galería Categorías (x4)",
    desktopSize: { width: 271, height: 153 },
    mobileSize: { width: 156, height: 156 },
    notes: "Organización en cuadrícula",
    type: "gallery",
    section: "miPagina"
  },
  {
    id: "tarjeta_producto",
    name: "Tarjeta de Producto",
    desktopSize: { width: 271, height: 420 },
    mobileSize: { width: 160, height: 300 },
    notes: "Tarjeta de producto estilo MeLi. Subir imagen del producto.",
    type: "product_card",
    section: "miPagina"
  },
  {
    id: "video_portada",
    name: "Video (Portada)",
    desktopSize: { width: 640, height: 360 },
    mobileSize: { width: 640, height: 360 },
    notes: "Requiere URL de YouTube",
    type: "video",
    section: "miPagina"
  },
  {
    id: "texto_libre",
    name: "Texto",
    desktopSize: { width: 1920, height: null },
    mobileSize: { width: 800, height: null },
    notes: "Bloque de texto editable. Fuente Proxima Nova.",
    type: "text_block",
    section: "miPagina"
  },
  {
    id: "salto_linea",
    name: "Salto de Línea (Espaciador)",
    desktopSize: { width: '100%', height: 40 },
    mobileSize: { width: '100%', height: 40 },
    notes: "Fuerza a los siguientes elementos a una nueva fila",
    type: "spacer",
    section: "miPagina"
  },
  {
    id: "perfil_tienda_mobile",
    name: "Perfil Tienda (Mobile)",
    desktopSize: null,
    mobileSize: { width: 800, height: 80 },
    notes: "Encabezado de perfil de tienda oficial MeLi para mobile. Subir ícono y editar nombre de marca.",
    type: "store_profile",
    section: "miPagina"
  },

  // ══════════════════════════════════════════════════════════════
  // HOME SLIDER (Guía de formatos ML)
  // ══════════════════════════════════════════════════════════════
  {
    id: "home_slider",
    name: "Home Slider",
    desktopSize: { width: 1920, height: 500 },
    mobileSize: { width: 984, height: 450 },
    safeAreaDesktop: "1020 x 340 px",
    safeAreaMobile: "920 x 298 px",
    notes: "Titular, volanta (opcional), beneficios, legales, imagen y hasta 3 logos. Versiones entregables: Desktop Nuevo y Mobile.",
    type: "banner",
    section: "homeSlider"
  },
  {
    id: "home_slider_app",
    name: "Home Slider (App)",
    desktopSize: null,
    mobileSize: { width: 984, height: 402 },
    safeAreaMobile: "920 x 330 px",
    notes: "Versión App del Home Slider. Misma pieza que Mobile, adaptada.",
    type: "banner",
    section: "homeSlider"
  },

  // ══════════════════════════════════════════════════════════════
  // RTB — Programmatic (Guía de formatos ML)
  // ══════════════════════════════════════════════════════════════
  {
    id: "rtb_imagen",
    name: "RTB Imagen",
    desktopSize: { width: 1008, height: 528 },
    mobileSize: { width: 528, height: 528 },
    notes: "Imagen Rectangular (Desktop, 1008x528) e Imagen Cuadrada (Mobile, 528x528). Jerarquía de textos: volanta arriba en tamaño chico (máx. 20 caract.), debajo el título en 2 líneas y tamaño grande (máx. 17 caract. c/u, 34 en total) y al final el CTA en tamaño chico (máx. 15 caract.). Legales sobre la imagen: máx. 80 caract.",
    type: "banner",
    section: "rtb"
  },
  {
    id: "rtb_logo",
    name: "RTB Logo",
    desktopSize: { width: 258, height: 192 },
    mobileSize: { width: 258, height: 192 },
    notes: "Logo sobre fondo blanco. Máximo 2 logos.",
    type: "banner",
    section: "rtb"
  },
  {
    id: "rtb_card_horizontal",
    name: "RTB Card Horizontal",
    desktopSize: { width: 984, height: 240 },
    mobileSize: { width: 720, height: 176 },
    notes: "ADN RTB con estructura THB: logo + textos sobre el color de card + imagen a la derecha. Jerarquía de textos: volanta arriba (chica, máx. 20 caract.), título (más grande, máx. 34 en 2 líneas de 17) y CTA abajo (chico, máx. 15 caract.). Clic derecho: subir logo/imagen, editar textos y elegir color de card. Un solo logo.",
    type: "rtb_card",
    section: "rtb"
  },
  {
    id: "rtb_card_rectangular",
    name: "RTB Card Imagen Rectangular",
    desktopSize: { width: 1008, height: 888 },
    mobileSize: { width: 600, height: 528 },
    notes: "ADN RTB vertical: imagen rectangular (1008x528) arriba + pestaña de logo + card de color con textos. Jerarquía de textos: volanta arriba (chica, máx. 20 caract.), título (más grande, máx. 34 en 2 líneas de 17) y CTA abajo (chico, máx. 15 caract.). Clic derecho: subir logo/imagen, editar textos y elegir color de card.",
    type: "rtb_card",
    section: "rtb"
  },
  {
    id: "rtb_card_cuadrada",
    name: "RTB Card Imagen Cuadrada",
    desktopSize: { width: 528, height: 858 },
    mobileSize: { width: 400, height: 650 },
    notes: "ADN RTB vertical: imagen cuadrada (528x528) arriba + pestaña de logo + card de color con textos. Jerarquía de textos: volanta arriba (chica, máx. 20 caract.), título (más grande, máx. 34 en 2 líneas de 17) y CTA abajo (chico, máx. 15 caract.). En la versión cuadrada, reducir cantidad de productos en la imagen. Clic derecho: subir logo/imagen, editar textos y elegir color de card.",
    type: "rtb_card",
    section: "rtb"
  }
];
