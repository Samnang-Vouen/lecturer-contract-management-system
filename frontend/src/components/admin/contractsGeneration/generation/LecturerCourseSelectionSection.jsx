import React from 'react';
import { Search } from 'lucide-react';
import { Checkbox } from '../../../ui/Checkbox';
import Input from '../../../ui/Input';
import { hoursFromMapping } from '../../../../utils/contractHelpers';

export default function LecturerCourseSelectionSection({
  academicYear,
  dlgErrors,
  dlgCourseQuery,
  setDlgCourseQuery,
  dlgFilteredMappings,
  dlgSelectedMappingIds,
  setDlgSelectedMappingIds,
  setDlgErrors,
  dlgCombineByMapping,
  setDlgCombineByMapping,
  dlgHourlyRate,
}) {
  return (
    <div className="mt-5">
      <label className="block text-sm font-medium mb-1">Courses to include <span className="text-red-600">*</span></label>
      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input className="w-full pl-9" placeholder="Search by course name/code or class..." value={dlgCourseQuery} onChange={(e) => setDlgCourseQuery(e.target.value)} />
        </div>
        {dlgCourseQuery ? <button onClick={() => setDlgCourseQuery('')} className="text-xs text-gray-500 hover:text-gray-700">Clear</button> : null}
      </div>

      <div className="rounded-lg border max-h-56 overflow-y-auto divide-y bg-white">
        {dlgFilteredMappings.length === 0 ? <div className="p-4 text-sm text-gray-500">No courses found for {academicYear}.</div> : dlgFilteredMappings.map((mapping) => {
          const checked = dlgSelectedMappingIds.has(mapping.id);
          const typeHours = String(mapping.type_hours || '');
          const theoryHours = String(mapping.theory_hours || '').toLowerCase();
          const is15h = theoryHours === '15h' || (!theoryHours && /15h/i.test(typeHours));
          const is30h = theoryHours === '30h' || (!theoryHours && /30h/i.test(typeHours));
          const theoryGroups = Number(mapping.theory_groups ?? mapping.groups_15h ?? mapping.groups_theory ?? mapping.group_count_theory ?? 0) || 0;
          const canCombineTheory = (is15h || is30h) && theoryGroups > 1;
          const combined = canCombineTheory ? !!(dlgCombineByMapping[mapping.id] ?? mapping.theory_combined) : false;
          const computedHours = hoursFromMapping({ ...mapping, theory_combined: combined });
          const rate = parseFloat(String(dlgHourlyRate || '').replace(/[^0-9.-]/g, ''));
          const estimatedSalary = Number.isFinite(rate) ? Math.round(rate * (computedHours || 0)) : null;

          return (
            <div key={mapping.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <Checkbox id={`map-${mapping.id}`} checked={checked} onCheckedChange={() => {
                  const next = new Set(Array.from(dlgSelectedMappingIds));
                  if (checked) next.delete(mapping.id);
                  else next.add(mapping.id);
                  setDlgSelectedMappingIds(next);
                  setDlgErrors((prev) => ({ ...prev, courses: '' }));
                }} />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-gray-900">{mapping.course?.name} <span className="text-gray-500 font-normal">({computedHours || '-'}h)</span></div>
                  <div className="text-xs text-gray-600">{mapping.class?.name || 'Class'} • Year {mapping.year_level} • Term {mapping.term} • {mapping.academic_year}</div>
                  {canCombineTheory ? (
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-700 select-none">
                      <Checkbox checked={combined} onCheckedChange={(value) => setDlgCombineByMapping((prev) => ({ ...prev, [mapping.id]: !!value }))} />
                      Combine groups into 1 class
                      <span className="text-gray-500">({is15h ? '15h' : '30h'})</span>
                    </label>
                  ) : null}
                  {estimatedSalary != null ? <div className="mt-1 text-xs text-gray-600">Est. salary: {estimatedSalary.toLocaleString('en-US')}</div> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {dlgErrors.courses ? <p className="text-xs text-red-600 mt-1">{dlgErrors.courses}</p> : null}
    </div>
  );
}