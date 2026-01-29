import React from "react";
import ClassesTable from "../../components/admin/classManagement/ClassesTable";
import ClassFormDialog from "../../components/admin/classManagement/ClassFormDialog";
import AssignCoursesDialog from "../../components/AssignCoursesDialog";
import ErrorDialog from "../../components/ErrorDialog";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import ClassesHeader from "../../components/admin/classManagement/ClassesHeader";
import ClassesFilter from "../../components/admin/classManagement/ClassesFilter";
import InfiniteScrollSentinel from "../../components/InfiniteScrollSentinel";
import { useClassesData } from "../../hooks/admin/classManagement/useClassesData";
import { useClassManagement } from "../../hooks/admin/classManagement/useClassManagement";
import { useCourseAssignment } from "../../hooks/admin/classManagement/useCourseAssignment";
import { useErrorHandling } from "../../hooks/useErrorHandling";
import { createClassHandlers } from "../../utils/classHandlers";

export default function ClassesManagement() {
  // Error handling
  const { error, isErrorDialogOpen, setIsErrorDialogOpen, showErrorPopup } = useErrorHandling();

  // Custom hooks
  const {
    classes,
    setClasses,
    availableCourses,
    setAvailableCourses,
    loading,
    selectedAcademicYear,
    setSelectedAcademicYear,
    hasMore,
    sentinelRef,
    getUniqueAcademicYears,
    getFilteredClasses,
  } = useClassesData();

  const {
    newClass,
    setNewClass,
    editingClass,
    setEditingClass,
    classToDelete,
    setClassToDelete,
    deleting,
    initialClassState,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    handleAddClass,
    handleEditClass,
    handleUpdateClass,
    handleDeleteClass,
    performDeleteClass,
  } = useClassManagement(classes, setClasses, []);

  const {
    selectedCourses,
    setSelectedCourses,
    isCourseAssignDialogOpen,
    setIsCourseAssignDialogOpen,
    assigningClass,
    handleAssignCourses,
    handleSaveCourseAssignment,
    handleCourseToggle,
  } = useCourseAssignment(classes, setClasses, editingClass, setEditingClass);

  // Create handler wrappers
  const {
    onEditClass,
    onAddClass,
    onUpdateClass,
    onPerformDelete,
    onAssignCourses,
    onSaveCourseAssignment,
  } = createClassHandlers({
    handleAddClass,
    handleUpdateClass,
    performDeleteClass,
    handleAssignCourses,
    handleSaveCourseAssignment,
    handleEditClass,
    selectedCourses,
    setSelectedCourses,
    availableCourses,
    setAvailableCourses,
    showErrorPopup,
  });

  const filteredClasses = getFilteredClasses();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <ClassesHeader onAddClick={() => setIsAddDialogOpen(true)} />
        <ClassesFilter
          selectedAcademicYear={selectedAcademicYear}
          onAcademicYearChange={setSelectedAcademicYear}
          academicYears={getUniqueAcademicYears()}
          totalClasses={classes.length}
          filteredCount={filteredClasses.length}
        />
      </div>

      {/* Error Message */}
      {error && !isErrorDialogOpen && <div className="text-sm mb-2 text-red-600">{error}</div>}

      {/* Classes Table */}
      <div className="overflow-x-auto">
        <ClassesTable
          classes={filteredClasses}
          onEdit={onEditClass}
          onDelete={handleDeleteClass}
          loading={loading}
          courseCatalog={availableCourses}
          title="Academic Classes"
          description="Overview of all academic classes in your department"
        />
      </div>

      {/* Error Dialog */}
      <ErrorDialog
        open={isErrorDialogOpen}
        onOpenChange={setIsErrorDialogOpen}
        error={error}
      />

      {/* Confirm Delete Dialog */}
      {isConfirmDeleteOpen && classToDelete && (
        <ConfirmDeleteDialog
          open={isConfirmDeleteOpen}
          onOpenChange={(open) => {
            setIsConfirmDeleteOpen(open);
            if (!open) setClassToDelete(null);
          }}
          itemName={`this ${classToDelete?.name || 'class'}`}
          onConfirm={onPerformDelete}
          loading={deleting}
        />
      )}

      {/* Infinite Scroll Sentinel */}
      <InfiniteScrollSentinel
        sentinelRef={sentinelRef}
        loading={loading}
        hasMore={hasMore}
      />

      {/* Add Class Dialog */}
      <ClassFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={onAddClass}
        classData={newClass}
        setClassData={setNewClass}
        isEdit={false}
        onAssignCourses={onAssignCourses}
        courseCatalog={availableCourses}
        selectedCourses={selectedCourses}
      />

      {/* Edit Class Dialog */}
      <ClassFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={onUpdateClass}
        classData={editingClass || initialClassState}
        setClassData={setEditingClass}
        isEdit={true}
        onAssignCourses={onAssignCourses}
        courseCatalog={availableCourses}
        selectedCourses={selectedCourses}
      />

      {/* Assign Courses Dialog */}
      <AssignCoursesDialog
        open={isCourseAssignDialogOpen}
        onOpenChange={setIsCourseAssignDialogOpen}
        availableCourses={availableCourses}
        selectedCourses={selectedCourses}
        onToggleCourse={handleCourseToggle}
        onSave={onSaveCourseAssignment}
        onCancel={() => setIsCourseAssignDialogOpen(false)}
        className={assigningClass?.name}
      />
    </div>
  );
}