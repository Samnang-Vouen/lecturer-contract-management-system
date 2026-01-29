import { chartColors, THIRTY_DAYS_MS } from './lecturerDashboard.constants';
import { statusToUi, generateTrend } from './lecturerDashboard.utils';

export const processCourses = (coursesRes) => {
  const arr = Array.isArray(coursesRes.value) 
    ? coursesRes.value 
    : (Array.isArray(coursesRes.value?.data) ? coursesRes.value.data : []);
  
  const assignedCourses = {
    count: arr.length,
    change: Math.floor(Math.random() * 6) - 2,
    trend: generateTrend(arr.length || 3, 3)
  };

  // Build Course Hours Distribution
  let courseHoursDist = [];
  try {
    const byCourse = new Map();
    for (const row of arr) {
      const name = row.course_name || 'Unknown';
      const hours = Number(row.hours) || 0;
      if (!hours) continue;
      byCourse.set(name, (byCourse.get(name) || 0) + hours);
    }
    const palette = [
      chartColors.success, chartColors.primary, chartColors.secondary, 
      chartColors.warning, chartColors.error, chartColors.info, chartColors.purple
    ];
    courseHoursDist = Array.from(byCourse.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: palette[idx % palette.length]
    }));
  } catch {
    courseHoursDist = [];
  }

  return { assignedCourses, courseHoursDist };
};

export const processContracts = (contractsRes, lastViewedAtRef, showNotificationsRef) => {
  const list = Array.isArray(contractsRes.value?.data)
    ? contractsRes.value.data
    : (Array.isArray(contractsRes.value) ? contractsRes.value : []);

  const since = Date.now() - THIRTY_DAYS_MS;
  const notifications = (list || [])
    .map((c) => {
      const d = new Date(c.updated_at || c.updatedAt || c.created_at || c.createdAt || Date.now());
      const ts = d.getTime();
      const ui = statusToUi(c.status);
      return {
        message: `Contract #${c.id} ${ui.label}.`,
        time: d.toLocaleString(),
        ts
      };
    })
    .filter(n => (n.ts || 0) >= since)
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));

  const sinceViewed = lastViewedAtRef.current || 0;
  const unreadCount = showNotificationsRef.current 
    ? 0 
    : notifications.filter(n => (n.ts || 0) > sinceViewed).length;

  return { notifications, unreadCount };
};

export const processDashboardSummary = (lecturerDashRes) => {
  const d = lecturerDashRes.value || {};
  return {
    totalContracts: { 
      count: d.totalContracts || 0, 
      change: 0, 
      trend: generateTrend(Math.max(1, d.totalContracts || 1), 3) 
    },
    signedContracts: { 
      count: d.signedContracts || 0, 
      change: 0, 
      trend: generateTrend(Math.max(1, d.signedContracts || 1), 3) 
    },
    pendingSignatures: { 
      count: d.pendingSignatures || 0, 
      change: 0, 
      trend: generateTrend(Math.max(1, d.pendingSignatures || 1), 3) 
    },
    waitingManagement: { 
      count: d.waitingManagement || 0, 
      change: 0, 
      trend: generateTrend(Math.max(1, d.waitingManagement || 1), 3) 
    },
    syllabusReminder: d.syllabusReminder || { needed: false, uploaded: true, message: '' }
  };
};
