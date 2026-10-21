import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { session } from '../services/session';
import { AUTH_LOGOUT_EVENT } from '../services/api';

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../services/api', () => ({ default: apiMock, AUTH_LOGOUT_EVENT: 'auth:logout' }));

let auth;
const Probe = () => {
  auth = useAuth();
  return null;
};
const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
});

describe('AuthProvider', () => {
  it('logs in, persists the session and exposes the role', async () => {
    apiMock.post.mockResolvedValue({
      success: true,
      data: { token: 'jwt', refreshToken: 'rt', id: 1, name: 'Asha', email: 'a@x.com', role: 'ROLE_ADMIN' },
    });
    mount();

    await act(() => auth.login('a@x.com', 'Passw0rd1'));

    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isAdmin).toBe(true);
    expect(session.getToken()).toBe('jwt');
    expect(session.getRefreshToken()).toBe('rt');
  });

  it('keeps the user signed in when verification fails for a non-auth reason (network blip)', async () => {
    session.save({ token: 'jwt', refreshToken: 'rt', id: 1, name: 'Asha', role: 'ROLE_USER' });
    apiMock.get.mockRejectedValue(Object.assign(new Error('Network Error'), { status: undefined }));
    mount();

    await waitFor(() => expect(auth.loading).toBe(false));
    expect(auth.isAuthenticated).toBe(true);
  });

  it('signs the user out when the server rejects the stored session', async () => {
    session.save({ token: 'stale', refreshToken: 'rt', id: 1, name: 'Asha', role: 'ROLE_USER' });
    apiMock.get.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
    mount();

    await waitFor(() => expect(auth.isAuthenticated).toBe(false));
    expect(session.getToken()).toBeNull();
  });

  it('reacts to the API client reporting an unrecoverable 401', async () => {
    session.save({ token: 'jwt', refreshToken: 'rt', id: 1, name: 'Asha', role: 'ROLE_USER' });
    apiMock.get.mockResolvedValue({ success: true, data: { id: 1, name: 'Asha', role: 'ROLE_USER' } });
    mount();
    await waitFor(() => expect(auth.loading).toBe(false));

    act(() => {
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    });

    await waitFor(() => expect(auth.isAuthenticated).toBe(false));
  });

  it('survives corrupted storage on startup', () => {
    localStorage.setItem('user', '{broken');
    expect(() => mount()).not.toThrow();
    expect(auth.user).toBeNull();
  });

  it('logout clears the session and tells the server', async () => {
    apiMock.post.mockResolvedValue({ success: true, data: { token: 'jwt', refreshToken: 'rt', id: 1, role: 'ROLE_USER' } });
    mount();
    await act(() => auth.login('a@x.com', 'Passw0rd1'));

    apiMock.post.mockClear();
    apiMock.post.mockResolvedValue({});
    act(() => auth.logout());

    expect(auth.isAuthenticated).toBe(false);
    expect(apiMock.post).toHaveBeenCalledWith('/auth/logout');
  });
});
