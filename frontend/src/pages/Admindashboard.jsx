import DashboardLayout from '../components/DashboardLayout';
import { Outlet } from 'react-router-dom';

export default function AdminDashboardLayout() {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
}
