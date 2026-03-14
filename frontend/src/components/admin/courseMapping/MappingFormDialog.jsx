import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog.jsx';

import TeachingTypeSelector from './TeachingTypeSelector.jsx';

import { useMappingAvailabilityPopover } from '../../../hooks/admin/courseMapping/useMappingAvailabilityPopover.js';
import { useMappingCascades } from '../../../hooks/admin/courseMapping/useMappingCascades.js';
import { useMappingGroups } from '../../../hooks/admin/courseMapping/useMappingGroups.js';
import { useMappingValidation } from '../../../hooks/admin/courseMapping/useMappingValidation.js';
import { useTeachingTypeGroupSync } from '../../../hooks/admin/courseMapping/useTeachingTypeGroupSync.js';

import AddMappingFields from './mappingForm/AddMappingFields.jsx';
import LecturerField from './mappingForm/LecturerField.jsx';
import AvailabilityField from './mappingForm/AvailabilityField.jsx';
import StatusField from './mappingForm/StatusField.jsx';
import ContactFields from './mappingForm/ContactFields.jsx';
import ActionButtons from './mappingForm/ActionButtons.jsx';
import ClientErrorsAlert from './mappingForm/ClientErrorsAlert.jsx';
import SessionGroupsCard from './mappingForm/SessionGroupsCard.jsx';

/**
 * MappingFormDialog - Add or Edit course mapping form (container)
 */
