import { CheckCircle, XCircle, MessageCircle, Clock, AlertCircle } from 'lucide-react';

export const normalizePhone = (val) => String(val || '').trim().replace(/[()\s-]/g, '');

export const isE164 = (val) => /^\+\d{8,15}$/.test(normalizePhone(val));

export const hasAtSign = (val) => String(val || '').trim().includes('@');

export const PHNOM_PENH_TZ = 'Asia/Phnom_Penh';

// Keep only letters (any language), spaces, and common name punctuation.
export const sanitizeTextOnly = (val) =>
  String(val || '')
    .replace(/[^\p{L}\s.'-]/gu, '')
    .replace(/\s+/g, ' ');

// Convert a stored date/time string into a datetime-local value (YYYY-MM-DDTHH:mm)
// formatted in Phnom Penh time.
export const toPhnomPenhDateTimeLocal = (val) => {
  const s = String(val || '').trim();
  if (!s) return '';

  // If it's already a plain datetime-local string, treat it as Phnom Penh time
  // by attaching a fixed +07:00 offset for parsing.
  const looksLikeLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);
  const parseable = looksLikeLocal ? `${s}:00+07:00` : s;

  const d = new Date(parseable);
  if (Number.isNaN(d.getTime())) return looksLikeLocal ? s : '';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PHNOM_PENH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
};

// Convert a datetime-local value into an ISO-ish string pinned to Phnom Penh (+07:00).
export const fromDateTimeLocalToPhnomPenhISO = (localVal) => {
  const s = String(localVal || '').trim();
  if (!s) return '';
  // Cambodia has no DST; +07:00 is stable.
  return `${s}:00+07:00`;
};

// Formats phone input for display while typing (defaults to Cambodia +855 grouping)
// Keeps E.164 validation compatible via normalizePhone/isE164.
export const formatPhoneInput = (input) => {
  const raw = String(input || '');
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = (hasPlus ? trimmed.slice(1) : trimmed).replace(/\D/g, '');

  if (!hasPlus) {
    // If user hasn't typed '+', keep digits only (no forced '+')
    return digits;
  }

  if (!digits) return '+';

  // Cambodia default formatting: +855 xxx xxx xxx
  if (digits.startsWith('855')) {
    const rest = digits.slice(3);
    const groups = rest.match(/.{1,3}/g) || [];
    return `+855${groups.length ? ` ${groups.join(' ')}` : ''}`;
  }

  // Generic fallback: +CCC xxx xxx ... (best-effort)
  const cc = digits.slice(0, 3);
  const rest = digits.slice(3);
  const groups = rest.match(/.{1,3}/g) || [];
  return `+${cc}${groups.length ? ` ${groups.join(' ')}` : ''}`;
};

export const formatFullNameInput = (input) => {
  const raw = String(input || '');
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  // If Khmer characters are present, don't case-transform
  if (/[\u1780-\u17FF]/.test(trimmed)) return trimmed;

  const titleCaseToken = (token) => {
    if (!token) return token;
    return token
      .split('-')
      .map((part) =>
        part
          .split("'")
          .map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p))
          .join("'")
      )
      .join('-');
  };

  return trimmed
    .split(' ')
    .map(titleCaseToken)
    .join(' ');
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'discussion': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'interview': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusIconComponent = (status) => {
  switch (status) {
    case 'accepted': return CheckCircle;
    case 'rejected': return XCircle;
    case 'discussion': return MessageCircle;
    case 'interview': return Clock;
    case 'pending': return Clock;
    default: return AlertCircle;
  }
};

export const ratingColorClass = (val) => {
  if (val >= 4) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (val >= 2.5) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (val > 0) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
