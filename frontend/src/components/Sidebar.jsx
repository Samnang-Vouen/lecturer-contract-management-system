import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  FileText, 
  LogOut, 
  Building2, 
  Settings,
  PanelRightClose,
  PanelRightOpen,
  BookOpen,
  School,
  X,
  MapPin,
  UserCog,
  GraduationCap,
  UsersIcon,
  FileBarChart,
  Shield,
  ChevronDown,
  Briefcase
} from "lucide-react";

// Font styles
const sidebarFont = {
  fontFamily: `'Inter', 'Segoe UI', Arial, sans-serif`,
  fontSize: '18px',
  fontWeight: 400,
  letterSpacing: '0.01em'
};

const sidebarHeadingFont = {
  fontFamily: `'Inter', 'Segoe UI', Arial, sans-serif`,
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '0.01em'
};

/**
 * @typedef {'superadmin' | 'admin' | 'lecturer' | 'management'} UserRole
 * 
 * @typedef {Object} NavItem
 * @property {string} title - The title of the navigation item
 * @property {string} href - The href link of the navigation item
 * @property {React.ComponentType<{className?: string}>} icon - The icon component
 * @property {UserRole[]} roles - The roles that can see this item
 * @property {string} [category] - Category for organizing nav items
 * @property {boolean} [hasSubmenu] - Whether this item has submenu items
 */

/**
 * @type {NavItem[]}
 */
const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin", "lecturer", "management"],
    category: null
  },
  {
    title: "Academic Management",
    href: "/admin/academic",
    icon: GraduationCap,
    roles: ["admin"],
    category: "academic",
    hasSubmenu: true
  },
  {
    title: "Personnel & HR",
    href: "/admin/personnel",
    icon: UsersIcon,
    roles: ["admin"],
    category: "personnel",
    hasSubmenu: true
  },
  {
    title: "My Contracts",
    href: "/lecturer/my-contracts",
    icon: Briefcase,
    roles: ["lecturer"],
    category: null
  },
  {
    title: "Contract Management",
    href: "/management/contracts",
    icon: FileText,
    roles: ["management"],
    category: null
  },
  {
    title: "Profile Settings",
    href: "/management/profile",
    icon: Settings,
    roles: ["management"],
    category: null
  },
  {
    title: "System Administration",
    href: "/superadmin/system",
    icon: Shield,
    roles: ["superadmin"],
    category: "system",
    hasSubmenu: true
  },
  {
    title: "Profile Settings",
    href: "/admin/profile",
    icon: Settings,
    roles: ["admin"],
    category: null
  },
  {
    title: "Account Settings", 
    href: "/lecturer/profile",
    icon: Settings,
    roles: ["lecturer"],
    category: null
  },
];

