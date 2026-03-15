import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select, { SelectItem } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Search, Calendar, Pencil, Trash2, Plus } from 'lucide-react';
import { getLecturerDetail } from '../../../services/lecturer.service';
import { listAdvisors, getAdvisorDetail } from '../../../services/advisor.service';
import { hoursFromMapping, toBool, normId } from '../../../utils/contractHelpers';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/Tabs';

/**
 * ContractGenerationDialog - Dialog for creating new contracts
 */
export default function ContractGenerationDialog({
  open,
  onOpenChange,
  academicYear,
  onAcademicYearChange,
  lecturers,
  mappings,
  mappingUserId,
  resolveLecturerUserId,
  onCreate,
  onCreateAdvisor
}) {
  const [dlgContractType, setDlgContractType] = useState('LECTURER');

  const [dlgLecturerKey, setDlgLecturerKey] = useState('');
  const [dlgLecturerId, setDlgLecturerId] = useState('');
  const [dlgHourlyRate, setDlgHourlyRate] = useState('');
  const [dlgStartDate, setDlgStartDate] = useState('');
  const [dlgEndDate, setDlgEndDate] = useState('');
  const [dlgItemInput, setDlgItemInput] = useState('');
  const [dlgItems, setDlgItems] = useState([]);
  const [dlgEditingItemIdx, setDlgEditingItemIdx] = useState(null);
  const [dlgEditingItemValue, setDlgEditingItemValue] = useState('');
  const [dlgErrors, setDlgErrors] = useState({});
  const [dlgSelectedMappingIds, setDlgSelectedMappingIds] = useState(new Set());
  const [dlgCourseQuery, setDlgCourseQuery] = useState('');
  const [dlgCombineByMapping, setDlgCombineByMapping] = useState({});

  // Advisor contract state (separate feature)
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

  const startRef = useRef(null);
  const endRef = useRef(null);

  const mappingNaturalKey = useCallback((m) => {
    const courseId = normId(m?.course?.id);
    const classId = normId(m?.class?.id);
    const yearLevel = String(m?.year_level ?? '').trim();
    const term = String(m?.term ?? '').trim();
    const year = String(m?.academic_year ?? m?.class?.academic_year ?? '').trim();
    return `${courseId || ''}|${classId || ''}|${yearLevel}|${term}|${year}`;
  }, []);

  const dedupeByKey = useCallback((rows, getKey) => {
    const out = [];
    const seen = new Set();
    for (const r of (rows || [])) {
      const k = getKey(r);
      if (!k) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
    return out;
  }, []);

  const dlgFilteredMappings = useMemo(() => {
    const q = (dlgCourseQuery || '').toLowerCase();
    const list = (mappings || []).filter(m => {
      const st = String(m.status || '').toLowerCase();
      if (st !== 'accepted') return false;
      if (dlgLecturerKey) {
        const key = String(dlgLecturerKey);
        if (key.startsWith('profile:')) {
          const selPid = normId(key.slice('profile:'.length));
          const mpid = normId(m?.lecturer_profile_id ?? m?.lecturer?.id);
          if (selPid && mpid && selPid !== mpid) return false;
        } else {
          const lid = mappingUserId(m);
          if (normId(key) !== lid) return false;
        }
      }
      if (!q) return true;
      const cname = m.course?.name?.toLowerCase() || '';
      const ccode = m.course?.code?.toLowerCase() || '';
      const cls = m.class?.name?.toLowerCase() || '';
      const meta = `${m.term || ''} ${m.year_level || ''}`.toLowerCase();
      return cname.includes(q) || ccode.includes(q) || cls.includes(q) || meta.includes(q);
    });
    // Prevent duplicated-looking rows if backend has duplicated mapping records.
    return dedupeByKey(list, mappingNaturalKey);
  }, [mappings, dlgCourseQuery, dlgLecturerKey, mappingUserId, dedupeByKey, mappingNaturalKey]);

  const handleCreateLecturer = async () => {
    const errs = {};
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const sd = dlgStartDate ? new Date(dlgStartDate) : null;
    const ed = dlgEndDate ? new Date(dlgEndDate) : null;
    
    if (!dlgLecturerKey) errs.lecturer = 'Lecturer is required';
    else if (!dlgLecturerId) errs.lecturer = 'Lecturer is still loading. Please wait a moment and try again.';
    if (!sd) errs.startDate = 'Start Date is required';
    else if (sd < today) errs.startDate = 'Start Date cannot be in the past';
    if (!ed) errs.endDate = 'End Date is required';
    else if (sd && ed <= sd) errs.endDate = 'End Date must be after Start Date';
    if (!dlgItems || dlgItems.length === 0) errs.description = 'Please add at least one duty';
    
    const selectedMappingsRaw = (mappings || []).filter(m => dlgSelectedMappingIds.has(m.id));
    const selectedMappings = dedupeByKey(selectedMappingsRaw, mappingNaturalKey);
    if (selectedMappings.length === 0) errs.courses = 'Please select at least one course to include in this contract.';
    
    setDlgErrors(errs);
    if (Object.keys(errs).length) return;

    const selectedCoursesPayload = selectedMappings.map(m => {
      const combined = (dlgCombineByMapping?.[m.id] != null) ? !!dlgCombineByMapping[m.id] : toBool(m.theory_combined);
      const hours = hoursFromMapping({ ...m, theory_combined: combined });
      return {
        course_id: m.course?.id,
        class_id: m.class?.id,
        course_name: m.course?.name,
        year_level: m.year_level,
        term: m.term,
        academic_year: m.academic_year,
        theory_combined: combined,
        hours
      };
    });

    try {
      await onCreate({
        lecturerId: dlgLecturerId,
        courses: selectedCoursesPayload,
        start_date: dlgStartDate,
        end_date: dlgEndDate,
        items: dlgItems,
        hourly_rate: (() => { const n = parseFloat(String(dlgHourlyRate || '').trim()); return Number.isFinite(n) ? n : null; })(),
      });
      
      // Reset form
      setDlgLecturerKey('');
      setDlgLecturerId('');
      setDlgHourlyRate('');
      setDlgStartDate('');
      setDlgEndDate('');
      setDlgItems([]);
      setDlgItemInput('');
      setDlgEditingItemIdx(null);
      setDlgEditingItemValue('');
      setDlgSelectedMappingIds(new Set());
      setDlgCombineByMapping({});
      setDlgErrors({});
      onOpenChange(false);
    } catch (e) {
      const resp = e?.response;
      const message = resp?.data?.message || 'Failed to create contract';
      const backendErrors = resp?.data?.errors;
      const nextErrs = {};
      
      // Log the full error response for debugging
      console.error('Create contract failed:', e);
      console.error('Response data:', resp?.data);
      console.error('Backend errors:', backendErrors);
      
      if (Array.isArray(backendErrors)) {
        const text = backendErrors.join(', ');
        if (/lecturer_user_id/i.test(text)) nextErrs.lecturer = 'Lecturer is required';
        if (/course/i.test(text)) nextErrs.courses = 'Please select at least one valid course';
        if (/term/i.test(text)) nextErrs.term = 'Term is required';
        if (!Object.keys(nextErrs).length) nextErrs.form = text;
      } else {
        nextErrs.form = message;
      }
      
      setDlgErrors(nextErrs);
    }
  };

  const parseStudentLine = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return null;
    const parts = s.split(',').map(x => x.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { student_name: parts.slice(0, -1).join(', '), student_code: parts[parts.length - 1] };
    }
    return { student_name: s, student_code: '' };
  };

  const handleCreateAdvisor = async () => {
    const errs = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sd = advStartDate ? new Date(advStartDate) : null;
    const ed = advEndDate ? new Date(advEndDate) : null;

    if (!advLecturerKey) errs.lecturer = 'Lecturer is required';
    else if (!advLecturerId) errs.lecturer = 'Lecturer is still loading. Please wait a moment and try again.';
    if (!advRole) errs.role = 'Role is required';
    if (!advHourlyRate) errs.hourlyRate = 'Hourly Rate is required';
    if (!(advCapstone1 || advCapstone2 || advInternship1 || advInternship2)) {
      errs.responsibilities = 'Please select at least one responsibility.';
    }
    if (!advHoursPerStudent) errs.hoursPerStudent = 'Number of Hour per Student is required';
    if (!advStudents || advStudents.length === 0) errs.students = 'Please add at least one student.';
    else if (advStudents.some(s => !(String(s?.project_title || '').trim()) || !(String(s?.company_name || '').trim()))) {
      errs.students = 'Each student must include Project/Topic Title and Company Name.';
    }
    if (!sd) errs.startDate = 'Start Date is required';
    else if (sd < today) errs.startDate = 'Start Date cannot be in the past';
    if (!ed) errs.endDate = 'End Date is required';
    else if (sd && ed <= sd) errs.endDate = 'End Date must be after Start Date';
    if (!advDuties || advDuties.length === 0) errs.duties = 'Please add at least one duty';

    setAdvErrors(errs);
    if (Object.keys(errs).length) return;

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

      // Reset advisor form
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
      onOpenChange(false);
    } catch (e) {
      const resp = e?.response;
      const message = resp?.data?.message || e?.message || 'Failed to create advisor contract';
      const backendErrors = resp?.data?.errors;
      const nextErrs = {};

      if (Array.isArray(backendErrors)) {
        const text = backendErrors
          .map(x => (typeof x === 'string' ? x : (x?.message || x?.path || '')))
          .filter(Boolean)
          .join(', ');
        nextErrs.form = text || message;
      } else if (Array.isArray(backendErrors?.errors)) {
        nextErrs.form = backendErrors.errors.join(', ');
      } else {
        nextErrs.form = message;
      }
      setAdvErrors(nextErrs);
    }
  };

  const handleLecturerChange = async (val) => {
    setDlgLecturerKey(val);
    const resolvedUserId = resolveLecturerUserId ? resolveLecturerUserId(val) : normId(val);
    setDlgLecturerId(resolvedUserId || '');
    setDlgErrors(prev => ({ ...prev, lecturer: '' }));
    setDlgSelectedMappingIds(new Set());
    setDlgCombineByMapping({});
    
    try {
      if (!resolvedUserId) throw new Error('Lecturer user id not resolved');
      const body = await getLecturerDetail(resolvedUserId);
      const rate = body?.hourlyRateThisYear || '';
      setDlgHourlyRate(rate);
    } catch {
      setDlgHourlyRate('');
    }
  };

  const handleAdvisorLecturerChange = async (val) => {
    setAdvLecturerKey(val);
    const resolvedUserId = resolveLecturerUserId ? resolveLecturerUserId(val) : normId(val);
    setAdvLecturerId(resolvedUserId || '');
    setAdvErrors(prev => ({ ...prev, lecturer: '' }));
    try {
      if (!resolvedUserId) throw new Error('Lecturer user id not resolved');
      // Advisor accounts may not have lecturer role; use advisor detail endpoint.
      const body = await getAdvisorDetail(resolvedUserId);
      const rate = body?.hourlyRateThisYear || '';
      setAdvHourlyRate(rate);
    } catch {
      setAdvHourlyRate('');
    }
  };

  useEffect(() => {
    if (!open) return;
    if (dlgContractType !== 'ADVISOR') return;

    let cancelled = false;

    (async () => {
      setAdvisorUsersLoading(true);
      setAdvisorUsersLoadError('');
      try {
        // Admin UX: Advisor tab should show all advisor-role accounts that can log in.
        const body = await listAdvisors({ page: 1, limit: 1000 });
        const list = Array.isArray(body?.data) ? body.data : [];
        if (!cancelled) setAdvisorUsers(list);
      } catch (e) {
        console.error('Failed to load advisors:', e);
        if (!cancelled) {
          setAdvisorUsers([]);
          setAdvisorUsersLoadError('Failed to load advisors.');
        }
      } finally {
        if (!cancelled) setAdvisorUsersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, dlgContractType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle>Generate New Contract</DialogTitle>
          <DialogDescription>Fill in the details below to generate a new contract.</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 pt-2 max-h-[70vh] overflow-y-auto">
          {(dlgContractType === 'LECTURER' ? dlgErrors.form : advErrors.form) && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {dlgContractType === 'LECTURER' ? dlgErrors.form : advErrors.form}
            </div>
          )}

          {/* Academic Year */}
          <div className="space-y-1 mb-4">
            <label className="block text-sm font-medium">Academic Year <span className="text-red-600">*</span></label>
            <Input 
              className="w-full cursor-pointer h-11 text-base shadow-sm" 
              value={academicYear} 
              onChange={(e) => onAcademicYearChange(e.target.value)} 
            />
            {/* <p className="text-xs text-gray-500">Lecturers are sourced from Accepted course mappings of this year.</p> */}
          </div>

          <Tabs value={dlgContractType} onValueChange={(v) => {
            setDlgContractType(v);
            // Clear stale form errors when switching
            setDlgErrors({});
            setAdvErrors({});
          }}>
            <TabsList ariaLabel="Contract type">
              <TabsTrigger value="LECTURER">Lecturer</TabsTrigger>
              <TabsTrigger value="ADVISOR">Advisor</TabsTrigger>
            </TabsList>

            <TabsContent value="LECTURER">

              {/* Lecturer */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  Lecturer Name <span className="text-red-600">*</span>
                </label>
                <Select 
                  className="w-full cursor-pointer" 
                  value={dlgLecturerKey} 
                  onValueChange={handleLecturerChange} 
                  placeholder="Select lecturer name"
                >
                  {lecturers.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name || l.full_name_english || l.full_name_khmer}
                    </SelectItem>
                  ))}
                </Select>
                {!lecturers.length && (
                  <p className="text-xs text-amber-600">
                    No lecturers found. Try selecting another academic year or ensure Accepted course mappings exist.
                  </p>
                )}
                {dlgErrors.lecturer && <p className="text-xs text-red-600">{dlgErrors.lecturer}</p>}
              </div>

              {/* Hourly Rate */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">Hourly Rate ($)</label>
                <Input 
                  className="w-full cursor-pointer h-11 text-base shadow-sm" 
                  value={dlgHourlyRate} 
                  readOnly 
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <div className="relative group">
                  <Input 
                    ref={startRef}
                    className="w-full cursor-pointer h-11 text-base pr-10 shadow-sm sm:min-w-[220px]" 
                    type="date" 
                    value={dlgStartDate} 
                    min={new Date().toISOString().slice(0, 10)} 
                    onChange={(e) => { 
                      setDlgStartDate(e.target.value); 
                      setDlgErrors(prev => ({ ...prev, startDate: '' })); 
                    }}
                  />
                  <button 
                    type="button" 
                    aria-label="Pick start date" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30" 
                    onClick={() => { 
                      try { 
                        startRef.current?.showPicker?.(); 
                      } catch { 
                        startRef.current?.focus?.(); 
                      } 
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                {dlgErrors.startDate && <p className="text-xs text-red-600">{dlgErrors.startDate}</p>}
              </div>

              {/* End Date */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  End Date <span className="text-red-600">*</span>
                </label>
                <div className="relative group">
                  <Input 
                    ref={endRef}
                    className="w-full cursor-pointer h-11 text-base pr-10 shadow-sm sm:min-w-[220px]" 
                    type="date" 
                    value={dlgEndDate} 
                    min={dlgStartDate || new Date().toISOString().slice(0, 10)} 
                    onChange={(e) => { 
                      setDlgEndDate(e.target.value); 
                      setDlgErrors(prev => ({ ...prev, endDate: '' })); 
                    }}
                  />
                  <button 
                    type="button" 
                    aria-label="Pick end date" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30" 
                    onClick={() => { 
                      try { 
                        endRef.current?.showPicker?.(); 
                      } catch { 
                        endRef.current?.focus?.(); 
                      } 
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                {dlgErrors.endDate && <p className="text-xs text-red-600">{dlgErrors.endDate}</p>}
              </div>

              {/* Duties */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium">
                  Duties (press Enter to add) <span className="text-red-600">*</span>
                </label>
                <Input
                  className="w-full cursor-pointer"
                  value={dlgItemInput}
                  onChange={(e) => { 
                    setDlgItemInput(e.target.value); 
                    if (dlgErrors.description) setDlgErrors(prev => ({ ...prev, description: '' })); 
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = (dlgItemInput || '').trim();
                      if (v) {
                        setDlgItems(prev => [...prev, v]);
                        setDlgItemInput('');
                      }
                    }
                  }}
                  placeholder="Type a duty and press Enter"
                />
                {dlgItems.length > 0 && (
                  <div className="space-y-1 text-sm">
                    {dlgItems.map((it, idx) => {
                      const isEditing = dlgEditingItemIdx === idx;
                      return (
                        <div key={`${it}-${idx}`} className="flex items-center gap-2">
                          <div className="flex-1">
                            {isEditing ? (
                              <Input
                                className="w-full"
                                value={dlgEditingItemValue}
                                onChange={(e) => setDlgEditingItemValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const v = (dlgEditingItemValue || '').trim();
                                    if (v) setDlgItems(prev => prev.map((x, i) => (i === idx ? v : x)));
                                    setDlgEditingItemIdx(null);
                                    setDlgEditingItemValue('');
                                  } else if (e.key === 'Escape') {
                                    setDlgEditingItemIdx(null);
                                    setDlgEditingItemValue('');
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-xs text-gray-600">{it}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label="Edit duty"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              if (isEditing) {
                                setDlgEditingItemIdx(null);
                                setDlgEditingItemValue('');
                                return;
                              }
                              setDlgEditingItemIdx(idx);
                              setDlgEditingItemValue(it);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove duty"
                            className="p-1 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setDlgItems(prev => prev.filter((_, i) => i !== idx));
                              if (dlgEditingItemIdx === idx) {
                                setDlgEditingItemIdx(null);
                                setDlgEditingItemValue('');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {dlgErrors.description && <div className="text-xs text-red-600">{dlgErrors.description}</div>}
              </div>

              {/* Course Selection */}
              <div className="mt-5">
                <label className="block text-sm font-medium mb-1">
                  Courses to include <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      className="w-full pl-9" 
                      placeholder="Search by course name/code or class…" 
                      value={dlgCourseQuery} 
                      onChange={(e) => setDlgCourseQuery(e.target.value)} 
                    />
                  </div>
                  {dlgCourseQuery && (
                    <button 
                      onClick={() => setDlgCourseQuery('')} 
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="rounded-lg border max-h-56 overflow-y-auto divide-y bg-white">
                  {dlgFilteredMappings.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No courses found for {academicYear}.</div>
                  ) : (
                    dlgFilteredMappings.map(m => {
                      const checked = dlgSelectedMappingIds.has(m.id);
                      const typeHoursStr = String(m.type_hours || '');
                      const th = String(m.theory_hours || '').toLowerCase();
                      const theory15 = th === '15h' || (!th && /15h/i.test(typeHoursStr));
                      const theory30 = th === '30h' || (!th && /30h/i.test(typeHoursStr));
                      const theoryGroups = Number(m.theory_groups ?? m.groups_15h ?? m.groups_theory ?? m.group_count_theory ?? 0) || 0;
                      const canCombineTheory = (theory15 || theory30) && theoryGroups > 1;
                      const combined = canCombineTheory ? !!(dlgCombineByMapping[m.id] ?? m.theory_combined) : false;
                      const computedHours = hoursFromMapping({ ...m, theory_combined: combined });
                      
                      const rateNum = (() => { 
                        try { 
                          const raw = dlgHourlyRate; 
                          const n = raw != null ? parseFloat(String(raw).replace(/[^0-9.-]/g, '')) : NaN; 
                          return Number.isFinite(n) ? n : null; 
                        } catch { 
                          return null; 
                        } 
                      })();
                      const estSalary = rateNum != null ? Math.round(rateNum * (computedHours || 0)) : null;

                      return (
                        <div key={m.id} className="p-3 hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              id={`map-${m.id}`} 
                              checked={checked} 
                              onCheckedChange={() => {
                                const next = new Set(Array.from(dlgSelectedMappingIds));
                                if (checked) next.delete(m.id); 
                                else next.add(m.id);
                                setDlgSelectedMappingIds(next);
                                setDlgErrors(prev => ({ ...prev, courses: '' }));
                              }} 
                            />
                            <div className="flex-1 text-sm">
                              <div className="font-medium text-gray-900">
                                {m.course?.name} <span className="text-gray-500 font-normal">({computedHours || '-'}h)</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {m.class?.name || 'Class'} • Year {m.year_level} • Term {m.term} • {m.academic_year}
                              </div>
                              {canCombineTheory && (
                                <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-700 select-none">
                                  <Checkbox 
                                    checked={combined} 
                                    onCheckedChange={(v) => setDlgCombineByMapping(prev => ({ ...prev, [m.id]: !!v }))} 
                                  />
                                  Combine groups into 1 class
                                  <span className="text-gray-500">({theory15 ? '15h' : '30h'})</span>
                                </label>
                              )}
                              {estSalary != null && (
                                <div className="mt-1 text-xs text-gray-600">
                                  Est. salary: {estSalary.toLocaleString('en-US')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {dlgErrors.courses && <p className="text-xs text-red-600 mt-1">{dlgErrors.courses}</p>}
              </div>
            </TabsContent>

            <TabsContent value="ADVISOR">
              {/* Advisor */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  Advisor Name <span className="text-red-600">*</span>
                </label>
                <Select
                  className="w-full cursor-pointer"
                  value={advLecturerKey}
                  onValueChange={handleAdvisorLecturerChange}
                  placeholder="Enter advisor name"
                >
                  {(advisorUsers.length ? advisorUsers : lecturers).map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name || u.full_name_english || u.full_name_khmer || u.display_name || u.email}
                    </SelectItem>
                  ))}
                </Select>
                {advisorUsersLoading && (
                  <p className="text-xs text-gray-500">Loading advisors…</p>
                )}
                {!!advisorUsersLoadError && (
                  <p className="text-xs text-red-600">{advisorUsersLoadError}</p>
                )}
                {!advisorUsersLoading && !advisorUsers.length && !lecturers.length && (
                  <p className="text-xs text-amber-600">
                    No lecturers found. Try selecting another academic year or ensure Accepted course mappings exist.
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Generating an advisor contract will also add the <span className="font-medium">Advisor</span> role to this lecturer.
                </p>
                {advErrors.lecturer && <p className="text-xs text-red-600">{advErrors.lecturer}</p>}
              </div>

              {/* Hourly Rate */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  Hourly Rate ($) <span className="text-red-600">*</span>
                </label>
                <Input
                  className="w-full cursor-pointer h-11 text-base shadow-sm"
                  value={advHourlyRate}
                  onChange={(e) => {
                    setAdvHourlyRate(e.target.value);
                    setAdvErrors(prev => ({ ...prev, hourlyRate: '' }));
                  }}
                />
                {advErrors.hourlyRate && <p className="text-xs text-red-600">{advErrors.hourlyRate}</p>}
              </div>

              {/* Responsibilities */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium">Capstone:</label>
                  <span className="text-red-600 text-sm">*</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none">
                    <Checkbox checked={advCapstone1} onCheckedChange={(v) => { setAdvCapstone1(!!v); setAdvErrors(prev => ({ ...prev, responsibilities: '' })); }} />
                    Capstone 1
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none">
                    <Checkbox checked={advCapstone2} onCheckedChange={(v) => { setAdvCapstone2(!!v); setAdvErrors(prev => ({ ...prev, responsibilities: '' })); }} />
                    Capstone 2
                  </label>
                </div>

                <label className="block text-sm font-medium">Internship:</label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none">
                    <Checkbox checked={advInternship1} onCheckedChange={(v) => { setAdvInternship1(!!v); setAdvErrors(prev => ({ ...prev, responsibilities: '' })); }} />
                    Internship 1
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none">
                    <Checkbox checked={advInternship2} onCheckedChange={(v) => { setAdvInternship2(!!v); setAdvErrors(prev => ({ ...prev, responsibilities: '' })); }} />
                    Internship 2
                  </label>
                </div>
                {advErrors.responsibilities && <p className="text-xs text-red-600">{advErrors.responsibilities}</p>}
              </div>

              {/* Hours per Student */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  Number of Hour per Student <span className="text-red-600">*</span>
                </label>
                <Input
                  className="w-full cursor-pointer h-11 text-base shadow-sm"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={advHoursPerStudent}
                  onChange={(e) => {
                    const next = String(e.target.value || '').replace(/[^0-9]/g, '');
                    setAdvHoursPerStudent(next);
                    setAdvErrors(prev => ({ ...prev, hoursPerStudent: '' }));
                  }}
                />
                {advErrors.hoursPerStudent && <p className="text-xs text-red-600">{advErrors.hoursPerStudent}</p>}
              </div>

              {/* Students */}
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      Project/Topic Title <span className="text-red-600">*</span>
                    </label>
                    <Input
                      className="w-full cursor-pointer"
                      value={advProjectTitle}
                      onChange={(e) => setAdvProjectTitle(e.target.value)}
                      placeholder="Project/Topic Title"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      Company Name <span className="text-red-600">*</span>
                    </label>
                    <Input
                      className="w-full cursor-pointer"
                      value={advCompanyName}
                      onChange={(e) => setAdvCompanyName(e.target.value)}
                      placeholder="Company Name"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Add new project/topic and company"
                    className="h-11 w-11 px-0"
                    onClick={() => {
                      setAdvProjectTitle('');
                      setAdvCompanyName('');
                      setAdvStudentInput('');
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {!!String(advProjectTitle || '').trim() && !!String(advCompanyName || '').trim() && (
                  <>
                    <label className="block text-sm font-medium">
                      Student Name (Enter to add) <span className="text-red-600">*</span>
                    </label>
                    <Input
                      className="w-full cursor-pointer"
                      value={advStudentInput}
                      onChange={(e) => {
                        setAdvStudentInput(e.target.value);
                        if (advErrors.students) setAdvErrors(prev => ({ ...prev, students: '' }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const row = parseStudentLine(advStudentInput);
                          if (row) {
                            const project_title = String(advProjectTitle || '').trim();
                            const company_name = String(advCompanyName || '').trim();
                            setAdvStudents(prev => [...prev, { ...row, project_title, company_name }]);
                            setAdvStudentInput('');
                          }
                        }
                      }}
                      placeholder="Student Name"
                    />
                  </>
                )}

                {advStudents.length > 0 && (
                  <div className="space-y-1 text-sm">
                    {advStudents.map((s, idx) => {
                      const nameCode = `${s.student_name || ''}${s.student_code ? `, ${s.student_code}` : ''}`.trim();
                      const topic = String(s?.project_title || '').trim();
                      const comp = String(s?.company_name || '').trim();
                      const label = `${nameCode}${topic ? ` | ${topic}` : ''}${comp ? ` | ${comp}` : ''}`.trim();
                      const isEditing = advEditingStudentIdx === idx;
                      return (
                        <div key={`${label}-${idx}`} className="flex items-center gap-2">
                          <div className="flex-1">
                            {isEditing ? (
                              <Input
                                className="w-full"
                                value={advEditingStudentValue}
                                onChange={(e) => setAdvEditingStudentValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const next = parseStudentLine(advEditingStudentValue);
                                    if (next) {
                                      setAdvStudents(prev => prev.map((x, i) => (i === idx ? { ...x, ...next } : x)));
                                    }
                                    setAdvEditingStudentIdx(null);
                                    setAdvEditingStudentValue('');
                                  } else if (e.key === 'Escape') {
                                    setAdvEditingStudentIdx(null);
                                    setAdvEditingStudentValue('');
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-xs text-gray-600">{label}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label="Edit student"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              if (isEditing) {
                                setAdvEditingStudentIdx(null);
                                setAdvEditingStudentValue('');
                                return;
                              }
                              setAdvEditingStudentIdx(idx);
                              setAdvEditingStudentValue(nameCode);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove student"
                            className="p-1 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setAdvStudents(prev => prev.filter((_, i) => i !== idx));
                              if (advEditingStudentIdx === idx) {
                                setAdvEditingStudentIdx(null);
                                setAdvEditingStudentValue('');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {advErrors.students && <div className="text-xs text-red-600">{advErrors.students}</div>}
              </div>

              {/* Start Date */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <div className="relative group">
                  <Input
                    ref={startRef}
                    className="w-full cursor-pointer h-11 text-base pr-10 shadow-sm sm:min-w-[220px]"
                    type="date"
                    value={advStartDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      setAdvStartDate(e.target.value);
                      setAdvErrors(prev => ({ ...prev, startDate: '' }));
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Pick start date"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                    onClick={() => {
                      try {
                        startRef.current?.showPicker?.();
                      } catch {
                        startRef.current?.focus?.();
                      }
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                {advErrors.startDate && <p className="text-xs text-red-600">{advErrors.startDate}</p>}
              </div>

              {/* End Date */}
              <div className="space-y-1 mb-4">
                <label className="block text-sm font-medium">
                  End Date <span className="text-red-600">*</span>
                </label>
                <div className="relative group">
                  <Input
                    ref={endRef}
                    className="w-full cursor-pointer h-11 text-base pr-10 shadow-sm sm:min-w-[220px]"
                    type="date"
                    value={advEndDate}
                    min={advStartDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      setAdvEndDate(e.target.value);
                      setAdvErrors(prev => ({ ...prev, endDate: '' }));
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Pick end date"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                    onClick={() => {
                      try {
                        endRef.current?.showPicker?.();
                      } catch {
                        endRef.current?.focus?.();
                      }
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                {advErrors.endDate && <p className="text-xs text-red-600">{advErrors.endDate}</p>}
              </div>

              {/* Duties */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium">
                  Duties (Enter to add) <span className="text-red-600">*</span>
                </label>
                <Input
                  className="w-full cursor-pointer"
                  value={advDutyInput}
                  onChange={(e) => {
                    setAdvDutyInput(e.target.value);
                    if (advErrors.duties) setAdvErrors(prev => ({ ...prev, duties: '' }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = (advDutyInput || '').trim();
                      if (v) {
                        setAdvDuties(prev => [...prev, v]);
                        setAdvDutyInput('');
                      }
                    }
                  }}
                  placeholder="Do course syllabus"
                />
                {advDuties.length > 0 && (
                  <div className="space-y-1 text-sm">
                    {advDuties.map((d, idx) => {
                      const isEditing = advEditingDutyIdx === idx;
                      return (
                        <div key={`${d}-${idx}`} className="flex items-center gap-2">
                          <div className="flex-1">
                            {isEditing ? (
                              <Input
                                className="w-full"
                                value={advEditingDutyValue}
                                onChange={(e) => setAdvEditingDutyValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const v = (advEditingDutyValue || '').trim();
                                    if (v) setAdvDuties(prev => prev.map((x, i) => (i === idx ? v : x)));
                                    setAdvEditingDutyIdx(null);
                                    setAdvEditingDutyValue('');
                                  } else if (e.key === 'Escape') {
                                    setAdvEditingDutyIdx(null);
                                    setAdvEditingDutyValue('');
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-xs text-gray-600">{d}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label="Edit duty"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              if (isEditing) {
                                setAdvEditingDutyIdx(null);
                                setAdvEditingDutyValue('');
                                return;
                              }
                              setAdvEditingDutyIdx(idx);
                              setAdvEditingDutyValue(d);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove duty"
                            className="p-1 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setAdvDuties(prev => prev.filter((_, i) => i !== idx));
                              if (advEditingDutyIdx === idx) {
                                setAdvEditingDutyIdx(null);
                                setAdvEditingDutyValue('');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {advErrors.duties && <div className="text-xs text-red-600">{advErrors.duties}</div>}
              </div>

              {/* Join Judging */}
              <div className="space-y-1 mb-2">
                <label className="block text-sm font-medium">Join Judging</label>
                <Input
                  className="w-full cursor-pointer h-11 text-base shadow-sm"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={advJoinJudgingHours}
                  onChange={(e) => {
                    const next = String(e.target.value || '').replace(/[^0-9]/g, '');
                    setAdvJoinJudgingHours(next);
                  }}
                  placeholder="Number of hour for judging"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto cursor-pointer" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="w-full sm:w-auto cursor-pointer" 
            onClick={dlgContractType === 'LECTURER' ? handleCreateLecturer : handleCreateAdvisor}
          >
            Generate Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
