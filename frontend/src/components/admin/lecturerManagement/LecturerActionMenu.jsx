import React from 'react';
import { Eye, Edit, BookOpen, Power, Trash2 } from 'lucide-react';

export default function LecturerActionMenu({ 
  lecturer, 
  coords, 
  onView, 
  onEdit, 
  onAssignCourses, 
  onToggleStatus, 
  onDelete 
}) {
  if (!lecturer) return null;

  const menuItems = [
    { icon: Eye, label: 'View Profile', onClick: () => onView(lecturer) },
    { icon: Edit, label: 'Edit Profile', onClick: () => onEdit(lecturer) },
    { icon: BookOpen, label: 'Assign Courses', onClick: () => onAssignCourses(lecturer) },
    { 
      icon: Power, 
      label: lecturer.status === 'active' ? 'Deactivate' : 'Activate', 
      onClick: () => onToggleStatus(lecturer) 
    },
    { icon: Trash2, label: 'Delete', onClick: () => onDelete(lecturer), danger: true },
  ];

  return (
    <div
      className='lecturer-action-menu fixed z-[9999] w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100'
      style={{
        top: `${coords.y}px`,
        left: `${coords.x}px`,
      }}
    >
      {menuItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            onClick={item.onClick}
            className={`
              w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors
              ${item.danger 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-gray-700 hover:bg-gray-50'}
            `}
          >
            <Icon className='w-4 h-4' />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
