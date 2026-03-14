import { useCallback, useEffect, useState } from 'react';

import { getLecturerActivities, getLecturerRealtime } from '../../../services/lecturerDashboard.service';
import { listAdvisorContracts } from '../../../services/advisorContract.service';

const DEFAULT_REALTIME = {
  activeContracts: 0,
  expiredContracts: 0,
  systemHealth: 'good',
};

function toTime(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

async function fetchAllAdvisorContracts({ limit = 100 } = {}) {
  const all = [];

  let page = 1;
  let total = Infinity;
  const maxPagesSafety = 500;

  while (all.length < total && page <= maxPagesSafety) {
    // Backend returns: { data, page, limit, total }
    const res = await listAdvisorContracts({ page, limit });
    const rows = Array.isArray(res?.data) ? res.data : [];

    total = Number.isFinite(+res?.total) ? +res.total : all.length + rows.length;
    all.push(...rows);

    if (rows.length === 0) break;
    page += 1;
  }

  return all;
}

export const useAdvisorDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [realTimeStats, setRealTimeStats] = useState(DEFAULT_REALTIME);

  const [dashboardData, setDashboardData] = useState({
    draftContracts: { count: 0 },
    totalContracts: { count: 0 },
    signedContracts: { count: 0 },
    waitingManagement: { count: 0 },
  });

  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [realtimeRes, contracts] = await Promise.all([
        getLecturerRealtime().catch(() => null),
        fetchAllAdvisorContracts({ limit: 100 }).catch(() => []),
      ]);

      const activities = await getLecturerActivities().catch(() => []);

      // Advisor dashboard: compute active/expired based on advisor contract dates.
      const now = Date.now();
      let activeContracts = 0;
      let expiredContracts = 0;

      for (const c of contracts) {
        const start = toTime(c?.start_date);
        const end = toTime(c?.end_date);

        if (end != null && end < now) {
          expiredContracts += 1;
          continue;
        }

        const started = start == null ? true : start <= now;
        const notEnded = end == null ? true : now <= end;
        if (started && notEnded) activeContracts += 1;
      }

      setRealTimeStats((prev) => ({
        ...prev,
        ...(realtimeRes || null),
        activeContracts,
        expiredContracts,
      }));

      const totalContracts = contracts.length;
      const draftContracts = contracts.filter((c) => normalizeStatus(c?.status) === 'DRAFT').length;
      const waitingManagement = contracts.filter((c) => normalizeStatus(c?.status) === 'WAITING_MANAGEMENT').length;
      const signedContracts = contracts.filter((c) => Boolean(c?.advisor_signed_at)).length;

      setDashboardData({
        draftContracts: { count: draftContracts },
        totalContracts: { count: totalContracts },
        signedContracts: { count: signedContracts },
        waitingManagement: { count: waitingManagement },
      });

      setRecentActivities(Array.isArray(activities) ? activities.slice(0, 10) : []);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch advisor dashboard data', error);
      setDashboardData({
        draftContracts: { count: 0 },
        totalContracts: { count: 0 },
        signedContracts: { count: 0 },
        waitingManagement: { count: 0 },
      });
      setRecentActivities([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Match the "Live updates every 30s" UI hint.
  useEffect(() => {
    const i = setInterval(() => fetchDashboardData(true), 30_000);
    return () => clearInterval(i);
  }, [fetchDashboardData]);

  return {
    isLoading,
    isRefreshing,
    lastUpdated,
    realTimeStats,
    dashboardData,
    recentActivities,
    fetchDashboardData,
  };
};
