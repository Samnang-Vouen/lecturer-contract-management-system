import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import CreateLecturerModal from '../../components/CreateLecturerModal';
import AssignCoursesDialog from '../../components/AssignCoursesDialog';
import toast from 'react-hot-toast';
import { getLecturerDetail } from '../../services/lecturer.service';

// Custom Hooks
import { useLecturers } from '../../hooks/admin/lecturerManagement/useLecturers';
import { useLecturerOperations } from '../../hooks/admin/lecturerManagement/useLecturerOperations';
import { useLecturerDetail } from '../../hooks/admin/lecturerManagement/useLecturerDetail';
import { useCourseAssignment } from '../../hooks/admin/lecturerManagement/useCourseAssignment';
import { useMenusAndPopovers, useOnboardingListener } from '../../hooks/admin/lecturerManagement/useLecturerHelpers';

// Components
import LecturerHeader from '../../components/admin/lecturerManagement/LecturerHeader';
import LecturerSearch from '../../components/admin/lecturerManagement/LecturerSearch';
import LecturerTable from '../../components/admin/lecturerManagement/LecturerTable';
import LecturerActionMenu from '../../components/admin/lecturerManagement/LecturerActionMenu';
import CoursesPopover from '../../components/admin/lecturerManagement/CoursesPopover';
import DeleteLecturerModal from '../../components/admin/lecturerManagement/DeleteLecturerModal';
import LecturerProfileDialog from '../../components/admin/lecturerManagement/LecturerProfileDialog';


export default function LecturerManagement() {
  // View state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Custom hooks
  const {
    lecturers,
    setLecturers,
    isLoading,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalLecturers,
    refreshLecturers
  } = useLecturers();

  const {
    isDeleteModalOpen,
    lecturerToDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    handleDeactivate,
    saveProfile,
    handlePayrollUpload
  } = useLecturerOperations(setLecturers);

  const {
    selectedLecturer,
    setSelectedLecturer,
    isProfileDialogOpen,
    setIsProfileDialogOpen,
    dialogReadonly,
    editTab,
    setEditTab,
    openEdit,
    openView,
    closeDialog,
    fileUrl
  } = useLecturerDetail();

  const {
    assigning,
    coursesCatalog,
    selectedCourses,
    assignLoading,
    openAssignment,
    toggleCourseSelection,
    saveAssignment,
    cancelAssignment
  } = useCourseAssignment(setLecturers);

  const {
    openMenuId,
    menuCoords,
    coursesPopover,
    openMenu,
    closeMenu,
    openCoursesPopover,
    closeCoursesPopover
  } = useMenusAndPopovers();

  // Listen for onboarding updates
  useOnboardingListener(refreshLecturers);

  // Prevent body scroll when dialog open
  useEffect(() => {
    if (isProfileDialogOpen) {
      const o = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = o;
      };
    }
  }, [isProfileDialogOpen]);

  // Handle lecturer creation
  const handleLecturerCreated = (lec) => {
    const raw = lec.email.split('@')[0].replace(/\./g, ' ');
    const display = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const normalized = {
      id: lec.id,
      name: display,
      email: lec.email,
      status: 'inactive',
      lastLogin: 'Never',
      role: 'lecturer',
      position: lec.profile?.position || 'Lecturer',
      tempPassword: lec.tempPassword
    };
    setLecturers(prev => [normalized, ...prev]);
  };

  // Handle menu actions
  const handleViewClick = (lecturer) => {
    closeMenu();
    openView(lecturer);
  };

  const handleEditClick = (lecturer) => {
    closeMenu();
    openEdit(lecturer);
  };

  const handleAssignCoursesClick = async (lecturer) => {
    closeMenu();
    try {
      const detail = await getLecturerDetail(lecturer.id);
      await openAssignment(lecturer, detail);
    } catch (e) {
      console.error('Failed to open assignment', e);
      toast.error('Failed to load courses');
    }
  };

  const handleToggleStatusClick = (lecturer) => {
    handleDeactivate(lecturer);
    closeMenu();
  };

  const handleDeleteClick = (lecturer) => {
    requestDelete(lecturer);
    closeMenu();
  };

  const handleSaveProfile = async () => {
    const success = await saveProfile(selectedLecturer, async (id) => {
      const raw = await getLecturerDetail(id);
      const get = (k, alt) => raw[k] ?? raw.data?.[k] ?? raw.profile?.[k] ?? alt;
      setSelectedLecturer(p => ({
        ...p,
        candidateId: get('candidateId', p.candidateId),
        hourlyRateThisYear: get('hourlyRateThisYear', p.hourlyRateThisYear)
      }));
    });
    
    if (success) {
      setIsProfileDialogOpen(false);
    }
  };

  const handlePayrollUploadWrapper = async (file) => {
    const newPath = await handlePayrollUpload(selectedLecturer.id, file, (path) => {
      setSelectedLecturer(p => ({
        ...p,
        payrollFilePath: path || p.payrollFilePath,
        payrollUploaded: true
      }));
    });
  };

  return (
    <div className='p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen'>
      <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
        <div className='p-6 sm:p-8'>
          <LecturerHeader onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        </div>
      </div>

      <LecturerSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <LecturerTable
        lecturers={lecturers}
        isLoading={isLoading}
        totalLecturers={totalLecturers}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        onOpenMenu={openMenu}
        onOpenCoursesPopover={openCoursesPopover}
      />

      <CreateLecturerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLecturerCreated={handleLecturerCreated}
      />

      <LecturerProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={closeDialog}
        lecturer={selectedLecturer}
        setLecturer={setSelectedLecturer}
        readonly={dialogReadonly}
        activeTab={editTab}
        setActiveTab={setEditTab}
        onSave={handleSaveProfile}
        onPayrollUpload={handlePayrollUploadWrapper}
        fileUrl={fileUrl}
      />

      {coursesPopover && createPortal(
        <CoursesPopover
          courses={coursesPopover.items}
          coords={{ x: coursesPopover.x, y: coursesPopover.y }}
          onClose={closeCoursesPopover}
        />,
        document.body
      )}

      <DeleteLecturerModal
        isOpen={isDeleteModalOpen}
        lecturer={lecturerToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {openMenuId && createPortal(
        (() => {
          const lecturer = lecturers.find(l => l.id === openMenuId);
          if (!lecturer) return null;
          return (
            <LecturerActionMenu
              lecturer={lecturer}
              coords={menuCoords}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onAssignCourses={handleAssignCoursesClick}
              onToggleStatus={handleToggleStatusClick}
              onDelete={handleDeleteClick}
            />
          );
        })(),
        document.body
      )}

      <AssignCoursesDialog
        open={!!assigning}
        onOpenChange={(o) => { if (!o) cancelAssignment(); }}
        availableCourses={coursesCatalog}
        selectedCourses={selectedCourses}
        onToggleCourse={toggleCourseSelection}
        onSave={saveAssignment}
        onCancel={cancelAssignment}
        className={assigning?.name}
      />

      {assigning && assignLoading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
          <div className='flex items-center gap-3 bg-white px-6 py-4 rounded shadow'>
            <Loader2 className='w-5 h-5 animate-spin text-blue-600'/>
            <span className='text-sm text-gray-700'>Loading courses...</span>
          </div>
        </div>
      )}
    </div>
  );
}
