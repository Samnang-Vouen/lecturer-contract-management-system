import React from 'react';
import { Edit, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function CourseMappingGroup({ group, courseMap, lecturers, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'text-green-600 bg-green-50';
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      case 'Contacting': return 'text-blue-600 bg-blue-50';
      case 'Rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      case 'Pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4">
        <h3 className="font-semibold text-lg text-blue-900">
          {group.class?.name || 'Unknown Class'} - {group.class?.term || ''} ({group.class?.academic_year || ''})
        </h3>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-blue-700">Total: {group.stats.total}</span>
          <span className="text-green-700">Assigned: {group.stats.assigned}</span>
          <span className="text-yellow-700">Pending: {group.stats.pending}</span>
          <span className="text-purple-700">Hours: {group.stats.hoursAssigned}/{group.stats.hoursNeeded}</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {group.entries.map(entry => {
          const course = courseMap[entry.course_id] || {};
          const lecturer = lecturers.find(l => l.id === entry.lecturer_profile_id);
          
          return (
            <div key={entry.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{course.course_code} - {course.course_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(entry.status)}`}>
                      {getStatusIcon(entry.status)}
                      {entry.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Lecturer: {lecturer?.name || 'Not assigned'}</p>
                    {entry.theory_groups > 0 && (
                      <p>Theory: {entry.theory_groups} groups × {entry.theory_hours || '15h'}</p>
                    )}
                    {entry.lab_groups > 0 && (
                      <p>Lab: {entry.lab_groups} groups × 30h</p>
                    )}
                    {entry.availability && (
                      <p className="text-xs">Availability: {entry.availability}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(entry)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(entry)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
