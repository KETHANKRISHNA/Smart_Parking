import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * The facilities a manager (or admin) can operate, plus the one currently selected.
 * Managers with a single facility never see a picker; unassigned managers get an empty list.
 */
export const useManagerFacility = () => {
  const [facilities, setFacilities] = useState([]);
  const [locationId, setLocationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/manager/facilities')
      .then((res) => {
        if (cancelled || !res.success) return;
        setFacilities(res.data);
        setLocationId((current) => current ?? res.data[0]?.id ?? null);
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load your facilities'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const facility = facilities.find((f) => f.id === locationId) || null;
  return { facilities, facility, locationId, setLocationId, loading, error };
};
