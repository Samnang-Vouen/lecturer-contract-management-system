import { useEffect, useState } from 'react';
import { getAdvisorDetail, listAdvisors } from '../../../services/advisor.service';
import { normId } from '../../../utils/contractHelpers';
import { parseStudentLine } from './contractGenerationDialog.helpers';

export function useContractGenerationAdvisor({ open, dlgContractType, resolveLecturerUserId, onCreateAdvisor, onOpenChange }) {
  const [advLecturerKey, setAdvLecturerKey] = useState('');
  const [advLecturerId, setAdvLecturerId] = useState('');
  const [advRole, setAdvRole] = useState('ADVISOR');
  const [advHourlyRate, setAdvHourlyRate] = useState('');
  const [advCapstone1, setAdvCapstone1] = useState(false);
  const [advCapstone2, setAdvCapstone2] = useState(false);
  const [advInternship1, setAdvInternship1] = useState(false);
  const [advInternship2, setAdvInternship2] = useState(false);
  const [advHoursPerStudent, setAdvHoursPerStudent] = useState('');
  const [advProjectTitle, setAdvProjectTitle] = useState('');
  const [advCompanyName, setAdvCompanyName] = useState('');
  const [advStudentInput, setAdvStudentInput] = useState('');
  const [advStudents, setAdvStudents] = useState([]);
  const [advEditingStudentIdx, setAdvEditingStudentIdx] = useState(null);
  const [advEditingStudentValue, setAdvEditingStudentValue] = useState('');
  const [advStartDate, setAdvStartDate] = useState('');
  const [advEndDate, setAdvEndDate] = useState('');
  const [advDutyInput, setAdvDutyInput] = useState('');
  const [advDuties, setAdvDuties] = useState([]);
  const [advEditingDutyIdx, setAdvEditingDutyIdx] = useState(null);
  const [advEditingDutyValue, setAdvEditingDutyValue] = useState('');
  const [advJoinJudgingHours, setAdvJoinJudgingHours] = useState('');
  const [advErrors, setAdvErrors] = useState({});
  const [advisorUsers, setAdvisorUsers] = useState([]);
  const [advisorUsersLoading, setAdvisorUsersLoading] = useState(false);
  const [advisorUsersLoadError, setAdvisorUsersLoadError] = useState('');

  const resetAdvisorForm = () => {
    setAdvLecturerKey('');
    setAdvLecturerId('');
    setAdvRole('ADVISOR');
    setAdvHourlyRate('');
    setAdvCapstone1(false);
    setAdvCapstone2(false);
    setAdvInternship1(false);
    setAdvInternship2(false);
    setAdvHoursPerStudent('');
    setAdvProjectTitle('');
    setAdvCompanyName('');
    setAdvStudentInput('');
    setAdvStudents([]);
    setAdvEditingStudentIdx(null);
    setAdvEditingStudentValue('');
    setAdvStartDate('');
    setAdvEndDate('');
    setAdvDutyInput('');
    setAdvDuties([]);
    setAdvEditingDutyIdx(null);
    setAdvEditingDutyValue('');
    setAdvJoinJudgingHours('');
    setAdvErrors({});
  };

  const handleAdvisorLecturerChange = async (value) => {
    setAdvLecturerKey(value);
    const resolvedUserId = resolveLecturerUserId ? resolveLecturerUserId(value) : normId(value);
    setAdvLecturerId(resolvedUserId || '');
    setAdvErrors((prev) => ({ ...prev, lecturer: '' }));
    try {
      if (!resolvedUserId) throw new Error('Lecturer user id not resolved');
      const body = await getAdvisorDetail(resolvedUserId);
      setAdvHourlyRate(body?.hourlyRateThisYear || '');
    } catch {
      setAdvHourlyRate('');
    }
  };

  const handleCreateAdvisor = async () => {
    const nextErrors = {};
    const today = new Date();
    const startDate = advStartDate ? new Date(advStartDate) : null;
    const endDate = advEndDate ? new Date(advEndDate) : null;
    today.setHours(0, 0, 0, 0);
    if (!advLecturerKey) nextErrors.lecturer = 'Lecturer is required';
    else if (!advLecturerId) nextErrors.lecturer = 'Lecturer is still loading. Please wait a moment and try again.';
    if (!advRole) nextErrors.role = 'Role is required';
    if (!advHourlyRate) nextErrors.hourlyRate = 'Hourly Rate is required';
    if (!(advCapstone1 || advCapstone2 || advInternship1 || advInternship2)) nextErrors.responsibilities = 'Please select at least one responsibility.';
    if (!advHoursPerStudent) nextErrors.hoursPerStudent = 'Number of Hour per Student is required';
    if (!advStudents.length) nextErrors.students = 'Please add at least one student.';
    else if (advStudents.some((student) => !String(student?.project_title || '').trim() || !String(student?.company_name || '').trim())) nextErrors.students = 'Each student must include Project/Topic Title and Company Name.';
    if (!startDate) nextErrors.startDate = 'Start Date is required';
    else if (startDate < today) nextErrors.startDate = 'Start Date cannot be in the past';
    if (!endDate) nextErrors.endDate = 'End Date is required';
    else if (startDate && endDate <= startDate) nextErrors.endDate = 'End Date must be after Start Date';
    if (!advDuties.length) nextErrors.duties = 'Please add at least one duty';
    setAdvErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (!onCreateAdvisor) throw new Error('Advisor contract creation is not configured');
      await onCreateAdvisor({
        lecturerId: advLecturerId,
        role: advRole,
        hourlyRate: advHourlyRate,
        capstone_1: advCapstone1,
        capstone_2: advCapstone2,
        internship_1: advInternship1,
        internship_2: advInternship2,
        hours_per_student: advHoursPerStudent,
        students: advStudents,
        start_date: advStartDate,
        end_date: advEndDate,
        duties: advDuties,
        join_judging_hours: String(advJoinJudgingHours || '').trim() ? advJoinJudgingHours : null,
      });
      resetAdvisorForm();
      onOpenChange(false);
    } catch (error) {
      const response = error?.response;
      const backendErrors = response?.data?.errors;
      const fallbackMessage = response?.data?.message || error?.message || 'Failed to create advisor contract';
      const next = {};
      if (Array.isArray(backendErrors)) {
        const text = backendErrors.map((item) => (typeof item === 'string' ? item : (item?.message || item?.path || ''))).filter(Boolean).join(', ');
        next.form = text || fallbackMessage;
      } else if (Array.isArray(backendErrors?.errors)) {
        next.form = backendErrors.errors.join(', ');
      } else {
        next.form = fallbackMessage;
      }
      setAdvErrors(next);
    }
  };

  useEffect(() => {
    if (!open || dlgContractType !== 'ADVISOR') return;
    let cancelled = false;
    (async () => {
      setAdvisorUsersLoading(true);
      setAdvisorUsersLoadError('');
      try {
        const body = await listAdvisors({ page: 1, limit: 1000 });
        if (!cancelled) setAdvisorUsers(Array.isArray(body?.data) ? body.data : []);
      } catch (error) {
        console.error('Failed to load advisors:', error);
        if (!cancelled) {
          setAdvisorUsers([]);
          setAdvisorUsersLoadError('Failed to load advisors.');
        }
      } finally {
        if (!cancelled) setAdvisorUsersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, dlgContractType]);

  return {
    advLecturerKey, setAdvLecturerKey, advLecturerId, setAdvLecturerId, advRole, setAdvRole,
    advHourlyRate, setAdvHourlyRate, advCapstone1, setAdvCapstone1, advCapstone2, setAdvCapstone2,
    advInternship1, setAdvInternship1, advInternship2, setAdvInternship2, advHoursPerStudent, setAdvHoursPerStudent,
    advProjectTitle, setAdvProjectTitle, advCompanyName, setAdvCompanyName, advStudentInput, setAdvStudentInput,
    advStudents, setAdvStudents, advEditingStudentIdx, setAdvEditingStudentIdx, advEditingStudentValue, setAdvEditingStudentValue,
    advStartDate, setAdvStartDate, advEndDate, setAdvEndDate, advDutyInput, setAdvDutyInput,
    advDuties, setAdvDuties, advEditingDutyIdx, setAdvEditingDutyIdx, advEditingDutyValue, setAdvEditingDutyValue,
    advJoinJudgingHours, setAdvJoinJudgingHours, advErrors, setAdvErrors, advisorUsers, advisorUsersLoading,
    advisorUsersLoadError, handleAdvisorLecturerChange, handleCreateAdvisor, resetAdvisorForm, parseStudentLine,
  };
}