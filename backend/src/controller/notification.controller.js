import { sendResponse } from '../utils/response.js';
import { getMyNotificationsData } from '../services/notification.service.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const data = await getMyNotificationsData({
      userId: req.user.id,
      role: req.user?.role,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
