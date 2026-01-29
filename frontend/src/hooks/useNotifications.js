import { useState, useEffect, useRef } from 'react';
import { statusToUi } from '../utils/chartHelpers';

export const useNotifications = (contracts) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastViewedAt, setLastViewedAt] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef(null);
  const lastViewedAtRef = useRef(0);
  const showNotificationsRef = useRef(false);

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
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const since = Date.now() - THIRTY_DAYS;
    const notis = contracts
      .filter(c => new Date(c.updated_at || c.created_at).getTime() >= since)
      .map(c => {
        const d = new Date(c.updated_at || c.created_at);
        const ui = statusToUi(c.status);
        return { 
          message: `Contract #${c.id} ${ui.label}.`, 
          time: d.toLocaleString(), 
          ts: d.getTime() 
        };
      })
      .filter(n => (n.ts || 0) >= since)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    
    setNotifications(notis);
    
    const sinceViewed = lastViewedAtRef.current || 0;
    if (showNotificationsRef.current) {
      setUnreadCount(0);
    } else {
      const unread = notis.filter(n => (n.ts || 0) > sinceViewed).length;
      setUnreadCount(unread);
    }
  }, [contracts]);

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
