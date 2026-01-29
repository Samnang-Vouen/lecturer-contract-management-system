import React from "react";
import { Plus, GraduationCap } from 'lucide-react';
import Button from "../../ui/Button";

/**
 * Header component for Classes Management page
 */
export default function ClassesHeader({ onAddClick }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-3 mb-2 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Classes Management</h1>
            <p className="text-gray-600 mt-1">Manage academic classes and assign courses</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={onAddClick} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Class
          </Button>
        </div>
      </div>
    </div>
  );
}
