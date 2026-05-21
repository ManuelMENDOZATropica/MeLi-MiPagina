import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

let io;
export const setIo = (ioInstance) => { io = ioInstance; };

const router = Router();

const AUTHOR_SELECT = { id: true, name: true, email: true, avatar: true };
const COMMENT_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  replies: { include: { author: { select: AUTHOR_SELECT } }, orderBy: { createdAt: 'asc' } }
};

// GET todos los comentarios de un proyecto
router.get('/projects/:id/comments', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }] }
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado o sin acceso' });

    const comments = await prisma.comment.findMany({
      where: { projectId: req.params.id, parentId: null },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching comments' });
  }
});

// POST crear comentario
router.post('/projects/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { elementId, text, mentions = [], parentId } = req.body;
    if (!elementId || !text?.trim()) return res.status(400).json({ error: 'elementId y text requeridos' });

    const comment = await prisma.comment.create({
      data: {
        projectId: req.params.id, elementId,
        authorId: req.user.id,
        text: text.trim(), mentions,
        parentId: parentId || null
      },
      include: COMMENT_INCLUDE
    });

    // Notificaciones
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { desktopLayout: true, mobileLayout: true }
    });

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

    const recipientIds = [...new Set([elementOwnerId, ...mentions].filter(uid => uid && uid !== req.user.id))];

    let notifications = [];
    if (recipientIds.length > 0) {
      await prisma.notification.createMany({
        data: recipientIds.map(userId => ({ userId, commentId: comment.id, projectId: req.params.id }))
      });
      notifications = await prisma.notification.findMany({
        where: { commentId: comment.id },
        include: {
          comment: { include: { author: { select: AUTHOR_SELECT }, project: { select: { id: true, title: true } } } }
        }
      });
    }

    io?.to(`project:${req.params.id}`).emit('comment:new', comment);
    notifications.forEach(notif => io?.to(`project:${req.params.id}`).emit('notification:new', notif));

    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating comment' });
  }
});

// PATCH resolver/abrir comentario
router.patch('/comments/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const project = await prisma.project.findFirst({
      where: { id: comment.projectId, OR: [{ userId: req.user.id }, { editors: { some: { userId: req.user.id } } }] }
    });
    if (!project) return res.status(403).json({ error: 'Sin permisos' });

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { resolved: !comment.resolved },
      include: COMMENT_INCLUDE
    });

    io?.to(`project:${comment.projectId}`).emit('comment:resolved', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error resolving comment' });
  }
});

// DELETE eliminar comentario (solo el autor)
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.authorId !== req.user.id) return res.status(403).json({ error: 'Solo el autor puede eliminar' });

    const { projectId, parentId } = comment;
    await prisma.comment.delete({ where: { id: req.params.id } });

    io?.to(`project:${projectId}`).emit('comment:deleted', { id: req.params.id, parentId: parentId || null });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

export default router;
