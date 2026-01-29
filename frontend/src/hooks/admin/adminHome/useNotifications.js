import { useState, useEffect } from 'react';
import { getNotifications } from '../../../services/dashboard.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        setNotifications(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  return {
    notifications,
    showNotifications,
    setShowNotifications,
  };
}
