// URL base de la API
// - Local (localhost): apunta al backend local en puerto 4000
// - Producción (cualquier otro host): apunta a Render
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// - VITE_API_URL=same-origin: frontend y API en el mismo servicio (Cloud Run)
const ENV_URL = import.meta.env.VITE_API_URL;
const API_URL = ENV_URL === 'same-origin'
  ? (typeof window !== 'undefined' ? window.location.origin : '')
  : ENV_URL || (isLocal ? 'http://localhost:4000' : 'https://meli-mipagina.onrender.com');

export default API_URL;
