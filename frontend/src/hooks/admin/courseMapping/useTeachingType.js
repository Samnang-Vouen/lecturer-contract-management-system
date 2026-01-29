import { useState } from 'react';

/**
 * Hook to manage teaching type selection logic (Theory/Lab with hours and groups)
 */
export function useTeachingType(initialData = {}) {
  const [theorySelected, setTheorySelected] = useState(initialData.theorySelected || false);
  const [theoryHour, setTheoryHour] = useState(initialData.theoryHour || '');
  const [theoryGroups, setTheoryGroups] = useState(initialData.theoryGroups || '');
  const [theoryCombine, setTheoryCombine] = useState(initialData.theoryCombine || false);
  const [labSelected, setLabSelected] = useState(initialData.labSelected || false);
  const [labGroups, setLabGroups] = useState(initialData.labGroups || '');

  const resetTheory = () => {
    setTheorySelected(false);
    setTheoryHour('');
    setTheoryGroups('');
    setTheoryCombine(false);
  };

  const resetLab = () => {
    setLabSelected(false);
    setLabGroups('');
  };

  const reset = () => {
    resetTheory();
    resetLab();
  };

  const initializeFromMapping = (mapping) => {
    // Determine if theory/lab based on new fields or legacy fallback
    const hasTheory = Number.isFinite(mapping.theory_groups)
      ? mapping.theory_groups > 0
      : /theory|15h/i.test(String(mapping.type_hours || '')) && (mapping.group_count || 0) > 0;

    const hasLab = Number.isFinite(mapping.lab_groups)
      ? mapping.lab_groups > 0
      : /lab|30h/i.test(String(mapping.type_hours || '')) && (mapping.group_count || 0) > 0;

    setTheorySelected(hasTheory);
    setLabSelected(hasLab);

    setTheoryHour(
      mapping.theory_hours || (hasTheory ? (String(mapping.type_hours || '').includes('15h') ? '15h' : '30h') : '')
    );

    setTheoryGroups(
      String(Number.isFinite(mapping.theory_groups) ? mapping.theory_groups : hasTheory ? mapping.group_count || 1 : '')
    );

    setTheoryCombine(!!(mapping.theory_15h_combined ?? mapping.theory_combined ?? mapping.combine_theory_groups));

    setLabGroups(String(Number.isFinite(mapping.lab_groups) ? mapping.lab_groups : hasLab ? mapping.group_count || 1 : ''));
  };

  const buildPayload = () => {
    let thGroups = 0,
      thHours = null,
      lbGroups = 0,
      lbHours = null;

    const thG = parseInt(String(theoryGroups), 10);
    const lbG = parseInt(String(labGroups), 10);
    const thHourValid = theoryHour === '15h' || theoryHour === '30h';

    const theoryEffective = theorySelected && Number.isFinite(thG) && thG >= 1 && thHourValid;
    const labEffective = labSelected && Number.isFinite(lbG) && lbG >= 1;

    if (theoryEffective) {
      thGroups = thG;
      thHours = theoryHour;
    }
    if (labEffective) {
      lbGroups = lbG;
      lbHours = '30h';
    }

    return {
      isValid: theoryEffective || labEffective,
      type_hours: thHours === '15h' ? 'Theory (15h)' : lbHours ? 'Lab (30h)' : 'Theory (15h)',
      group_count: thGroups || lbGroups || 1,
      theory_hours: thHours,
      theory_groups: thGroups,
      theory_15h_combined: thHours === '15h' ? !!theoryCombine : false,
      theory_combined: (thHours === '15h' || thHours === '30h') && thGroups > 1 ? !!theoryCombine : false,
      lab_hours: lbHours,
      lab_groups: lbGroups,
    };
  };

  return {
    theorySelected,
    setTheorySelected,
    theoryHour,
    setTheoryHour,
    theoryGroups,
    setTheoryGroups,
    theoryCombine,
    setTheoryCombine,
    labSelected,
    setLabSelected,
    labGroups,
    setLabGroups,
    reset,
    resetTheory,
    resetLab,
    initializeFromMapping,
    buildPayload,
  };
}
