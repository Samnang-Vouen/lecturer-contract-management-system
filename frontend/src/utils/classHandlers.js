/**
 * Creates handler wrappers that include error handling
 */
export function createClassHandlers({
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
}) {
  const onEditClass = (classItem) => {
    setSelectedCourses(Array.isArray(classItem.courses) ? classItem.courses : []);
    handleEditClass(classItem);
  };

  const onAddClass = async () => {
    try {
      await handleAddClass(selectedCourses);
      setSelectedCourses([]);
    } catch (err) {
      showErrorPopup(err.message);
    }
  };

  const onUpdateClass = async () => {
    try {
      await handleUpdateClass(selectedCourses);
      setSelectedCourses([]);
    } catch (err) {
      showErrorPopup(err.message);
    }
  };

  const onPerformDelete = async () => {
    try {
      await performDeleteClass();
    } catch (err) {
      showErrorPopup(err.message);
    }
  };

  const onAssignCourses = async (classItem) => {
    try {
      await handleAssignCourses(classItem, availableCourses, setAvailableCourses);
    } catch (err) {
      showErrorPopup(err.message);
    }
  };

  const onSaveCourseAssignment = async () => {
    try {
      await handleSaveCourseAssignment();
    } catch (err) {
      showErrorPopup(err.message);
    }
  };

  return {
    onEditClass,
    onAddClass,
    onUpdateClass,
    onPerformDelete,
    onAssignCourses,
    onSaveCourseAssignment,
  };
}
