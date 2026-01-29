import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useDashboardStats } from '../../hooks/admin/adminHome/useDashboardStats';
import { useRealTimeStats } from '../../hooks/admin/adminHome/useRealTimeStats';
import { useNotifications } from '../../hooks/admin/adminHome/useNotifications';
import DashboardHeader from '../../components/admin/adminHome/DashboardHeader';
import RealTimeStatusBar from '../../components/admin/adminHome/RealTimeStatusBar';
import StatCard from '../../components/admin/adminHome/StatCard';
import MonthlyTrendsChart from '../../components/admin/adminHome/MonthlyTrendsChart';
import DepartmentDistributionChart from '../../components/admin/adminHome/DepartmentDistributionChart';
import PerformanceMetrics from '../../components/admin/adminHome/PerformanceMetrics';
import ContractStatusChart from '../../components/admin/adminHome/ContractStatusChart';
import RecentActivities from '../../components/admin/adminHome/RecentActivities';
import QuickActions from '../../components/admin/adminHome/QuickActions';
import { Users, FileText, UserPlus, CheckCircle } from 'lucide-react';

export default function AdminHome() {
  const { authUser } = useAuthStore();
  const { trendData } = useDashboardData();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  
  // Custom hooks for data management
  const { dashboardData, isLoading, isRefreshing, lastUpdated, fetchDashboardData } = useDashboardStats(selectedTimeRange);
  const realTimeStats = useRealTimeStats();
  const { notifications, showNotifications, setShowNotifications } = useNotifications();

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const statusCounts = dashboardData?.contractStatus || { 
    WAITING_LECTURER: 0, 
    WAITING_MANAGEMENT: 0, 
    COMPLETED: 0 
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'>
      <div className='px-4 sm:px-6 lg:px-8 py-6'>
        {/* Header */}
        <DashboardHeader
          authUser={authUser}
          realTimeStats={realTimeStats}
          selectedTimeRange={selectedTimeRange}
          setSelectedTimeRange={setSelectedTimeRange}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchDashboardData(true)}
          lastUpdated={lastUpdated}
        />

        {/* Real-time Status Bar */}
        <RealTimeStatusBar realTimeStats={realTimeStats} />

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8'>
          <StatCard
            title="Active Lecturers"
            value={dashboardData.activeLecturers.count}
            change={dashboardData.activeLecturers.change}
            icon={Users}
            description="Currently teaching"
            isLoading={isLoading}
            color="blue"
            trend={trendData.activeLecturers}
            index={0}
          />
          
          <StatCard
            title="Pending Contracts"
            value={dashboardData.pendingContracts.count}
            change={dashboardData.pendingContracts.change}
            icon={FileText}
            description="Awaiting signatures"
            isLoading={isLoading}
            color="yellow"
            trend={trendData.pendingContracts}
            index={1}
          />
          
          <StatCard
            title="Completed Contracts"
            value={statusCounts.COMPLETED}
            change={0}
            icon={CheckCircle}
            description="Contracts completed"
            isLoading={isLoading}
            color="green"
            trend={trendData.activeContracts}
            index={2}
          />
          
          <StatCard
            title="Recruitment"
            value={dashboardData.recruitmentInProgress.count}
            change={dashboardData.recruitmentInProgress.change}
            icon={UserPlus}
            description="Active candidates"
            isLoading={isLoading}
            color="purple"
            trend={trendData.recruitmentInProgress}
            index={3}
          />
          
          <StatCard
            title="Total Users"
            value={dashboardData.totalUsers.count}
            change={dashboardData.totalUsers.change}
            icon={Users}
            description="All system users"
            isLoading={isLoading}
            color="indigo"
            trend={trendData.totalUsers}
            index={4}
          />
        </div>

        {/* Charts Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8'>
          <MonthlyTrendsChart data={dashboardData.monthlyTrends} />
          <DepartmentDistributionChart data={dashboardData.departmentStats?.distribution} />
        </div>

        {/* Performance Metrics & Contract Status */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          <PerformanceMetrics />
          <ContractStatusChart statusCounts={statusCounts} />
        </div>

        {/* Bottom Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8'>
          <RecentActivities 
            activities={dashboardData.recentActivities} 
            isLoading={isLoading}
          />
          <QuickActions dashboardData={dashboardData} />
        </div>
      </div>
    </div>
  );
}
