import React from 'react';
import { Bell } from 'lucide-react';

export function NotificationsPanel({
  notifications,
  showNotifPanel, setShowNotifPanel,
  unreadCount,
  markNotifsRead,
  scrollToElement,
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        id="notif-bell-btn"
        onClick={() => { setShowNotifPanel(!showNotifPanel); if (!showNotifPanel) markNotifsRead(); }}
        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.18s', position: 'relative' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #1a1f2e' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifPanel && (
        <div style={{ position: 'absolute', top: '44px', right: 0, width: '300px', background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e0e5ef', zIndex: 9999, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>= Notificaciones</span>
            <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}></button>
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ color: '#9ba3b5', fontSize: '13px', textAlign: 'center', padding: '24px 16px', margin: 0 }}>Sin notificaciones</p>
            ) : notifications.map(n => (
              <div key={n.id}
                onClick={() => {
                  setShowNotifPanel(false);
                  const elementId = n.comment?.elementId;
                  if (elementId) scrollToElement(elementId);
                }}
                style={{ padding: '10px 14px', borderBottom: '1px solid #f0f2f7', cursor: 'pointer', background: n.read ? 'white' : '#eef4ff', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f6fb'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'white' : '#eef4ff'}
              >
                {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3483fa', marginTop: '5px', flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#1a1f2e' }}>
                    {n.comment.author.name} te mencion�
                  </p>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#6b7280' }}>en "{n.comment.project.title}"</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontStyle: 'italic' }}>
                    �{n.comment.text.slice(0, 60)}{n.comment.text.length > 60 ? '&' : ''}�
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
