import { useState, useCallback, useEffect } from 'react';
import { listContracts } from '../services/contract.service';
import { getHealth } from '../services/system.service';
import { buildMonthlySeries, statusToUi } from '../utils/chartHelpers';

export const useManagementDashboard = (selectedTimeRange) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dashboard, setDashboard] = useState({
    totals: { all: 0, lecturerSigned: 0, mgmtSigned: 0, completed: 0 },
    monthly: [],
    recentActivities: []
  });
  const [realTimeStats, setRealTimeStats] = useState({
    onlineUsers: 0,
    activeContracts: 0,
    pendingApprovals: 0,
    systemHealth: 'good'
  });
  const [signedLecturersCount, setSignedLecturersCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [contracts, setContracts] = useState([]);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true); 
      else setIsLoading(true);

      const [contractsRes, healthRes, waitMgmtTotalRes, completedTotalRes] = await Promise.allSettled([
        listContracts({ page: 1, limit: 100 }),
        getHealth(),
        listContracts({ page: 1, limit: 1, status: 'WAITING_MANAGEMENT' }),
        listContracts({ page: 1, limit: 1, status: 'COMPLETED' })
      ]);

      let contractsData = [];
      if (contractsRes.status === 'fulfilled') contractsData = contractsRes.value?.data || [];
      setContracts(contractsData);

      const totals = contractsData.reduce((acc, c) => {
        const st = String(c.status || '').toUpperCase();
        acc.all += 1;
        if (st === 'WAITING_MANAGEMENT' || st === 'LECTURER_SIGNED') acc.lecturerSigned += 1;
        else if (st === 'WAITING_LECTURER' || st === 'MANAGEMENT_SIGNED' || st === 'DRAFT') acc.mgmtSigned += 1;
        else if (st === 'COMPLETED') acc.completed += 1;
        return acc;
      }, { all: 0, lecturerSigned: 0, mgmtSigned: 0, completed: 0 });

      const monthly = buildMonthlySeries(contractsData, selectedTimeRange);

      const recent = (() => {
        const events = [];
        for (const c of (contractsData || [])) {
          const ms = c.management_signed_at || c.managementSignedAt;
          if (!ms) continue;
          const ts = new Date(ms);
          if (isNaN(ts.getTime())) continue;
          const ui = statusToUi(c.status);
          const who = (c.lecturer?.display_name || c.lecturer?.email || 'Lecturer');
          const time = new Date(c.updated_at || c.created_at).toLocaleString();
          events.push({
            ts: ts.getTime(),
            message: `${who}'s contract`,
            time,
            statusLabel: ui.label,
            chipClass: ui.chipClass,
            dotClass: ui.dotClass
          });
        }
        if (!showRefresh) {
          const now = new Date();
          events.push({
            ts: now.getTime(),
            message: 'Management login',
            time: now.toLocaleString(),
            statusLabel: 'Management activity',
            chipClass: 'bg-violet-50 text-violet-700 border border-violet-100',
            dotClass: 'bg-violet-500'
          });
        }
        return events
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))
          .slice(0, 5)
          .map(({ ts, ...rest }) => rest);
      })();

      setDashboard({ totals, monthly, recentActivities: recent });

      let onlineUsers = 0;
      try {
        const signedLecturerIds = new Set(
          (contractsData || [])
            .filter(c => {
              const st = String(c.status || '').toUpperCase();
              return st === 'WAITING_LECTURER' || st === 'MANAGEMENT_SIGNED' || st === 'COMPLETED';
            })
            .map(c =>
              c.lecturer_id ?? c.lecturerId ?? c.lecturer?.id ?? c.lecturer?.user_id ?? c.lecturer?.userId ?? c.lecturer?.email ?? null
            )
            .filter(Boolean)
        );
        onlineUsers = signedLecturerIds.size;
      } catch {
        onlineUsers = 0;
      }

      const systemHealth = (healthRes.status === 'fulfilled' && healthRes.value?.status === 'ok') ? 'excellent' : 'warning';
      setRealTimeStats({ 
        onlineUsers, 
        activeContracts: totals.all, 
        pendingApprovals: totals.mgmtSigned, 
        systemHealth 
      });

      let totalSigned = 0;
      let gotAny = false;
      if (waitMgmtTotalRes.status === 'fulfilled') {
        totalSigned += Number(waitMgmtTotalRes.value?.total || 0);
        gotAny = true;
      }
      if (completedTotalRes.status === 'fulfilled') {
        totalSigned += Number(completedTotalRes.value?.total || 0);
        gotAny = true;
      }
      if (!gotAny) {
        totalSigned = (contracts || []).reduce((acc, c) => {
          const st = String(c.status || '').toUpperCase();
          return acc + ((st === 'WAITING_MANAGEMENT' || st === 'COMPLETED') ? 1 : 0);
        }, 0);
      }
      setSignedLecturersCount(totalSigned);

      const isExpired = (c) => {
        const end = c?.end_date || c?.endDate;
        if (!end) return false;
        try {
          const endD = new Date(end);
          if (isNaN(endD.getTime())) return false;
          const today = new Date();
          endD.setHours(0,0,0,0);
          today.setHours(0,0,0,0);
          return endD < today;
        } catch { return false; }
      };
      setExpiredCount((contractsData || []).filter(isExpired).length);

      setLastUpdated(new Date());
    } catch (e) {
      // Keep previous state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTimeRange]);

  useEffect(() => { 
    fetchDashboardData(); 
  }, [fetchDashboardData]);

  useEffect(() => {
    const fiveMin = setInterval(() => fetchDashboardData(true), 300000);
    const thirtySec = setInterval(() => fetchDashboardData(true), 30000);
    return () => { 
      clearInterval(fiveMin); 
      clearInterval(thirtySec); 
    };
  }, [fetchDashboardData]);

  return {
    isLoading,
    isRefreshing,
    lastUpdated,
    dashboard,
    realTimeStats,
    signedLecturersCount,
    expiredCount,
    contracts,
    fetchDashboardData
  };
};
