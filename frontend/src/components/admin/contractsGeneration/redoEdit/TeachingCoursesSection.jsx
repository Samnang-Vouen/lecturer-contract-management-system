import React from 'react';
import { Search } from 'lucide-react';
import { Checkbox } from '../../../ui/Checkbox';
import Input from '../../../ui/Input';
import { canCombineTheoryFromMapping, getMappingTheoryHourLabel, hoursFromMapping } from '../../../../utils/contractHelpers';
import { courseKey } from '../../../../hooks/admin/contractGeneration/contractRedoEdit.helpers';

export default function TeachingCoursesSection({
  canSelectFromMappings,
  effectiveTeachYear,
  teachAcademicYear,
  setTeachAcademicYear,
  setDidInitSelection,
  setSelectedMappingIds,
  setCombineByMapping,
  setErrors,
  errors,
  courseQuery,
  setCourseQuery,
  contractLecturerId,
  mappingUserId,
  yearMappings,
  filteredMappings,
  selectedMappingIds,
  combineByMapping,
  courses,
  setCourses,
  updateCourseHours,
}) {
  if (!canSelectFromMappings) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Courses (hours)</div>
        {errors.courses ? <div className="text-xs text-red-600">{errors.courses}</div> : null}
        <div className="rounded-lg border border-gray-200 divide-y">
          {(courses || []).map((course, idx) => (
            <div key={`${course.course_id}-${idx}`} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{course.course_name || `Course ${course.course_id}`}</div>
                <div className="text-xs text-gray-500 truncate">{course.academic_year || ''}</div>
              </div>
              <div className="w-28">
                <Input type="number" min={0} value={course.hours ?? ''} onChange={(e) => updateCourseHours(idx, e.target.value)} placeholder="Hours" />
              </div>
            </div>
          ))}
          {!(courses || []).length ? <div className="p-3 text-sm text-gray-500">No courses available to edit.</div> : null}
        </div>
      </div>
    );
  }

  const availableMappings = Array.isArray(yearMappings)
    ? yearMappings.filter((mapping) => {
        const status = String(mapping?.status || '').toLowerCase();
        if (status && status !== 'accepted') return false;
        if (!contractLecturerId || typeof mappingUserId !== 'function') return true;
        const mappingLecturerId = mappingUserId(mapping);
        return !mappingLecturerId || mappingLecturerId === contractLecturerId;
      })
    : [];

  const availableKeys = new Set(
    availableMappings.map((mapping) => courseKey(mapping?.course?.id ?? mapping?.course_id, mapping?.class?.id ?? mapping?.class_id))
  );

  const selectedMappings = availableMappings.filter((mapping) => selectedMappingIds.has(mapping.id));
  const selectedKeys = new Set(
    selectedMappings.map((mapping) => courseKey(mapping?.course?.id ?? mapping?.course_id, mapping?.class?.id ?? mapping?.class_id))
  );

  const preservedCourses = (courses || []).filter((course) => {
    const key = courseKey(course?.course_id, course?.class_id);
    return key && !selectedKeys.has(key) && !availableKeys.has(key);
  });

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">Academic year</div>
        <Input
          value={teachAcademicYear || effectiveTeachYear}
          onChange={(e) => {
            setTeachAcademicYear(e.target.value);
            setDidInitSelection(false);
            setSelectedMappingIds(new Set());
            setCombineByMapping({});
            setErrors((prev) => ({ ...(prev || {}), courses: '' }));
          }}
        />
      </div>

      <div className="text-sm font-medium text-gray-700">Courses to include</div>
      {errors.courses ? <div className="text-xs text-red-600">{errors.courses}</div> : null}

      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input className="w-full pl-9" placeholder="Search by course name/code or class..." value={courseQuery} onChange={(e) => setCourseQuery(e.target.value)} />
        </div>
        {courseQuery ? <button type="button" onClick={() => setCourseQuery('')} className="text-xs text-gray-500 hover:text-gray-700">Clear</button> : null}
      </div>

      {(selectedMappings.length || preservedCourses.length) ? (
        <div className="rounded-lg border border-gray-200 divide-y bg-white">
          <div className="px-3 py-2 text-sm font-medium text-gray-700">
            Selected courses ({selectedMappings.length + preservedCourses.length})
          </div>

          {selectedMappings.map((mapping) => {
            const canCombineTheory = canCombineTheoryFromMapping(mapping);
            const combined = canCombineTheory ? !!(combineByMapping?.[mapping.id] ?? mapping.theory_combined) : false;
            const computedHours = hoursFromMapping({ ...mapping, theory_combined: combined });

            return (
              <div key={`selected-${mapping.id}`} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0 text-sm">
                  <div className="font-medium text-gray-900">{mapping.course?.name} <span className="text-gray-500 font-normal">({computedHours || '-'}h)</span></div>
                  <div className="text-xs text-gray-600">{mapping.class?.name || 'Class'} • Year {mapping.year_level} • Term {mapping.term} • {mapping.academic_year}</div>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => {
                    const next = new Set(Array.from(selectedMappingIds || []));
                    next.delete(mapping.id);
                    setSelectedMappingIds(next);
                    setErrors((prev) => ({ ...(prev || {}), courses: '' }));
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}

          {preservedCourses.map((course, idx) => {
            const key = courseKey(course?.course_id, course?.class_id) || `preserved-${idx}`;

            return (
              <div key={`preserved-${key}`} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0 text-sm">
                  <div className="font-medium text-gray-900">{course.course_name || `Course ${course.course_id || idx + 1}`} <span className="text-gray-500 font-normal">({course.hours || '-'}h)</span></div>
                  <div className="text-xs text-gray-600">{course.class_name || 'Class unavailable'} • Year {course.year_level || '-'} • Term {course.term || '-'} • {course.academic_year || effectiveTeachYear}</div>
                  <div className="mt-1 text-xs text-amber-700">This course is already on the contract but not available in the current mapping list.</div>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => {
                    setCourses((prev) => (prev || []).filter((item) => courseKey(item?.course_id, item?.class_id) !== key));
                    setErrors((prev) => ({ ...(prev || {}), courses: '' }));
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="rounded-lg border border-gray-200 max-h-56 overflow-y-auto divide-y bg-white">
        {filteredMappings.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No courses found for {effectiveTeachYear || 'this year'}.</div>
        ) : filteredMappings.map((mapping) => {
          const checked = selectedMappingIds.has(mapping.id);
          const theoryHours = getMappingTheoryHourLabel(mapping);
          const canCombineTheory = canCombineTheoryFromMapping(mapping);
          const combined = canCombineTheory ? !!(combineByMapping?.[mapping.id] ?? mapping.theory_combined) : false;
          const computedHours = hoursFromMapping({ ...mapping, theory_combined: combined });

          return (
            <div key={mapping.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`redo-map-${mapping.id}`}
                  checked={checked}
                  onCheckedChange={() => {
                    const next = new Set(Array.from(selectedMappingIds || []));
                    if (checked) next.delete(mapping.id);
                    else next.add(mapping.id);
                    setSelectedMappingIds(next);
                    setErrors((prev) => ({ ...(prev || {}), courses: '' }));
                  }}
                />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-gray-900">{mapping.course?.name} <span className="text-gray-500 font-normal">({computedHours || '-'}h)</span></div>
                  <div className="text-xs text-gray-600">{mapping.class?.name || 'Class'} • Year {mapping.year_level} • Term {mapping.term} • {mapping.academic_year}</div>
                  {canCombineTheory ? (
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-700 select-none">
                      <Checkbox checked={combined} onCheckedChange={(value) => setCombineByMapping((prev) => ({ ...(prev || {}), [mapping.id]: !!value }))} />
                      Combine groups into 1 class
                      <span className="text-gray-500">({theoryHours})</span>
                    </label>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}