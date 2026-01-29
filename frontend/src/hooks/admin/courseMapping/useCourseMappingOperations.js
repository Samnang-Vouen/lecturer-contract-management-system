import { useState } from 'react';
import { createCourseMapping, updateCourseMapping, deleteCourseMapping } from '../../../services/courseMapping.service.js';

export function useCourseMappingOperations(reloadData) {
  const [deleting, setDeleting] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');

  const validateDualSelection = (theorySelected, theoryHour, theoryGroups, labSelected, labGroups) => {
    const thG = parseInt(String(theoryGroups), 10);
    const lbG = parseInt(String(labGroups), 10);
    const thHourValid = theoryHour === '15h' || theoryHour === '30h';
    const theoryEffective = theorySelected && Number.isFinite(thG) && thG >= 1 && thHourValid;
    const labEffective = labSelected && Number.isFinite(lbG) && lbG >= 1;

    if (!theoryEffective && !labEffective) {
      return { valid: false, error: 'Teaching Type is required: select Theory and/or Lab with valid groups.' };
    }

    let thGroups = 0, thHours = null, lbGroups = 0, lbHours = null;
    if (theoryEffective) {
      thGroups = thG;
      thHours = theoryHour;
    }
    if (labEffective) {
      lbGroups = lbG;
      lbHours = '30h';
    }

    return { valid: true, thGroups, thHours, lbGroups, lbHours };
  };

  const submitAdd = async (
    form,
    theorySelectedAdd,
    theoryHourAdd,
    theoryGroupsAdd,
    theoryCombineAdd,
    labSelectedAdd,
    labGroupsAdd
  ) => {
    try {
      // Validate required fields
      const requiredErrors = [];
      if (!form.academic_year) requiredErrors.push('Academic Year');
      if (!form.year_level) requiredErrors.push('Year Level');
      if (!form.term) requiredErrors.push('Term');
      if (!form.class_id) requiredErrors.push('Class');
      if (!form.course_id) requiredErrors.push('Course');
      if (!form.lecturer_profile_id) requiredErrors.push('Lecturer');
      if (!form.availability) requiredErrors.push('Availability');

      if (requiredErrors.length) {
        setAddError(`Please fill in/select: ${requiredErrors.join(', ')}.`);
        return false;
      }

      // Validate dual selections
      const validation = validateDualSelection(
        theorySelectedAdd,
        theoryHourAdd,
        theoryGroupsAdd,
        labSelectedAdd,
        labGroupsAdd
      );

      if (!validation.valid) {
        setAddError(validation.error);
        return false;
      }

      const { thGroups, thHours, lbGroups, lbHours } = validation;

      const payload = {
        ...form,
        type_hours: (thHours === '15h') ? 'Theory (15h)' : (lbHours ? 'Lab (30h)' : 'Theory (15h)'),
        group_count: thGroups || lbGroups || 1,
        theory_hours: thHours,
        theory_groups: thGroups,
        theory_15h_combined: (thHours === '15h') ? !!theoryCombineAdd : false,
        theory_combined: ((thHours === '15h' || thHours === '30h') && thGroups > 1) ? !!theoryCombineAdd : false,
        lab_hours: lbHours,
        lab_groups: lbGroups,
        course_id: form.course_id ? parseInt(form.course_id, 10) : '',
        comment: (form.comment || '').slice(0, 160),
        contacted_by: form.contactedBy || form.contacted_by || ''
      };

      delete payload.contactedBy;

      if (!payload.academic_year || !payload.year_level || !payload.term || !payload.class_id || !payload.course_id) {
        return false;
      }

      await createCourseMapping(payload);
      await reloadData();
      setAddError('');
      return true;
    } catch (e) {
      setAddError(e.response?.data?.message || e.message);
      return false;
    }
  };

  const submitEdit = async (
    editing,
    form,
    theorySelectedEdit,
    theoryHourEdit,
    theoryGroupsEdit,
    theoryCombineEdit,
    labSelectedEdit,
    labGroupsEdit
  ) => {
    if (!editing) return false;

    try {
      // Validate dual selections
      const validation = validateDualSelection(
        theorySelectedEdit,
        theoryHourEdit,
        theoryGroupsEdit,
        labSelectedEdit,
        labGroupsEdit
      );

      if (!validation.valid) {
        setEditError(validation.error);
        return false;
      }

      const { thGroups, thHours, lbGroups, lbHours } = validation;

      const payload = {};
      ['lecturer_profile_id', 'availability', 'status', 'contacted_by', 'comment'].forEach(k => {
        payload[k] = form[k];
      });

      payload.type_hours = (thHours === '15h') ? 'Theory (15h)' : (lbHours ? 'Lab (30h)' : 'Theory (15h)');
      payload.group_count = thGroups || lbGroups || 1;
      payload.theory_hours = thHours;
      payload.theory_groups = thGroups;
      payload.lab_hours = lbHours;
      payload.lab_groups = lbGroups;
      payload.comment = (form.comment || '').slice(0, 160);

      await updateCourseMapping(editing.id, payload);
      await reloadData();
      setEditError('');
      return true;
    } catch (e) {
      setEditError(e.response?.data?.message || e.message);
      return false;
    }
  };

  const remove = async (mapping, setError) => {
    try {
      setDeleting(true);
      await deleteCourseMapping(mapping.id);
      await reloadData();
      return true;
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    submitAdd,
    submitEdit,
    remove,
    deleting,
    addError,
    setAddError,
    editError,
    setEditError
  };
}
