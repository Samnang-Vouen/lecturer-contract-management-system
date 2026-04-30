import { HTTP_STATUS } from '../config/constants.js';
import { sendResponse } from '../utils/response.js';
import { createContractRecord, getContractRecord } from '../services/contracts.service.js';

export async function createContract(req, res, next) {
  try {
    const { lecturerId, items, start_date, end_date, salary } = req.body || {};
    const data = await createContractRecord({
      lecturerId, items, start_date, end_date, salary,
      actorRole: String(req.user?.role || '').toLowerCase(),
      actorDept: req.user?.department_name || null,
      actorId: req.user.id,
    });
    return sendResponse(res, data, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
}

export async function getContractById(req, res, next) {
  try {
    const data = await getContractRecord({
      id: req.params.id,
      actorRole: String(req.user?.role || '').toLowerCase(),
      actorDept: req.user?.department_name || null,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
}
