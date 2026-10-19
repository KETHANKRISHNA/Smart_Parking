import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDrawer } from '../components/common/NotificationDrawer';
import { DemoSwitcherModal } from '../components/common/DemoSwitcherModal';
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
  ChevronRight,
  Shield,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, isAdmin, isManager, isUser, logout } = useAuth();
  const { unreadCount, setIsOpen: openNotifications } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Sidebar links based on authorized role
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { label: 'Executive Analytics', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Parking Locations', path: '/admin/locations', icon: MapPin },
        { label: 'Slot Inventory', path: '/admin/slots', icon: Grid },
        { label: 'All Bookings', path: '/admin/bookings', icon: CalendarCheck },
        { label: 'User Accounts', path: '/admin/users', icon: Users },
        { label: 'System Audit Logs', path: '/admin/audit-logs', icon: FileText },
      ];
    }
    if (isManager) {
      return [
        { label: 'Manager Overview', path: '/manager/dashboard', icon: LayoutDashboard },
        { label: 'Facility Slots', path: '/manager/slots', icon: Grid },
        { label: 'Gate QR Scanner', path: '/manager/scanner', icon: ScanLine },
        { label: "Today's Arrivals", path: '/manager/today', icon: CalendarCheck },
      ];
    }
    // Default User
    return [
      { label: 'User Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Find & Reserve', path: '/search', icon: MapPin },
      { label: 'My Bookings', path: '/bookings', icon: CalendarCheck },
      { label: 'Profile & Settings', path: '/profile', icon: User },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <NotificationDrawer />
      <DemoSwitcherModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
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
          >
            <X className="w-5 h-5" />
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
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
            {isAdmin ? 'ADMIN' : isManager ? 'MGR' : 'USER'}
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
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

        {/* Demo Switcher shortcut in sidebar */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setShowDemoModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Demo Role Switch
            </span>
            <ChevronRight className="w-3 h-3 text-amber-400" />
          </button>
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
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
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-800">
              {isAdmin ? 'System Administration' : isManager ? 'Parking Facility Control' : 'User Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Public Map <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={() => openNotifications(true)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Role: <span className="font-bold">{user?.role?.replace('ROLE_', '')}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
