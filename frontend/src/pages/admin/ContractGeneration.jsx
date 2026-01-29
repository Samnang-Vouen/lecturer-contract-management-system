import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '../../components/ui/Button';
import { Plus, FileText, Loader2, Eye, Download, Trash2, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useContractData } from '../../hooks/admin/contractGeneration/useContractData';
import { useContractMappings } from '../../hooks/admin/contractGeneration/useContractMappings';
import { useContractActions } from '../../hooks/admin/contractGeneration/useContractActions';
import { useContractMenu } from '../../hooks/admin/contractGeneration/useContractMenu';
import ContractFilters from '../../components/admin/contractsGeneration/ContractFilters';
import ContractCard from '../../components/admin/contractsGeneration/ContractCard';
import ContractGenerationDialog from '../../components/admin/contractsGeneration/ContractGenerationDialog';
import ContractDeleteDialog from '../../components/admin/contractsGeneration/ContractDeleteDialog';
import { formatContractId } from '../../utils/contractHelpers';

export default function ContractGeneration() {
  const { authUser } = useAuthStore();
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, label: '' });

  // Custom hooks
  const contractData = useContractData();
  const contractMappings = useContractMappings(academicYear);
  const contractActions = useContractActions(
    contractData.contracts,
    contractData.setContracts,
    contractData.refreshContracts
  );
  const contractMenu = useContractMenu(contractData.contracts);

  // Fetch mappings for different academic years in contracts
  useEffect(() => {
    const years = Array.from(new Set((contractData.contracts || []).map(c => c.academic_year).filter(Boolean)));
    const missing = years.filter(y => !(y in contractMappings.mappingsByYear));
    if (missing.length === 0) return;

    Promise.all(missing.map(year => contractMappings.fetchMappingsForYear(year)));
  }, [contractData.contracts, contractMappings]);

  // Filter contracts based on search and auth
  const filteredContracts = useMemo(() => {
    const normalize = (s) => (s || '').toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
    const stripTitle = (s) => {
      const titles = '(mr|mrs|ms|miss|dr|prof|professor)';
      return s.replace(new RegExp(`^${titles}\\s+`, 'i'), '').trim();
    };
    const qRaw = normalize(contractData.search || '');
    const qName = stripTitle(qRaw);
    const pool = (contractData.contracts || []);
    
    if (!qName) return pool;
    
    return pool.filter(c => {
      const lecturerTitle = normalize(c.lecturer?.LecturerProfile?.title || c.lecturer?.title || '');
      const lecturerNameBase = normalize(c.lecturer?.display_name || c.lecturer?.full_name || c.lecturer?.email || '');
      const fullName = `${lecturerTitle ? lecturerTitle + ' ' : ''}${lecturerNameBase}`.trim();
      const candidate = stripTitle(fullName);
      return candidate.startsWith(qName);
    });
  }, [contractData.contracts, contractData.search, authUser]);

  const handleCreateContract = async (payload) => {
    // Helper to safely parse integers
    const parseIntSafe = (value, defaultValue = null) => {
      if (value === null || value === undefined || value === '') return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    // Helper to extract number from strings like "Term 1" -> 1, "Year 2" -> 2
    const extractNumber = (value, defaultValue = null) => {
      if (value === null || value === undefined || value === '') return defaultValue;
      if (typeof value === 'number') return value;
      const match = String(value).match(/\d+/);
      return match ? parseInt(match[0], 10) : defaultValue;
    };

    // Clean up the courses array to ensure proper data types
    const cleanedCourses = payload.courses.map(course => ({
      course_id: parseIntSafe(course.course_id),
      class_id: parseIntSafe(course.class_id),
      course_name: course.course_name || '',
      year_level: extractNumber(course.year_level),
      term: extractNumber(course.term),
      academic_year: course.academic_year || academicYear,
      hours: parseIntSafe(course.hours)
    }));

    const contractPayload = {
      lecturer_user_id: parseIntSafe(payload.lecturerId),
      academic_year: academicYear,
      term: extractNumber(payload.courses[0]?.term, 1),
      year_level: extractNumber(payload.courses[0]?.year_level),
      start_date: payload.start_date,
      end_date: payload.end_date,
      courses: cleanedCourses,
      items: payload.items
    };
    console.log('Sending contract payload:', contractPayload);
    await contractActions.createContract(contractPayload);
  };

  const openDeleteConfirm = (id) => {
    if (!id) return;
    const c = (contractData.contracts || []).find(x => x.id === id);
    const label = c ? formatContractId(c) : `#${id}`;
    setConfirmDelete({ open: true, id, label });
    contractMenu.closeMenu();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl leading-tight font-bold text-gray-900">Contract Management</h1>
              <p className="text-gray-600 mt-1">Generate and manage lecturer contracts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setShowGenerateDialog(true)} 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 mr-2" /> Generate Contract
            </Button>
          </div>
        </div>
      </div>

      {/* Contract Generation Dialog */}
      <ContractGenerationDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        academicYear={academicYear}
        onAcademicYearChange={setAcademicYear}
        lecturers={contractMappings.lecturers}
        mappings={contractMappings.mappings}
        mappingUserId={contractMappings.mappingUserId}
        onCreate={handleCreateContract}
      />

      {/* Search & filter bar */}
      <ContractFilters
        search={contractData.search}
        onSearchChange={contractData.setSearch}
        statusFilter={contractData.statusFilter}
        onStatusFilterChange={contractData.setStatusFilter}
      />

      {/* Contracts Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600"/>
            <h2 className="text-lg font-semibold">Contracts ({contractData.total})</h2>
          </div>
          <div className="text-sm text-gray-600">
            {(contractData.contracts?.length || 0)} of {contractData.total} shown
          </div>
        </div>

        {/* Contract Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Loading skeletons */}
          {(contractData.loading && contractData.contracts.length === 0 && !contractData.search) && 
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`sk-${i}`} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded"/>
                  <div className="h-6 w-6 bg-gray-200 rounded"/>
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded"/>
                  <div className="h-3 w-40 bg-gray-100 rounded"/>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded"/>
                  <div className="h-4 w-20 bg-gray-200 rounded"/>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="h-5 w-20 bg-gray-100 rounded-full"/>
                  <div className="h-8 w-8 bg-gray-100 rounded"/>
                </div>
              </div>
            ))
          }

          {/* Contract Cards */}
          {(filteredContracts || []).map(contract => (
            <ContractCard
              key={contract.id}
              contract={contract}
              mappingsByYear={contractMappings.mappingsByYear}
              ratesByLecturer={contractActions.ratesByLecturer}
              onMenuOpen={contractMenu.openMenu}
              onPreview={contractActions.previewPdf}
              onDownload={contractActions.downloadPdf}
            />
          ))}

          {/* Empty state */}
          {(!contractData.loading && (filteredContracts || []).length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
              <p className="text-gray-500 mb-4">
                {contractData.search ? 'Try adjusting your search criteria' : 'Get started by generating your first contract'}
              </p>
              {!contractData.search && (
                <Button onClick={() => setShowGenerateDialog(true)} className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Generate Contract
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={contractData.sentinelRef} className="flex justify-center items-center py-8 text-sm text-gray-500">
          {contractData.loading && contractData.contracts.length > 0 && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading more contracts...
            </div>
          )}
          {!contractData.loading && contractData.hasMore && 'Scroll to load more'}
          {!contractData.loading && !contractData.hasMore && contractData.contracts.length > 0 && 'All contracts loaded'}
        </div>
      </div>

      {/* Floating actions menu (portal) */}
      {contractMenu.openMenuId && ReactDOM.createPortal(
        <div className="fixed z-50 contract-action-menu" style={{ top: contractMenu.menuCoords.y, left: contractMenu.menuCoords.x }}>
          <div className="w-44 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm">
            <button 
              onClick={() => { contractActions.previewPdf(contractMenu.openMenuId); contractMenu.closeMenu(); }} 
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
            >
              <Eye className="w-4 h-4"/> View Contract
            </button>
            <button 
              onClick={() => { contractActions.downloadPdf(contractMenu.openMenuId); contractMenu.closeMenu(); }} 
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
            >
              <Download className="w-4 h-4"/> Download PDF
            </button>
            {contractMenu.currentMenuContract && contractMenu.currentMenuContract.status !== 'COMPLETED' && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <button 
                  onClick={() => openDeleteConfirm(contractMenu.openMenuId)} 
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-red-600"
                >
                  <Trash2 className="w-4 h-4"/> Delete
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation dialog */}
      <ContractDeleteDialog
        open={confirmDelete.open}
        onOpenChange={(v) => setConfirmDelete(prev => ({ ...prev, open: v }))}
        contractId={confirmDelete.id}
        contractLabel={confirmDelete.label}
        onConfirm={contractActions.deleteContract}
      />
    </div>
  );
}