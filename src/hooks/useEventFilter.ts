import { useState, useMemo, useCallback } from 'react';
import { EventData, EventCategory } from '@/types/event';

interface UseEventFilterReturn {
  search: string;
  setSearch: (s: string) => void;
  category: EventCategory | 'All';
  setCategory: (c: EventCategory | 'All') => void;
  dateRange: { from: string; to: string };
  setDateRange: (r: { from: string; to: string }) => void;
  filtered: EventData[];
  reset: () => void;
}

export function useEventFilter(events: EventData[]): UseEventFilterReturn {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<EventCategory | 'All'>('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch = !search || 
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(search.toLowerCase());
      
      const matchCategory = category === 'All' || e.category === category;
      
      let matchDate = true;
      if (dateRange.from) matchDate = matchDate && e.date >= dateRange.from;
      if (dateRange.to) matchDate = matchDate && e.date <= dateRange.to;

      return matchSearch && matchCategory && matchDate;
    });
  }, [events, search, category, dateRange]);

  const reset = useCallback(() => {
    setSearch('');
    setCategory('All');
    setDateRange({ from: '', to: '' });
  }, []);

  return { search, setSearch, category, setCategory, dateRange, setDateRange, filtered, reset };
}
