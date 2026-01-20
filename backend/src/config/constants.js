// Centralized constants to avoid magic numbers and hardcoded strings
// Adjust via env vars where possible; defaults are safe for development.

export const PASSWORD_MIN_LENGTH = Number(process.env.PASSWORD_MIN_LENGTH || 6);
export const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'cadt.edu.kh';
export const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || `superadmin@${EMAIL_DOMAIN}`;
export const SUPERADMIN_DEFAULT_PASSWORD = process.env.SUPERADMIN_DEFAULT_PASSWORD || '12345678';

export const CORS_ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'jwt';
export const PAGINATION_DEFAULT_LIMIT = Number(process.env.PAGINATION_DEFAULT_LIMIT || 10);
export const PAGINATION_MAX_LIMIT = Number(process.env.PAGINATION_MAX_LIMIT || 100);
// Time constants (ms)
export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
// Dashboard slice limits
export const DASHBOARD_RECENT_USERS_LIMIT = Number(process.env.DASHBOARD_RECENT_USERS_LIMIT || 2);
export const DASHBOARD_RECENT_ADMIN_LOGINS_LIMIT = Number(
  process.env.DASHBOARD_RECENT_ADMIN_LOGINS_LIMIT || 2
);
export const DASHBOARD_RECENT_CONTRACTS_LIMIT = Number(
  process.env.DASHBOARD_RECENT_CONTRACTS_LIMIT || 2
);
export const DASHBOARD_RECENT_CANDIDATES_LIMIT = Number(
  process.env.DASHBOARD_RECENT_CANDIDATES_LIMIT || 1
);
export const DASHBOARD_ACTIVITIES_SLICE_LIMIT = Number(
  process.env.DASHBOARD_ACTIVITIES_SLICE_LIMIT || 5
);
export const DASHBOARD_MONTH_WINDOW = Number(process.env.DASHBOARD_MONTH_WINDOW || 6);
// Candidate statuses considered "in progress" for recruitment
export const CANDIDATE_ACTIVE_STATUSES = Object.freeze(['pending', 'interview', 'discussion']);
// Aliases for legacy/new contract statuses to normalized values
export const CONTRACT_STATUS_ALIAS_MAP = Object.freeze({
  DRAFT: 'WAITING_LECTURER',
  MANAGEMENT_SIGNED: 'WAITING_LECTURER',
  LECTURER_SIGNED: 'WAITING_MANAGEMENT',
});

// Allowed contract statuses for updates
export const CONTRACT_ALLOWED_STATUSES = Object.freeze([
  'WAITING_LECTURER',
  'WAITING_MANAGEMENT',
  'COMPLETED',
]);

// HTTP status codes for readability
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY: 429,
  SERVER_ERROR: 500,
});
// Time range shortcuts (dashboard queries)
export const TIME_RANGE_LABELS = Object.freeze({
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
  '90d': 90 * DAY_MS,
  '1y': 365 * DAY_MS,
});
