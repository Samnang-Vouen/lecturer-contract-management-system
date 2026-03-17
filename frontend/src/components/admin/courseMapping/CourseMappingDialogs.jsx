import React from 'react';
import DeleteConfirmDialog from './DeleteConfirmDialog.jsx';
import EditMappingFormDialog from './EditMappingFormDialog.jsx';
import MappingFormDialog from './MappingFormDialog.jsx';

export default function CourseMappingDialogs(props) {
  return (
    <>
      <DeleteConfirmDialog
        isOpen={props.confirmOpen}
        onClose={(open) => {
          props.setConfirmOpen(open !== false);
          if (!open) props.setToDelete(null);
        }}
        mapping={props.toDelete}
        courseMap={props.courseMap}
        onConfirm={async () => {
          if (!props.toDelete) return;
          try {
            props.setDeleting(true);
            await props.remove(props.toDelete);
            props.setConfirmOpen(false);
            props.setToDelete(null);
          } finally {
            props.setDeleting(false);
          }
        }}
        isDeleting={props.deleting}
      />

      <MappingFormDialog
        isOpen={props.addOpen}
        onClose={() => props.setAddOpen(false)}
        form={props.form}
        setForm={props.setForm}
        onSubmit={props.submitAdd}
        error={props.addError}
        classes={props.classes}
        courses={props.courses}
        lecturers={props.lecturers}
        classMap={props.classMap}
        courseMap={props.courseMap}
        academicYearOptions={props.academicYearOptions}
        reloadForAcademicYear={props.reloadForAcademicYear}
        teachingType={props.teachingTypeAdd}
      />

      <EditMappingFormDialog
        isOpen={props.editOpen}
        onClose={() => {
          props.setEditOpen(false);
          props.setEditing(null);
        }}
        mode="edit"
        form={props.form}
        setForm={props.setForm}
        onSubmit={props.submitEdit}
        error={props.editError}
        classes={props.classes}
        courses={props.courses}
        lecturers={props.lecturers}
        classMap={props.classMap}
        courseMap={props.courseMap}
        teachingType={props.teachingTypeEdit}
      />
    </>
  );
}