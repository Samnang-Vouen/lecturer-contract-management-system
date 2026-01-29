export const chartColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  gradient: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']
};

export const statusToUi = (rawStatus) => {
  const st = String(rawStatus || '').toUpperCase();
  switch (st) {
    case 'WAITING_LECTURER':
      return { 
        label: 'Waiting Lecturer', 
        chipClass: 'bg-sky-50 text-sky-700 border border-sky-100', 
        dotClass: 'bg-sky-500' 
      };
    case 'WAITING_MANAGEMENT':
      return { 
        label: 'Waiting Management', 
        chipClass: 'bg-amber-50 text-amber-700 border border-amber-100', 
        dotClass: 'bg-amber-500' 
      };
    case 'MANAGEMENT_SIGNED':
      return { 
        label: 'Waiting Lecturer', 
        chipClass: 'bg-sky-50 text-sky-700 border border-sky-100', 
        dotClass: 'bg-sky-500' 
      };
    case 'LECTURER_SIGNED':
      return { 
        label: 'Waiting Management', 
        chipClass: 'bg-amber-50 text-amber-700 border border-amber-100', 
        dotClass: 'bg-amber-500' 
      };
    case 'COMPLETED':
      return { 
        label: 'Completed', 
        chipClass: 'bg-green-50 text-green-700 border border-green-100', 
        dotClass: 'bg-green-500' 
      };
    default:
      return { 
        label: String(rawStatus || '').replaceAll('_', ' ') || 'Updated', 
        chipClass: 'bg-slate-50 text-slate-700 border border-slate-200', 
        dotClass: 'bg-slate-300' 
      };
  }
};

export const getChangeColor = (c) => 
  c > 0 ? 'text-green-500' : c < 0 ? 'text-red-500' : 'text-gray-500';

export const getSystemHealthColor = (health) => 
  ({ 
    excellent: 'text-green-500', 
    good: 'text-blue-500', 
    warning: 'text-yellow-500', 
    critical: 'text-red-500' 
  }[health] || 'text-gray-500');

export const rangeToMonths = (range) => {
  switch (range) {
    case '7d': return 2;
    case '30d': return 3;
    case '90d': return 6;
    case '1y': return 12;
    default: return 6;
  }
};

export const buildMonthlySeries = (contracts, range) => {
  const monthsCount = rangeToMonths(range);
  const now = new Date();
  const months = [];
  
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ 
      key, 
      label: d.toLocaleString(undefined, { month: 'short' }), 
      submitted: 0, 
      approved: 0, 
      completed: 0, 
      waitingLecturer: 0, 
      waitingManagement: 0 
    });
  }
  
  const idxByKey = Object.fromEntries(months.map((m, i) => [m.key, i]));

  const getKey = (dt) => {
    if (!dt) return null;
    const d = new Date(dt);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  for (const c of (contracts || [])) {
    const kCreated = getKey(c.created_at || c.createdAt);
    if (kCreated && kCreated in idxByKey) months[idxByKey[kCreated]].submitted += 1;

    const kMgmt = getKey(c.management_signed_at || c.managementSignedAt);
    if (kMgmt && kMgmt in idxByKey) months[idxByKey[kMgmt]].approved += 1;

    if ((c.status || '').toUpperCase() === 'COMPLETED') {
      const kComp = getKey(c.management_signed_at || c.managementSignedAt || c.updated_at || c.updatedAt);
      if (kComp && kComp in idxByKey) months[idxByKey[kComp]].completed += 1;
    }
  }

  for (const m of months) {
    m.waitingManagement = Math.max(0, (m.submitted || 0) - (m.approved || 0));
    m.waitingLecturer = Math.max(0, (m.approved || 0) - (m.completed || 0));
  }

  return months.map(m => ({
    month: m.label,
    submitted: m.submitted,
    approved: m.approved,
    completed: m.completed,
    waitingLecturer: m.waitingLecturer,
    waitingManagement: m.waitingManagement
  }));
};

export const buildStatTrends = (monthlyData, totals) => {
  const m = monthlyData || [];

  const randomWalk = (base = 5, len = 10, vol = 3) => {
    const arr = [];
    let v = Math.max(0, Math.round(base));
    for (let i = 0; i < len; i++) {
      const drift = (base - v) * 0.25;
      const step = Math.round((Math.random() * 2 - 1) * vol + drift);
      v = Math.max(0, v + step);
      arr.push(v);
    }
    return arr;
  };

  const seriesBase = (arr, fallback = 5) => {
    const clean = arr.filter(n => Number.isFinite(Number(n))).map(Number);
    if (!clean.length) return fallback;
    const avg = clean.reduce((a, b) => a + b, 0) / clean.length;
    return Math.max(1, Math.round(avg));
  };

  const submittedSeries = m.map(x => Number(x.submitted || 0));
  const approvedSeries = m.map(x => Number(x.approved || 0));
  const completedSeries = m.map(x => Number(x.completed || 0));
  const waitingMgmtSeries = m.map(x => Math.max(0, Number(x.submitted || 0) - Number(x.approved || 0)));

  const fallbackAll = Number(totals?.all || 5);
  const fallbackMgmtSigned = Number(totals?.mgmtSigned || 3);
  const fallbackLecturerSigned = Number(totals?.lecturerSigned || 2);
  const fallbackCompleted = Number(totals?.completed || 1);

  const baseAll = seriesBase(submittedSeries, fallbackAll);
  const baseMgmtSigned = seriesBase(approvedSeries, fallbackMgmtSigned);
  const baseLecturerAwaitingMgmt = seriesBase(waitingMgmtSeries, fallbackLecturerSigned);
  const baseCompleted = seriesBase(completedSeries, fallbackCompleted);

  const volFor = (base) => Math.max(2, Math.round(base * 0.6));

  return {
    all: randomWalk(baseAll, 10, volFor(baseAll)),
    lecturerAwaitingMgmt: randomWalk(baseLecturerAwaitingMgmt, 10, volFor(baseLecturerAwaitingMgmt)),
    mgmtSigned: randomWalk(baseMgmtSigned, 10, volFor(baseMgmtSigned)),
    completed: randomWalk(baseCompleted, 10, volFor(baseCompleted))
  };
};
