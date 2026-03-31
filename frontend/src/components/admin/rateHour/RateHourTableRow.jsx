import React from 'react';
import { Loader2, Save } from 'lucide-react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import { TableCell, TableRow } from '../../ui/Table';
import { formatValue, getComputedNextRate, hasRowChanges } from '../../../utils/rateHour';

function normalizeDisplayValue(value) {
  return String(value || '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function formatEnglishTitle(title) {
  const normalizedTitle = normalizeDisplayValue(title);
  const titleMap = {
    mr: 'Mr.',
    ms: 'Ms.',
    mrs: 'Mrs.',
    dr: 'Dr.',
    prof: 'Prof.',
  };

  return titleMap[normalizedTitle] || String(title || '').trim();
}

function buildDisplayName(title, name, options = {}) {
  const rawTitle = String(title || '').trim();
  const rawName = String(name || '').trim();
  const displayTitle = options.formatTitle ? options.formatTitle(rawTitle) : rawTitle;

  if (!rawTitle) return rawName;
  if (!rawName) return displayTitle;

  const normalizedTitle = normalizeDisplayValue(rawTitle);
  const normalizedName = normalizeDisplayValue(rawName);

  if (normalizedName === normalizedTitle || normalizedName.startsWith(`${normalizedTitle} `)) {
    return rawName;
  }

  return `${displayTitle} ${rawName}`.trim();
}

export default function RateHourTableRow({ row, draft, rateAcademicYears, nextAcademicYear, savingRowId, updateDraftIncreaseRate, updateDraftRemark, handleSaveRow }) {
  const dirty = hasRowChanges(row, draft);
  const computedNextRate = getComputedNextRate(row, draft);
  const englishDisplayName = buildDisplayName(row.lecturer?.englishTitle, row.lecturer?.englishName, {
    formatTitle: formatEnglishTitle,
  });
  const khmerDisplayName = buildDisplayName(row.lecturer?.khmerTitle, row.lecturer?.khmerName);

  return (
    <TableRow className="text-center hover:bg-slate-50/60">
      <TableCell>{englishDisplayName || '—'}</TableCell>
      <TableCell>{khmerDisplayName || '—'}</TableCell>
      <TableCell className="border-r border-slate-200">{row.lecturer?.gender || '—'}</TableCell>

      {rateAcademicYears.map((year, index) => (
        <TableCell key={`${row.lecturerId}-${year}`} className={index === rateAcademicYears.length - 1 ? 'border-r border-slate-200' : ''}>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            {formatValue(row.rates?.[year], 2)}
          </div>
        </TableCell>
      ))}

      <TableCell>{formatValue(row.academicYear?.term1?.hours, 0)}</TableCell>
      <TableCell>{row.academicYear?.term1?.feedback == null ? '—' : `${formatValue(row.academicYear.term1.feedback, 2)}/5`}</TableCell>
      <TableCell>{formatValue(row.academicYear?.term2?.hours, 0)}</TableCell>
      <TableCell>{row.academicYear?.term2?.feedback == null ? '—' : `${formatValue(row.academicYear.term2.feedback, 2)}/5`}</TableCell>
      <TableCell>{formatValue(row.academicYear?.term3?.hours, 0)}</TableCell>
      <TableCell className="border-r border-slate-200">{row.academicYear?.term3?.feedback == null ? '—' : `${formatValue(row.academicYear.term3.feedback, 2)}/5`}</TableCell>

      <TableCell>{formatValue(row.additionalContribution?.capstone1, 0)}</TableCell>
      <TableCell>{formatValue(row.additionalContribution?.capstone2, 0)}</TableCell>
      <TableCell>{formatValue(row.additionalContribution?.internship1, 0)}</TableCell>
      <TableCell className="border-r border-slate-200">{formatValue(row.additionalContribution?.internship2, 0)}</TableCell>

      <TableCell>{row.summary?.totalTerms ?? 0}</TableCell>
      <TableCell>{formatValue(row.summary?.totalHours, 0)}</TableCell>
      <TableCell>{row.summary?.averageFeedback == null ? '—' : `${formatValue(row.summary.averageFeedback, 2)}/5`}</TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={draft.increaseRate || ''}
          onChange={(event) => updateDraftIncreaseRate(row.lecturerId, event.target.value)}
          placeholder="0.00"
          className="text-center"
        />
      </TableCell>
      <TableCell>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          {formatValue(computedNextRate, 2)}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-3 text-center">
          <Textarea
            rows={3}
            value={draft.remark || ''}
            onChange={(event) => updateDraftRemark(row.lecturerId, event.target.value)}
            placeholder="Add remark for the next academic year"
            className="bg-white text-center"
          />
          <Button onClick={() => handleSaveRow(row)} disabled={!dirty || savingRowId === row.lecturerId} className="w-full">
            {savingRowId === row.lecturerId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Row
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}