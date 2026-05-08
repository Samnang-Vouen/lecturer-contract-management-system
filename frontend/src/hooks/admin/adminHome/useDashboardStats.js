import { useState, useCallback, useRef, useEffect } from 'react';
import { listAdvisorContracts } from '../../../services/advisorContract.service';
import { getDashboardStats, getTeachingContractsTotal } from '../../../services/dashboard.service';

function readTotal(payload) {
  return Number(payload?.data?.total ?? payload?.total ?? 0);
}

function readSettledTotal(result) {
  return result?.status === 'fulfilled' ? readTotal(result.value) : 0;
}

export function useDashboardStats(selectedTimeRange) {
  const [dashboardData, setDashboardData] = useState({
    activeLecturers: { count: 0, change: 0, trend: [] },
    pendingContracts: { count: 0, change: 0, trend: [] },
    activeContracts: { count: 0, change: 0, trend: [] },
    recruitmentInProgress: { count: 0, change: 0, trend: [] },
    totalUsers: { count: 0, change: 0, trend: [] },
    recentActivities: [],
    departmentStats: {},
    monthlyTrends: [],
    contractStatus: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const lastPendingCountRef = useRef(0);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [statsRes, contractCountResults] = await Promise.all([
        getDashboardStats(selectedTimeRange),
        Promise.allSettled([
          getTeachingContractsTotal('WAITING_LECTURER'),
          getTeachingContractsTotal('WAITING_MANAGEMENT'),
          getTeachingContractsTotal('COMPLETED'),
          listAdvisorContracts({ page: 1, limit: 1, status: 'DRAFT' }),
          listAdvisorContracts({ page: 1, limit: 1, status: 'WAITING_MANAGEMENT' }),
          listAdvisorContracts({ page: 1, limit: 1, status: 'COMPLETED' }),
        ]),
      ]);

      const rawStats = statsRes.data || {};
      const normalizedStats = { ...rawStats };
      if (normalizedStats.renewals && !normalizedStats.activeContracts) {
        normalizedStats.activeContracts = normalizedStats.renewals;
        delete normalizedStats.renewals;
      }

      const [
        waitingLecturerResult,
        teachingWaitingManagementResult,
        teachingCompletedResult,
        advisorDraftResult,
        advisorWaitingManagementResult,
        advisorCompletedResult,
      ] = contractCountResults;

      const deptScopedContractStatus = {
        WAITING_LECTURER: readSettledTotal(waitingLecturerResult),
        WAITING_ADVISOR: readSettledTotal(advisorDraftResult),
        WAITING_MANAGEMENT:
          readSettledTotal(teachingWaitingManagementResult) +
          readSettledTotal(advisorWaitingManagementResult),
        COMPLETED:
          readSettledTotal(teachingCompletedResult) +
          readSettledTotal(advisorCompletedResult),
      };

      const pendingCount =
        deptScopedContractStatus.WAITING_LECTURER +
        deptScopedContractStatus.WAITING_ADVISOR +
        deptScopedContractStatus.WAITING_MANAGEMENT;
      const prevCount = Number(lastPendingCountRef.current || 0);
      const changePct = prevCount > 0 ? Math.round(((pendingCount - prevCount) / prevCount) * 100) : 0;
      lastPendingCountRef.current = pendingCount;

      setDashboardData(prev => ({
        ...prev,
        ...normalizedStats,
        pendingContracts: {
          ...prev.pendingContracts,
          count: pendingCount,
          change: changePct,
        },
        contractStatus: deptScopedContractStatus,
        lastFetch: new Date().toISOString()
      }));

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    isLoading,
    isRefreshing,
    lastUpdated,
    fetchDashboardData,
  };
}
