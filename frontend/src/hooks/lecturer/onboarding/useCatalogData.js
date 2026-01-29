import { useState, useEffect, useMemo } from 'react';
import { getDepartments, getCatalogCourses } from '../../../services/catalog.service';
import toast from 'react-hot-toast';

/**
 * Hook to fetch and manage department and course catalog data
 */
export const useCatalogData = () => {
  const [departmentsCatalog, setDepartmentsCatalog] = useState([]);
  const [coursesCatalog, setCoursesCatalog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    const fetchCatalogs = async () => {
      setLoading(true);
      try {
        const [deptRes, courseRes] = await Promise.all([
          getDepartments(),
          getCatalogCourses()
        ]);
        
        if (!cancelled) {
          setDepartmentsCatalog(Array.isArray(deptRes) ? deptRes : (deptRes?.departments || []));
          setCoursesCatalog(Array.isArray(courseRes) ? courseRes : (courseRes?.courses || []));
        }
      } catch (e) {
        if (!cancelled) {
          toast.error('Failed to load catalogs');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCatalogs();
    
    return () => { cancelled = true; };
  }, []);

  /**
   * Get available course names based on selected departments
   */
  const getAvailableCourses = (selectedDepartments) => {
    if (!selectedDepartments.length) return [];
    
    const deptIds = new Set(
      departmentsCatalog
        .filter(d => selectedDepartments.includes(d.dept_name))
        .map(d => d.id)
    );
    
    return coursesCatalog
      .filter(c => deptIds.has(c.dept_id))
      .map(c => c.course_name)
      .sort();
  };

  /**
   * Get course IDs for selected course names
   */
  const getCourseIds = (selectedCourseNames) => {
    return coursesCatalog
      .filter(c => selectedCourseNames.includes(c.course_name))
      .map(c => c.id);
  };

  return {
    departmentsCatalog,
    coursesCatalog,
    loading,
    getAvailableCourses,
    getCourseIds
  };
};
