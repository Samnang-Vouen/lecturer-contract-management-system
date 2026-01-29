import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog.jsx';
import Button from '../../ui/Button.jsx';
import Select, { SelectItem } from '../../ui/Select.jsx';
import TeachingTypeSelector from './TeachingTypeSelector.jsx';
import AvailabilityPopover from './AvailabilityPopover.jsx';
import { useAvailability } from '../../../hooks/admin/courseMapping/useAvailability.js';
import { usePopoverPosition } from '../../../hooks/admin/courseMapping/usePopoverPosition.js';

/**
 * MappingFormDialog - Add or Edit course mapping form
 */
export default function MappingFormDialog({
  isOpen,
  onClose,
  mode, // 'add' | 'edit'
  form,
  setForm,
  onSubmit,
  error,
  classes,
  courses,
  lecturers,
  classMap,
  courseMap,
  academicYearOptions,
  reloadForAcademicYear,
  teachingType, // useTeachingType hook instance passed from parent
}) {
  const isEditMode = mode === 'edit';

  const {
    DAY_OPTIONS,
    SESSION_OPTIONS,
    idToTime,
    parseAvailability,
    serializeAvailability,
    getAvailabilitySummary,
  } = useAvailability();
  const { popoverStyle, updatePosition } = usePopoverPosition();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const availBtnRef = useRef(null);

  const availabilityMap = useMemo(() => parseAvailability(form.availability), [form.availability, parseAvailability]);
  const availabilitySummary = getAvailabilitySummary(availabilityMap);

  const toggleSession = useCallback(
    (day, sessionId) => {
      const current = parseAvailability(form.availability);
      const set = new Set(current.get(day) || []);
      if (set.has(sessionId)) set.delete(sessionId);
      else set.add(sessionId);
      if (set.size) current.set(day, set);
      else current.delete(day);
      setForm((f) => ({ ...f, availability: serializeAvailability(current) }));
    },
    [form.availability, parseAvailability, serializeAvailability, setForm]
  );

  const clearAvailability = useCallback(() => {
    setForm((f) => ({ ...f, availability: '' }));
  }, [setForm]);

  useEffect(() => {
    if (availabilityOpen) {
      updatePosition(availBtnRef);
    }
  }, [availabilityOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      setAvailabilityOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function onWinChange() {
      if (availabilityOpen) updatePosition(availBtnRef);
    }
    window.addEventListener('resize', onWinChange);
    window.addEventListener('scroll', onWinChange, true);
    return () => {
      window.removeEventListener('resize', onWinChange);
      window.removeEventListener('scroll', onWinChange, true);
    };
  }, [availabilityOpen, updatePosition]);

  // Cascading option sets for the Add dialog (derived from classes)
  const yearLevelOptionsForAY = useMemo(() => {
    if (!form.academic_year) return [];
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach((c) => {
      if (String(c.academic_year) === String(form.academic_year) && (c.year_level || c.yearLevel)) {
        set.add(String(c.year_level ?? c.yearLevel));
      }
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [classes, form.academic_year]);

  const termOptionsForAYLevel = useMemo(() => {
    if (!form.academic_year || !form.year_level) return [];
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach((c) => {
      const yl = c.year_level ?? c.yearLevel;
      if (
        String(c.academic_year) === String(form.academic_year) &&
        String(yl) === String(form.year_level) &&
        c.term
      ) {
        set.add(String(c.term));
      }
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [classes, form.academic_year, form.year_level]);

  const classesForSelection = useMemo(() => {
    if (!form.academic_year || !form.year_level || !form.term) return [];
    return (Array.isArray(classes) ? classes : []).filter(
      (c) =>
        String(c.academic_year) === String(form.academic_year) &&
        String(c.year_level ?? c.yearLevel) === String(form.year_level) &&
        String(c.term) === String(form.term)
    );
  }, [classes, form.academic_year, form.year_level, form.term]);

  const allowedCourses = useMemo(() => {
    if (!form.class_id) return courses;
    const cls = classes.find((c) => c.id == form.class_id);
    let allowed = courses;
    if (cls && Array.isArray(cls.courses) && cls.courses.length) {
      const codes = new Set(
        cls.courses
          .map((x) =>
            typeof x === 'string' ? x : x.course_code || x.code || x.courseCode || null
          )
          .filter(Boolean)
      );
      if (codes.size) allowed = courses.filter((c) => codes.has(c.course_code));
    }
    return allowed;
  }, [form.class_id, classes, courses]);

  const filteredLecturers = useMemo(() => {
    if (!form.course_id) return [];
    return lecturers.filter((l) =>
      Array.isArray(l.courses) &&
      l.courses.some(
        (cc) =>
          String(cc.id) === String(form.course_id) ||
          String(cc.course_code) === String(courseMap[form.course_id]?.course_code || '')
      )
    );
  }, [form.course_id, lecturers, courseMap]);

  const handleSubmit = () => {
    const payload = teachingType.buildPayload();
    if (!payload.isValid) {
      return;
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Mapping' : 'New Mapping'}</DialogTitle>
          {!isEditMode && (
            <p className="mt-1 text-sm text-gray-500">
              Create a new course assignment by selecting the academic year, class, course, lecturer, availability, and teaching type.
            </p>
          )}
        </DialogHeader>

        {error && (
          <div role="alert" className="mb-3 mx-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div className="max-h-[80vh] sm:max-h-[70vh] overflow-y-auto px-2">
          <div className="w-full max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min text-sm">
              {!isEditMode && (
                <>
                  {/* Academic Year */}
                  <div className="flex flex-col min-w-0">
                    <label htmlFor="mappingAcademicYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Select
                      id="mappingAcademicYear"
                      value={form.academic_year}
                      onValueChange={async (year) => {
                        setForm((f) => ({
                          ...f,
                          academic_year: year,
                          year_level: '',
                          term: '',
                          class_id: '',
                          course_id: '',
                          lecturer_profile_id: '',
                        }));
                        if (year) await reloadForAcademicYear(year);
                      }}
                      buttonClassName="min-h-[3rem] py-2 text-sm"
                    >
                      <SelectItem value="">Select academic year</SelectItem>
                      {academicYearOptions.map((y) => (
                        <SelectItem key={`ay-${y}`} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Year Level */}
                  <div className="flex flex-col min-w-0">
                    <label htmlFor="mappingYearLevel" className="block text-sm font-medium text-gray-700 mb-1">
                      Year Level <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Select
                      id="mappingYearLevel"
                      value={form.year_level}
                      onValueChange={(val) =>
                        setForm((f) => ({
                          ...f,
                          year_level: val,
                          term: '',
                          class_id: '',
                          course_id: '',
                          lecturer_profile_id: '',
                        }))
                      }
                      buttonClassName="min-h-[3rem] py-2 text-sm"
                      disabled={!form.academic_year}
                    >
                      <SelectItem value="">
                        {form.academic_year ? 'Select year level' : 'Select academic year first'}
                      </SelectItem>
                      {yearLevelOptionsForAY.map((y) => (
                        <SelectItem key={`yl-${y}`} value={y}>
                          {String(y).startsWith('Year ') ? y : `Year ${y}`}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Term */}
                  <div className="flex flex-col min-w-0">
                    <label htmlFor="mappingTerm" className="block text-sm font-medium text-gray-700 mb-1">
                      Term <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Select
                      id="mappingTerm"
                      value={form.term}
                      onValueChange={(val) =>
                        setForm((f) => ({ ...f, term: val, class_id: '', course_id: '', lecturer_profile_id: '' }))
                      }
                      buttonClassName="min-h-[3rem] py-2 text-sm"
                      disabled={!form.academic_year || !form.year_level}
                    >
                      <SelectItem value="">
                        {form.year_level
                          ? 'Select term'
                          : form.academic_year
                          ? 'Select year level first'
                          : 'Select academic year first'}
                      </SelectItem>
                      {termOptionsForAYLevel.map((t) => (
                        <SelectItem key={`term-${t}`} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Class */}
                  <div className="flex flex-col min-w-0">
                    <label htmlFor="mappingClass" className="block text-sm font-medium text-gray-700 mb-1">
                      Class <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Select
                      id="mappingClass"
                      value={form.class_id}
                      onValueChange={(val) => {
                        const c = classMap[val];
                        setForm((f) => ({
                          ...f,
                          class_id: val,
                          term: f.term || c?.term || '',
                          year_level: f.year_level || c?.year_level || '',
                          academic_year: f.academic_year || c?.academic_year || '',
                          course_id: '',
                          lecturer_profile_id: '',
                        }));
                      }}
                      buttonClassName="min-h-[3rem] py-2 text-sm"
                      disabled={!form.academic_year || !form.year_level || !form.term}
                    >
                      <SelectItem value="">
                        {form.term
                          ? 'Select class'
                          : form.year_level
                          ? 'Select term first'
                          : form.academic_year
                          ? 'Select year level first'
                          : 'Select academic year first'}
                      </SelectItem>
                      {classesForSelection.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                          {c.term ? ' ' + c.term : ''}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Course */}
                  <div className="flex flex-col min-w-0">
                    <label htmlFor="mappingCourse" className="block text-sm font-medium text-gray-700 mb-1">
                      Course <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Select
                      id="mappingCourse"
                      value={form.course_id}
                      onValueChange={(val) => setForm((f) => ({ ...f, course_id: val, lecturer_profile_id: '' }))}
                      buttonClassName="min-h-[3rem] py-2 text-sm"
                      disabled={!form.class_id}
                    >
                      <SelectItem value="">{form.class_id ? 'Select course' : 'Select class first'}</SelectItem>
                      {allowedCourses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.course_code} - {c.course_name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </>
              )}

              {/* Lecturer */}
              <div className="flex flex-col min-w-0">
                <label htmlFor="mappingLecturer" className="block text-sm font-medium text-gray-700 mb-1">
                  Lecturer {!isEditMode && <span className="text-red-500" aria-hidden="true">*</span>}
                </label>
                <Select
                  id="mappingLecturer"
                  value={form.lecturer_profile_id}
                  onValueChange={(val) => setForm((f) => ({ ...f, lecturer_profile_id: val }))}
                  buttonClassName="min-h-[3rem] py-2"
                  disabled={!isEditMode && !form.course_id}
                >
                  <SelectItem value="">Unassigned</SelectItem>
                  {filteredLecturers.length ? (
                    filteredLecturers.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-lect" value="" className="text-gray-400">
                      No lecturers for selected course
                    </SelectItem>
                  )}
                </Select>
              </div>

              {/* Teaching Type Selector */}
              <TeachingTypeSelector
                theorySelected={teachingType.theorySelected}
                onTheorySelectedChange={(v) => {
                  teachingType.setTheorySelected(v);
                  if (!v) teachingType.resetTheory();
                }}
                theoryHour={teachingType.theoryHour}
                onTheoryHourChange={teachingType.setTheoryHour}
                theoryGroups={teachingType.theoryGroups}
                onTheoryGroupsChange={teachingType.setTheoryGroups}
                labSelected={teachingType.labSelected}
                onLabSelectedChange={(v) => {
                  teachingType.setLabSelected(v);
                  if (!v) teachingType.resetLab();
                }}
                labGroups={teachingType.labGroups}
                onLabGroupsChange={teachingType.setLabGroups}
              />

              {/* Availability */}
              <div className="flex flex-col min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability {!isEditMode && <span className="text-red-500" aria-hidden="true">*</span>}
                </label>
                <div className="relative">
                  <button
                    ref={availBtnRef}
                    type="button"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[3rem]"
                    aria-haspopup="dialog"
                    aria-expanded={availabilityOpen}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updatePosition(availBtnRef);
                      setAvailabilityOpen((v) => !v);
                    }}
                  >
                    <span className="whitespace-pre-wrap break-words leading-snug text-gray-700">
                      {availabilitySummary || <span className="text-gray-500">Choose Availability</span>}
                    </span>
                  </button>
                  <AvailabilityPopover
                    isOpen={availabilityOpen}
                    onClose={() => setAvailabilityOpen(false)}
                    triggerRef={availBtnRef}
                    popoverStyle={popoverStyle}
                    availabilityMap={availabilityMap}
                    onToggleSession={toggleSession}
                    onClear={clearAvailability}
                    DAY_OPTIONS={DAY_OPTIONS}
                    SESSION_OPTIONS={SESSION_OPTIONS}
                    idToTime={idToTime}
                  />
                </div>
                <input
                  id="mappingAvailability"
                  name="availability"
                  value={form.availability}
                  onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
                  className="sr-only"
                  readOnly
                />
              </div>

              {/* Status */}
              <div className="flex flex-col min-w-0">
                <label htmlFor="mappingStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  buttonClassName="min-h-[3rem] py-2 text-sm"
                >
                  {['Pending', 'Contacting', 'Accepted', 'Rejected'].map((s) => (
                    <SelectItem key={`st-${s}`} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Contacted By */}
              <div className="col-span-1 sm:col-span-2 flex flex-col">
                <label htmlFor="mappingContactedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Contacted By {!isEditMode && <span className="text-red-500" aria-hidden="true">*</span>}
                </label>
                <input
                  id="mappingContactedBy"
                  name="contactedBy"
                  value={form.contactedBy || form.contacted_by || ''}
                  onChange={(e) => setForm((f) => ({ ...f, contactedBy: e.target.value, contacted_by: e.target.value }))}
                  className="block w-full h-9 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mr. John Smith"
                />
              </div>

              {/* Comment */}
              <div className="col-span-1 sm:col-span-2 flex flex-col">
                <label htmlFor="mappingComment" className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  id="mappingComment"
                  name="comment"
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value.slice(0, 160) }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={160}
                />
                <div className="mt-1 text-[11px] text-gray-500 self-end">{(form.comment || '').length}/160</div>
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 sm:col-span-2 flex gap-2">
                <Button onClick={onClose} variant="outline" className="w-full sm:w-auto sm:flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="w-full sm:w-auto sm:flex-1 bg-blue-600 text-white">
                  {isEditMode ? 'Save' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
