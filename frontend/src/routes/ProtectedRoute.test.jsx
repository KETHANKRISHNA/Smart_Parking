import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const authState = vi.hoisted(() => ({ value: {} }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState.value }));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/access-denied" element={<p>denied page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>user area</p>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
          <Route path="/admin" element={<p>admin area</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('sends anonymous visitors to the login page', () => {
    authState.value = { isAuthenticated: false, loading: false, user: null };
    renderAt('/dashboard');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('shows a spinner while the session is being verified, not the login page', () => {
    authState.value = { isAuthenticated: false, loading: true, user: null };
    renderAt('/dashboard');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });

  it('lets a signed-in user through', () => {
    authState.value = { isAuthenticated: true, loading: false, user: { role: 'ROLE_USER' } };
    renderAt('/dashboard');
    expect(screen.getByText('user area')).toBeInTheDocument();
  });

  it('blocks a customer from admin pages', () => {
    authState.value = { isAuthenticated: true, loading: false, user: { role: 'ROLE_USER' } };
    renderAt('/admin');
    expect(screen.getByText('denied page')).toBeInTheDocument();
  });

  it('admits an admin', () => {
    authState.value = { isAuthenticated: true, loading: false, user: { role: 'ROLE_ADMIN' } };
    renderAt('/admin');
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});
