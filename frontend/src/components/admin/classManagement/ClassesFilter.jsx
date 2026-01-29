import React from "react";
import Label from "../../ui/Label";
import Select, { SelectItem } from "../../ui/Select";

/**
 * Filter component for Classes Management page
 */
export default function ClassesFilter({ 
  selectedAcademicYear, 
  onAcademicYearChange, 
  academicYears, 
  totalClasses, 
  filteredCount 
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between w-full mt-6">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-gray-700" htmlFor="academic-year-filter">
          Filter by Academic Year:
        </Label>
        <div className="sm:w-56 w-full">
          <Select
            id="academic-year-filter"
            value={selectedAcademicYear}
            onValueChange={onAcademicYearChange}
            placeholder="Select academic year"
            className="w-full"
            buttonClassName="h-10 pr-8 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <SelectItem value="all">All Academic Years</SelectItem>
            {academicYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <div className="text-sm text-gray-500 sm:ml-auto">
        Showing <span className="font-medium text-gray-700">{filteredCount}</span> of{' '}
        <span className="font-medium text-gray-700">{totalClasses}</span> classes
      </div>
    </div>
  );
}
