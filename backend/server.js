import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v2 as cloudinary } from 'cloudinary';
dotenv.config();

// ── Fail fast si faltan secretos críticos ──────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET no está configurado.');
  process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('TU_GOOGLE')) {
  console.warn('⚠️  ADVERTENCIA: GOOGLE_CLIENT_ID no configurado. El login con Google no funcionará.');
}

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

// ── Rutas ──────────────────────────────────────────────────────────────────
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import projectsRouter from './routes/projects.js';
import maiaRouter, { setIo as setMaiaIo, setMaiaUserId } from './routes/maia.js';
import exceptionsRouter, { setIo as setExceptionsIo } from './routes/exceptions.js';
import commentsRouter, { setIo as setCommentsIo } from './routes/comments.js';
import notificationsRouter from './routes/notifications.js';
import uploadRouter from './routes/upload.js';
import prisma from './lib/prisma.js';

// ── App & CORS ─────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://meli-mipagina.onrender.com',
  'https://mipagina.tropica.me',
  'https://www.mipagina.tropica.me',
  /\.vercel\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Sin origin = health check de Render, curl, server-to-server → permitir
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) callback(null, true);
    else callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true
}));

// ── Body parsers ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    express.json({ limit: '15mb' })(req, res, next);
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// ── Montar rutas ───────────────────────────────────────────────────────────
app.use('/api', authRouter);
app.use('/api', usersRouter);
app.use('/api', projectsRouter);
app.use('/api', maiaRouter);
app.use('/api', exceptionsRouter);
app.use('/api', commentsRouter);
app.use('/api', notificationsRouter);
app.use('/api', uploadRouter);

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true }
});

// Inyectar io en los routers que lo necesitan
setMaiaIo(io);
setExceptionsIo(io);
setCommentsIo(io);

io.on('connection', socket => {
  socket.on('join-project', projectId => socket.join(`project:${projectId}`));
  socket.on('leave-project', projectId => socket.leave(`project:${projectId}`));
});

// ── Arrancar ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  try {
    const maia = await prisma.user.upsert({
      where: { email: 'maia@tropica.me' },
      update: { name: 'MAIA', avatar: '/MAIA.png' },
      create: { email: 'maia@tropica.me', name: 'MAIA', avatar: '/MAIA.png' }
    });
    setMaiaUserId(maia.id);
    console.log(`🤖 Usuario MAIA listo (id: ${maia.id})`);
  } catch (e) {
    console.error('⚠️  No se pudo crear/encontrar el usuario MAIA:', e.message);
  }
});

export default app;
