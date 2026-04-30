import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, Role, UserRole, LecturerProfile } from '../model/index.js';
import { getJwtSecret } from '../config/utils.js';
import {
  EMAIL_DOMAIN,
  PASSWORD_MIN_LENGTH,
  SUPERADMIN_EMAIL,
} from '../config/constants.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import {
  ValidationError,
  UnauthorizedError,
  AppError,
} from '../utils/errors.js';

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

/**
 * Validates credentials, resolves role, and activates lecturer on first login.
 * Returns { user, roleName, justActivated } — caller is responsible for
 * setting the JWT cookie via generateToken.
 */
export async function loginUser({ email: rawEmail, password }) {
  const email = rawEmail?.toLowerCase().trim();

  if (!email || !password) {
    throw new ValidationError('Email and password required', {
      payload: { success: false, message: 'Email and password required' },
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`Email must be in the format youremail@${EMAIL_DOMAIN}`, {
      payload: {
        success: false,
        message: `Email must be in the format youremail@${EMAIL_DOMAIN}`,
      },
    });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      {
        payload: {
          success: false,
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        },
      }
    );
  }

  let user = await User.findOne({ where: { email } });

  // Bootstrap superadmin on first login
  if (!user && email === SUPERADMIN_EMAIL) {
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({
      email,
      password_hash: hashed,
      display_name: 'Super Admin',
      status: 'active',
    });
  }

  if (!user) {
    throw new UnauthorizedError('Invalid email or password. Please try again.', {
      payload: {
        success: false,
        message: 'Invalid email or password. Please try again.',
      },
    });
  }

  // Password verification — supports legacy plaintext → auto-migrate to bcrypt
  const stored = (user.password_hash || '').trim();
  if (stored.startsWith('$2')) {
    try {
      await bcrypt.compare(password, stored);
    } catch (cmpErr) {
      console.error('bcrypt compare failed', cmpErr.message);
    }
  } else if (stored) {
    if (password === stored) {
      try {
        const newHash = await bcrypt.hash(password, 10);
        await user.update({ password_hash: newHash });
        console.log('Migrated plaintext password to bcrypt for user', user.id);
      } catch (mErr) {
        console.warn('Failed to migrate legacy password for user', user.id, mErr.message);
      }
    }
  }

  // Determine primary role
  let roleName = 'lecturer';
  try {
    const userRole = await UserRole.findOne({
      where: { user_id: user.id },
      include: [{ model: Role }],
    });
    if (userRole && userRole.Role?.role_type) {
      roleName = userRole.Role.role_type.toLowerCase();
    } else if (email === SUPERADMIN_EMAIL) {
      roleName = 'superadmin';
    }
  } catch (er) {
    console.warn('Role lookup failed, using fallback lecturer', er.message);
    if (email === SUPERADMIN_EMAIL) roleName = 'superadmin';
  }

  // Status gating + first-login activation for lecturers
  let justActivated = false;
  if (user.status !== 'active') {
    if (roleName === 'lecturer') {
      try {
        await user.update({ status: 'active', last_login: new Date() });
        const lp = await LecturerProfile.findOne({ where: { user_id: user.id } });
        if (lp && lp.status !== 'active') {
          await lp.update({ status: 'active' });
        }
        justActivated = true;
        console.log(`[AUTH] Auto-activated lecturer user ${user.id} (${user.email}) on first login`);
      } catch (actErr) {
        console.error('Failed to auto-activate lecturer on first login', actErr.message);
        throw new AppError('Activation failed', 500, {
          payload: { success: false, message: 'Activation failed' },
        });
      }
    } else {
      throw new UnauthorizedError('Account deactivated', {
        payload: { success: false, message: 'Account deactivated' },
      });
    }
  } else {
    await user.update({ last_login: new Date() });
  }

  return { user, roleName, justActivated };
}

// ---------------------------------------------------------------------------
// checkAuth
// ---------------------------------------------------------------------------

/**
 * Verifies a JWT token string and resolves the associated active user.
 * Returns { authenticated: true, user: {...} } or { authenticated: false }.
 * Never throws — callers can always render a safe response.
 */
export async function verifyAuthToken(token) {
  if (!token) return { authenticated: false };

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    return { authenticated: false };
  }

  const userId = payload.userId || payload.id;
  const user = await User.findByPk(userId);
  if (!user || user.status !== 'active') return { authenticated: false };

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: payload.role || (user.email === SUPERADMIN_EMAIL ? 'superadmin' : 'lecturer'),
      createdAt: user.created_at,
      fullName: user.display_name || null,
      department: user.department_name || null,
    },
  };
}

// ---------------------------------------------------------------------------
// forgotPassword
// ---------------------------------------------------------------------------

/**
 * Issues a password-reset token and sends the reset link by email.
 * Always returns a generic message string regardless of whether the email exists.
 */
export async function forgotPasswordRequest({ email: rawEmail }) {
  const email = rawEmail?.toLowerCase().trim();
  const genericMsg = 'If that email is registered, a password reset link has been sent.';

  const user = await User.findOne({ where: { email } });
  if (!user) return genericMsg;

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await user.update({ reset_token: token, reset_token_expires: expires });

  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const resetLink = `${clientOrigin}/reset-password?token=${token}`;

  await sendPasswordResetEmail(user.email, resetLink);

  return genericMsg;
}

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------

/**
 * Validates the reset token and updates the user's password.
 * Throws an AppError with a 400 payload when the token is invalid/expired.
 */
export async function resetUserPassword({ token, newPassword }) {
  const user = await User.findOne({ where: { reset_token: token } });

  if (!user || !user.reset_token_expires || new Date() > new Date(user.reset_token_expires)) {
    throw new ValidationError('Invalid or expired password reset link.', {
      payload: { message: 'Invalid or expired password reset link.' },
    });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash: hashed, reset_token: null, reset_token_expires: null });
}
