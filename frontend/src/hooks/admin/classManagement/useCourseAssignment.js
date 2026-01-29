import { useState } from "react";
import { updateClassCourses } from "../../../services/class.service";
import { getCourses } from "../../../services/course.service";

/**
 * Custom hook for managing course assignment to classes
 */
export function useCourseAssignment(classes, setClasses, editingClass, setEditingClass) {
  const [assigningClass, setAssigningClass] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isCourseAssignDialogOpen, setIsCourseAssignDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Open course assignment dialog
   */
  const handleAssignCourses = async (classItem, availableCourses, setAvailableCourses) => {
    // If classItem has no id, treat as new-class assignment
    const isNew = !classItem || !classItem.id;
    const target = isNew
      ? { id: null, name: classItem?.name || 'New Class', courses: Array.isArray(selectedCourses) ? selectedCourses : [] }
      : classItem;
    
    setAssigningClass(target);
    setSelectedCourses(Array.isArray(target.courses) ? target.courses : []);
    
    try {
      const res = await getCourses();
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);
      setAvailableCourses(list);
      setIsCourseAssignDialogOpen(true);
    } catch (err) {
      console.debug('Failed to load courses list', err);
      throw new Error("Failed to load courses list");
    }
  };

  /**
   * Save course assignment
   */
  const handleSaveCourseAssignment = async () => {
    // If assigningClass has no id, we're in Add flow: just store selectedCourses and close dialog
    if (!assigningClass || !assigningClass.id) {
      setIsCourseAssignDialogOpen(false);
      setAssigningClass(null);
      return;
    }

    setLoading(true);
    try {
      await updateClassCourses(assigningClass.id, selectedCourses);
      // Update list and keep local selection in sync
      setClasses(prev => prev.map(c => 
        c.id === assigningClass.id ? { ...c, courses: selectedCourses } : c
      ));
      // If we're editing this class, reflect new courses
      if (editingClass && editingClass.id === assigningClass.id) {
        setEditingClass(prev => ({ ...prev, courses: selectedCourses }));
      }
      setIsCourseAssignDialogOpen(false);
      setAssigningClass(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to assign courses. Please try again.";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle course selection
   */
  const handleCourseToggle = (courseCode) => {
    setSelectedCourses(prev => 
      prev.includes(courseCode) 
        ? prev.filter(c => c !== courseCode) 
        : [...prev, courseCode]
    );
  };

  return {
    assigningClass,
    setAssigningClass,
    selectedCourses,
    setSelectedCourses,
    isCourseAssignDialogOpen,
    setIsCourseAssignDialogOpen,
    loading,
    handleAssignCourses,
    handleSaveCourseAssignment,
    handleCourseToggle,
  };
}
