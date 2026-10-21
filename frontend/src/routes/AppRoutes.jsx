import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Every page is loaded on demand, so heavy libraries (charts, maps, QR scanner) only download
// when the visitor actually opens a page that needs them.
const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const LandingPage = page(() => import('../pages/LandingPage'), 'LandingPage');
const LoginPage = page(() => import('../pages/LoginPage'), 'LoginPage');
const RegisterPage = page(() => import('../pages/RegisterPage'), 'RegisterPage');
const SearchParkingPage = page(() => import('../pages/SearchParkingPage'), 'SearchParkingPage');
const ParkingDetailsPage = page(() => import('../pages/ParkingDetailsPage'), 'ParkingDetailsPage');
const BookingConfirmationPage = page(() => import('../pages/BookingConfirmationPage'), 'BookingConfirmationPage');
const PaymentPage = page(() => import('../pages/PaymentPage'), 'PaymentPage');
const BookingTicketPage = page(() => import('../pages/BookingTicketPage'), 'BookingTicketPage');
const MyBookingsPage = page(() => import('../pages/MyBookingsPage'), 'MyBookingsPage');
const UserDashboardPage = page(() => import('../pages/UserDashboardPage'), 'UserDashboardPage');
const ProfilePage = page(() => import('../pages/ProfilePage'), 'ProfilePage');

const AdminDashboardPage = page(() => import('../pages/AdminDashboardPage'), 'AdminDashboardPage');
const AdminLocationsPage = page(() => import('../pages/AdminLocationsPage'), 'AdminLocationsPage');
const AdminSlotsPage = page(() => import('../pages/AdminSlotsPage'), 'AdminSlotsPage');
const AdminBookingsPage = page(() => import('../pages/AdminBookingsPage'), 'AdminBookingsPage');
const AdminUsersPage = page(() => import('../pages/AdminUsersPage'), 'AdminUsersPage');
const AdminAuditLogsPage = page(() => import('../pages/AdminAuditLogsPage'), 'AdminAuditLogsPage');

const ManagerDashboardPage = page(() => import('../pages/ManagerDashboardPage'), 'ManagerDashboardPage');
const ManagerSlotsPage = page(() => import('../pages/ManagerSlotsPage'), 'ManagerSlotsPage');
const ManagerScannerPage = page(() => import('../pages/ManagerScannerPage'), 'ManagerScannerPage');

const AccessDeniedPage = page(() => import('../pages/AccessDeniedPage'), 'AccessDeniedPage');
const NotFoundPage = page(() => import('../pages/NotFoundPage'), 'NotFoundPage');

const ADMIN = ['ROLE_ADMIN'];
const STAFF = ['ROLE_PARKING_MANAGER', 'ROLE_ADMIN'];

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading page">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
  </div>
);

export const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public pages with the main header and footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchParkingPage />} />
        <Route path="/parking/:id" element={<ParkingDetailsPage />} />

        {/* Booking workflow (signed-in customers) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/booking/confirm" element={<BookingConfirmationPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/booking/ticket/:id" element={<BookingTicketPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
        </Route>
      </Route>

      {/* Dashboards with the persistent sidebar */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<ProtectedRoute allowedRoles={ADMIN} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/locations" element={<AdminLocationsPage />} />
            <Route path="/admin/slots" element={<AdminSlotsPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={STAFF} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/slots" element={<ManagerSlotsPage />} />
            <Route path="/manager/scanner" element={<ManagerScannerPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);
