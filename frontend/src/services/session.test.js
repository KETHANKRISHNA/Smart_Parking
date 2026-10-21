import { describe, expect, it } from 'vitest';
import { session } from './session';

describe('session store', () => {
  it('saves tokens and the profile separately', () => {
    session.save({ token: 'access', refreshToken: 'refresh', id: 7, name: 'Asha', role: 'ROLE_USER' });
    expect(session.getToken()).toBe('access');
    expect(session.getRefreshToken()).toBe('refresh');
    expect(session.getUser()).toEqual({ id: 7, name: 'Asha', role: 'ROLE_USER' });
  });

  it('never throws on corrupted stored data (the old app crashed on startup)', () => {
    localStorage.setItem('user', '{broken');
    expect(session.getUser()).toBeNull();
    localStorage.setItem('user', '"just a string"');
    expect(session.getUser()).toBeNull();
  });

  it('clears everything on logout', () => {
    session.save({ token: 'a', refreshToken: 'b', id: 1 });
    session.clear();
    expect(session.getToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
    expect(session.getUser()).toBeNull();
  });
});
