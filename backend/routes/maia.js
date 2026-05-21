import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeImageWithGemini } from '../lib/maia.js';

// io se inyecta desde server.js via setIo()
let io;
export const setIo = (ioInstance) => { io = ioInstance; };

const router = Router();

// Referencia al userId de MAIA (se establece al arrancar el servidor)
let maiaUserId = null;
export const setMaiaUserId = (id) => { maiaUserId = id; };

const AUTHOR_SELECT = { id: true, name: true, email: true, avatar: true };
const COMMENT_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  replies: { include: { author: { select: AUTHOR_SELECT } } }
};

/**
 * POST /api/analyze-typos
 * Analiza imagen con Gemini, crea comentario MAIA y notifica al dueño del elemento.
 */
router.post('/analyze-typos', authenticateToken, async (req, res) => {
  const { imageUrl, projectId, elementId, elementOwnerId } = req.body;
  if (!imageUrl || !projectId || !elementId) {
    return res.status(400).json({ error: 'imageUrl, projectId y elementId son requeridos' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ typos: false, message: 'GEMINI_API_KEY no configurada' });
  }

  try {
    const exceptions = await prisma.typoException.findMany({ where: { projectId } });
    const parsed = await analyzeImageWithGemini(imageUrl, exceptions);

    if (parsed.found && parsed.errors?.length > 0) {
      const errorList = parsed.errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
      const commentText = `**Analisis de IA — Posibles typos detectados:**\n\n${errorList}`;

      const authorIdToUse = maiaUserId || req.user.id;
      const comment = await prisma.comment.create({
        data: {
          projectId, elementId,
          authorId: authorIdToUse,
          text: commentText,
          mentions: elementOwnerId ? [elementOwnerId] : [],
          parentId: null
        },
        include: COMMENT_INCLUDE
      });

      let notification = null;
      if (elementOwnerId && elementOwnerId !== maiaUserId) {
        notification = await prisma.notification.create({
          data: { userId: elementOwnerId, commentId: comment.id, projectId },
          include: {
            comment: { include: { author: { select: AUTHOR_SELECT }, project: { select: { title: true } } } }
          }
        });
      }

      io?.to(`project:${projectId}`).emit('comment:new', comment);
      if (notification) io?.to(`project:${projectId}`).emit('notification:new', notification);

      return res.json({ typos: true, errors: parsed.errors, comment, notification });
    }

    res.json({ typos: false });
  } catch (error) {
    console.error('Error en analyze-typos:', error);
    res.json({ typos: false, message: 'Error interno' });
  }
});

/**
 * POST /api/maia-comment
 * Crea un comentario como MAIA (checks de dimensiones, etc.)
 */
router.post('/maia-comment', authenticateToken, async (req, res) => {
  const { projectId, elementId, elementOwnerId, text } = req.body;
  if (!projectId || !elementId || !text) return res.status(400).json({ error: 'Faltan campos' });

  try {
    const authorIdToUse = maiaUserId || req.user.id;
    const comment = await prisma.comment.create({
      data: {
        projectId, elementId,
        authorId: authorIdToUse,
        text,
        mentions: elementOwnerId ? [elementOwnerId] : [],
        parentId: null
      },
      include: COMMENT_INCLUDE
    });

    let notification = null;
    if (elementOwnerId && elementOwnerId !== maiaUserId) {
      notification = await prisma.notification.create({
        data: { userId: elementOwnerId, commentId: comment.id, projectId },
        include: {
          comment: { include: { author: { select: AUTHOR_SELECT }, project: { select: { title: true } } } }
        }
      });
    }

    io?.to(`project:${projectId}`).emit('comment:new', comment);
    if (notification) io?.to(`project:${projectId}`).emit('notification:new', notification);

    res.json({ ok: true, comment, notification });
  } catch (e) {
    console.error('Error en maia-comment:', e);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /api/check-typos-only
 * Dry-run de typos sin crear comentario (pre-publicación).
 */
router.post('/check-typos-only', authenticateToken, async (req, res) => {
  const { imageUrl, projectId } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'Falta imageUrl' });
  if (!process.env.GEMINI_API_KEY) return res.json({ hasTypos: false });

  try {
    const exceptions = projectId
      ? await prisma.typoException.findMany({ where: { projectId } })
      : [];
    const parsed = await analyzeImageWithGemini(imageUrl, exceptions);
    res.json({ hasTypos: parsed.found === true, errors: parsed.errors || [] });
  } catch (e) {
    console.error('Error en check-typos-only:', e);
    res.json({ hasTypos: false });
  }
});

export default router;
