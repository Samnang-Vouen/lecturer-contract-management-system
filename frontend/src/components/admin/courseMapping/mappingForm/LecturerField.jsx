import React from 'react';
import Select, { SelectItem } from '../../../ui/Select.jsx';

export default function LecturerField({ isEditMode, form, setForm, filteredLecturers }) {
  return (
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
  );
}