export function Sidebar({ user: userProp, onLogout, mobileOpen = false, onClose = () => {} }) {
  const location = useLocation();
  const { user: storeUser, logout: storeLogout } = useAuthStore();
  
  const [collapsed, setCollapsed] = useState(() => {
    try { 
      return localStorage.getItem('sidebarCollapsed') === 'true'; 
    } catch { 
      return false; 
    }
  });

  const [expandedItems, setExpandedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('expandedItems') || '{}');
    } catch {
      return {};
    }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { 
        localStorage.setItem('sidebarCollapsed', String(next)); 
      } catch { /* ignore write errors */ }
      return next;
    });
  };

  const toggleItem = (itemTitle) => {
    if (collapsed) return;
    setExpandedItems(prev => {
      const next = { ...prev, [itemTitle]: !prev[itemTitle] };
      try {
        localStorage.setItem('expandedItems', JSON.stringify(next));
      } catch { /* ignore write errors */ }
      return next;
    });
  };

  const user = userProp || storeUser;
  const logout = onLogout || storeLogout;

  const roleRoot = useMemo(() => {
    return ({
      superadmin: '/superadmin',
      admin: '/admin',
      lecturer: '/lecturer',
      management: '/management'
    }[user.role] || '/dashboard');
  }, [user.role]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && mobileOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onClose]);

  if (!user) return null;

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => 
    item.roles.includes(user.role)
  );

  const isActive = (href, title) => {
    if (title === 'Dashboard') {
      return location.pathname === roleRoot;
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };
  
  const cn = (...classes) => classes.filter(Boolean).join(' ');

  const formatUserDisplay = (u) => {
    if (!u?.email) return '';
    let base = u.email.split('@')[0].replace(/[._-]+/g, ' ');
    base = base
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return base;
  };

  const getUserRoleLabel = (role) => {
    const roleLabels = {
      superadmin: 'System Administrator',
      admin: 'Administrator',
      lecturer: 'Lecturer',
      management: 'Management'
    };
    return roleLabels[role] || role;
  };

  const getPanelLabel = (role) => {
    const panel = {
      superadmin: 'System Panel',
      admin: 'Admin Panel',
      management: 'Management Panel',
      lecturer: 'Lecturer Panel'
    };
    return panel[role] || 'Panel';
  };

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;
    let href = item.href;
    if (item.title === 'Dashboard') {
      href = roleRoot;
    }
    const active = isActive(href, item.title);
    const isExpanded = expandedItems[item.title];
    return (
      <div key={item.title} className="mb-1">
        {item.hasSubmenu ? (
          <button
            onClick={(e) => {
              // Prevent any accidental navigation or click-through when expanding
              e.preventDefault?.();
              e.stopPropagation?.();
              if (collapsed) {
                // When collapsed, expand sidebar and open this submenu so child icons are visible
                try { localStorage.setItem('sidebarCollapsed', 'false'); } catch {}
                setCollapsed(false);
                setExpandedItems(prev => {
                  const next = { ...prev, [item.title]: true };
                  try { localStorage.setItem('expandedItems', JSON.stringify(next)); } catch {}
                  return next;
                });
                return;
              }
              toggleItem(item.title);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50",
              collapsed ? 'justify-center px-3' : 'justify-start',
              active ? "bg-blue-50 text-blue-900" : "text-gray-700 hover:text-blue-600"
            )}
            style={sidebarFont}
            title={collapsed ? item.title : undefined}
          >
            <Icon className={cn(
              "h-5 w-5 transition-colors duration-200 flex-shrink-0",
              active ? "text-blue-600" : "text-gray-500"
            )} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.title}</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isExpanded ? "transform rotate-0" : "transform -rotate-90"
                )} />
              </>
            )}
          </button>
        ) : (
          <Link 
            to={href} 
            className="block group" 
            onClick={isMobile ? onClose : undefined}
          >
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50",
              collapsed ? 'justify-center px-3' : 'justify-start',
              active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:text-blue-600"
            )}
            style={sidebarFont}
            title={collapsed ? item.title : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors duration-200 flex-shrink-0",
                active ? "text-blue-600" : "text-gray-500"
              )} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.title}</span>
              )}
            </div>
          </Link>
        )}
        {/* Submenu items */}
        {item.hasSubmenu && !collapsed && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.category === 'academic' && (
              <>
                <Link to="/admin/courses" onClick={isMobile ? onClose : undefined}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                    location.pathname.includes('/admin/courses') ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
                  )} style={sidebarFont}>
                    <BookOpen className="h-4 w-4" />
                    <span>Course Management</span>
                  </div>
                </Link>
                <Link to="/admin/classes" onClick={isMobile ? onClose : undefined}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                    location.pathname.includes('/admin/classes') ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
                  )} style={sidebarFont}>
                    <School className="h-4 w-4" />
                    <span>Class Management</span>
                  </div>
                </Link>
                <Link to="/admin/course-mapping" onClick={isMobile ? onClose : undefined}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                    location.pathname.includes('/admin/course-mapping') ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
                  )} style={sidebarFont}>
                    <MapPin className="h-4 w-4" />
                    <span>Course Mapping</span>
                  </div>
                </Link>
                <Link to="/admin/contracts" onClick={isMobile ? onClose : undefined}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                    location.pathname.includes('/admin/contracts') ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
                  )} style={sidebarFont}>
                    <FileText className="h-4 w-4" />
                    <span>Contract Generation</span>
                  </div>
                </Link>
              </>
            )}
            {item.category === 'personnel' && (
              <>
                <Link to="/admin/recruitment" onClick={isMobile ? onClose : undefined}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                    location.pathname.includes('/admin/recruitment') ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
                  )} style={sidebarFont}>
                    <UserPlus className="h-4 w-4" />
                    <span>Lecturer Recruitment</span>
                  </div>
                </Link>
                <Link to="/admin/lecturers" onClick={isMobile ? onClose : undefined}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                    location.pathname.includes('/admin/lecturers') ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
                  )} style={sidebarFont}>
                    <Users className="h-4 w-4" />
                    <span>Lecturer Management</span>
                  </div>
                </Link>
              </>
            )}
            {item.category === 'system' && (
              <Link to="/superadmin/users" onClick={isMobile ? onClose : undefined}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-blue-50",
                  location.pathname.includes('/superadmin/users') ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-blue-600"
                )} style={sidebarFont}>
                  <UserCog className="h-4 w-4" />
                  <span>User Management</span>
                </div>
              </Link>
            )}
            {/* no management submenu */}
          </div>
        )}
      </div>
    );
  };

  // Desktop sidebar
  const desktopSidebar = (
    <div className={cn(
      "hidden lg:flex h-full flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-in-out",
      collapsed ? 'w-20' : 'w-80'
    )} style={sidebarFont}>
      {/* Header */}
      <div className={cn(
        "flex h-16 items-center px-6 border-b border-gray-100",
        collapsed ? 'justify-center px-2' : 'gap-3'
      )} style={sidebarHeadingFont}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span style={sidebarHeadingFont}>LCMS</span>
                <span className="text-xs text-gray-500" style={sidebarFont}>{getPanelLabel(user.role)}</span>
              </div>
            </div>
            <button
              onClick={toggleCollapsed}
              className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-6">
          {/* User Profile */}
          {!collapsed && (
            <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100" style={sidebarFont}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm" style={sidebarHeadingFont}>
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm" style={sidebarHeadingFont}>
                    {formatUserDisplay(user)}
                  </p>
                  <p className="text-xs text-gray-500" style={sidebarFont}>
                    {getUserRoleLabel(user.role)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1" style={sidebarFont}>
            {filteredNavItems.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            "text-gray-700 hover:text-red-600 hover:bg-red-50",
            collapsed ? 'justify-center px-3' : 'justify-start'
          )}
          style={sidebarFont}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  // Mobile sidebar
  const mobileSidebar = (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 z-40 lg:hidden transition-opacity duration-300",
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )} 
        onClick={onClose} 
      />
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:hidden transition-transform duration-300",
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )} style={sidebarFont}>
        {/* Mobile Header */}
        <div className="flex h-16 items-center px-6 border-b border-gray-100" style={sidebarHeadingFont}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span style={sidebarHeadingFont}>LCMS</span>
              <span className="text-xs text-gray-500" style={sidebarFont}>{getPanelLabel(user.role)}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Mobile Content */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {/* Mobile User Profile */}
            <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100" style={sidebarFont}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm" style={sidebarHeadingFont}>
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm" style={sidebarHeadingFont}>
                    {formatUserDisplay(user)}
                  </p>
                  <p className="text-xs text-gray-500" style={sidebarFont}>
                    {getUserRoleLabel(user.role)}
                  </p>
                </div>
              </div>
            </div>
            {/* Mobile Navigation */}
            <nav className="space-y-1" style={sidebarFont}>
              {filteredNavItems.map((item) => renderNavItem(item, true))}
            </nav>
          </div>
          {/* Mobile Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-100">
            <button 
              onClick={() => { onClose(); logout(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:text-red-600 hover:bg-red-50"
              style={sidebarFont}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}