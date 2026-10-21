import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDrawer } from '../components/common/NotificationDrawer';
import {
  LayoutDashboard,
  MapPin,
  Grid,
  CalendarCheck,
  Users,
  FileText,
  ScanLine,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
  ExternalLink
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, isAdmin, isManager, logout } = useAuth();
  const { unreadCount, setIsOpen: openNotifications } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Sidebar links based on authorized role
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Facilities', path: '/admin/locations', icon: MapPin },
        { label: 'Bay inventory', path: '/admin/slots', icon: Grid },
        { label: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Audit trail', path: '/admin/audit-logs', icon: FileText },
        { label: 'My account', path: '/profile', icon: User },
      ];
    }
    if (isManager) {
      return [
        { label: 'Overview', path: '/manager/dashboard', icon: LayoutDashboard },
        { label: 'Bay inventory', path: '/manager/slots', icon: Grid },
        { label: 'Gate scanner', path: '/manager/scanner', icon: ScanLine },
        { label: 'My account', path: '/profile', icon: User },
      ];
    }
    // Default User
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Find parking', path: '/search', icon: MapPin },
      { label: 'My bookings', path: '/bookings', icon: CalendarCheck },
      { label: 'My account', path: '/profile', icon: User },
    ];
  };

  const navLinks = getNavLinks();
  const portal = isAdmin ? 'Admin' : isManager ? 'Manager' : 'Driver';
  const currentPage = navLinks.find((item) => isActive(item.path))?.label;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <a href="#main" className="skip-link">Skip to content</a>
      <NotificationDrawer />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-sm">
              P
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              Smart<span className="text-blue-400">Park</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Role Header Banner */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-white">
              {isAdmin ? 'Admin Console' : isManager ? 'Manager Portal' : 'User Portal'}
            </span>
          </div>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
            {isAdmin ? 'ADMIN' : isManager ? 'MGR' : 'USER'}
          </span>
        </div>

        {/* Links */}
        <nav aria-label="Main" className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>



        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <p className="text-sm sm:text-base font-bold text-slate-800 truncate">
              <span className="text-slate-400 font-semibold hidden sm:inline">{portal} / </span>
              {currentPage || portal}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Find parking <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </Link>

            <button
              onClick={() => openNotifications(true)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

          </div>
        </header>

        {/* Dashboard Page View */}
        <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto page-enter" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
