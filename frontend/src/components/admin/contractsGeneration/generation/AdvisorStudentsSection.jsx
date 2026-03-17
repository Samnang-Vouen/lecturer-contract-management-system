import React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';

export default function AdvisorStudentsSection(props) {
  return (
    <div className="space-y-2 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Project/Topic Title <span className="text-red-600">*</span></label>
          <Input className="w-full cursor-pointer" value={props.advProjectTitle} onChange={(e) => props.setAdvProjectTitle(e.target.value)} placeholder="Project/Topic Title" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Company Name <span className="text-red-600">*</span></label>
          <Input className="w-full cursor-pointer" value={props.advCompanyName} onChange={(e) => props.setAdvCompanyName(e.target.value)} placeholder="Company Name" />
        </div>
        <Button type="button" variant="outline" aria-label="Add new project/topic and company" className="h-11 w-11 px-0" onClick={() => {
          props.setAdvProjectTitle('');
          props.setAdvCompanyName('');
          props.setAdvStudentInput('');
        }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {!!String(props.advProjectTitle || '').trim() && !!String(props.advCompanyName || '').trim() ? (
        <>
          <label className="block text-sm font-medium">Student Name (Enter to add) <span className="text-red-600">*</span></label>
          <Input className="w-full cursor-pointer" value={props.advStudentInput} onChange={(e) => {
            props.setAdvStudentInput(e.target.value);
            if (props.advErrors.students) props.setAdvErrors((prev) => ({ ...prev, students: '' }));
          }} onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const row = props.parseStudentLine(props.advStudentInput);
            if (!row) return;
            props.setAdvStudents((prev) => [...prev, { ...row, project_title: String(props.advProjectTitle || '').trim(), company_name: String(props.advCompanyName || '').trim() }]);
            props.setAdvStudentInput('');
          }} placeholder="Student Name" />
        </>
      ) : null}

      {props.advStudents.length > 0 ? (
        <div className="space-y-1 text-sm">
          {props.advStudents.map((student, idx) => {
            const nameCode = `${student.student_name || ''}${student.student_code ? `, ${student.student_code}` : ''}`.trim();
            const label = `${nameCode}${student.project_title ? ` | ${String(student.project_title).trim()}` : ''}${student.company_name ? ` | ${String(student.company_name).trim()}` : ''}`.trim();
            const isEditing = props.advEditingStudentIdx === idx;
            return (
              <div key={`${label}-${idx}`} className="flex items-center gap-2">
                <div className="flex-1">
                  {isEditing ? (
                    <Input className="w-full" value={props.advEditingStudentValue} onChange={(e) => props.setAdvEditingStudentValue(e.target.value)} onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = props.parseStudentLine(props.advEditingStudentValue);
                        if (next) props.setAdvStudents((prev) => prev.map((value, itemIdx) => (itemIdx === idx ? { ...value, ...next } : value)));
                        props.setAdvEditingStudentIdx(null);
                        props.setAdvEditingStudentValue('');
                      } else if (e.key === 'Escape') {
                        props.setAdvEditingStudentIdx(null);
                        props.setAdvEditingStudentValue('');
                      }
                    }} />
                  ) : <div className="text-xs text-gray-600">{label}</div>}
                </div>
                <button type="button" aria-label="Edit student" className="p-1 text-gray-500 hover:text-gray-700" onClick={() => {
                  if (isEditing) {
                    props.setAdvEditingStudentIdx(null);
                    props.setAdvEditingStudentValue('');
                    return;
                  }
                  props.setAdvEditingStudentIdx(idx);
                  props.setAdvEditingStudentValue(nameCode);
                }}><Pencil className="w-4 h-4" /></button>
                <button type="button" aria-label="Remove student" className="p-1 text-red-600 hover:text-red-700" onClick={() => {
                  props.setAdvStudents((prev) => prev.filter((_, itemIdx) => itemIdx !== idx));
                  if (props.advEditingStudentIdx === idx) {
                    props.setAdvEditingStudentIdx(null);
                    props.setAdvEditingStudentValue('');
                  }
                }}><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      ) : null}
      {props.advErrors.students ? <div className="text-xs text-red-600">{props.advErrors.students}</div> : null}
    </div>
  );
}