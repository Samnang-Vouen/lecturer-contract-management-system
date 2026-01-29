import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({ page, setPage, totalPages }) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className='flex items-center justify-between px-6 py-4 border-t border-gray-100'>
      <div className='text-sm text-gray-600'>
        Page {page} of {totalPages}
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={!canGoPrev}
          className={`
            inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors
            ${canGoPrev 
              ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
          aria-label='Previous page'
        >
          <ChevronLeft className='w-4 h-4' />
          Previous
        </button>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={!canGoNext}
          className={`
            inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors
            ${canGoNext 
              ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
          aria-label='Next page'
        >
          Next
          <ChevronRight className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
}
