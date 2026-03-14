import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import Select, { SelectItem } from '../../ui/Select';
import { hoursFromMapping, normId, toBool } from '../../../utils/contractHelpers';

function toDateInputValue(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toNumOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function normalizeStringList(v) {
  if (Array.isArray(v)) return v.map(x => String(x || '').trim()).filter(Boolean);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(x => String(x || '').trim()).filter(Boolean);
    } catch {
      // fallthrough
    }
    return [s];
  }
  return [];
}

function extractTeachingCourses(contract) {
  const list = Array.isArray(contract?.courses) ? contract.courses : [];
  return list
    .map((c) => {
      const courseId = c?.course_id ?? c?.Course?.id ?? c?.Course?.course_id ?? null;
      const classId = c?.class_id ?? c?.Class?.id ?? null;
      const courseName =
        c?.course_name ??
        c?.Course?.course_name ??
        c?.Course?.name ??
        c?.Course?.course_title ??
        '';
      const yearLevel = c?.year_level ?? contract?.year_level ?? null;
      const term = c?.term ?? contract?.term ?? null;
      const academicYear = c?.academic_year ?? contract?.academic_year ?? null;
      const hours = c?.hours ?? c?.TeachingContractCourse?.hours ?? null;
      return {
        course_id: courseId != null ? Number(courseId) : null,
        class_id: classId != null ? Number(classId) : null,
        course_name: String(courseName || ''),
        year_level: yearLevel != null && yearLevel !== '' ? Number(yearLevel) : null,
        term: term != null ? term : null,
        academic_year: academicYear != null ? String(academicYear) : null,
        hours: hours != null && hours !== '' ? Number(hours) : null,
      };
    })
    .filter((c) => c.course_id != null);
}

function isAdvisorContract(contract) {
  const t = String(contract?.contract_type || '').toUpperCase();
  return t === 'ADVISOR';
}

