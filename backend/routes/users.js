import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

export default router;
