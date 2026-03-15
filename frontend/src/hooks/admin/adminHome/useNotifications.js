import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getSocket } from '../../../services/socket';
import { fetchMyNotifications } from '../../../services/contract.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { authUser } = useAuthStore();

  // Initial fetch on mount
  useEffect(() => {
    if (!authUser?.id) return;
    fetchMyNotifications().then((data) => {
      const initial = (data || []).map((n) => ({
        message: n.message,
        time: new Date(n.createdAt).toLocaleString(),
        contract_id: n.contract_id || null,
      }));
      setNotifications(initial);
    }).catch(() => {});
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id) return;
    const socket = getSocket();
    const handleConnect = () => socket.emit('join', { id: authUser.id, role: authUser.role });
    const handleNotif = (notif) => {
      const newNotif = { message: notif.message, time: new Date(notif.createdAt || Date.now()).toLocaleString(), contract_id: notif.contract_id || null };
      setNotifications((prev) => [newNotif, ...prev]);
    };
    socket.on('connect', handleConnect);
    socket.on('notification:new', handleNotif);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:new', handleNotif);
    };
  }, [authUser?.id]);

  return {
    notifications,
    showNotifications,
    setShowNotifications,
  };
}
