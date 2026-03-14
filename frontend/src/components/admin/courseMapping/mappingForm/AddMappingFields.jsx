import React from 'react';
import Select, { SelectItem } from '../../../ui/Select.jsx';

export default function AddMappingFields({
  form,
  setForm,
  academicYearOptions,
  reloadForAcademicYear,
  yearLevelOptionsForAY,
  termOptionsForAYLevel,
  classesForSelection,
  classMap,
  allowedCourses,
  getClassSpecializationName,
}) {
  return (
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
              group_ids: [],
              theory_group_ids: [],
              lab_group_ids: [],
              theory_room_by_group: {},
              lab_room_by_group: {},
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
              group_ids: [],
              theory_group_ids: [],
              lab_group_ids: [],
              theory_room_by_group: {},
              lab_room_by_group: {},
              course_id: '',
              lecturer_profile_id: '',
            }))
          }
          buttonClassName="min-h-[3rem] py-2 text-sm"
          disabled={!form.academic_year}
        >
          <SelectItem value="">{form.academic_year ? 'Select year level' : 'Select academic year first'}</SelectItem>
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
            setForm((f) => ({
              ...f,
              term: val,
              class_id: '',
              group_ids: [],
              theory_group_ids: [],
              lab_group_ids: [],
              theory_room_by_group: {},
              lab_room_by_group: {},
              course_id: '',
              lecturer_profile_id: '',
            }))
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
              group_ids: [],
              theory_group_ids: [],
              lab_group_ids: [],
              theory_room_by_group: {},
              lab_room_by_group: {},
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
              {[c.name, c.term, getClassSpecializationName(c)].filter(Boolean).join(' ')}
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
  );
}
