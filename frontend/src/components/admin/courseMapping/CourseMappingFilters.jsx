import React from 'react';
import Select, { SelectItem } from '../../ui/Select.jsx';

/**
 * CourseMappingFilters - Filter controls for academic year, term, and status
 */
export default function CourseMappingFilters({
  academicYearFilter,
  onAcademicYearFilterChange,
  termFilter,
  onTermFilterChange,
  statusFilter,
  onStatusFilterChange,
  academicYearOptions,
  termOptions,
  statusOptions,
  resultCount,
  loading,
  error,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between w-full mt-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* Academic Year Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-56">
          <label className="text-sm font-medium text-gray-700">Filter by Academic Year</label>
          <Select
            value={academicYearFilter}
            onValueChange={onAcademicYearFilterChange}
            className="w-full"
            buttonClassName="h-10"
          >
            <SelectItem value="ALL">All Academic Years</SelectItem>
            {academicYearOptions.map((y) => (
              <SelectItem key={`ay-${y}`} value={y}>
                {y}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Term Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-56">
          <label className="text-sm font-medium text-gray-700">Term</label>
          <Select
            value={termFilter}
            onValueChange={onTermFilterChange}
            className="w-full"
            buttonClassName="h-10"
          >
            <SelectItem value="ALL">All</SelectItem>
            {termOptions.map((t) => (
              <SelectItem key={`fterm-${t}`} value={t}>
                {t}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-56">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select
            value={statusFilter}
            onValueChange={onStatusFilterChange}
            className="w-full"
            buttonClassName="h-10"
          >
            <SelectItem value="ALL">All</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Result Info */}
      <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
        <div className="text-sm text-gray-500">
          {resultCount === 0 ? 'No course assignments' : `Showing ${resultCount} class${resultCount !== 1 ? 'es' : ''}`}
          {' '}
          {academicYearFilter === 'ALL' ? 'for all years' : `for ${academicYearFilter}`}
        </div>
        {loading && <span className="text-sm text-gray-500">Loading...</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
