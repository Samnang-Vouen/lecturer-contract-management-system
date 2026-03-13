import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getSocket } from '../services/socket';

export const useNotifications = (contracts) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastViewedAt, setLastViewedAt] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef(null);
  const lastViewedAtRef = useRef(0);
  const showNotificationsRef = useRef(false);

  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!authUser?.id) return;
    const socket = getSocket();
    const handleConnect = () => socket.emit('join', { id: authUser.id, role: authUser.role });
    socket.on('connect', handleConnect);
    socket.on('notification:new', (notif) => {
      const ts = new Date(notif.createdAt || Date.now()).getTime();
      const newNotif = { message: notif.message, time: new Date(ts).toLocaleString(), ts, _fromSocket: true, contract_id: notif.contract_id || null };
      setNotifications((prev) => [newNotif, ...prev]);
      if (!showNotificationsRef.current) setUnreadCount((prev) => prev + 1);
    });
    socket.connect();
    return () => { socket.off('connect', handleConnect); socket.off('notification:new'); socket.disconnect(); };
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
