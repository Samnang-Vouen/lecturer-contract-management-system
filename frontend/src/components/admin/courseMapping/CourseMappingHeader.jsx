import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Select, { SelectItem } from '../ui/Select.jsx';

export default function CourseMappingHeader({
  academicYearFilter,
  setAcademicYearFilter,
  termFilter,
  setTermFilter,
  statusFilter,
  setStatusFilter,
  academicYearOptions,
  termOptions,
  statusOptions,
  onAddMapping
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Course Mapping</h1>
            <p className="text-gray-600 mt-1">Assign lecturers to courses</p>
          </div>
        </div>
        
        <Button onClick={onAddMapping} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <div className="flex-1">
          <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
            <SelectItem value="ALL">All Academic Years</SelectItem>
            {academicYearOptions.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </Select>
        </div>
        
        <div className="flex-1">
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectItem value="ALL">All Terms</SelectItem>
            {termOptions.map(term => (
              <SelectItem key={term} value={term}>{term}</SelectItem>
            ))}
          </Select>
        </div>
        
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
