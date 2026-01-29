import DashboardLayout from '../components/DashboardLayout';
import { Outlet } from 'react-router-dom';

export default function ManagementDashboardLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
