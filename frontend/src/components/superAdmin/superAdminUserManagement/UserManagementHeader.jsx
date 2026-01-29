import React from 'react';
import { Users, Plus } from 'lucide-react';
import Button from '../../ui/Button';

/**
 * UserManagementHeader Component
 * Displays the page header with title and create user button
 */
export default function UserManagementHeader({ onCreateUser }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              User Management System
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-lg">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>
        <Button 
          onClick={onCreateUser} 
          className="w-full sm:w-auto justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5 mr-2" /> 
          <span>Add New User</span>
        </Button>
      </div>
    </div>
  );
}
