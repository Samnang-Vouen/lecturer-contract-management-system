import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from './store/useAuthStore.js';
import RequireRole from './components/RequireRole.jsx';
// Route-level code splitting: lazy-load all pages/layouts
const AdminDashboardLayout = lazy(() => import('./pages/Admindashboard.jsx'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome.jsx'));
const Recruitment = lazy(() => import('./pages/admin/RecruitmentDynamic.jsx'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile.jsx'));
const LecturerManagement = lazy(() => import('./pages/admin/LecturerManagement.jsx'));
const ClassesManagement = lazy(() => import('./pages/admin/ClassesManagement.jsx'));
const CoursesPage = lazy(() => import('./pages/admin/CoursesManagement.jsx'));
const CourseMappingPage = lazy(() => import('./pages/admin/CourseMapping.jsx'));
const ContractGeneration = lazy(() => import('./pages/admin/ContractGeneration.jsx'));

const LecturerDashboardLayout = lazy(() => import('./pages/LecturerDashboardLayout.jsx'));
const LecturerDashboard = lazy(() => import('./pages/lecturer/LecturerDashboard.jsx'));
const LecturerProfile = lazy(() => import('./pages/lecturer/LecturerProfile.jsx'));
const LecturerContracts = lazy(() => import('./pages/lecturer/LecturerContracts.jsx'));
const LecturerSchedule = lazy(() => import('./pages/lecturer/LecturerSchedule.jsx'));
const Onboarding = lazy(() => import('./pages/lecturer/Onboarding.jsx'));

const ManagementDashboardLayout = lazy(() => import('./pages/ManagementDashboard.jsx'));
const ManagementHome = lazy(() => import('./pages/management/ManagementHome.jsx'));
const ManagementProfile = lazy(() => import('./pages/management/ManagementProfile.jsx'));
const ManagementContracts = lazy(() => import('./pages/management/ManagementContracts.jsx'));

const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard.jsx'));
const UserManagement = lazy(() => import('./pages/UserManagement.jsx'));
const LoginForm = lazy(() => import('./components/LoginForm.jsx'));


function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Do not block initial paint on global auth check to improve LCP.

  return (
    <>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <Loader className="size-8 animate-spin" />
          </div>
        }
      >
        <Routes>
          {/* Default to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public login */}
          <Route path="/login" element={<LoginForm />} />

          {/* Superadmin */}
          <Route
            path="/superadmin"
            element={
              <RequireRole allowed={["superadmin"]}>
                <SuperAdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/users"
            element={
              <RequireRole allowed={["superadmin"]}>
                <UserManagement />
              </RequireRole>
            }
          />

          {/* Admin + Nested routes */}
          <Route
            path="/admin"
            element={
              <RequireRole allowed={["admin"]}>
                <AdminDashboardLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="lecturers" element={<LecturerManagement />} />
            <Route path="classes" element={<ClassesManagement />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="course-mapping" element={<CourseMappingPage />} />
            <Route path="contracts" element={<ContractGeneration />} />
          </Route>

          {/* Lecturer + Nested routes */}
          <Route
            path="/lecturer"
            element={
              <RequireRole allowed={["lecturer"]}>
                <LecturerDashboardLayout />
              </RequireRole>
            }
          >
            <Route index element={<LecturerDashboard />} />
            <Route path="profile" element={<LecturerProfile />} />
            <Route path="my-contracts" element={<LecturerContracts />} />
            <Route path="schedule" element={<LecturerSchedule />} />
          </Route>
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Management + Nested routes */}
          <Route
            path="/management"
            element={
              <RequireRole allowed={["management"]}>
                <ManagementDashboardLayout />
              </RequireRole>
            }
          >
            <Route index element={<ManagementHome />} />
            <Route path="profile" element={<ManagementProfile />} />
            <Route path="contracts" element={<ManagementContracts />} />
          </Route>

          {/* Fallback: if authenticated, send to role home; else login */}
          <Route
            path="*"
            element={
              authUser ? (
                <Navigate to={`/${authUser.role}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>

      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App
