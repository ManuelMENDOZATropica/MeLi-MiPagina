import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeImageWithGemini } from '../lib/maia.js';

let io;
export const setIo = (ioInstance) => { io = ioInstance; };

const router = Router();

// GET excepciones de un proyecto
router.get('/projects/:id/exceptions', authenticateToken, async (req, res) => {
  const exceptions = await prisma.typoException.findMany({
    where: { projectId: req.params.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(exceptions);
});

// POST agregar excepción manualmente
router.post('/projects/:id/exceptions', authenticateToken, async (req, res) => {
  const { word, reason } = req.body;
  if (!word?.trim()) return res.status(400).json({ error: 'Falta la palabra' });
  try {
    const exception = await prisma.typoException.create({
      data: { projectId: req.params.id, word: word.trim(), reason: reason?.trim() || null }
    });
    io?.to(`project:${req.params.id}`).emit('exception:new', exception);
    res.json(exception);
  } catch (e) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE eliminar excepción
router.delete('/exceptions/:id', authenticateToken, async (req, res) => {
  try {
    const ex = await prisma.typoException.findUnique({ where: { id: req.params.id } });
    await prisma.typoException.delete({ where: { id: req.params.id } });
    if (ex) io?.to(`project:${ex.projectId}`).emit('exception:deleted', { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: 'Excepción no encontrada' });
  }
});

// PATCH editar excepción
router.patch('/exceptions/:id', authenticateToken, async (req, res) => {
  const { word, reason } = req.body;
  if (!word?.trim()) return res.status(400).json({ error: 'Falta la palabra' });
  try {
    const updated = await prisma.typoException.update({
      where: { id: req.params.id },
      data: { word: word.trim(), reason: reason?.trim() || null }
    });
    io?.to(`project:${updated.projectId}`).emit('exception:updated', updated);
    res.json(updated);
  } catch (e) {
    res.status(404).json({ error: 'Excepción no encontrada' });
  }
});

// POST crear excepción desde comentario MAIA + re-verificar imagen
router.post('/comments/:commentId/exception', authenticateToken, async (req, res) => {
  const { word, reason, imageUrl, projectId, elementId } = req.body;
  if (!word || !projectId) return res.status(400).json({ error: 'Faltan campos' });

  try {
    const exception = await prisma.typoException.create({
      data: { projectId, word: word.trim(), reason: reason?.trim() || null, elementId: elementId || null }
    });

    let resolved = false;
    if (imageUrl && process.env.GEMINI_API_KEY) {
      const allExceptions = await prisma.typoException.findMany({ where: { projectId } });
      const parsed = await analyzeImageWithGemini(imageUrl, allExceptions);
      if (!parsed.found) {
        await prisma.comment.update({ where: { id: req.params.commentId }, data: { resolved: true } });
        resolved = true;
      }
    }

    io?.to(`project:${projectId}`).emit('exception:new', exception);
    res.json({ ok: true, exception, resolved });
  } catch (e) {
    console.error('Error en exception:', e);
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
