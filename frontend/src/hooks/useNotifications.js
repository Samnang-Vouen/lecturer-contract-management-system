import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getSocket } from '../services/socket';
import { fetchMyNotifications } from '../services/contract.service';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastViewedAt, setLastViewedAt] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef(null);
  const lastViewedAtRef = useRef(0);
  const showNotificationsRef = useRef(false);

  const { authUser } = useAuthStore();

  // Initial fetch on mount
  useEffect(() => {
    if (!authUser?.id) return;
    fetchMyNotifications().then((data) => {
      const initial = (data || []).map((n) => {
        const ts = new Date(n.createdAt).getTime();
        return { message: n.message, time: new Date(ts).toLocaleString(), ts, contract_id: n.contract_id || null };
      });
      setNotifications(initial);
      const seen = (() => { try { return Number(localStorage.getItem('mgmtNotifLastSeenTs')) || 0; } catch { return 0; } })();
      const unread = initial.filter((n) => (n.ts || 0) > seen).length;
      if (unread > 0) setUnreadCount(unread);
    }).catch(() => {});
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id) return;
    const socket = getSocket();
    const handleConnect = () => socket.emit('join', { id: authUser.id, role: authUser.role });
    const handleNotif = (notif) => {
      const ts = new Date(notif.createdAt || Date.now()).getTime();
      const newNotif = { message: notif.message, time: new Date(ts).toLocaleString(), ts, _fromSocket: true, contract_id: notif.contract_id || null };
      setNotifications((prev) => [newNotif, ...prev]);
      if (!showNotificationsRef.current) setUnreadCount((prev) => prev + 1);
    };
    socket.on('connect', handleConnect);
    socket.on('notification:new', handleNotif);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:new', handleNotif);
    };
  }, [authUser?.id]);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('mgmtNotifLastSeenTs')) || 0;
      if (Number.isFinite(v) && v > 0) setLastViewedAt(v);
    } catch {}
  }, []);

  useEffect(() => { 
    lastViewedAtRef.current = lastViewedAt; 
  }, [lastViewedAt]);

  useEffect(() => { 
    showNotificationsRef.current = showNotifications; 
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const onClick = (e) => {
      if (!notifContainerRef.current) return;
      if (!notifContainerRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    const onKey = (e) => { 
      if (e.key === 'Escape') setShowNotifications(false); 
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications || !notifications?.length) return;
    const maxTs = notifications.reduce((m, n) => Math.max(m, n.ts || 0), lastViewedAt || 0);
    if (maxTs > (lastViewedAt || 0)) {
      const t = setTimeout(() => {
        setLastViewedAt(maxTs);
        setUnreadCount(0);
        try { 
          localStorage.setItem('mgmtNotifLastSeenTs', String(maxTs)); 
        } catch {}
      }, 250);
      return () => clearTimeout(t);
    }
  }, [showNotifications, notifications, lastViewedAt]);

  return {
    notifications,
    unreadCount,
    lastViewedAt,
    showNotifications,
    setShowNotifications,
    notifContainerRef
  };
};
