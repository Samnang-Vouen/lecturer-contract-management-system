import React, { useMemo, useState } from 'react';
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import DashboardHeader from '../../components/management/dashboard/DashboardHeader.jsx';
import RealTimeStatusBar from '../../components/management/dashboard/RealTimeStatusBar.jsx';
import StatCard from '../../components/management/dashboard/StatCard.jsx';
import ApprovalTrendsChart from '../../components/management/dashboard/ApprovalTrendsChart.jsx';
import ContractStatusChart from '../../components/management/dashboard/ContractStatusChart.jsx';
import RecentActivities from '../../components/management/dashboard/RecentActivities.jsx';
import QuickActions from '../../components/management/dashboard/QuickActions.jsx';
import NotificationPanel from '../../components/management/dashboard/NotificationPanel.jsx';
import { useManagementDashboard } from '../../hooks/useManagementDashboard.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { buildStatTrends } from '../../utils/chartHelpers.js';

export default function ManagementHome() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const {
    isLoading,
    isRefreshing,
    lastUpdated,
    dashboard,
    realTimeStats,
    signedLecturersCount,
    expiredCount,
    contracts,
    fetchDashboardData
  } = useManagementDashboard(selectedTimeRange);

  const {
    notifications,
    unreadCount,
    lastViewedAt,
    showNotifications,
    setShowNotifications,
    notifContainerRef
  } = useNotifications(contracts);

  const statTrends = useMemo(() => 
    buildStatTrends(dashboard.monthly, dashboard.totals), 
    [dashboard.monthly, dashboard.totals]
  );

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'>
      <div className='p-4 sm:p-6 lg:p-8'>
        <DashboardHeader
          realTimeStats={realTimeStats}
          selectedTimeRange={selectedTimeRange}
          setSelectedTimeRange={setSelectedTimeRange}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          unreadCount={unreadCount}
          notifContainerRef={notifContainerRef}
          onRefresh={() => fetchDashboardData(true)}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          NotificationPanel={
            <NotificationPanel
              show={showNotifications}
              notifications={notifications}
              lastViewedAt={lastViewedAt}
            />
          }
        />

        <RealTimeStatusBar
          signedLecturersCount={signedLecturersCount}
          activeContracts={realTimeStats.activeContracts}
          expiredCount={expiredCount}
          systemHealth={realTimeStats.systemHealth}
        />

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <StatCard
            index={0}
            title='All Contracts'
            value={dashboard.totals.all}
            icon={FileText}
            color='blue'
            trend={statTrends.all}
            selectedTimeRange={selectedTimeRange}
          />
          <StatCard
            index={1}
            title='Waiting Lecturer'
            value={dashboard.totals.mgmtSigned}
            icon={Clock}
            color='amber'
            trend={statTrends.mgmtSigned}
            selectedTimeRange={selectedTimeRange}
          />
          <StatCard
            index={2}
            title='Waiting Management'
            value={dashboard.totals.lecturerSigned}
            icon={AlertCircle}
            color='sky'
            trend={statTrends.lecturerAwaitingMgmt}
            selectedTimeRange={selectedTimeRange}
          />
          <StatCard
            index={3}
            title='Completed'
            value={dashboard.totals.completed}
            icon={CheckCircle}
            color='green'
            trend={statTrends.completed}
            selectedTimeRange={selectedTimeRange}
          />
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8'>
          <ApprovalTrendsChart monthlyData={dashboard.monthly} />
          <ContractStatusChart totals={dashboard.totals} />
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8'>
          <RecentActivities activities={dashboard.recentActivities} />
          <QuickActions
            totals={dashboard.totals}
            onlineUsers={realTimeStats.onlineUsers}
            pendingApprovals={realTimeStats.pendingApprovals}
          />
        </div>
      </div>
    </div>
  );
}
