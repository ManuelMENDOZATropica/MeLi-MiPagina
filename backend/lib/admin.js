// Admins: ven y editan todos los proyectos (no pueden borrar los ajenos).
// Configurable con ADMIN_EMAILS="a@tropica.me,b@tropica.me"; por defecto, Manuel.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'manuel@tropica.me')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdmin = (user) => !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

// Filtro de Prisma para los proyectos a los que el usuario tiene acceso
export const projectAccessWhere = (user) =>
  isAdmin(user) ? {} : { OR: [{ userId: user.id }, { editors: { some: { userId: user.id } } }] };
