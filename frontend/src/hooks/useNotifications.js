import { useState } from 'react';
import API_URL from '../api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const markNotifsRead = async () => {
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    await fetch(`${API_URL}/api/notifications/read`, {
      method: 'PATCH', headers: { 'Authorization': `Bearer ${tok}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return {
    notifications, setNotifications,
    showNotifPanel, setShowNotifPanel,
    markNotifsRead
  };
}
