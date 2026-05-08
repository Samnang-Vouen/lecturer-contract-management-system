import { generateToken } from '../config/utils.js';
import { JWT_COOKIE_NAME } from '../config/constants.js';
import { sendResponse } from '../utils/response.js';
import {
  loginUser,
  verifyAuthToken,
  forgotPasswordRequest,
  resetUserPassword,
} from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, roleName, justActivated } = await loginUser({ email, password });
    generateToken(user, res, roleName);
    return sendResponse(res, {
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
  } catch (err) {
    return next(err);
  }
};

export const logout = (req, res) => {
  res.cookie(JWT_COOKIE_NAME, '', { maxAge: 0 });
  return sendResponse(res, { message: 'Logged out successfully' });
};

export const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = req.cookies?.jwt;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    const result = await verifyAuthToken(token);
    return sendResponse(res, result);
  } catch (err) {
    return next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const rawEmail = req.validated?.body?.email || req.body?.email;
    const message = await forgotPasswordRequest({ email: rawEmail });
    return sendResponse(res, { message });
  } catch (err) {
    return next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.validated?.body || req.body;
    await resetUserPassword({ token, newPassword });
    return sendResponse(res, { message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    return next(err);
  }
};