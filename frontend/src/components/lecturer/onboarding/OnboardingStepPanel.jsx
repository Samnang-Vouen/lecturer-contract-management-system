import React from 'react';

export default function OnboardingStepPanel({ step, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-blue-800 flex items-center mb-2">
          {React.createElement(step.icon, { className: 'h-5 w-5 mr-2' })}
          {step.title}
        </h2>
        <p className="text-blue-600 text-sm">{step.description}</p>
      </div>
      {children}
    </div>
  );
}