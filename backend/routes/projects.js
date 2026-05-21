import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
let io = null;
export const setIo = (ioInstance) => { io = ioInstance; };

// Slug corto único (7 chars, base62)
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateSlug = () =>
  Array.from({ length: 7 }, () => SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)]).join('');
const getUniqueSlug = async () => {
  let slug, exists;
  do {
    slug = generateSlug();
    exists = await prisma.project.findUnique({ where: { slug } });
  } while (exists);
  return slug;
};

const projectInclude = {
  user: { select: { id: true, name: true, email: true, avatar: true } },
  editors: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }
};

// GET todos los proyectos del usuario
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }] },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// POST crear proyecto
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { title, editorIds } = req.body;
    const newProject = await prisma.project.create({
      data: {
        title: title || 'Nuevo Proyecto de Landing',
        desktopLayout: [], mobileLayout: [], canvasNodes: {},
        userId: req.user.id,
        editors: { create: Array.isArray(editorIds) ? editorIds.map(userId => ({ userId })) : [] }
      },
      include: projectInclude
    });
    res.json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating project' });
  }
});

// GET proyecto por ID
router.get('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }]
      },
      include: projectInclude
    });
    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching project' });
  }
});

// PATCH actualizar (autoguardado)
router.patch('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { desktopLayout, mobileLayout, canvasNodes, title } = req.body;
    const updateData = {};
    if (desktopLayout !== undefined) updateData.desktopLayout = desktopLayout;
    if (mobileLayout !== undefined) updateData.mobileLayout = mobileLayout;
    if (canvasNodes !== undefined) updateData.canvasNodes = canvasNodes;
    if (title !== undefined) updateData.title = title;

    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }] }
    });
    if (!existing) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const project = await prisma.project.update({ where: { id: req.params.id }, data: updateData });

    // Broadcast en tiempo real a los demás colaboradores
    if (io && (desktopLayout !== undefined || mobileLayout !== undefined || title !== undefined)) {
      const socketId = req.headers['x-socket-id'] || null;
      const payload = {
        desktopLayout: project.desktopLayout,
        mobileLayout: project.mobileLayout,
        title: project.title,
        savedBy: req.user.id,
      };
      if (socketId) {
        // Emitir a todos excepto al que guardó
        io.to(`project:${req.params.id}`).except(socketId).emit('canvas:updated', payload);
      } else {
        io.to(`project:${req.params.id}`).emit('canvas:updated', payload);
      }
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating project' });
  }
});

// DELETE eliminar proyecto
router.delete('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id) return res.status(403).json({ error: 'Only the project owner can delete it' });
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting project' });
  }
});

// POST agregar editor
router.post('/projects/:id/editors', authenticateToken, async (req, res) => {
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
    const updated = await prisma.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error adding editor' });
  }
});

// POST publicar/despublicar
router.post('/projects/:id/publish', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }] }
    });
    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const willPublish = !project.isPublished;
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

// GET público (sin auth) — solo por slug
router.get('/public/projects/:key', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { slug: req.params.key } });
    if (!project || !project.isPublished) {
      return res.status(404).json({ error: 'Este proyecto no está publicado o no existe.' });
    }
    res.json({ title: project.title, desktopLayout: project.desktopLayout, mobileLayout: project.mobileLayout });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching public project' });
  }
});

export default router;
