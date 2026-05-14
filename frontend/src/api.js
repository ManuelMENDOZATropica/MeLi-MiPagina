// URL base de la API
// En local: http://localhost:4000
// En producción (Vercel): configurar VITE_API_URL en el dashboard de Vercel
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default API_URL;
