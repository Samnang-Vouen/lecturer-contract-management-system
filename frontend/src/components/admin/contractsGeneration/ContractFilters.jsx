import React from 'react';
import Input from '../../ui/Input';
import Select, { SelectItem } from '../../ui/Select';
import { Search } from 'lucide-react';

/**
 * ContractFilters - Search and filter controls for contracts list
 */
export default function ContractFilters({ 
  search, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange 
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            className="w-full pl-9 rounded-xl" 
            placeholder="Search lecturer name without title" 
            value={search} 
            onChange={(e) => onSearchChange(e.target.value)} 
          />
        </div>
      </div>
      <div className="w-full md:w-auto md:min-w-[160px]">
        <Select 
          value={statusFilter} 
          onValueChange={onStatusFilterChange} 
          placeholder="All Status"
        >
          <SelectItem value="">All Status</SelectItem>
          <SelectItem value="WAITING_MANAGEMENT">Waiting Management</SelectItem>
          <SelectItem value="WAITING_LECTURER">Waiting Lecturer</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </Select>
      </div>
    </div>
  );
}
