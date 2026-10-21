import { describe, expect, it } from 'vitest';
import { addHours, formatTime, nextQuarterHour, parseLocalInput, toLocalInputValue } from './datetime';
import { canUseBay, defaultVehicleFor, PLATE_PATTERN } from './vehicles';
import { pendingBooking } from './pendingBooking';

describe('datetime', () => {
  it('formats using LOCAL fields, never UTC', () => {
    // 10:30 local must stay 10:30 whatever the machine's offset from UTC is
    const d = new Date(2026, 5, 12, 10, 30);
    expect(toLocalInputValue(d)).toBe('2026-06-12T10:30');
  });

  it('adds hours across midnight', () => {
    expect(addHours('2026-06-12T23:00', 2)).toBe('2026-06-13T01:00');
  });

  it('returns null instead of throwing for an empty or invalid value', () => {
    expect(addHours('', 2)).toBeNull();
    expect(addHours('not-a-date', 2)).toBeNull();
    expect(parseLocalInput('')).toBeNull();
    expect(formatTime('')).toBe('—');
  });

  it('rounds up to the next quarter hour, never into the past', () => {
    const from = new Date(2026, 5, 12, 10, 7, 30);
    expect(nextQuarterHour(from)).toBe('2026-06-12T10:15');
    const exactly = new Date(2026, 5, 12, 10, 15, 0);
    expect(nextQuarterHour(exactly)).toBe('2026-06-12T10:30');
  });
});

describe('vehicle and bay compatibility', () => {
  it('matches the server-side matrix', () => {
    expect(canUseBay('BIKE', 'BIKE')).toBe(true);
    expect(canUseBay('BIKE', 'CAR')).toBe(false);
    expect(canUseBay('CAR', 'CAR')).toBe(true);
    expect(canUseBay('CAR', 'ACCESSIBLE')).toBe(true);
    expect(canUseBay('CAR', 'EV')).toBe(false);
    expect(canUseBay('EV', 'EV')).toBe(true);
    expect(canUseBay('EV', 'CAR')).toBe(true);
  });

  it('pre-selects a sensible vehicle for a bay', () => {
    expect(defaultVehicleFor('EV')).toBe('EV');
    expect(defaultVehicleFor('BIKE')).toBe('BIKE');
    expect(defaultVehicleFor('ACCESSIBLE')).toBe('CAR');
  });

  it('accepts common Indian plates and rejects junk', () => {
    ['KA05MJ4040', 'KA-05-MJ-4040', 'MH12AB1234', '22BH1234AA'].forEach((p) => expect(PLATE_PATTERN.test(p)).toBe(true));
    ['', '1234', 'HELLO WORLD', 'K'].forEach((p) => expect(PLATE_PATTERN.test(p)).toBe(false));
  });
});

describe('pendingBooking store', () => {
  it('round-trips and survives corrupted storage', () => {
    pendingBooking.set({ slotId: 3 });
    expect(pendingBooking.get()).toEqual({ slotId: 3 });
    sessionStorage.setItem('pending_booking', '{not json');
    expect(pendingBooking.get()).toBeNull();
    pendingBooking.clear();
    expect(pendingBooking.get()).toBeNull();
  });
});
