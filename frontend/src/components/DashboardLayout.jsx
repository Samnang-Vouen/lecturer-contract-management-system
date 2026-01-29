import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import LoginForm from "./LoginForm";
import { useAuthStore } from "../store/useAuthStore";
import { Menu } from 'lucide-react';
import { sendPresence } from "../services/system.service";

/**
 * Dashboard layout component that handles authentication state and layout
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the main content area
 * @param {Object} [props.user] - Authenticated user object
 * @param {string} props.user.name - User name
 * @param {string} props.user.role - User role
 * @param {boolean} props.user.isFirstLogin - Whether this is the user's first login
 * @param {boolean} [props.isLoading=false] - Whether authentication is being loaded
 * @param {Function} [props.logout] - Logout function
 * @returns {React.ReactElement}
 */
export function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const { authUser, isCheckingAuth, logout } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    
    useEffect(() => {
        // Redirect lecturer on first login to onboarding
        if (!isCheckingAuth && authUser?.isFirstLogin && authUser.role === "lecturer") {
        navigate("/onboarding");
        }
    }, [authUser, isCheckingAuth, navigate]);

    // Show loading spinner
    if (isCheckingAuth) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        );
    }

    // Show login form if not authenticated
    if (!authUser) {
        return <LoginForm />;
    }

    // Show dashboard with sidebar
    return (
        <div className="flex h-screen bg-gray-50">
        <Sidebar user={authUser} onLogout={logout} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
                <main className="flex-1 overflow-auto defer-render">
                    {/* Presence heartbeat: mark user online for their department while dashboard is open */}
                    <PresenceHeartbeat />
                    {/* Mobile header: hamburger to open mobile sidebar */}
                    <div className="md:hidden bg-white border-b">
                        <div className="flex items-center p-3">
                            <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <Menu className="w-6 h-6 text-gray-700" />
                            </button>
                            <div className="ml-3 font-semibold text-gray-800">LCMS</div>
                        </div>
                    </div>
                    {children}
                </main>
        </div>
    );
}

export default DashboardLayout;

function PresenceHeartbeat() {
    const { authUser } = useAuthStore();
    const dept = authUser?.department_name;
    useEffect(() => {
        let stopped = false;
        let timer;
        const beat = async () => {
            try {
                if (dept) {
                    await sendPresence(dept);
                }
            } catch {}
            if (!stopped) timer = setTimeout(beat, 25000);
        };
        timer = setTimeout(beat, 0);
        return () => { stopped = true; if (timer) clearTimeout(timer); };
    }, [dept]);
    return null;
}
