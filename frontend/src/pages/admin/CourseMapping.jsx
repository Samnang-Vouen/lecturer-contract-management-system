import React from 'react';
import CourseMappingDialogs from '../../components/admin/courseMapping/CourseMappingDialogs.jsx';
import CourseMappingGroupsSection from '../../components/admin/courseMapping/CourseMappingGroupsSection.jsx';
import CourseMappingPageHeader from '../../components/admin/courseMapping/CourseMappingPageHeader.jsx';
import { useCourseMappingData } from '../../hooks/admin/courseMapping/useCourseMappingData.js';
import { useCourseMappingPageHandlers } from '../../hooks/admin/courseMapping/useCourseMappingPageHandlers.js';
import { useCourseMappingPageState } from '../../hooks/admin/courseMapping/useCourseMappingPageState.js';
import { useTeachingType } from '../../hooks/admin/courseMapping/useTeachingType.js';

export default function CourseMappingPage() {
  const state = useCourseMappingPageState();
  const {
    classes,
    lecturers,
    courses,
    grouped,
    classMap,
    courseMap,
    academicYearFilter,
    setAcademicYearFilter,
    termFilter,
    setTermFilter,
    statusFilter,
    setStatusFilter,
    academicYearOptions,
    termOptions,
    statusOptions,
    loading,
    error,
    hasMore,
    sentinelRef,
    reloadForAcademicYear,
    createMapping,
    updateMapping,
    deleteMapping,
  } = useCourseMappingData();
  const teachingTypeAdd = useTeachingType();
  const teachingTypeEdit = useTeachingType();
  const { startAdd, submitAdd, startEdit, submitEdit, remove } = useCourseMappingPageHandlers({
    state,
    classes,
    classMap,
    teachingTypeAdd,
    teachingTypeEdit,
    createMapping,
    updateMapping,
    deleteMapping,
  });

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <CourseMappingPageHeader
          startAdd={startAdd}
          academicYearFilter={academicYearFilter}
          setAcademicYearFilter={setAcademicYearFilter}
          termFilter={termFilter}
          setTermFilter={setTermFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          academicYearOptions={academicYearOptions}
          termOptions={termOptions}
          statusOptions={statusOptions}
          grouped={grouped}
          loading={loading}
          error={error}
        />

        <CourseMappingGroupsSection
          error={error}
          grouped={grouped}
          loading={loading}
          termFilter={termFilter}
          statusFilter={statusFilter}
          academicYearFilter={academicYearFilter}
          sentinelRef={sentinelRef}
          hasMore={hasMore}
          courseMap={courseMap}
          startEdit={startEdit}
          setToDelete={state.setToDelete}
          setConfirmOpen={state.setConfirmOpen}
        />

        <CourseMappingDialogs
          confirmOpen={state.confirmOpen}
          setConfirmOpen={state.setConfirmOpen}
          toDelete={state.toDelete}
          setToDelete={state.setToDelete}
          deleting={state.deleting}
          setDeleting={state.setDeleting}
          remove={remove}
          courseMap={courseMap}
          addOpen={state.addOpen}
          setAddOpen={state.setAddOpen}
          form={state.form}
          setForm={state.setForm}
          submitAdd={submitAdd}
          addError={state.addError}
          classes={classes}
          courses={courses}
          lecturers={lecturers}
          classMap={classMap}
          academicYearOptions={academicYearOptions}
          reloadForAcademicYear={reloadForAcademicYear}
          teachingTypeAdd={teachingTypeAdd}
          editOpen={state.editOpen}
          setEditOpen={state.setEditOpen}
          setEditing={state.setEditing}
          submitEdit={submitEdit}
          editError={state.editError}
          teachingTypeEdit={teachingTypeEdit}
        />
      </div>
    </>
  );
}
