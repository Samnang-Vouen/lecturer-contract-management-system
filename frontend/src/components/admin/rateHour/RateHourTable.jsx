import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/Table';
import RateHourTableRow from './RateHourTableRow';

export default function RateHourTable({ report, filteredRows, isLoading, totalColumns, tableMinWidth, rateAcademicYears, latestAcademicYear, visibleDepartmentLabel, drafts, savingRowId, updateDraftIncreaseRate, updateDraftRemark, handleSaveRow }) {
  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader className="border-b border-gray-200 bg-white">
        <CardTitle>Rate Hour Table</CardTitle>
        <CardDescription>
          Historical rates are read-only. Admins can enter Increase Rate, and Rate {report.nextAcademicYear} is calculated from the latest hourly rate plus that increase.
        </CardDescription>
        <div className="pt-2 text-sm text-slate-600">
          Department: <span className="font-medium text-slate-900">{visibleDepartmentLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[1900px]" style={{ minWidth: tableMinWidth }}>
            <TableHeader>
              <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
                <TableHead className="border-r border-slate-200 text-slate-700" colSpan={3}>Lecturer</TableHead>
                <TableHead className="border-r border-slate-200 text-slate-700" colSpan={rateAcademicYears.length}>Last 3 Academic Years Rate</TableHead>
                <TableHead className="border-r border-slate-200 text-slate-700" colSpan={6}>Latest Academic Year {latestAcademicYear}</TableHead>
                <TableHead className="border-r border-slate-200 text-slate-700" colSpan={4}>Additional Contribution</TableHead>
                <TableHead className="text-slate-700" colSpan={6}>Summary</TableHead>
              </TableRow>
              <TableRow className="bg-white hover:bg-white">
                <TableHead className="min-w-[180px]">English Name</TableHead>
                <TableHead className="min-w-[180px]">Khmer Name</TableHead>
                <TableHead className="min-w-[110px] border-r border-slate-200">Gender</TableHead>
                {rateAcademicYears.map((year, index) => <TableHead key={year} className={`min-w-[140px] ${index === rateAcademicYears.length - 1 ? 'border-r border-slate-200' : ''}`}>Rate {year}</TableHead>)}
                <TableHead className="min-w-[120px]">Term 1 Hours</TableHead>
                <TableHead className="min-w-[120px]">Feedback</TableHead>
                <TableHead className="min-w-[120px]">Term 2 Hours</TableHead>
                <TableHead className="min-w-[120px]">Feedback</TableHead>
                <TableHead className="min-w-[120px]">Term 3 Hours</TableHead>
                <TableHead className="min-w-[120px] border-r border-slate-200">Feedback</TableHead>
                <TableHead className="min-w-[110px]">Capstone I</TableHead>
                <TableHead className="min-w-[110px]">Capstone II</TableHead>
                <TableHead className="min-w-[110px]">Internship I</TableHead>
                <TableHead className="min-w-[110px] border-r border-slate-200">Internship II</TableHead>
                <TableHead className="min-w-[100px]">Total Terms</TableHead>
                <TableHead className="min-w-[110px]">Total Hours</TableHead>
                <TableHead className="min-w-[130px]">Average Feedback</TableHead>
                <TableHead className="min-w-[130px]">Increase Rate</TableHead>
                <TableHead className="min-w-[150px]">Rate {report.nextAcademicYear}</TableHead>
                <TableHead className="min-w-[280px]">Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="py-16 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      Loading rate hour report...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="py-16 text-center text-slate-500">
                    No lecturer matched the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <RateHourTableRow
                    key={row.lecturerId}
                    row={row}
                    draft={drafts[row.lecturerId] || { increaseRate: '', rates: {}, remark: '' }}
                    rateAcademicYears={rateAcademicYears}
                    nextAcademicYear={report.nextAcademicYear}
                    savingRowId={savingRowId}
                    updateDraftIncreaseRate={updateDraftIncreaseRate}
                    updateDraftRemark={updateDraftRemark}
                    handleSaveRow={handleSaveRow}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}