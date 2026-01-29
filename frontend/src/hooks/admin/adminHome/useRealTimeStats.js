import { useState, useEffect } from 'react';
import { getRealtime } from '../../../services/dashboard.service';

export function useRealTimeStats() {
  const [realTimeStats, setRealTimeStats] = useState({
    onlineUsers: 0,
    activeContracts: 0,
    expiredContracts: 0,
    systemHealth: 'good'
  });

  // Initial fetch
  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        const response = await getRealtime();
        setRealTimeStats(response.data || {
          onlineUsers: 0,
          activeContracts: 0,
          expiredContracts: 0,
          systemHealth: 'good'
        });
      } catch (error) {
        console.error('Failed to fetch real-time stats:', error);
      }
    };
    fetchInitialStats();
  }, []);

  // Real-time updates every 30 seconds
  useEffect(() => {
    const realtimeInterval = setInterval(async () => {
      try {
        const response = await getRealtime();
        setRealTimeStats(response.data);
      } catch (error) {
        // keep previous realtime state on transient failures
      }
    }, 30000);

    return () => clearInterval(realtimeInterval);
  }, []);

  return realTimeStats;
}
