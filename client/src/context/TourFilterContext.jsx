import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getTours } from '../services/tour.service';

// Sort value map: frontend dropdown value → backend Mongoose sort string
const SORT_MAP = {
  price_asc: 'price',
  price_desc: '-price',
  rating: '-ratingAverage',
  newest: '-createdAt',
};

const INITIAL_FILTERS = {
  search: '',
  location: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  rating: '',
  date: '',
  minSlots: 1,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 12,
  nearLat: null,
  nearLng: null,
  radiusKm: 50
};

export const TourFilterContext = createContext(null);

export const TourFilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [allTours, setAllTours] = useState([]); // raw from backend
  const [tours, setTours] = useState([]); // after client-side category filter
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          // Handle sort logic binding cleanly dynamically locally
          if (key === 'sortBy') {
            params.append('sort', (filters.sortOrder === 'desc' ? '-' : '') + val);
          } else if (key !== 'sortOrder') {
            params.append(key, val);
          }
        }
      });
      // But actually, we pass an object to getTours, and it handles URLSearchParams!
      // Let's pass the raw filters object mapped cleanly removing blanks.
      const queryParams = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          if (key === 'sortBy') {
             queryParams.sort = (filters.sortOrder === 'desc' ? '-' : '') + val;
          } else if (key !== 'sortOrder') {
             queryParams[key] = val;
          }
        }
      });

      const response = await getTours(queryParams, { requiresAuth: false });

      // FIX 1: correct response shape — backend wraps in data.data.tours + pagination
      const rawTours = response?.data?.tours ?? [];
      const totalCount = response?.pagination?.total ?? rawTours.length;

      // const totalCount = response?.pagination?.total ?? rawTours.length;

      setAllTours(rawTours);
      setTours(rawTours);
      setTotal(totalCount);
    } catch (err) {
      console.error('Failed to fetch tours:', err);
      setError(err.message || 'Error loading tours');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const setFilter = (key, value) => {
    setFilters(prev => {
      const isPaginationKey = key === 'page' || key === 'limit';
      return {
        ...prev,
        [key]: value,
        ...(!isPaginationKey && { page: 1 })
      };
    });
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <TourFilterContext.Provider value={{
      filters,
      tours,
      total,
      loading,
      error,
      setFilter,
      resetFilters,
      fetchTours
    }}>
      {children}
    </TourFilterContext.Provider>
  );
};
