// Map backend statuses to user-friendly labels and UI classes
export const statusToUi = (rawStatus) => {
  const st = String(rawStatus || '').toUpperCase();
  switch (st) {
    case 'WAITING_LECTURER':
      return { label: 'Waiting Lecturer', chipClass: 'bg-sky-50 text-sky-700 border border-sky-100', dotClass: 'bg-sky-500' };
    case 'WAITING_MANAGEMENT':
    case 'LECTURER_SIGNED':
      return { label: 'Waiting Management', chipClass: 'bg-amber-50 text-amber-700 border border-amber-100', dotClass: 'bg-amber-500' };
    case 'MANAGEMENT_SIGNED':
      return { label: 'Waiting Lecturer', chipClass: 'bg-sky-50 text-sky-700 border border-sky-100', dotClass: 'bg-sky-500' };
    case 'COMPLETED':
      return { label: 'Completed', chipClass: 'bg-green-50 text-green-700 border border-green-100', dotClass: 'bg-green-500' };
    default:
      return { label: String(rawStatus || '').replaceAll('_', ' ') || 'Updated', chipClass: 'bg-slate-50 text-slate-700 border border-slate-200', dotClass: 'bg-slate-300' };
  }
};

// Format hours text: remove any multiplier like "× 2" while keeping the hours info
export const formatHoursText = (text) => {
  if (!text || typeof text !== 'string') return '—';
  const cleaned = text.replace(/×\s*\d+/g, '').replace(/\s{2,}/g, ' ').trim();
  return cleaned || '—';
};

// Parse hours text into separate parts (Theory Xh, Lab Yh) after cleaning
export const parseHoursParts = (text) => {
  const cleaned = formatHoursText(text);
  if (cleaned === '—') return { theory: null, lab: null, raw: cleaned };
  const theoryMatch = cleaned.match(/(Theory|Lecture)\s*\d+\s*h/i);
  const labMatch = cleaned.match(/Lab\s*\d+\s*h/i);
  const theory = theoryMatch ? theoryMatch[0].replace(/\s+/g, ' ').trim() : null;
  const lab = labMatch ? labMatch[0].replace(/\s+/g, ' ').trim() : null;
  return { theory, lab, raw: cleaned };
};

// Compute total hours for the contract using mapping fields
export const computeTotalHours = (m) => {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const theoryH = num(m?.theory_hours);
  const labH = num(m?.lab_hours);
  const theoryGroups = num(m?.theory_groups) ?? 0;
  const labGroups = num(m?.lab_groups) ?? 0;
  const isCombined15h = Boolean(m?.theory_15h_combined);

  let theoryTotal = null;
  if (theoryH !== null) {
    if (isCombined15h && theoryH === 15 && (theoryGroups ?? 0) >= 2) {
      theoryTotal = 15;
    } else {
      const factor = theoryGroups && theoryGroups > 0 ? theoryGroups : 1;
      theoryTotal = theoryH * factor;
    }
  }

  let labTotal = null;
  if (labH !== null) {
    const factor = labGroups && labGroups > 0 ? labGroups : 1;
    labTotal = labH * factor;
  }

  // Fallback: if we don't have numeric fields, try parsing text
  if (theoryTotal === null || labTotal === null) {
    const text = String(m?.hours_text || '').trim();
    if (text) {
      const theoryMatch = text.match(/(Theory|Lecture)\s*(\d+)/i);
      const labMatch = text.match(/Lab\s*(\d+)/i);
      if (theoryTotal === null && theoryMatch) {
        const th = Number(theoryMatch[2]);
        const tg = Number(m?.theory_groups) || 1;
        theoryTotal = Number.isFinite(th) ? th * tg : null;
      }
      if (labTotal === null && labMatch) {
        const lh = Number(labMatch[1]);
        const lg = Number(m?.lab_groups) || 1;
        labTotal = Number.isFinite(lh) ? lh * lg : null;
      }
    }
  }

  return { theoryTotal, labTotal };
};

// Pretty-print helpers for table values
export const formatTerm = (t) => {
  if (!t) return '-';
  const s = String(t);
  return /^term\s*/i.test(s) ? s : `Term ${s}`;
};

export const formatYearLevel = (y) => {
  if (y === null || y === undefined || y === '') return '-';
  return String(y).toLowerCase().startsWith('year') ? String(y) : `Year ${y}`;
};

export const generateTrend = (base, vol = 4, len = 10) =>
  Array.from({ length: len }, () => Math.max(1, Math.round(base + (Math.random() * vol * 2 - vol))));

export const getChangeColor = (c) => c > 0 ? 'text-green-500' : c < 0 ? 'text-red-500' : 'text-gray-500';

export const getSystemHealthColor = (h) => h === 'excellent' ? 'text-green-500' : h === 'good' ? 'text-blue-500' : h === 'warning' ? 'text-yellow-500' : 'text-red-500';
