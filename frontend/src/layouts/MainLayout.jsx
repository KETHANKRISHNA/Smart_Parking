import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { NotificationDrawer } from '../components/common/NotificationDrawer';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <NotificationDrawer />
      <main id="main" className="flex-1 page-enter" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
