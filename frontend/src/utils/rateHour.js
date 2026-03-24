export function getDefaultAcademicYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export function normalizeAcademicYear(value) {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{4}$/.test(raw) ? raw : getDefaultAcademicYear();
}

export function getNextAcademicYear(currentAcademicYear) {
  const normalizedYear = normalizeAcademicYear(currentAcademicYear);
  const startYear = Number.parseInt(normalizedYear.split('-')[0] || '2024', 10);
  return `${startYear + 1}-${startYear + 2}`;
}

export function formatValue(value, digits = 2) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : '—';
}

export function formatRateInput(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function parseNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function sortAcademicYears(years) {
  return [...years].sort((left, right) => {
    const leftStart = Number.parseInt(String(left).split('-')[0] || '0', 10);
    const rightStart = Number.parseInt(String(right).split('-')[0] || '0', 10);
    return leftStart - rightStart;
  });
}

export function buildTrailingAcademicYears(currentAcademicYear, count = 3) {
  const normalizedYear = normalizeAcademicYear(currentAcademicYear);
  const startYear = Number.parseInt(normalizedYear.split('-')[0] || '2024', 10);

  return Array.from({ length: count }, (_, index) => {
    const yearStart = startYear - (count - 1 - index);
    return `${yearStart}-${yearStart + 1}`;
  });
}

export function buildDrafts(rows, rateAcademicYears, nextAcademicYear) {
  return rows.reduce((acc, row) => {
    const rates = {};
    [...rateAcademicYears, nextAcademicYear].forEach((academicYear) => {
      rates[academicYear] = formatRateInput(row.rates?.[academicYear]);
    });

    acc[row.lecturerId] = {
      increaseRate: formatRateInput(row.summary?.increaseRate),
      remark: row.summary?.remark || '',
      rates,
    };
    return acc;
  }, {});
}

export function hasRowChanges(row, draft) {
  if (!draft) return false;
  const original = formatRateInput(row.summary?.increaseRate);
  const rateChanged = String(draft.increaseRate || '') !== original;
  return rateChanged || String(draft.remark || '') !== String(row.summary?.remark || '');
}

export function getComputedNextRate(row, draft) {
  const latestRate = parseNullableNumber(row.summary?.latestRate);
  const increaseRate = parseNullableNumber(draft?.increaseRate);

  if (latestRate === null || increaseRate === null) {
    return row.summary?.nextAcademicYearRate ?? null;
  }

  return latestRate + increaseRate;
}