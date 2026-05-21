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
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('TU_GOOGLE')) {
  console.warn('⚠️  ADVERTENCIA: GOOGLE_CLIENT_ID no está configurado. El login con Google no funcionará.');
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
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Se requiere un credential de Google.' });
  }

  try {
    // Verificar el ID token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email   = payload.email;
    const name    = payload.name;
    const picture = payload.picture;

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
    } else {
      // Actualizar nombre/foto en cada login por si cambiaron en Google
      user = await prisma.user.update({
        where: { email },
        data: { name, avatar: picture }
      });
    }

    // Emitir JWT propio
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });

  } catch (error) {
    console.error('Error verificando token de Google:', error.message);
    res.status(401).json({ error: 'Token de Google inválido o expirado.' });
  }
});



// =======================
// RUTAS DE USUARIOS
// =======================
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// =======================
// RUTAS DE PROYECTOS (API REST)
// =======================

// 1. Obtener todos los proyectos del usuario
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { editors: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        editors: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// 2. Crear un nuevo proyecto en blanco
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { title, editorIds } = req.body;
    const newProject = await prisma.project.create({
      data: {
        title: title || 'Nuevo Proyecto de Landing',
        desktopLayout: [],
        mobileLayout: [],
        canvasNodes: {},
        userId: req.user.id,
        editors: {
          create: Array.isArray(editorIds) ? editorIds.map(userId => ({ userId })) : []
        }
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        editors: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        }
      }
    });
    res.json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating project' });
  }
});

// 3. Obtener un proyecto específico (para el Editor)
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { editors: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        editors: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
    
    res.json(project);
  } catch (error) {
    console.error(error);
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

    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { editors: { some: { userId: req.user.id } } }
        ]
      }
    });
    if (!existingProject) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const project = await prisma.project.update({
      where: { id: req.params.id },
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
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id) return res.status(403).json({ error: 'Only the project owner can delete it' });

    await prisma.project.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting project' });
  }
});

// Agregar editor a un proyecto (solo el owner puede hacerlo)
app.post('/api/projects/:id/editors', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    if (project.userId !== req.user.id) return res.status(403).json({ error: 'Solo el owner puede agregar colaboradores' });
    if (project.userId === userId) return res.status(400).json({ error: 'El owner ya tiene acceso' });

    await prisma.projectEditor.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId } },
      create: { projectId: req.params.id, userId },
      update: {}
    });

    const updatedProject = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        editors: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }
      }
    });
    res.json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error adding editor' });
  }
});

// =======================
// ANÁLISIS DE TYPOS CON IA
// =======================

