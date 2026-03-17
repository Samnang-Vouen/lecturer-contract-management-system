import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../ui/Button';

export default function OnboardingNavigation({ currentStep, stepCount, handlePrevious, handleNext, handleSubmit, isSubmitting }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={currentStep === 1}
        className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />Previous
      </Button>
      {currentStep === stepCount ? (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2 bg-black text-white hover:bg-gray-800 rounded-md flex items-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isSubmitting ? <span className="flex items-center">Submitting...</span> : <span className="flex items-center">Complete Onboarding</span>}
        </Button>
      ) : (
        <Button
          onClick={handleNext}
          className="w-full sm:w-auto px-6 py-2 bg-black text-white hover:bg-gray-800 rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}