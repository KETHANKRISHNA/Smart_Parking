import { useEffect } from 'react';

/** Sets the browser tab / history title for a page, e.g. "My bookings · SmartPark". */
export const usePageTitle = (title) => {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · SmartPark` : 'SmartPark: Smart Parking Management System';
    return () => {
      document.title = previous;
    };
  }, [title]);
};
