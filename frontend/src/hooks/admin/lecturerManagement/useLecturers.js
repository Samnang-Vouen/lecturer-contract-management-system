import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listLecturers } from '../../../services/lecturer.service';
import { useAuthStore } from '../../../store/useAuthStore';

export function useLecturers() {
  const logout = useAuthStore((s) => s.logout);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [lecturers, setLecturers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQueryState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilterState] = useState(() => (searchParams.get('status') || '').trim());
  const [departmentFilter, setDepartmentFilterState] = useState(() => (searchParams.get('department') || '').trim());
  
  const [page, setPage] = useState(() => Math.max(parseInt(searchParams.get('page')) || 1, 1));
  const [limit, setLimit] = useState(() => Math.min(Math.max(parseInt(searchParams.get('limit')) || 10, 1), 100));
  const [totalPages, setTotalPages] = useState(1);
  const [totalLecturers, setTotalLecturers] = useState(0);

  const fetchLecturersRef = useRef(null);
  const requestSeqRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const lastRequestKeyRef = useRef('');
  const inFlightKeyRef = useRef('');

  // Public setters that reset pagination in the same batch (prevents double-fetch / flicker)
  const setStatusFilter = useCallback((next) => {
    setStatusFilterState(next);
    setPage(1);
  }, []);

  const setDepartmentFilter = useCallback((next) => {
    setDepartmentFilterState(next);
    setPage(1);
  }, []);

  const setSearchQuery = useCallback((next) => {
    setSearchQueryState(next);
    // page reset is handled when the debounced value commits
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchQuery.trim();
      setDebouncedSearch(next);
      // Reset page only when the debounced search value updates.
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync URL params
  useEffect(() => {
    const normalize = (sp) =>
      Array.from(sp.entries())
        .filter(([k]) => k !== 'role')
        .sort(([ak, av], [bk, bv]) => ak.localeCompare(bk) || String(av).localeCompare(String(bv)))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');

    const knownKeys = new Set(['page', 'limit', 'position', 'status', 'department', 'role']);

    // Build canonical params in a stable order so the URL string doesn't "flip"
    // between equivalent representations.
    const nextParams = new URLSearchParams();

    // Desired order: page, limit, status, department
    nextParams.set('page', String(page));
    nextParams.set('limit', String(limit));
    if (statusFilter) nextParams.set('status', statusFilter);
    if (departmentFilter) nextParams.set('department', departmentFilter);

    // Preserve any unknown params (append in sorted order for stability)
    const unknown = [];
    for (const [k, v] of Array.from(searchParams.entries())) {
      if (!knownKeys.has(k)) unknown.push([k, v]);
    }
    unknown
      .sort(([ak, av], [bk, bv]) => ak.localeCompare(bk) || String(av).localeCompare(String(bv)))
      .forEach(([k, v]) => nextParams.append(k, v));

    if (normalize(searchParams) !== normalize(nextParams)) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [page, limit, statusFilter, departmentFilter, searchParams, setSearchParams]);

  // React to manual URL changes
  useEffect(() => {
    const urlPage = Math.max(parseInt(searchParams.get('page')) || 1, 1);
    const urlLimit = Math.min(Math.max(parseInt(searchParams.get('limit')) || limit, 1), 100);
    const urlStatus = (searchParams.get('status') || '').trim();
    const urlDepartment = (searchParams.get('department') || '').trim();
    
    if (urlPage !== page) setPage(urlPage);
    if (urlLimit !== limit) setLimit(urlLimit);
    // Use the *state* setters here so browser URL navigation preserves URL page.
    if (urlStatus !== statusFilter) setStatusFilterState(urlStatus);
    if (urlDepartment !== departmentFilter) setDepartmentFilterState(urlDepartment);
  }, [searchParams, page, limit, statusFilter, departmentFilter]);

  // Fetch lecturers
  useEffect(() => {
    const fetchLecturers = async (options = {}) => {
      const { force = false } = options;
      let requestKey = '';
      let seq = 0;
      try {
        const params = { page, limit };
        
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter) params.status = statusFilter;
        if (departmentFilter) params.department = departmentFilter;

        // De-dupe identical requests to avoid rapid repeated calls caused by
        // re-renders / URL sync / StrictMode double-invocation in dev.
        requestKey = JSON.stringify(params);
        if (!force) {
          if (inFlightKeyRef.current === requestKey) return;
          if (lastRequestKeyRef.current === requestKey) return;
        }

        seq = ++requestSeqRef.current;
        inFlightKeyRef.current = requestKey;

        if (!hasLoadedOnceRef.current) setIsLoading(true);
        else setIsUpdating(true);
        
        const payload = await listLecturers(params);
        if (seq !== requestSeqRef.current) return;
        const list = Array.isArray(payload) ? payload : payload.data;
        
        // Normalize lecturer data
        const normalized = list.map(l => ({
          id: l.id || l.userId || l.lecturerProfileId,
          name: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || (l.email ? l.email.split('@')[0] : '').replace(/\./g, ' '),
          email: l.email,
          role: l.role,
          roles: Array.isArray(l.roles)
            ? l.roles
            : Array.isArray(l.Roles)
              ? l.Roles
              : [],
          status: l.status || 'active',
          lastLogin: l.lastLogin || 'Never',
          department: l.department || '',
          coursesCount: l.coursesCount || 0,
          position: l.position || 'Lecturer',
          researchFields: l.researchFields || l.specializations || [],
          specializations: l.specializations || [],
          courses: l.courses || l.assignedCourses || []
        }));
        
        setLecturers(normalized);
        hasLoadedOnceRef.current = true;
        lastRequestKeyRef.current = requestKey;
        
        if (payload.meta) {
          setTotalPages(payload.meta.totalPages);
          setTotalLecturers(payload.meta.total);
          if (page > payload.meta.totalPages && payload.meta.totalPages > 0) {
            setPage(payload.meta.totalPages);
          }
        } else {
          setTotalPages(1);
          setTotalLecturers(normalized.length);
        }
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        console.error('Failed to fetch lecturers', err);
        if (err.response?.status === 401) {
          logout();
          return;
        }
        setLecturers([]);
        hasLoadedOnceRef.current = true;
        // Mark this request key as completed even on error to avoid hammering.
        // A user action (filter/search/page) will still change the key.
        // Manual refresh can bypass via force=true.
        if (requestKey) lastRequestKeyRef.current = requestKey;
      } finally {
        if (inFlightKeyRef.current === requestKey) inFlightKeyRef.current = '';
        if (seq === requestSeqRef.current) {
          setIsLoading(false);
          setIsUpdating(false);
        }
      }
    };
    
    fetchLecturersRef.current = fetchLecturers;
    fetchLecturers();
  }, [logout, page, limit, debouncedSearch, statusFilter, departmentFilter]);


  return {
    lecturers,
    setLecturers,
    isLoading,
    isUpdating,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    totalLecturers,
    refreshLecturers: useCallback(() => fetchLecturersRef.current?.({ force: true }), [])
  };
}
