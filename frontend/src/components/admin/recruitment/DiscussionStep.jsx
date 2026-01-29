import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function DiscussionStep({ onProceed }) {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Discussion Phase</h2>
          <p className="text-slate-600 mt-1">Candidate under team review</p>
        </div>
      </div>

      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-3">External Discussion in Progress</h3>
        <p className="text-slate-600 max-w-lg mx-auto mb-8">
          The candidate is currently being discussed by the evaluation team. 
          Please proceed to the final decision when discussions are complete.
        </p>
        <button
          onClick={onProceed}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all duration-300"
        >
          Proceed to Final Decision
        </button>
      </div>
    </div>
  );
}
