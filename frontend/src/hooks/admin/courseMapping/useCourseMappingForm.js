import { useState, useMemo } from 'react';

export function useCourseMappingForm(classes) {
  const [form, setForm] = useState({
    class_id: '',
    course_id: '',
    lecturer_profile_id: '',
    academic_year: '',
    term: '',
    year_level: '',
    group_count: 1,
    type_hours: '',
    availability: '',
    status: 'Pending',
    contacted_by: '',
    contactedBy: '',
    comment: ''
  });

  // Teaching type UI state for Add/Edit dialogs
  const [theorySelectedAdd, setTheorySelectedAdd] = useState(false);
  const [theoryHourAdd, setTheoryHourAdd] = useState('');
  const [theoryGroupsAdd, setTheoryGroupsAdd] = useState('');
  const [theoryCombineAdd, setTheoryCombineAdd] = useState(false);
  const [labSelectedAdd, setLabSelectedAdd] = useState(false);
  const [labGroupsAdd, setLabGroupsAdd] = useState('');

  const [theorySelectedEdit, setTheorySelectedEdit] = useState(false);
  const [theoryHourEdit, setTheoryHourEdit] = useState('');
  const [theoryGroupsEdit, setTheoryGroupsEdit] = useState('');
  const [theoryCombineEdit, setTheoryCombineEdit] = useState(false);
  const [labSelectedEdit, setLabSelectedEdit] = useState(false);
  const [labGroupsEdit, setLabGroupsEdit] = useState('');

  // Cascading option sets for the Add dialog
  const yearLevelOptionsForAY = useMemo(() => {
    if (!form.academic_year) return [];
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach(c => {
      if (String(c.academic_year) === String(form.academic_year) && (c.year_level || c.yearLevel)) {
        set.add(String(c.year_level ?? c.yearLevel));
      }
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [classes, form.academic_year]);

  const termOptionsForAYLevel = useMemo(() => {
    if (!form.academic_year || !form.year_level) return [];
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach(c => {
      const yl = c.year_level ?? c.yearLevel;
      if (String(c.academic_year) === String(form.academic_year) && 
          String(yl) === String(form.year_level) && c.term) {
        set.add(String(c.term));
      }
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [classes, form.academic_year, form.year_level]);

  const classesForSelection = useMemo(() => {
    if (!form.academic_year || !form.year_level || !form.term) return [];
    return (Array.isArray(classes) ? classes : []).filter(c =>
      String(c.academic_year) === String(form.academic_year) &&
      String((c.year_level ?? c.yearLevel)) === String(form.year_level) &&
      String(c.term) === String(form.term)
    );
  }, [classes, form.academic_year, form.year_level, form.term]);

  const resetAddForm = () => {
    setForm({
      class_id: '',
      course_id: '',
      lecturer_profile_id: '',
      academic_year: '',
      term: '',
      year_level: '',
      group_count: 1,
      type_hours: '',
      availability: '',
      status: 'Pending',
      contacted_by: '',
      contactedBy: '',
      comment: ''
    });
    setTheorySelectedAdd(false);
    setTheoryHourAdd('');
    setTheoryGroupsAdd('');
    setTheoryCombineAdd(false);
    setLabSelectedAdd(false);
    setLabGroupsAdd('');
  };

  const prepareEditForm = (mapping) => {
    setForm({
      class_id: mapping.class_id,
      course_id: mapping.course_id,
      lecturer_profile_id: mapping.lecturer_profile_id || '',
      academic_year: mapping.academic_year,
      term: mapping.term,
      year_level: mapping.year_level || '',
      group_count: mapping.group_count || 1,
      type_hours: mapping.type_hours,
      theory_hours: mapping.theory_hours || '',
      theory_groups: mapping.theory_groups ?? '',
      lab_hours: mapping.lab_hours || '',
      lab_groups: mapping.lab_groups ?? '',
      availability: mapping.availability || '',
      status: mapping.status,
      contacted_by: mapping.contacted_by || '',
      comment: mapping.comment || ''
    });

    // Init dual UI for Edit
    const hasTheory = Number.isFinite(mapping.theory_groups) 
      ? (mapping.theory_groups > 0) 
      : (/theory|15h/i.test(String(mapping.type_hours || '')) && (mapping.group_count || 0) > 0);
    const hasLab = Number.isFinite(mapping.lab_groups) 
      ? (mapping.lab_groups > 0) 
      : (/lab|30h/i.test(String(mapping.type_hours || '')) && (mapping.group_count || 0) > 0);

    setTheorySelectedEdit(hasTheory);
    setLabSelectedEdit(hasLab);
    setTheoryHourEdit(
      mapping.theory_hours || 
      (hasTheory ? (String(mapping.type_hours || '').includes('15h') ? '15h' : '30h') : '')
    );
    setTheoryGroupsEdit(
      String(Number.isFinite(mapping.theory_groups) 
        ? mapping.theory_groups 
        : (hasTheory ? (mapping.group_count || 1) : ''))
    );
    setTheoryCombineEdit(!!(mapping.theory_15h_combined ?? mapping.theory_combined ?? mapping.combine_theory_groups));
    setLabGroupsEdit(
      String(Number.isFinite(mapping.lab_groups) 
        ? mapping.lab_groups 
        : (hasLab ? (mapping.group_count || 1) : ''))
    );
  };

  return {
    form,
    setForm,
    yearLevelOptionsForAY,
    termOptionsForAYLevel,
    classesForSelection,
    resetAddForm,
    prepareEditForm,
    theorySelectedAdd,
    setTheorySelectedAdd,
    theoryHourAdd,
    setTheoryHourAdd,
    theoryGroupsAdd,
    setTheoryGroupsAdd,
    theoryCombineAdd,
    setTheoryCombineAdd,
    labSelectedAdd,
    setLabSelectedAdd,
    labGroupsAdd,
    setLabGroupsAdd,
    theorySelectedEdit,
    setTheorySelectedEdit,
    theoryHourEdit,
    setTheoryHourEdit,
    theoryGroupsEdit,
    setTheoryGroupsEdit,
    theoryCombineEdit,
    setTheoryCombineEdit,
    labSelectedEdit,
    setLabSelectedEdit,
    labGroupsEdit,
    setLabGroupsEdit
  };
}
