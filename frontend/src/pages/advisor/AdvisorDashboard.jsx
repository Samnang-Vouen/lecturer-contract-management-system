import React, { useState } from 'react';

import { BookOpen, CheckCircle, FileText, Info } from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { useAdvisorDashboard } from '../../hooks/advisor/dashboard/useAdvisorDashboard';
import { useNotifications } from '../../hooks/useNotifications';

import { DashboardHeader } from '../../components/lecturer/dashboard/DashboardHeader';
import { RealTimeBar } from '../../components/lecturer/dashboard/RealTimeBar';
import { StatCard } from '../../components/lecturer/dashboard/StatCard';
import { RecentActivities } from '../../components/lecturer/dashboard/RecentActivities';
import { QuickActions } from '../../components/lecturer/dashboard/QuickActions';

export default function AdvisorDashboard() {
  const { authUser } = useAuthStore();

  // Kept for DashboardHeader signature compatibility
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const {
    notifications,
    unreadCount,
    lastViewedAt,
    showNotifications,
    setShowNotifications,
    notifContainerRef,
  } = useNotifications();

  const { isLoading, isRefreshing, lastUpdated, realTimeStats, dashboardData, recentActivities, fetchDashboardData } =
    useAdvisorDashboard();

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'>
      <div className='p-4 sm:p-6 lg:p-8'>
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
          dashboardTitle='Advisor Dashboard'
          dashboardSubtitle="Here's a snapshot of your advisor contracts."
          showTimeRange={false}
          showNotificationsControl={true}
        />

        <RealTimeBar realTimeStats={realTimeStats} />

        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <StatCard
            title='Draft Contracts'
            value={dashboardData.draftContracts.count}
            change={0}
            icon={BookOpen}
            description='Waiting for your signature'
            isLoading={isLoading}
            color='blue'
            trend={[]}
            index={0}
          />
          <StatCard
            title='Total Contracts'
            value={dashboardData.totalContracts.count}
            change={0}
            icon={FileText}
            description='All advisor contracts'
            isLoading={isLoading}
            color='indigo'
            trend={[]}
            index={1}
          />
          <StatCard
            title='Signed Contracts'
            value={dashboardData.signedContracts.count}
            change={0}
            icon={CheckCircle}
            description='Signed by you'
            isLoading={isLoading}
            color='green'
            trend={[]}
            index={2}
          />
          <StatCard
            title='Waiting Management'
            value={dashboardData.waitingManagement.count}
            change={0}
            icon={Info}
            description='Awaiting management signature'
            isLoading={isLoading}
            color='amber'
            trend={[]}
            index={3}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          <RecentActivities activities={recentActivities} isLoading={isLoading} />
          <QuickActions
            basePath='/advisor'
            assignedCoursesCount={0}
            totalContractsCount={dashboardData.totalContracts.count}
            signedContractsCount={dashboardData.signedContracts.count}
            waitingManagementCount={dashboardData.waitingManagement.count}
          />
        </div>
      </div>
    </div>
  );
}
