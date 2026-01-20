// Simple in-memory presence tracker scoped by department
// NOTE: This resets on server restart; good enough for realtime counts.

const TTL_MS = 90 * 1000; // consider online if seen within last 90s

// Map<userId, { dept: string, lastSeen: number }>
const userPresence = new Map();

function cleanup(now = Date.now()) {
  for (const [userId, info] of userPresence.entries()) {
    if (!info || now - (info.lastSeen || 0) > TTL_MS) {
      userPresence.delete(userId);
    }
  }
}

export function touchPresence(userId, department) {
  const now = Date.now();
  if (!userId) return;
  if (typeof department !== 'string' || !department.trim()) return;
  userPresence.set(Number(userId), { dept: department.trim(), lastSeen: now });
  cleanup(now);
}

export function countByDepartment(department) {
  const now = Date.now();
  cleanup(now);
  if (!department) return 0;
  let count = 0;
  for (const [, info] of userPresence.entries()) {
    if (info && info.dept === department && now - info.lastSeen <= TTL_MS) count++;
  }
  return count;
}

export function countByDepartments(departments) {
  const now = Date.now();
  cleanup(now);
  if (!Array.isArray(departments) || departments.length === 0) return 0;
  let count = 0;
  for (const [, info] of userPresence.entries()) {
    if (!info) continue;
    if (now - info.lastSeen > TTL_MS) continue;
    if (departments.includes(info.dept)) count++;
  }
  return count;
}

export function countAllOnline() {
  const now = Date.now();
  cleanup(now);
  let count = 0;
  for (const [, info] of userPresence.entries()) {
    if (info && now - info.lastSeen <= TTL_MS) count++;
  }
  return count;
}

export default {
  touchPresence,
  countByDepartment,
  countByDepartments,
  countAllOnline,
};
