import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

// Middleware para verificar Token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'tropica_super_secret_2026', (err, user) => {
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

    // Para desarrollo local rápido sin configurar Google Cloud Console
    if (mockEmail) {
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
      process.env.JWT_SECRET || 'tropica_super_secret_2026', 
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


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
