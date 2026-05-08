import { sendResponse } from '../utils/response.js';
import { getMyNotificationsData, markNotificationsReadData } from '../services/notification.service.js';

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

export const markNotificationsRead = async (req, res, next) => {
  try {
    await markNotificationsReadData({ userId: req.user.id, ids: req.body.ids });
    return sendResponse(res, { message: 'Notifications marked as read' });
  } catch (err) {
    return next(err);
  }
};
