import { useMemo } from 'react';

function buildPrefixSuggestions(value, options) {
  const query = String(value || '').trim().toLowerCase();
  if (!query) return [];
  return options.filter((option) => option.toLowerCase().startsWith(query)).slice(0, 8);
}

export function useOnboardingDerivedData({ formData, getAvailableCourses, universities, majors }) {
  const availableCourseNames = useMemo(
    () => getAvailableCourses(formData.departments),
    [formData.departments, getAvailableCourses]
  );

  const universitySuggestions = useMemo(
    () => buildPrefixSuggestions(formData.universityName, universities.map((university) => university.name)),
    [formData.universityName, universities]
  );

  const majorSuggestions = useMemo(
    () => buildPrefixSuggestions(formData.majorName, majors.map((major) => major.name)),
    [formData.majorName, majors]
  );

  return { availableCourseNames, universitySuggestions, majorSuggestions };
}