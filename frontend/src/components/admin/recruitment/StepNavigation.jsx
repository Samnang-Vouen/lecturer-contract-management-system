import React from 'react';
import { User, GraduationCap, MessageCircle, DollarSign } from 'lucide-react';

const steps = [
  { key: 'add', label: 'Add Candidate', icon: User, color: 'blue' },
  { key: 'interview', label: 'Interview', icon: GraduationCap, color: 'indigo' },
  { key: 'discussion', label: 'Discussion', icon: MessageCircle, color: 'purple' },
  { key: 'final', label: 'Final Decision', icon: DollarSign, color: 'emerald' }
];

export default function StepNavigation({ activeStep, onStepChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-8">
      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.key;
            return (
              <button
                key={step.key}
                onClick={() => onStepChange(step.key)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r from-${step.color}-500 to-${step.color}-600 text-white shadow-lg shadow-${step.color}-500/30 scale-105` 
                    : 'bg-white text-slate-700 hover:bg-white hover:shadow-md border border-slate-200/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
