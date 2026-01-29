import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, onRatingChange, disabled = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button 
          key={star} 
          type="button" 
          onClick={() => !disabled && onRatingChange(star)} 
          disabled={disabled}
          className={`p-1 rounded-md transition-all duration-200 ${
            disabled 
              ? 'cursor-not-allowed opacity-50' 
              : star <= rating 
                ? 'text-amber-400 hover:text-amber-500' 
                : 'text-gray-300 hover:text-amber-300'
          }`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );
}
