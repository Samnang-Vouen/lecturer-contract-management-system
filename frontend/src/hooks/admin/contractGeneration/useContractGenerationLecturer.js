import { useCallback, useMemo, useState } from 'react';
import { getLecturerDetail } from '../../../services/lecturer.service';
import { normId } from '../../../utils/contractHelpers';
import {
  buildLecturerSelectedCoursesPayload,
  dedupeByKey,
  mappingNaturalKey,
  parseRateOrNull,
} from './contractGenerationDialog.helpers';

export function useContractGenerationLecturer({ mappings, mappingUserId, resolveLecturerUserId, onCreate, onOpenChange }) {
  const [dlgLecturerKey, setDlgLecturerKey] = useState('');
  const [dlgLecturerId, setDlgLecturerId] = useState('');
  const [dlgHourlyRate, setDlgHourlyRate] = useState('');
  const [dlgStartDate, setDlgStartDate] = useState('');
  const [dlgEndDate, setDlgEndDate] = useState('');
  const [dlgItemInput, setDlgItemInput] = useState('');
  const [dlgItems, setDlgItems] = useState([]);
  const [dlgEditingItemIdx, setDlgEditingItemIdx] = useState(null);
  const [dlgEditingItemValue, setDlgEditingItemValue] = useState('');
  const [dlgErrors, setDlgErrors] = useState({});
  const [dlgSelectedMappingIds, setDlgSelectedMappingIds] = useState(new Set());
  const [dlgCourseQuery, setDlgCourseQuery] = useState('');
  const [dlgCombineByMapping, setDlgCombineByMapping] = useState({});

  const resetLecturerForm = useCallback(() => {
    setDlgLecturerKey('');
    setDlgLecturerId('');
    setDlgHourlyRate('');
    setDlgStartDate('');
    setDlgEndDate('');
    setDlgItemInput('');
    setDlgItems([]);
    setDlgEditingItemIdx(null);
    setDlgEditingItemValue('');
    setDlgErrors({});
    setDlgSelectedMappingIds(new Set());
    setDlgCourseQuery('');
    setDlgCombineByMapping({});
  }, []);

  const dlgFilteredMappings = useMemo(() => {
    const query = String(dlgCourseQuery || '').toLowerCase();
    const filtered = (mappings || []).filter((mapping) => {
      if (String(mapping.status || '').toLowerCase() !== 'accepted') return false;
      if (dlgLecturerKey) {
        const key = String(dlgLecturerKey);
        if (key.startsWith('profile:')) {
          const selectedProfileId = normId(key.slice('profile:'.length));
          const mappingProfileId = normId(mapping?.lecturer_profile_id ?? mapping?.lecturer?.id);
          if (selectedProfileId && mappingProfileId && selectedProfileId !== mappingProfileId) return false;
        } else if (normId(key) !== mappingUserId(mapping)) {
          return false;
        }
      }
      if (!query) return true;
      const courseName = mapping.course?.name?.toLowerCase() || '';
      const courseCode = mapping.course?.code?.toLowerCase() || '';
      const className = mapping.class?.name?.toLowerCase() || '';
      const meta = `${mapping.term || ''} ${mapping.year_level || ''}`.toLowerCase();
      return courseName.includes(query) || courseCode.includes(query) || className.includes(query) || meta.includes(query);
    });
    return dedupeByKey(filtered, mappingNaturalKey);
  }, [mappings, dlgCourseQuery, dlgLecturerKey, mappingUserId]);

  const handleLecturerChange = async (value) => {
    setDlgLecturerKey(value);
    const resolvedUserId = resolveLecturerUserId ? resolveLecturerUserId(value) : normId(value);
    setDlgLecturerId(resolvedUserId || '');
    setDlgErrors((prev) => ({ ...prev, lecturer: '' }));
    setDlgSelectedMappingIds(new Set());
    setDlgCombineByMapping({});
    try {
      if (!resolvedUserId) throw new Error('Lecturer user id not resolved');
      const body = await getLecturerDetail(resolvedUserId);
      setDlgHourlyRate(body?.hourlyRateThisYear || '');
    } catch {
      setDlgHourlyRate('');
    }
  };

  const handleCreateLecturer = async () => {
    const nextErrors = {};
    const today = new Date();
    const startDate = dlgStartDate ? new Date(dlgStartDate) : null;
    const endDate = dlgEndDate ? new Date(dlgEndDate) : null;
    today.setHours(0, 0, 0, 0);
    if (!dlgLecturerKey) nextErrors.lecturer = 'Lecturer is required';
    else if (!dlgLecturerId) nextErrors.lecturer = 'Lecturer is still loading. Please wait a moment and try again.';
    if (!startDate) nextErrors.startDate = 'Start Date is required';
    else if (startDate < today) nextErrors.startDate = 'Start Date cannot be in the past';
    if (!endDate) nextErrors.endDate = 'End Date is required';
    else if (startDate && endDate <= startDate) nextErrors.endDate = 'End Date must be after Start Date';
    if (!dlgItems.length) nextErrors.description = 'Please add at least one duty';

    const selectedMappings = dedupeByKey((mappings || []).filter((mapping) => dlgSelectedMappingIds.has(mapping.id)), mappingNaturalKey);
    if (!selectedMappings.length) nextErrors.courses = 'Please select at least one course to include in this contract.';
    setDlgErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await onCreate({
        lecturerId: dlgLecturerId,
        courses: buildLecturerSelectedCoursesPayload({ mappings: selectedMappings, dlgSelectedMappingIds, dlgCombineByMapping }),
        start_date: dlgStartDate,
        end_date: dlgEndDate,
        items: dlgItems,
        hourly_rate: parseRateOrNull(dlgHourlyRate),
      });
      resetLecturerForm();
      onOpenChange(false);
    } catch (error) {
      const response = error?.response;
      const backendErrors = response?.data?.errors;
      const fallbackMessage = response?.data?.message || 'Failed to create contract';
      const next = {};
      console.error('Create contract failed:', error);
      console.error('Response data:', response?.data);
      console.error('Backend errors:', backendErrors);
      if (Array.isArray(backendErrors)) {
        const text = backendErrors.join(', ');
        if (/lecturer_user_id/i.test(text)) next.lecturer = 'Lecturer is required';
        if (/course/i.test(text)) next.courses = 'Please select at least one valid course';
        if (/term/i.test(text)) next.term = 'Term is required';
        if (!Object.keys(next).length) next.form = text;
      } else {
        next.form = fallbackMessage;
      }
      setDlgErrors(next);
    }
  };

  return {
    dlgLecturerKey,
    setDlgLecturerKey,
    dlgLecturerId,
    setDlgLecturerId,
    dlgHourlyRate,
    setDlgHourlyRate,
    dlgStartDate,
    setDlgStartDate,
    dlgEndDate,
    setDlgEndDate,
    dlgItemInput,
    setDlgItemInput,
    dlgItems,
    setDlgItems,
    dlgEditingItemIdx,
    setDlgEditingItemIdx,
    dlgEditingItemValue,
    setDlgEditingItemValue,
    dlgErrors,
    setDlgErrors,
    dlgSelectedMappingIds,
    setDlgSelectedMappingIds,
    dlgCourseQuery,
    setDlgCourseQuery,
    dlgCombineByMapping,
    setDlgCombineByMapping,
    dlgFilteredMappings,
    handleLecturerChange,
    handleCreateLecturer,
    resetLecturerForm,
  };
}