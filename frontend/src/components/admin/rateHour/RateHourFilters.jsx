import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';

export default function RateHourFilters({ search, setSearch, departmentFilter, setDepartmentFilter, departmentOptions, nextAcademicYear }) {
  return (
    <Card className="border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Only lecturers with a department are shown. Rate {nextAcademicYear} is calculated from the latest hourly rate plus the Increase Rate entered by admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-[1.5fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search department, lecturer name, or title"
            className="pl-10 rounded-xl"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All departments</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  );
}