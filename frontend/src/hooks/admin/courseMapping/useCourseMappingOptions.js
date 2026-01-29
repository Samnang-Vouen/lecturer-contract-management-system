import { useMemo } from 'react';

export function useCourseMappingOptions(classes, mappings) {
  const academicYearOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach(c => {
      if (c.academic_year) set.add(String(c.academic_year));
    });
    (Array.isArray(mappings) ? mappings : []).forEach(m => {
      if (m.academic_year) set.add(String(m.academic_year));
    });
    return Array.from(set).sort();
  }, [classes, mappings]);

  const termOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach(c => {
      if (c.term) set.add(String(c.term));
    });
    (Array.isArray(mappings) ? mappings : []).forEach(m => {
      if (m.term) set.add(String(m.term));
    });
    return Array.from(set).sort();
  }, [classes, mappings]);

  const statusOptions = ['Pending', 'Contacting', 'Accepted', 'Rejected'];

  return {
    academicYearOptions,
    termOptions,
    statusOptions
  };
}
