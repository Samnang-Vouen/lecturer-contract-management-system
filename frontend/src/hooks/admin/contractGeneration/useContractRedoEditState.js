import { useEffect, useMemo, useState } from 'react';
import { normId } from '../../../utils/contractHelpers';
import { extractTeachingCourses, isAdvisorContract, normalizeStringList, toDateInputValue } from './contractRedoEdit.helpers';

export function useContractRedoEditState({ open, contract, currentAcademicYear }) {
  const advisor = useMemo(() => isAdvisorContract(contract), [contract]);
  const contractLecturerId = useMemo(() => normId(contract?.lecturer_user_id ?? contract?.lecturer?.user_id ?? contract?.lecturer?.id ?? null), [contract]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState([]);
  const [itemInput, setItemInput] = useState('');
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [editingItemValue, setEditingItemValue] = useState('');
  const [courses, setCourses] = useState([]);
  const [teachAcademicYear, setTeachAcademicYear] = useState('');
  const [courseQuery, setCourseQuery] = useState('');
  const [selectedMappingIds, setSelectedMappingIds] = useState(new Set());
  const [combineByMapping, setCombineByMapping] = useState({});
  const [didInitSelection, setDidInitSelection] = useState(false);
  const [role, setRole] = useState('ADVISOR');
  const [hourlyRate, setHourlyRate] = useState('');
  const [capstone1, setCapstone1] = useState(false);
  const [capstone2, setCapstone2] = useState(false);
  const [internship1, setInternship1] = useState(false);
  const [internship2, setInternship2] = useState(false);
  const [hoursPerStudent, setHoursPerStudent] = useState('');
  const [joinJudgingHours, setJoinJudgingHours] = useState('');
  const [students, setStudents] = useState([]);
  const [duties, setDuties] = useState([]);
  const [dutyInput, setDutyInput] = useState('');

  useEffect(() => {
    if (!open) return;
    setStartDate(toDateInputValue(contract?.start_date));
    setEndDate(toDateInputValue(contract?.end_date));

    if (advisor) {
      setRole(String(contract?.role || 'ADVISOR').toUpperCase() === 'LECTURE' ? 'LECTURE' : 'ADVISOR');
      setHourlyRate(contract?.hourly_rate != null ? String(contract.hourly_rate) : '');
      setCapstone1(!!contract?.capstone_1);
      setCapstone2(!!contract?.capstone_2);
      setInternship1(!!contract?.internship_1);
      setInternship2(!!contract?.internship_2);
      setHoursPerStudent(contract?.hours_per_student != null ? String(contract.hours_per_student) : '');
      setJoinJudgingHours(contract?.join_judging_hours != null ? String(contract.join_judging_hours) : '');
      setStudents(Array.isArray(contract?.students) ? contract.students : []);
      setDuties(normalizeStringList(contract?.duties));
      setDutyInput('');
      setItems([]);
      setItemInput('');
      setEditingItemIdx(null);
      setEditingItemValue('');
      setCourses([]);
      setTeachAcademicYear('');
      setCourseQuery('');
      setSelectedMappingIds(new Set());
      setCombineByMapping({});
      setDidInitSelection(false);
      return;
    }

    setRole('ADVISOR');
    setTeachAcademicYear(String(contract?.academic_year || currentAcademicYear || '').trim());
    setCourseQuery('');
    setSelectedMappingIds(new Set());
    setCombineByMapping({});
    setDidInitSelection(false);
    setItems(normalizeStringList(contract?.items));
    setItemInput('');
    setEditingItemIdx(null);
    setEditingItemValue('');
    setCourses(extractTeachingCourses(contract));
    setHourlyRate('');
    setCapstone1(false);
    setCapstone2(false);
    setInternship1(false);
    setInternship2(false);
    setHoursPerStudent('');
    setJoinJudgingHours('');
    setStudents([]);
    setDuties([]);
    setDutyInput('');
  }, [open, contract, advisor, currentAcademicYear]);

  const addItem = () => {
    const nextItem = String(itemInput || '').trim();
    if (!nextItem) return;
    setItems((prev) => [...(prev || []), nextItem]);
    setItemInput('');
  };

  const startEditItem = (idx) => {
    setEditingItemIdx(idx);
    setEditingItemValue(items?.[idx] || '');
  };

  const commitEditItem = () => {
    if (editingItemIdx == null) return;
    const nextItem = String(editingItemValue || '').trim();
    setItems((prev) => {
      const next = [...(prev || [])];
      if (!nextItem) next.splice(editingItemIdx, 1);
      else next[editingItemIdx] = nextItem;
      return next;
    });
    setEditingItemIdx(null);
    setEditingItemValue('');
  };

  const removeItem = (idx) => setItems((prev) => (prev || []).filter((_, itemIdx) => itemIdx !== idx));
  const updateCourseHours = (idx, raw) => {
    const parsed = raw === '' ? null : parseInt(String(raw), 10);
    setCourses((prev) => {
      const next = [...(prev || [])];
      next[idx] = { ...next[idx], hours: Number.isFinite(parsed) ? parsed : null };
      return next;
    });
  };
  const addDuty = () => {
    const nextDuty = String(dutyInput || '').trim();
    if (!nextDuty) return;
    setDuties((prev) => [...(prev || []), nextDuty]);
    setDutyInput('');
  };
  const updateStudent = (idx, patch) => {
    setStudents((prev) => {
      const next = [...(prev || [])];
      next[idx] = { ...(next[idx] || {}), ...patch };
      return next;
    });
  };
  const addStudent = () => setStudents((prev) => [...(prev || []), { student_name: '', student_code: '', project_title: '', company_name: '' }]);
  const removeStudent = (idx) => setStudents((prev) => (prev || []).filter((_, itemIdx) => itemIdx !== idx));

  return {
    advisor,
    contractLecturerId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    items,
    setItems,
    itemInput,
    setItemInput,
    editingItemIdx,
    setEditingItemIdx,
    editingItemValue,
    setEditingItemValue,
    courses,
    setCourses,
    teachAcademicYear,
    setTeachAcademicYear,
    courseQuery,
    setCourseQuery,
    selectedMappingIds,
    setSelectedMappingIds,
    combineByMapping,
    setCombineByMapping,
    didInitSelection,
    setDidInitSelection,
    role,
    setRole,
    hourlyRate,
    setHourlyRate,
    capstone1,
    setCapstone1,
    capstone2,
    setCapstone2,
    internship1,
    setInternship1,
    internship2,
    setInternship2,
    hoursPerStudent,
    setHoursPerStudent,
    joinJudgingHours,
    setJoinJudgingHours,
    students,
    setStudents,
    duties,
    setDuties,
    dutyInput,
    setDutyInput,
    addItem,
    startEditItem,
    commitEditItem,
    removeItem,
    updateCourseHours,
    addDuty,
    updateStudent,
    addStudent,
    removeStudent,
  };
}