import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getSocket } from '../../../services/socket';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!authUser?.id) return;
    const socket = getSocket();
    const handleConnect = () => socket.emit('join', { id: authUser.id, role: authUser.role });
    socket.on('connect', handleConnect);
    socket.on('notification:new', (notif) => {
      const newNotif = { message: notif.message, time: new Date(notif.createdAt || Date.now()).toLocaleString() };
      setNotifications((prev) => [newNotif, ...prev]);
    });
    socket.connect();
    return () => { socket.off('connect', handleConnect); socket.off('notification:new'); socket.disconnect(); };
  }, [authUser?.id]);

  return {
    notifications,
    showNotifications,
    setShowNotifications,
  };
}
