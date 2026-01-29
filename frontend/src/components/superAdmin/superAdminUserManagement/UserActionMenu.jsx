import React from 'react';
import { Edit3, UserX, UserCheck, Trash2 } from 'lucide-react';

/**
 * UserActionMenu Component
 * Floating context menu for user actions
 */
export default function UserActionMenu({
  user,
  menuCoords,
  onEdit,
  onDeactivate,
  onDelete,
}) {
  if (!user) return null;

  return (
    <div 
      className="fixed z-[9999] user-action-menu animate-in fade-in zoom-in-95 duration-100" 
      style={{ 
        top: `${menuCoords.y}px`, 
        left: `${menuCoords.x}px`
      }}
    >
      <div className="w-48 bg-white border-2 border-gray-300 rounded-xl shadow-2xl py-2">
        <button 
          onClick={() => onEdit(user)} 
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
        >
          <Edit3 className="w-4 h-4 text-blue-600" /> 
          <span className="text-sm font-medium text-gray-700">Edit User</span>
        </button>
        
        <button 
          onClick={() => onDeactivate(user)} 
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-left transition-colors"
        >
          {user.status === 'active' ? (
            <>
              <UserX className="w-4 h-4 text-yellow-600" /> 
              <span className="text-sm font-medium text-gray-700">Deactivate</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-green-600" /> 
              <span className="text-sm font-medium text-gray-700">Activate</span>
            </>
          )}
        </button>
        
        <button 
          onClick={() => onDelete(user)} 
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-600" /> 
          <span className="text-sm font-medium text-red-600">Delete User</span>
        </button>
      </div>
    </div>
  );
}
