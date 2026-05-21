import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET notificaciones del usuario
router.get('/notifications', authenticateToken, async (req, res) => {
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

// PATCH marcar todas como leídas
router.patch('/notifications/read', authenticateToken, async (req, res) => {
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

export default router;
