import jwt from 'jsonwebtoken';

const FALLBACK_DEV_SECRET = 'dev_fallback_secret_change_me';

export const generateToken = (user, res, roleOverride) => {
  const secret = process.env.JWT_SECRET || FALLBACK_DEV_SECRET;
  if (!process.env.JWT_SECRET) {
    console.warn(
      '[WARN] JWT_SECRET not set. Using insecure fallback. Set JWT_SECRET in .env for production.'
    );
  }
  const role = roleOverride ?? user.role;
  const token = jwt.sign({ userId: user.id, role }, secret, { expiresIn: '7d' });
  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG] Issued JWT for user', user.id, 'role', role);
  }
  return token;
};

//we build to get token from user when use login and after 7d user need to login again
