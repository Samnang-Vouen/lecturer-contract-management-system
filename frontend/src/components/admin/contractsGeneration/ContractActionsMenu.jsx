import React from 'react';
import ReactDOM from 'react-dom';
import { Download, Eye, Trash2 } from 'lucide-react';

export default function ContractActionsMenu({ contractMenu, contractActions, openDeleteConfirm }) {
  if (!contractMenu.openMenuId) return null;
  return ReactDOM.createPortal(
    <div className="fixed z-50 contract-action-menu" style={{ top: contractMenu.menuCoords.y, left: contractMenu.menuCoords.x }}>
      <div className="w-44 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm">
        <button onClick={() => { contractActions.previewPdf(contractMenu.openMenuId); contractMenu.closeMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
          <Eye className="w-4 h-4" /> View Contract
        </button>
        <button onClick={() => { contractActions.downloadPdf(contractMenu.openMenuId); contractMenu.closeMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
          <Download className="w-4 h-4" /> Download PDF
        </button>
        {contractMenu.currentMenuContract && contractMenu.currentMenuContract.status !== 'COMPLETED' ? (
          <>
            <div className="my-1 border-t border-gray-100" />
            <button onClick={() => openDeleteConfirm(contractMenu.openMenuId)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-left text-red-600">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}