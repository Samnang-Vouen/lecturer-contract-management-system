import React, { useState, useEffect, useRef } from 'react';
import { FileText, Eye, Download, Info, MoreVertical, X } from 'lucide-react';
import ContractCardInfo from './ContractCardInfo';
import ContractPeriod from './ContractPeriod';
import ContractFinancials from './ContractFinancials';
import ContractCardFooter from './ContractCardFooter';
import {
  formatContractId,
  deriveLecturerBaseName,
  toSafePdfFilename
} from '../../../utils/contractUtils';

/**
 * Individual contract card component
 */
export default function ContractCard({ 
  contract, 
  isSelected,
  onClick,
  onPreview, 
  onDownload, 
  onSign, 
  onShowDetail,
  downloadingId 
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  const contractId = formatContractId(contract);
  const isDownloading = downloadingId === contract.id;

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleDownload = () => {
    const baseName = deriveLecturerBaseName(contract.lecturer);
    const filename = toSafePdfFilename(baseName, contract.id);
    onDownload(contract.id, filename);
    setMenuOpen(false);
  };

  return (
    <div
      onClick={onClick}
      className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg relative ${
        isSelected 
          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20' 
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Header with document icon and ID */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{contractId}</span>
        </div>
        
        {/* Menu Button */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(contract.id);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700"
              >
                <Eye className="w-4 h-4" />
                <span>View Contract</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                disabled={isDownloading}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetail(contract);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-orange-600"
              >
                <FileText className="w-4 h-4" />
                <span>View Detail</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ContractCardInfo contract={contract} />
      <ContractPeriod contract={contract} />
      <ContractFinancials contract={contract} />
      <ContractCardFooter 
        contract={contract} 
        onSign={onSign}
        onPreview={onPreview}
        onDownload={handleDownload}
        onShowDetail={onShowDetail}
        isDownloading={isDownloading}
      />
    </div>
  );
}
