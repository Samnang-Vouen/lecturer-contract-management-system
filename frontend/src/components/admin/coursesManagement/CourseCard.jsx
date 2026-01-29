import React from 'react';
import { Eye, Edit, Trash2, BookOpen, Clock, Award } from 'lucide-react';

export default function CourseCard({ course, onView, onEdit, onDelete }) {
  return (
    <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 cursor-pointer transition-all duration-300 hover:shadow-lg group relative">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all duration-200 shadow-sm"
          title="View details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all duration-200 shadow-sm"
          title="Edit course"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all duration-200 shadow-sm"
          title="Delete course"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-3 pr-20">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
              {course.course_code}
            </h4>
            <p className="text-base font-semibold text-slate-700">{course.course_name}</p>
          </div>
        </div>
        
        {/* Description */}
        {course.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-2">
            {course.description}
          </p>
        )}
      </div>

      {/* Course Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-5 h-5" />
          <span>{course.hours || 0} hours</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Award className="w-5 h-5" />
          <span>{course.credits || 0} credits</span>
        </div>
      </div>
    </div>
  );
}
