export const componentsList = [
  {
    id: "encabezado_portada_logo",
    name: "Encabezado: Portada + Logo",
    desktopSize: { width: 1920, height: 300 },
    mobileSize: { width: 720, height: 160 },
    safeAreaDesktop: "1800 x 180 px",
    safeAreaMobile: "675 x 122 px",
    notes: "Portada (Max: 10 MB) + Logo (1000x1000px, Fondo transparente)",
    type: "header"
  },
  {
    id: "banner_principal_pequeno",
    name: "Banner Principal Pequeño",
    desktopSize: { width: 1920, height: 480 },
    mobileSize: { width: 600, height: 340 },
    safeAreaDesktop: "1760 x 320 px",
    safeAreaMobile: "560 x 300 px",
    notes: "Peso máximo: 10 MB",
    type: "banner"
  },
  {
    id: "banner_principal_grande",
    name: "Banner Principal Grande",
    desktopSize: { width: 1920, height: 640 },
    mobileSize: { width: 600, height: 800 },
    safeAreaDesktop: "1814 x 555 px",
    safeAreaMobile: "548 x 741 px",
    notes: "Peso máximo: 10 MB",
    type: "banner"
  },
  {
    id: "banner_principal_flotante",
    name: "Banner Principal Flotante",
    desktopSize: { width: 2880, height: 720 },
    mobileSize: { width: 1080, height: 804 },
    notes: "Peso máximo: 10 MB",
    type: "banner"
  },
  {
    id: "banner_secundario_pequeno",
    name: "Banner Secundario Pequeño",
    desktopSize: { width: 1500, height: 250 },
    mobileSize: { width: 600, height: 200 },
    safeAreaDesktop: "1460 x 210 px",
    safeAreaMobile: "564 x 160 px",
    notes: "Peso máximo: 10 MB. No admite carrusel.",
    type: "banner"
  },
  {
    id: "banner_secundario_grande",
    name: "Banner Secundario Grande",
    desktopSize: { width: 1500, height: 375 },
    mobileSize: { width: 600, height: 340 },
    notes: "Peso máximo: 10 MB. No admite carrusel.",
    type: "banner"
  },
  {
    id: "lista_contenido",
    name: "Lista de Contenido",
    desktopSize: { width: 574, height: 323 },
    mobileSize: { width: 328, height: 323 },
    notes: "Permite hasta 4 elementos por fila. Lleva: Imagen, Título, Párrafo y CTA.",
    type: "list"
  },
  {
    id: "carrusel_categorias_2",
    name: "Carrusel Categorías (x2)",
    desktopSize: { width: 574, height: 323 },
    mobileSize: null,
    notes: "Se visualiza en carrusel horizontal",
    type: "carousel"
  },
  {
    id: "carrusel_categorias_3",
    name: "Carrusel Categorías (x3)",
    desktopSize: { width: 372, height: 209 },
    mobileSize: null,
    notes: "Lleva a un listado de productos",
    type: "carousel"
  },
  {
    id: "carrusel_categorias_4",
    name: "Carrusel Categorías (x4)",
    desktopSize: { width: 271, height: 153 },
    mobileSize: null,
    notes: "Versión entregable única",
    type: "carousel"
  },
  {
    id: "galeria_categorias_2",
    name: "Galería Categorías (x2)",
    desktopSize: { width: 574, height: 323 },
    mobileSize: { width: 328, height: 184 },
    notes: "Ideal para destacar secciones clave",
    type: "gallery"
  },
  {
    id: "galeria_categorias_3",
    name: "Galería Categorías (x3)",
    desktopSize: { width: 372, height: 209 },
    mobileSize: { width: 328, height: 184 },
    notes: "Personaliza tu marca con imágenes",
    type: "gallery"
  },
  {
    id: "galeria_categorias_4",
    name: "Galería Categorías (x4)",
    desktopSize: { width: 271, height: 153 },
    mobileSize: { width: 156, height: 156 },
    notes: "Organización en cuadrícula",
    type: "gallery"
  },
  {
    id: "video_portada",
    name: "Video (Portada)",
    desktopSize: { width: 640, height: 360 },
    mobileSize: { width: 640, height: 360 },
    notes: "Requiere URL de YouTube",
    type: "video"
  },
  {
    id: "salto_linea",
    name: "Salto de Línea (Espaciador)",
    desktopSize: { width: '100%', height: 40 },
    mobileSize: { width: '100%', height: 40 },
    notes: "Fuerza a los siguientes elementos a una nueva fila",
    type: "spacer"
  }
];
