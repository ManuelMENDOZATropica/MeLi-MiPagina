import { useEffect } from 'react';
import { io as socketIO } from 'socket.io-client';
import API_URL from '../api';

/**
 * Conecta Socket.io al proyecto, se une a la sala y registra
 * todos los listeners de tiempo real. Se desconecta al desmontar.
 */
export function useSocket({ projectId, token, setComments, setNotifications, setExceptions }) {
  useEffect(() => {
    if (!projectId || !token) return;
    const currentUserId = JSON.parse(localStorage.getItem('tropica_user'))?.user?.id;

    const socket = socketIO(API_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join-project', projectId);

    // ─ Comentarios ─────────────────────────────────────────────────────────
    socket.on('comment:new', (comment) => {
      setComments(prev => prev.some(c => c.id === comment.id) ? prev : [...prev, comment]);
    });

    socket.on('comment:resolved', (updated) => {
      setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
    });

    socket.on('comment:deleted', ({ id: deletedId, parentId }) => {
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== deletedId) }
            : c
        ));
      } else {
        setComments(prev => prev.filter(c => c.id !== deletedId));
      }
    });

    // ─ Notificaciones ───────────────────────────────────────────────────────
    socket.on('notification:new', (notif) => {
      if (notif.userId !== currentUserId) return;
      setNotifications(prev => prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]);
    });

    // ─ Excepciones ──────────────────────────────────────────────────────────
    socket.on('exception:new', (ex) => {
      setExceptions(prev => prev.some(e => e.id === ex.id) ? prev : [ex, ...prev]);
    });

    socket.on('exception:updated', (ex) => {
      setExceptions(prev => prev.map(e => e.id === ex.id ? ex : e));
    });

    socket.on('exception:deleted', ({ id: exId }) => {
      setExceptions(prev => prev.filter(e => e.id !== exId));
    });

    return () => {
      socket.emit('leave-project', projectId);
      socket.disconnect();
    };
  }, [projectId, token]);
}
