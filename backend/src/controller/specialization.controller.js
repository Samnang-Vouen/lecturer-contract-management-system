import { sendResponse } from '../utils/response.js';
import { listSpecializationsData } from '../services/specialization.service.js';

const SpecializationController = {
  async list(req, res, next) {
    try {
      const data = await listSpecializationsData({
        role: req.user?.role,
        departmentName: req.user?.department_name,
        query: req.query,
      });
      return sendResponse(res, data);
    } catch (err) {
      return next(err);
    }
  },
};

export default SpecializationController;
