import React from 'react';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';

export default function AdvisorStudentsSection({ students, updateStudent, addStudent, removeStudent, errors }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">Students</div>
        <Button variant="secondary" size="sm" onClick={addStudent}>Add student</Button>
      </div>
      {errors.students ? <div className="text-xs text-red-600">{errors.students}</div> : null}
      <div className="space-y-3">
        {(students || []).map((student, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={student?.student_name || ''}
                onChange={(e) => updateStudent(idx, { student_name: e.target.value })}
                placeholder="Student name"
              />
              <Input
                value={student?.student_code || ''}
                onChange={(e) => updateStudent(idx, { student_code: e.target.value })}
                placeholder="Student code (optional)"
              />
              <Input
                value={student?.project_title || ''}
                onChange={(e) => updateStudent(idx, { project_title: e.target.value })}
                placeholder="Project / Topic title"
              />
              <Input
                value={student?.company_name || ''}
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
  );
}