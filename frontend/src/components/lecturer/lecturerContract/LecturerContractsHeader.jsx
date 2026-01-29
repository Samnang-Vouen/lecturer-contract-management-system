import React from 'react';
import { FileText } from 'lucide-react';

/**
 * LecturerContractsHeader Component
 * Page header for the lecturer contracts page
 */
export default function LecturerContractsHeader() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            My Contracts
          </h1>
          <p className="text-gray-600">Review, sign, and download your contracts</p>
        </div>
      </div>
    </div>
  );
}