export default function ContractRedoEditDialog({
  open,
  onOpenChange,
  contract,
  onSave,
  currentAcademicYear,
  mappings,
  mappingsByYear,
  fetchMappingsForYear,
  mappingUserId,
}) {
  const advisor = useMemo(() => isAdvisorContract(contract), [contract]);

  const contractLecturerId = useMemo(() => {
    return normId(contract?.lecturer_user_id ?? contract?.lecturer?.user_id ?? contract?.lecturer?.id ?? null);
  }, [contract]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Teaching fields
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

  // Advisor fields
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

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const toNullablePositiveInt = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const i = Math.trunc(n);
    return i > 0 ? i : null;
  };

  const toNullableInt = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  };

  const normalizeTeachingCoursesForApi = (courseList = [], fallbackAcademicYear) => {
    const arr = Array.isArray(courseList) ? courseList : [];
    return arr
      .map((c) => {
        const courseId = toNullablePositiveInt(c?.course_id ?? c?.Course?.id ?? c?.course?.id);
        if (!courseId) return null;
        const classId = toNullablePositiveInt(c?.class_id ?? c?.Class?.id ?? c?.class?.id);
        const yearLevel = toNullablePositiveInt(c?.year_level);
        const term = toNullableInt(c?.term);
        const academicYearRaw = String(c?.academic_year ?? fallbackAcademicYear ?? '').trim();
        const hours = toNullablePositiveInt(c?.hours);
        const courseName = String(c?.course_name ?? c?.Course?.name ?? c?.course?.name ?? '').trim();

        return {
          course_id: courseId,
          class_id: classId,
          course_name: courseName || undefined,
          year_level: yearLevel,
          term,
          academic_year: academicYearRaw || undefined,
          hours,
        };
      })
      .filter(Boolean);
  };

  const formatAxiosError = (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const apiErrors = Array.isArray(data?.errors) ? data.errors : [];
    if (status === 400 && apiErrors.length) {
      const combined = apiErrors
        .map((e) => {
          const p = e?.path ? `${e.path}: ` : '';
          return `${p}${e?.message || ''}`.trim();
        })
        .filter(Boolean)
        .join('\n');
      return combined || data?.message || 'Validation failed';
    }
    return data?.message || err?.message || 'Request failed';
  };

  const canSelectFromMappings = useMemo(() => {
    return Array.isArray(mappings) || (mappingsByYear && typeof mappingsByYear === 'object');
  }, [mappings, mappingsByYear]);

  const effectiveTeachYear = useMemo(() => {
    return String(teachAcademicYear || contract?.academic_year || currentAcademicYear || '').trim();
  }, [teachAcademicYear, contract, currentAcademicYear]);

  const yearMappings = useMemo(() => {
    const year = String(effectiveTeachYear || '').trim();
    if (!year) return [];
    if (currentAcademicYear && year === String(currentAcademicYear)) {
      return Array.isArray(mappings) ? mappings : [];
    }
    const other = mappingsByYear && typeof mappingsByYear === 'object' ? mappingsByYear?.[year] : null;
    return Array.isArray(other) ? other : [];
  }, [effectiveTeachYear, currentAcademicYear, mappings, mappingsByYear]);

  const filteredMappings = useMemo(() => {
    const q = String(courseQuery || '').toLowerCase().trim();
    const list = Array.isArray(yearMappings) ? yearMappings : [];
    return list.filter((m) => {
      const st = String(m?.status || '').toLowerCase();
      if (st && st !== 'accepted') return false;
      if (contractLecturerId && typeof mappingUserId === 'function') {
        const mid = mappingUserId(m);
        if (mid && mid !== contractLecturerId) return false;
      }
      if (!q) return true;
      const cname = (m?.course?.name || '').toLowerCase();
      const ccode = (m?.course?.code || '').toLowerCase();
      const cls = (m?.class?.name || '').toLowerCase();
      const meta = `${m?.term || ''} ${m?.year_level || ''}`.toLowerCase();
      return cname.includes(q) || ccode.includes(q) || cls.includes(q) || meta.includes(q);
    });
  }, [yearMappings, courseQuery, contractLecturerId, mappingUserId]);

  useEffect(() => {
    if (!open) return;
    if (advisor) return;
    if (!effectiveTeachYear) return;
    if (!/^\d{4}-\d{4}$/.test(String(effectiveTeachYear))) return;
    if (currentAcademicYear && effectiveTeachYear === String(currentAcademicYear)) return;
    if (typeof fetchMappingsForYear === 'function') fetchMappingsForYear(effectiveTeachYear);
  }, [open, advisor, effectiveTeachYear, currentAcademicYear, fetchMappingsForYear]);

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setSubmitError('');
    setSaving(false);

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

      // Teaching state reset
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
    } else {
      setRole('ADVISOR');
      const baseYear = String(contract?.academic_year || currentAcademicYear || '').trim();
      setTeachAcademicYear(baseYear);
      setCourseQuery('');
      setSelectedMappingIds(new Set());
      setCombineByMapping({});
      setDidInitSelection(false);

      setItems(normalizeStringList(contract?.items));
      setItemInput('');
      setEditingItemIdx(null);
      setEditingItemValue('');
      setCourses(extractTeachingCourses(contract));

      // Advisor state reset
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
    }
  }, [open, contract, advisor, currentAcademicYear]);

  useEffect(() => {
    if (!open) return;
    if (advisor) return;
    if (didInitSelection) return;
    if (!canSelectFromMappings) {
      setDidInitSelection(true);
      return;
    }
    if (!Array.isArray(yearMappings) || yearMappings.length === 0) return;

    const courseArr = Array.isArray(contract?.courses) ? contract.courses : [];
    const toKey = (courseId, classId) => `${normId(courseId) || ''}:${normId(classId) || ''}`;
    const existingKeys = new Set(
      courseArr.map((c) =>
        toKey(
          c?.course_id ?? c?.Course?.id ?? c?.Course?.course_id,
          c?.class_id ?? c?.Class?.id
        )
      )
    );

    const nextSelected = new Set();
    const nextCombine = {};

    for (const m of yearMappings) {
      if (contractLecturerId && typeof mappingUserId === 'function') {
        const mid = mappingUserId(m);
        if (mid && mid !== contractLecturerId) continue;
      }
      const key = toKey(m?.course?.id ?? m?.course_id, m?.class?.id ?? m?.class_id);
      if (!existingKeys.has(key)) continue;
      nextSelected.add(m.id);

      const match = courseArr.find((c) =>
        toKey(
          c?.course_id ?? c?.Course?.id ?? c?.Course?.course_id,
          c?.class_id ?? c?.Class?.id
        ) === key
      );
      if (match && match?.theory_combined != null) {
        nextCombine[m.id] = toBool(match.theory_combined);
      }
    }

    setSelectedMappingIds(nextSelected);
    setCombineByMapping(nextCombine);
    setDidInitSelection(true);
  }, [
    open,
    advisor,
    didInitSelection,
    canSelectFromMappings,
    yearMappings,
    contract,
    contractLecturerId,
    mappingUserId,
  ]);

  const addItem = () => {
    const txt = String(itemInput || '').trim();
    if (!txt) return;
    setItems(prev => [...(prev || []), txt]);
    setItemInput('');
  };

  const startEditItem = (idx) => {
    setEditingItemIdx(idx);
    setEditingItemValue(items?.[idx] || '');
  };

  const commitEditItem = () => {
    if (editingItemIdx == null) return;
    const nextTxt = String(editingItemValue || '').trim();
    setItems(prev => {
      const next = [...(prev || [])];
      if (!nextTxt) next.splice(editingItemIdx, 1);
      else next[editingItemIdx] = nextTxt;
      return next;
    });
    setEditingItemIdx(null);
    setEditingItemValue('');
  };

  const removeItem = (idx) => {
    setItems(prev => (prev || []).filter((_, i) => i !== idx));
  };

  const updateCourseHours = (idx, raw) => {
    const n = raw === '' ? null : parseInt(String(raw), 10);
    setCourses(prev => {
      const next = [...(prev || [])];
      next[idx] = { ...next[idx], hours: Number.isFinite(n) ? n : null };
      return next;
    });
  };

  const addDuty = () => {
    const txt = String(dutyInput || '').trim();
    if (!txt) return;
    setDuties(prev => [...(prev || []), txt]);
    setDutyInput('');
  };

  const updateStudent = (idx, patch) => {
    setStudents(prev => {
      const next = [...(prev || [])];
      next[idx] = { ...(next[idx] || {}), ...patch };
      return next;
    });
  };

  const addStudent = () => {
    setStudents(prev => [...(prev || []), { student_name: '', student_code: '', project_title: '', company_name: '' }]);
  };

  const removeStudent = (idx) => {
    setStudents(prev => (prev || []).filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!contract?.id) return;

    const nextErrors = {};
    setSubmitError('');

    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      if (!Number.isNaN(sd.getTime()) && !Number.isNaN(ed.getTime()) && ed <= sd) {
        nextErrors.endDate = 'End date must be after start date';
      }
    }

    if (advisor) {
      if (!role) nextErrors.role = 'Role is required';
      const dutyList = normalizeStringList(duties);
      if (!dutyList.length) nextErrors.duties = 'Please add at least one duty';
      const studentList = Array.isArray(students) ? students : [];
      if (!studentList.length) nextErrors.students = 'Please add at least one student';
      if (studentList.some(s => !String(s?.student_name || '').trim() || !String(s?.project_title || '').trim() || !String(s?.company_name || '').trim())) {
        nextErrors.students = 'Each student must include name, project title, and company name';
      }
      if (!(capstone1 || capstone2 || internship1 || internship2)) {
        nextErrors.responsibilities = 'Select at least one responsibility';
      }
      if (toNumOrNull(hoursPerStudent) == null) nextErrors.hoursPerStudent = 'Hours per student is required';
      if (toNumOrNull(hourlyRate) == null) nextErrors.hourlyRate = 'Hourly rate is required';

      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;

      const payload = {
        role,
        hourly_rate: toNumOrNull(hourlyRate),
        capstone_1: !!capstone1,
        capstone_2: !!capstone2,
        internship_1: !!internship1,
        internship_2: !!internship2,
        hours_per_student: (() => {
          const n = parseInt(String(hoursPerStudent), 10);
          return Number.isFinite(n) ? n : null;
        })(),
        students: studentList,
        start_date: startDate || null,
        end_date: endDate || null,
        duties: dutyList,
        join_judging_hours: (() => {
          if (!String(joinJudgingHours || '').trim()) return null;
          const n = parseInt(String(joinJudgingHours), 10);
          return Number.isFinite(n) ? n : null;
        })(),
      };

      setSaving(true);
      try {
        await onSave?.(contract, payload);
        onOpenChange(false);
      } catch (err) {
        setSubmitError(formatAxiosError(err));
      } finally {
        setSaving(false);
      }
      return;
    }

    // Teaching
    const itemList = normalizeStringList(items);
    if (!itemList.length) nextErrors.items = 'Please add at least one duty';

    const toKey = (courseId, classId) => `${normId(courseId) || ''}:${normId(classId) || ''}`;

    const existingCourseList = Array.isArray(courses) ? courses : [];
    let nextCourseList = existingCourseList;
    let derivedTerm = contract?.term ?? null;
    let derivedYearLevel = contract?.year_level ?? null;

    if (canSelectFromMappings) {
      const selectedList = (Array.isArray(yearMappings) ? yearMappings : [])
        .filter((m) => selectedMappingIds.has(m.id))
        .filter((m) => {
          if (!contractLecturerId || typeof mappingUserId !== 'function') return true;
          const mid = mappingUserId(m);
          return !mid || mid === contractLecturerId;
        });

      const selectedCoursesPayload = selectedList.map((m) => {
        const typeHoursStr = String(m.type_hours || '');
        const th = String(m.theory_hours || '').toLowerCase();
        const theory15 = th === '15h' || (!th && /15h/i.test(typeHoursStr));
        const theory30 = th === '30h' || (!th && /30h/i.test(typeHoursStr));
        const theoryGroups = Number(m.theory_groups ?? m.groups_15h ?? m.groups_theory ?? m.group_count_theory ?? 0) || 0;
        const canCombineTheory = (theory15 || theory30) && theoryGroups > 1;
        const combined = canCombineTheory ? !!(combineByMapping?.[m.id] ?? m.theory_combined) : false;
        const hours = hoursFromMapping({ ...m, theory_combined: combined });

        return {
          course_id: m.course?.id,
          class_id: m.class?.id,
          course_name: m.course?.name,
          year_level: m.year_level,
          term: m.term,
          academic_year: m.academic_year,
          theory_combined: combined,
          hours,
        };
      });

      const selectedKeys = new Set(selectedCoursesPayload.map((c) => toKey(c.course_id, c.class_id)));
      const preserved = existingCourseList.filter((c) => !selectedKeys.has(toKey(c.course_id, c.class_id)));
      nextCourseList = [...selectedCoursesPayload, ...preserved];

      const first = selectedCoursesPayload[0] || preserved[0] || null;
      if (first?.term != null) derivedTerm = first.term;
      if (first?.year_level != null) derivedYearLevel = first.year_level;
    }

    const normalizedCourses = normalizeTeachingCoursesForApi(nextCourseList, effectiveTeachYear);
    if (!normalizedCourses.length) nextErrors.courses = 'Please select at least one course';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const derivedTermNum = toNullableInt(derivedTerm);
    const derivedYearLevelNum = toNullablePositiveInt(derivedYearLevel);

    const payload = {
      ...(effectiveTeachYear ? { academic_year: effectiveTeachYear } : {}),
      ...(derivedTermNum != null ? { term: derivedTermNum } : {}),
      ...(derivedYearLevelNum != null ? { year_level: derivedYearLevelNum } : {}),
      start_date: startDate || null,
      end_date: endDate || null,
      items: itemList,
      ...(normalizedCourses.length ? { courses: normalizedCourses } : {}),
    };

    setSaving(true);
    try {
      await onSave?.(contract, payload);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(formatAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = !!contract?.id && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 my-4">
        <DialogHeader>
          <DialogTitle>Edit contract (Redo requested)</DialogTitle>
          <DialogDescription>
            Update the contract and resubmit it for signature.
          </DialogDescription>
        </DialogHeader>

        {submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-line">
            {submitError}
          </div>
        ) : null}

        {advisor ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Start date</div>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">End date</div>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                {errors.endDate ? <div className="text-xs text-red-600">{errors.endDate}</div> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Role</div>
                <Select
                  className="w-full cursor-pointer"
                  value={role}
                  onValueChange={(v) => {
                    setRole(v);
                    setErrors(prev => ({ ...(prev || {}), role: '' }));
                  }}
                  placeholder="Select role"
                >
                  <SelectItem value="ADVISOR">ADVISOR</SelectItem>
                  <SelectItem value="LECTURE">LECTURE</SelectItem>
                </Select>
                {errors.role ? <div className="text-xs text-red-600">{errors.role}</div> : null}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Hourly rate</div>
                <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 12.5" />
                {errors.hourlyRate ? <div className="text-xs text-red-600">{errors.hourlyRate}</div> : null}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Hours per student</div>
                <Input value={hoursPerStudent} onChange={(e) => setHoursPerStudent(e.target.value)} placeholder="e.g. 6" />
                {errors.hoursPerStudent ? <div className="text-xs text-red-600">{errors.hoursPerStudent}</div> : null}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Join judging hours (per student)</div>
                <Input value={joinJudgingHours} onChange={(e) => setJoinJudgingHours(e.target.value)} placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Responsibilities</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox checked={capstone1} onCheckedChange={(v) => setCapstone1(!!v)} /> Capstone 1
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox checked={capstone2} onCheckedChange={(v) => setCapstone2(!!v)} /> Capstone 2
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox checked={internship1} onCheckedChange={(v) => setInternship1(!!v)} /> Internship 1
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox checked={internship2} onCheckedChange={(v) => setInternship2(!!v)} /> Internship 2
                </label>
              </div>
              {errors.responsibilities ? <div className="text-xs text-red-600">{errors.responsibilities}</div> : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Students</div>
                <Button variant="secondary" size="sm" onClick={addStudent}>Add student</Button>
              </div>
              {errors.students ? <div className="text-xs text-red-600">{errors.students}</div> : null}
              <div className="space-y-3">
                {(students || []).map((s, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={s?.student_name || ''}
                        onChange={(e) => updateStudent(idx, { student_name: e.target.value })}
                        placeholder="Student name"
                      />
                      <Input
                        value={s?.student_code || ''}
                        onChange={(e) => updateStudent(idx, { student_code: e.target.value })}
                        placeholder="Student code (optional)"
                      />
                      <Input
                        value={s?.project_title || ''}
                        onChange={(e) => updateStudent(idx, { project_title: e.target.value })}
                        placeholder="Project / Topic title"
                      />
                      <Input
                        value={s?.company_name || ''}
                        onChange={(e) => updateStudent(idx, { company_name: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="danger" size="sm" onClick={() => removeStudent(idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Duties</div>
              {errors.duties ? <div className="text-xs text-red-600">{errors.duties}</div> : null}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={dutyInput} onChange={(e) => setDutyInput(e.target.value)} placeholder="Add a duty" />
                <Button className="w-full sm:w-auto" variant="secondary" onClick={addDuty}>Add</Button>
              </div>
              <div className="space-y-2">
                {(duties || []).map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                    <div className="text-sm text-gray-800 truncate">{d}</div>
                    <Button variant="danger" size="sm" onClick={() => setDuties(prev => (prev || []).filter((_, i) => i !== idx))}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-2">
              <Button className="w-full sm:w-auto" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={!canSubmit}>Save & resend</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {canSelectFromMappings ? (
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Academic year</div>
                <Input
                  value={effectiveTeachYear}
                  onChange={(e) => {
                    setTeachAcademicYear(e.target.value);
                    setDidInitSelection(false);
                    setSelectedMappingIds(new Set());
                    setCombineByMapping({});
                    setErrors(prev => ({ ...(prev || {}), courses: '' }));
                  }}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Start date</div>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">End date</div>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                {errors.endDate ? <div className="text-xs text-red-600">{errors.endDate}</div> : null}
              </div>
            </div>

            {canSelectFromMappings ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Courses to include</div>
                {errors.courses ? <div className="text-xs text-red-600">{errors.courses}</div> : null}

                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      className="w-full pl-9"
                      placeholder="Search by course name/code or class…"
                      value={courseQuery}
                      onChange={(e) => setCourseQuery(e.target.value)}
                    />
                  </div>
                  {courseQuery ? (
                    <button
                      type="button"
                      onClick={() => setCourseQuery('')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <div className="rounded-lg border border-gray-200 max-h-56 overflow-y-auto divide-y bg-white">
                  {filteredMappings.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No courses found for {effectiveTeachYear || 'this year'}.</div>
                  ) : (
                    filteredMappings.map((m) => {
                      const checked = selectedMappingIds.has(m.id);
                      const typeHoursStr = String(m.type_hours || '');
                      const th = String(m.theory_hours || '').toLowerCase();
                      const theory15 = th === '15h' || (!th && /15h/i.test(typeHoursStr));
                      const theory30 = th === '30h' || (!th && /30h/i.test(typeHoursStr));
                      const theoryGroups = Number(m.theory_groups ?? m.groups_15h ?? m.groups_theory ?? m.group_count_theory ?? 0) || 0;
                      const canCombineTheory = (theory15 || theory30) && theoryGroups > 1;
                      const combined = canCombineTheory ? !!(combineByMapping?.[m.id] ?? m.theory_combined) : false;
                      const computedHours = hoursFromMapping({ ...m, theory_combined: combined });

                      return (
                        <div key={m.id} className="p-3 hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`redo-map-${m.id}`}
                              checked={checked}
                              onCheckedChange={() => {
                                const next = new Set(Array.from(selectedMappingIds || []));
                                if (checked) next.delete(m.id);
                                else next.add(m.id);
                                setSelectedMappingIds(next);
                                setErrors(prev => ({ ...(prev || {}), courses: '' }));
                              }}
                            />
                            <div className="flex-1 text-sm">
                              <div className="font-medium text-gray-900">
                                {m.course?.name}{' '}
                                <span className="text-gray-500 font-normal">({computedHours || '-'}h)</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {m.class?.name || 'Class'} • Year {m.year_level} • Term {m.term} • {m.academic_year}
                              </div>
                              {canCombineTheory ? (
                                <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-700 select-none">
                                  <Checkbox
                                    checked={combined}
                                    onCheckedChange={(v) => setCombineByMapping(prev => ({ ...(prev || {}), [m.id]: !!v }))}
                                  />
                                  Combine groups into 1 class
                                  <span className="text-gray-500">({theory15 ? '15h' : '30h'})</span>
                                </label>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Courses (hours)</div>
                {errors.courses ? <div className="text-xs text-red-600">{errors.courses}</div> : null}
                <div className="rounded-lg border border-gray-200 divide-y">
                  {(courses || []).map((c, idx) => (
                    <div key={`${c.course_id}-${idx}`} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{c.course_name || `Course ${c.course_id}`}</div>
                        <div className="text-xs text-gray-500 truncate">{c.academic_year || ''}</div>
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          min={0}
                          value={c.hours ?? ''}
                          onChange={(e) => updateCourseHours(idx, e.target.value)}
                          placeholder="Hours"
                        />
                      </div>
                    </div>
                  ))}
                  {!(courses || []).length ? (
                    <div className="p-3 text-sm text-gray-500">No courses available to edit.</div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Duties</div>
              {errors.items ? <div className="text-xs text-red-600">{errors.items}</div> : null}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={itemInput} onChange={(e) => setItemInput(e.target.value)} placeholder="Add a duty" />
                <Button className="w-full sm:w-auto" variant="secondary" onClick={addItem}>Add</Button>
              </div>

              <div className="space-y-2">
                {(items || []).map((it, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 px-3 py-2">
                    {editingItemIdx === idx ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input value={editingItemValue} onChange={(e) => setEditingItemValue(e.target.value)} />
                        <Button className="w-full sm:w-auto" variant="secondary" size="sm" onClick={commitEditItem}>Save</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-gray-800 truncate">{it}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => startEditItem(idx)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => removeItem(idx)}>Remove</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-2">
              <Button className="w-full sm:w-auto" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={!canSubmit}>Save & resend</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
