import { createInitialCourseMappingForm, buildEditForm } from './courseMappingPage.form';
import { buildAddPayload, buildEditPayload, validateAvailabilityAssignments } from './courseMappingPage.payloads';

export function useCourseMappingPageHandlers({
  state, classes, classMap, teachingTypeAdd, teachingTypeEdit, createMapping, updateMapping, deleteMapping,
}) {
  const startAdd = () => {
    state.setForm(createInitialCourseMappingForm());
    teachingTypeAdd.reset();
    state.setAddError('');
    state.setAddOpen(true);
  };

  const submitAdd = async (teachingPayload) => {
    try {
      const required = [];
      const { form } = state;
      if (!form.academic_year) required.push('Academic Year');
      if (!form.year_level) required.push('Year Level');
      if (!form.term) required.push('Term');
      if (!form.class_id) required.push('Class');
      const selectedClass = (classMap && form.class_id && classMap[form.class_id]) || classes.find((item) => String(item.id) === String(form.class_id));
      const classGroups = Array.isArray(selectedClass?.Groups) ? selectedClass.Groups : Array.isArray(selectedClass?.groups) ? selectedClass.groups : [];
      const theoryGroupIds = Array.isArray(form.theory_group_ids) ? form.theory_group_ids : [];
      const labGroupIds = Array.isArray(form.lab_group_ids) ? form.lab_group_ids : [];
      if (!form.course_id) required.push('Course');
      if (!form.lecturer_profile_id) required.push('Lecturer');
      if (required.length) {
        state.setAddError(`Please fill in/select: ${required.join(', ')}.`);
        return;
      }
      if (!teachingPayload.isValid) {
        state.setAddError('Teaching Type is required: select Theory and/or Lab with valid groups.');
        return;
      }
      if (form.class_id && classGroups.length) {
        const theoryCount = parseInt(String(teachingPayload.theory_groups ?? 0), 10) || 0;
        const labCount = parseInt(String(teachingPayload.lab_groups ?? 0), 10) || 0;
        if (theoryCount > 0 && theoryGroupIds.length !== theoryCount) {
          state.setAddError(`Please select exactly ${theoryCount} Theory group(s).`);
          return;
        }
        if (labCount > 0 && labGroupIds.length !== labCount) {
          state.setAddError(`Please select exactly ${labCount} Lab group(s).`);
          return;
        }
        if ((theoryCount > 0 || labCount > 0) && theoryGroupIds.length + labGroupIds.length === 0) {
          state.setAddError('Please select Group(s) for Theory and/or Lab.');
          return;
        }
      }
      const assignmentErrors = validateAvailabilityAssignments(form);
      if (assignmentErrors.length) {
        state.setAddError(assignmentErrors[0]);
        return;
      }
      const payload = buildAddPayload(form, teachingPayload);
      delete payload.contactedBy;
      await createMapping(payload);
      state.setAddOpen(false);
    } catch (error) {
      console.error('[submitAdd] Error:', error);
      console.error('[submitAdd] Error response:', error.response?.data);
      state.setAddError(error.response?.data?.message || error.message);
    }
  };

  const startEdit = (mapping) => {
    state.setEditing(mapping);
    const editState = buildEditForm(mapping);
    state.setForm(editState.form);
    teachingTypeEdit.initializeFromMapping(editState.teachingTypeMapping);
    state.setEditError('');
    state.setEditOpen(true);
  };

  const submitEdit = async (teachingPayload) => {
    if (!state.editing) return;
    try {
      if (!teachingPayload.isValid) {
        state.setEditError('Select Theories and/or Labs.');
        return;
      }
      const payload = buildEditPayload(state.editing, state.form, teachingPayload);
      if (Array.isArray(state.editing?.ids) && state.editing.ids.length) await updateMapping(state.editing.ids, payload);
      else await updateMapping(state.editing.id, payload);
      state.setEditOpen(false);
      state.setEditing(null);
    } catch (error) {
      state.setEditError(error.response?.data?.message || error.message);
    }
  };

  const remove = async (mapping) => {
    try {
      if (Array.isArray(mapping?.ids) && mapping.ids.length) await deleteMapping(mapping.ids);
      else await deleteMapping(mapping.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return { startAdd, submitAdd, startEdit, submitEdit, remove };
}