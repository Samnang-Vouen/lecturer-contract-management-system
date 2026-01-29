import React from 'react';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog.jsx';
import Button from '../../ui/Button.jsx';
import { formatFullName } from '../../../utils/userHelpers.jsx';

/**
 * DeleteUserModal Component
 * Confirmation dialog for user deletion
 */
export default function DeleteUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
}) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { 
      if (!open) onClose(); 
    }}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Confirm User Deletion
              </DialogTitle>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 text-center space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{formatFullName(user)}</span>?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={onConfirm} 
              className="bg-red-600 hover:bg-red-700 text-white sm:min-w-[120px] rounded-xl"
            >
              Delete User
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="sm:min-w-[120px] rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
