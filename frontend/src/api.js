// URL base de la API
// - Local (localhost): apunta al backend local en puerto 4000
// - Producción (cualquier otro host): apunta a Render
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const API_URL = import.meta.env.VITE_API_URL
  || (isLocal ? 'http://localhost:4000' : 'https://meli-mipagina.onrender.com');

export default API_URL;
