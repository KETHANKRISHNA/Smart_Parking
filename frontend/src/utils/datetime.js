// Booking times are zone-less "wall clock" strings (YYYY-MM-DDTHH:mm) in the facility's local time.
// Never go through toISOString() for them: that converts to UTC and shifts the time by the user's offset.

const pad = (n) => String(n).padStart(2, '0');

/** Date -> "YYYY-MM-DDTHH:mm" using the date's LOCAL fields (the format <input type="datetime-local"> uses). */
export const toLocalInputValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** Parses a "YYYY-MM-DDTHH:mm" string as local time. Returns null when empty or invalid. */
export const parseLocalInput = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Next quarter-hour at or after now, as a datetime-local value. */
export const nextQuarterHour = (from = new Date()) => {
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15);
  return toLocalInputValue(d);
};

/** Adds hours to a datetime-local value. Returns null if the input is not a valid date. */
export const addHours = (value, hours) => {
  const start = parseLocalInput(value);
  return start ? toLocalInputValue(new Date(start.getTime() + hours * 3600 * 1000)) : null;
};

/** "10:30 AM" for a datetime string from the API or an input. */
export const formatTime = (value) => {
  const d = parseLocalInput(value);
  return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
};

/** "12 Jun 2026, 10:30 AM" */
export const formatDateTime = (value) => {
  const d = parseLocalInput(value);
  return d ? d.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
};
