import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import Input from '../../ui/Input';
import Label from '../../ui/Label';
import AutocompleteInput from './AutocompleteInput';
import countries from 'world-countries';

const DEGREE_OPTIONS = [
  { value: 'ASSOCIATE', label: "Associate Degree" },
  { value: 'BACHELOR', label: "Bachelor's Degree" },
  { value: 'MASTER', label: "Master's Degree" },
  { value: 'PHD', label: "Ph.D." },
  { value: 'POSTDOC', label: "Post-Doctoral" }
];

const DEGREE_LABELS = {
  'BACHELOR': "Bachelor's Degree",
  'MASTER': "Master's Degree", 
  'PHD': "Ph.D.",
  'POSTDOC': "Post-Doctoral",
  'ASSOCIATE': "Associate Degree"
};

/**
 * Step 3: Education Information
 */
export default function OnboardingEducation({ 
  formData, 
  updateForm,
  universitySuggestions,
  majorSuggestions
}) {
  const [showDegreeOptions, setShowDegreeOptions] = useState(false);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const yearContainerRef = useRef(null);

  // Prepare country list
  const countryList = useMemo(() => 
    countries.map(c => c.name.common).sort(), 
    []
  );

  const countrySuggestions = useMemo(() => {
    const q = String(formData.country || '').trim().toLowerCase();
    if (!q) return [];
    return countryList.filter(c => c.toLowerCase().startsWith(q)).slice(0, 8);
  }, [formData.country, countryList]);

  // Year options
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const list = [];
    for (let y = current; y >= 2000; y--) list.push(String(y));
    return list;
  }, []);

  // Close year dropdown on outside click
  useEffect(() => {
    if (!showYearOptions) return;
    const handler = (e) => {
      if (yearContainerRef.current && !yearContainerRef.current.contains(e.target)) {
        setShowYearOptions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showYearOptions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* University */}
        <AutocompleteInput
          value={formData.universityName}
          onChange={(e) => updateForm('universityName', e.target.value)}
          onSelect={(value) => updateForm('universityName', value)}
          suggestions={universitySuggestions}
          placeholder="Enter university name"
          label="University Name"
          required
        />

        {/* Country */}
        <AutocompleteInput
          value={formData.country}
          onChange={(e) => updateForm('country', e.target.value)}
          onSelect={(value) => updateForm('country', value)}
          suggestions={countrySuggestions}
          placeholder="Enter country"
          label="Country"
          required
        />

        {/* Major */}
        <AutocompleteInput
          value={formData.majorName}
          onChange={(e) => updateForm('majorName', e.target.value)}
          onSelect={(value) => updateForm('majorName', value)}
          suggestions={majorSuggestions}
          placeholder="Enter your major"
          label="Major Name"
          required
        />

        {/* Graduation Year */}
        <div className="space-y-2 -mt-1" ref={yearContainerRef}>
          <Label htmlFor="graduationYear">
            Graduation Year <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </Label>
          <div className="relative">
            <button
              id="graduationYear"
              type="button"
              onClick={() => setShowYearOptions(v => !v)}
              className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center justify-between min-h-[42px]"
            >
              <span className={`text-sm ${formData.graduationYear ? 'text-gray-800' : 'text-gray-400'}`}>
                {formData.graduationYear || 'Select graduation year'}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transform transition-transform duration-200 ${
                showYearOptions ? 'rotate-180' : ''
              }`} />
            </button>
            {showYearOptions && (
              <div className="absolute left-0 right-0 z-50 bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                {yearOptions.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { updateForm('graduationYear', y); setShowYearOptions(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latest Degree */}
        <div className="space-y-2 md:col-span-2 relative">
          <label className="block text-sm font-semibold text-gray-700">
            Latest Degree <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <div className="relative">
            <Input
              value={formData.latestDegree ? DEGREE_LABELS[formData.latestDegree] : ''}
              readOnly
              placeholder="Select your highest degree"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
              onClick={() => setShowDegreeOptions(!showDegreeOptions)}
            />
            <button
              type="button"
              onClick={() => setShowDegreeOptions(!showDegreeOptions)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-transform duration-200"
              style={{
                transform: `translateY(-50%) ${showDegreeOptions ? 'rotate(180deg)' : 'rotate(0deg)'}`
              }}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          {showDegreeOptions && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-1">
              <div className="grid grid-cols-2 gap-2 p-2 border border-gray-200 rounded-md bg-white shadow-lg">
                {DEGREE_OPTIONS.map((degree) => (
                  <button
                    key={degree.value}
                    type="button"
                    onClick={() => {
                      updateForm('latestDegree', degree.value);
                      setShowDegreeOptions(false);
                    }}
                    className={`p-2.5 text-sm border rounded-md transition-all duration-200 text-left ${
                      formData.latestDegree === degree.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {degree.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
