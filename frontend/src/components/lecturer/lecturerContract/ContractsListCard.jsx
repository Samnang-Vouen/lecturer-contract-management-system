import React, { useState, useEffect } from 'react';
import { FileText, Filter, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import Select, { SelectItem } from '../../ui/Select';
import ContractCard from './ContractCard';

/**
 * ContractsListCard Component
 * Main card displaying all contracts with filtering
 */
export default function ContractsListCard({ 
  filteredContracts,
  total,
  loading,
  statusFilter,
  setStatusFilter,
  hourlyRate,
  lecturerProfile,
  authUser,
  onPreview,
  onDownload,
  onViewDetail,
  onSign
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Close menu on outside click
  useEffect(() => {
    const onDown = (e) => {
      const inMenu = e.target.closest('[data-menu]');
      const inEllipsis = e.target.closest('[data-ellipsis]');
      if (!inMenu && !inEllipsis) setMenuOpenId(null);
    };
    
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleMenuToggle = (contractId) => {
    setMenuOpenId(prev => prev === contractId ? null : contractId);
  };

  const handleAction = (action, ...args) => {
    setMenuOpenId(null);
    action(...args);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <CardTitle>All My Contracts ({total})</CardTitle>
        </div>
        <CardDescription>Complete history of your lecturer contracts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border bg-white overflow-x-auto w-full">
          {/* Filter bar */}
          <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                <Filter className="w-4 h-4 text-gray-400" />
                <span>Status</span>
              </div>
              <div className="w-full sm:w-56">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="All statuses"
                  className="w-full"
                  buttonClassName="h-11 text-base"
                >
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="WAITING_LECTURER">Waiting Lecturer</SelectItem>
                  <SelectItem value="WAITING_MANAGEMENT">Waiting Management</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CONTRACT_ENDED">Contract Ended</SelectItem>
                </Select>
              </div>
            </div>
            <div className="ml-auto text-sm text-gray-600 hidden md:block">
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </span>
              ) : (
                `${filteredContracts?.length || 0} of ${total}`
              )}
            </div>
          </div>

          {/* Contracts grid */}
          <div className="px-4 py-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {(filteredContracts || []).map(contract => (
              <ContractCard
                key={contract.id}
                contract={contract}
                hourlyRate={hourlyRate}
                lecturerProfile={lecturerProfile}
                authUser={authUser}
                menuOpenId={menuOpenId}
                onMenuToggle={handleMenuToggle}
                onPreview={() => handleAction(onPreview, contract.id)}
                onDownload={() => handleAction(onDownload, contract)}
                onViewDetail={() => handleAction(onViewDetail, contract)}
                onSign={() => handleAction(onSign, contract)}
              />
            ))}

            {/* Loading state */}
            {loading && (
              <div className="w-full py-10 col-span-full">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading contracts…
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!filteredContracts || filteredContracts.length === 0) && !loading && (
              <div className="w-full py-12 col-span-full">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <div className="text-gray-900 font-medium">No contracts found</div>
                  <div className="text-gray-500 text-sm">
                    You'll see your contracts here once they are generated
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
