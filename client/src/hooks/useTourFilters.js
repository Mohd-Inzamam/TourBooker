import { useContext } from 'react';
import { TourFilterContext } from '../context/TourFilterContext';

export const useTourFilters = () => {
  const context = useContext(TourFilterContext);
  if (!context) {
    throw new Error('useTourFilters must be used within a TourFilterProvider');
  }
  return context;
};
