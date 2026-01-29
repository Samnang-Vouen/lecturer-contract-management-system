import { useState, useEffect } from 'react';
import { NOTIF_LAST_SEEN_KEY } from '../../../utils/lecturerDashboard.constants';

export const useNotifications = (notifications, showNotifications, setUnreadCount, lastViewedAtRef, showNotificationsRef) => {
  const [lastViewedAt, setLastViewedAt] = useState(0);

  // Load persisted last seen timestamp on mount
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(NOTIF_LAST_SEEN_KEY)) || 0;
      if (Number.isFinite(v) && v > 0) {
        setLastViewedAt(v);
        if (lastViewedAtRef) lastViewedAtRef.current = v;
      }
    } catch {}
  }, [lastViewedAtRef]);

  // Keep refs in sync with latest values
  useEffect(() => { 
    if (lastViewedAtRef) lastViewedAtRef.current = lastViewedAt; 
  }, [lastViewedAt, lastViewedAtRef]);
  
  useEffect(() => { 
    if (showNotificationsRef) showNotificationsRef.current = showNotifications; 
  }, [showNotifications, showNotificationsRef]);

  // When panel is open and notifications exist, mark as read and persist
  useEffect(() => {
    if (!showNotifications || !notifications?.length) return;
    const maxTs = notifications.reduce((m, n) => Math.max(m, n.ts || 0), lastViewedAt || 0);
    if (maxTs > (lastViewedAt || 0)) {
      const t = setTimeout(() => {
        setLastViewedAt(maxTs);
        setUnreadCount(0);
        if (lastViewedAtRef) lastViewedAtRef.current = maxTs;
        try { localStorage.setItem(NOTIF_LAST_SEEN_KEY, String(maxTs)); } catch {}
      }, 250);
      return () => clearTimeout(t);
    }
  }, [showNotifications, notifications, lastViewedAt, setUnreadCount, lastViewedAtRef]);

  return {
    lastViewedAt
  };
};
