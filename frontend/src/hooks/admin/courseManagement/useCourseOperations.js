import { useState } from 'react';
import { createCourse as apiCreateCourse, updateCourse as apiUpdateCourse, deleteCourse as apiDeleteCourse } from '../../../services/course.service.js';
import toast from 'react-hot-toast';

export function useCourseOperations(setCourses) {
  const emptyCourse = { course_code: '', course_name: '', description: '', hours: '', credits: '' };
  const [form, setForm] = useState(emptyCourse);
  const [formErrors, setFormErrors] = useState({ course_code: '', course_name: '' });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editId, setEditId] = useState(null);

  const creditsFromHours = (hours) => {
    const n = typeof hours === 'string' ? parseInt(hours, 10) : hours;
    if (!Number.isFinite(n) || n <= 0) return null;
    return n % 15 === 0 ? n / 15 : null;
  };

  const resetForm = () => {
    setForm(emptyCourse);
    setFormErrors({ course_code: '', course_name: '' });
    setEditId(null);
  };

  const prepareAddForm = () => {
    resetForm();
  };

  const prepareEditForm = (course) => {
    setEditId(course.id);
    setFormErrors({ course_code: '', course_name: '' });
    const hrs = course.hours ?? '';
    const derived = hrs !== '' ? creditsFromHours(hrs) : null;
    setForm({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || '',
      hours: hrs,
      credits: derived ?? (course.credits || '')
    });
  };

  const submitAdd = async () => {
    if (!form.course_code || !form.course_name) {
      toast.error('Course code and name are required');
      return false;
    }
    
    setCreating(true);
    try {
      const hoursVal = form.hours ? Number(form.hours) : null;
      const derivedCredits = hoursVal ? creditsFromHours(hoursVal) : null;
      const payload = { ...form, hours: hoursVal, credits: derivedCredits ?? null };
      const res = await apiCreateCourse(payload);
      
      setCourses(prev => [res.data.course, ...prev]);
      toast.success('Course added successfully');
      resetForm();
      return true;
    } catch (e) {
      const msg = e?.response?.data?.message;
      if (e?.response?.status === 409 && typeof msg === 'string') {
        if (msg.toLowerCase().includes('code')) {
          setFormErrors(err => ({ ...err, course_code: msg }));
        }
        if (msg.toLowerCase().includes('name')) {
          setFormErrors(err => ({ ...err, course_name: msg }));
        }
      }
      toast.error(msg || 'Failed to add course');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const submitEdit = async () => {
    if (!editId) return false;
    if (!form.course_code || !form.course_name) {
      toast.error('Course code and name are required');
      return false;
    }
    
    setUpdating(true);
    try {
      const hoursVal = form.hours ? Number(form.hours) : null;
      const derivedCredits = hoursVal ? creditsFromHours(hoursVal) : null;
      const payload = { ...form, hours: hoursVal, credits: derivedCredits ?? null };
      const res = await apiUpdateCourse(editId, payload);
      
      setCourses(prev => prev.map(c => c.id === editId ? res.data.course : c));
      toast.success('Course updated successfully');
      resetForm();
      return true;
    } catch (e) {
      const msg = e?.response?.data?.message;
      if (e?.response?.status === 409 && typeof msg === 'string') {
        if (msg.toLowerCase().includes('code')) {
          setFormErrors(err => ({ ...err, course_code: msg }));
        }
        if (msg.toLowerCase().includes('name')) {
          setFormErrors(err => ({ ...err, course_name: msg }));
        }
      }
      toast.error(msg || 'Failed to update course');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const deleteCourse = async (id) => {
    setDeletingId(id);
    try {
      await apiDeleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast.success('Course deleted successfully');
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete course');
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  return {
    form,
    setForm,
    formErrors,
    setFormErrors,
    creating,
    updating,
    deletingId,
    editId,
    creditsFromHours,
    prepareAddForm,
    prepareEditForm,
    submitAdd,
    submitEdit,
    deleteCourse,
    resetForm
  };
}
