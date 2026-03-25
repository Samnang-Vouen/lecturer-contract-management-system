import React from 'react';
import RateHourFilters from '../../components/admin/rateHour/RateHourFilters';
import RateHourHeader from '../../components/admin/rateHour/RateHourHeader';
import RateHourStats from '../../components/admin/rateHour/RateHourStats';
import RateHourTable from '../../components/admin/rateHour/RateHourTable';
import { useRateHourPageData } from '../../hooks/admin/useRateHourPageData';
import { useAuthStore } from '../../store/useAuthStore';

export default function RateHour() {
  const authUser = useAuthStore((state) => state.authUser);
  const {
    academicYear,
    setAcademicYear,
    defaultAcademicYear,
    report,
    drafts,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    isLoading,
    isRefreshing,
    savingRowId,
    loadReport,
    rateAcademicYears,
    latestAcademicYear,
    totalColumns,
    tableMinWidth,
    departmentOptions,
    filteredRows,
    visibleDepartmentLabel,
    stats,
    updateDraftIncreaseRate,
    updateDraftRemark,
    handleSaveRow,
  } = useRateHourPageData(authUser);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <RateHourHeader
          academicYear={academicYear}
          defaultAcademicYear={defaultAcademicYear}
          isRefreshing={isRefreshing}
          loadReport={loadReport}
          setAcademicYear={setAcademicYear}
        />

        <RateHourStats stats={stats} />

        <RateHourFilters
          search={search}
          setSearch={setSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          departmentOptions={departmentOptions}
          nextAcademicYear={report.nextAcademicYear}
        />

        <RateHourTable
          report={report}
          filteredRows={filteredRows}
          isLoading={isLoading}
          totalColumns={totalColumns}
          tableMinWidth={tableMinWidth}
          rateAcademicYears={rateAcademicYears}
          latestAcademicYear={latestAcademicYear}
          visibleDepartmentLabel={visibleDepartmentLabel}
          drafts={drafts}
          savingRowId={savingRowId}
          updateDraftIncreaseRate={updateDraftIncreaseRate}
          updateDraftRemark={updateDraftRemark}
          handleSaveRow={handleSaveRow}
        />
      </div>
    </div>
  );
}
