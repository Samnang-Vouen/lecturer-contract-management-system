import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getDashboardStats,
  getTeachingContractsTotal,
} from '../../../services/dashboard.service';

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

      const [
        statsRes,
        waitLecturerRes,
        waitManagementRes,
        statusWaitingLecturerRes,
        statusWaitingManagementRes,
        statusCompletedRes,
      ] = await Promise.all([
        getDashboardStats(selectedTimeRange),
        getTeachingContractsTotal('MANAGEMENT_SIGNED').catch(() => ({ data: { total: 0 } })),
        getTeachingContractsTotal('LECTURER_SIGNED').catch(() => ({ data: { total: 0 } })),
        getTeachingContractsTotal('WAITING_LECTURER').catch(() => ({ data: { total: 0 } })),
        getTeachingContractsTotal('WAITING_MANAGEMENT').catch(() => ({ data: { total: 0 } })),
        getTeachingContractsTotal('COMPLETED').catch(() => ({ data: { total: 0 } })),
      ]);

      const rawStats = statsRes.data || {};
      const normalizedStats = { ...rawStats };
      if (normalizedStats.renewals && !normalizedStats.activeContracts) {
        normalizedStats.activeContracts = normalizedStats.renewals;
        delete normalizedStats.renewals;
      }

      const pendingCount = Number(waitLecturerRes?.data?.total || 0) + Number(waitManagementRes?.data?.total || 0);
      const prevCount = Number(lastPendingCountRef.current || 0);
      const changePct = prevCount > 0 ? Math.round(((pendingCount - prevCount) / prevCount) * 100) : 0;
      lastPendingCountRef.current = pendingCount;

      const deptScopedContractStatus = {
        WAITING_LECTURER: Number(statusWaitingLecturerRes?.data?.total || 0),
        WAITING_MANAGEMENT: Number(statusWaitingManagementRes?.data?.total || 0),
        COMPLETED: Number(statusCompletedRes?.data?.total || 0)
      };

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
