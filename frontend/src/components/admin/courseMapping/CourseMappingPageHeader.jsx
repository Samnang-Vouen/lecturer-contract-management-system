import React from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import Button from '../../ui/Button.jsx';
import CourseMappingFilters from './CourseMappingFilters.jsx';

export default function CourseMappingPageHeader(props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-3 mb-2 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl leading-tight font-bold text-gray-900">Course Mapping</h1>
            <p className="text-gray-600 mt-1">Class-based view of lecturer assignments and workload</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={props.startAdd} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl">
            <Plus className="h-4 w-4 mr-2" /> Add Course Assignment
          </Button>
        </div>
      </div>

      <CourseMappingFilters
        academicYearFilter={props.academicYearFilter}
        onAcademicYearFilterChange={props.setAcademicYearFilter}
        termFilter={props.termFilter}
        onTermFilterChange={props.setTermFilter}
        statusFilter={props.statusFilter}
        onStatusFilterChange={props.setStatusFilter}
        academicYearOptions={props.academicYearOptions}
        termOptions={props.termOptions}
        statusOptions={props.statusOptions}
        resultCount={props.grouped.length}
        loading={props.loading}
        error={props.error}
      />
    </div>
  );
}