import React from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import Button from '../../ui/Button.jsx';

export default function CoursesHeader({ viewType, setViewType, onAddCourse }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-3 mb-2 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-1">Manage your department's academic curriculum</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewType('table')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium ${
                viewType === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewType('grid')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium ${
                viewType === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
          </div>
          <Button
            onClick={onAddCourse}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Course
          </Button>
        </div>
      </div>
    </div>
  );
}
