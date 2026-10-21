// The booking the user is about to confirm, kept in sessionStorage between the details and confirm pages.
const KEY = 'pending_booking';

export const pendingBooking = {
  get() {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* storage unavailable: the confirm page will send the user back */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
