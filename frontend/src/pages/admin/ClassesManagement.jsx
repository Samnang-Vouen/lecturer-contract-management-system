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
import { getGroups } from "../../services/group.service";

export default function ClassesManagement() {
  // Error handling
  const { error, isErrorDialogOpen, setIsErrorDialogOpen, showErrorPopup } = useErrorHandling();

  // Custom hooks
  const {
    classes,
    setClasses,
    availableCourses,
    setAvailableCourses,
    availableSpecializations,
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
    upgradingClass,
    setUpgradingClass,
    classToDelete,
    setClassToDelete,
    deleting,
    initialClassState,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isUpgradeDialogOpen,
    setIsUpgradeDialogOpen,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    handleAddClass,
    handleEditClass,
    handleOpenUpgradeClass,
    handleUpgradeClass,
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

  const onUpgradeClass = async (classItem) => {
    // Pre-fill selected courses from source class
    setSelectedCourses(Array.isArray(classItem?.courses) ? classItem.courses : []);
    handleOpenUpgradeClass(classItem);
  };

  const onSubmitUpgrade = async () => {
    try {
      await handleUpgradeClass(selectedCourses);
      setSelectedCourses([]);
    } catch (err) {
      showErrorPopup(err.message);
    }
  };

  const filteredClasses = getFilteredClasses();

  // When editing a class, load its groups so we can edit student counts / sync group changes
  React.useEffect(() => {
    const classId = editingClass?.id;
    if (!isEditDialogOpen || !classId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getGroups({ class_id: classId });
        const list = Array.isArray(res.data?.group) ? res.data.group : [];
        const groups = list
          .map((g) => ({
            id: g.id,
            name: g.name,
            num_of_student: g.num_of_student,
          }))
          .sort((a, b) => String(a.name).localeCompare(String(b.name)));
        if (cancelled) return;
        setEditingClass((prev) => {
          if (!prev) return prev;
          return { ...prev, groups, _original_groups: groups };
        });
      } catch {
        // non-fatal; allow editing class fields without group data
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditDialogOpen, editingClass?.id, setEditingClass]);

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
          onUpgrade={onUpgradeClass}
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
        specializationOptions={availableSpecializations}
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
        mode="edit"
        onAssignCourses={onAssignCourses}
        courseCatalog={availableCourses}
        specializationOptions={availableSpecializations}
        selectedCourses={selectedCourses}
      />

      {/* Upgrade Class Dialog */}
      <ClassFormDialog
        open={isUpgradeDialogOpen}
        onOpenChange={(open) => {
          setIsUpgradeDialogOpen(open);
          if (!open) {
            setUpgradingClass(null);
            setSelectedCourses([]);
          }
        }}
        onSubmit={onSubmitUpgrade}
        classData={upgradingClass || initialClassState}
        setClassData={setUpgradingClass}
        isEdit={false}
        mode="upgrade"
        onAssignCourses={onAssignCourses}
        courseCatalog={availableCourses}
        specializationOptions={availableSpecializations}
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