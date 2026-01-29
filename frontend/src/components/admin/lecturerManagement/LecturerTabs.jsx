import React from 'react';
import { List, UserPlus } from 'lucide-react';

export default function LecturerTabs({ activeView, setActiveView }) {
  const tabs = [
    { id: 'list', label: 'All Lecturers', icon: List },
    { id: 'add', label: 'Add Lecturer', icon: UserPlus },
  ];

  return (
    <div className='flex gap-2 border-b border-gray-200'>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${isActive 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}
            `}
          >
            <Icon className='w-4 h-4' />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
