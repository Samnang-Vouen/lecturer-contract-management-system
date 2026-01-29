import React from 'react';
import { Edit2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function EditQuestionModal({
  isOpen,
  onClose,
  onConfirm,
  question,
  onQuestionChange,
  suggestions,
  loadingSuggestions,
  onSelectSuggestion
}) {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/60 w-full max-w-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Edit2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Edit Question</h3>
            <p className="text-slate-600 text-sm mt-1">Modify the question text</p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700 mb-3 block">Question Text</label>
          <textarea
            rows={4}
            value={question.question_text}
            onChange={(e) => onQuestionChange({ ...question, question_text: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white resize-none"
            placeholder="Type your question... (suggestions will appear after 3 characters)"
          />
          
          {/* Suggestions */}
          {(loadingSuggestions || suggestions.length > 0) && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">Suggestions from database</label>
                {loadingSuggestions && <LoadingSpinner size="w-4 h-4" />}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                {suggestions.length === 0 && !loadingSuggestions ? (
                  <p className="text-sm text-slate-500 text-center py-2">No suggestions found</p>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => onSelectSuggestion(suggestion.question_text)}
                      className="w-full text-left p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all duration-200 group"
                    >
                      <p className="text-sm text-slate-700 group-hover:text-blue-700">{suggestion.question_text}</p>
                      <p className="text-xs text-slate-500 mt-1">Category: {suggestion.category}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(question.id, question.question_text)}
            disabled={!question.question_text.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
