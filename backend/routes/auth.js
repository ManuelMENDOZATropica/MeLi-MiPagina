import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Se requiere un credential de Google.' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('Error verificando token de Google:', error.message);
    return res.status(401).json({ error: 'Token de Google inválido o expirado.' });
  }

  const { email, name, picture } = payload;

  if (!email.endsWith('@tropica.me')) {
    return res.status(403).json({ error: 'Acceso denegado. Solo se permiten correos @tropica.me' });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, name, avatar: picture } });
    } else {
      user = await prisma.user.update({ where: { email }, data: { name, avatar: picture } });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    console.error('Error de base de datos en /auth/google:', error.message);
    res.status(503).json({ error: 'No se pudo conectar con la base de datos. Intentá de nuevo en unos minutos.' });
  }
});

// ── DEV-ONLY: bypass de login sin Google OAuth ──────────────────────────────
// Solo disponible cuando NODE_ENV !== 'production'
router.post('/auth/dev-bypass', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'No disponible en producción.' });
  }
  try {
    const user = await prisma.user.upsert({
      where: { email: 'dev@tropica.me' },
      update: { name: 'Dev User' },
      create: { email: 'dev@tropica.me', name: 'Dev User', avatar: null },
    });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    console.error('Error en dev-bypass:', error.message);
    res.status(500).json({ error: 'Error interno en dev-bypass.' });
  }
});

export default router;
