import bcrypt from 'bcrypt';
import User from '../model/user.model.js';

// Helper to generate a readable name from email prefix if no display_name stored
function fallbackName(email, role) {
  if (!email) return null;
  let base = email.split('@')[0].replace(/[._-]+/g, ' ');
  base = base
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return base || null;
}

// GET /api/profile/me
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({
      id: user.id,
      email: user.email,
      fullName: user.display_name || fallbackName(user.email, req.user.role) || null,
      department: user.department_name || null,
      role: req.user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (e) {
    console.error('getMyProfile error', e.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/profile/activity
export const getMyActivity = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({
      firstAccess: user.created_at,
      lastAccess: user.last_login,
    });
  } catch (e) {
    console.error('getMyActivity error', e.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/profile/change-password
export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ message: 'Account inactive' });

    const stored = (user.password_hash || '').trim();
    let valid = false;
    if (stored.startsWith('$2')) {
      valid = await bcrypt.compare(currentPassword, stored);
    } else if (stored) {
      if (currentPassword === stored) valid = true; // legacy support
    }
    if (!valid) return res.status(401).json({ message: 'Current password incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashed });
    return res.json({ message: 'Password updated successfully' });
  } catch (e) {
    console.error('changeMyPassword error', e.message);
    res.status(500).json({ message: 'Server error' });
  }
};
