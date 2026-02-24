import { useState } from "react";
import { createClass, upgradeClass, updateClass, deleteClass } from "../../../services/class.service";
import { createGroup, updateGroup, deleteGroup } from "../../../services/group.service";

const initialClassState = {
  name: "",
  specialization: "",
  term: "",
  year_level: "",
  academic_year: "",
  total_class: 1,
  courses: [],
  groups: [],
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
  if (!String(classData?.specialization || '').trim()) {
    return "Specialization is required";
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
  const [upgradingClass, setUpgradingClass] = useState(null);
  const [upgradeSourceId, setUpgradeSourceId] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  /**
   * Open upgrade dialog for a class (creates a NEW class record; original unchanged)
   */
  const handleOpenUpgradeClass = (classItem) => {
    if (!classItem?.id) return;
    setUpgradeSourceId(classItem.id);

    const specializationName = String(
      classItem?.specialization
      || classItem?.Specialization?.name
      || classItem?.specialization_name
      || classItem?.specializationName
      || ''
    ).trimStart();

    const sourceGroups = Array.isArray(classItem?.Groups)
      ? classItem.Groups
      : (Array.isArray(classItem?.groups) ? classItem.groups : []);

    // Remove ids so the form behaves like creating a new record
    const groups = sourceGroups
      .map((g) => ({
        name: g?.name,
        num_of_student: g?.num_of_student ?? '',
      }))
      .filter((g) => g?.name);

    setUpgradingClass({
      name: classItem?.name || '',
      specialization: specializationName,
      term: classItem?.term || '',
      year_level: classItem?.year_level || '',
      academic_year: classItem?.academic_year || '',
      total_class: classItem?.total_class ?? 1,
      courses: Array.isArray(classItem?.courses) ? classItem.courses : [],
      groups,
    });

    setIsUpgradeDialogOpen(true);
  };

  /**
   * Upgrade a class: create a NEW class record based on upgradingClass
   */
  const handleUpgradeClass = async (selectedCourses = []) => {
    if (!upgradeSourceId) throw new Error('Missing source class to upgrade');
    if (!upgradingClass) throw new Error('No upgrade data provided');

    const validationError = validateClassFields(upgradingClass);
    if (validationError) {
      throw new Error(validationError);
    }

    const specializationName = String(upgradingClass?.specialization || '').trim();
    if (!specializationName) {
      throw new Error('Specialization is required');
    }

    const parsedTotal = parseInt(upgradingClass?.total_class, 10);
    const totalGroups = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 0;
    const groups = Array.isArray(upgradingClass?.groups) ? upgradingClass.groups : [];

    if (totalGroups <= 0) {
      throw new Error('Total Groups must be a positive number');
    }
    if (groups.length !== totalGroups) {
      throw new Error('Please generate and fill all groups');
    }
    for (const g of groups) {
      const students = parseInt(g?.num_of_student, 10);
      if (!g?.name) throw new Error('Each group must have a name');
      if (!Number.isFinite(students) || students <= 0) {
        throw new Error('Each group must have a positive number of students');
      }
    }

    setLoading(true);
    try {
      const payload = { ...upgradingClass };
      payload.total_class = totalGroups || 1;
      payload.courses = selectedCourses;
      delete payload.groups;

      const res = await upgradeClass(upgradeSourceId, payload);
      const createdClass = res.data;

      let createdGroups = [];
      if (createdClass?.id) {
        const groupResults = await Promise.all(
          groups.map((g) =>
            createGroup({
              class_id: createdClass.id,
              name: g.name,
              num_of_student: parseInt(g.num_of_student, 10),
            })
          )
        );
        createdGroups = groupResults
          .map((r) => r?.data?.group)
          .filter(Boolean);
      }

      // Attach groups for immediate display
      const createdWithGroups = createdGroups.length
        ? { ...createdClass, Groups: createdGroups }
        : createdClass;

      setClasses(prev => [createdWithGroups, ...prev]);
      setIsUpgradeDialogOpen(false);
      setUpgradingClass(null);
      setUpgradeSourceId(null);
      return createdWithGroups;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to upgrade class. Please try again.";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new class
   */
  const handleAddClass = async (selectedCourses = []) => {
    const validationError = validateClassFields(newClass);
    if (validationError) {
      throw new Error(validationError);
    }

    // Require specialization + groups + student counts for new class
    const specializationName = String(newClass?.specialization || '').trim();
    if (!specializationName) {
      throw new Error('Specialization is required');
    }

    const parsedTotal = parseInt(newClass?.total_class, 10);
    const totalGroups = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 0;
    const groups = Array.isArray(newClass?.groups) ? newClass.groups : [];

    if (totalGroups <= 0) {
      throw new Error('Total Groups must be a positive number');
    }
    if (groups.length !== totalGroups) {
      throw new Error('Please generate and fill all groups');
    }
    for (const g of groups) {
      const students = parseInt(g?.num_of_student, 10);
      if (!g?.name) throw new Error('Each group must have a name');
      if (!Number.isFinite(students) || students <= 0) {
        throw new Error('Each group must have a positive number of students');
      }
    }

    setLoading(true);
    try {
      const payload = { ...newClass };
      payload.total_class = totalGroups || 1;
      payload.courses = selectedCourses;

      // groups are stored in a separate table; do not send in class payload
      delete payload.groups;

      const res = await createClass(payload);

      // Create groups after class is created
      const createdClass = res.data;
      if (createdClass?.id) {
        await Promise.all(
          groups.map((g) =>
            createGroup({
              class_id: createdClass.id,
              name: g.name,
              num_of_student: parseInt(g.num_of_student, 10),
            })
          )
        );
      }

      setClasses(prev => [...prev, createdClass]);
      setIsAddDialogOpen(false);
      setNewClass(initialClassState);
      return createdClass;
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

    // Validate groups + student counts (edit flow)
    const parsedTotal = parseInt(editingClass?.total_class, 10);
    const totalGroups = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 0;
    const groups = Array.isArray(editingClass?.groups) ? editingClass.groups : [];
    const originalGroups = Array.isArray(editingClass?._original_groups) ? editingClass._original_groups : [];

    if (totalGroups <= 0) {
      throw new Error('Total Groups must be a positive number');
    }
    if (groups.length !== totalGroups) {
      throw new Error('Please generate and fill all groups');
    }
    for (const g of groups) {
      const students = parseInt(g?.num_of_student, 10);
      if (!g?.name) throw new Error('Each group must have a name');
      if (!Number.isFinite(students) || students <= 0) {
        throw new Error('Each group must have a positive number of students');
      }
    }

    setLoading(true);
    try {
      const payload = { ...editingClass };
      payload.total_class = totalGroups || 1;
      payload.courses = selectedCourses;

      // groups are stored in a separate table; do not send in class payload
      delete payload.groups;
      delete payload._original_groups;

      const res = await updateClass(editingClass.id, payload);

      // Sync groups: update existing, create new, delete removed
      const nextIds = new Set(groups.map((g) => String(g?.id || '')).filter(Boolean));
      const removed = originalGroups.filter((g) => g?.id && !nextIds.has(String(g.id)));

      await Promise.all([
        ...groups.map((g) => {
          const body = {
            class_id: editingClass.id,
            name: g.name,
            num_of_student: parseInt(g.num_of_student, 10),
          };
          return g?.id ? updateGroup(g.id, body) : createGroup(body);
        }),
        ...removed.map((g) => deleteGroup(g.id)),
      ]);

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
    upgradingClass,
    setUpgradingClass,
    upgradeSourceId,
    setUpgradeSourceId,
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
    isUpgradeDialogOpen,
    setIsUpgradeDialogOpen,
    setIsConfirmDeleteOpen,
    // Actions
    handleAddClass,
    handleEditClass,
    handleOpenUpgradeClass,
    handleUpgradeClass,
    handleUpdateClass,
    handleDeleteClass,
    performDeleteClass,
  };
}
