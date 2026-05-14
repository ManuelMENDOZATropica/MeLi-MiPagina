// URL base de la API — se configura por variable de entorno en producción (Vercel)
// En local usa http://localhost:4000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default API_URL;
