import { User, Role, UserRole, LecturerProfile } from '../model/index.js';
import { generateToken } from '../config/utils.js';
import {
  EMAIL_DOMAIN,
  PASSWORD_MIN_LENGTH,
  SUPERADMIN_EMAIL,
  SUPERADMIN_DEFAULT_PASSWORD,
  HTTP_STATUS,
  JWT_COOKIE_NAME,
} from '../config/constants.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.toLowerCase().trim();

    if (!email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: 'Email and password required' });
    }
    const emailRegex = new RegExp(`^[a-zA-Z0-9._%+-]+@${EMAIL_DOMAIN.replace('.', '\\.')}$`);
    if (!emailRegex.test(email)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: `Email must be in the format youremail@${EMAIL_DOMAIN}` });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }

    console.log('Login attempt', email);

    // Find user
    let user = await User.findOne({ where: { email } });

    // Bootstrap superadmin if not present
    if (!user && email === SUPERADMIN_EMAIL) {
      if (password !== SUPERADMIN_DEFAULT_PASSWORD) {
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ success: false, message: 'Invalid email or password. Please try again.' });
      }
      const hashed = await bcrypt.hash(password, 10);
      user = await User.create({
        email,
        password_hash: hashed,
        display_name: 'Super Admin',
        status: 'active',
      });
      console.log('Bootstrapped superadmin user id', user.id);
    }

    if (!user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: 'Invalid email or password. Please try again.' });
    }
    // NOTE: Status gating moved after password + role determination to allow first-login activation for lecturers

    // Password verification (supports legacy plaintext -> auto-migrate to bcrypt)
    const stored = (user.password_hash || '').trim(); // mapped column 'password'
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[AUTH] Verifying password for user',
        user.email,
        'storedLen',
        stored.length,
        'isBcrypt',
        stored.startsWith('$2')
      );
    }
    let valid = false;
    if (stored?.startsWith('$2')) {
      // bcrypt hash
      try {
        valid = await bcrypt.compare(password, stored);
      } catch (cmpErr) {
        console.error('bcrypt compare failed', cmpErr.message);
      }
    } else if (stored) {
      // Legacy plaintext password scenario; migrate transparently if matches
      if (password === stored) {
        valid = true;
        try {
          const newHash = await bcrypt.hash(password, 10);
          await user.update({ password_hash: newHash });
          console.log('Migrated plaintext password to bcrypt for user', user.id);
        } catch (mErr) {
          console.warn('Failed to migrate legacy password for user', user.id, mErr.message);
        }
      }
    }
    if (!valid) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AUTH] Invalid credentials for', email, 'storedPrefix', stored.slice(0, 7));
      }
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: 'Invalid email or password. Please try again.' });
    }

    // Determine primary role: query roles via junction
    let roleName = 'lecturer'; // default fallback
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

    let justActivated = false;
    if (user.status !== 'active') {
      if (roleName === 'lecturer') {
        // First successful login for lecturer: activate account & lecturer profile
        try {
          await user.update({ status: 'active', last_login: new Date() });
          const lp = await LecturerProfile.findOne({ where: { user_id: user.id } });
          if (lp && lp.status !== 'active') {
            await lp.update({ status: 'active' });
          }
          justActivated = true;
          console.log(
            `[AUTH] Auto-activated lecturer user ${user.id} (${user.email}) on first login`
          );
        } catch (actErr) {
          console.error('Failed to auto-activate lecturer on first login', actErr.message);
          return res
            .status(HTTP_STATUS.SERVER_ERROR)
            .json({ success: false, message: 'Activation failed' });
        }
      } else {
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ success: false, message: 'Account deactivated' });
      }
    } else {
      await user.update({ last_login: new Date() });
    }

    generateToken(user, res, roleName);
    return res.json({
      success: true,
      justActivated,
      user: {
        id: user.id,
        email: user.email,
        role: roleName,
        fullName: user.display_name || null,
        department: user.department_name || null,
        lastLogin: user.last_login,
        status: user.status,
      },
    });
  } catch (e) {
    console.error('Login error', e.message, e.stack);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: 'Server error' });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie(JWT_COOKIE_NAME, '', { maxAge: 0 });
    res.status(HTTP_STATUS.OK).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Server error' });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = req.cookies?.jwt;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(HTTP_STATUS.OK).json({ authenticated: false });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      return res.status(HTTP_STATUS.OK).json({ authenticated: false });
    }

    const userId = payload.userId || payload.id;
    const user = await User.findByPk(userId);
    if (!user || user.status !== 'active')
      return res.status(HTTP_STATUS.OK).json({ authenticated: false });

    return res.status(HTTP_STATUS.OK).json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: payload.role || (user.email === SUPERADMIN_EMAIL ? 'superadmin' : 'lecturer'),
        createdAt: user.created_at,
        fullName: user.display_name || null,
        department: user.department_name || null,
      },
    });
  } catch (error) {
    console.error('Error in checkAuth controller', error.message);
    return res.status(HTTP_STATUS.OK).json({ authenticated: false });
  }
};

// Allow superadmin to change password later
/* export const changeSuperadminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const email = 'superadmin@cadt.edu.kh';
    let superUser = await User.findOne({ where: { email } });

    if (!superUser) {
      // First-time setup: require default old password
      if (oldPassword !== '12345678') {
        return res.status(401).json({ message: 'Invalid old password' });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      superUser = await User.create({ email, password_hash: hashed });
      return res.status(200).json({ message: 'Password set successfully' });
    }

    if (superUser.status !== 'active') {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    // Verify current password
    const ok = await bcrypt.compare(oldPassword, superUser.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid old password' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await superUser.update({ password_hash: hashed });
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (e) {
    console.error('changeSuperadminPassword error', e);
    return res.status(500).json({ message: 'Server error' });
  }
}; */
