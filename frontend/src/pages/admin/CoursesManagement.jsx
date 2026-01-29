import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

// Hooks
import { useCourses } from '../../hooks/admin/courseManagement/useCourses';
import { useCourseOperations } from '../../hooks/admin/courseManagement/useCourseOperations';
import { useCourseFilters } from '../../hooks/admin/courseManagement/useCourseFilters';

// Components
import CoursesHeader from '../../components/admin/coursesManagement/CoursesHeader';
import CoursesFilters from '../../components/admin/coursesManagement/CoursesFilters';
import CourseStatsCards from '../../components/admin/coursesManagement/CourseStatsCards';
import CourseSearchBar from '../../components/admin/coursesManagement/CourseSearchBar';
import CourseCard from '../../components/admin/coursesManagement/CourseCard';
import CoursesTable from '../../components/admin/coursesManagement/CoursesTable';
import CourseTableRow from '../../components/admin/coursesManagement/CourseTableRow';
import ViewCourseDialog from '../../components/admin/coursesManagement/ViewCourseDialog';
import CourseFormDialog from '../../components/admin/coursesManagement/CourseFormDialog';
import DeleteCourseDialog from '../../components/admin/coursesManagement/DeleteCourseDialog';

export default function CoursesPage() {
  // View state
  const [viewType, setViewType] = useState('table'); // 'table' | 'grid'

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Custom hooks
  const { courses, setCourses, loading, hasMore, sentinelRef } = useCourses();

  const {
    form,
    setForm,
    formErrors,
    setFormErrors,
    creating,
    updating,
    deletingId,
    creditsFromHours,
    prepareAddForm,
    prepareEditForm,
    submitAdd,
    submitEdit,
    deleteCourse,
  } = useCourseOperations(setCourses);

  const {
    search,
    setSearch,
    sortBy,
    setSortBy,
    hoursFilter,
    setHoursFilter,
    filteredCourses,
  } = useCourseFilters(courses);

  // Dialog handlers
  const handleOpenAdd = () => {
    prepareAddForm();
    setAddOpen(true);
  };

  const handleOpenEdit = (course) => {
    prepareEditForm(course);
    setEditOpen(true);
  };

  const handleOpenView = (course) => {
    setSelectedCourse(course);
    setViewOpen(true);
  };

  const handleOpenDelete = (course) => {
    setCourseToDelete(course);
    setConfirmDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setConfirmDeleteOpen(false);
    setCourseToDelete(null);
  };

  const handleSubmitAdd = async () => {
    const success = await submitAdd();
    if (success) setAddOpen(false);
  };

  const handleSubmitEdit = async () => {
    const success = await submitEdit();
    if (success) setEditOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    const success = await deleteCourse(courseToDelete.id);
    if (success) handleCloseDelete();
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <CoursesHeader
          viewType={viewType}
          setViewType={setViewType}
          onAddCourse={handleOpenAdd}
        />

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full">
          <CoursesFilters
            sortBy={sortBy}
            setSortBy={setSortBy}
            hoursFilter={hoursFilter}
            setHoursFilter={setHoursFilter}
          />
          <div className="flex-1 sm:min-w-[400px]">
            <CourseSearchBar search={search} setSearch={setSearch} />
          </div>
        </div>

        {/* Stats */}
        <CourseStatsCards courses={courses} filteredCourses={filteredCourses} />

        {/* Content */}
        {loading && courses.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No courses found</p>
          </div>
        ) : viewType === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onView={() => handleOpenView(course)}
                onEdit={() => handleOpenEdit(course)}
                onDelete={() => handleOpenDelete(course)}
              />
            ))}
          </div>
        ) : (
          <CoursesTable>
            {filteredCourses.map((course) => (
              <CourseTableRow
                key={course.id}
                course={course}
                onView={() => handleOpenView(course)}
                onEdit={() => handleOpenEdit(course)}
                onDelete={() => handleOpenDelete(course)}
              />
            ))}
          </CoursesTable>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="flex justify-center py-4">
          {loading && courses.length > 0 && (
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          )}
          {!hasMore && courses.length > 0 && (
            <p className="text-sm text-gray-400">All courses loaded</p>
          )}
        </div>

        {/* Dialogs */}
        <ViewCourseDialog
          course={selectedCourse}
          isOpen={viewOpen}
          onClose={() => setViewOpen(false)}
          onEdit={handleOpenEdit}
        />

        <CourseFormDialog
          mode="add"
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          form={form}
          setForm={setForm}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          onSubmit={handleSubmitAdd}
          isSubmitting={creating}
          creditsFromHours={creditsFromHours}
        />

        <CourseFormDialog
          mode="edit"
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          form={form}
          setForm={setForm}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          onSubmit={handleSubmitEdit}
          isSubmitting={updating}
          creditsFromHours={creditsFromHours}
        />

        <DeleteCourseDialog
          course={courseToDelete}
          isOpen={confirmDeleteOpen}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          isDeleting={deletingId === courseToDelete?.id}
        />
      </div>
    </div>
  );
}
