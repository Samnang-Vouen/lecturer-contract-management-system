import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";
import { 
  Users, RefreshCw, UserPlus, 
  CheckCircle, Calendar, ArrowUp, ArrowDown, Clock, TrendingUp,
  Building2
} from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useNavigate } from "react-router-dom";

export default function SuperAdminDashboard() {
  const { authUser, logout, isCheckingAuth } = useAuthStore();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    activeLecturers: { count: 0, change: 0 },
    activeContracts: { count: 0, change: 0 },
    recruitmentInProgress: { count: 0, change: 0 },
    totalUsers: { count: 0, change: 0 },
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        // Fetch summary first to render UI shell quickly
        setIsLoading(true);
        const summaryRes = await axiosInstance.get('/dashboard/superadmin/summary');
        const summary = summaryRes?.data || {};
        setDashboardData((prev) => ({
          ...prev,
          activeLecturers: { count: Number(summary.activeLecturers) || 0, change: 0 },
          activeContracts: { count: Number(summary.activeContracts) || 0, change: 0 },
          totalUsers: { count: Number(summary.totalUsers) || 0, change: 0 },
        }));
        setIsLoading(false);

        // Defer stats fetch to after first paint to improve LCP
        setStatsLoading(true);
        setTimeout(async () => {
          try {
            const statsRes = await axiosInstance.get('/dashboard/stats');
            const data = statsRes?.data || {};
            const activities = Array.isArray(data.recentActivities) ? data.recentActivities : [];
            const formattedActivities = activities.slice(0, 5).map(a => ({
              id: a.id,
              type: a.type || 'general',
              title: a.title || 'System Activity',
              name: a.name || 'System',
              time: a.time ? formatTimeAgo(a.time) : 'Recently',
              status: a.status || 'completed'
            }));
            setDashboardData((prev) => ({
              ...prev,
              recruitmentInProgress: { count: data.recruitmentInProgress?.count || 0, change: 0 },
              recentActivities: formattedActivities,
            }));
          } catch (statsErr) {
            // Non-fatal; keep summary-visible
            console.error("Failed to fetch dashboard stats:", statsErr);
          } finally {
            setStatsLoading(false);
          }
        }, 0);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError("Failed to load dashboard data");
        
        // Fallback to minimal data structure
        setDashboardData({
          activeLecturers: { count: 0, change: 0 },
          activeContracts: { count: 0, change: 0 },
          recruitmentInProgress: { count: 0, change: 0 },
          totalUsers: { count: 0, change: 0 },
          recentActivities: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Fallback generator removed; server returns recentActivities

  const getChangeColor = (change) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-gray-500";
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUp className="w-4 h-4" />;
    if (change < 0) return <ArrowDown className="w-4 h-4" />;
    return null;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800"
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'application': 
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'contract': 
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'interview': 
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'addUser':
        // Navigate to User Management and auto-open the CreateUserModal via query param
        navigate('/superadmin/users?create=1');
        break;
      case 'manageUsers':
        navigate('/superadmin/users');
        break;
      case 'viewContracts':
        navigate('/superadmin/contracts');
        break;
      default:
        break;
    }
  };

  // Always render layout to avoid large layout shifts; use section skeletons below

  return (
    <DashboardLayout
      user={authUser}
      isLoading={isCheckingAuth}
      logout={logout}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  Super Admin Dashboard
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">Manage your institution's lecturer system with ease</p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => window.location.reload()} 
                  className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  aria-label="Refresh data"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh Data</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Stats Cards - Now 4 cards in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Active Lecturers */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Active Lecturers</h3>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    dashboardData.activeLecturers.count
                  )}
                </span>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Currently teaching</p>
              </div>
            </div>

            {/* Active Contracts */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="p-2.5 sm:p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Active Contracts</h3>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    dashboardData.activeContracts.count
                  )}
                </span>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Currently active</p>
              </div>
            </div>

            {/* Recruitment in Progress */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="p-2.5 sm:p-3 bg-purple-100 rounded-xl">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Recruitment</h3>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {statsLoading ? (
                    <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    dashboardData.recruitmentInProgress.count
                  )}
                </span>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">In progress</p>
              </div>
            </div>

            {/* Total Users */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="p-2.5 sm:p-3 bg-indigo-100 rounded-xl">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
               
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Total Users</h3>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    dashboardData.totalUsers.count
                  )}
                </span>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">System users</p>
              </div>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8" style={{ contentVisibility: 'auto' }}>
            {/* Recent Activities - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl mr-3 sm:mr-4">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Activities</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Latest system activities and updates</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {statsLoading ? (
                  <div className="space-y-3" style={{ minHeight: 240 }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : dashboardData.recentActivities.length === 0 ? (
                  <div className="text-center py-10 sm:py-12 text-gray-500" style={{ minHeight: 240 }}>
                    <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                    <p className="text-lg">No recent activities</p>
                    <p className="text-sm">Activities will appear here as they happen</p>
                  </div>
                ) : (
                  <div className="space-y-4" style={{ minHeight: 240 }}>
                    {dashboardData.recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="mr-3 sm:mr-4 mt-1 flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{activity.title}</h3>
                          <p className="text-gray-600 truncate">{activity.name}</p>
                          <p className="text-xs text-gray-500 mt-2">{activity.time}</p>
                        </div>
                        <div>
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions - Takes 1 column */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="p-2.5 sm:p-3 bg-indigo-100 rounded-xl mr-3 sm:mr-4">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">Quick Actions</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Common tasks</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                <button 
                  onClick={() => handleQuickAction('addUser')}
                  className="w-full p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-blue-700">Add New User</h3>
                      <p className="text-xs text-blue-600">Open create user form</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => handleQuickAction('manageUsers')}
                  className="w-full p-4 sm:p-5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-500 rounded-lg mr-3 group-hover:bg-orange-600 transition-colors">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-orange-700">Manage Users</h3>
                      <p className="text-xs text-orange-600">User administration</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}