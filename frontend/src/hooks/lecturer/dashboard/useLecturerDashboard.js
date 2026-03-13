import { useState, useCallback, useEffect } from 'react';
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
import { processCourses, processDashboardSummary } from '../../../utils/lecturerDashboard.processors';
import { useAuthStore } from '../../../store/useAuthStore';
import { getSocket } from '../../../services/socket';

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

  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!authUser?.id) return;
    const socket = getSocket();
    const handleConnect = () => socket.emit('join', { id: authUser.id, role: authUser.role });
    socket.on('connect', handleConnect);
    socket.on('notification:new', (notif) => {
      const ts = new Date(notif.createdAt || notif.created_at || Date.now()).getTime();
      const newNotif = { message: notif.message, time: new Date(ts).toLocaleString(), ts, _fromSocket: true, contract_id: notif.contract_id || null };
      setNotifications((prev) => [newNotif, ...prev]);
      if (!showNotificationsRef?.current) setUnreadCount((prev) => prev + 1);
    });
    socket.connect();
    return () => { socket.off('connect', handleConnect); socket.off('notification:new'); socket.disconnect(); };
  }, [authUser?.id]);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true); else setIsLoading(true);

      const [coursesRes, lecturerDashRes, realtimeRes, activitiesRes, mappingsRes, salaryRes] = await Promise.allSettled([
        getLecturerCourses(),
        getLecturerDashboardSummary({ timeRange: selectedTimeRange }),
        getLecturerRealtime(),
        getLecturerActivities(),
        getLecturerCourseMappings(),
        getLecturerSalaryAnalysis()
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
  }, [selectedTimeRange]);

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
