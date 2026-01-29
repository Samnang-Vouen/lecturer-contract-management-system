import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { BookOpen, FileText, CheckCircle, Info } from 'lucide-react';
import { useLecturerDashboard } from '../../hooks/lecturer/dashboard/useLecturerDashboard';
import { useNotifications } from '../../hooks/lecturer/dashboard/useNotifications';
import { AUTO_REFRESH_INTERVAL, REALTIME_POLL_INTERVAL } from '../../utils/lecturerDashboard.constants';
import { StatCard } from '../../components/lecturer/dashboard/StatCard';
import { DashboardHeader } from '../../components/lecturer/dashboard/DashboardHeader';
import { RealTimeBar } from '../../components/lecturer/dashboard/RealTimeBar';
import { SyllabusReminder } from '../../components/lecturer/dashboard/SyllabusReminder';
import { CourseGroupsTable } from '../../components/lecturer/dashboard/CourseGroupsTable';
import { SalaryAnalysisChart } from '../../components/lecturer/dashboard/SalaryAnalysisChart';
import { CourseHoursChart } from '../../components/lecturer/dashboard/CourseHoursChart';
import { RecentActivities } from '../../components/lecturer/dashboard/RecentActivities';
import { QuickActions } from '../../components/lecturer/dashboard/QuickActions';

export default function LecturerDashboard() {
  const { authUser } = useAuthStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Create refs early so they can be passed to both hooks
  const lastViewedAtRef = useRef(0);
  const showNotificationsRef = useRef(false);
  const notifContainerRef = useRef(null);

  const {
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
  } = useLecturerDashboard(selectedTimeRange, lastViewedAtRef, showNotificationsRef);

  const {
    lastViewedAt
  } = useNotifications(notifications, showNotifications, setUnreadCount, lastViewedAtRef, showNotificationsRef);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const i = setInterval(() => fetchDashboardData(true), AUTO_REFRESH_INTERVAL);
    return () => clearInterval(i);
  }, [fetchDashboardData]);

  // Frequent polling for dynamic updates every 30s
  useEffect(() => {
    const i = setInterval(() => fetchDashboardData(true), REALTIME_POLL_INTERVAL);
    return () => clearInterval(i);
  }, [fetchDashboardData]);

  // Close notifications when clicking outside or pressing Escape
  useEffect(() => {
    if (!showNotifications) return;
    const onOutside = (e) => {
      if (!notifContainerRef.current) return;
      if (!notifContainerRef.current.contains(e.target)) setShowNotifications(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setShowNotifications(false); };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [showNotifications, notifContainerRef]);


  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'>
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Header */}
        <DashboardHeader
          authUser={authUser}
          realTimeStats={realTimeStats}
          selectedTimeRange={selectedTimeRange}
          setSelectedTimeRange={setSelectedTimeRange}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          unreadCount={unreadCount}
          lastViewedAt={lastViewedAt}
          notifContainerRef={notifContainerRef}
          fetchDashboardData={fetchDashboardData}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />

        {/* Real-time bar */}
        <RealTimeBar realTimeStats={realTimeStats} />

        {/* Stat cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <StatCard
            title='My Courses'
            value={dashboardData.assignedCourses.count}
            change={dashboardData.assignedCourses.change}
            icon={BookOpen}
            description='Assigned this term'
            isLoading={isLoading}
            color='blue'
            trend={dashboardData.assignedCourses.trend}
            index={0}
          />
          <StatCard
            title='Total Contracts'
            value={dashboardData.totalContracts.count}
            change={dashboardData.totalContracts.change}
            icon={FileText}
            description='All teaching contracts'
            isLoading={isLoading}
            color='indigo'
            trend={dashboardData.totalContracts.trend}
            index={1}
          />
          <StatCard
            title='Signed Contracts'
            value={dashboardData.signedContracts.count}
            change={dashboardData.signedContracts.change}
            icon={CheckCircle}
            description='Signed by you'
            isLoading={isLoading}
            color='green'
            trend={dashboardData.signedContracts.trend}
            index={2}
          />
          <StatCard
            title='Waiting Management'
            value={dashboardData.waitingManagement.count}
            change={dashboardData.waitingManagement.change}
            icon={Info}
            description='Awaiting management signature'
            isLoading={isLoading}
            color='amber'
            trend={dashboardData.waitingManagement.trend}
            index={3}
          />
        </div>

        {/* Syllabus reminder */}
        <SyllabusReminder syllabusReminder={dashboardData.syllabusReminder} />

        {/* Course Groups Table */}
        <CourseGroupsTable courseMappings={dashboardData.courseMappings} />

        {/* Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          <SalaryAnalysisChart salaryAnalysis={salaryAnalysis} />
          <CourseHoursChart courseHoursDist={dashboardData.courseHoursDist} />
        </div>

        {/* Bottom section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          <RecentActivities activities={dashboardData.recentActivities} isLoading={isLoading} />
          <QuickActions
            assignedCoursesCount={dashboardData.assignedCourses.count}
            totalContractsCount={dashboardData.totalContracts.count}
            signedContractsCount={dashboardData.signedContracts.count}
            waitingManagementCount={dashboardData.waitingManagement.count}
          />
        </div>
      </div>
    </div>
  );
}
