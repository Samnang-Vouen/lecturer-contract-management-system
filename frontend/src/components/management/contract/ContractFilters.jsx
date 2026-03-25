import React from 'react';
import { motion } from 'framer-motion';
import Input from '../../ui/Input.jsx';
import Select, { SelectItem } from '../../ui/Select.jsx';
import { Filter as FilterIcon } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'WAITING_MANAGEMENT', label: 'Waiting Management' },
  { value: 'WAITING_ADVISOR', label: 'Waiting Advisor' },
  { value: 'WAITING_LECTURER', label: 'Waiting Lecturer' },
  { value: 'WAITING_RESPONSE', label: 'Waiting Response' },
  { value: 'REQUEST_REDO', label: 'Request Redo' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CONTRACT_ENDED', label: 'Contract Ended' },
];

/**
 * Search and filter controls for contracts
 */
export default function ContractFilters({ q, setQ, status, setStatus, setPage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="relative z-30 rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center"
    >
      <div className="relative flex-1 min-w-[220px]">
        <Input 
          className="pl-3 h-11 rounded-xl" 
          placeholder="Search lecturer name without title" 
          value={q} 
          onChange={(e) => { 
            setQ(e.target.value); 
            setPage(1); 
          }} 
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 border border-gray-300 rounded-xl h-11 px-2.5 bg-white">
          <FilterIcon className="w-4 h-4 text-gray-500" />
          <div className="min-w-[160px] flex items-center">
            <Select
              value={status}
              onValueChange={(v) => { 
                setStatus(v); 
                setPage(1); 
              }}
              placeholder="All Status"
              className="w-full"
              unstyled
              buttonClassName="h-11 text-sm bg-transparent px-1 pr-6"
              dropdownClassName="z-50"
            >
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'ALL'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
