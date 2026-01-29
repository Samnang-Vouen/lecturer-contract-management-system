import { useState, useMemo } from 'react';

export function useCourseFilters(courses) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('code'); // 'code' | 'name'
  const [hoursFilter, setHoursFilter] = useState(''); // '', '15', '30', '45', '90'

  const filteredCourses = useMemo(() => {
    const base = courses.filter(c => {
      if (!search.trim()) return true;
      const term = search.trim().toLowerCase();
      return (
        (c.course_code || '').toLowerCase().includes(term) ||
        (c.course_name || '').toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term)
      );
    });
    
    const sorted = [...base].sort((a, b) => {
      if (sortBy === 'name') {
        return String(a.course_name || '').localeCompare(String(b.course_name || ''));
      }
      return String(a.course_code || '').localeCompare(String(b.course_code || ''));
    });
    
    if (!hoursFilter) return sorted;
    
    const allowed = hoursFilter.split(',').map(s => s.trim());
    return sorted.filter(c => allowed.includes(String(c.hours ?? '')));
  }, [courses, search, sortBy, hoursFilter]);

  return {
    search,
    setSearch,
    sortBy,
    setSortBy,
    hoursFilter,
    setHoursFilter,
    filteredCourses
  };
}
