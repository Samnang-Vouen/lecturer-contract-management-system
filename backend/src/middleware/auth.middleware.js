import jwt from 'jsonwebtoken';
import { User } from '../model/index.js';
import { HTTP_STATUS, JWT_COOKIE_NAME } from '../config/constants.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = req.cookies?.jwt;
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authorized' });

  try {
    const { userId, role, id } = jwt.verify(token, process.env.JWT_SECRET);
    const resolvedId = userId || id;
    // Fetch user to ensure still exists & active
    const user = await User.findByPk(resolvedId);
    if (!user) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Account not found' });
    if (user.status !== 'active')
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Account deactivated' });
    // Enrich req.user with commonly needed fields (department for inheritance, display name if needed)
    req.user = {
      id: resolvedId,
      role,
      department_name: user.department_name || null,
      display_name: user.display_name || null,
    };
    next();
  } catch (e) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Invalid token' });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Flatten the array of roles if needed
    const roles = allowedRoles.flat().map((r) => (r || '').toLowerCase());
    const userRole = (req.user.role || '').toLowerCase();

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied',
        requiredRole: roles.join(' or '),
        yourRole: userRole || 'none',
      });
    }
    next();
  };
};

/* Ensures user is active; inactive users blocked on every protected route. */
