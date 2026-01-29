import { useState, useCallback } from 'react';
import { listContracts } from '../../../services/contract.service';
import {
  getLecturerCourses,
  getLecturerDashboardSummary,
  getLecturerRealtime,
  getLecturerActivities,
  getLecturerCourseMappings,
  getLecturerSalaryAnalysis
} from '../../../services/lecturerDashboard.service';
import { chartColors, weeklyOverviewData, gradeDistributionData } from '../../../utils/lecturerDashboard.constants';
import { generateTrend } from '../../../utils/lecturerDashboard.utils';
import { processCourses, processContracts, processDashboardSummary } from '../../../utils/lecturerDashboard.processors';

export const useLecturerDashboard = (selectedTimeRange, lastViewedAtRef, showNotificationsRef) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realTimeStats, setRealTimeStats] = useState({
    activeContracts: 0,
    expiredContracts: 0,
    systemHealth: 'good'
  });

  const [dashboardData, setDashboardData] = useState({
    assignedCourses: { count: 0, change: 0, trend: [] },
    totalContracts: { count: 0, change: 0, trend: [] },
    signedContracts: { count: 0, change: 0, trend: [] },
    pendingSignatures: { count: 0, change: 0, trend: [] },
    waitingManagement: { count: 0, change: 0, trend: [] },
    syllabusReminder: { needed: false, uploaded: true, message: '' },
    recentActivities: [],
    weeklyOverview: [],
    gradeDistribution: [],
    courseHoursDist: [],
    courseMappings: []
  });

  const [salaryAnalysis, setSalaryAnalysis] = useState({
    totals: { khr: 0, usd: 0, hours: 0, contracts: 0 },
    byContract: [],
    byMonth: []
  });

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true); else setIsLoading(true);

      const [coursesRes, lecturerDashRes, realtimeRes, activitiesRes, mappingsRes, salaryRes, contractsRes] = await Promise.allSettled([
        getLecturerCourses(),
        getLecturerDashboardSummary({ timeRange: selectedTimeRange }),
        getLecturerRealtime(),
        getLecturerActivities(),
        getLecturerCourseMappings(),
        getLecturerSalaryAnalysis(),
        listContracts({ page: 1, limit: 100 })
      ]);

      const nextData = { ...dashboardData };

      // Courses
      if (coursesRes.status === 'fulfilled') {
        const { assignedCourses, courseHoursDist } = processCourses(coursesRes);
        nextData.assignedCourses = assignedCourses;
        nextData.courseHoursDist = courseHoursDist;
      } else {
        nextData.assignedCourses = { count: 4, change: 1, trend: generateTrend(4) };
        nextData.courseHoursDist = [];
      }

      nextData.weeklyOverview = weeklyOverviewData;

      // Contract-related metrics
      if (lecturerDashRes.status === 'fulfilled') {
        const metrics = processDashboardSummary(lecturerDashRes);
        Object.assign(nextData, metrics);
      }

      // Build notifications
      if (contractsRes.status === 'fulfilled') {
        const { notifications: notis, unreadCount: unread } = processContracts(
          contractsRes, 
          lastViewedAtRef, 
          showNotificationsRef
        );
        setNotifications(notis);
        setUnreadCount(unread);
      }

      // Realtime
      if (realtimeRes.status === 'fulfilled') {
        setRealTimeStats(prev => ({ ...prev, ...realtimeRes.value }));
      } else {
        setRealTimeStats(prev => ({ ...prev, activeContracts: prev.activeContracts || 0, expiredContracts: prev.expiredContracts || 0, systemHealth: 'good' }));
      }

      // Activities
      if (activitiesRes.status === 'fulfilled') {
        nextData.recentActivities = (activitiesRes.value || []).slice(0, 10);
      } else {
        nextData.recentActivities = [
          { type: 'class', title: 'Updated syllabus for CS101', time: new Date().toLocaleString() },
          { type: 'assignment', title: 'Posted Assignment 2 for DS201', time: new Date().toLocaleString() }
        ];
      }

      // Course mappings
      if (mappingsRes.status === 'fulfilled') {
        nextData.courseMappings = Array.isArray(mappingsRes.value) ? mappingsRes.value : [];
      } else {
        nextData.courseMappings = [];
      }

      // Salary analysis
      if (salaryRes.status === 'fulfilled') {
        setSalaryAnalysis(salaryRes.value || { totals: { khr: 0, usd: 0, hours: 0, contracts: 0 }, byContract: [], byMonth: [] });
      } else {
        setSalaryAnalysis({ totals: { khr: 0, usd: 0, hours: 0, contracts: 0 }, byContract: [], byMonth: [] });
      }

      nextData.gradeDistribution = gradeDistributionData(chartColors);
      setDashboardData(nextData);
      setLastUpdated(new Date());
    } catch (e) {
      setDashboardData(prev => ({
        ...prev,
        assignedCourses: { count: 4, change: 1, trend: generateTrend(4) },
        totalContracts: { count: 0, change: 0, trend: [] },
        signedContracts: { count: 0, change: 0, trend: [] },
        pendingSignatures: { count: 0, change: 0, trend: [] },
        waitingManagement: { count: 0, change: 0, trend: [] },
        syllabusReminder: { needed: false, uploaded: true, message: '' },
        weeklyOverview: weeklyOverviewData,
        gradeDistribution: gradeDistributionData(chartColors),
        courseMappings: []
      }));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTimeRange, lastViewedAtRef, showNotificationsRef]);

  return {
    isLoading,
    isRefreshing,
    lastUpdated,
    notifications,
    unreadCount,
    realTimeStats,
    dashboardData,
    salaryAnalysis,
    fetchDashboardData,
    setUnreadCount
  };
};
