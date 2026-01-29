import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateLecturerCourses } from '../../../services/lecturer.service';
import { getCatalogCourses } from '../../../services/catalog.service';

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
      await updateLecturerCourses(assigning.id, course_ids);
      
      toast.success('Courses updated');
      
      // Update lecturer in table
      setLecturers(prev => prev.map(l => 
        l.id === assigning.id 
          ? { ...l, coursesCount: selectedCourses.length }
          : l
      ));
      
      setAssigning(null);
    } catch (e) {
      toast.error('Update failed');
      console.error(e);
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
