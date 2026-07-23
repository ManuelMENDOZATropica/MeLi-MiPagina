import { useEffect, useRef } from 'react';
import { io as socketIO } from 'socket.io-client';
import API_URL from '../api';

/**
 * Conecta Socket.io al proyecto y registra todos los listeners en tiempo real.
 * Retorna el socketId para que el autoguardado pueda excluirse del broadcast.
 */
export function useSocket({
  projectId, token,
  setComments, setNotifications, setExceptions,
  setCanvases, setProjectTitle,
}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!projectId || !token) return;
    const currentUserId = JSON.parse(localStorage.getItem('tropica_user'))?.user?.id;

    const socket = socketIO(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join-project', projectId);

    // ─ Canvas (layout) ──────────────────────────────────────────────────────
    socket.on('canvas:updated', ({
      desktopLayout, mobileLayout,
      rtbDesktopLayout, rtbMobileLayout,
      homeSliderDesktopLayout, homeSliderMobileLayout,
      title, savedBy
    }) => {
      // Ignorar si lo guardó este mismo usuario (el backend lo filtra, pero doble seguro)
      if (savedBy === currentUserId) return;
      if (setCanvases) {
        setCanvases(prev => ({
          miPagina: {
            desktop: Array.isArray(desktopLayout) ? desktopLayout : prev.miPagina.desktop,
            mobile:  Array.isArray(mobileLayout)  ? mobileLayout  : prev.miPagina.mobile,
          },
          rtb: {
            desktop: Array.isArray(rtbDesktopLayout) ? rtbDesktopLayout : prev.rtb.desktop,
            mobile:  Array.isArray(rtbMobileLayout)  ? rtbMobileLayout  : prev.rtb.mobile,
          },
          homeSlider: {
            desktop: Array.isArray(homeSliderDesktopLayout) ? homeSliderDesktopLayout : prev.homeSlider.desktop,
            mobile:  Array.isArray(homeSliderMobileLayout)  ? homeSliderMobileLayout  : prev.homeSlider.mobile,
          },
        }));
      }
      if (setProjectTitle && title) setProjectTitle(title);
    });

    // ─ Comentarios ──────────────────────────────────────────────────────────
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
      socketRef.current = null;
    };
  }, [projectId, token]);

  // Expone el socketId actual para usarlo en el autoguardado
  return socketRef;
}
