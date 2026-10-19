import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public & Driver Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { SearchParkingPage } from '../pages/SearchParkingPage';
import { ParkingDetailsPage } from '../pages/ParkingDetailsPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { PaymentPage } from '../pages/PaymentPage';
import { BookingTicketPage } from '../pages/BookingTicketPage';
import { MyBookingsPage } from '../pages/MyBookingsPage';
import { UserDashboardPage } from '../pages/UserDashboardPage';
import { ProfilePage } from '../pages/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminLocationsPage } from '../pages/AdminLocationsPage';
import { AdminSlotsPage } from '../pages/AdminSlotsPage';
import { AdminBookingsPage } from '../pages/AdminBookingsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdminAuditLogsPage } from '../pages/AdminAuditLogsPage';

// Parking Manager Pages
import { ManagerDashboardPage } from '../pages/ManagerDashboardPage';
import { ManagerScannerPage } from '../pages/ManagerScannerPage';

// System Pages
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages with Main Header & Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchParkingPage />} />
        <Route path="/parking/:id" element={<ParkingDetailsPage />} />

        {/* Protected Booking Workflow Pages */}
        <Route
          path="/booking/confirm"
          element={
            <ProtectedRoute>
              <BookingConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/ticket/:id"
          element={
            <ProtectedRoute>
              <BookingTicketPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Dashboard Sub-System with Persistent Sidebar Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* User Dashboard */}
        <Route path="/dashboard" element={<UserDashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin Console (ROLE_ADMIN only) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminLocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/slots"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminSlotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminAuditLogsPage />
            </ProtectedRoute>
          }
        />

        {/* Parking Manager Portal (ROLE_PARKING_MANAGER or ROLE_ADMIN) */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ROLE_PARKING_MANAGER', 'ROLE_ADMIN']}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/slots"
          element={
            <ProtectedRoute allowedRoles={['ROLE_PARKING_MANAGER', 'ROLE_ADMIN']}>
              <AdminSlotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/scanner"
          element={
            <ProtectedRoute allowedRoles={['ROLE_PARKING_MANAGER', 'ROLE_ADMIN']}>
              <ManagerScannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/today"
          element={
            <ProtectedRoute allowedRoles={['ROLE_PARKING_MANAGER', 'ROLE_ADMIN']}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallbacks */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
