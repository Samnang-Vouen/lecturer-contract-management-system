import React, { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select, { SelectItem } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Search, Calendar } from 'lucide-react';
import { getLecturerDetail } from '../../../services/lecturer.service';
import { hoursFromMapping, toInt, toBool, normId } from '../../../utils/contractHelpers';

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
  onCreate
}) {
  const [dlgLecturerId, setDlgLecturerId] = useState('');
  const [dlgHourlyRate, setDlgHourlyRate] = useState('');
  const [dlgStartDate, setDlgStartDate] = useState('');
  const [dlgEndDate, setDlgEndDate] = useState('');
  const [dlgItemInput, setDlgItemInput] = useState('');
  const [dlgItems, setDlgItems] = useState([]);
  const [dlgErrors, setDlgErrors] = useState({});
  const [dlgSelectedMappingIds, setDlgSelectedMappingIds] = useState(new Set());
  const [dlgCourseQuery, setDlgCourseQuery] = useState('');
  const [dlgCombineByMapping, setDlgCombineByMapping] = useState({});
  const startRef = useRef(null);
  const endRef = useRef(null);

  const dlgFilteredMappings = useMemo(() => {
    const q = (dlgCourseQuery || '').toLowerCase();
    const list = (mappings || []).filter(m => {
      const st = String(m.status || '').toLowerCase();
      if (st !== 'accepted') return false;
      if (dlgLecturerId) {
        const lid = mappingUserId(m);
        if (normId(dlgLecturerId) !== lid) return false;
      }
      if (!q) return true;
      const cname = m.course?.name?.toLowerCase() || '';
      const ccode = m.course?.code?.toLowerCase() || '';
      const cls = m.class?.name?.toLowerCase() || '';
      const meta = `${m.term || ''} ${m.year_level || ''}`.toLowerCase();
      return cname.includes(q) || ccode.includes(q) || cls.includes(q) || meta.includes(q);
    });
    return list;
  }, [mappings, dlgCourseQuery, dlgLecturerId, mappingUserId]);

  const handleCreate = async () => {
    const errs = {};
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const sd = dlgStartDate ? new Date(dlgStartDate) : null;
    const ed = dlgEndDate ? new Date(dlgEndDate) : null;
    
    if (!dlgLecturerId) errs.lecturer = 'Lecturer is required';
    if (!sd) errs.startDate = 'Start Date is required';
    else if (sd < today) errs.startDate = 'Start Date cannot be in the past';
    if (!ed) errs.endDate = 'End Date is required';
    else if (sd && ed <= sd) errs.endDate = 'End Date must be after Start Date';
    if (!dlgItems || dlgItems.length === 0) errs.description = 'Please add at least one duty';
    
    const selectedMappings = (mappings || []).filter(m => dlgSelectedMappingIds.has(m.id));
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
        items: dlgItems
      });
      
      // Reset form
      setDlgLecturerId('');
      setDlgHourlyRate('');
      setDlgStartDate('');
      setDlgEndDate('');
      setDlgItems([]);
      setDlgItemInput('');
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

  const handleLecturerChange = async (val) => {
    setDlgLecturerId(val);
    setDlgErrors(prev => ({ ...prev, lecturer: '' }));
    setDlgSelectedMappingIds(new Set());
    setDlgCombineByMapping({});
    
    try {
      const body = await getLecturerDetail(val);
      const rate = body?.hourlyRateThisYear || '';
      setDlgHourlyRate(rate);
    } catch {
      setDlgHourlyRate('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle>Generate New Contract</DialogTitle>
          <DialogDescription>Fill in the details below to generate a new contract.</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 pt-2 max-h-[70vh] overflow-y-auto">
          {dlgErrors.form && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {dlgErrors.form}
            </div>
          )}

          {/* Academic Year */}
          <div className="space-y-1 mb-4">
            <label className="block text-sm font-medium">Academic Year</label>
            <Input 
              className="w-full cursor-pointer h-11 text-base shadow-sm" 
              value={academicYear} 
              onChange={(e) => onAcademicYearChange(e.target.value)} 
            />
            <p className="text-xs text-gray-500">Lecturers are sourced from Accepted course mappings of this year.</p>
          </div>

          {/* Lecturer */}
          <div className="space-y-1 mb-4">
            <label className="block text-sm font-medium">
              Lecturer Name <span className="text-red-600">*</span>
            </label>
            <Select 
              className="w-full cursor-pointer" 
              value={dlgLecturerId} 
              onValueChange={handleLecturerChange} 
              placeholder="Select lecturer"
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
              <ul className="list-disc pl-6 space-y-1 text-sm">
                {dlgItems.map((it, idx) => (
                  <li key={`${it}-${idx}`} className="flex items-start gap-2">
                    <span className="flex-1">{it}</span>
                    <button 
                      type="button" 
                      className="text-xs text-red-600 hover:underline" 
                      onClick={() => setDlgItems(prev => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
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
                      const n = raw != null ? parseFloat(String(raw).replace(/[^0-9.\-]/g, '')) : NaN; 
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
            onClick={handleCreate}
          >
            Generate Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
