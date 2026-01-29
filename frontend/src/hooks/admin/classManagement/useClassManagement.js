import { useState } from "react";
import { createClass, updateClass, deleteClass } from "../../../services/class.service";

const initialClassState = {
  name: "",
  term: "",
  year_level: "",
  academic_year: "",
  total_class: 1,
  courses: [],
};

/**
 * Validates academic year format and logic
 */
export function validateAcademicYear(academicYear) {
  // Check format YYYY-YYYY
  const academicYearPattern = /^\d{4}-\d{4}$/;
  if (!academicYearPattern.test(academicYear)) {
    return "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)";
  }

  // Validate that academic year makes sense
  const [startYear, endYear] = academicYear.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return "Academic year end year must be exactly one year after start year";
  }

  // Check if year is reasonable (not too far in past or future)
  const currentYear = new Date().getFullYear();
  if (startYear < currentYear - 10 || startYear > currentYear + 10) {
    return "Academic year must be within a reasonable range";
  }

  return null; // No error
}

/**
 * Validates required class fields
 */
export function validateClassFields(classData) {
  if (!classData.name.trim()) {
    return "Class name is required";
  }
  if (!classData.term.trim()) {
    return "Term is required";
  }
  if (!classData.year_level.trim()) {
    return "Year level is required";
  }
  
  const academicYearError = validateAcademicYear(classData.academic_year);
  if (academicYearError) {
    return academicYearError;
  }
  
  return null;
}

/**
 * Custom hook for managing class CRUD operations
 */
export function useClassManagement(classes, setClasses) {
  const [newClass, setNewClass] = useState(initialClassState);
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  /**
   * Add a new class
   */
  const handleAddClass = async (selectedCourses = []) => {
    const validationError = validateClassFields(newClass);
    if (validationError) {
      throw new Error(validationError);
    }

    setLoading(true);
    try {
      const payload = { ...newClass };
      const parsedTotal = parseInt(payload.total_class, 10);
      payload.total_class = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 1;
      payload.courses = selectedCourses;

      const res = await createClass(payload);
      setClasses(prev => [...prev, res.data]);
      setIsAddDialogOpen(false);
      setNewClass(initialClassState);
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to add class. Please try again.";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open edit dialog for a class
   */
  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setIsEditDialogOpen(true);
  };

  /**
   * Update an existing class
   */
  const handleUpdateClass = async (selectedCourses = []) => {
    const validationError = validateClassFields(editingClass);
    if (validationError) {
      throw new Error(validationError);
    }

    setLoading(true);
    try {
      const payload = { ...editingClass };
      const parsedTotal = parseInt(payload.total_class, 10);
      payload.total_class = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 1;
      payload.courses = selectedCourses;

      const res = await updateClass(editingClass.id, payload);
      setClasses(prev => prev.map(c => c.id === editingClass.id ? res.data : c));
      setIsEditDialogOpen(false);
      setEditingClass(null);
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update class. Please try again.";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClass = (classOrId) => {
    const cls = typeof classOrId === 'object' && classOrId !== null
      ? classOrId
      : classes.find(c => String(c.id) === String(classOrId));
    if (!cls) return;
    setClassToDelete(cls);
    setIsConfirmDeleteOpen(true);
  };

  /**
   * Perform delete after confirmation
   */
  const performDeleteClass = async () => {
    if (!classToDelete) return;
    setDeleting(true);
    try {
      await deleteClass(classToDelete.id);
      setClasses(prev => prev.filter(c => c.id !== classToDelete.id));
      setIsConfirmDeleteOpen(false);
      setClassToDelete(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete class. Please try again.";
      throw new Error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return {
    // States
    newClass,
    setNewClass,
    editingClass,
    setEditingClass,
    classToDelete,
    setClassToDelete,
    loading,
    deleting,
    initialClassState,
    // Dialog states
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    // Actions
    handleAddClass,
    handleEditClass,
    handleUpdateClass,
    handleDeleteClass,
    performDeleteClass,
  };
}
