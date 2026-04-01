import { useState, useEffect } from 'react';
import { NOTIF_LAST_SEEN_KEY } from '../../../utils/lecturerDashboard.constants';
import { markNotificationsRead } from '../../../services/contract.service';

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
      const prevLastViewed = lastViewedAt;
      const t = setTimeout(() => {
        setLastViewedAt(maxTs);
        setUnreadCount(0);
        if (lastViewedAtRef) lastViewedAtRef.current = maxTs;
        try { localStorage.setItem(NOTIF_LAST_SEEN_KEY, String(maxTs)); } catch {}
        // Persist read state on the server for notifications that have an id
        const unreadIds = notifications
          .filter((n) => n.id && (n.ts || 0) > prevLastViewed)
          .map((n) => n.id);
        if (unreadIds.length > 0) {
          markNotificationsRead(unreadIds).catch(() => {});
        }
      }, 250);
      return () => clearTimeout(t);
    }
  }, [showNotifications, notifications, lastViewedAt, setUnreadCount, lastViewedAtRef]);

  return {
    lastViewedAt
  };
};
