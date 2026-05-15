import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
dotenv.config();

// ── Fail fast si faltan secretos críticos ──────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET no está configurado. El servidor no puede arrancar de forma segura.');
  process.exit(1);
}

const app = express();
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://meli-mipagina.onrender.com',
  'https://mipagina.tropica.me',      // dominio producción
  'https://www.mipagina.tropica.me',  // con www
  /\.vercel\.app$/                     // cualquier preview de Vercel
];

app.use(cors({
  origin: (origin, callback) => {
    // En producción, bloquear requests sin origin (curl, scripts)
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Requests sin origin bloqueados en producción'));
      }
      return callback(null, true); // Permitir en desarrollo (Postman, etc.)
    }
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) callback(null, true);
    else callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true
}));

// Límite global reducido. El endpoint de upload tiene su propio límite.
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    express.json({ limit: '15mb' })(req, res, next);
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Middleware para verificar Token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    req.user = user;
    next();
  });
};

// =======================
// RUTAS DE AUTENTICACIÓN
// =======================
app.post('/api/auth/google', async (req, res) => {
  const { credential, mockEmail } = req.body;
  
  try {
    let email, name, picture;

    // Mock login — solo permitido fuera de producción
    if (mockEmail) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Mock login deshabilitado en producción' });
      }
      email = mockEmail;
      name = "Developer Tropica";
      picture = "https://ui-avatars.com/api/?name=Dev";
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    // Validación estricta del dominio @tropica.me
    if (!email.endsWith('@tropica.me')) {
      return res.status(403).json({ error: 'Acceso denegado. Solo se permiten correos @tropica.me' });
    }

    // Buscar o crear usuario en la BD
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, avatar: picture }
      });
    }

    // Generar Token JWT propio
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user });

  } catch (error) {
    console.error('Error en Login Google:', error);
    res.status(500).json({ error: 'Error verificando el token de Google' });
  }
});


// =======================
// RUTAS DE PROYECTOS (API REST)
// =======================

// 1. Obtener todos los proyectos del usuario
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// 2. Crear un nuevo proyecto en blanco
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const newProject = await prisma.project.create({
      data: {
        title: title || 'Nuevo Proyecto de Landing',
        desktopLayout: [],
        mobileLayout: [],
        canvasNodes: {},
        userId: req.user.id
      }
    });
    res.json(newProject);
  } catch (error) {
    res.status(500).json({ error: 'Error creating project' });
  }
});

// 3. Obtener un proyecto específico (para el Editor)
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching project' });
  }
});

// 4. Actualizar un proyecto (Auto-Guardado desde el Editor)
app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { desktopLayout, mobileLayout, canvasNodes, title } = req.body;
    
    const updateData = {};
    if (desktopLayout !== undefined) updateData.desktopLayout = desktopLayout;
    if (mobileLayout !== undefined) updateData.mobileLayout = mobileLayout;
    if (canvasNodes !== undefined) updateData.canvasNodes = canvasNodes;
    if (title !== undefined) updateData.title = title;

    const project = await prisma.project.update({
      where: { id: req.params.id, userId: req.user.id },
      data: updateData
    });
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating project' });
  }
});

// 5. Eliminar proyecto
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting project' });
  }
});

// 6. Publicar / despublicar proyecto
// Genera slug corto único (7 chars, base62)
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateSlug = () => Array.from({ length: 7 }, () => SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)]).join('');
const getUniqueSlug = async () => {
  let slug, exists;
  do {
    slug = generateSlug();
    exists = await prisma.project.findUnique({ where: { slug } });
  } while (exists);
  return slug;
};

app.post('/api/projects/:id/publish', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const willPublish = !project.isPublished;
    // Generar slug solo si va a publicarse y aún no tiene uno
    const slug = willPublish && !project.slug ? await getUniqueSlug() : project.slug;

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { isPublished: willPublish, ...(slug ? { slug } : {}) }
    });
    res.json({ isPublished: updated.isPublished, slug: updated.slug });
  } catch (error) {
    res.status(500).json({ error: 'Error toggling publish state' });
  }
});


// =======================
// RUTA PÚBLICA (sin auth) - acepta slug corto O uuid
// =======================
app.get('/api/public/projects/:key', async (req, res) => {
  try {
    const key = req.params.key;
    // Solo acceso por slug corto — no exponemos IDs internos en rutas públicas
    const project = await prisma.project.findUnique({ where: { slug: key } });

    if (!project || !project.isPublished) {
      return res.status(404).json({ error: 'Este proyecto no está publicado o no existe.' });
    }
    res.json({
      title: project.title,
      desktopLayout: project.desktopLayout,
      mobileLayout: project.mobileLayout
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching public project' });
  }
});


// =======================
// RUTA DE SUBIDA (CLOUDINARY)
// =======================
app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // Cloudinary automatically picks up CLOUDINARY_URL from env
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'mipage_uploads'
    });

    res.json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});



const PORT = process.env.PORT || 4000;

// Siempre escuchar (Render lo necesita como servidor Node.js tradicional)
// El export permite que Vercel lo use como serverless handler
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

export default app;
