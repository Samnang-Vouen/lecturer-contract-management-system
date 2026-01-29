import React from 'react';

/**
 * Step indicator component for onboarding progress
 */
export default function OnboardingStepIndicator({ steps, currentStep }) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <>
      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-blue-500">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-800 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between overflow-x-auto gap-4 sm:gap-0 -mx-3 px-3 sm:mx-0 sm:px-0">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center min-w-[140px] sm:min-w-0">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                    currentStep === step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : currentStep > step.id
                      ? 'bg-blue-200 border-blue-200 text-blue-700'
                      : 'border-blue-300 text-blue-400 bg-white'
                  }`}
                >
                  {React.createElement(step.icon, { className: "h-4 w-4 sm:h-5 sm:w-5" })}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    currentStep === step.id ? 'text-blue-600' : 'text-blue-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-blue-400 mt-1">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden sm:block flex-1 mx-4">
                  <div className={`h-0.5 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-blue-300' : 'bg-blue-200'
                  }`}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
