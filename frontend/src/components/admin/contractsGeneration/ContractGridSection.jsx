import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import ContractCard from './ContractCard';

function ContractSkeletonCard({ index }) {
  return (
    <div key={`sk-${index}`} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-6 w-6 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-40 bg-gray-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t">
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-8 w-8 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function ContractGridSection({ filteredContracts, totalBase, contractData, contractActions, handleOpenRedoEdit }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Contracts ({(filteredContracts || []).length} of {totalBase})</h2>
        </div>
        <div className="text-sm text-gray-600">{(filteredContracts || []).length} of {totalBase} shown</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {contractData.loading && contractData.contracts.length === 0 && !contractData.search ? Array.from({ length: 8 }).map((_, index) => <ContractSkeletonCard key={index} index={index} />) : null}

        {(filteredContracts || []).map((contract) => (
          <ContractCard
            key={`${contract.contract_type || 'TEACHING'}-${contract.id}`}
            contract={contract}
            ratesByLecturer={contractActions.ratesByLecturer}
            onPreview={contractActions.previewPdf}
            onDownload={contractActions.downloadPdf}
            onEdit={handleOpenRedoEdit}
          />
        ))}

        {!contractData.loading && !(filteredContracts || []).length ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
            <p className="text-gray-500 mb-4">{contractData.search ? 'Try adjusting your search criteria' : 'Get started by generating your first contract'}</p>
          </div>
        ) : null}
      </div>

      <div ref={contractData.sentinelRef} className="flex justify-center items-center py-8 text-sm text-gray-500">
        {contractData.loading && contractData.contracts.length > 0 ? <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading more contracts...</div> : null}
        {!contractData.loading && contractData.hasMore ? 'Scroll to load more' : null}
        {!contractData.loading && !contractData.hasMore && contractData.contracts.length > 0 ? 'All contracts loaded' : null}
      </div>
    </div>
  );
}