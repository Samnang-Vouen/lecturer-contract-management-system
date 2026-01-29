import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Edit3 } from 'lucide-react';
import Input from '../../ui/Input.jsx';
import Button from '../../ui/Button.jsx';
import Select, { SelectItem } from '../../ui/Select.jsx';
import { DEPARTMENT_OPTIONS } from '../../../utils/userHelpers.jsx';

/**
 * EditUserModal Component
 * Modal for editing user information
 */
export default function EditUserModal({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  onSubmit,
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { 
        document.body.style.overflow = original; 
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                  <p className="text-sm text-gray-600">Update user information and permissions</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Full Name</label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} 
                placeholder="Enter full name" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <Input 
                type="email" 
                value={editForm.email} 
                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} 
                placeholder="Enter email address" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">User Role</label>
              <Select 
                value={editForm.role} 
                onValueChange={(v) => setEditForm(f => ({ ...f, role: v }))} 
                placeholder="Select user role"
              >
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="management">Management</SelectItem>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Department</label>
              <Select 
                value={editForm.department} 
                onValueChange={(v) => setEditForm(f => ({ ...f, department: v }))} 
                placeholder="Select department"
              >
                {DEPARTMENT_OPTIONS.filter(d => d !== 'all').map(d => 
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                )}
              </Select>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex gap-3">
            <Button 
              onClick={onSubmit} 
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-11" 
              disabled={!editForm.email || !editForm.role || !editForm.department}
            >
              Update User
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 rounded-xl h-11"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
