import React from 'react';
import { FileBarChart, Loader2, RefreshCw } from 'lucide-react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

export default function RateHourHeader({ academicYear, defaultAcademicYear, isRefreshing, loadReport, setAcademicYear }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
            <FileBarChart className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
              Department Lecturer Rate Overview
            </h1>
            <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
              Review lecturer rate history, latest academic-year workload, uploaded evaluation feedback, and advisor contributions in one place.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-end">
          <div className="w-full sm:min-w-[220px] lg:w-[220px]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Academic Year
            </label>
            <Input
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              placeholder={defaultAcademicYear}
              className="rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => loadReport(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}