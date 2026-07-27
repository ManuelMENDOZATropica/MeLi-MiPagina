// Paleta oficial de colores para las cards de los ADN RTB.
// Cada color trae su color de texto, que viene definido por la guía de marca
// (no se calcula por contraste). Lo usan el editor y la vista pública, así que
// vive acá para que no se desincronicen.

export const RTB_CARD_COLORS = [
  { name: 'Black',      bg: '#000000', text: '#ffffff' },
  { name: 'Black 45%',  bg: '#7a7a7a', text: '#ffffff' },
  { name: 'Grey',       bg: '#E6E4E5', text: '#333333' },
  { name: 'Beige',      bg: '#BCAC93', text: '#333333' },
  { name: 'Dark Red',   bg: '#D12440', text: '#ffffff' },
  { name: 'Orange',     bg: '#FF7733', text: '#ffffff' },
  { name: 'Green',      bg: '#00A650', text: '#ffffff' },
  { name: 'Blue',       bg: '#2968C8', text: '#ffffff' },
  { name: 'Yellow',     bg: '#FFCE52', text: '#000000' },
  { name: 'Purple',     bg: '#8533AF', text: '#ffffff' },
  { name: 'Light Blue', bg: '#64BEF9', text: '#000000' },
  { name: 'Pink',       bg: '#F36A91', text: '#000000' },
];

export const RTB_DEFAULT_COLOR = '#00A650';

// Cards guardadas antes de esta paleta: se llevan al tono equivalente más cercano
// para que ninguna quede con un color fuera de la guía.
const LEGACY = {
  '#0166C4': '#2968C8', // azul viejo   → Blue
  '#4BBCF6': '#64BEF9', // celeste viejo → Light Blue
  '#FED261': '#FFCE52', // amarillo viejo → Yellow
  '#FE8143': '#FF7733', // naranja viejo → Orange
  '#FE7695': '#F36A91', // rosa viejo    → Pink
  '#8D38AD': '#8533AF', // violeta viejo → Purple
};

/**
 * Devuelve { bg, text } para el color guardado en una card.
 * Acepta colores viejos, valores en minúscula y cards sin color.
 */
export const resolveRtbColor = (cardColor) => {
  const raw = String(cardColor || RTB_DEFAULT_COLOR).toUpperCase();
  const hex = LEGACY[raw] || raw;
  const found = RTB_CARD_COLORS.find(c => c.bg.toUpperCase() === hex);
  if (found) return { bg: found.bg, text: found.text };
  // Color desconocido: lo respetamos pero elegimos el texto por luminancia
  return { bg: cardColor || RTB_DEFAULT_COLOR, text: isLight(hex) ? '#333333' : '#ffffff' };
};

// Luminancia relativa, solo para el caso borde de un color fuera de la paleta
function isLight(hex) {
  const m = /^#?([0-9A-F]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
