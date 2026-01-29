import DashboardLayout from '../components/DashboardLayout';
import { Outlet } from 'react-router-dom';

export default function LecturerDashboardLayout(){
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