export default function MappingFormDialog({
  isOpen,
  onClose,
  mode, // 'add' | 'edit'
  form,
  setForm,
  onSubmit,
  error,
  classes,
  courses,
  lecturers,
  classMap,
  courseMap,
  academicYearOptions,
  reloadForAcademicYear,
  teachingType, // useTeachingType hook instance passed from parent
}) {
  const isEditMode = mode === 'edit';

  const getClassSpecializationName = useCallback((classItem) => {
    if (!classItem) return '';
    return (
      classItem?.Specialization?.name ||
      classItem?.specialization?.name ||
      classItem?.specialization_name ||
      classItem?.specializationName ||
      ''
    );
  }, []);

  const availability = useMappingAvailabilityPopover({
    isOpen,
    availability: form.availability,
    setForm,
  });

  const {
    yearLevelOptionsForAY,
    termOptionsForAYLevel,
    classesForSelection,
    allowedCourses,
    filteredLecturers,
    selectedClass,
  } = useMappingCascades({ form, classes, courses, lecturers, classMap, courseMap });

  const { groupsForSelectedClass, assignedGroupsForEdit } = useMappingGroups({
    selectedClass,
    form,
    isEditMode,
  });

  useTeachingTypeGroupSync({ isOpen, teachingType, groupsForSelectedClass, form });

  const toggleTheoryGroup = useCallback(
    (groupId) => {
      if (!teachingType?.theorySelected) return;
      setForm((f) => {
        const prev = Array.isArray(f.theory_group_ids) ? f.theory_group_ids : [];
        const set = new Set(prev.map(String));
        const gid = String(groupId);
        if (set.has(gid)) set.delete(gid);
        else set.add(gid);
        const next = Array.from(set);
        teachingType?.setTheoryGroups?.(String(next.length));
        return { ...f, theory_group_ids: next };
      });
    },
    [setForm, teachingType]
  );

  const toggleLabGroup = useCallback(
    (groupId) => {
      if (!teachingType?.labSelected) return;
      setForm((f) => {
        const prev = Array.isArray(f.lab_group_ids) ? f.lab_group_ids : [];
        const set = new Set(prev.map(String));
        const gid = String(groupId);
        if (set.has(gid)) set.delete(gid);
        else set.add(gid);
        const next = Array.from(set);
        teachingType?.setLabGroups?.(String(next.length));
        return { ...f, lab_group_ids: next };
      });
    },
    [setForm, teachingType]
  );

  const setTheoryRoomForGroup = useCallback(
    (groupId, value) => {
      setForm((f) => {
        const gid = String(groupId);
        const prev = f.theory_room_by_group && typeof f.theory_room_by_group === 'object' ? f.theory_room_by_group : {};
        return {
          ...f,
          theory_room_by_group: {
            ...prev,
            [gid]: String(value || '').toUpperCase(),
          },
        };
      });
    },
    [setForm]
  );

  const setLabRoomForGroup = useCallback(
    (groupId, value) => {
      setForm((f) => {
        const gid = String(groupId);
        const prev = f.lab_room_by_group && typeof f.lab_room_by_group === 'object' ? f.lab_room_by_group : {};
        return {
          ...f,
          lab_room_by_group: {
            ...prev,
            [gid]: String(value || '').toUpperCase(),
          },
        };
      });
    },
    [setForm]
  );

  const { clientErrors, handleSubmit } = useMappingValidation({
    isOpen,
    isEditMode,
    form,
    groupsForSelectedClass,
    teachingType,
    onSubmit,
  });

  const theoryContent =
    !form.class_id ? (
      <div className="text-sm text-gray-500">Select class first</div>
    ) : groupsForSelectedClass.length === 0 ? (
      <div className="text-sm text-gray-500">No groups for selected class</div>
    ) : (
      <>
        <SessionGroupsCard
          title="Theory Session"
          groups={groupsForSelectedClass}
          selectedIds={form.theory_group_ids}
          onToggleGroup={toggleTheoryGroup}
          roomByGroup={isEditMode ? undefined : form.theory_room_by_group}
          onRoomChange={isEditMode ? undefined : setTheoryRoomForGroup}
          roomPlaceholder="A201"
        />
        {!isEditMode && (
          <p className="mt-2 text-xs text-gray-500">Select groups and enter the room for each selected theory group.</p>
        )}
      </>
    );

  const labContent =
    !form.class_id ? (
      <div className="text-sm text-gray-500">Select class first</div>
    ) : groupsForSelectedClass.length === 0 ? (
      <div className="text-sm text-gray-500">No groups for selected class</div>
    ) : (
      <>
        <SessionGroupsCard
          title="Lab Session"
          groups={groupsForSelectedClass}
          selectedIds={form.lab_group_ids}
          onToggleGroup={toggleLabGroup}
          roomByGroup={isEditMode ? undefined : form.lab_room_by_group}
          onRoomChange={isEditMode ? undefined : setLabRoomForGroup}
          roomPlaceholder="B105"
        />
        {!isEditMode && (
          <p className="mt-2 text-xs text-gray-500">Select groups and enter the room for each selected lab group.</p>
        )}
      </>
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Mapping' : 'New Mapping'}</DialogTitle>
          {!isEditMode && (
            <p className="mt-1 text-sm text-gray-500">
              Create a new course assignment by selecting the academic year, class, course, lecturer, availability, and teaching type.
            </p>
          )}
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="mb-3 mx-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2"
          >
            {error}
          </div>
        )}

        <ClientErrorsAlert messages={clientErrors} />

        <div className="max-h-[80vh] sm:max-h-[70vh] overflow-y-auto px-2">
          <div className="w-full max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min text-sm">
              {!isEditMode && (
                <AddMappingFields
                  form={form}
                  setForm={setForm}
                  academicYearOptions={academicYearOptions}
                  reloadForAcademicYear={reloadForAcademicYear}
                  yearLevelOptionsForAY={yearLevelOptionsForAY}
                  termOptionsForAYLevel={termOptionsForAYLevel}
                  classesForSelection={classesForSelection}
                  classMap={classMap}
                  allowedCourses={allowedCourses}
                  getClassSpecializationName={getClassSpecializationName}
                />
              )}

              <LecturerField isEditMode={isEditMode} form={form} setForm={setForm} filteredLecturers={filteredLecturers} />

              <TeachingTypeSelector
                theorySelected={teachingType.theorySelected}
                onTheorySelectedChange={(v) => {
                  teachingType.setTheorySelected(v);
                  if (!v) {
                    teachingType.resetTheory();
                    setForm((f) => ({ ...f, theory_group_ids: [] }));
                  }
                }}
                theoryHour={teachingType.theoryHour}
                onTheoryHourChange={teachingType.setTheoryHour}
                labSelected={teachingType.labSelected}
                onLabSelectedChange={(v) => {
                  teachingType.setLabSelected(v);
                  if (!v) {
                    teachingType.resetLab();
                    setForm((f) => ({ ...f, lab_group_ids: [] }));
                  }
                }}
                theoryContent={theoryContent}
                labContent={labContent}
              />

              <AvailabilityField {...availability} form={form} setForm={setForm} />
              <StatusField form={form} setForm={setForm} />

              {/* Theory/Lab Room (bulk edit for no-group/legacy rows) */}
              {(isEditMode || (form.class_id && groupsForSelectedClass.length === 0)) && (
                <>
                  <div className="col-span-1 flex flex-col min-w-0">
                    <label htmlFor="mappingTheoryRoomNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Theory Room
                    </label>
                    <input
                      id="mappingTheoryRoomNumber"
                      name="theory_room_number"
                      value={form.theory_room_number || ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          theory_room_number: String(e.target.value || '').toUpperCase(),
                        }))
                      }
                      className="block w-full min-h-[3rem] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="A201"
                    />
                  </div>
                  <div className="col-span-1 flex flex-col min-w-0">
                    <label htmlFor="mappingLabRoomNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Lab Room
                    </label>
                    <input
                      id="mappingLabRoomNumber"
                      name="lab_room_number"
                      value={form.lab_room_number || ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          lab_room_number: String(e.target.value || '').toUpperCase(),
                        }))
                      }
                      className="block w-full min-h-[3rem] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="B105"
                    />
                  </div>

                  {!isEditMode && groupsForSelectedClass.length === 0 && (
                    <div className="col-span-1 sm:col-span-2">
                      <p className="mt-1 text-xs text-gray-500">No groups found for this class; rooms are saved on the course mapping.</p>
                    </div>
                  )}
                  {isEditMode && (
                    <div className="col-span-1 sm:col-span-2">
                      <p className="mt-1 text-xs text-gray-500">Editing applies these rooms to the selected mapping row(s).</p>
                    </div>
                  )}
                </>
              )}

              <ContactFields form={form} setForm={setForm} />
              <ActionButtons isEditMode={isEditMode} onClose={onClose} onSubmit={handleSubmit} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
