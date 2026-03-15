import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateLecturerCourses } from '../../../services/lecturer.service';
import { updateAdvisorCourses } from '../../../services/advisor.service';
import { getCatalogCourses } from '../../../services/catalog.service';

const isAdvisorOnly = (target) => {
  const toToken = (r) => {
    if (r === null || r === undefined) return '';
    if (typeof r === 'string' || typeof r === 'number') return String(r);
    if (typeof r === 'object') return r.role ?? r.name ?? r.code ?? r.type ?? r.value ?? '';
    return String(r);
  };

  const rawValues = [target?.role, target?.roles, target?.user?.role, target?.user?.roles];
  const flattened = [];
  for (const v of rawValues) {
    if (!v) continue;
    if (Array.isArray(v)) for (const item of v) flattened.push(toToken(item));
    else flattened.push(toToken(v));
  }
  const tokens = flattened
    .flatMap((s) => String(s ?? '').split(','))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const hasAdvisorRole = tokens.some((t) => t === 'advisor' || t.includes('advisor'));
  const hasLecturerRole = tokens.some((t) => t === 'lecturer' || t === 'lecture' || t.includes('lectur'));
  if (hasLecturerRole) return false;
  if (hasAdvisorRole) return true;

  const positionLc = String(target?.position || '').trim().toLowerCase();
  return positionLc === 'advisor';
};

export function useCourseAssignment(setLecturers) {
  const [assigning, setAssigning] = useState(null);
  const [coursesCatalog, setCoursesCatalog] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const loadCatalog = async () => {
    if (coursesCatalog.length > 0) return;
    
    try {
      const all = await getCatalogCourses();
      setCoursesCatalog(all);
    } catch (e) {
      console.error('Failed to load courses catalog', e);
      toast.error('Failed to load courses');
    }
  };

  const openAssignment = async (lecturer, lecturerDetail) => {
    try {
      setAssigning(lecturer);
      setAssignLoading(true);
      
      // Load catalog if not already loaded
      await loadCatalog();
      
      // Set selected courses from detail
      setSelectedCourses(lecturerDetail?.courses?.map(c => c.course_code).filter(Boolean) || []);
    } catch (e) {
      toast.error('Failed to open course assignment');
      console.error(e);
      setAssigning(null);
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleCourseSelection = (course_code) => {
    setSelectedCourses(prev => 
      prev.includes(course_code) 
        ? prev.filter(c => c !== course_code)
        : [...prev, course_code]
    );
  };

  const saveAssignment = async () => {
    if (!assigning) return;
    
    try {
      // Map course codes to IDs
      const map = new Map(coursesCatalog.map(c => [c.course_code, c.id]));
      const course_ids = selectedCourses.map(code => map.get(code)).filter(Boolean);
      
      setAssignLoading(true);
      const updater = isAdvisorOnly(assigning) ? updateAdvisorCourses : updateLecturerCourses;
      await updater(assigning.id, course_ids);
      
      toast.success('Courses updated');
      
      // Update lecturer in table
      setLecturers(prev => prev.map(l => 
        l.id === assigning.id 
          ? { ...l, coursesCount: selectedCourses.length }
          : l
      ));
      
      setAssigning(null);
      return true;
    } catch (e) {
      toast.error('Update failed');
      console.error(e);
      return false;
    } finally {
      setAssignLoading(false);
    }
  };

  const cancelAssignment = () => {
    setAssigning(null);
    setSelectedCourses([]);
  };

  return {
    assigning,
    coursesCatalog,
    selectedCourses,
    assignLoading,
    openAssignment,
    toggleCourseSelection,
    saveAssignment,
    cancelAssignment
  };
}
