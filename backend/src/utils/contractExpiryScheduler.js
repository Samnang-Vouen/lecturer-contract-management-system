import { Op } from 'sequelize';
import { AdvisorContract, TeachingContract } from '../model/index.js';
import { HOUR_MS } from '../config/constants.js';

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Use local calendar date (not UTC) to avoid timezone surprises with DATEONLY.
export function toLocalDateOnly(d = new Date()) {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${year}-${month}-${day}`;
}

export async function expireEndedContracts({ now = new Date(), logger = console } = {}) {
  const today = toLocalDateOnly(now);

  const baseWhere = {
    end_date: { [Op.ne]: null, [Op.lte]: today },
    status: { [Op.ne]: 'CONTRACT_ENDED' },
  };

  const [teachingUpdated, advisorUpdated] = await Promise.all([
    TeachingContract.update(
      { status: 'CONTRACT_ENDED' },
      {
        where: baseWhere,
      }
    ),
    AdvisorContract.update(
      { status: 'CONTRACT_ENDED' },
      {
        where: baseWhere,
      }
    ),
  ]);

  // Sequelize returns [affectedCount] for MySQL, or affectedCount for some dialects.
  const teachingCount = Array.isArray(teachingUpdated) ? teachingUpdated[0] : teachingUpdated;
  const advisorCount = Array.isArray(advisorUpdated) ? advisorUpdated[0] : advisorUpdated;

  if (logger?.info) {
    logger.info(
      `[contract-expiry] ${today}: set CONTRACT ENDED for Teaching_Contracts=${teachingCount}, Advisor_Contracts=${advisorCount}`
    );
  }

  return { today, teachingCount, advisorCount };
}

export function startContractExpiryScheduler({ intervalMs = HOUR_MS, runOnStart = true, logger = console } = {}) {
  let stopped = false;

  const safeRun = async () => {
    try {
      await expireEndedContracts({ logger });
    } catch (e) {
      if (logger?.error) logger.error('[contract-expiry] failed:', e);
    }
  };

  if (runOnStart) {
    // Fire-and-forget; no need to block server startup.
    safeRun();
  }

  const timer = setInterval(() => {
    if (stopped) return;
    safeRun();
  }, Math.max(60_000, Number(intervalMs) || HOUR_MS));

  // Allow process to exit naturally.
  if (typeof timer.unref === 'function') timer.unref();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