// POST /api/analyze-typos
// Analiza una imagen con Gemini Vision para detectar errores ortográficos/tipográficos.
// Si los encuentra, crea un comentario automático en el elemento y notifica al dueño.
app.post('/api/analyze-typos', authenticateToken, async (req, res) => {
  const { imageUrl, projectId, elementId, elementOwnerId } = req.body;
  if (!imageUrl || !projectId || !elementId) {
    return res.status(400).json({ error: 'imageUrl, projectId y elementId son requeridos' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ typos: false, message: 'GEMINI_API_KEY no configurada' });
  }

  try {
    // Descargar la imagen de Cloudinary y convertirla a base64
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error('No se pudo descargar la imagen de Cloudinary');
    const imgBuffer = await imgResponse.arrayBuffer();
    const base64Image = Buffer.from(imgBuffer).toString('base64');
    const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';

    // Llamada a Gemini Vision (gemini-2.5-flash)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Eres un corrector de pruebas profesional de publicidad digital. Analiza el texto visible en esta imagen de un banner o elemento de marketing.
Busca únicamente errores ortográficos, errores tipográficos, palabras mal escritas o errores gramaticales evidentes en español o inglés.
Si encuentras errores responde SOLO con JSON válido: {"found": true, "errors": ["descripción del error 1", "descripción del error 2"]}
Si NO hay errores responde SOLO: {"found": false}
Sin texto adicional fuera del JSON.`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }]
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      let errDetail = errText;
      try { errDetail = JSON.parse(errText)?.error?.message || errText; } catch {}
      return res.json({ typos: false, message: `Gemini error ${geminiRes.status}: ${errDetail}` });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let parsed;
    try {
      // Extraer JSON de la respuesta (puede venir con ```json ... ```)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { found: false };
    } catch {
      parsed = { found: false };
    }

    if (parsed.found && parsed.errors?.length > 0) {
      // Construir texto del comentario automático
      const errorList = parsed.errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
      const commentText = `**Analisis de IA — Posibles typos detectados:**\n\n${errorList}`;

      // Crear comentario como MAIA (usuario IA del sistema)
      const authorIdToUse = maiaUserId || req.user.id;
      const comment = await prisma.comment.create({
        data: {
          projectId,
          elementId,
          authorId: authorIdToUse,
          text: commentText,
          mentions: elementOwnerId ? [elementOwnerId] : [],
          parentId: null
        },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          replies: { include: { author: { select: { id: true, name: true, email: true, avatar: true } } } }
        }
      });

      // Notificar al dueño del elemento (si es diferente al que subió)
      if (elementOwnerId && elementOwnerId !== req.user.id) {
        await prisma.notification.create({
          data: { userId: elementOwnerId, commentId: comment.id, projectId }
        });
      }

      return res.json({ typos: true, errors: parsed.errors, comment });
    }

    res.json({ typos: false });
  } catch (error) {
    console.error('Error en analyze-typos:', error);
    res.json({ typos: false, message: 'Error interno' });
  }
});

// =======================
// RUTAS DE COMENTARIOS
// =======================

// GET todos los comentarios de un proyecto (sin resolver)
app.get('/api/projects/:id/comments', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }]
      }
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado o sin acceso' });

    const comments = await prisma.comment.findMany({
      where: { projectId: req.params.id, parentId: null }, // solo raíz
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching comments' });
  }
});

// POST crear comentario (dispara notificaciones a mencionados)
app.post('/api/projects/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { elementId, text, mentions = [], parentId } = req.body;
    if (!elementId || !text?.trim()) return res.status(400).json({ error: 'elementId y text requeridos' });

    const comment = await prisma.comment.create({
      data: {
        projectId: req.params.id,
        elementId,
        authorId: req.user.id,
        text: text.trim(),
        mentions,
        parentId: parentId || null
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        replies: { include: { author: { select: { id: true, name: true, email: true, avatar: true } } } }
      }
    });

    // Notificar a:
    // 1. El dueño del elemento (addedBy en el canvas layout)
    // 2. Los @mencionados explícitamente
    // Siempre excluyendo al autor del comentario

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { desktopLayout: true, mobileLayout: true }
    });

    // Buscar el elemento en ambos layouts para encontrar addedBy
    let elementOwnerId = null;
    const searchInLayout = (layout) => {
      if (!Array.isArray(layout)) return;
      for (const item of layout) {
        if (item.uniqueId === elementId) { elementOwnerId = item.addedBy || null; return; }
        if (item.type === 'rowGroup' && Array.isArray(item.items)) {
          for (const child of item.items) {
            if (child.uniqueId === elementId) { elementOwnerId = child.addedBy || null; return; }
          }
        }
      }
    };
    searchInLayout(project.desktopLayout);
    if (!elementOwnerId) searchInLayout(project.mobileLayout);

    // Unir destinatarios: dueño del elemento + mencionados, sin duplicados, sin el autor
    const recipientIds = [...new Set([
      elementOwnerId,
      ...mentions
    ].filter(uid => uid && uid !== req.user.id))];

    if (recipientIds.length > 0) {
      await prisma.notification.createMany({
        data: recipientIds.map(userId => ({
          userId,
          commentId: comment.id,
          projectId: req.params.id
        }))
      });
    }

    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating comment' });
  }
});

// PATCH resolver/abrir un comentario
app.patch('/api/comments/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Solo el autor o dueño del proyecto puede resolver
    const project = await prisma.project.findFirst({
      where: { id: comment.projectId, OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }] }
    });
    if (!project) return res.status(403).json({ error: 'Sin permisos' });

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { resolved: !comment.resolved },
      include: { author: { select: { id: true, name: true, email: true, avatar: true } }, replies: { include: { author: { select: { id: true, name: true, email: true, avatar: true } } } } }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error resolving comment' });
  }
});

// DELETE eliminar comentario (solo el autor)
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.authorId !== req.user.id) return res.status(403).json({ error: 'Solo el autor puede eliminar' });

    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

// =======================
// RUTAS DE NOTIFICACIONES
// =======================

// GET notificaciones del usuario logueado
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        comment: {
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
            project: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// PATCH marcar todas las notificaciones como leídas
app.patch('/api/notifications/read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error marking notifications as read' });
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
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { editors: { some: { userId: req.user.id } } }
        ]
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

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

// Arrancar servidor + asegurar que el usuario MAIA existe en la BD
let maiaUserId = null;

app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  try {
    const maia = await prisma.user.upsert({
      where: { email: 'maia@tropica.me' },
      update: { name: 'MAIA', avatar: '/MAIA.png' },
      create: { email: 'maia@tropica.me', name: 'MAIA', avatar: '/MAIA.png' }
    });
    maiaUserId = maia.id;
    console.log(`🤖 Usuario MAIA listo (id: ${maiaUserId})`);
  } catch (e) {
    console.error('⚠️  No se pudo crear/encontrar el usuario MAIA:', e.message);
  }
});

export default app;
