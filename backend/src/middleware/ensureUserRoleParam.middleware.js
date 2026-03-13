import { Role, User } from '../model/index.js';

/**
 * Ensures req.params[param] is a valid User.id that has the required role.
 * Returns 404 if the user does not exist or does not have the role.
 */
export const ensureUserHasRoleParam = (requiredRole, options = {}) => {
  const { param = 'id' } = options;
  const roleLc = String(requiredRole || '').trim().toLowerCase();

  return async (req, res, next) => {
    try {
      const userId = parseInt(req.params?.[param], 10);
      if (!userId) return res.status(400).json({ message: 'Invalid id' });

      const user = await User.findByPk(userId, {
        attributes: ['id'],
        include: [
          {
            model: Role,
            as: 'Roles',
            attributes: ['role_type'],
            through: { attributes: [] },
            required: false,
          },
        ],
      });

      const roles = Array.isArray(user?.Roles)
        ? user.Roles.map((r) => String(r?.role_type || '').toLowerCase()).filter(Boolean)
        : [];

      if (!user || !roles.includes(roleLc)) {
        // 404 to avoid leaking whether the user exists under a different role.
        return res.status(404).json({ message: 'Not found' });
      }

      next();
    } catch (e) {
      console.error('[ensureUserHasRoleParam] error', e);
      return res.status(500).json({ message: 'Role check failed' });
    }
  };
};
