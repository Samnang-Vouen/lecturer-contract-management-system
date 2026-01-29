import React from 'react';
import { ArrowUpDown, Clock } from 'lucide-react';
import Select, { SelectItem } from '../../ui/Select.jsx';

export default function CoursesFilters({ sortBy, setSortBy, hoursFilter, setHoursFilter }) {
  return (
    <>
      <div className="w-full sm:w-56">
        <span className="sr-only">Sort by</span>
        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Select
            value={sortBy}
            onValueChange={setSortBy}
            className="w-full"
            buttonClassName="h-10 pl-9 pr-8 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <SelectItem value="code">Sort: Code (A–Z)</SelectItem>
            <SelectItem value="name">Sort: Name (A–Z)</SelectItem>
          </Select>
        </div>
      </div>
      <div className="w-full sm:w-56">
        <span className="sr-only">Hours</span>
        <div className="relative">
          <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Select
            value={hoursFilter}
            onValueChange={setHoursFilter}
            className="w-full"
            buttonClassName="h-10 pl-9 pr-8 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <SelectItem value="">All Hours</SelectItem>
            <SelectItem value="15">15 hours</SelectItem>
            <SelectItem value="30">30 hours</SelectItem>
            <SelectItem value="45">45 hours</SelectItem>
            <SelectItem value="90">90 hours</SelectItem>
          </Select>
        </div>
      </div>
    </>
  );
}
