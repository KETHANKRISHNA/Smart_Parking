// Thin, failure-proof wrapper around localStorage for the auth session.
// Storage can be unavailable (private mode) or contain junk, so nothing here may ever throw.

const KEYS = { token: 'token', refreshToken: 'refreshToken', user: 'user' };

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the session just won't survive a reload */
  }
};

export const session = {
  getToken: () => read(KEYS.token),
  getRefreshToken: () => read(KEYS.refreshToken),

  getUser() {
    const raw = read(KEYS.user);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  },

  /** Stores the tokens and user profile returned by login / register / refresh. */
  save({ token, refreshToken, ...user }) {
    write(KEYS.token, token);
    if (refreshToken) write(KEYS.refreshToken, refreshToken);
    write(KEYS.user, JSON.stringify(user));
    return user;
  },

  saveUser(user) {
    write(KEYS.user, JSON.stringify(user));
  },

  clear() {
    Object.values(KEYS).forEach((key) => write(key, null));
  },
};
