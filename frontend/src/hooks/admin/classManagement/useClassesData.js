import { useState, useEffect, useRef, useCallback } from "react";
import { getClasses } from "../../../services/class.service";
import { getCourses } from "../../../services/course.service";

/**
 * Custom hook for managing classes data with infinite scroll and filtering
 */
export function useClassesData() {
  const [classes, setClasses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = 10;
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const loadClasses = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    if (reset) {
      setPage(1);
      setHasMore(true);
      setClasses([]);
    }
    
    setLoading(true);
    
    try {
      const targetPage = reset ? 1 : page;
      const res = await getClasses(targetPage, limit);
      const payload = res.data;
      
      if (Array.isArray(payload)) {
        // legacy non-paginated shape
        setClasses(payload);
        setHasMore(false);
      } else {
        setClasses(prev => reset ? payload.data : [...prev, ...payload.data]);
        setHasMore(payload.hasMore);
      }
    } catch (error) {
      throw new Error("Failed to load classes. Please try again.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, limit]);

  const loadCourses = useCallback(async () => {
    try {
      const res = await getCourses();
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);
      setAvailableCourses(list);
    } catch (error) {
      console.warn('Failed to load courses list');
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadClasses(true);
  }, []);

  // Load more on page change
  useEffect(() => {
    if (page > 1) loadClasses();
  }, [page]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(entries => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        setPage(p => p + 1);
      }
    }, { threshold: 1 });
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  // Load courses
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Filtering logic
  const getUniqueAcademicYears = useCallback(() => {
    const years = [...new Set(classes.map(c => c.academic_year))].filter(year => {
      const academicYearPattern = /^\d{4}-\d{4}$/;
      return academicYearPattern.test(year);
    });
    return years.sort();
  }, [classes]);

  const getFilteredClasses = useCallback(() => {
    if (selectedAcademicYear === "all") return classes;
    return classes.filter(c => c.academic_year === selectedAcademicYear);
  }, [classes, selectedAcademicYear]);

  return {
    classes,
    setClasses,
    availableCourses,
    setAvailableCourses,
    loading,
    selectedAcademicYear,
    setSelectedAcademicYear,
    hasMore,
    sentinelRef,
    loadClasses,
    loadCourses,
    getUniqueAcademicYears,
    getFilteredClasses,
  };
}
