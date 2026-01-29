import React from 'react';

export default function Textarea({ className = '', ...props }) {
  return (
    <textarea className={`w-full px-3 py-2 border text-black bg-gray-100 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`} {...props} />
  );
}
