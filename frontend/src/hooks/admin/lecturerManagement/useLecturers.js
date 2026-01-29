import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listLecturers } from '../../../services/lecturer.service';
import { useAuthStore } from '../../../store/useAuthStore';

export function useLecturers() {
  const { logout } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [lecturers, setLecturers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  const [page, setPage] = useState(() => Math.max(parseInt(searchParams.get('page')) || 1, 1));
  const [limit, setLimit] = useState(() => Math.min(Math.max(parseInt(searchParams.get('limit')) || 10, 1), 100));
  const [totalPages, setTotalPages] = useState(1);
  const [totalLecturers, setTotalLecturers] = useState(0);

  const fetchLecturersRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    
    if (params.get('page') !== String(page)) {
      params.set('page', String(page));
      changed = true;
    }
    if (params.get('limit') !== String(limit)) {
      params.set('limit', String(limit));
      changed = true;
    }
    if (statusFilter) {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }
    if (departmentFilter) {
      params.set('department', departmentFilter);
    } else {
      params.delete('department');
    }
    
    if (changed) setSearchParams(params, { replace: true });
  }, [page, limit, statusFilter, departmentFilter, searchParams, setSearchParams]);

  // React to manual URL changes
  useEffect(() => {
    const urlPage = Math.max(parseInt(searchParams.get('page')) || 1, 1);
    const urlLimit = Math.min(Math.max(parseInt(searchParams.get('limit')) || limit, 1), 100);
    
    if (urlPage !== page) setPage(urlPage);
    if (urlLimit !== limit) setLimit(urlLimit);
  }, [searchParams]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, departmentFilter]);

  // Fetch lecturers
  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        setIsLoading(true);
        const params = { page, limit };
        
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter) params.status = statusFilter;
        if (departmentFilter) params.department = departmentFilter;
        
        const payload = await listLecturers(params);
        const list = Array.isArray(payload) ? payload : payload.data;
        
        // Normalize lecturer data
        const normalized = list.map(l => ({
          id: l.id || l.userId || l.lecturerProfileId,
          name: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || (l.email ? l.email.split('@')[0] : '').replace(/\./g, ' '),
          email: l.email,
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
        console.error('Failed to fetch lecturers', err);
        if (err.response?.status === 401) {
          logout();
          return;
        }
        setLecturers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLecturersRef.current = fetchLecturers;
    fetchLecturers();
  }, [logout, page, limit, debouncedSearch, statusFilter, departmentFilter]);

  return {
    lecturers,
    setLecturers,
    isLoading,
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
    refreshLecturers: fetchLecturersRef
  };
}
