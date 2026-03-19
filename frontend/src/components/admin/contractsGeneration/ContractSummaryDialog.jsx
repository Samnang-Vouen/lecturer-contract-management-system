import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/Dialog';
import Button from '../../ui/Button';
import Select, { SelectItem } from '../../ui/Select';
import Checkbox from '../../ui/Checkbox';
import { getClasses } from '../../../services/class.service';
import {
  getAdvisorContractSummaryPdfBlob,
  getLecturerContractSummaryPdfBlob,
} from '../../../services/contract.service';

const SUMMARY_TYPE_OPTIONS = [
  { value: 'CAPSTONE_1', label: 'Capstone I' },
  { value: 'CAPSTONE_2', label: 'Capstone II' },
  { value: 'INTERNSHIP_1', label: 'Internship I' },
  { value: 'INTERNSHIP_2', label: 'Internship II' },
];

function buildDefaultAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

async function extractErrorMessage(error) {
  const blob = error?.response?.data;
  if (blob instanceof Blob) {
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      return parsed?.message || 'Failed to generate contract summary';
    } catch {
      return 'Failed to generate contract summary';
    }
  }

  return error?.response?.data?.message || error?.message || 'Failed to generate contract summary';
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function ContractSummaryDialog({ open, onOpenChange, currentAcademicYear }) {
  const [academicYear, setAcademicYear] = useState(currentAcademicYear || buildDefaultAcademicYear());
  const [summaryFor, setSummaryFor] = useState('advisor');
  const [selectedType, setSelectedType] = useState('');
  const [className, setClassName] = useState('');
  const [selectedClassNames, setSelectedClassNames] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setAcademicYear(currentAcademicYear || buildDefaultAcademicYear());
    setSummaryFor('advisor');
    setSelectedType('');
    setClassName('');
    setSelectedClassNames([]);
    setError('');
  }, [open, currentAcademicYear]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const fetchAllClasses = async () => {
      setLoadingClasses(true);
      try {
        const collected = [];
        let page = 1;
        let totalPages = 1;

        do {
          const response = await getClasses(page, 50);
          const payload = response?.data || {};
          const rows = Array.isArray(payload.data) ? payload.data : [];
          collected.push(...rows);
          totalPages = Number(payload.totalPages) || 1;
          page += 1;
        } while (page <= totalPages);

        if (active) {
          setClasses(collected);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError?.response?.data?.message || 'Failed to load classes');
        }
      } finally {
        if (active) {
          setLoadingClasses(false);
        }
      }
    };

    void fetchAllClasses();

    return () => {
      active = false;
    };
  }, [open]);

  const academicYearOptions = useMemo(() => {
    const values = new Set(classes.map((item) => item?.academic_year).filter(Boolean));
    values.add(currentAcademicYear || buildDefaultAcademicYear());
    return Array.from(values).sort((left, right) => right.localeCompare(left));
  }, [classes, currentAcademicYear]);

  const classOptions = useMemo(() => {
    const names = classes
      .filter((item) => item?.academic_year === academicYear)
      .map((item) => item?.name)
      .filter(Boolean);
    return Array.from(new Set(names)).sort((left, right) => left.localeCompare(right));
  }, [classes, academicYear]);

  useEffect(() => {
    if (className && !classOptions.includes(className)) {
      setClassName('');
    }
  }, [className, classOptions]);

  useEffect(() => {
    setSelectedClassNames((current) => current.filter((item) => classOptions.includes(item)));
  }, [classOptions]);

  useEffect(() => {
    if (summaryFor === 'lecturer' && selectedType) {
      setSelectedType('');
    }
  }, [summaryFor, selectedType]);

  useEffect(() => {
    if (summaryFor === 'advisor' && selectedClassNames.length) {
      setSelectedClassNames([]);
    }
    if (summaryFor === 'lecturer' && className) {
      setClassName('');
    }
  }, [summaryFor, className, selectedClassNames.length]);

  const requiresType = summaryFor === 'advisor';
  const hasSelectedClasses = requiresType ? !!className : selectedClassNames.length > 0;
  const canGenerate = !!academicYear && !!summaryFor && hasSelectedClasses && (!requiresType || !!selectedType) && !submitting;

  const toggleLecturerClass = (value, checked) => {
    setSelectedClassNames((current) => {
      if (checked) {
        return current.includes(value) ? current : [...current, value];
      }
      return current.filter((item) => item !== value);
    });
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError(
        requiresType
          ? 'Academic Year, Contract Summary for, Type, and Class Name are required'
          : 'Academic Year, Contract Summary for, and Class Name are required'
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const params = {
        academic_year: academicYear,
        class_name: requiresType ? className : selectedClassNames.join(','),
      };

      if (requiresType) {
        params.type = selectedType;
      }

      const blob =
        summaryFor === 'advisor'
          ? await getAdvisorContractSummaryPdfBlob({ ...params, gen: className })
          : await getLecturerContractSummaryPdfBlob(params);

      const typeSegment = requiresType ? `-${selectedType.toLowerCase()}` : '';
      const fileClassSegment = requiresType
        ? className.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
        : selectedClassNames.length === 1
          ? selectedClassNames[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase()
          : `${selectedClassNames.length}-classes`;
      const fileName = `${summaryFor}-contract-summary${typeSegment}-${fileClassSegment}-${academicYear}.pdf`;

      downloadBlob(blob, fileName);
      onOpenChange(false);
    } catch (requestError) {
      setError(await extractErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 my-4 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-gray-200 px-4 pb-4 pt-4 sm:px-6 sm:pt-5">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Contract Summary</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
              Generate a summary PDF filtered by academic year, contract type, and class name.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <label className="text-sm font-medium text-gray-700">Academic Year</label>
                <Select value={academicYear} onValueChange={setAcademicYear} placeholder="Select academic year" oneLine>
                  {academicYearOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <label className="text-sm font-medium text-gray-700">Contract Summary for</label>
                <Select value={summaryFor} onValueChange={setSummaryFor} placeholder="Select summary target" oneLine>
                  <SelectItem value="advisor">Advisor</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                </Select>
              </div>
            </div>

            {requiresType ? (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">Type</div>
                  <p className="text-xs text-gray-500">Choose one contract type.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SUMMARY_TYPE_OPTIONS.map((option) => {
                    const active = selectedType === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                          active
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <Checkbox
                          checked={active}
                          onCheckedChange={(checked) => setSelectedType(checked ? option.value : '')}
                        />
                        <span className="text-sm font-medium text-gray-800">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {requiresType ? 'Class Name' : 'Class Names'}
                </label>
                <p className="text-xs text-gray-500">Classes are filtered by the selected academic year.</p>
              </div>
              {requiresType ? (
                <Select
                  value={className}
                  onValueChange={setClassName}
                  placeholder={loadingClasses ? 'Loading classes...' : 'Select class name'}
                  disabled={loadingClasses || !classOptions.length}
                  oneLine
                >
                  {classOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </Select>
              ) : (
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-end gap-2 border-b border-gray-100 pb-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => setSelectedClassNames(classOptions)}
                      disabled={!classOptions.length}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => setSelectedClassNames([])}
                      disabled={!selectedClassNames.length}
                    >
                      Clear all
                    </Button>
                  </div>

                  <div className="max-h-56 space-y-3 overflow-y-auto">
                    {classOptions.map((option) => {
                      const active = selectedClassNames.includes(option);

                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                            active
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <Checkbox
                            checked={active}
                            onCheckedChange={(checked) => toggleLecturerClass(option, checked)}
                          />
                          <span className="text-sm font-medium text-gray-800">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {!loadingClasses && !classOptions.length ? (
                <p className="text-sm text-amber-700">No classes were found for the selected academic year.</p>
              ) : null}
            </div>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full sm:order-2 sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Generating...' : 'Generate'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="w-full sm:order-1 sm:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}